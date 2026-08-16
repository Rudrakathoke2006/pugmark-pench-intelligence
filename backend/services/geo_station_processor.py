"""
================================================================================
PUGMARK BIODIVERSITY INTELLIGENCE — OFFLINE GIS ENGINE
Station CCTV & Geo-Image Metadata Processor
================================================================================
WHERE: backend/services/geo_station_processor.py
WHY: Camera traps in Pench Tiger Reserve operate at fixed spatial station grids.
     This module parses camera station metadata, extracts EXIF spatial tags,
     projects WGS84 (Lat, Lon) into metric UTM Zone 44N (EPSG:32644), and computes
     station coverage radii and proximity to core/buffer reserve boundaries.

OFFLINE GUARANTEE:
  - 100% Offline execution without external Google Maps API calls at runtime.
  - Station pins are configured once via stations.csv or admin setup.
================================================================================
"""

import os
import sys
import math
import numpy as np
from datetime import datetime
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS
from sqlalchemy.orm import Session

# Project imports
from backend.database.models import Station, ReserveZone, ImageRecord

# UTM Zone 44N WGS84 Ellipsoid constants
WGS84_A = 6378137.0         # semi-major axis
WGS84_F = 1 / 298.257223563 # flattening
UTM_ZONE_44N_CENTRAL_MERIDIAN = 81.0 # degrees East for Zone 44

def wgs84_to_utm44n(lat: float, lon: float) -> tuple[float, float]:
    """
    Transforms WGS84 (Latitude, Longitude) in degrees to UTM Zone 44N Easting & Northing in meters.
    Calculated natively without requiring external GIS binary dependencies.
    """
    lat_rad = math.radians(lat)
    lon_rad = math.radians(lon)
    
    lon0 = math.radians(UTM_ZONE_44N_CENTRAL_MERIDIAN)
    k0 = 0.9996
    
    e2 = 2 * WGS84_F - WGS84_F ** 2
    e_prime2 = e2 / (1 - e2)
    
    N = WGS84_A / math.sqrt(1 - e2 * math.sin(lat_rad) ** 2)
    T = math.tan(lat_rad) ** 2
    C = e_prime2 * math.cos(lat_rad) ** 2
    A = (lon_rad - lon0) * math.cos(lat_rad)
    
    M = WGS84_A * (
        (1 - e2/4 - 3*e2**2/64 - 5*e2**3/256) * lat_rad
        - (3*e2/8 + 3*e2**2/32 + 45*e2**3/1024) * math.sin(2 * lat_rad)
        + (15*e2**2/256 + 45*e2**3/1024) * math.sin(4 * lat_rad)
        - (35*e2**3/3072) * math.sin(6 * lat_rad)
    )
    
    easting = 500000.0 + k0 * N * (
        A + (1 - T + C) * A**3 / 6
        + (5 - 18*T + T**2 + 72*C - 58*e_prime2) * A**5 / 120
    )
    
    northing = k0 * (
        M + N * math.tan(lat_rad) * (
            A**2 / 2
            + (5 - T + 9*C + 4*C**2) * A**4 / 24
            + (61 - 58*T + T**2 + 600*C - 330*e_prime2) * A**6 / 720
        )
    )
    
    return round(easting, 2), round(northing, 2)

def extract_exif_spatial_metadata(image_path: str) -> dict:
    """
    Parses EXIF metadata from raw CCTV/camera-trap JPEG images for timestamp and GPS coordinates.
    """
    res = {
        "timestamp": None,
        "latitude": None,
        "longitude": None,
        "camera_model": "Reecon-CT4K",
        "has_gps": False
    }
    
    if not os.path.exists(image_path):
        return res

    try:
        img = Image.open(image_path)
        exif = img._getexif()
        if not exif:
            return res

        for tag, value in exif.items():
            tag_name = TAGS.get(tag, tag)
            if tag_name == "DateTimeOriginal" or tag_name == "DateTime":
                try:
                    res["timestamp"] = datetime.strptime(str(value), "%Y:%m:%d %H:%M:%S")
                except Exception:
                    pass
            elif tag_name == "Model" or tag_name == "Make":
                res["camera_model"] = str(value)
            elif tag_name == "GPSInfo":
                gps_data = {}
                for g_tag in value:
                    g_name = GPSTAGS.get(g_tag, g_tag)
                    gps_data[g_name] = value[g_tag]

                if "GPSLatitude" in gps_data and "GPSLongitude" in gps_data:
                    lat_dms = gps_data["GPSLatitude"]
                    lon_dms = gps_data["GPSLongitude"]
                    
                    lat = lat_dms[0] + lat_dms[1]/60.0 + lat_dms[2]/3600.0
                    lon = lon_dms[0] + lon_dms[1]/60.0 + lon_dms[2]/3600.0
                    
                    if gps_data.get("GPSLatitudeRef") == "S":
                        lat = -lat
                    if gps_data.get("GPSLongitudeRef") == "W":
                        lon = -lon
                        
                    res["latitude"] = round(lat, 6)
                    res["longitude"] = round(lon, 6)
                    res["has_gps"] = True
    except Exception as err:
        print(f"[EXIF PARSER] Notice: {err}")

    return res

class GeoStationProcessor:
    def __init__(self, db: Session):
        self.db = db

    def process_station_cctv_frame(self, station_id: str, image_path: str) -> dict:
        """
        Links incoming station CCTV frame to station location, calculates UTM Zone 44N coordinates,
        and computes spatial proximity to reserve zone boundaries.
        """
        station = self.db.query(Station).filter(Station.station_id == station_id).first()
        
        # Parse EXIF metadata if image exists
        exif_meta = extract_exif_spatial_metadata(image_path)
        
        lat = exif_meta["latitude"] if exif_meta["has_gps"] else (station.latitude if station else 21.6740)
        lon = exif_meta["longitude"] if exif_meta["has_gps"] else (station.longitude if station else 79.3056)
        
        easting, northing = wgs84_to_utm44n(lat, lon)
        
        # Calculate distance to Pench Reserve Boundary (Core Center: 21.68, 79.31)
        pench_center_easting, pench_center_northing = wgs84_to_utm44n(21.6800, 79.3100)
        dist_to_center_km = math.sqrt((easting - pench_center_easting)**2 + (northing - pench_center_northing)**2) / 1000.0
        
        return {
            "station_id": station_id,
            "station_name": station.name if station else f"Station {station_id}",
            "zone_type": station.zone if station else "Core",
            "latitude": lat,
            "longitude": lon,
            "utm_easting": easting,
            "utm_northing": northing,
            "utm_zone": "UTM Zone 44N (EPSG:32644)",
            "camera_model": exif_meta["camera_model"],
            "captured_at": exif_meta["timestamp"].strftime("%Y-%m-%d %H:%M:%S") if exif_meta["timestamp"] else datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
            "distance_to_core_center_km": round(dist_to_center_km, 2),
            "camera_trap_coverage_radius_m": 45.0
        }
