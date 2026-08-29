# FLOODLENS — Master Plan for SIH26161
### Dam-Break Inundation Modelling — Architecture, PRD Summary & Phase-by-Phase Build Plan
Team: Saumil & Tanishk | Repo: `tani2112/FloodLens`

---

## 0. How to read this document

This is the single working reference for the team. It compresses the full architecture + PRD + roadmap into something you can actually execute against. Anything more detailed (API contracts, DB schema, per-page UI specs) should live in `docs/` as separate files once Phase 1 starts — this document tells you what those files should contain and in what order to write them.

Throughout: **"real"** = an actual physics/GIS computation happens. **"simplified"** = a real but reduced-order physical model. **"surrogate"** = a fast approximate model trained/tuned to mimic a slower one. **"synthetic"** = made-up but labeled data used to demonstrate the pipeline. We will never blur these categories in code, docs, or the demo script.

---

## 1. What SIH26161 actually requires

| Requirement | What it means | What 2 students can realistically do | What must NOT be claimed |
|---|---|---|---|
| A. Dam-break scenario simulation | Simulate the flood that results from a breach in a dam/embankment | Parametric breach model (width, depth, formation time) feeding a flood propagation solver | That it's calibrated against a real historical dam-break |
| B. SPH modelling | Smoothed Particle Hydrodynamics — Lagrangian particle-based fluid solver, good for breach/near-field turbulent flow | Implement or wrap a minimal 2D SPH demo (small-domain, near-breach) to show *why* SPH matters, not to model the whole valley | That our SPH code replaces a validated SPH package like DualSPHysics |
| C. Delft3D modelling | Industry-standard hydrodynamic solver (shallow water eqns, structured grid, widely used for dam-break/flood studies) | Build an **adapter architecture** that can ingest Delft3D-format output (or run a Delft3D case offline and load results) — not reimplement Delft3D | That FloodLens runs Delft3D live in the demo unless it genuinely does |
| D. Real-time GIS visualization | Map that updates as the flood evolves, spatially accurate | Time-stepped raster/vector layers rendered on a web map, played back like an animation | That we ingest live sensor/satellite feeds |
| E. Early warning | Convert simulation output into actionable alerts for villages | Rule/threshold-based classifier over depth/velocity/arrival-time per village | That this is a certified operational EWS |
| F. At-risk village identification | Spatial join between flood extent and settlement locations | GIS point-in-polygon / buffer analysis against a village dataset | That population figures are precise/official unless sourced |
| G. Software framework | Reusable, modular, not a one-off script | Clean separation: simulation engine / GIS engine / risk engine / API / frontend, each swappable | — |
| H. Scenario analysis | Compare "what if" breach scenarios | Store multiple runs, diff their outputs, visualize side-by-side | — |

**Minimum viable interpretation:** a working pipeline — DEM in, breach parameters in, a physically-reasoned (not full Navier-Stokes) flood propagation model out, GIS overlay, village exposure, rule-based warnings, all on one demo case.

**Advanced interpretation:** the above, plus a real (even if small/offline) SPH run and a real (even if precomputed) Delft3D case, both wired into the same GIS/warning pipeline through the adapter layer, plus scenario comparison and a validated toy case.

---

## 2. Data flow (system spine)

```
DEM (raster) ──────────────┐
River/reservoir geometry ──┤
Dam location + breach cfg ─┼──► SIMULATION ENGINE (Level 1/2/3) ──► depth(x,y,t), velocity(x,y,t), arrival_time(x,y)
Manning roughness ─────────┘                                              │
                                                                            ▼
                                                              GIS PROCESSING LAYER
                                                    (rasterize, reproject, polygonize, zonal stats)
                                                                            │
                                        ┌───────────────────────────────────┼───────────────────────────┐
                                        ▼                                   ▼                            ▼
                              Village/road/bridge                 Flood extent polygons          Depth/velocity/
                              exposure (spatial join)              per timestep                   arrival-time rasters
                                        │                                   │                            │
                                        ▼                                   ▼                            ▼
                                              RISK & EARLY-WARNING ENGINE (thresholds + spatial + temporal logic)
                                                                            │
                                                                            ▼
                                                          FASTAPI BACKEND (scenario store, run store, alerts)
                                                                            │
                                                                            ▼
                                          REACT + MAPLIBRE FRONTEND (time slider, layers, warnings, reports)
```

