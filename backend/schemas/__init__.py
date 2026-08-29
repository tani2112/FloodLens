"""
FloodLens Pydantic Schemas
Strictly matching docs/API.md and docs/ARCHITECTURE.md specification contracts
"""

from typing import List, Dict, Any, Optional, Union
from pydantic import BaseModel, Field


# 1. Study Area Schemas
class StudyAreaSchema(BaseModel):
    id: str = Field(..., example="idukki-canonical")
    name: str = Field(..., example="Idukki Dam & Periyar River Catchment")
    bbox: List[float] = Field(..., description="[min_lon, min_lat, max_lon, max_lat]", example=[76.80, 9.85, 77.10, 10.20])
    river: str = Field(..., example="Periyar River")
    damOrBlockage: str = Field(..., example="Idukki Arch Dam / Cheruthoni Spillway")
    demDataset: str = Field(..., example="SRTM 30m / Copernicus DEM")
    satelliteDataset: Optional[str] = "Sentinel-1 / Sentinel-2"
    createdAt: Optional[str] = "2026-08-29T10:00:00Z"


# 2. Scenario Schemas
class ScenarioParametersSchema(BaseModel):
    initialWaterLevelM: float = Field(default=50.0, description="Initial reservoir water head (m)")
    reservoirVolumeMm3: float = Field(default=10.0, description="Reservoir volume in Mm3")
    damHeightM: Optional[float] = Field(default=168.9, description="Dam structure height (m)")
    breachWidthM: float = Field(default=100.0, description="Final breach width (m)")
    breachDepthM: Optional[float] = Field(default=25.0, description="Breach invert depth (m)")
    breachFormationTimeMin: float = Field(default=30.0, description="Formation duration (min)")
    simulationDurationHr: float = Field(default=1.0, description="Simulation duration (hours)")
    roughnessCoefficient: Optional[float] = Field(default=0.035, description="Manning n roughness")


class ScenarioCreateSchema(BaseModel):
    studyAreaId: str = Field(..., example="idukki-canonical")
    type: str = Field(..., example="dam_break", description="dam_break, natural_blockage, glof, or water_release")
    parameters: ScenarioParametersSchema


class ScenarioSchema(BaseModel):
    id: str
    studyAreaId: str
    type: str
    parameters: Dict[str, Any]
    createdAt: str


# 3. Simulation & Status Schemas
class SimulationCreateSchema(BaseModel):
    scenarioId: str = Field(..., example="scen-001")
    modelLevel: str = Field(..., example="level1", description="level1, level2, sph_adapter, delft3d_adapter")


class SimulationSchema(BaseModel):
    id: str
    scenarioId: str
    modelLevel: str
    status: str = Field(..., example="completed", description="pending, running, completed, failed")
    dataSource: str = "live"
    createdAt: str


class SimulationStageSchema(BaseModel):
    name: str
    status: str = Field(..., example="done", description="pending, running, done, failed")


class SimulationStatusSchema(BaseModel):
    simulationId: str
    stage: str
    stagePercent: float
    stages: List[SimulationStageSchema]


# 4. Flood Results & Map Layers Schemas
class FloodResultSchema(BaseModel):
    simulationId: str
    floodAreaKm2: float
    maxDepthM: float
    maxVelocityMs: float
    arrivalTimeMin: float
    durationHr: float
    populationExposed: Optional[int] = 0
    buildingsAffected: Optional[int] = 0
    roadsAffectedKm: float
    massBalanceErrorPercent: Optional[float] = 0.0
    executionTimeSeconds: Optional[float] = 0.0
    dataSource: str = "live"


class FloodLayerLegendBinSchema(BaseModel):
    value: float
    color: str


class FloodLayerLegendSchema(BaseModel):
    unit: str
    bins: List[FloodLayerLegendBinSchema]


class FloodLayerSourceSchema(BaseModel):
    type: str = Field(..., example="geojson")
    url: Optional[str] = None
    data: Optional[Dict[str, Any]] = None


class FloodLayerSchema(BaseModel):
    simulationId: str
    kind: str = Field(..., example="vector", description="vector or raster")
    layerType: str = Field(..., example="extent", description="extent, depth, velocity, arrivalTime, duration")
    timestepMin: float
    source: FloodLayerSourceSchema
    legend: FloodLayerLegendSchema


# 5. Exposure & Early Warning Schemas
class ExposureResultSchema(BaseModel):
    simulationId: str
    assetId: str
    assetType: str = Field(..., example="village", description="village, road, bridge, hospital, school, agriculture")
    name: str
    coordinates: Optional[List[float]] = None
    maxDepthM: float
    arrivalTimeMin: Optional[float] = None
    exposed: bool
    warningLevel: str = Field(..., example="critical", description="advisory, watch, warning, critical")
    exposureTier: Optional[str] = "CRITICAL"
    population: Optional[int] = None
    populationExposed: Optional[int] = None
    populationDataStatus: Optional[str] = "available"


class WarningSchema(BaseModel):
    simulationId: str
    villageId: str
    villageName: Optional[str] = None
    level: str = Field(..., example="critical", description="advisory, watch, warning, critical")
    arrivalTimeMin: Optional[float] = None
    maxDepthM: float
    maxVelocityMs: float
    triggeredBy: str
    disclaimer: str = "Scenario-based early-warning / decision-support output — not an official disaster warning."


# 6. Comparison, Validation & Export Schemas
class ComparisonResultSchema(BaseModel):
    runA: Dict[str, Any]
    runB: Dict[str, Any]
    diff: Dict[str, Any]


class ValidationResultSchema(BaseModel):
    simulationId: str
    iou: float
    precision: float
    recall: float
    f1: float
    areaDifferenceKm2: float
    observedExtent: Dict[str, Any]
    simulatedExtent: Dict[str, Any]
    status: str = "mock"


class ExportRequestSchema(BaseModel):
    format: str = Field(..., example="geojson", description="geojson, shp, kml, geotiff, report_pdf")


class ExportJobSchema(BaseModel):
    simulationId: str
    format: str
    status: str = Field(..., example="ready", description="idle, preparing, ready, failed")
    downloadUrl: Optional[str] = None
