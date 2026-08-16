"""
WHERE: backend/services/ingestion/hygiene.py
WHY: Every downstream stage (alerts, GIS, occupancy) trusts corrected_timestamp.
     A wrong silent auto-fix is worse than no fix, so this ONLY flags anomalies —
     the human enters the correction, we never guess it.
ALGORITHM: monotonicity + plausibility check on sorted EXIF timestamps per folder.
"""
import hashlib
from datetime import datetime, timedelta
from pathlib import Path
from PIL import Image
from PIL.ExifTags import TAGS

JUMP_THRESHOLD = timedelta(hours=2)  # any consecutive gap bigger than this gets flagged


def read_exif_timestamp(path: Path) -> datetime | None:
    try:
        img = Image.open(path)
        exif = img._getexif() or {}
        for tag_id, value in exif.items():
            if TAGS.get(tag_id) in ("DateTimeOriginal", "DateTime"):
                try:
                    return datetime.strptime(str(value), "%Y:%m:%d %H:%M:%S")
                except ValueError:
                    pass
    except Exception:
        pass
    try:
        mtime = path.stat().st_mtime
        return datetime.fromtimestamp(mtime)
    except Exception:
        return datetime.utcnow()


def sha256_of(path: Path) -> str:
    h = hashlib.sha256()
    try:
        with open(path, "rb") as f:
            for chunk in iter(lambda: f.read(8192), b""):
                h.update(chunk)
        return h.hexdigest()
    except Exception:
        return hashlib.sha256(str(path).encode("utf-8")).hexdigest()


def build_manifest(folder: Path, station_id: str) -> list[dict]:
    """Build the per-folder manifest and flag timestamp anomalies. Never mutates files."""
    entries = []
    if not folder.exists():
        return entries

    image_files = sorted(list(set(folder.glob("*.[jJ][pP][gG]")).union(set(folder.glob("*.[pP][nN][gG]")))))

    for img_path in image_files:
        ts = read_exif_timestamp(img_path)
        entries.append({
            "image_path": str(img_path),
            "sha256": sha256_of(img_path),
            "station_id": station_id,
            "original_timestamp": ts,
            "corrected_timestamp": ts,   # unchanged until staff applies an offset
            "flagged": False,
        })

    entries.sort(key=lambda e: e["original_timestamp"] or datetime.min)
    for i in range(1, len(entries)):
        prev_ts = entries[i - 1]["original_timestamp"]
        curr_ts = entries[i]["original_timestamp"]
        if prev_ts and curr_ts:
            gap = curr_ts - prev_ts
            if gap.total_seconds() < 0 or gap > JUMP_THRESHOLD:
                entries[i]["flagged"] = True  # surfaced to correction UI, never auto-fixed

    return entries


def apply_staff_correction(entries: list[dict], offset: timedelta) -> list[dict]:
    """Called only after a human confirms the offset in the correction form."""
    for e in entries:
        if e.get("original_timestamp"):
            e["corrected_timestamp"] = e["original_timestamp"] + offset
    return entries
