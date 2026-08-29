# FLOODLENS — System Architecture Specification (ARCHITECTURE.md)

**Project:** FloodLens (SIH26161)  
**Document Status:** Approved Master Specification  
**Version:** 1.0.0  
**Date:** August 29, 2026  

---

## 1. Multi-Tier System Architecture

FloodLens enforces a strict 4-tier decoupled architecture. Science and hydrodynamic calculations are strictly segregated from web backend endpoints, database schemas, and frontend visualizers.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            1. FRONTEND TIER                                 │
│          React + Vite + TypeScript + MapLibre GL JS Map Engine              │
│       (App Shell, Wizard, Time-Slider, Layer Panel, Metric Cards)           │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTPS / JSON REST API
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            2. BACKEND TIER                                  │
│             FastAPI (Python 3.10+) + Async Background Workers               │
│       (Scenario CRUD, Run Orchestration, Exposure & Alert Endpoints)        │
└───────────────────┬─────────────────────────────────────┬───────────────────┘
                    │ SQL / PostGIS                       │ In-Process Call
                    ▼                                     ▼
┌──────────────────────────────────────┐  ┌───────────────────────────────────┐
│        DATABASE & STORAGE            │  │      3. SIMULATION TIER           │
│   PostgreSQL + PostGIS Extension     │  │ Native Python Solvers & Adapters  │
│  (Vector features, Spatial joins)    │  │ (Level 1/2, Delft3D/SPH Adapters) │
│   Local Disk Storage (GeoTIFFs)      │  └─────────────────┬─────────────────┘
└──────────────────────────────────────┘                    │
                                                            ▼
                                          ┌───────────────────────────────────┐
                                          │      StandardGridResult           │
                                          └─────────────────┬─────────────────┘
                                                            │
                                                            ▼
                                          ┌───────────────────────────────────┐
                                          │      4. GIS & RISK TIER           │
                                          │ Rasterio / GeoPandas / PostGIS    │
                                          │ Zonal Stats & Early Warning Rules │
                                          └───────────────────────────────────┘
```

---

## 2. StandardGridResult Interface Contract

`StandardGridResult` is the single authoritative contract between all simulation solvers (Level 1, Level 2, SPH adapter, Delft3D adapter) and downstream GIS, database, backend, and frontend modules.

### Python / Data Class Definition:
```python
from dataclasses import dataclass
from typing import List, Dict, Any
import numpy as np

@dataclass
class GridMetadata:
    crs: str                      # Coordinate Reference System, e.g., "EPSG:32644"
    transform: List[float]        # Affine transform coefficients [a, b, c, d, e, f]
    width: int                    # Number of grid columns
    height: int                   # Number of grid rows
    cell_size: float              # Grid cell size in meters (e.g., 30.0)
    origin_x: float               # X coordinate of top-left corner
    origin_y: float               # Y coordinate of top-left corner
    timesteps: List[float]        # Simulation time steps in minutes, e.g., [0.0, 5.0, 10.0, ...]
    nodata_value: float = -9999.0

@dataclass
class StandardGridResult:
    simulation_id: str
    grid_meta: GridMetadata
    
    # Dynamic 3D NumPy Arrays (shape: [num_timesteps, height, width])
    depth_array: np.ndarray       # Water depth in meters at each cell & timestep
    velocity_array: np.ndarray    # Flow velocity magnitude in m/s at each cell & timestep
    
    # Static 2D NumPy Array (shape: [height, width])
    arrival_time_array: np.ndarray # First arrival time in minutes (depth >= 0.1m)
    
    solver_name: str              # e.g., "Level1_Diffusive", "Delft3D_NetCDF_Adapter"
    solver_level: str             # "level1", "level2", "sph_adapter", "delft3d_adapter"
    execution_time_seconds: float
