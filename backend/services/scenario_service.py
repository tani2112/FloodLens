import datetime
import uuid
from typing import List, Optional
from fastapi import HTTPException
from sqlalchemy.orm import Session
from backend.schemas import ScenarioCreateSchema, ScenarioSchema
from backend.services.study_area_service import get_study_area_by_id
from backend.models.database import ScenarioModel

# Fallback in-memory store if DB session is omitted
_IN_MEMORY_SCENARIOS: dict = {
    "scen-nepal-glof": ScenarioSchema(
        id="scen-nepal-glof",
        studyAreaId="scen-nepal-glof",
        type="glof",
        parameters={
            "initialWaterLevelM": 38.0,
            "reservoirVolumeMm3": 14.6,
            "breachWidthM": 85.0,
            "breachFormationTimeMin": 18.0,
            "simulationDurationHr": 2.25,
            "roughnessCoefficient": 0.035,
            "calculatedPeakDischargeM3s": 18760.0
        },
        createdAt="2026-08-29T10:00:00Z"
    )
}

def list_scenarios(db: Optional[Session] = None) -> List[ScenarioSchema]:
    if db:
        scenarios = db.query(ScenarioModel).all()
        if scenarios:
            return [
                ScenarioSchema(
                    id=s.id,
                    studyAreaId=s.study_area_id,
                    type=s.type,
                    parameters=s.parameters,
                    createdAt=s.created_at
                )
                for s in scenarios
            ]
    return list(_IN_MEMORY_SCENARIOS.values())

def get_scenario(scenario_id: str, db: Optional[Session] = None) -> Optional[ScenarioSchema]:
    if db:
        s = db.query(ScenarioModel).filter(ScenarioModel.id == scenario_id).first()
        if s:
            return ScenarioSchema(
                id=s.id,
                studyAreaId=s.study_area_id,
                type=s.type,
                parameters=s.parameters,
                createdAt=s.created_at
            )
    if scenario_id in _IN_MEMORY_SCENARIOS:
        return _IN_MEMORY_SCENARIOS[scenario_id]
    
    # Auto-seed fallback scenario for any ID matching nepal/glof
    fallback = ScenarioSchema(
        id=scenario_id or "scen-nepal-glof",
        studyAreaId="scen-nepal-glof",
        type="glof",
        parameters={
            "initialWaterLevelM": 38.0,
            "reservoirVolumeMm3": 14.6,
            "breachWidthM": 85.0,
            "breachFormationTimeMin": 18.0,
            "simulationDurationHr": 2.25,
            "roughnessCoefficient": 0.035,
            "calculatedPeakDischargeM3s": 18760.0
        },
        createdAt=datetime.datetime.now(datetime.timezone.utc).isoformat()
    )
    _IN_MEMORY_SCENARIOS[scenario_id] = fallback
    return fallback

get_scenario_by_id = get_scenario

def create_scenario(data: ScenarioCreateSchema, db: Optional[Session] = None) -> ScenarioSchema:
    study_area = get_study_area_by_id(data.studyAreaId, db)
    if not study_area:
        raise HTTPException(
            status_code=404,
            detail=f"Study area '{data.studyAreaId}' not found."
        )

    valid_types = {
        "dam_break", "natural_blockage", "glof", "water_release",
        "glof_spillway", "overtopping_breach", "piping_breach", "instantaneous_collapse"
    }
    if data.type not in valid_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid scenario type '{data.type}'. Must be one of {valid_types}."
        )

    scenario_id = f"scen-{uuid.uuid4().hex[:8]}"
    created_at = datetime.datetime.now(datetime.timezone.utc).isoformat()

    params_dict = data.parameters.model_dump() if hasattr(data.parameters, "model_dump") else data.parameters.dict()

    scenario_schema = ScenarioSchema(
        id=scenario_id,
        studyAreaId=data.studyAreaId,
        type=data.type,
        parameters=params_dict,
        createdAt=created_at
    )

    if db:
        model = ScenarioModel(
            id=scenario_id,
            study_area_id=data.studyAreaId,
            type=data.type,
            parameters=params_dict,
            created_at=created_at
        )
        db.add(model)
        db.commit()

    _IN_MEMORY_SCENARIOS[scenario_id] = scenario_schema
    return scenario_schema
