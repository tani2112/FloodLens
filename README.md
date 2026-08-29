# FloodLens

FloodLens is a hydrodynamic flood simulation and disaster management platform for modeling dam-break, natural river-blockage, and flash-flood scenarios using digital elevation models (DEM), GIS spatial data, and physics-based numerical solvers.

---

## 1. Project Purpose & Scope

Developed for the Smart India Hackathon (SIH26161), FloodLens models flood propagation, time-of-arrival, water depth, and flow velocities to compute settlement exposure and provide rule-based early warning decision support.

### Scientific Model Classification Status:
- **Level 1 (Implemented — Phase 4):** 2D cellular flow-routing / diffusive wave model reading DEM and Manning's roughness.
- **Level 2 (Planned):** Full 2D Shallow Water Equations (SWE) mass/momentum conservation solver.
- **Level 3 SPH Adapter (Adapter):** Near-field 2D SPH dam-break-in-a-box particle hydrodynamics demo.
- **Level 3 Delft3D Adapter (Adapter):** Ingestion parser for offline industry-standard Delft3D NetCDF (`trim-*.nc`) map datasets.
- **Early Warning:** Decision support alert categorization (Advisory, Watch, Warning, Critical).

---

## 2. Repository Structure

```
FloodLens/
├── docs/                      # Architectural & PRD master specifications
├── frontend/                  # React + Vite + TypeScript web application
│   ├── src/
│   │   ├── components/        # UI component tree
│   │   ├── pages/             # 15 Application route pages
│   │   ├── services/api/      # Service API client abstraction
│   │   ├── store/             # Zustand global state
│   │   └── types/             # TypeScript contract definitions
├── backend/                   # FastAPI REST API backend
│   ├── routers/               # Versioned REST endpoints
│   ├── schemas/               # Pydantic data contract schemas
│   ├── config.py              # Environment configuration
│   └── main.py                # FastAPI entry point
├── simulation/                # Hydrodynamic solver modules
│   ├── engine.py              # Abstract solver interface & StandardGridResult
│   ├── level1_diffusive.py    # Level 1 diffusive wave solver stub
│   ├── level2_swe.py          # Level 2 SWE solver stub
│   ├── delft3d_adapter.py     # Delft3D NetCDF adapter stub
│   └── sph_adapter.py         # SPH near-field adapter stub
├── gis/                       # Spatial analysis modules
│   ├── raster_to_vector.py    # Raster polygonizer stub
│   ├── exposure.py            # Spatial exposure analysis stub
│   └── warning_engine.py      # Early warning logic stub
├── data/                      # Spatial rasters & GeoJSON vector layers
├── scripts/                   # Data prep CLI & E2E verification scripts
├── .env.example               # Environment variables template
├── requirements.txt           # Python backend dependencies
└── README.md                  # Project documentation
```

---

## 3. Local Development Setup & Quickstart

### Current Phase: **Phase 2 Complete — Repository Development Shell Active**

### Prerequisites:
- Node.js (v18+) & `npm`
- Python (v3.10+) & `pip`

### Frontend Startup:
```bash
cd frontend
npm install
npm run dev
# App will start at http://localhost:5173
```

### Backend Startup:
```bash
# In repository root:
pip install -r requirements.txt
python -m backend.main
# API will start at http://localhost:8000 (Swagger docs at http://localhost:8000/docs)
```

---

## 4. Team Workflow & Ownership Boundaries

- **Saumil (Backend / GIS / Simulation Lead):** Owns `backend/`, `simulation/`, `gis/`, `data/`, `scripts/`.
- **Tanishk (Frontend / UX / Product Lead & Repo Owner):** Owns `frontend/`, `docs/`, `data/mock/`.
- **Git Branch Strategy:**
  - `main` branch remains protected and demo-ready at all times.
  - Features developed on `feature/<feature-name>` branches.
  - Contract files (`docs/API.md`, Pydantic models, TS types) modified only after joint developer review.
