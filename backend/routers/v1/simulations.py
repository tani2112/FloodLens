from typing import List
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from backend.schemas import (
    SimulationSchema,
    SimulationCreateSchema,
    SimulationStatusSchema,
    TimelineSummarySchema
)
from backend.services.simulation_service import (
    list_simulations,
    get_simulation,
    get_simulation_status,
    create_and_run_simulation
)
from backend.services.result_service import get_simulation_timeline
from backend.db import get_db

router = APIRouter(prefix="/simulations", tags=["Simulations"])

@router.get("", response_model=List[SimulationSchema])
def list_simulations_endpoint(db: Session = Depends(get_db)):
    """Lists past and active simulation runs."""
    return list_simulations(db=db)

@router.post("", response_model=SimulationSchema, status_code=201)
def trigger_simulation_endpoint(payload: SimulationCreateSchema, db: Session = Depends(get_db)):
    """Triggers execution of Level 1 2D diffusive wave simulation."""
    return create_and_run_simulation(payload, db=db)

@router.get("/{simulation_id}", response_model=SimulationSchema)
def get_simulation_endpoint(simulation_id: str, db: Session = Depends(get_db)):
    """Retrieves simulation run record."""
    sim = get_simulation(simulation_id, db=db)
    if not sim:
        raise HTTPException(
            status_code=404,
            detail=f"Simulation '{simulation_id}' not found."
        )
    return sim

@router.get("/{simulation_id}/status", response_model=SimulationStatusSchema)
def get_simulation_status_endpoint(simulation_id: str, db: Session = Depends(get_db)):
    """Polls simulation progress percentage and stage execution status."""
    return get_simulation_status(simulation_id, db=db)

@router.get("/{simulation_id}/timeline", response_model=TimelineSummarySchema)
def get_simulation_timeline_endpoint(simulation_id: str, db: Session = Depends(get_db)):
    """Retrieves timeline summary of recorded timesteps and metrics."""
    timeline = get_simulation_timeline(simulation_id, db=db)
    if timeline is None:
        raise HTTPException(
            status_code=404,
            detail=f"Simulation '{simulation_id}' not found."
        )
    return timeline
