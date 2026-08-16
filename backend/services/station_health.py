"""
WHERE: backend/services/station_health.py
WHY: Camera traps in Pench Tiger Reserve can suffer from dead batteries, thief theft,
     or damage. Tracking per-station capture frequency flags silent cameras (no captures >14d)
     separately from tiger absence.
"""
from datetime import datetime, timedelta
from typing import List, Dict, Any


def evaluate_station_health(stations: List[Dict[str, Any]], image_records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Evaluates health status for all camera stations.
    """
    now = datetime.utcnow()
    station_last_active: Dict[str, datetime] = {}
    station_capture_counts: Dict[str, int] = {}

    for img in image_records:
        st_id = img.get("station_id")
        ts = img.get("corrected_timestamp") or img.get("original_timestamp")
        if st_id:
            station_capture_counts[st_id] = station_capture_counts.get(st_id, 0) + 1
            if ts:
                if st_id not in station_last_active or ts > station_last_active[st_id]:
                    station_last_active[st_id] = ts

    health_reports = []
    for st in stations:
        st_id = st.get("station_id")
        last_seen = station_last_active.get(st_id)
        total_caps = station_capture_counts.get(st_id, 0)

        if not last_seen:
            days_silent = 999
            status = "SILENT/MALFUNCTIONING"
            health_code = "CRITICAL"
        else:
            days_silent = (now - last_seen).days
            if days_silent > 14:
                status = "SILENT/MALFUNCTIONING"
                health_code = "WARNING" if days_silent <= 30 else "CRITICAL"
            else:
                status = "OPERATIONAL"
                health_code = "OK"

        health_reports.append({
            "station_id": st_id,
            "name": st.get("name", st_id),
            "zone": st.get("zone", "Core"),
            "latitude": st.get("latitude"),
            "longitude": st.get("longitude"),
            "total_captures": total_caps,
            "last_active": last_seen.strftime("%d %b %Y %H:%M") if last_seen else "Never",
            "days_silent": days_silent if days_silent != 999 else "No Data",
            "status": status,
            "health_code": health_code
        })

    return health_reports