Everything above the "GIS Processing Layer" is science; everything below is software engineering. This separation is what lets you swap Level 1 → Level 2 → Level 3 solvers without touching the frontend.

---

## 3. Scientific architecture — 3 levels

### Level 1 — MVP solver (must work on a laptop, must ship)
- Governing idea: 2D shallow-water-inspired **simplified inundation model**, not a full SWE solver. Practical approach: raster **cellular flow-routing / diffusive wave model** — water depth added at breach cell, propagated to lower-elevation neighbors each timestep, attenuated by Manning's-n-based resistance. This is a defensible, published class of simplified flood-spreading model (similar in spirit to CA-based flood models), clearly *not* claimed to be full SWE.
- Inputs: DEM (raster), breach location, breach width, breach formation time, initial reservoir volume/level, uniform or zoned Manning's n.
- Outputs per timestep: depth grid, a derived velocity estimate (from depth gradient / continuity, approximate), arrival time grid (first time depth exceeds a threshold, e.g., 0.1 m).
- Explicitly label in UI and docs: **"Simplified inundation model (Level 1) — for demonstration, not for engineering design."**

### Level 2 — Advanced simulation (should build if time allows)
- A real 2D **shallow water equations** solver (mass + momentum conservation, not just diffusive routing), solved via finite-volume/finite-difference on the DEM grid, explicit time-stepping with CFL condition. Can be hand-written in Python/NumPy (vectorized) or use an existing lightweight open-source SWE solver as a library rather than reinventing one from scratch.
- This is the first level where velocity is a *real* solved quantity, not a proxy.
- Still your own code — still not Delft3D — but scientifically closer to it, and directly comparable in structure (same grid, same BCs) which matters for the adapter design.

### Level 3 — SPH & Delft3D integration (adapter, advanced/stretch)
**Delft3D:**
- Suitable for: full hydrodynamic modelling of rivers/estuaries/reservoirs, structured/curvilinear grids, well-validated in industry and by CWC/IIT groups in India.
- Realistic plan for 2 students: you will **not** install and run full Delft3D live during the hackathon demo (licensing, setup time, compute). Instead: (a) build a **Delft3D adapter** that can parse actual Delft3D output formats (NetCDF, typically `trim-*.nc` / `.dat` map files) into FloodLens's internal grid format, and (b) if time allows, run one small precomputed Delft3D case offline (or use a published sample dataset) and load its output through the adapter as a "Level 3 verified run" alongside your own Level 1/2 runs for comparison. This is honest, demonstrable, and shows you understand the real tool.

**SPH:**
- Suitable for: near-field breach dynamics, turbulent free-surface flow, situations where the grid-based SWE assumption breaks down (very short-range, high-momentum breach jet). Not suitable/efficient for simulating an entire valley over kilometers.
- Realistic plan: implement a **minimal 2D SPH demo** (dam-break-in-a-box classic validation case — e.g., a column of water collapsing) using a small, well-known algorithm (density/pressure via kernel summation, Tait equation of state, leapfrog integration). Scope it to a small domain (few hundred particles) purely to (a) prove you understand SPH, (b) visually contrast the near-field breach jet against the SWE far-field spread, and (c) feed a *qualitative* near-field breach velocity/momentum estimate into the SWE model's boundary condition as an enhancement. It is **not** the main valley-scale solver.

**Adapter architecture (this is the actual deliverable, whether or not real Delft3D/SPH runs happen):**
```
SimulationEngine (abstract interface)
  ├── Level1DiffusiveModel      (native Python, always available)
  ├── Level2ShallowWaterModel   (native Python, stretch goal)
  ├── SPHAdapter                (wraps a small native/open-source SPH run, near-field only)
  └── Delft3DAdapter            (parses NetCDF/map files from an offline Delft3D run)

All adapters implement: run(config) -> StandardGridResult{depth, velocity, arrival_time, grid_meta}
```
Every solver, real or simplified, returns the **same standardized result object**, so GIS/risk/frontend code never needs to know which one ran. This is the single most important architectural decision in the project — build it in Phase 4, not later.

