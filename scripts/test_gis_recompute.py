import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.database.connection import SessionLocal
from backend.services.gis import recompute_tiger_occupancy

def test_gis_recompute():
    db = SessionLocal()
    print("Testing dynamic GIS occupancy recalculation for tiger T-101...")
    res = recompute_tiger_occupancy("T-101", db)
    print("Recalculation Output:")
    print(f"KDE 95% Area: {res.get('kde95_area_km2')} km2")
    print(f"KDE 50% Area: {res.get('kde50_area_km2')} km2")
    print(f"MCP Area: {res.get('mcp_area_km2')} km2")
    print(f"Centroid: {res.get('centroid')}")
    db.close()

if __name__ == "__main__":
    test_gis_recompute()
