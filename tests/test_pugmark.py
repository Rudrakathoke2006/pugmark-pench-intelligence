import pytest
import os
import sys
from pathlib import Path
from datetime import datetime, timedelta, date
import numpy as np
import cv2

# Insert project root directory into sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Pipeline Service & ML module imports
from backend.services.ingestion.hygiene import build_manifest, apply_staff_correction, sha256_of
from ml.blank_filter.megadetector import BlankFilter
from ml.detector.tiger_detector import TigerDetector
from ml.reid.sift_matcher import StripeMatcher
from ml.gis.occupancy import compute_occupancy, compute_overlap
from ml.gis.alerts import check_range_shift, check_new_station, check_buffer_movement, check_prolonged_absence
from backend.services.smart_export import generate_smart_csv, generate_smart_geojson
from backend.services.capture_events import group_images_into_events, aggregate_event_reid_score
from backend.services.accuracy_metrics import compute_accuracy_metrics
from backend.services.station_health import evaluate_station_health
from backend.services.report_generator import generate_field_summary_report
from backend.services.gis_zones import latlon_to_utm_meters, utm_meters_to_latlon, setup_pench_zones

# Legacy / Integration service imports
from backend.services.ingestion import validate_timestamps
from backend.services.triage import triage_service
from backend.services.reid import reid_service
from backend.services.gis import latlon_to_utm_meters as legacy_latlon_to_utm, compute_kde_contours
from backend.services.alerts import alert_engine

def test_pipeline_1_hygiene_and_manifest(tmp_path):
    img_a = tmp_path / "frame_001.jpg"
    img_b = tmp_path / "frame_002.jpg"

    dummy = np.zeros((100, 100, 3), dtype=np.uint8)
    cv2.imwrite(str(img_a), dummy)
    cv2.imwrite(str(img_b), dummy)

    manifest = build_manifest(tmp_path, station_id="ST-01")
    assert len(manifest) == 2
    assert manifest[0]["station_id"] == "ST-01"
    assert manifest[0]["sha256"] != ""

    corrected = apply_staff_correction(manifest, timedelta(hours=3))
    assert corrected[0]["corrected_timestamp"] == corrected[0]["original_timestamp"] + timedelta(hours=3)

def test_pipeline_2_blank_filter(tmp_path):
    bf = BlankFilter()
    blank_img = tmp_path / "blank_grass.jpg"
    cv2.imwrite(str(blank_img), np.zeros((100, 100, 3), dtype=np.uint8))

    res = bf.classify("img_01", str(blank_img))
    assert res.decision in ["keep", "review", "quarantine"]
    assert res.animal_conf >= 0.0

def test_pipeline_3_tiger_detector(tmp_path):
    detector = TigerDetector()
    sample_img = tmp_path / "tiger_sample.jpg"
    cv2.imwrite(str(sample_img), np.zeros((300, 400, 3), dtype=np.uint8))

    crop = detector.detect_and_crop("img_01", str(sample_img), str(tmp_path / "crops"))
    assert crop is not None
    assert crop.image_id == "img_01"
    assert os.path.exists(crop.crop_path)

def test_pipeline_4_sift_reid_matcher(tmp_path):
    matcher = StripeMatcher()
    crop_a = tmp_path / "crop_a.jpg"
    crop_b = tmp_path / "crop_b.jpg"

    img = np.zeros((300, 400), dtype=np.uint8)
    for x in range(30, 370, 30):
        cv2.line(img, (x, 10), (x+10, 290), 255, 10)

    cv2.imwrite(str(crop_a), img)
    cv2.imwrite(str(crop_b), img)

    matcher.enroll("T-017", str(crop_b))
    res = matcher.match(str(crop_a))

    assert res.decision in ["auto_match", "human_review", "auto_enroll"]
    assert res.score >= 0.0

def test_pipeline_5_and_6_gis_occupancy_and_overlap():
    pts = [(21.685, 79.312), (21.692, 79.325), (21.671, 79.301), (21.660, 79.288)]
    occ = compute_occupancy(pts)

    assert occ.kde95_area_km2 > 0
    assert occ.kde50_area_km2 > 0
    assert occ.kde95_area_km2 >= occ.kde50_area_km2
    assert occ.centroid[0] > 0

    overlap_km2, overlap_pct = compute_overlap(occ.kde95_polygon, occ.kde50_polygon)
    assert overlap_km2 >= 0
    assert 0.0 <= overlap_pct <= 100.0