Core physical parameters to define regardless of level: breach width & formation time, initial water level/volume, Manning's n (roughness), DEM resolution & extent, time step (CFL-constrained), total simulated duration, boundary conditions (open/closed edges of domain).

---

## 4. GIS architecture

| Data type | Format | Where used |
|---|---|---|
| DEM / terrain | GeoTIFF | Simulation grid, hillshade basemap |
| Depth / velocity / arrival-time rasters | GeoTIFF (per timestep or as a time-indexed stack) | Map overlays, zonal stats |
| Rivers, dam location, roads, admin boundaries | GeoJSON / Shapefile → convert to GeoJSON for web | Frontend vector layers |
| Villages, bridges, points of interest | GeoJSON / CSV with lat-lon | Exposure analysis, markers |
| Flood extent per timestep | GeoJSON polygon (derived from raster via polygonize) | Frontend animated overlay |
| Scientific model NetCDF (Delft3D-style) | NetCDF | Only inside the Delft3D adapter, converted to internal grid before reaching GIS layer |
| Simulation run metadata, exposure results | CSV / JSON / Postgres rows | API responses, reports |

Rule of thumb: **rasters for continuous fields (depth/velocity/arrival-time/DEM), vectors for discrete features (villages/roads/bridges/extent polygons)**. Raster→vector (polygonize) only at the flood-extent boundary, for fast web rendering.

---

## 5. Data strategy (MVP-honest)

| Data | Source (realistic) | Required for MVP? | Can be synthetic? |
|---|---|---|---|
| DEM | Open sources such as SRTM (30m) / Bhoonidhi / Copernicus DEM for a real Indian catchment | Yes | No — use real DEM, it's freely available |
| Dam/reservoir location & rough capacity | Public CWC/State dam data or a chosen real dam for the demo AOI | Yes | Location real, exact breach hydraulics synthetic |
| River geometry | Derived from DEM (flow accumulation) or OpenStreetMap rivers | Yes | Partially |
| Villages | OpenStreetMap places / Census village locations for the chosen district | Yes | No — use real names/locations, invented population if unavailable, and label it as such |
| Roads/bridges | OpenStreetMap | Yes (roads), Optional (bridges) | No |
| Population/infrastructure | Census/OSM if available, otherwise clearly-labeled placeholder | Optional | Yes, if labeled "illustrative" |
| Rainfall/weather | Not required for a dam-break scenario | No | — |
| Breach parameters | Literature-typical values (breach width as fraction of dam length, formation time 0.1–1 hr per empirical dam-break literature ranges) | Yes | Parameterized/synthetic scenario, physically reasoned |

Pick **one real district + one real (named, but hypothetically breached) dam** as your canonical demo AOI early — this anchors all later data work.

---

## 6. System architecture

**Frontend:** React + Vite + TypeScript + MapLibre GL JS (open-source, no vendor lock-in, good raster+vector support, free).
**Backend:** Python + FastAPI (async, auto-generated OpenAPI docs, easy to pair with scientific Python stack).
**Scientific computing:** NumPy/SciPy (solver core), GeoPandas/Shapely/PyProj (vector GIS), Rasterio (raster GIS) — the standard, justified stack; no exotic dependencies.
**Database:** PostgreSQL + PostGIS — justified because you have real spatial joins (village-in-flood-polygon, distance-to-river) that PostGIS does far better and more credibly than ad-hoc Python loops; also demonstrates GIS maturity to evaluators.
**Background jobs:** simple in-process async task (FastAPI `BackgroundTasks`) is enough for MVP; only add Celery/Redis if simulation runtime becomes long enough to need a real job queue (unlikely to be necessary for the hackathon scope — treat as Future).
**File storage:** local disk / object storage for rasters, referenced by path in Postgres — do not put raster blobs in the DB.

```
┌────────────┐   HTTPS/JSON   ┌───────────────┐   SQL/PostGIS   ┌──────────────┐
│  Frontend  │◄──────────────►│   FastAPI     │◄───────────────►│  PostgreSQL  │
│ React+MapLibre               │   Backend     │                 │  + PostGIS   │
└────────────┘                 └──────┬────────┘                 └──────────────┘
                                       │ calls
                                       ▼
                         ┌─────────────────────────┐
                         │  Simulation Engine       │
                         │  (Level1/2 + SPH/Delft3D │
                         │   adapters, standard I/O)│
                         └──────────┬──────────────┘
                                    ▼
                         ┌─────────────────────────┐
                         │  GIS Processing Layer    │
                         │  (rasterio/geopandas)    │
                         └──────────┬──────────────┘
                                    ▼
                         ┌─────────────────────────┐
                         │  Risk / Early-Warning    │
                         │  Engine                  │
                         └─────────────────────────┘
```

