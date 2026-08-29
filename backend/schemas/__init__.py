"""
FloodLens Pydantic Schemas
Matching docs/API.md and docs/ARCHITECTURE.md specification contracts
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class StudyAreaSchema(BaseModel):
    id: str
    name: str
    bbox: List[float] = Field(..., description="[min_lon, min_lat, max_lon, max_lat]")
    river: str
    damOrBlockage: str
    demDataset: str
    satelliteDataset: Optional[str] = None
    createdAt: Optional[str] = None

class ScenarioSchema(BaseModel):
    id: str
    studyAreaId: str
    type: str
    parameters: Dict[str, Any]
    createdAt: Optional[str] = None

class SimulationSchema(BaseModel):
    id: str
    scenarioId: str
    modelLevel: str
    status: str
    dataSource: str = "mock"
    createdAt: str

class SimulationStageSchema(BaseModel):
    name: str
    status: str

class SimulationStatusSchema(BaseModel):
    simulationId: str
    stage: str
    stagePercent: float
    stages: List[SimulationStageSchema]

class FloodResultSchema(BaseModel):
    simulationId: str
    floodAreaKm2: float
    maxDepthM: float
    maxVelocityMs: float
    arrivalTimeMin: float
    durationHr: float
    populationExposed: int
    buildingsAffected: int
    roadsAffectedKm: float
    dataSource: str = "mock"

class ExposureResultSchema(BaseModel):
    simulationId: str
    assetId: str
    assetType: str
    name: str
    maxDepthM: float
    arrivalTimeMin: float
    exposed: bool
    warningLevel: str

class WarningSchema(BaseModel):
    simulationId: str
    villageId: str
    level: str
    arrivalTimeMin: float
    maxDepthM: float
    maxVelocityMs: float
    triggeredBy: str
