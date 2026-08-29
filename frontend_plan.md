# FLOODLENS — FINAL FRONTEND UI/UX & IMPLEMENTATION SPECIFICATION
Reconciling: MASTER IMPLEMENTATION PLAN (`FLOODLENS_IMPLEMENTATION_PLAN.md`) + Preliminary UI Plan + SIH26161
Team: Saumil & Tanishk | This is the blueprint handed to Antigravity, one phase at a time.

---

## Reconciliation notes (read first)

A few places where the preliminary UI plan and the master plan needed to be aligned rather than taken literally:

1. **Model Selection options.** The master plan defines three real levels: **Level 1** (diffusive/CA flood-spreading model — actually implemented), **Level 2** (real shallow-water solver — stretch goal), and an **adapter layer** for **SPH** (small near-field demo only) and **Delft3D** (parses real/sample output, not executed live). The UI must present exactly these four options, each tagged with its true status (`Implemented` / `Planned` / `Adapter — sample data only`), never a generic "SPH vs Delft3D" toggle implying both run live.
2. **AOI / case study.** The master plan's canonical demo uses a **real Indian dam + district** as the primary AOI (data availability driven). The preliminary plan's **Bhotekoshi–Trishuli (Nepal)** reference is kept, but only as an optional **retrospective case study**, explicitly labeled as such, layered on top of the same architecture — not the default AOI, and never implying live prediction for Nepal.
3. **"Real-time"** in SIH26161 is implemented as **simulation-time playback** (time slider through precomputed timesteps), never literal live sensor data. Every layer/label in the map and dashboard must reflect this.
4. **Satellite validation & Google Earth Engine** are **Planned / Integration Pending** for the hackathon timeline — the UI ships the full interaction pattern against mock imagery/metrics, clearly labeled `DEMO DATA`.
5. **Warnings** are always labeled **"Model-based decision support"**, never implying an official/government alert.
6. Every "affected/exposed" number derives from `Flood Results ∩ GIS Layers`, per the master plan's GIS Processing Layer — the UI must always show this provenance, not present numbers as ambient facts.

---

## SECTION 1 — Product UX Vision

FloodLens should feel like a **serious scientific instrument**, not a consumer app: dense, precise, legible under projector lighting, and structured the way a hydrologist's workbench is structured — configure inputs, run a model, inspect a map, read numbers, export. Confidence comes from restraint: clear labeling of what's real vs simplified vs mock, visible provenance for every number, no decorative flourishes competing with the map.

**Primary users:** disaster-management analysts, hydrologists/engineers evaluating scenarios, emergency planners scanning for at-risk villages, and — for this project's actual context — **SIH evaluators**, who must be able to tell at a glance what is scientifically real, what is a defensible simplification, and what is a labeled placeholder.

---

## SECTION 2 — Core User Journey

1. Land on **Dashboard** → understand what FloodLens does and see prior work.
2. Click **Create New Simulation** → **Study Area** (pick AOI, river, dam/blockage, DEM, satellite dataset) → **Scenario** (breach/blockage/GLOF parameters) → **Model Selection** (Level 1 implemented; Level 2/SPH/Delft3D labeled honestly) → **Run Simulation** (staged progress).
3. Land on **Flood Map** (the centerpiece) → scrub the timeline, toggle layers, inspect villages/roads.
4. Open **Results** → key metrics + charts, clearly `DEMO DATA` when mock.
5. Open **Impact/Exposure** → affected villages/roads/infrastructure table linked back to the map.
6. Open **Early Warning** → graded, explainable alerts, disclaimer visible.
7. Optionally: **Model Comparison** (two runs), **Satellite Validation** (observed vs simulated, mock), **Nepal Case Study** (retrospective, labeled).
8. **Export** report/GIS files.

---

## SECTION 3 — Information Architecture

**Top-level navigation:** Dashboard · Simulations · Study Areas · Results · Warnings · Comparison · Validation · Case Studies · About · (user/settings icon, right-aligned).
Rationale for additions beyond the preliminary nav: Warnings, Comparison, and Validation are first-class deliverables of SIH26161 (early warning, scenario comparison, GIS/satellite validation) — burying them under "Results" would undersell exactly the parts evaluators score. "Data" is *not* a separate nav item; DEM/satellite dataset selection lives inside the Study Area step, since it's a configuration input, not a browsable page.

**Routes** (see Section 22 for full table): `/`, `/simulations`, `/simulations/new/*`, `/simulations/:id`, `/simulations/:id/map`, `/simulations/:id/results`, `/simulations/:id/impact`, `/simulations/:id/warnings`, `/comparison`, `/comparison/:idA/:idB`, `/validation/:id`, `/study-areas`, `/case-studies/bhotekoshi-trishuli`, `/about`.

