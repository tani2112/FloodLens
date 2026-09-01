# FLOODLENS — REST API Specification & Data Contracts (API.md)

**Project:** FloodLens (SIH26161)  
**Document Status:** Approved Master Specification  
**Version:** 1.0.0  
**Date:** August 29, 2026  

---

## 1. Overview & Protocol Standards

The FloodLens API is a RESTful interface built with FastAPI. It serves scenario creation, simulation orchestration, status polling, GIS layer delivery, exposure analytical queries, and report generation.

- **Data Exchange Format:** JSON for metadata/features; GeoJSON for vector geometry; TileJSON/GeoTIFF raster endpoints.
- **Coordinate Reference System:** All spatial geometries returned via API endpoints are in **EPSG:4326 (WGS84)**.
- **Service Abstraction:** In the frontend, all HTTP calls route through `frontend/src/services/api/*.ts`. In Demo Mode, services return typed mock data from `frontend/src/data/mock/*.ts` with zero code changes required in page components.

---

## 2. Shared Data Models & Schemas

### 2.1 Study Area Schema
```typescript
interface StudyArea {
  id: string;
  name: string;
  bbox: [number, number, number, number]; // [min_lon, min_lat, max_lon, max_lat]
  river: string;
  damOrBlockage: string;
  demDataset: 'SRTM' | 'ASTER' | 'Copernicus';
  satelliteDataset?: 'Sentinel-1' | 'Sentinel-2' | 'Landsat';
  createdAt: string;
}
```

### 2.2 Scenario Schema
```typescript
interface Scenario {
  id: string;
  studyAreaId: string;
  type: 'dam_break' | 'natural_blockage' | 'glof' | 'water_release';
  parameters: {
    initialWaterLevelM: number;
    reservoirVolumeMm3: number;
    damHeightM?: number;
    breachWidthM: number;
    breachDepthM?: number;
    breachFormationTimeMin: number;
    simulationDurationHr: number;
  };
  createdAt: string;
}
```

### 2.3 Simulation Run & Status Schemas
```typescript
type ModelLevel = 'level1' | 'level2' | 'sph_adapter' | 'delft3d_adapter';
type SimulationStatusType = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

interface Simulation {
  id: string;
  scenarioId: string;
  modelLevel: ModelLevel;
  status: SimulationStatusType;
  dataSource: 'mock' | 'live';
  createdAt: string;
}

interface SimulationStatus {
  simulationId: string;
  stage: string;
  stagePercent: number;
  stages: {
    name: string;
    status: 'pending' | 'running' | 'done' | 'failed';
  }[];
}
```

### 2.4 Flood Result & Map Layer Schemas
```typescript
interface FloodResult {
  simulationId: string;
  floodAreaKm2: number;
  maxDepthM: number;
  maxVelocityMs: number;
  arrivalTimeMin: number;
  durationHr: number;
  populationExposed: number;
  buildingsAffected: number;
  roadsAffectedKm: number;
  dataSource: 'mock' | 'live';
}

interface FloodLayer {
  simulationId: string;
  kind: 'raster' | 'vector';
  layerType: 'extent' | 'depth' | 'velocity' | 'arrivalTime' | 'duration';
  timestepMin: number;
  source: {
    type: 'mock' | 'geojson' | 'geotiff-tile';
    url?: string;
    data?: GeoJSON.FeatureCollection;
  };
  legend: {
    unit: string;
    bins: { value: number; color: string }[];
  };
}
```

### 2.5 Exposure Result & Early Warning Schemas
```typescript
interface ExposureResult {
  simulationId: string;
  assetId: string;
  assetType: 'village' | 'road' | 'bridge' | 'hospital' | 'school' | 'agriculture';
  name: string;
  maxDepthM: number;
  arrivalTimeMin: number;
  exposed: boolean;
  warningLevel: 'advisory' | 'watch' | 'warning' | 'critical';
}

interface Warning {
  simulationId: string;
  villageId: string;
  level: 'advisory' | 'watch' | 'warning' | 'critical';
  arrivalTimeMin: number;
  maxDepthM: number;
  maxVelocityMs: number;
  triggeredBy: string;
}
```

### 2.6 Comparison, Validation & Export Schemas
```typescript
interface ComparisonResult {
  runA: { simulationId: string; modelLevel: ModelLevel; result: FloodResult };
  runB: { simulationId: string; modelLevel: ModelLevel; result: FloodResult };
  diff: {
    floodAreaDiffKm2: number;
    maxDepthDiffM: number;
    populationExposedDiff: number;
  };
}

interface ValidationResult {
  simulationId: string;
  iou: number;
  precision: number;
  recall: number;
  f1: number;
  areaDifferenceKm2: number;
  observedExtent: GeoJSON.FeatureCollection;
  simulatedExtent: GeoJSON.FeatureCollection;
  status: 'mock' | 'live';
}

interface ExportJob {
  simulationId: string;
  format: 'shp' | 'kml' | 'geojson' | 'geotiff' | 'report_pdf';
  status: 'idle' | 'preparing' | 'ready' | 'failed';
  downloadUrl?: string;
}
```

---

## 3. Endpoints Table & Contracts

| Endpoint | Method | Description | Request Body | Response Body | Mock Target File |
|---|---|---|---|---|---|
| `/api/v1/health` | `GET` | Health check endpoint | — | `{ status: "ok" }` | — |
| `/api/v1/study-areas` | `GET` | List available study areas | — | `StudyArea[]` | `data/mock/studyAreas.ts` |
| `/api/v1/study-areas` | `POST` | Create new study area | `StudyArea` | `StudyArea` | Client Draft Store |
| `/api/v1/scenarios` | `POST` | Create scenario configuration | `Scenario` | `Scenario` | Client Draft Store |
| `/api/v1/simulations` | `POST` | Trigger simulation run job | `{ scenarioId, modelLevel }` | `Simulation` | `data/mock/simulations.ts` |
| `/api/v1/simulations` | `GET` | List past simulation runs | — | `Simulation[]` | `data/mock/simulations.ts` |
| `/api/v1/simulations/:id/status` | `GET` | Poll simulation pipeline progress | — | `SimulationStatus` | `data/mock/simulationStatus.ts` |
| `/api/v1/simulations/:id/results` | `GET` | Fetch summary KPI metrics | — | `FloodResult` | `data/mock/floodResults.ts` |
| `/api/v1/simulations/:id/layers` | `GET` | Fetch GIS map layers by timestep | `?timestep=15` | `FloodLayer[]` | `data/mock/floodLayers.ts` |
| `/api/v1/simulations/:id/exposure` | `GET` | Fetch village exposure table | — | `ExposureResult[]` | `data/mock/exposure.ts` |
| `/api/v1/simulations/:id/warnings` | `GET` | Fetch decision support alerts | — | `Warning[]` | `data/mock/warnings.ts` |
| `/api/v1/comparison` | `GET` | Fetch side-by-side run comparison | `?runA=id1&runB=id2` | `ComparisonResult` | `data/mock/comparisons.ts` |
| `/api/v1/validation/:id` | `GET` | Fetch satellite validation stats | — | `ValidationResult` | `data/mock/validation.ts` |
| `/api/v1/export/:id` | `POST` | Request GIS file or PDF export | `{ format }` | `ExportJob` | Download Mock Blob |
