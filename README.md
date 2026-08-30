# FloodLens

**FloodLens** is a physics-informed hydrodynamic flood simulation, geospatial impact analysis, and decision-support platform designed for modeling dam-break, natural river-blockage, and severe inundation scenarios. It pairs a Level 1 2D diffusive-wave numerical solver with high-resolution Digital Elevation Models (DEM) and interactive MapLibre vector visualization.

---

## What FloodLens Does

- **Physics-Based Hydrodynamic Modeling:** Solves 2D surface water propagation over complex terrain elevation grids using finite-volume diffusive wave formulation.
- **Geospatial Impact Analysis:** Vectorizes inundation boundaries into GeoJSON layers to perform spatial exposure analysis against settlement boundaries and road corridors.
- **Temporal Analysis & Playback:** Tracks step-by-step hydrodynamic evolution (water depth, flow velocity, arrival time) with interactive scrubbers.
- **Decision-Support & Warning System:** Categorizes flood threat levels (Advisory, Watch, Warning, Critical) based on time-to-inundation and peak water depth thresholds.
- **Scenario Comparison:** Compares hydrological parameters and spatial outputs between different scenario runs with automatic percentage delta calculations.
- **Standardized GIS Exports:** Downloads vector inundation boundaries, temporal JSON trajectories, and structured exposure summaries.

---

## Architecture

```text
React + TypeScript + Vite (Frontend Web App)
             │
             ▼
      FastAPI REST API (Python Backend)
             │
             ├──────────────────────────┐
             ▼                          ▼
  SQLAlchemy / SQLite DB       GIS & Simulation Engine
  (Persistent Storage)         ├─ Level 1 2D Diffusive Wave Solver
                               ├─ Raster-to-Vector Polygonizer
                               ├─ Settlement & Road Exposure Analyzer
                               └─ Decision Support Engine
```

---

## Core Operational Workflow

```text
Study Area Selection (Idukki Canonical AOI)
       │
       ▼
Scenario Configuration (Breach Width, Reservoir Head, Manning n)
       │
       ▼
Model Selection (Level 1 2D Diffusive Wave)
       │
       ▼
Review & Confirmation
       │
       ▼
Simulation Engine Execution & Progress Tracking
       │
       ▼
Analytical Workspace
  ├── Overview (KPI Dashboard & Model Specs)
  ├── Map Explorer (MapLibre 2D Spatial Controls)
  ├── Results Analytics (Hydrodynamic KPIs & Mass Balance)
  ├── Impact Analytics (Settlement & Road Exposure)
  ├── Warning Center (Actionable Decision Support)
  ├── Scenario Comparison (Baseline vs Run B)
  └── GIS Dataset Export (GeoJSON & Timeline JSON)
```

---

## Supported Solvers & Models

- **Level 1 (Implemented & Active):** 2D cellular diffusive wave finite-volume solver operating on EPSG:32643 UTM metric projections and serving GeoJSON outputs in EPSG:4326.
- **Level 2 SWE (Planned):** Full 2D Shallow Water Equations mass and momentum solver (Adapter stub / future release).
- **SPH & Delft3D Adapters (Planned):** Particle hydrodynamics and Delft3D NetCDF map file ingestion adapters.

---

## Data Limitations & Scientific Guardrails

- **Demographic Data:** Census population numbers report `"Requires Census Dataset"` where demographic shapefiles are absent.
- **Infrastructure Data:** Critical infrastructure layers (power grids, hospitals) report `"Dataset Unavailable"` to preserve scientific integrity.
- **Export Formats:** GeoJSON and Timeline JSON are fully operational. Shapefiles (`.shp`), GeoTIFF rasters, and PDF reports are explicitly labeled `"Unavailable"` in the exporter.
- **Scenario Screening:** FloodLens outputs are designed for scenario screening and decision support, **not** engineering structural design or official government disaster declarations.

---

## Local Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+ & `npm`

### 1. Backend Setup
```bash
# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Initialize database schema and seed canonical Idukki AOI
python scripts/init_db.py

# Run FastAPI backend
python -m backend.main
# Server available at http://localhost:8000 (API Docs at http://localhost:8000/docs)
```

### 2. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Build or run development server
npm run dev
# Web app available at http://localhost:5173
```

---

## Docker Container Usage

To orchestrate the full stack locally via Docker Compose:

```bash
# Build and launch backend and frontend containers
docker-compose up --build

# Backend API: http://localhost:8000
# Frontend App: http://localhost:80
```

---

## Verification & Testing

### Backend Unit Test Suite
```bash
source venv/bin/activate
python -m unittest discover -s tests
```

### Frontend Production Build Test
```bash
cd frontend
npm run build
```

---

## Scientific Disclaimer

FloodLens is an analytical scenario screening tool. Simulation results represent model-derived outputs based on digital elevation rasters and specified hydraulic parameters. Users must independently verify geospatial outputs prior to operational emergency response deployment.