---

## 7. Repository structure

```
FloodLens/
├── frontend/                 # React + Vite app
├── backend/                  # FastAPI app: routers, services, schemas
├── simulation/                # Level1/2 solvers + SPH & Delft3D adapters, all sharing StandardGridResult
├── gis/                       # raster/vector processing, exposure analysis, risk engine
├── data/                      # DEM, villages, dam geometry, sample runs (gitignore large rasters, use data/README to document sourcing)
├── docs/                      # PRD.md, ARCHITECTURE.md, SCIENTIFIC_MODEL.md, DATA_SOURCES.md, GIS.md,
│                              # EARLY_WARNING.md, API.md, VALIDATION.md, TEAM_WORKFLOW.md, DEMO_SCENARIO.md, DECISIONS.md
├── tests/                     # unit + integration tests, mirroring backend/simulation/gis structure
├── scripts/                   # one-off data prep / DEM clipping / demo-seed scripts
├── configs/                   # scenario config templates (YAML/JSON), model parameters
└── README.md
```

---

## 8. Phase-by-phase implementation roadmap

> Each phase lists Objective · Prerequisites · Tasks · Files · Tech · DoD (Definition of Done) · Don't-build-yet.

**Phase 0 — Project preparation**
Objective: lock scope, AOI, and vocabulary before any code.
Tasks: pick demo AOI (real district + real dam), agree on Level 1/2/3 vocabulary, write one paragraph "what we will and won't claim."
Files: `docs/DECISIONS.md`.
DoD: both teammates can explain the project in 60 seconds without contradicting each other.
Don't build yet: anything.

**Phase 1 — Architecture + documentation**
Objective: turn this master plan into repo docs.
Tasks: write `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/SCIENTIFIC_MODEL.md` (condense Section 3 above), `docs/DATA_SOURCES.md`.
Tech: Markdown only.
DoD: a stranger can read `docs/` and understand the whole system.
Don't build yet: code.

**Phase 2 — Repository + dev environment**
Objective: working skeleton repo both can run.
Tasks: create repo structure (Section 7), `backend/` FastAPI hello-world, `frontend/` Vite React hello-world, `.gitignore` for large data files, `requirements.txt`/`package.json`, README with setup steps.
DoD: both teammates can `git clone` and run frontend+backend locally in under 10 minutes.
Common mistake: committing large DEM/raster files to git — use `data/README.md` + a download script instead.

**Phase 3 — Data pipeline**
Objective: get real DEM + village + river + dam data into `data/` for the chosen AOI.
Tasks: download DEM (clip to AOI), fetch OSM villages/roads/rivers for AOI, digitize/mark dam location, write `scripts/prepare_data.py` to reproject everything to one CRS and clip to a common extent.
Files: `data/dem.tif`, `data/villages.geojson`, `data/rivers.geojson`, `data/dam.geojson`, `scripts/prepare_data.py`.
DoD: one command reproduces the clipped, reprojected dataset from raw downloads.

**Phase 4 — Core simulation engine (Level 1)**
Objective: the actual scientific heart of the project.
Prerequisites: Phase 3 data ready.
Tasks: implement `StandardGridResult` interface, implement Level 1 diffusive/CA-based flood spreading model reading the real DEM, unit-test on a synthetic bowl-shaped DEM (water should pool correctly, mass roughly conserved).
Files: `simulation/engine.py` (abstract interface), `simulation/level1_diffusive.py`, `tests/simulation/test_level1.py`.
DoD: given a breach config + DEM, produces depth/velocity/arrival-time arrays for at least 10 timesteps on the real AOI DEM in under ~1 minute on a laptop.
Don't build yet: SPH, Delft3D, frontend.

