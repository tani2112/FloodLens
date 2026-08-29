"""
FloodLens REST API — Simulations Router
Endpoints: POST /api/v1/simulations, GET /api/v1/simulations, GET /api/v1/simulations/{id}, GET /api/v1/simulations/{id}/status
"""

from typing import List
from fastapi import APIRouter, HTTPException, status
from backend.schemas import (
    SimulationSchema,
    SimulationCreateSchema,
    SimulationStatusSchema
)
from backend.services.simulation_service import (
    list_simulations,
    get_simulation_by_id,
    get_simulation_status,
    create_and_run_simulation
)

router = APIRouter(prefix="/simulations", tags=["Simulations"])


@router.get("", response_model=List[SimulationSchema])
def get_all_simulations():
    """Returns list of past simulation runs."""
    return list_simulations()


@router.get("/{simulation_id}", response_model=SimulationSchema)
def get_simulation(simulation_id: str):
    """Retrieves simulation record by ID."""
    sim = get_simulation_by_id(simulation_id)
    if not sim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Simulation '{simulation_id}' not found."
        )
    return sim


@router.get("/{simulation_id}/status", response_model=SimulationStatusSchema)
def get_status(simulation_id: str):
    """Polls simulation progress and lifecycle status."""
    st = get_simulation_status(simulation_id)
    if not st:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Simulation status for '{simulation_id}' not found."
        )
    return st


@router.post("", response_model=SimulationSchema, status_code=status.HTTP_201_CREATED)
def post_simulation(payload: SimulationCreateSchema):
    """
    Triggers simulation execution job.
    - Level 1 ('level1'): Executes native Python 2D solver + Phase 5 GIS pipeline.
    - Level 2 / Adapters ('level2', 'sph_adapter', 'delft3d_adapter'): Returns HTTP 501 Not Implemented.
    """
    try:
        return create_and_run_simulation(payload)
    except NotImplementedError as err:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail=str(err)
        )
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(err)
        )
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Simulation orchestration failure: {str(err)}"
        )
