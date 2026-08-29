"""
FloodLens Backend — Scenario Service
Manages scenario configurations and validates parameters against supported types.
"""

import json
import os
import uuid
from typing import List, Dict, Any, Optional
from backend.schemas import ScenarioSchema, ScenarioCreateSchema
from backend.services.study_area_service import get_study_area_by_id

SCENARIO_STORE: Dict[str, Dict[str, Any]] = {
    "scen-idukki-default": {
        "id": "scen-idukki-default",
        "studyAreaId": "idukki-canonical",
        "type": "dam_break",
        "parameters": {
            "initialWaterLevelM": 50.0,
            "reservoirVolumeMm3": 10.0,
            "damHeightM": 168.9,
            "breachWidthM": 100.0,
            "breachFormationTimeMin": 30.0,
            "simulationDurationHr": 1.0,
            "roughnessCoefficient": 0.035
        },
        "createdAt": "2026-08-29T10:00:00Z"
    }
}


def list_scenarios() -> List[ScenarioSchema]:
    """Returns all configured scenarios."""
    return [ScenarioSchema(**data) for data in SCENARIO_STORE.values()]


def get_scenario_by_id(scenario_id: str) -> Optional[ScenarioSchema]:
    """Retrieves scenario configuration by ID."""
    if scenario_id in SCENARIO_STORE:
        return ScenarioSchema(**SCENARIO_STORE[scenario_id])
    return None


def create_scenario(data: ScenarioCreateSchema) -> ScenarioSchema:
    """Validates and creates a new simulation scenario configuration."""
    study_area = get_study_area_by_id(data.studyAreaId)
    if not study_area:
        raise ValueError(f"Unknown studyAreaId: {data.studyAreaId}")

    valid_types = ["dam_break", "natural_blockage", "glof", "water_release"]
    if data.type not in valid_types:
        raise ValueError(f"Invalid scenario type: {data.type}. Must be one of {valid_types}")

    scen_id = f"scen-{uuid.uuid4().hex[:8]}"
    scen_dict = {
        "id": scen_id,
        "studyAreaId": data.studyAreaId,
        "type": data.type,
        "parameters": data.parameters.dict(),
        "createdAt": "2026-08-29T10:30:00Z"
    }
    SCENARIO_STORE[scen_id] = scen_dict
    return ScenarioSchema(**scen_dict)
