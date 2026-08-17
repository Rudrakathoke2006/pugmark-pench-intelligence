import os
import json
from datetime import datetime, timedelta
import random
import cv2
import numpy as np

from .connection import engine, SessionLocal, Base
from .models import (
    Station, ReserveZone, IngestionRun, ImageRecord,
    Detection, Tiger, Identification, OccupancyRun,
    TerritoryOverlap, Alert, DecisionLog
)
from ..services.gis import compute_kde_contours, compute_territorial_overlap

# Ensure static asset dir for sample tiger flank crops
STATIC_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static", "crops")
os.makedirs(STATIC_DIR, exist_ok=True)

def generate_sample_flank_image(filename: str, tiger_code: str):
    """Copies real tiger video frame from Tiger_Identification dataset."""
    import glob
    import shutil
    output_path = os.path.join(STATIC_DIR, filename)
    
    # Try finding real frame from Tiger_Identification dataset
    t1_frames = sorted(glob.glob("Tiger_Identification/database/tiger_1/*.jpg"))
    t2_frames = sorted(glob.glob("Tiger_Identification/tiger_crops_video2/*.jpg"))
    
    source = None
    if "t017" in filename and t1_frames:
        source = t1_frames[0]
    elif "t023" in filename and t1_frames:
        source = t1_frames[min(2, len(t1_frames)-1)]
    elif "t009" in filename and t2_frames:
        source = t2_frames[0]
    elif "t031" in filename and t2_frames:
        source = t2_frames[min(1, len(t2_frames)-1)]
    elif t1_frames:
        source = t1_frames[0]
        
    if source and os.path.exists(source):
        shutil.copy(source, output_path)
    else:
        # Fallback real color tiger crop if path missing
        img = np.zeros((300, 450, 3), dtype=np.uint8)
        img[:, :] = (34, 112, 195) # Real tiger orange tint
        cv2.imwrite(output_path, img)
        
    return f"/static/crops/{filename}"

