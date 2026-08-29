"""
FloodLens REST API — Scenarios Router
Endpoints: GET /api/v1/scenarios, POST /api/v1/scenarios
"""

from typing import List
from fastapi import APIRouter, HTTPException, status
from backend.schemas import ScenarioSchema, ScenarioCreateSchema
from backend.services.scenario_service import list_scenarios, get_scenario_by_id, create_scenario

router = APIRouter(prefix="/scenarios", tags=["Scenarios"])


@router.get("", response_model=List[ScenarioSchema])
def get_all_scenarios():
    """Returns list of configured scenarios."""
    return list_scenarios()


@router.get("/{scenario_id}", response_model=ScenarioSchema)
def get_scenario(scenario_id: str):
    """Retrieves specific scenario configuration by ID."""
    scen = get_scenario_by_id(scenario_id)
    if not scen:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scenario '{scenario_id}' not found."
        )
    return scen


@router.post("", response_model=ScenarioSchema, status_code=status.HTTP_201_CREATED)
def post_scenario(payload: ScenarioCreateSchema):
    """Creates a new simulation scenario configuration with parameter validation."""
    try:
        return create_scenario(payload)
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(err)
        )
