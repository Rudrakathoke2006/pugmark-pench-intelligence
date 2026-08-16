"""
WHERE: backend/services/capture_events.py
WHY: Camera traps capture burst sequences (3-5 frames per passing animal).
     Grouping images into capture events (same station AND gap <= 60s) reduces
     redundant ML inference calls and improves Re-ID accuracy via score aggregation.
ALGORITHM: Temporal clustering per camera station.
"""
from datetime import datetime, timedelta
from typing import List, Dict, Any


def group_images_into_events(image_records: List[Dict[str, Any]], max_gap_seconds: int = 60) -> List[Dict[str, Any]]:
    """
    Groups flat image records into burst capture events per station.
    image_records: List of dicts with keys 'image_id', 'station_id', 'timestamp'
    """
    if not image_records:
        return []

    # Sort by station and timestamp
    sorted_records = sorted(
        image_records,
        key=lambda x: (x.get("station_id", ""), x.get("timestamp") or datetime.min)
    )

    events = []
    current_event = None

    for rec in sorted_records:
        st_id = rec.get("station_id")
        ts = rec.get("timestamp")

        if current_event is None:
            current_event = {
                "event_id": f"EVT-{st_id}-{ts.strftime('%Y%m%d%H%M%S') if ts else '0'}",
                "station_id": st_id,
                "start_time": ts,
                "end_time": ts,
                "images": [rec],
                "image_count": 1
            }
        else:
            prev_st = current_event["station_id"]
            prev_ts = current_event["end_time"]

            if st_id == prev_st and ts and prev_ts and (ts - prev_ts).total_seconds() <= max_gap_seconds:
                current_event["images"].append(rec)
                current_event["end_time"] = ts
                current_event["image_count"] += 1
            else:
                events.append(current_event)
                current_event = {
                    "event_id": f"EVT-{st_id}-{ts.strftime('%Y%m%d%H%M%S') if ts else '0'}",
                    "station_id": st_id,
                    "start_time": ts,
                    "end_time": ts,
                    "images": [rec],
                    "image_count": 1
                }

    if current_event:
        events.append(current_event)

    return events


def aggregate_event_reid_score(match_results: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Aggregates Re-ID scores across multiple burst frames in a capture event.
    Returns median match score and consensus best candidate tiger_id.
    """
    if not match_results:
        return {"best_tiger_id": None, "aggregated_score": 0.0, "decision": "AUTO-ENROLL"}

    tiger_scores: Dict[str, List[float]] = {}
    for res in match_results:
        tid = res.get("best_tiger_id")
        score = res.get("match_score", 0.0)
        if tid:
            tiger_scores.setdefault(tid, []).append(score)

    if not tiger_scores:
        return {"best_tiger_id": None, "aggregated_score": 0.0, "decision": "AUTO-ENROLL"}

    # Find candidate tiger with highest median score
    candidate_medians = {
        tid: float(sorted(scores)[len(scores) // 2])
        for tid, scores in tiger_scores.items()
    }
    best_tiger = max(candidate_medians.keys(), key=lambda k: candidate_medians[k])
    aggregated_score = round(candidate_medians[best_tiger], 4)

    if aggregated_score >= 0.55:
        decision = "AUTO-MATCH"
    elif aggregated_score >= 0.25:
        decision = "HUMAN-REVIEW"
    else:
        decision = "AUTO-ENROLL"

    return {
        "best_tiger_id": best_tiger,
        "aggregated_score": aggregated_score,
        "decision": decision,
        "candidate_medians": candidate_medians
    }