**Modals/drawers:** feature-inspection popup (map click), layer-control drawer (map), export drawer, "what's real vs simplified" info drawer (accessible from every page's header via an ⓘ icon — this is a first-class UX element, not an afterthought).

---

## SECTION 4 — Page-by-page specification

For each page below: purpose, layout, key components, data required, interactions, states, mock behavior, future integration, accessibility, responsive behavior. (Kept to essentials per page; full prop-level detail belongs in component docs written during implementation.)

### 4.1 Dashboard (`/`)
- **Purpose:** orient the user, surface recent work, launch new simulation.
- **Layout:** header → summary card row → "Create New Simulation" CTA → recent simulations table/list → footer note on demo mode.
- **Components:** `SummaryCard`, `RecentSimulationsTable`, `CreateSimulationButton`, `DemoModeBanner`.
- **Data:** `Simulation[]` (mock initially), summary counts derived client-side from that array.
- **Interactions:** click row → `/simulations/:id`; click CTA → `/simulations/new/study-area`.
- **Loading:** skeleton cards/rows. **Empty:** "No simulations yet" + CTA. **Error:** retry banner.
- **Mock behavior:** reads from `data/mock/simulations.ts`.
- **Future integration:** `GET /simulations` (paginated).
- **Accessibility:** summary cards are `<section aria-label>`, table has proper `<th scope>`.
- **Responsive:** cards wrap to 2-col tablet / 1-col mobile; table becomes stacked cards on mobile.

### 4.2 New Simulation wizard (`/simulations/new/study-area|scenario|model`)
- **Purpose:** guided 3-step configuration, single source of truth object built incrementally (`useSimulationDraftStore`).
- **Layout:** stepper header (Study Area → Scenario → Model → Run) + step content + sticky footer (Back/Next).
- **Components:** `WizardStepper`, `StudyAreaForm`, `ScenarioForm`, `ModelSelectionForm`, `MapPreview`.
- **Data:** `StudyArea[]`, `River[]`, `DamOrBlockage[]`, `DEMDataset[]`, `SatelliteDataset[]` (all mock lists).
- **Interactions:** selecting a study area updates `MapPreview` bounds; scenario fields validate against selected scenario type's schema; model options show status badges.
- **Loading/empty/error:** form-level; disable Next until required fields valid.
- **Mock behavior:** all dropdown options from `data/mock/studyAreas.ts` etc.; validation is real (client-side), values are not.
- **Future integration:** `POST /study-areas`, `POST /scenarios`.
- **Accessibility:** each step is a `<form>` with labeled inputs, stepper is a `<nav aria-current>`.
- **Responsive:** stepper collapses to a progress bar + step title on mobile.

### 4.3 Run/Progress (`/simulations/:id` while status = running)
- **Purpose:** show staged pipeline progress matching the master plan's real pipeline stages.
- **Layout:** vertical stage list (Input validation → Terrain prep → Grid generation → Boundary conditions → Hydrodynamic model → Flood result processing → GIS processing → Exposure analysis → Warning generation) with per-stage status icon + %.
- **Components:** `PipelineProgress`, `StageRow`, `CancelButton`.
- **Data:** `SimulationStatus` (mocked with a timer advancing stages).
- **Interactions:** cancel → confirm dialog → status = cancelled.
- **States:** running / completed (redirect to map) / failed (show error stage + retry) / cancelled.
- **Mock behavior:** `useMockSimulationRunner` hook advances stages on an interval — isolated so it's the *only* file touched when wiring a real job-status endpoint.
- **Future integration:** `GET /simulations/:id/status` (poll).

### 4.4 Flood Map (`/simulations/:id/map`) — **highest priority page**
See Section 10 in full. Purpose: primary GIS visualization surface, timeline-driven.

### 4.5 Results (`/simulations/:id/results`)
- **Purpose:** headline metrics + charts.
- **Layout:** metric card grid (Flood Area, Max Depth, Max Velocity, Arrival Time, Duration, Population Exposed, Buildings Affected, Roads Affected) + chart section below.
- **Components:** `MetricCard` (each carries a `DEMO DATA` badge when mock), `LineChart` (water level vs time, discharge vs time, flood area vs time), `HistogramChart` (depth distribution, velocity distribution).
- **Data:** `FloodResult` summary object.
- **Mock behavior:** from `data/mock/floodResults.ts`, values internally consistent with the map layers shown for the same run.
- **Future integration:** `GET /simulations/:id/results`.

### 4.6 Impact/Exposure (`/simulations/:id/impact`)
- **Purpose:** exposure table + provenance, linked to map.
- **Layout:** filter bar (village/road/bridge/infrastructure type) + sortable table + "view on map" per row.
- **Components:** `ExposureTable`, `ExposureFilterBar`, `ProvenanceNote` ("derived from Flood Results ∩ GIS Layers").
- **Data:** `ExposureResult[]`.
- **Future integration:** `GET /simulations/:id/exposure`.

### 4.7 Early Warning (`/simulations/:id/warnings`)
- **Purpose:** graded alert list.
- **Layout:** disclaimer banner (persistent, not dismissible) + alert cards grouped by level, each showing village, level, arrival time, max depth/velocity, "why" (threshold that triggered it).
- **Components:** `WarningDisclaimerBanner`, `WarningCard`, `WarningLevelBadge`.
- **Data:** `Warning[]`.
- **Future integration:** `GET /simulations/:id/warnings`.

### 4.8 Model Comparison (`/comparison/:idA/:idB`)
- **Purpose:** side-by-side two completed runs.
- **Layout:** run picker (two dropdowns, both must be `completed`) → metric diff table → optional split-map.
- **Components:** `ComparisonPicker`, `DiffTable`, `SplitMapView` (reuses Flood Map component in dual-pane mode).
- **Guardrail:** UI physically disables comparison until both selected runs have `status === 'completed'` — never fabricates a second result.
- **Data:** `ComparisonResult`.

### 4.9 Satellite Validation (`/validation/:id`)
- **Purpose:** observed vs simulated flood extent.
- **Layout:** before/after image pair, extent overlay toggle, metrics table (IoU/Precision/Recall/F1/Area diff), `Planned / Integration Pending` badge on the whole page header.
- **Data:** `ValidationResult` (mock).

### 4.10 Case Study — Bhotekoshi–Trishuli (`/case-studies/bhotekoshi-trishuli`)
- **Purpose:** retrospective demonstration.
- **Layout:** identical structure to a normal simulation result view, with a persistent header banner: **"Retrospective Case Study / Demonstration — not a live prediction for Nepal."**

### 4.11 Study Areas (`/study-areas`)
- **Purpose:** browse/manage reusable AOIs.
- **Layout:** card grid, each with map thumbnail, river/dam, DEM source.

### 4.12 About (`/about`)
- **Purpose:** SIH-facing explanation of the architecture, what's real vs simplified — a rendered version of the reconciliation notes above. This page matters for evaluators; treat it as a real deliverable, not filler.

---

## SECTION 5 — Dashboard design

- **Row 1 (summary cards, 4–5 cards):** Study Areas configured · Scenarios created · Simulations completed · Simulations running · Last simulation (name + relative time). These replace generic SaaS KPIs (no "revenue," "users," etc.) — every number is something the master plan's data model actually produces.
- **Row 2:** prominent `Create New Simulation` button, primary color, top-right or hero position.
- **Row 3:** Recent Simulations table — columns: Name, AOI/River, Scenario type, Model level used, Status (badge), Last updated. Example rows exactly as specified (Trishuli River — Full Dam Break — Completed; Bhotekoshi River — Natural Blockage — Completed; Demo Dam — Partial Breach — Running).
- **Footer strip:** small persistent note "Running in Demo Mode — results use representative data" when in demo mode (see Section 29).

---

## SECTION 6 — Study Area workflow

- **AOI selection:** dropdown/list of predefined `StudyArea` records (name, bounding box, thumbnail) — not free-drawing for MVP (too complex for the timeline); represented as a `bbox` + center point + zoom in the data contract, ready to be replaced by a draw-on-map tool later without changing the type.
- **River:** dropdown (Trishuli River / Bhotekoshi River / Demo River / + real Indian river from master plan's chosen AOI).
- **Dam/Blockage:** dropdown (Demo Dam / Natural River Blockage / Glacial Lake / + real dam from master plan AOI).
- **DEM dataset:** dropdown (SRTM / ASTER), shown as metadata only (resolution, source) — selecting it does not change the mock map yet, but the field exists in the data contract so a real DEM swap requires no UI change.
- **Satellite dataset:** dropdown (Sentinel-1 / Sentinel-2 / Landsat), same treatment — metadata-only until Satellite Validation is real.
- **Map preview:** small non-interactive MapLibre instance centered on selected AOI bbox, dam/river markers overlaid.
- **Validation:** AOI + River + Dam/Blockage + DEM required before Next; Satellite optional.

---

## SECTION 7 — Scenario configuration

Fields are gated by scenario type, matching real physical parameters from the master plan (breach width/formation time, Manning's n implied server-side, not user-exposed since it's a model default, not a user decision for MVP):

- **Dam Break:** Initial Water Level (m), Reservoir Volume (m³ or Mm³), Dam Height (m), Breach Width (m), Breach Depth (m), Breach Formation Time (min), Simulation Duration (hr).
- **Natural River Blockage:** Blockage Type (landslide/debris/ice), Estimated Lake Area (ha), Estimated Water Level (m), Blockage Height (m), Release/Breach Width (m), Release Time (min).
- **Glacial Lake Outburst (GLOF):** Lake Area (ha), Lake Volume (Mm³), Water Level (m), Breach Width (m), Breach Formation Time (min).
- **Water Release (controlled):** Release Discharge (m³/s), Release Duration (hr).

**Explicit labeling per field:** each input shows a small tag: **User Input** (typed/slid by user), **Derived** (computed client-side preview, e.g., approximate peak discharge shown as a non-authoritative hint), or **Model Output** (never editable, appears only after a run). This distinction is rendered via a `ParamKind` badge component, not just implied by layout.

**Controls:** sliders + paired numeric input (keep them in sync), dropdowns for categorical fields, inline validation messages (range checks against literature-typical bounds from the master plan, e.g., breach formation time 0.1–1 hr flagged if wildly outside), a parameter description tooltip (ⓘ) on every field.

---

## SECTION 8 — Model selection

Exactly four options, each a `ModelOption` card with a status badge:

| Option | Status badge | Description shown |
|---|---|---|
| Level 1 — Simplified inundation model | **Implemented** | "Raster-based flood-spreading model using DEM and roughness. Fast, approximate, suitable for demonstration — not for engineering design." |
| Level 2 — Shallow-water solver | **Planned** (or **Implemented** if built before demo) | "Full 2D shallow-water equations solver — physically closer to industry tools, in development." |
| SPH — near-field breach model | **Adapter — sample/small-domain only** | "Smoothed Particle Hydrodynamics, used here only to demonstrate near-field breach turbulence on a small test case, not the full valley." |
| Delft3D — industry hydrodynamic model | **Adapter — sample data only** | "FloodLens can load and visualize Delft3D-format results; it does not execute Delft3D live in this prototype." |

Selecting a non-"Implemented" option still allows proceeding (so the flow can be demoed end-to-end), but the Run stage substitutes the Level 1 engine under the hood while the UI **keeps the originally selected label visibly tagged** as sample/adapter output — never silently swapping without disclosure.

---

## SECTION 9 — Simulation workflow

Stages (fixed list, matches master plan pipeline): Input validation → Terrain preparation → Model grid generation → Boundary condition preparation → Hydrodynamic model (%) → Flood result processing → GIS processing → Exposure analysis → Warning generation. Each stage: pending / running (%) / done / failed icon. Cancel available while running (confirm dialog). On failure: show which stage failed + a "Retry from this stage" button (frontend-only re-trigger for now). On completion: auto-redirect to Flood Map. All of this is driven by a single `useMockSimulationRunner(id)` hook so that swapping to real polling only touches that hook, not any page component.

---

## SECTION 10 — Flood Map UX (highest priority)

**Map technology:** MapLibre GL JS (open-source vector+raster tile rendering, no vendor key required — matches master plan's choice).

**Container:** full-bleed map filling the results viewport, with a fixed-width right-side layer/legend panel (collapsible on tablet/mobile into a bottom sheet).

**Layers (toggleable, grouped in the panel):**
- *Base:* Base map (light/dark), DEM hillshade.
- *Hazard source:* River, Dam/Blockage marker.
- *Flood results (raster/derived-vector, per timestep):* Flood Extent (polygon), Flood Depth (color-ramped raster/choropleth), Flood Velocity (raster or vector arrows), Flood Arrival Time (raster), Flood Duration (raster) — the last two only shown for the current global timestep vs a static end-state, clearly toggled.
- *Exposure/infrastructure:* Villages, Buildings, Roads, Bridges, Hospitals, Schools, Agricultural Land — point/line/polygon vector layers, colored by exposure status once a run exists.
- *Decision layer:* Warning Zones (buffer polygons colored by warning level).
- *Validation (only on Validation page context):* Observed Flood Extent vs Simulated Flood Extent, rendered in visually distinct styles (e.g., solid fill = simulated, hatched outline = observed) with a legend entry explicitly pairing the two labels.

**Controls:** layer panel with per-layer visibility + opacity slider, legend (auto-updates to match visible layers), zoom controls, reset-view, fullscreen toggle, feature-identify (click any feature → popup with its attributes), a persistent "Simulation Playback" label near the timeline (never "Live").

**Color ramp:** flood depth uses a perceptually-ordered sequential ramp (e.g., light blue → dark blue/purple) with a labeled legend in meters; velocity uses a separate ramp (or arrow density/size) with labeled legend in m/s; warning zones use the same categorical palette as the Warning badges (Section 18) for consistency across the whole app.

**Timeline:** see Section 28 — play/pause/scrub bar under the map, synchronized to the currently visible time-dependent layers (extent/depth/velocity), independent of static layers (villages/roads always visible).

**Architecture for future GIS integration:** every layer is rendered from a `FloodLayer` type (Section 24/27) with a `kind: 'raster' | 'vector'` discriminator and a `source: { type: 'mock' | 'geojson' | 'geotiff-tile' }`. Mock layers today are static or programmatically-generated GeoJSON shapes approximating plausible flood spread; swapping to real rasterio/GeoTIFF tile output later means changing only the `source` resolution logic in one `mapLayerAdapter.ts` file, not any component.

---

## SECTION 11 — Results

Metrics shown (all backed by the master plan's `StandardGridResult` + exposure output, nothing invented): Flood Area (km²), Maximum Flood Depth (m), Maximum Velocity (m/s), Flood Arrival Time (min, to nearest exposed village), Flood Duration (hr), Population Exposed, Buildings Affected, Roads Affected (km). Every metric card carries a `DEMO DATA` badge while `simulation.dataSource === 'mock'`.

Charts, each justified against the architecture: Water Level vs Time (reservoir drawdown — supported since breach hydrograph is a model input/derived quantity), Discharge vs Time (derived from breach hydraulics), Flood Depth Distribution (histogram over grid cells — supported, it's literally the depth raster), Flood Arrival Time (map-linked, not a separate chart type beyond the raster/legend), Flood Area vs Time (supported, computed per timestep from extent polygons), Velocity Distribution (supported once Level 1 velocity proxy or Level 2 real velocity exists — label as "approximate" for Level 1).

---

## SECTION 12 — Impact / Exposure

Table columns: Village/Asset name, Type, Distance to source, Max Depth, Arrival Time, Status (Exposed/Not exposed), Warning Level. A persistent note above the table: *"Values derived from the intersection of simulated flood extent with GIS infrastructure layers — not official disaster statistics."* Aggregate cards above the table (Buildings affected, Roads affected km, Population exposed, Agriculture affected ha) mirror the same provenance note. "View on map" per row pans/zooms the Flood Map and opens that feature's popup.

---

## SECTION 13 — Early Warning

Levels (four, matching the master plan's threshold engine output): **Advisory → Watch → Warning → Critical**, each a fixed color, defined in the design system (Section 18) and reused everywhere (map, cards, badges) so a color always means the same severity app-wide. Each `WarningCard` shows: village, level badge, arrival time, max depth, max velocity, one-line "why" (e.g., "Depth > 2m within 30 min arrival"), affected infrastructure chips. Persistent banner at the top of the page, non-dismissible: **"Model-based decision support — not an official government warning."**

---

## SECTION 14 — Model Comparison

Run picker requires two `completed` simulations (same or different AOI). Diff table: metric rows (Flood Area, Max Depth, Max Velocity, Arrival Time, Runtime) × two run columns × a computed difference column. Split-map view toggles between side-by-side and a single difference-shaded map. Whole page carries a `DEMO / MOCK COMPARISON` badge whenever either run's `dataSource === 'mock'`.

---

## SECTION 15 — Satellite Validation

Pre/post image pair (static images for mock), extent overlay toggle (Observed vs Simulated, distinct styles per Section 10), metrics table (IoU, Precision, Recall, F1, Area Difference) with a page-level `Planned / Integration Pending` badge reflecting that Google Earth Engine/Sentinel ingestion is not yet wired.

---

## SECTION 16 — Export

Buttons: Export SHP, Export KML, Export GeoJSON, Export GeoTIFF, Download Report (PDF). All initially trigger a frontend-only "Preparing export…" toast → mock file download (a real small placeholder file, not a broken link) so the interaction pattern is fully testable; each button's handler is isolated in `services/api/exportService.ts` so real backend file generation replaces only that file.

---

## SECTION 17 — Nepal Case Study

Same page template as a normal simulation, pre-seeded with `data/mock/caseStudies/bhotekoshiTrishuli.ts`. Persistent header banner (not dismissible): **"Retrospective Case Study / Demonstration — reconstructed for illustration, not a live prediction."** No Early Warning "Critical" banners are shown in present tense for this page — language is past-tense/retrospective throughout ("was estimated to affect…", not "will affect…").

---

## SECTION 18 — Design system

- **Typography:** one technical sans-serif family (e.g., Inter or IBM Plex Sans) for UI text; tabular/monospace numerals for all numeric metrics and tables (readability at a glance is critical for judging).
- **Color:** dark navy (`#0B1220`-ish) as the primary surface for map-forward pages; white/near-white light surfaces for form-heavy pages (Study Area/Scenario); restrained blue/cyan accents for water/hydro elements; a fixed 4-step warning palette (Advisory=blue-gray, Watch=yellow, Warning=orange, Critical=red) used consistently across map, cards, and badges; status colors for pipeline stages (pending=gray, running=blue, done=green, failed=red).
- **Depth color ramp:** sequential blue ramp, 5–7 labeled bins with units in meters, colorblind-safe (avoid red-green as the sole depth encoding).
- **Components:** flat or minimally-elevated cards (no heavy shadows/glassmorphism), squared-to-slightly-rounded corners (not pill-shaped everywhere), restrained motion (state transitions only, no decorative animation), icons from a single consistent set (e.g., Lucide) at consistent stroke width.
- **Badges:** `ModelStatusBadge` (Implemented/Planned/Adapter), `DataSourceBadge` (Demo Data/Live), `WarningLevelBadge` (4 levels above) — reused verbatim everywhere they appear, never re-styled per page.

---

## SECTION 19 — Responsive design

- **Desktop (primary target for SIH demo/projector):** full sidebar nav + wide map + side panel, all pages at full information density.
- **Tablet:** nav collapses to icons+labels in a top bar; map layer panel becomes a collapsible drawer; wizard stepper stays horizontal but compact.
- **Mobile:** single-column stacking everywhere; map becomes primary focus with layer controls as a bottom sheet; tables become stacked card lists; charts stack vertically. Mobile is a "should work," not the primary demo target — desktop/projector is what matters for judging.

---

## SECTION 20 — Accessibility

Semantic HTML throughout (`<nav>`, `<main>`, `<table>` with proper headers, `<form>`/`<label>` pairing); all interactive icons have `aria-label`; color is never the sole encoder of meaning (warning levels and depth ramp always paired with a text label/legend); keyboard navigation for the wizard (Tab/Enter/Escape) and for map layer toggles; sufficient contrast ratios (WCAG AA) especially for the dark navy map-page theme; focus-visible states on all interactive elements; skip-to-content link on the app shell.

---

## SECTION 21 — Component architecture

```
components/
├── layout/        AppShell, PageHeader, InfoDrawer ("what's real vs simplified")
├── navigation/     TopNav, WizardStepper, RouteBreadcrumb
├── cards/          SummaryCard, MetricCard, StudyAreaCard
├── forms/          NumberSliderField, DropdownField, ParamKindBadge, ValidationMessage
├── simulation/      PipelineProgress, StageRow, ModelOptionCard, ModelStatusBadge
├── maps/            FloodMap (MapLibre wrapper), LayerPanel, MapLegend, FeaturePopup, TimelineControl, SplitMapView
├── charts/          LineChart, HistogramChart (thin wrappers around Recharts)
├── results/         ResultsMetricGrid
├── impact/          ExposureTable, ExposureFilterBar, ProvenanceNote
├── warnings/        WarningCard, WarningDisclaimerBanner, WarningLevelBadge
├── comparison/      ComparisonPicker, DiffTable
└── validation/      ObservedVsSimulatedToggle, ValidationMetricsTable
```
Rule: any element that appears on 2+ pages (badges, banners, legends) lives in `components/`, never duplicated inline in a page.

---

## SECTION 22 — Routing architecture

| Route | Page |
|---|---|
| `/` | Dashboard |
| `/simulations` | Simulations list |
| `/simulations/new/study-area` | Wizard step 1 |
| `/simulations/new/scenario` | Wizard step 2 |
| `/simulations/new/model` | Wizard step 3 |
| `/simulations/:id` | Run/progress → auto-redirects to `/map` when complete |
| `/simulations/:id/map` | Flood Map |
| `/simulations/:id/results` | Results |
| `/simulations/:id/impact` | Impact/Exposure |
| `/simulations/:id/warnings` | Early Warning |
| `/comparison` | Comparison run-picker |
| `/comparison/:idA/:idB` | Comparison view |
| `/validation/:id` | Satellite Validation |
| `/study-areas` | Study Areas list |
| `/case-studies/bhotekoshi-trishuli` | Nepal case study |
| `/about` | About/architecture explainer |

---

## SECTION 23 — State management

- **Global (store, e.g. Zustand):** current user/settings (minimal for MVP), `simulationDraft` (wizard-in-progress object), `demoModeFlag`.
- **Server-cache-like state (React Query or simple fetch hooks over mock services):** `simulations`, `studyAreas`, `floodResults`, `exposureResults`, `warnings`, `comparisonResults`, `validationResults` — all fetched through `services/api/*`, which today read from `data/mock/*` and later switch to real HTTP calls without changing consuming components.
- **Local (component state):** map layer visibility/opacity, timeline scrub position, table sort/filter, form field values before submit.
- **Rule of thumb:** if two pages need it, or it must survive navigation, it's global/server-cache; if it's purely this page's UI, it's local.

---

## SECTION 24 — TypeScript data contracts

```ts
interface StudyArea { id: string; name: string; bbox: [number, number, number, number]; river: string; damOrBlockage: string; demDataset: 'SRTM' | 'ASTER'; satelliteDataset?: 'Sentinel-1' | 'Sentinel-2' | 'Landsat'; }

interface Scenario { id: string; studyAreaId: string; type: 'dam_break' | 'natural_blockage' | 'glof' | 'water_release'; params: Record<string, number | string>; }

type ModelLevel = 'level1' | 'level2' | 'sph_adapter' | 'delft3d_adapter';
type ModelStatus = 'implemented' | 'planned' | 'adapter_sample_only';

interface Simulation { id: string; scenarioId: string; modelLevel: ModelLevel; status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'; dataSource: 'mock' | 'live'; createdAt: string; }

interface SimulationStatus { simulationId: string; stage: string; stagePercent: number; stages: { name: string; status: 'pending' | 'running' | 'done' | 'failed' }[]; }

interface FloodResult { simulationId: string; floodAreaKm2: number; maxDepthM: number; maxVelocityMs: number; arrivalTimeMin: number; durationHr: number; populationExposed: number; buildingsAffected: number; roadsAffectedKm: number; dataSource: 'mock' | 'live'; }

interface FloodLayer { simulationId: string; kind: 'raster' | 'vector'; layerType: 'extent' | 'depth' | 'velocity' | 'arrivalTime' | 'duration'; timestepMin: number; source: { type: 'mock' | 'geojson' | 'geotiff-tile'; url?: string; data?: GeoJSON.FeatureCollection }; legend: { unit: string; bins: { value: number; color: string }[] }; }

interface ExposureResult { simulationId: string; assetId: string; assetType: 'village' | 'road' | 'bridge' | 'hospital' | 'school' | 'agriculture'; name: string; maxDepthM: number; arrivalTimeMin: number; exposed: boolean; }

interface Warning { simulationId: string; villageId: string; level: 'advisory' | 'watch' | 'warning' | 'critical'; arrivalTimeMin: number; maxDepthM: number; maxVelocityMs: number; triggeredBy: string; }

interface ModelResult { simulationId: string; modelLevel: ModelLevel; floodResult: FloodResult; }

interface ComparisonResult { runA: ModelResult; runB: ModelResult; diff: Record<string, number>; }

interface ValidationResult { simulationId: string; iou: number; precision: number; recall: number; f1: number; areaDifferenceKm2: number; observedExtent: GeoJSON.FeatureCollection; simulatedExtent: GeoJSON.FeatureCollection; status: 'mock' | 'live'; }

interface ExportJob { simulationId: string; format: 'shp' | 'kml' | 'geojson' | 'geotiff' | 'report_pdf'; status: 'idle' | 'preparing' | 'ready' | 'failed'; downloadUrl?: string; }
```

---

## SECTION 25 — Mock data architecture

```
data/mock/
├── studyAreas.ts
├── scenarios.ts
├── simulations.ts
├── simulationStatus.ts     # drives PipelineProgress timers
├── floodResults.ts
├── floodLayers.ts          # GeoJSON stand-ins per timestep, per simulation
├── exposure.ts
├── warnings.ts
├── comparisons.ts
├── validation.ts
└── caseStudies/
    └── bhotekoshiTrishuli.ts
```
Every mock file exports data typed against Section 24's interfaces — never inline literals inside components. `services/api/*.ts` is the only place that imports from `data/mock/`; components only ever call `services/api/*`.

---

## SECTION 26 — API integration contract (future, derived from master plan)

| Purpose | Method/Path | Request | Response | Mock replacement today |
|---|---|---|---|---|
| List simulations | `GET /simulations` | query params (pagination) | `Simulation[]` | `data/mock/simulations.ts` |
| Create study area | `POST /study-areas` | `StudyArea` fields | `StudyArea` | local draft store |
| Create scenario | `POST /scenarios` | `Scenario` fields | `Scenario` | local draft store |
| Create + run simulation | `POST /simulations` | `{scenarioId, modelLevel}` | `Simulation` | mock id generator |
| Poll simulation status | `GET /simulations/:id/status` | — | `SimulationStatus` | `useMockSimulationRunner` timer |
| Get flood layers | `GET /simulations/:id/layers?timestep=` | timestep | `FloodLayer[]` | `data/mock/floodLayers.ts` |
| Get results | `GET /simulations/:id/results` | — | `FloodResult` | `data/mock/floodResults.ts` |
| Get exposure | `GET /simulations/:id/exposure` | — | `ExposureResult[]` | `data/mock/exposure.ts` |
| Get warnings | `GET /simulations/:id/warnings` | — | `Warning[]` | `data/mock/warnings.ts` |
| Compare two runs | `GET /comparison?a=&b=` | ids | `ComparisonResult` | `data/mock/comparisons.ts` |
| Get validation | `GET /simulations/:id/validation` | — | `ValidationResult` | `data/mock/validation.ts` |
| Request export | `POST /simulations/:id/export` | `{format}` | `ExportJob` | mock file blob |

Every entry: loading = spinner/skeleton on the calling component; error = inline retry banner, never a silent blank state; retry = same service function re-invoked, exponential backoff only once real network calls exist (not needed for mock).

---

## SECTION 27 — GIS data contract

Rasters (DEM, depth, velocity, arrival-time, duration) are represented in the frontend as either (a) mock pre-rendered PNG/GeoJSON approximations today, or (b) tiled raster sources (e.g., COG/XYZ tiles) once real GeoTIFFs exist — both fit the `FloodLayer.source` union in Section 24, so no interface change is needed later. Vectors (villages, roads, bridges, extent polygons) are always `GeoJSON.FeatureCollection`, CRS WGS84 (EPSG:4326) at the frontend boundary regardless of backend internal CRS (backend/GIS layer is responsible for reprojecting to 4326 before serving). Spatial bounds (`bbox`) accompany every `StudyArea` and every `FloodLayer` for map-fit logic. Timestamps on time-dependent layers are `timestepMin` (minutes since breach start), not wall-clock time, to keep "simulation playback" honest.

---

## SECTION 28 — Simulation timeline UX

`TimelineControl`: play/pause button, scrub bar with tick marks at available timesteps, current timestep readout ("T+18 min"), speed selector (0.5x/1x/2x). Scrubbing updates only the time-dependent map layers (extent/depth/velocity/duration-so-far); static layers (villages, roads, DEM) remain unaffected. Playing advances timestep on an interval; pausing at any point is always allowed. The control is disabled/hidden entirely on pages with no time-series data (e.g., a single-snapshot validation view).

---

## SECTION 29 — Demo mode

A single `demoModeFlag` (default **on**) drives: (a) a persistent small banner ("Demo Mode — representative data") on Dashboard and every results-bearing page, (b) `DataSourceBadge` on every metric/card pulling from `dataSource: 'mock'`, (c) guaranteed-successful mock pipeline runs (no random failure injection in demo mode, so the SIH demo never breaks mid-presentation — failure/error states are still built and tested, just not triggered live during judging), (d) full workflow reachability end-to-end using only mock data — nothing in the primary demo path should require a real backend to be running. Demo mode is a real, tested code path, not a hidden hack.

---

## SECTION 30 — Frontend development phases

Mapped 1:1 onto the master plan's Phase 2/6/7/8/9/10/11/12/15/16 (see master plan Section 8), frontend-specific breakdown:

**F-Phase 1 (≈ master Phase 2/7):** App shell, routing skeleton, design system tokens, TopNav, empty pages for every route. *Goal:* everything navigable, nothing functional. *Mock data:* none yet. *Backend/GIS dependency:* none. *DoD:* every route in Section 22 renders without crashing.

**F-Phase 2:** Dashboard with mock summary/recent-simulations data; mock data modules for `studyAreas`, `scenarios`, `simulations` created. *DoD:* Dashboard fully matches Section 5 with mock data.

**F-Phase 3:** New Simulation wizard (Study Area → Scenario → Model Selection steps), draft store, validation. *DoD:* a user can complete the wizard and land on a mock Run/Progress page.

**F-Phase 4:** Run/Progress page + `useMockSimulationRunner`. *DoD:* stage list advances and redirects to Flood Map on completion.

**F-Phase 5 (the centerpiece, corresponds to master Phase 8):** Flood Map — MapLibre integration, layer panel, legend, mock `FloodLayer` data, timeline control. *DoD:* toggling layers and scrubbing the timeline visibly changes the map using mock GeoJSON approximating a plausible flood spread.

**F-Phase 6 (master Phase 9):** Impact/Exposure page + map linkage ("view on map"). *DoD:* clicking a table row highlights the corresponding map feature.

**F-Phase 7 (master Phase 10):** Early Warning page + consistent warning color system wired into the map's Warning Zones layer. *DoD:* warning levels are visually consistent across map and warning cards.

**F-Phase 8:** Results page + charts. *DoD:* all Section 11 metrics/charts render from mock `FloodResult`.

**F-Phase 9 (master Phase 12):** Model Comparison. *DoD:* two mock completed runs compare correctly, split-map works.

**F-Phase 10:** Satellite Validation + Nepal Case Study pages (both lower priority, mock-only). *DoD:* both render with correct disclaimers.

**F-Phase 11:** Export flows (mock file generation). *DoD:* every export button produces a downloadable placeholder file with correct extension.

**F-Phase 12 (master Phase 15):** UI polish pass — responsive behavior, accessibility audit, consistent badges/legends everywhere.

**F-Phase 13:** Wire real API — replace `services/api/*` internals to call FastAPI endpoints per Section 26, one endpoint at a time, starting with `GET /simulations`. No page component changes required if Section 24/25/26 were followed correctly.

---

## SECTION 31 — Frontend/backend dependency matrix

| Feature | Mock initially? | Backend required? | Hydrodynamic sim required? | GIS required? | Satellite required? |
|---|---|---|---|---|---|
| Dashboard | Yes | Eventually (list API) | No | No | No |
| Study Area wizard step | Yes | Eventually | No | No | No |
| Scenario wizard step | Yes | Eventually | No | No | No |
| Model Selection | Partially (badges are static truth, not mock) | No | N/A | No | No |
| Run/Progress | Yes | Eventually (status poll) | Yes (real stage exists once Level 1 runs) | No | No |
| Flood Map | Yes | Eventually | Yes | Yes | No (unless Validation) |
| Results | Yes | Eventually | Yes | Partially | No |
| Impact/Exposure | Yes | Eventually | Yes | Yes | No |
| Early Warning | Yes | Eventually | Yes | Yes | No |
| Model Comparison | Yes | Eventually | Yes (x2 runs) | Yes | No |
| Satellite Validation | Yes | Eventually | Yes | Yes | Yes |
| Export | Yes | Eventually | Depends on format | Yes (SHP/KML/GeoJSON/GeoTIFF) | No |
| Nepal Case Study | Yes (always, retrospective) | No (static dataset) | No | Pre-baked | No |

---

## SECTION 32 — Frontend implementation order (for Antigravity)

Build **exactly one F-Phase from Section 30 per Antigravity session**, in order F-Phase 1 → 13. Do not let Antigravity jump ahead to the Flood Map (F-Phase 5) before the shell/routing/wizard/progress phases exist, even though the map is the most visually exciting part — it depends on `Simulation`/`FloodLayer` mock data structures that must exist first.

---

## SECTION 33 — Git/team development considerations

**Developer A (Saumil, per master plan's ownership + this spec's data layer):** application shell, routing, state/data architecture (`store/`, `services/api/`, `data/mock/`, `types/`), Dashboard, New Simulation wizard, Run/Progress.
**Developer B (Tanishk):** map components (`components/maps/*`), Flood Map page, Results/charts, Impact/Exposure, Early Warning, Comparison, Validation UI.
Shared/coordinate-before-editing: `types/` (data contracts, Section 24) and `data/mock/` schemas — treat changes here like an API contract change requiring a quick sync message, per the master plan's Git workflow (feature branches, small PRs, `git pull` before starting).

---

## SECTION 34 — Definition of Done (per F-Phase)

A phase is done only when: it compiles with no TypeScript errors; all its routes/pages render without console errors; loading/empty/error states are implemented (not just the happy path); all data flows through typed mock services (no inline literals in components); no broken links between phases already built; it works fully offline against mock data; and any badge/label required by the reconciliation notes (Section 0) is present and correct (e.g., no page silently omits a `DEMO DATA` or `Planned` badge it's required to show).

---

## SECTION 35 — Risks

- **Scientific credibility risk:** UI implies live/real hydrodynamic execution where only Level 1 or mock data exists → mitigated by mandatory status badges (Sections 8, 29) enforced as a DoD item, not a style choice.
- **SIH judging risk:** flood map underwhelms because mock layers look too schematic → mitigate by making mock `FloodLayer` GeoJSON genuinely DEM-shaped (derived from real AOI DEM contours) rather than arbitrary circles.
- **Backend integration risk:** components import mock data directly instead of through `services/api/*` → mitigate with a lint rule/code-review checklist banning `from '../data/mock'` imports outside `services/`.
- **GIS integration risk:** frontend assumes a CRS/format the real GIS layer doesn't produce → mitigate by fixing WGS84/GeoJSON as the contract now (Section 27) so backend GIS layer knows its serving obligation.
- **Performance risk:** large mock GeoJSON per timestep slows the map → keep mock timestep count small (≤15) and geometry simplified.
- **Maintainability risk:** two developers editing the same files → mitigated by the ownership split in Section 33.
- **Demo reliability risk:** live network dependency during judging → Demo Mode (Section 29) guarantees a fully offline-capable path.

---

## SECTION 36 — Final Antigravity implementation brief

**Read first:** `FLOODLENS_IMPLEMENTATION_PLAN.md` (master plan) and this document in full, especially Section 0 (Reconciliation notes) and Section 24 (data contracts).

**Architecture to follow:** the page/route list in Section 22, component tree in Section 21, data contracts in Section 24, mock-data-through-services pattern in Sections 25–26 — do not invent alternate structures.

**What NOT to implement yet:** no real hydrodynamic math, no real Delft3D/SPH execution, no Google Earth Engine calls, no real FastAPI backend calls, no real file generation for exports. All of these get mock implementations behind the exact interfaces defined here.

**What to build first:** F-Phase 1 only (Section 30) — app shell, routing, design tokens, empty pages. Stop and report back before continuing to F-Phase 2.

**How to structure the frontend:** exactly the `src/` tree in the preliminary plan, adjusted per Section 21's component subfolders.

**How to use mock data:** only via `data/mock/*.ts`, only consumed through `services/api/*.ts` — never inline in components.

**How to preserve future API integration:** every data-fetching call goes through a `services/api/*` function whose return type matches Section 24; swapping mock-to-real later means editing only that file.

**How to implement incrementally:** one F-Phase per session (Section 32), each ending with the DoD checks in Section 34 confirmed before moving on. If asked to "just build the whole frontend," Antigravity should refuse and instead propose starting at F-Phase 1.

**How to validate each phase:** run the app, click through every route touched in that phase, confirm no console errors, confirm all required badges/disclaimers (Section 0, 29) are present, confirm TypeScript compiles clean.
