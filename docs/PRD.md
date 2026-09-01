# FLOODLENS — Product Requirements Document (PRD.md)

**Project:** FloodLens (SIH26161 — Dam-Break Inundation & Hydrodynamic Modelling)  
**Document Status:** Approved Master Specification  
**Version:** 1.0.0  
**Date:** August 29, 2026  

---

## 1. Executive Summary & Product Vision

FloodLens is a hydrodynamic flood simulation and disaster management platform designed for modeling dam-break, natural river-blockage, and flash-flood scenarios using digital elevation models (DEM), GIS spatial vector data, and physics-based numerical solvers.

The product functions as a **serious scientific instrument** — concise, dense, highly legible on projector displays, and structured around a hydrologist's analysis workflow: configure inputs $\rightarrow$ execute solver $\rightarrow$ inspect interactive map $\rightarrow$ evaluate exposure statistics $\rightarrow$ derive early warning decision support $\rightarrow$ export reports.

---

## 2. Target Audience & Personas

1. **Disaster Management Analysts:** Emergency personnel requiring fast, spatial insight into inundation extent, depth, and time-of-arrival across villages and infrastructure.
2. **Hydraulic Engineers / Evaluators:** Technical users examining breach mechanics, Manning's roughness, model level tradeoffs, and validation numbers.
3. **SIH Hackathon Evaluators:** Judges verifying scientific authenticity, explicit disclosure of simplified vs full solvers, software framework modularity, and interactive GIS capabilities.

---

## 3. SIH26161 Scope Mapping & Compliance Matrix

| SIH Requirement | Target Functionality in FloodLens | Implementation Scope & Constraints |
|---|---|---|
| **A. Dam-break scenario simulation** | Parametric breach modeling (width, depth, formation time, volume) | Level 1 diffusive routing engine; Level 2 SWE model (planned). |
| **B. SPH modelling** | Smoothed Particle Hydrodynamics near-field breach jet solver | Level 3 SPH Adapter (dam-break-in-a-box demo domain). |
| **C. Delft3D modelling** | Industry-standard hydrodynamic solver output visualization | Level 3 Delft3D Adapter parsing NetCDF (`trim-*.nc`) files. |
| **D. Real-time GIS visualization** | Time-stepped inundation maps played back via interactive time slider | MapLibre GL JS time-indexed raster/vector layer playback. |
| **E. Early warning** | Graded alerts for affected human settlements | Threshold-based decision support (Advisory, Watch, Warning, Critical). |
| **F. At-risk village identification** | Spatial exposure analysis joining flood extent to settlements | PostGIS / GeoPandas point-in-polygon & spatial buffer joins. |
| **G. Software framework** | Decoupled architecture supporting interchangeable solvers | Modular 4-tier design communicating via `StandardGridResult`. |
| **H. Scenario analysis** | Side-by-side comparison of multi-run breach configurations | Dual-run picker, metric diff table, split-map visualizer. |

---

## 4. User Journey & Core Application Workflow

```
┌─────────────────┐     ┌──────────────────────┐     ┌───────────────────────┐
│  1. Dashboard   │────►│  2. Scenario Wizard  │────►│  3. Solver Execution  │
└─────────────────┘     └──────────────────────┘     └───────────────────────┘
                                                                 │
┌─────────────────┐     ┌──────────────────────┐                 │
│ 6. Export/Report│◄────│ 5. Exposure & Alerts │◄────────────────┘
└─────────────────┘     └──────────────────────┘     ┌───────────────────────┐
                                   ▲                 │ 4. GIS Flood Map      │
                                   └─────────────────│   (Time Slider)       │
                                                     └───────────────────────┘
```

