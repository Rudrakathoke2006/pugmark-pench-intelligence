"""
WHERE: backend/services/smart_export.py
WHY: Forest departments in India use SMART (Spatial Monitoring and Reporting Tool).
     Providing standard CSV & GeoJSON export ensures PUGMARK is fully interoperable.
"""
import json
import csv
import io
from typing import List, Dict, Any


def generate_smart_csv(sightings: List[Dict[str, Any]]) -> str:
    """Generate SMART-compliant CSV string for tiger sightings."""
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Observation_ID", "Tiger_ID", "Tiger_Name", "Station_ID", "Station_Name",
        "Latitude", "Longitude", "Timestamp", "Match_Score", "Decision", "Status"
    ])
    for s in sightings:
        writer.writerow([
            s.get("identification_id", ""),
            s.get("tiger_id", ""),
            s.get("tiger_name", ""),
            s.get("station_id", ""),
            s.get("station_name", ""),
            s.get("latitude", 0.0),
            s.get("longitude", 0.0),
            s.get("timestamp", ""),
            s.get("match_score", 0.0),
            s.get("decision", ""),
            s.get("status", "Confirmed")
        ])
    return output.getvalue()


def generate_smart_geojson(sightings: List[Dict[str, Any]], zones: List[Dict[str, Any]]) -> str:
    """Generate GeoJSON FeatureCollection containing sighting points and zone geometries."""
    features = []

    # Sighting point features
    for s in sightings:
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [float(s.get("longitude", 79.3)), float(s.get("latitude", 21.68))]
            },
            "properties": {
                "feature_type": "Observation",
                "observation_id": s.get("identification_id"),
                "tiger_id": s.get("tiger_id"),
                "tiger_name": s.get("tiger_name"),
                "station_id": s.get("station_id"),
                "timestamp": s.get("timestamp"),
                "match_score": s.get("match_score")
            }
        })

    # Reserve zone features
    for z in zones:
        features.append({
            "type": "Feature",
            "geometry": z.get("geojson", {}),
            "properties": {
                "feature_type": "ReserveZone",
                "zone_id": z.get("zone_id"),
                "name": z.get("name"),
                "zone_type": z.get("zone_type")
            }
        })

    geojson_doc = {
        "type": "FeatureCollection",
        "name": "PUGMARK_SMART_Export_Package",
        "features": features
    }
    return json.dumps(geojson_doc, indent=2)
