from typing import List
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from backend.schemas import ExposureResultSchema, ImpactSummarySchema, ImpactTimelineSchema
from backend.services.result_service import get_exposure_results
from backend.services.impact_service import get_impact_summary, get_impact_timeline
from backend.db import get_db

router = APIRouter(prefix="/simulations", tags=["Exposure & Impact"])

@router.get("/{simulation_id}/exposure", response_model=List[ExposureResultSchema])
def get_simulation_exposure_endpoint(simulation_id: str, db: Session = Depends(get_db)):
    """Retrieves settlement and infrastructure exposure analysis."""
    exp = get_exposure_results(simulation_id, db=db)
    if exp is None:
        raise HTTPException(
            status_code=404,
            detail=f"Simulation '{simulation_id}' not found."
        )
    return exp

@router.get("/{simulation_id}/impact-summary", response_model=ImpactSummarySchema)
def get_simulation_impact_summary_endpoint(simulation_id: str, db: Session = Depends(get_db)):
    """Retrieves consolidated settlement, road, infrastructure, and temporal impact analytics summary."""
    summary = get_impact_summary(simulation_id, db=db)
    if summary is None:
        raise HTTPException(
            status_code=404,
            detail=f"Simulation '{simulation_id}' not found or impact results not available."
        )
    return summary

@router.get("/{simulation_id}/impact-timeline", response_model=ImpactTimelineSchema)
def get_simulation_impact_timeline_endpoint(simulation_id: str, db: Session = Depends(get_db)):
    """Retrieves detailed temporal milestone progression of flood onset, settlement exposure, and road impacts."""
    timeline = get_impact_timeline(simulation_id, db=db)
    if timeline is None:
        raise HTTPException(
            status_code=404,
            detail=f"Simulation '{simulation_id}' not found or impact timeline not available."
        )
    return timeline