**Phase 5 — GIS processing**
Objective: turn raw grid output into map-ready layers and exposure numbers.
Prerequisites: Phase 4 produces `StandardGridResult`.
Tasks: raster→polygon extraction per timestep, zonal stats (max depth per village buffer), point-in-polygon exposure for villages/roads/bridges, reprojection helpers.
Files: `gis/raster_to_vector.py`, `gis/exposure.py`, `tests/gis/`.
DoD: given one simulation run, produces a table of {village, max_depth, arrival_time, exposed: bool}.

**Phase 6 — Backend APIs**
Objective: expose simulation + GIS as a real API.
Prerequisites: Phases 4–5 working as importable Python functions.
Tasks: FastAPI routers for scenarios (CRUD), simulation runs (create/status/result), exposure/warnings; Pydantic schemas; Postgres+PostGIS setup; run simulation as background task with status polling.
Files: `backend/routers/`, `backend/schemas/`, `backend/models/`, `backend/db.py`.
DoD: `POST /scenarios` → `POST /simulations` → poll `GET /simulations/{id}` → `GET /simulations/{id}/exposure` all work via curl/Postman against the real AOI.

**Phase 7 — Frontend foundation**
Objective: skeleton pages + API wiring, no fancy visuals yet.
Prerequisites: Phase 6 API contract stable.
Tasks: page routing, API client, basic scenario-creation form, plain list/table views (no map animation yet).
DoD: a user can create a scenario and see raw exposure results as a table through the UI.

**Phase 8 — Interactive simulation visualization**
Objective: the GIS payoff — map + time slider + layers.
Tasks: MapLibre map, DEM hillshade basemap, flood-extent polygon layer with time slider, depth color ramp, village markers colored by exposure status. Clearly label as "simulation playback," not live data.
DoD: dragging the time slider visibly updates flood extent and depth colors on the real AOI map.

**Phase 9 — Village/asset impact analysis (UI)**
Objective: surface Phase 5's exposure table properly in the UI — sortable table, map highlight on click, road/bridge exposure overlay.
DoD: clicking a village on the map shows its depth/arrival-time/status card.

**Phase 10 — Early-warning engine**
Objective: turn exposure numbers into warning levels.
Tasks: define thresholds (depth, velocity, arrival-time bands) per Section 9-style logic below, implement `risk/warning_engine.py`, expose via API, render as colored alert list + map zones in UI.
DoD: for the real AOI, villages are correctly bucketed into warning levels and this is visible/explainable in the UI (which threshold triggered it).

**Phase 11 — SPH/Delft3D adapters**
Objective: build the adapter interface for real; run one of each if time allows (Section 3 Level 3).
Tasks: `simulation/sph_adapter.py` (small dam-break-in-a-box demo, separate from main pipeline, visualized independently), `simulation/delft3d_adapter.py` (NetCDF parser conforming to `StandardGridResult`), document clearly in `docs/SCIENTIFIC_MODEL.md` which runs are "live" vs "precomputed/offline."
DoD: adapters at minimum parse a sample/offline dataset into the standard format without errors; SPH demo runs and visually shows near-field breach behavior.
Don't fake: never show a fabricated "Delft3D result" that wasn't actually produced by Delft3D or a genuine sample dataset.

**Phase 12 — Scenario comparison**
Objective: let users compare two runs (e.g., different breach widths) side by side.
Tasks: store multiple runs per scenario, diff exposure tables, split-map or toggle UI.
DoD: two runs on the same AOI show a clear numeric + visual difference in affected villages.