1. **Dashboard (`/`):** View recent runs, KPI metrics, launch simulation wizard.
2. **Scenario Wizard (`/simulations/new/*`):** Guided 3-step configuration: (1) Study Area, (2) Breach Hydraulics, (3) Model Level Selection.
3. **Solver Progress (`/simulations/:id`):** Real-time pipeline stage tracker (Input validation $\rightarrow$ Terrain prep $\rightarrow$ Grid gen $\rightarrow$ Solver execution $\rightarrow$ GIS processing $\rightarrow$ Exposure join $\rightarrow$ Alert generation).
4. **Flood Map Canvas (`/simulations/:id/map`):** Interactive GIS canvas with MapLibre, DEM hillshade, depth color ramps, velocity vectors, village overlays, and playback timeline controller.
5. **Results & Exposure (`/simulations/:id/results` & `/impact`):** Metric cards, depth/discharge charts, spatial exposure table linked to map canvas.
6. **Early Warning (`/simulations/:id/warnings`):** Graded alert cards with transparent threshold reasoning.
7. **Comparison & Validation (`/comparison`, `/validation/:id`):** Dual-run diff visualizer and analytical validation report against Ritter flat-bed benchmark.

---

## 5. Information Architecture & Navigation

### Top Navigation Layout:
- **Left:** Brand Logo ("FloodLens") $\cdot$ Dashboard $\cdot$ Simulations $\cdot$ Study Areas $\cdot$ Results $\cdot$ Warnings $\cdot$ Comparison $\cdot$ Validation $\cdot$ Case Studies $\cdot$ About.
- **Right:** System Info Icon (ⓘ "What's Real vs Simplified") $\cdot$ Settings.

### Detailed Route Specifications (15 Routes):
1. `/`: Dashboard overview.
2. `/simulations`: Paginated simulation run history.
3. `/simulations/new/study-area`: Wizard Step 1 (Select AOI, DEM dataset, River, Dam).
4. `/simulations/new/scenario`: Wizard Step 2 (Breach parameters: width, formation time, initial level).
5. `/simulations/new/model`: Wizard Step 3 (Select Level 1 Implemented, Level 2 Planned, Level 3 SPH/Delft3D Adapters).
6. `/simulations/:id`: Run execution progress tracker.
7. `/simulations/:id/map`: Primary interactive MapLibre GIS flood canvas.
8. `/simulations/:id/results`: Hydrograph charts, area vs time, depth distribution.
9. `/simulations/:id/impact`: Settlement exposure table linked to map feature popups.
10. `/simulations/:id/warnings`: Decision support warning cards.
11. `/comparison`: Dual-run comparison configuration picker.
12. `/comparison/:idA/:idB`: Split-map & metric diff table view.
13. `/validation/:id`: Observed vs simulated satellite comparison (Integration Pending / Mock).
14. `/study-areas`: Geographical AOI registry.
15. `/case-studies/bhotekoshi-trishuli`: Retrospective Nepal GLOF/dam-break case study.
16. `/about`: System architecture explainer for hackathon evaluators.

---

## 6. Mandatory Disclosure & Labeling System

To ensure absolute transparency during evaluation, every UI component displaying model outputs or status must carry standardized badges:

- `Implemented`: Native Python Level 1 diffusive wave model active.
- `Planned`: Advanced Level 2 2D Shallow Water Equation solver formulation.
- `Adapter — Sample Data Only`: Output loaded via Delft3D NetCDF parser or near-field SPH demo.
- `DEMO DATA`: Metric or map layer running on synthetic fallback/mock data.
- `Model-based Decision Support — Not an Official Warning`: Persistent non-dismissible banner on Early Warning pages.

---

## 7. Non-Functional & Quality Requirements

1. **Performance:** Level 1 simulation execution must complete in $<60$ seconds on standard laptop hardware for a $500 \times 500$ grid domain.
2. **Offline Presentation Capability:** Demo Mode (`demoModeFlag = true`) must guarantee 100% functionality without internet connectivity or live backend services.
3. **Accessibility:** WCAG AA compliance, semantic HTML5 elements, non-color-only encoding (all warning tiers and depth ramps paired with textual labels).
4. **Visual Aesthetics:** Dark Navy (`#0B1220`) canvas theme for GIS map views, clean tabular data alignment, crisp legends, and high contrast typography.