def seed_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    print("Seeding Pench Tiger Reserve camera stations...")

    # 1. Camera Trap Stations
    stations_data = [
        {"id": "ST-01", "name": "Sitaghat Core 01", "lat": 21.6850, "lon": 79.3120, "zone": "Core", "days_ago": 180},
        {"id": "ST-02", "name": "Karmajhiri Stream", "lat": 21.6920, "lon": 79.3250, "zone": "Core", "days_ago": 180},
        {"id": "ST-03", "name": "Alikatta Grasslands", "lat": 21.6710, "lon": 79.3010, "zone": "Core", "days_ago": 180},
        {"id": "ST-04", "name": "Mahadeo Trail", "lat": 21.6600, "lon": 79.2880, "zone": "Core", "days_ago": 180},
        {"id": "ST-05", "name": "Bodhan Nala", "lat": 21.7050, "lon": 79.3390, "zone": "Core", "days_ago": 180},
        {"id": "ST-06", "name": "Chhindimatta Ridge", "lat": 21.6420, "lon": 79.2740, "zone": "Core", "days_ago": 180},
        {"id": "ST-07", "name": "Pyorthadi Buffer", "lat": 21.6180, "lon": 79.2510, "zone": "Buffer", "days_ago": 120},
        {"id": "ST-08", "name": "Gumtara Sector", "lat": 21.7220, "lon": 79.3620, "zone": "Buffer", "days_ago": 120},
        {"id": "ST-09", "name": "Turiya Gate Buffer", "lat": 21.6010, "lon": 79.2320, "zone": "Village-Adjacent", "days_ago": 90},
        {"id": "ST-10", "name": "Khawasa Fringe", "lat": 21.5900, "lon": 79.2150, "zone": "Village-Adjacent", "days_ago": 60},
        {"id": "ST-11", "name": "Sillari Range", "lat": 21.6310, "lon": 79.3550, "zone": "Buffer", "days_ago": 45},
        {"id": "ST-12", "name": "Ambabarwa Boundary", "lat": 21.5750, "lon": 79.1980, "zone": "Village-Adjacent", "days_ago": 5} # Newly deployed station (artefact filter target)
    ]

    now = datetime.utcnow()
    stations_map = {}
    for st in stations_data:
        inst_date = now - timedelta(days=st["days_ago"])
        station_obj = Station(
            station_id=st["id"],
            name=st["name"],
            latitude=st["lat"],
            longitude=st["lon"],
            installation_date=inst_date,
            zone=st["zone"],
            status="Active"
        )
        db.add(station_obj)
        stations_map[st["id"]] = station_obj

    # 2. Reserve Zones
    print("Seeding Pench Reserve GIS boundaries...")
    core_poly = {
        "type": "Polygon",
        "coordinates": [[[79.26, 21.63], [79.36, 21.63], [79.36, 21.72], [79.26, 21.72], [79.26, 21.63]]]
    }
    buffer_poly = {
        "type": "Polygon",
        "coordinates": [[[79.22, 21.59], [79.39, 21.59], [79.39, 21.75], [79.22, 21.75], [79.22, 21.59]]]
    }
    village_poly = {
        "type": "Polygon",
        "coordinates": [[[79.18, 21.56], [79.23, 21.56], [79.23, 21.61], [79.18, 21.61], [79.18, 21.56]]]
    }

    db.add(ReserveZone(zone_id="RZ-01", name="Pench Core Critical Tiger Habitat", zone_type="Core", polygon_geojson=json.dumps(core_poly)))
    db.add(ReserveZone(zone_id="RZ-02", name="Pench Buffer Conservation Zone", zone_type="Buffer", polygon_geojson=json.dumps(buffer_poly)))
    db.add(ReserveZone(zone_id="RZ-03", name="Khawasa-Turiya Eco-Sensitive Fringe", zone_type="Village-Adjacent", polygon_geojson=json.dumps(village_poly)))

    # 3. Tigers
    print("Seeding individual tigers (T-017, T-023)...")

    img_t017 = generate_sample_flank_image("t017_flank.jpg", "T-017")
    img_t023 = generate_sample_flank_image("t023_flank.jpg", "T-023")

    tigers_data = [
        {"id": "T-017", "name": "T-017 (Pench Queen)", "sex": "Female", "stage": "Adult", "img": img_t017, "days_first": 365, "days_last": 1},
        {"id": "T-023", "name": "T-023 (Chhota Male)", "sex": "Male", "stage": "Adult", "img": img_t023, "days_first": 300, "days_last": 2}
    ]

    for t in tigers_data:
        db.add(Tiger(
            tiger_id=t["id"],
            name=t["name"],
            sex=t["sex"],
            life_stage=t["stage"],
            first_seen=now - timedelta(days=t["days_first"]),
            last_seen=now - timedelta(days=t["days_last"]),
            status="Active",
            reference_image_url=t["img"]
        ))

    # 4. Ingestion Run
    ingest_run = IngestionRun(
        run_id="RUN-2026-AUG-01",
        station_id="ST-01",
        survey_cycle="2026-Monsoon-Cycle-04",
        operator="Field Officer R. Sharma",
        total_images=1250,
        kept_images=340,
        quarantined_images=880,
        privacy_images=30,
        timestamp_correction_notes="Verified camera clock drift (+14 mins corrected automatically)."
    )
    db.add(ingest_run)

    # 5. Generate Tiger Observations & GIS Occupancy
    print("Generating tiger spatial observation points and running KDE 95%/50% & MCP...")

    tiger_coords = {
        "T-017": [
            (21.685, 79.312), (21.692, 79.325), (21.671, 79.301), (21.660, 79.288),
            (21.678, 79.315), (21.689, 79.308), (21.695, 79.330), (21.668, 79.295),
            (21.618, 79.251), (21.601, 79.232) # Shift into buffer!
        ],
        "T-023": [
            (21.692, 79.325), (21.705, 79.339), (21.685, 79.312), (21.722, 79.362),
            (21.710, 79.345), (21.698, 79.332), (21.718, 79.358), (21.688, 79.320)
        ]
    }

    occupancy_results = {}

    for t_id, pts in tiger_coords.items():
        kde_res = compute_kde_contours(pts)
        occ_run = OccupancyRun(
            run_id=f"OCC-{t_id}-2026",
            tiger_id=t_id,
            computed_at=now,
            kde_bandwidth=0.015,
            kde95_area_km2=kde_res["kde95_area_km2"],
            kde50_area_km2=kde_res["kde50_area_km2"],
            mcp_area_km2=kde_res["mcp_area_km2"],
            centroid_lat=kde_res["centroid"][0],
            centroid_lon=kde_res["centroid"][1],
            kde95_geojson=kde_res["kde95_geojson"],
            kde50_geojson=kde_res["kde50_geojson"],
            mcp_geojson=kde_res["mcp_geojson"],
            observation_count=len(pts) * 12
        )
        db.add(occ_run)
        occupancy_results[t_id] = kde_res

        # Add image records and detections
        for i, (lat, lon) in enumerate(pts):
            img_id = f"IMG-{t_id}-{i+1:03d}"
            st_id = f"ST-{(i % 12) + 1:02d}"
            t_stamp = now - timedelta(days=(len(pts) - i) * 3, hours=random.randint(1, 12))

            img_rec = ImageRecord(
                image_id=img_id,
                run_id=ingest_run.run_id,
                station_id=st_id,
                file_path=f"/data/raw/{st_id}/{img_id}.jpg",
                sha256=f"hash_{t_id}_{i}_sha256",
                phash=f"phash_{t_id}_{i}",
                original_timestamp=t_stamp,
                corrected_timestamp=t_stamp,
                is_timestamp_flagged=False,
                blank_decision="KEEP",
                animal_confidence=0.94,
                person_confidence=0.01,
                vehicle_confidence=0.0
            )
            db.add(img_rec)

            det_id = f"DET-{t_id}-{i+1:03d}"
            det = Detection(
                detection_id=det_id,
                image_id=img_id,
                bbox_x=120.0,
                bbox_y=80.0,
                bbox_w=400.0,
                bbox_h=250.0,
                confidence=0.95,
                species="Tiger",
                crop_path=tigers_data[0]["img"] if t_id == "T-017" else tigers_data[1]["img"]
            )
            db.add(det)

            ident = Identification(
                identification_id=f"ID-{t_id}-{i+1:03d}",
                detection_id=det_id,
                tiger_id=t_id,
                match_score=0.88 if i < len(pts)-1 else 0.64,
                decision="AUTO-MATCH" if i < len(pts)-1 else "HUMAN-REVIEW",
                review_status="CONFIRMED" if i < len(pts)-1 else "PENDING",
                reviewer="Auto-Engine" if i < len(pts)-1 else "Pending Officer",
                candidate_scores_json=json.dumps([
                    {"tiger_id": t_id, "score": 0.88 if i < len(pts)-1 else 0.64},
                    {"tiger_id": "T-023" if t_id != "T-023" else "T-017", "score": 0.52}
                ])
            )
            db.add(ident)

    # 6. Territory Overlaps
    print("Computing pairwise tiger territorial overlaps...")
    ov_017_023 = compute_territorial_overlap(occupancy_results["T-017"]["kde95_geojson"], occupancy_results["T-023"]["kde95_geojson"])
    db.add(TerritoryOverlap(
        overlap_id="OV-017-023",
        tiger_a_id="T-017",
        tiger_b_id="T-023",
        overlap_area_km2=ov_017_023["overlap_area_km2"] or 18.4,
        overlap_pct=ov_017_023["overlap_pct"] or 14.2
    ))

    # 7. Explainable Alerts
    print("Seeding actionable intelligence alerts...")

    alerts_list = [
        {
            "id": "ALT-2026-001",
            "tiger_id": "T-017",
            "type": "BUFFER_MOVEMENT",
            "severity": "HIGH",
            "title": "Buffer/Village Zone Shift: T-017 (Pench Queen)",
            "desc": "T-017 observed at Turiya Gate Buffer station (ST-09) near Khawasa fringe village boundaries. 5.8 km south-west of core centroid.",
            "evidence": json.dumps({"station": "ST-09", "zone": "Village-Adjacent", "distance_to_village_km": 1.4, "confidence": 0.92}),
            "is_artefact": False
        },
        {
            "id": "ALT-2026-002",
            "tiger_id": "T-017",
            "type": "RANGE_SHIFT",
            "severity": "MEDIUM",
            "title": "Territorial Range Shift: T-017",
            "desc": "Centroid displacement of 5.82 km detected in recent monsoon survey cycle compared to 2025 baseline.",
            "evidence": json.dumps({"previous_centroid": [21.685, 79.312], "current_centroid": [21.645, 79.278], "displacement_km": 5.82}),
            "is_artefact": False
        }
    ]

    for alt in alerts_list:
        db.add(Alert(
            alert_id=alt["id"],
            tiger_id=alt["tiger_id"],
            alert_type=alt["type"],
            severity=alt["severity"],
            title=alt["title"],
            description=alt["desc"],
            evidence_json=alt["evidence"],
            is_survey_artefact=alt["is_artefact"],
            is_acknowledged=False,
            created_at=now - timedelta(hours=random.randint(2, 48))
        ))

    # 8. Decision Logs
    print("Seeding system audit trail decision logs...")
    logs = [
        {"stage": "Stage 0: Ingestion", "input": "SD_CARD_DCIM/ST-01", "out": "Manifest created (1,250 frames)", "conf": 1.0, "reason": "SHA-256 byte hashes computed; 1 timestamp drift flagged and corrected."},
        {"stage": "Stage 1: Blank Triage", "input": "IMG-T-017-001", "out": "KEEP (Animal)", "conf": 0.94, "reason": "MegaDetector animal confidence 94.2% >= 40.0% threshold."},
        {"stage": "Stage 2: Tiger Detection", "input": "IMG-T-017-001", "out": "Tiger Bounding Box [120, 80, 400, 250]", "conf": 0.95, "reason": "YOLOv8n localized tiger with 95.1% confidence."},
        {"stage": "Stage 3: Flank Crop", "input": "DET-T-017-001", "out": "CLAHE Enhanced Flank Crop", "conf": 1.0, "reason": "Aspect ratio preserved crop with adaptive histogram contrast enhancement."},
        {"stage": "Stage 4: Re-ID", "input": "DET-T-017-010", "out": "HUMAN-REVIEW", "conf": 0.64, "reason": "SIFT LNBNN score 0.64 is in uncertainty range (0.50 - 0.79). Routed to review queue."},
        {"stage": "Stage 6: GIS Occupancy", "input": "T-017 Observations (10 pts)", "out": "95% KDE: 84.5 km², 50% Core: 32.1 km²", "conf": 0.95, "reason": "UTM Zone 44N projected Gaussian KDE and Convex Hull executed successfully."},
        {"stage": "Stage 7: Alert Engine", "input": "Sighting at ST-12", "out": "NEW_STATION (Survey Artefact)", "conf": 0.90, "reason": "Station install date < 10 days; artefact filter suppressed high-severity alert."}
    ]

    for log in logs:
        db.add(DecisionLog(
            log_id=f"LOG-{random.randint(10000, 99999)}",
            stage=log["stage"],
            input_ref=log["input"],
            output=log["out"],
            confidence=log["conf"],
            threshold=0.80,
            reason=log["reason"],
            model_version="pugmark-v1.0-cpu"
        ))

    db.commit()
    db.close()
    print("PUGMARK Pench Tiger Reserve database successfully seeded!")

if __name__ == "__main__":
    seed_database()
