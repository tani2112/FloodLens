"""
FloodLens REST API — Exposure Router
Endpoints: GET /api/v1/simulations/{id}/exposure
"""

from typing import List
from fastapi import APIRouter, HTTPException, status
from backend.schemas import ExposureResultSchema
from backend.services.result_service import get_exposure_results

router = APIRouter(prefix="/simulations", tags=["Exposure"])


@router.get("/{simulation_id}/exposure", response_model=List[ExposureResultSchema])
def get_exposure(simulation_id: str):
    """Retrieves settlement exposure analysis table."""
    exposure = get_exposure_results(simulation_id)
    if exposure is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Simulation '{simulation_id}' not found."
        )
    return exposure
