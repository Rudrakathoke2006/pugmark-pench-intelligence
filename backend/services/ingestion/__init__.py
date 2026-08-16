import hashlib
import os
from datetime import datetime, timedelta
from PIL import Image
from PIL.ExifTags import TAGS

from .hygiene import build_manifest, apply_staff_correction, sha256_of, read_exif_timestamp

def compute_sha256(filepath: str) -> str:
    """Compute SHA-256 hash of a file for exact duplicate detection."""
    hasher = hashlib.sha256()
    with open(filepath, 'rb') as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()

def compute_simple_phash(filepath: str) -> str:
    """Compute lightweight perceptual hash using average hash algorithm."""
    try:
        with Image.open(filepath) as img:
            img = img.convert('L').resize((8, 8), Image.Resampling.LANCZOS)
            pixels = list(img.getdata())
            avg = sum(pixels) / len(pixels)
            bits = "".join(['1' if p > avg else '0' for p in pixels])
            return hex(int(bits, 2))[2:].zfill(16)
    except Exception:
        return "0000000000000000"

def extract_exif_metadata(filepath: str):
    """Extract timestamp and EXIF tags from image."""
    original_timestamp = None
    camera_make = "Unknown"
    camera_model = "Camera Trap"

    try:
        with Image.open(filepath) as img:
            exif_data = img._getexif()
            if exif_data:
                for tag_id, value in exif_data.items():
                    tag = TAGS.get(tag_id, tag_id)
                    if tag == 'DateTimeOriginal' or tag == 'DateTime':
                        try:
                            original_timestamp = datetime.strptime(str(value), '%Y:%m:%d %H:%M:%S')
                        except Exception:
                            pass
                    elif tag == 'Make':
                        camera_make = str(value).strip()
                    elif tag == 'Model':
                        camera_model = str(value).strip()
    except Exception:
        pass

    if not original_timestamp:
        mtime = os.path.getmtime(filepath) if os.path.exists(filepath) else datetime.utcnow().timestamp()
        original_timestamp = datetime.fromtimestamp(mtime)

    return {
        "original_timestamp": original_timestamp,
        "camera_make": camera_make,
        "camera_model": camera_model
    }

def validate_timestamps(timestamps_list):
    """
    Detect non-monotonic time jumps, clock resets, or battery failure anomalies.
    Returns list of dicts with boolean flag and correction notes.
    """
    results = []
    prev_dt = None

    for idx, dt in enumerate(timestamps_list):
        flagged = False
        reason = None
        corrected_dt = dt

        if prev_dt is not None:
            diff = (dt - prev_dt).total_seconds()
            if diff < 0:
                flagged = True
                reason = f"Negative time jump detected: {dt} occurred before previous frame {prev_dt}"
                corrected_dt = prev_dt + timedelta(seconds=120)
            elif diff > 30 * 86400:
                flagged = True
                reason = f"Unusually large gap (>30 days) between consecutive trap captures: {diff / 86400:.1f} days"

        results.append({
            "original_timestamp": dt,
            "corrected_timestamp": corrected_dt,
            "is_flagged": flagged,
            "reason": reason
        })
        prev_dt = dt

    return results
