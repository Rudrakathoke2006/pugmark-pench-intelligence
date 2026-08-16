# 🌿 PUGMARK — Pench Tiger Reserve Biodiversity Intelligence

> **From SD Card to Species Intelligence — 100% Offline, CPU-Only, No Guesswork.**  
> *Built for Manthan 4 Yuva — Forest & Wildlife Theme*

---

## 🌟 Overview

**PUGMARK** is an offline-first biodiversity intelligence platform built specifically for field officers and range staff at Pench Tiger Reserve. It ingests raw camera trap SD card folders or video footage, filters out empty vegetation triggers, localizes tiger flanks, re-identifies individual tigers using classical SIFT stripe pattern vector matching, and recomputes metric home ranges (95% KDE & 50% core utilization areas) projected in UTM Zone 44N (EPSG:32644).

---

## ✨ Key Features

- 🌿 **GBIF-Inspired Light Forest UI**: Clean, accessible frontend modeled after the Global Biodiversity Information Facility with plain-language confidence signals.
- ⚡ **27x Speedup Video Keyframe Extraction**: OpenCV POS_FRAMES keyframe sampling for rapid tiger video ingestion.
- 🐾 **MegaDetector V6 3-State Triage**: 3-way decision logic (`KEEP`, `REVIEW`, `QUARANTINE`) to prevent false-negative tiger loss while suppressing false triggers.
- 🐅 **SIFT FLANN Open-Set Re-ID**: Classical SIFT keypoint vector matcher with visual alignment canvas overlay.
- 🗺️ **UTM Zone 44N GIS Spatial Range Engine**: Metric 95% KDE utilization boundaries, 50% core activity areas, minimum convex polygon (MCP), and territory overlap matrices.
- 🚨 **Rule-Based Movement Alerts**: Boundary alerts, centroid range shifts, new camera trap detections, and survey artefact suppression.
- 🛡️ **100% Offline Safe**: Operates entirely on CPU laptops with zero external CDN, map tile, or GPU dependencies.

---

## 🏗️ Architecture & Pipeline Stages

```
Raw Media (SD Card / Video / ZIP)
  │
  ├── 1. Hygiene & Ingestion (Manifest, timestamp correction)
  ├── 2. MegaDetector V6 Blank Filter (3-state triage: Keep / Review / Quarantine)
  ├── 3. YOLOv8n-ATRW Tiger Flank Localizer
  ├── 4. OpenCV SIFT + FLANN LNBNN Re-ID Matcher
  ├── 5. ML-Assisted Human Review Queue (SIFT keypoint vector connector canvas)
  ├── 6. UTM Zone 44N 2D Gaussian KDE Occupancy Engine (95% & 50% polygons)
  └── 7. Explainable Spatial Deviation Alerting & Audit Logging
```

---

## 🚀 Quickstart Guide

### Prerequisites
- Python 3.10+
- Node.js 18+

### 1. Backend Setup (FastAPI & SQLite / PostGIS)
```bash
# Clone the repository
git clone https://github.com/Rudrakathoke2006/pugmark-pench-intelligence.git
cd pugmark-pench-intelligence

# Install Python dependencies
pip install fastapi uvicorn sqlalchemy opencv-python numpy scipy shapely geopandas matplotlib

# Seed database and start FastAPI server
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```
- OpenAPI Docs available at `http://127.0.0.1:8000/docs`

### 2. Frontend Setup (React & Vite)
```bash
cd frontend
npm install
npm run dev
```
- Web Application available at `http://localhost:3000`

---

## 📄 License & Disclaimers

- **Honesty Anchor**: Pipeline and UI mechanics demonstrated end-to-end on synthetic / ATRW baseline data pending organizer-provided Pench field data for re-ID accuracy validation.
- Built for **Manthan 4 Yuva — Forest & Wildlife Theme**.
