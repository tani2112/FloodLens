/**
 * FloodLens Data Contract Definitions
 * Shared between Frontend Services, Components, and Backend OpenAPI Schemas
 */

export interface StudyArea {
  id: string;
  name: string;
  description?: string;
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
  parameters?: ScenarioParameters;
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

export interface TimestepSummary {
  timestepIndex: number;
  timeMin: number;
  floodAreaKm2: number;
  maxDepthM: number;
  maxVelocityMs: number;
}

export interface TimelineSummary {
  simulationId: string;
  timesteps: TimestepSummary[];
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

export interface SettlementImpactItem {
  simulationId: string;
  assetId: string;
  assetType: string;
  name: string;
  coordinates: [number, number];
  maxDepthM: number;
  arrivalTimeMin?: number | null;
  timeOfPeakDepthMin?: number | null;
  durationInundatedMin?: number | null;
  exposed: boolean;
  warningLevel: 'advisory' | 'watch' | 'warning' | 'critical';
  exposureTier: 'SAFE' | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  population?: number | null;
  populationExposed?: number | null;
  populationDataStatus: 'available' | 'requires_census_dataset';
}

export interface SettlementImpactSummary {
  totalEvaluated: number;
  totalAffected: number;
  safeCount: number;
  lowCount: number;
  moderateCount: number;
  highCount: number;
  criticalCount: number;
  earliestAffectedSettlement?: string | null;
  latestAffectedSettlement?: string | null;
  maxSettlementDepthM: number;
  maxSettlementSeverity: string;
  populationDataStatus: 'available' | 'requires_census_dataset';
  settlements: SettlementImpactItem[];
}

export interface RoadSegmentImpact {
  roadId: string;
  name: string;
  highwayType: string;
  lengthKm: number;
  affectedLengthKm: number;
  affectedPercent: number;
  severity: 'SAFE' | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
}

export interface RoadImpactSummary {
  simulationId: string;
  totalNetworkLengthKm: number;
  affectedRoadsLengthKm: number;
  unaffectedLengthKm: number;
  affectedPercent: number;
  affectedSegmentsCount: number;
  firstTimestepAffectedMin?: number | null;
  peakAffectedRoadLengthKm: number;
  affectedSegments: RoadSegmentImpact[];
  roadImpactTimeline: Array<{
    timestepIndex: number;
    timeMin: number;
    affectedRoadsLengthKm: number;
    affectedPercent: number;
  }>;
}

export interface InfrastructureImpactSummary {
  status: 'available' | 'dataset_unavailable';
  message: string;
  evaluatedAssetsCount: number;
  affectedAssetsCount: number;
  assets: any[];
}

export interface ImpactTimelineItem {
  timestepIndex: number;
  timeMin: number;
  floodAreaKm2: number;
  maxDepthM: number;
  maxVelocityMs: number;
  settlementsAffectedCount: number;
  criticalSettlementsCount: number;
  affectedRoadsLengthKm: number;
  affectedPercent: number;
}

export interface ImpactTimeline {
  simulationId: string;
  firstInundationTimeMin?: number | null;
  peakInundationAreaTimeMin?: number | null;
  peakDepthTimeMin?: number | null;
  peakVelocityTimeMin?: number | null;
  settlementFirstImpactTimeMin?: number | null;
  roadFirstImpactTimeMin?: number | null;
  timeline: ImpactTimelineItem[];
}

export interface ImpactSummary {
  simulationId: string;
  scenarioType: string;
  modelLevel: string;
  floodMetrics: {
    floodAreaKm2: number;
    maxDepthM: number;
    maxVelocityMs: number;
    arrivalTimeMin: number;
  };
  settlementMetrics: SettlementImpactSummary;
  roadMetrics: RoadImpactSummary;
  infrastructureMetrics: InfrastructureImpactSummary;
  temporalMetrics: {
    firstInundationTimeMin?: number | null;
    peakInundationAreaTimeMin?: number | null;
    peakDepthTimeMin?: number | null;
    peakVelocityTimeMin?: number | null;
    settlementFirstImpactTimeMin?: number | null;
    roadFirstImpactTimeMin?: number | null;
    impactTimeline: ImpactTimelineItem[];
  };
  severitySummary: {
    overallImpactSeverity: string;
    advisoryLevel: string;
    primaryRiskFactors: string[];
  };
  scientificDisclaimer: string;
}

export interface ExportJob {
  simulationId: string;
  format: 'shp' | 'kml' | 'geojson' | 'geotiff' | 'report_pdf';
  status: 'idle' | 'preparing' | 'ready' | 'failed';
  downloadUrl?: string;
}