def test_pipeline_7_deviation_alerts():
    alert_shift = check_range_shift((21.685, 79.312), (21.618, 79.251), "buffer", 45.0, 50.0)
    assert alert_shift is not None
    assert alert_shift.alert_type == "range_shift"

    hist_st = {"ST-01", "ST-02"}
    curr_st = {"ST-01", "ST-02", "ST-09"}
    install_dates = {"ST-09": date(2026, 8, 10)}
    prev_end = date(2026, 8, 1)

    alerts_st = check_new_station(hist_st, curr_st, install_dates, prev_end)
    assert len(alerts_st) == 1
    assert alerts_st[0].is_survey_artefact == True

    alert_absent = check_prolonged_absence(date(2026, 6, 1), date(2026, 8, 15), [10, 15])
    assert alert_absent is not None
    assert alert_absent.alert_type == "prolonged_absence"

def test_gis_projection_roundtrip():
    lat_orig, lon_orig = 21.6852, 79.3120
    x, y = latlon_to_utm_meters(lat_orig, lon_orig)
    lat_reconv, lon_reconv = utm_meters_to_latlon(x, y)

    # Assert accuracy within 0.0001 degrees (~10 meters)
    assert abs(lat_orig - lat_reconv) < 1e-4
    assert abs(lon_orig - lon_reconv) < 1e-4

def test_pench_zone_setup():
    setup_pench_zones()
    # Verify zone setup executes without errors

def test_capture_event_grouping():
    now = datetime(2026, 8, 16, 8, 0, 0)
    img_records = [
        {"image_id": "img1", "station_id": "ST-01", "timestamp": now},
        {"image_id": "img2", "station_id": "ST-01", "timestamp": now + timedelta(seconds=20)},
        {"image_id": "img3", "station_id": "ST-01", "timestamp": now + timedelta(minutes=5)},
    ]
    events = group_images_into_events(img_records, max_gap_seconds=60)
    assert len(events) == 2
    assert events[0]["image_count"] == 2
    assert events[1]["image_count"] == 1

def test_accuracy_metrics_computation():
    imgs = [{"blank_decision": "KEEP"}, {"blank_decision": "QUARANTINE"}]
    idents = [{"decision": "AUTO-MATCH", "review_status": "CONFIRMED"}]
    logs = [{"stage": "Stage 1", "operator_override": False}]

    res = compute_accuracy_metrics(imgs, idents, logs)
    assert "blank_filter" in res
    assert "reid_breakdown" in res
    assert res["reid_breakdown"]["top1_accuracy"] == 1.0

def test_station_health_evaluation():
    stations = [{"station_id": "ST-01", "name": "Main Gate", "zone": "Core"}]
    imgs = [{"station_id": "ST-01", "original_timestamp": datetime.utcnow() - timedelta(days=20)}]

    health = evaluate_station_health(stations, imgs)
    assert len(health) == 1
    assert health[0]["status"] == "SILENT/MALFUNCTIONING"

def test_field_report_generation():
    html = generate_field_summary_report({"tigers": [], "alerts": []})
    assert "PUGMARK" in html
    assert "Pench Tiger Reserve" in html

def test_smart_interoperability_export():
    sightings = [
        {
            "identification_id": "ID-001",
            "tiger_id": "T-017",
            "tiger_name": "T-017 (Pench Queen)",
            "station_id": "ST-01",
            "station_name": "Main Core ST-01",
            "latitude": 21.685,
            "longitude": 79.312,
            "timestamp": "2026-08-16 08:00:00",
            "match_score": 0.92,
            "decision": "AUTO-MATCH"
        }
    ]
    csv_str = generate_smart_csv(sightings)
    assert "Observation_ID" in csv_str
    assert "T-017" in csv_str

    geojson_str = generate_smart_geojson(sightings, [])
    assert "FeatureCollection" in geojson_str

def test_legacy_validation_helpers():
    now = datetime.now()
    t_list = [now, now + timedelta(minutes=5), now - timedelta(minutes=15)]
    res = validate_timestamps(t_list)
    assert len(res) == 3
    assert res[2]["is_flagged"] == True