```

---

## 3. Database Schema Specification (PostgreSQL + PostGIS)

Large raster grids are saved to disk as compressed GeoTIFF stacks. PostGIS handles spatial geometries (study area bounding boxes, rivers, dams, village nodes, and exported inundation extent polygons).

```sql
-- Study Areas Table
CREATE TABLE study_areas (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    river VARCHAR(255) NOT NULL,
    dam_or_blockage VARCHAR(255) NOT NULL,
    dem_dataset VARCHAR(64) NOT NULL,
    bounds GEOMETRY(Polygon, 4326) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Scenarios Table
CREATE TABLE scenarios (
    id VARCHAR(64) PRIMARY KEY,
    study_area_id VARCHAR(64) REFERENCES study_areas(id),
    scenario_type VARCHAR(64) NOT NULL, -- 'dam_break', 'natural_blockage', 'glof'
    parameters JSONB NOT NULL,          -- breach width, formation time, initial level
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Simulation Runs Table
CREATE TABLE simulations (
    id VARCHAR(64) PRIMARY KEY,
    scenario_id VARCHAR(64) REFERENCES scenarios(id),
    model_level VARCHAR(64) NOT NULL,    -- 'level1', 'level2', 'sph_adapter', 'delft3d_adapter'
    status VARCHAR(32) NOT NULL,         -- 'pending', 'running', 'completed', 'failed'
    raster_output_path VARCHAR(512),
    execution_seconds FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Village Exposure Table
CREATE TABLE exposure_results (
    id SERIAL PRIMARY KEY,
    simulation_id VARCHAR(64) REFERENCES simulations(id),
    village_name VARCHAR(255) NOT NULL,
    village_location GEOMETRY(Point, 4326) NOT NULL,
    max_depth_m FLOAT NOT NULL,
    arrival_time_min FLOAT NOT NULL,
    exposed BOOLEAN NOT NULL,
    warning_level VARCHAR(32) NOT NULL  -- 'advisory', 'watch', 'warning', 'critical'
);

CREATE INDEX idx_exposure_sim_id ON exposure_results(simulation_id);
CREATE INDEX idx_exposure_geom ON exposure_results USING GIST(village_location);
```

---

## 4. Repository Structure & Module Architecture

```
FloodLens/
├── docs/                      # Architectural & PRD specifications
├── frontend/                  # React + Vite + TypeScript web application
│   ├── src/
│   │   ├── components/        # UI components (maps, layout, forms, charts, tables)
│   │   ├── pages/             # 15 Route pages
│   │   ├── services/api/      # Service abstraction (mock & REST fetchers)
│   │   ├── store/             # Zustand global state (draft wizard, settings)
│   │   └── types/             # TypeScript contract definitions
├── backend/                   # FastAPI backend server
│   ├── routers/               # REST API route handlers
│   ├── schemas/               # Pydantic request/response schemas
│   ├── models/                # SQLAlchemy / GeoAlchemy2 DB models
│   └── db.py                  # Postgres connection & engine initialization
├── simulation/                # Hydrodynamic solver modules
│   ├── engine.py              # Abstract solver interface & StandardGridResult
│   ├── level1_diffusive.py    # Native Level 1 diffusive wave solver
│   ├── level2_swe.py          # Native Level 2 2D SWE solver (planned)
│   ├── delft3d_adapter.py     # Delft3D NetCDF map file parser
│   └── sph_adapter.py         # Small-domain 2D SPH demo solver
├── gis/                       # Spatial analysis modules
│   ├── raster_to_vector.py    # Polygonizer & contour extractor
│   ├── exposure.py            # Point-in-polygon & zonal statistics
│   └── warning_engine.py      # Threshold decision tree logic
├── data/                      # AOI rasters & GeoJSON layers (.gitignore large files)
├── tests/                     # Unit, integration, & validation tests
└── scripts/                   # Data clipping & headless E2E test scripts
```

---

## 5. Module Ownership & Developer Separation

- **Saumil (Backend/GIS/Simulation Lead):** Responsible for `backend/`, `simulation/`, `gis/`, `data/`, `scripts/`, `tests/backend/`.
- **Tanishk (Frontend/UX/Product Lead):** Responsible for `frontend/`, `docs/`, `data/mock/`, `tests/frontend/`.
- **Interface Contract Safety:** Changes to `StandardGridResult` (`simulation/engine.py`), Pydantic schemas (`backend/schemas/`), or TypeScript contracts (`frontend/src/types/`) require mandatory pull request review by both developers.
