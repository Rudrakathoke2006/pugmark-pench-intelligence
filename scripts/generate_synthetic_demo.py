"""
Pipeline 15: Synthetic Pench Reserve Demo-Data Generation.
Populates DB with realistic tiger sightings, stations, occupancy runs, and alerts.
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.database.connection import SessionLocal, Base, engine
from backend.database.seed import seed_database

def main():
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    print("Generating synthetic Pench Tiger Reserve demo data...")
    seed_database()
    db.close()
    print("Demo data generation complete!")

if __name__ == "__main__":
    main()
