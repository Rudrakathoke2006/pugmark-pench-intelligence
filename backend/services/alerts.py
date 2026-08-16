import math
from datetime import datetime, timedelta
import json
from typing import Dict, List, Any

def geodesic_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Haversine geodesic distance formula between two lat/lon points."""
    R = 6371.0 # Earth radius km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

class AlertEngine:
    """
    Stage 7: Explainable Deviation & Movement Alert Engine.
    Rules:
    - Range Shift Alert: Centroid displacement > 4.5 km vs historical baseline
    - New Station Alert: Observation at camera station with no historical record (with Artefact Filter)
    - Buffer / Village Movement Alert: Sighting inside Buffer/Village-Adjacent zone
    - Prolonged Absence Alert: Sighting gap exceeding adaptive threshold
    """

    def evaluate_sighting_alerts(
        self,
        tiger_id: str,
        tiger_name: str,
        current_lat: float,
        current_lon: float,
        station_id: str,
        station_name: str,
        station_install_date: datetime,
        station_zone: str,
        historical_centroids: List[Dict[str, float]],
        historical_stations: List[str],
        last_sighting_date: datetime
    ) -> List[Dict[str, Any]]:
        alerts = []
        now = datetime.utcnow()

        # 1. Range Shift Alert
        if historical_centroids:
            prev_lat = historical_centroids[-1]["lat"]
            prev_lon = historical_centroids[-1]["lon"]
            displacement_km = geodesic_distance_km(prev_lat, prev_lon, current_lat, current_lon)

            if displacement_km >= 4.5:
                severity = "HIGH" if displacement_km >= 8.0 else "MEDIUM"
                alerts.append({
                    "tiger_id": tiger_id,
                    "alert_type": "RANGE_SHIFT",
                    "severity": severity,
                    "title": f"Range Shift Alert: {tiger_name}",
                    "description": f"Significant territorial centroid displacement of {displacement_km:.2f} km detected (Historical: {prev_lat:.4f}, {prev_lon:.4f} → Current: {current_lat:.4f}, {current_lon:.4f}).",
                    "evidence_json": json.dumps({
                        "previous_centroid": [prev_lat, prev_lon],
                        "current_location": [current_lat, current_lon],
                        "displacement_km": round(displacement_km, 2),
                        "station_id": station_id,
                        "station_name": station_name
                    }),
                    "is_survey_artefact": False
                })

        # 2. New Station Alert with Artefact Filter
        if station_id not in historical_stations:
            # Check installation date artefact filter
            is_artefact = False
            artefact_reason = ""
            if station_install_date:
                days_since_install = (now - station_install_date).days
                if days_since_install < 10:
                    is_artefact = True
                    artefact_reason = f"Camera station {station_name} was deployed only {days_since_install} days ago. Movement is likely a survey artifact of newly added spatial coverage."

            alerts.append({
                "tiger_id": tiger_id,
                "alert_type": "NEW_STATION",
                "severity": "LOW" if is_artefact else "MEDIUM",
                "title": f"New Camera Trap Location: {tiger_name} at {station_name}",
                "description": f"First recorded sighting of {tiger_name} at station {station_name} ({station_id}). " + (f"[ARTEFACT FILTER APPLIED: {artefact_reason}]" if is_artefact else "Indicates expansion into unmonitored sector."),
                "evidence_json": json.dumps({
                    "station_id": station_id,
                    "station_name": station_name,
                    "station_install_date": station_install_date.strftime("%Y-%m-%d") if station_install_date else "Unknown",
                    "is_artefact": is_artefact,
                    "artefact_reason": artefact_reason
                }),
                "is_survey_artefact": is_artefact
            })

        # 3. Buffer / Village Movement Alert
        if station_zone in ["Buffer", "Village-Adjacent"]:
            severity = "HIGH" if station_zone == "Village-Adjacent" else "MEDIUM"
            alerts.append({
                "tiger_id": tiger_id,
                "alert_type": "BUFFER_MOVEMENT",
                "severity": severity,
                "title": f"Buffer/Village Movement: {tiger_name} near {station_name}",
                "description": f"{tiger_name} was observed at station {station_name} located in the sensitive {station_zone} zone of Pench Reserve.",
                "evidence_json": json.dumps({
                    "station_id": station_id,
                    "station_name": station_name,
                    "zone": station_zone,
                    "coordinates": [current_lat, current_lon]
                }),
                "is_survey_artefact": False
            })

        # 4. Prolonged Absence Alert
        if last_sighting_date:
            days_absent = (now - last_sighting_date).days
            if days_absent >= 21:
                alerts.append({
                    "tiger_id": tiger_id,
                    "alert_type": "PROLONGED_ABSENCE",
                    "severity": "HIGH" if days_absent >= 35 else "MEDIUM",
                    "title": f"Prolonged Absence Warning: {tiger_name}",
                    "description": f"{tiger_name} has not been recorded across active Pench trap stations for {days_absent} consecutive days (Last seen: {last_sighting_date.strftime('%d %b %Y')}).",
                    "evidence_json": json.dumps({
                        "days_absent": days_absent,
                        "last_sighting_date": last_sighting_date.strftime("%Y-%m-%d")
                    }),
                    "is_survey_artefact": False
                })

        return alerts

alert_engine = AlertEngine()