**Phase 13 — Validation**
Objective: earn the right to say anything about correctness.
Tasks: analytical test (flat-bed dam-break has a known analytical solution — compare Level 1/2 output against it), mass-conservation check, monotonicity check (depth doesn't spontaneously increase downhill without inflow), document results in `docs/VALIDATION.md` with numbers, not adjectives.
DoD: at least one quantitative validation table exists in the repo.

**Phase 14 — Testing**
Objective: make the system robust for demo day.
Tasks: unit tests (simulation, GIS), API tests, at least one end-to-end test script that runs the whole pipeline on the demo AOI headlessly.
DoD: `pytest` green, one E2E script reproduces the demo scenario from scratch.

**Phase 15 — UI/UX polish**
Objective: make it presentable, not decorative-first.
Tasks: consistent color scale legend, loading/error states, responsive layout for projector display, warning-level color coding consistency.
DoD: no broken states during a full demo walkthrough.

**Phase 16 — Demo scenario finalization**
Objective: script and rehearse the 5-minute demo (Section below).
DoD: both teammates can run the demo start-to-finish without developer intervention.

**Phase 17 — Documentation finalization**
Objective: all `docs/` files current and consistent with actual implementation.
DoD: no doc claims a feature that doesn't exist in code.

**Phase 18 — SIH presentation/demo prep**
Objective: pitch deck, scoring-matrix self-check (Section 10 below), rehearsed Q&A on "is this real Delft3D," "how validated is this," etc.
DoD: team can answer evaluator questions about what's real vs simplified without hesitation.

---

## 9. Dependency-aware timing (explicit answers)

- **Backend starts:** Phase 2 (skeleton), real logic from Phase 6 — but only after Phase 4/5 exist as plain Python functions.
- **Frontend starts:** Phase 2 (skeleton) for environment only; real pages from Phase 7, **after** the API contract (Phase 6) is stable. Do not build map visuals before there's real data to show — this wastes the most common hackathon mistake window.
- **Simulation development starts:** Phase 4, immediately after data pipeline (Phase 3) — this is the critical path, prioritize it above all else.
- **GIS development starts:** Phase 5, right after Level 1 solver produces output.
- **Database development starts:** Phase 6, once you know the actual shape of scenario/run/result objects (don't design schema before Phase 4/5 exist).
- **SPH/Delft3D integration starts:** Phase 11, deliberately late — it's a bonus/depth signal, not core functionality; never let it block Phases 4–10.
- **Early warning starts:** Phase 10, only after exposure analysis (Phase 5/9) is real.
- **Frontend–backend connection:** Phase 7 onward, incrementally, endpoint by endpoint — never "big bang" integrate at the end.

---

## 10. Two-person team plan

Given the critical path is scientific/GIS, split by **layer ownership with a shared adapter contract**, not by "frontend person / backend person," since frontend is meaningless without real data early on.

**Saumil (science/backend lead):** Phases 3, 4, 5, 6, 11, 13 — data pipeline, simulation engine, GIS processing, backend APIs, SPH/Delft3D adapters, validation.
**Tanishk (product/frontend lead):** Phases 2 (frontend half), 7, 8, 9, 12, 15, 16 — frontend foundation, map visualization, village impact UI, scenario comparison UI, polish, demo rehearsal. Also owns repo administration (Tanishk is repo owner) and Phase 1 documentation drafting from Saumil's technical notes.
**Both together:** Phase 0, Phase 1 review, Phase 10 (warning threshold *logic* is a joint science+product decision), Phase 14 (E2E test), Phase 17–18.

**Parallelizable:** once Phase 6's API contract (request/response shapes) is written down (even before the backend is fully implemented), Tanishk can build Phase 7/8 frontend against a **mocked API** while Saumil finishes Phases 4–6 for real. This is the single biggest parallelization lever — write the OpenAPI/schema contract early and mock it.
**Not parallelizable:** Phase 5 GIS needs Phase 4's real output shape; Phase 10 warning engine needs Phase 5's real exposure numbers; Phase 9 UI needs Phase 5/10 real data (mocking exposure numbers is fine temporarily, but final wiring is sequential).

---

## 11. Git/GitHub workflow (beginner-simple)

- `main` — always working/demo-able. Never commit broken code directly.
- Branch naming: `feature/simulation-engine`, `feature/gis-map`, `feature/dashboard`, `feature/warning-engine`, `feature/delft3d-adapter`, `fix/<short-desc>`.
- Workflow per task: `git checkout main && git pull` → `git checkout -b feature/x` → work → commit in small logical chunks → `git push origin feature/x` → open Pull Request on GitHub → other teammate reviews/merges → delete branch.
- **Avoid overwriting each other:** each person mostly owns different folders (simulation/gis/backend vs frontend) per Section 10, so conflicts are rare; when both touch shared files (e.g., `docs/API.md`, schema definitions), agree in chat before editing, and always `git pull` before starting new work.
- Conflict resolution: if a merge conflict appears, don't panic-resolve — open the file, read both versions, discuss for 2 minutes if unclear, keep both changes if they're not truly contradictory.
- Commit after every stable milestone (a phase's DoD met), not after every line.

---

## 12. Testing & validation approach

- **Unit tests:** simulation math (conservation, monotonicity on synthetic DEMs), GIS functions (known point-in-polygon cases).
- **Integration tests:** API endpoints against a test Postgres/PostGIS instance.
- **Validation (the important one):** compare Level 1 (and Level 2 if built) against a known **analytical dam-break solution on a flat frictionless bed** (a standard textbook case with a closed-form solution) — report error numerically in `docs/VALIDATION.md`. Also run **sanity checks**: total water volume roughly conserved over time (within numerical tolerance you state explicitly), flood extent never appears above the source elevation, arrival-time is monotonic non-decreasing with distance downstream along the main flow path. Never write "the model is accurate" — write "Level 1 model matches the analytical flat-bed case within X% at Y minutes" or "not yet validated against this case."

---

## 13. Demo scenario (~5 minutes)

1. Open dashboard → select real AOI (named district + dam).
2. Show DEM + village/river layers loaded (10s).
3. Configure a dam-break scenario (breach width, formation time) — explain these are literature-typical values (30s).
4. Run Level 1 simulation → progress indicator → completes in view (30–60s).
5. Time slider reveals flood polygon growing over the real terrain, depth color ramp (45s).
6. Villages flip to "exposed" with depth/arrival-time popups (30s).
7. Warning panel shows graded alerts (WATCH/ALERT/WARNING-style) with reasoning (30s).
8. Show one road/bridge cut off by flood (20s).
9. Switch to a second scenario (bigger breach) and show the comparison view — more villages affected, sooner (45s).
10. Export a one-page PDF/summary report of the selected scenario (20s).
11. Closing: 15-second callout of what's simplified vs what the Level 3 adapter demonstrates (SPH near-field clip / Delft3D-format compatibility), stated honestly.

---

## 14. MVP vs Advanced vs Future

**MVP (must build, this is the hackathon deliverable):**
Real DEM+village+river data for one AOI · Level 1 simulation engine · GIS exposure analysis · rule-based early warning · interactive map with time slider · scenario creation + single comparison · basic report export · docs describing what's real vs simplified.

**Advanced (should build if time allows):**
Level 2 real shallow-water solver · SPH near-field demo · Delft3D adapter parsing a real/sample dataset · quantitative validation against analytical case · scenario history/multiple comparisons · polished UI.

**Future (say out loud, do not attempt now):**
Live Delft3D execution inside FloodLens · real sensor/satellite ingestion · multi-dam cascading failure modelling · SMS/IVR public alert dispatch · mobile app · national-scale multi-catchment deployment.

---

## 15. Exact build order checklist

```
[ ] Phase 0: pick real AOI + real dam, write decisions doc
[ ] Phase 1: write PRD/ARCHITECTURE/SCIENTIFIC_MODEL/DATA_SOURCES docs
[ ] Phase 2: repo skeleton, frontend+backend hello-world, both can run it locally
[ ] Phase 3: download+clip DEM, villages, rivers, dam location for AOI
[ ] Phase 4: implement StandardGridResult + Level 1 solver, unit-test on synthetic DEM
[ ] Phase 4b: run Level 1 solver on the real AOI DEM end-to-end, sanity-check output
[ ] Phase 5: raster→vector extraction + village/road exposure (zonal stats)
[ ] Phase 6: FastAPI routes for scenario/simulation/exposure + Postgres/PostGIS
[ ] Phase 7: frontend skeleton pages wired to real API (tables only)
[ ] Phase 8: MapLibre map + time slider + depth color layer
[ ] Phase 9: village impact UI (click-to-inspect)
[ ] Phase 10: early-warning threshold engine + alert UI
[ ] Phase 11: SPH near-field demo + Delft3D adapter (stretch)
[ ] Phase 12: scenario comparison
[ ] Phase 13: validation vs analytical case, write VALIDATION.md
[ ] Phase 14: test suite + one E2E script
[ ] Phase 15: UI polish pass
[ ] Phase 16: rehearse 5-minute demo end-to-end, twice
[ ] Phase 17: sync all docs with final implementation
[ ] Phase 18: pitch deck + evaluator Q&A prep
```

---

## 16. SIH evaluator self-score (honest, to guide effort)

| Criterion | Likely score /10 if MVP only | If Advanced scope hit | How to raise it |
|---|---|---|---|
| Problem relevance | 8 | 9 | Anchor to a real, named dam/district |
| Technical depth | 6 | 8 | Level 2 solver + real validation numbers |
| Scientific credibility | 6 | 8 | Validation section with actual numbers, honest labeling |
| SPH relevance | 3 | 6 | Even a small SPH demo, clearly scoped, beats zero |
| Delft3D relevance | 3 | 6 | Adapter parsing real Delft3D-format output, even offline |
| GIS relevance | 7 | 8 | Real PostGIS spatial joins, not just pretty maps |
| Early-warning relevance | 6 | 8 | Explainable thresholds, not a black box |
| Innovation | 6 | 7 | The adapter architecture itself is a legitimate innovation story |
| Feasibility (2 students) | 8 | 7 | Keep Level 2/3 genuinely optional |
| Scalability | 6 | 7 | Standard interface design supports it structurally |
| UI/UX | 6 | 8 | Time-slider + clear legends go a long way |
| Demonstrability | 7 | 9 | Rehearse the 5-minute script |
| Data strategy | 7 | 7 | Real DEM/village data, transparent about placeholders |
| Validation | 4 | 8 | This is the single highest-leverage gap to close |
| Documentation | 6 | 8 | `docs/` folder fully populated and consistent |

Biggest "AI-washing" traps to avoid out loud: calling Level 1 a "Delft3D simulation," claiming population numbers are precise without a source, implying real-time sensor ingestion, or saying "the model is validated" without the numbers to back it.

---

## 17. Risks & mitigations

- **Solver too slow on laptop** → keep Level 1 grid resolution coarse enough (downsample DEM) to guarantee sub-minute runs; document the resolution/runtime tradeoff.
- **Data unavailable for chosen AOI** → pick AOI *based on* data availability (DEM+OSM coverage), not the other way around.
- **SPH/Delft3D adapter eats all remaining time** → hard-timebox Phase 11; MVP does not depend on it.
- **Frontend/backend integration slips to the last day** → mock the API contract early (Section 10) so frontend never blocks on backend completion.
- **Overclaiming in the pitch** → rehearse the "what's real vs simplified" 15-second callout explicitly as part of Phase 16.

---

## 18. Final Definition of Done (whole project)

The MVP checklist in Section 15 through Phase 10 is fully checked, the demo script in Section 13 runs live without developer intervention, `docs/VALIDATION.md` contains at least one quantitative comparison, and no UI text or spoken pitch line claims more physical realism than the code actually implements.

---

# PHASE 1 — WHAT WE SHOULD DO FIRST

Concrete actions, in order, starting tomorrow morning:

1. **Pick the real AOI**: choose one specific dam + downstream district in India with available open DEM and OSM village/road coverage. Write it down in `docs/DECISIONS.md` with a one-line justification.
2. **Create the repo skeleton** exactly as in Section 7 (empty folders + placeholder README per folder is fine).
3. **Set up local dev environments**: Tanishk gets `frontend/` (Vite React) running with a "Hello FloodLens" page; Saumil gets `backend/` (FastAPI) running with a `/health` endpoint. Confirm both can run each other's setup from a fresh clone.
4. **Download and clip the DEM** for the chosen AOI (Saumil) while Tanishk starts drafting `docs/PRD.md` and `docs/ARCHITECTURE.md` from Sections 1–6 of this document (division of labor for Phase 0/1 overlap).
5. **Write `docs/SCIENTIFIC_MODEL.md`** by condensing Section 3 — this becomes the shared vocabulary for every conversation you'll have with mentors and evaluators about what's real vs simplified.
6. **Define the `StandardGridResult` interface** (just the data shape: depth/velocity/arrival_time arrays + grid metadata) in a short doc or stub Python class — this is the contract everything else in Phase 4–11 depends on. Do this before writing any solver code.
7. End of day: both teammates should be able to say, in one sentence each, what AOI you're using, what Level 1 will physically do, and what the `StandardGridResult` contract looks like.

Do not start the map UI, the database schema, or SPH/Delft3D code yet — those all come after Phase 4 exists.
