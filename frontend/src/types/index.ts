/**
 * FloodLens Data Contract Definitions
 * Shared between Frontend Services, Components, and Backend OpenAPI Schemas
 */

export interface StudyArea {
  id: string;
  name: string;
  bbox: [number, number, number, number]; // [min_lon, min_lat, max_lon, max_lat]
  river: string;
  damOrBlockage: string;
  demDataset: string;
  satelliteDataset?: string;
  createdAt?: string;
}

export interface ScenarioParameters {
  initialWaterLevelM?: number;
  reservoirVolumeMm3?: number;
  damHeightM?: number;
  breachWidthM?: number;
  breachDepthM?: number;
  breachFormationTimeMin?: number;
  simulationDurationHr?: number;
  roughnessCoefficient?: number;
  [key: string]: number | string | undefined;
}

export interface Scenario {
  id: string;
  studyAreaId: string;
  type: 'dam_break' | 'natural_blockage' | 'glof' | 'water_release';
  parameters: ScenarioParameters;
  createdAt?: string;
}

export type ModelLevel = 'level1' | 'level2' | 'sph_adapter' | 'delft3d_adapter';
export type ModelStatus = 'implemented' | 'planned' | 'adapter_sample_only';

export interface Simulation {
  id: string;
  scenarioId: string;
  modelLevel: ModelLevel;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  dataSource: 'mock' | 'live';
  createdAt: string;
}

export interface SimulationStage {
  name: string;
  status: 'pending' | 'running' | 'done' | 'failed';
}

export interface SimulationStatus {
  simulationId: string;
  stage: string;
  stagePercent: number;
  stages: SimulationStage[];
}

export interface FloodResult {
  simulationId: string;
  floodAreaKm2: number;
  maxDepthM: number;
  maxVelocityMs: number;
  arrivalTimeMin: number;
  durationHr: number;
  populationExposed?: number;
  buildingsAffected?: number;
  roadsAffectedKm: number;
  massBalanceErrorPercent?: number;
  executionTimeSeconds?: number;
  dataSource: 'mock' | 'live';
}

export interface FloodLayerBin {
  value: number;
  color: string;
}

export interface FloodLayerSource {
  type: string;
  url?: string;
  data?: any;
}

export interface FloodLayer {
  simulationId: string;
  kind: 'raster' | 'vector';
  layerType: 'extent' | 'depth' | 'velocity' | 'arrivalTime' | 'duration';
  timestepMin: number;
  source: FloodLayerSource;
  legend: {
    unit: string;
    bins: FloodLayerBin[];
  };
}

export interface ExposureResult {
  simulationId: string;
  assetId: string;
  assetType: 'village' | 'road' | 'bridge' | 'hospital' | 'school' | 'agriculture';
  name: string;
  coordinates?: [number, number];
  maxDepthM: number;
  arrivalTimeMin?: number | null;
  exposed: boolean;
  warningLevel: 'advisory' | 'watch' | 'warning' | 'critical';
  exposureTier?: 'SAFE' | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  population?: number | null;
  populationExposed?: number | null;
  populationDataStatus?: 'available' | 'unavailable' | 'estimated';
}

export interface Warning {
  simulationId: string;
  villageId: string;
  villageName?: string;
  level: 'advisory' | 'watch' | 'warning' | 'critical';
  arrivalTimeMin?: number | null;
  maxDepthM: number;
  maxVelocityMs: number;
  triggeredBy: string;
  disclaimer?: string;
}

export interface ModelResult {
  simulationId: string;
  modelLevel: ModelLevel;
  result: FloodResult;
}

export interface ComparisonResult {
  runA: ModelResult;
  runB: ModelResult;
  diff: Record<string, number>;
}

export interface ValidationResult {
  simulationId: string;
  iou: number;
  precision: number;
  recall: number;
  f1: number;
  areaDifferenceKm2: number;
  observedExtent?: any;
  simulatedExtent?: any;
  status: 'mock' | 'live';
}

export interface ExportJob {
  simulationId: string;
  format: 'shp' | 'kml' | 'geojson' | 'geotiff' | 'report_pdf';
  status: 'idle' | 'preparing' | 'ready' | 'failed';
  downloadUrl?: string;
}
