# FLOODLENS — Architectural & Project Decisions (DECISIONS.md)

**Project:** FloodLens (SIH26161)  
**Document Status:** Approved Master Record  
**Last Updated:** August 29, 2026  

---

## 1. Context & Purpose

This document serves as the single source of truth for architectural decisions, scoping boundaries, technology stack selections, and unresolved project decisions for the FloodLens project. It prevents scope creep, maintains scientific integrity, and ensures both developers (Saumil & Tanishk) share an identical understanding of the project.

---

## 2. Canonical Area of Interest (AOI) Decision

> [!IMPORTANT]
> **STATUS: PENDING DECISION**  
> The team must formally select and commit the primary canonical Area of Interest (AOI) before Phase 3 data preparation.

### AOI Selection Options & Evaluation Criteria

| Criteria | Option A: Indian Dam & District (Primary Candidate) | Option B: Bhotekoshi–Trishuli Catchment (Nepal) |
|---|---|---|
| **Role** | Canonical MVP Demo AOI | Retrospective Demonstration Case Study |
| **DEM Availability** | SRTM 30m / Copernicus DEM 30m (Freely available) | SRTM 30m (Freely available) |
| **Settlement Vector Data** | OpenStreetMap village nodes & administrative bounds | OpenStreetMap settlement nodes |
| **Hydraulic Geometry** | Public CWC / State Dam registry parameters | Published literature parameters (GLOF / Landslide dam) |
| **Presentation Label** | "Primary Dam-Break Inundation Scenario" | "Retrospective Case Study — Not a Live Prediction" |

**Required Action Before Phase 3:** Select a specific named Indian dam and downstream district (e.g., Machhu II dam / Rajkot district or Idukki dam / Periyar catchment), verify 30m DEM raster coverage, verify OSM village node density, and record the exact bounding box in `docs/DECISIONS.md`.

---

## 3. Physical & Scientific Model Scope Boundaries

To prevent "AI-washing" and maintain total honesty with hackathon evaluators, all system components must adhere strictly to these classification boundaries across UI labels, documentation, and code.

| Classification | Meaning in FloodLens | Features Assigned to this Category |
|---|---|---|
| **Implemented** | Real computation running natively in Python on DEM raster | **Level 1 Solver:** Raster cellular flow-routing / diffusive wave model reading DEM and Manning's roughness. Sub-minute execution. |
| **Planned** | Physically real model formulation, planned for advanced phase | **Level 2 Solver:** 2D Shallow Water Equations (SWE) mass & momentum conservation solver with CFL condition time-stepping. |
| **Adapter** | Software adapter loading precomputed/offline outputs or small-domain demo | **Level 3 Delft3D Adapter:** Parser for offline NetCDF (`trim-*.nc`) datasets.<br>**Level 3 SPH Adapter:** Small-domain 2D near-field dam-break-in-a-box particle hydrodynamics demo. |
| **Demo / Mock** | Representative data / static GeoJSON approximations for offline UI presentation | Satellite Earth Engine validation overlays, Nepal retrospective case study pre-baked layers, synthetic fallback demo data. |
| **Decision Support** | Rule-based classifier mapping simulated flood extent to risk tiers | **Early Warning Engine:** Threshold-based categorization (Advisory, Watch, Warning, Critical) based on depth, velocity, and arrival time. |

---

## 4. Technology Stack Decisions

### 4.1 Frontend Framework
- **Framework:** React + Vite + TypeScript.
- **Mapping Library:** MapLibre GL JS (Open-source vector/raster rendering, no vendor API key lock-in).
- **Styling:** Vanilla CSS / CSS Modules with custom design system tokens (Dark Navy canvas `#0B1220` for maps, light high-contrast surfaces for forms).
- **State & Data Fetching:** Zustand for global client UI state; typed service abstraction (`services/api/*`) consuming local mock modules (`data/mock/*`) in Demo Mode or FastAPI HTTP backend.

### 4.2 Backend & Scientific Stack
- **API Framework:** Python 3.10+ with FastAPI (Async REST routes, Pydantic schemas, auto-generated OpenAPI docs).
- **Raster GIS:** `rasterio`, `rioxarray`, `scipy.ndimage`.
- **Vector GIS & Spatial Operations:** `geopandas`, `shapely`, `pyproj`.
- **Numerical Solvers:** `numpy`, `numba` (for vectorized raster loop performance).

### 4.3 Database & Storage
- **Database:** PostgreSQL + PostGIS extension.
- **Storage Strategy:** PostGIS handles spatial joins (village point-in-polygon, buffer queries, scenario metadata). Large GeoTIFF rasters reside on local file storage, referenced by URI path in the database. Blobs are NEVER stored in Postgres columns.

---

## 5. System Data Spine & Interface Contract

All hydraulic solvers (Level 1, Level 2) and external adapters (Delft3D NetCDF, SPH near-field demo) **MUST** implement a single standardized output interface contract: `StandardGridResult`.

$$\text{StandardGridResult} = \{\text{depth}(x,y,t),\ \text{velocity}(x,y,t),\ \text{arrival\_time}(x,y),\ \text{grid\_meta}\}$$

This architecture decouples the scientific computation layer from the GIS, Early Warning, Backend, and Frontend layers. Replacing or upgrading a solver requires ZERO changes to downstream GIS or UI code.

---

## 6. Team Work Distribution Boundaries

- **Saumil (Backend / GIS / Simulation Lead):** Owns `backend/`, `simulation/`, `gis/`, `data/`, `scripts/`, `tests/backend/`. Responsible for Phase 3 (Data), Phase 4 (Level 1 Solver), Phase 5 (GIS Exposure), Phase 6 (FastAPI), Phase 11 (Adapters), Phase 13 (Validation).
- **Tanishk (Frontend / UX / Product Lead & Repo Owner):** Owns `frontend/`, `docs/`, `data/mock/`, `tests/frontend/`. Responsible for Phase 2 (Frontend setup), Phase 7 (App Shell & Wizard), Phase 8 (MapLibre Map), Phase 9 (Impact UI), Phase 12 (Comparison UI), Phase 15 (Polish).
- **Shared Coordination:** Phase 0/1 (Docs), Phase 10 (Early Warning Logic), Phase 14 (E2E Integration Test).

---

## 7. Git Workflow Rules

1. `main` branch is protected and must remain buildable and demo-ready at all times.
2. Development occurs on short-lived feature branches: `feature/<feature-name>`.
3. Pull Requests require review by the alternate developer before merging.
4. Schema and interface contract edits (`docs/API.md`, Pydantic models, TS types) require explicit chat confirmation prior to modification.
