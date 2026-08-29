"""
FloodLens REST API — Warnings Router
Endpoints: GET /api/v1/simulations/{id}/warnings
"""

from typing import List
from fastapi import APIRouter, HTTPException, status
from backend.schemas import WarningSchema
from backend.services.result_service import get_warning_alerts

router = APIRouter(prefix="/simulations", tags=["Warnings"])


@router.get("/{simulation_id}/warnings", response_model=List[WarningSchema])
def get_warnings(simulation_id: str):
    """Retrieves decision-support warning alerts for simulation."""
    warnings = get_warning_alerts(simulation_id)
    if warnings is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Simulation '{simulation_id}' not found."
        )
    return warnings
