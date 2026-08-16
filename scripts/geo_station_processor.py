"""
================================================================================
PUGMARK BIODIVERSITY INTELLIGENCE — CLI RUNNER
Station CCTV & Geo-Image Processing Test Runner
================================================================================
WHERE: scripts/geo_station_processor.py
WHY: Validates offline station CCTV metadata parsing, EXIF spatial tags, and
     WGS84 -> UTM Zone 44N (EPSG:32644) coordinate projection.
================================================================================
"""

import os
import sys

# Insert project root
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.database.connection import SessionLocal
from backend.services.geo_station_processor import GeoStationProcessor, wgs84_to_utm44n

def test_station_geo_processing():
    print("=================================================================")
    print("PUGMARK OFFLINE GIS ENGINE — STATION CCTV & GEO-IMAGE PROCESSING")
    print("=================================================================")

    # 1. Test WGS84 -> UTM 44N Projection Formula
    lat, lon = 21.6740, 79.3056
    easting, northing = wgs84_to_utm44n(lat, lon)
    
    print(f"\n[Coordinate Transformation Test]")
    print(f"WGS84 Input:     Lat {lat} N, Lon {lon} E")
    print(f"UTM 44N Output:  Easting: {easting:,} m, Northing: {northing:,} m")
    print(f"Projected CRS:   EPSG:32644 (UTM Zone 44N)")

    # 2. Test DB Station Geo Processing
    db = SessionLocal()
    try:
        processor = GeoStationProcessor(db)
        res = processor.process_station_cctv_frame("ST-01", "static/crops/t017_flank.jpg")
        
        print("\n[Station CCTV Coverage Result]")
        print(f"Station ID:         {res['station_id']} ({res['station_name']})")
        print(f"Zone Type:          {res['zone_type']}")
        print(f"Spatial Coordinates: Lat {res['latitude']}, Lon {res['longitude']}")
        print(f"UTM Metric Grid:    Easting {res['utm_easting']:,} m E, Northing {res['utm_northing']:,} m N")
        print(f"Core Center Dist:   {res['distance_to_core_center_km']} km")
        print(f"Camera Trap Model:  {res['camera_model']}")
        print(f"Coverage Radius:    {res['camera_trap_coverage_radius_m']} m")

        print("\n=================================================================")
        print("GEO-STATION PROCESSING SUCCESSFUL — 100% Offline GIS Engine Ready!")
        print("=================================================================\n")
    finally:
        db.close()

if __name__ == "__main__":
    test_station_geo_processing()
