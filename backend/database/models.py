from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from .connection import Base

class Station(Base):
    __tablename__ = "stations"

    station_id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    installation_date = Column(DateTime, nullable=False)
    removal_date = Column(DateTime, nullable=True)
    zone = Column(String, default="Core")
    status = Column(String, default="Active")

class ReserveZone(Base):
    __tablename__ = "reserve_zones"

    zone_id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    zone_type = Column(String, nullable=False)  # core, buffer, village_adjacent
    polygon_geojson = Column(Text, nullable=False)

class IngestionRun(Base):
    __tablename__ = "ingestion_runs"

    run_id = Column(String, primary_key=True, index=True)
    station_id = Column(String, ForeignKey("stations.station_id"), nullable=True)
    survey_cycle = Column(String, nullable=False)
    operator = Column(String, default="Field Team Alpha")
    total_images = Column(Integer, default=0)
    kept_images = Column(Integer, default=0)
    quarantined_images = Column(Integer, default=0)
    privacy_images = Column(Integer, default=0)
    timestamp_correction_notes = Column(Text, nullable=True)
    location_source = Column(String(32), default="real")  # real, synthetic
    content_source = Column(String(32), default="real")   # real, atrw, ai_generated
    created_at = Column(DateTime, default=datetime.utcnow)

class ImageRecord(Base):
    __tablename__ = "images"

    image_id = Column(String, primary_key=True, index=True)
    run_id = Column(String, ForeignKey("ingestion_runs.run_id"), nullable=False)
    station_id = Column(String, ForeignKey("stations.station_id"), nullable=True)
    file_path = Column(String, nullable=False)
    sha256 = Column(String, index=True)
    phash = Column(String, nullable=True)
    original_timestamp = Column(DateTime, nullable=False)
    corrected_timestamp = Column(DateTime, nullable=False)
    is_timestamp_flagged = Column(Boolean, default=False)
    blank_decision = Column(String, default="KEEP")  # KEEP, REVIEW, QUARANTINE, PRIVACY
    animal_confidence = Column(Float, default=0.0)
    person_confidence = Column(Float, default=0.0)
    vehicle_confidence = Column(Float, default=0.0)
    duplicate_of = Column(String, nullable=True)

class Detection(Base):
    __tablename__ = "detections"

    detection_id = Column(String, primary_key=True, index=True)
    image_id = Column(String, ForeignKey("images.image_id"), nullable=False)
    bbox_x = Column(Float, nullable=False)
    bbox_y = Column(Float, nullable=False)
    bbox_w = Column(Float, nullable=False)
    bbox_h = Column(Float, nullable=False)
    confidence = Column(Float, nullable=False)
    species = Column(String, default="Tiger")
    crop_path = Column(String, nullable=True)
    model_version = Column(String, default="yolov8n-tiger-v1.0")

class Tiger(Base):
    __tablename__ = "tigers"

    tiger_id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    sex = Column(String, default="Unknown")  # Male, Female, Unknown
    life_stage = Column(String, default="Adult")  # Adult, Sub-adult, Cub
    first_seen = Column(DateTime, default=datetime.utcnow)
    last_seen = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="Active")
    reference_image_url = Column(String, nullable=True)

class Identification(Base):
    __tablename__ = "identifications"

    identification_id = Column(String, primary_key=True, index=True)
    detection_id = Column(String, ForeignKey("detections.detection_id"), nullable=False)
    tiger_id = Column(String, ForeignKey("tigers.tiger_id"), nullable=True)
    match_score = Column(Float, default=0.0)
    decision = Column(String, nullable=False)  # AUTO-MATCH, HUMAN-REVIEW, NEW-CANDIDATE
    review_status = Column(String, default="CONFIRMED")  # PENDING, CONFIRMED, REJECTED, ENROLLED
    reviewer = Column(String, nullable=True)
    candidate_scores_json = Column(Text, nullable=True)

class OccupancyRun(Base):
    __tablename__ = "occupancy_runs"

    run_id = Column(String, primary_key=True, index=True)
    tiger_id = Column(String, ForeignKey("tigers.tiger_id"), nullable=False)
    computed_at = Column(DateTime, default=datetime.utcnow)
    kde_bandwidth = Column(Float, default=0.015)
    kde95_area_km2 = Column(Float, nullable=False)
    kde50_area_km2 = Column(Float, nullable=False)
    mcp_area_km2 = Column(Float, nullable=False)
    centroid_lat = Column(Float, nullable=False)
    centroid_lon = Column(Float, nullable=False)
    kde95_geojson = Column(Text, nullable=False)
    kde50_geojson = Column(Text, nullable=False)
    mcp_geojson = Column(Text, nullable=False)
    observation_count = Column(Integer, default=0)

class TerritoryOverlap(Base):
    __tablename__ = "territory_overlaps"

    overlap_id = Column(String, primary_key=True, index=True)
    tiger_a_id = Column(String, ForeignKey("tigers.tiger_id"), nullable=False)
    tiger_b_id = Column(String, ForeignKey("tigers.tiger_id"), nullable=False)
    overlap_area_km2 = Column(Float, nullable=False)
    overlap_pct = Column(Float, nullable=False)
    computed_at = Column(DateTime, default=datetime.utcnow)

class Alert(Base):
    __tablename__ = "alerts"

    alert_id = Column(String, primary_key=True, index=True)
    tiger_id = Column(String, ForeignKey("tigers.tiger_id"), nullable=False)
    alert_type = Column(String, nullable=False)  # RANGE_SHIFT, NEW_STATION, BUFFER_MOVEMENT, PROLONGED_ABSENCE
    severity = Column(String, default="MEDIUM")  # LOW, MEDIUM, HIGH
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    evidence_json = Column(Text, nullable=False)
    is_survey_artefact = Column(Boolean, default=False)
    is_acknowledged = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class DecisionLog(Base):
    __tablename__ = "decision_logs"

    log_id = Column(String, primary_key=True, index=True)
    stage = Column(String, nullable=False)  # Stage 0, Stage 1, Stage 2, Stage 3/4, Stage 6, Stage 7
    input_ref = Column(String, nullable=False)
    output = Column(String, nullable=False)
    confidence = Column(Float, default=1.0)
    threshold = Column(Float, default=0.0)
    reason = Column(Text, nullable=False)
    model_version = Column(String, default="pugmark-v1.0")
    operator_override = Column(Boolean, default=False)
    override_by = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class PipelineRunState(Base):
    __tablename__ = "pipeline_runs"

    run_id = Column(String, primary_key=True, index=True)
    station_id = Column(String, ForeignKey("stations.station_id"), nullable=True)
    current_stage = Column(String, default="1_INGESTION")  # 1_INGESTION, 2_BLANK_FILTER, 3_DETECTOR, 4_REID, 5_GIS, 6_OVERLAP, 7_ALERTS, COMPLETED, FAILED
    last_completed_image_id = Column(String, nullable=True)
    total_images = Column(Integer, default=0)
    processed_images = Column(Integer, default=0)
    status = Column(String, default="PENDING")  # PENDING, RUNNING, COMPLETED, FAILED, PAUSED
    error_count = Column(Integer, default=0)
    last_error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

