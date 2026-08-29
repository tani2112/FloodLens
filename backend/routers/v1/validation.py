"""
FloodLens REST API — Validation Router
Endpoints: GET /api/v1/validation/{simulation_id}
"""

from fastapi import APIRouter, HTTPException, status
from backend.schemas import ValidationResultSchema

router = APIRouter(prefix="/validation", tags=["Validation"])


@router.get("/{simulation_id}", response_model=ValidationResultSchema)
def get_validation(simulation_id: str):
    """Retrieves satellite validation metrics (planned phase)."""
    return ValidationResultSchema(
        simulationId=simulation_id,
        iou=0.84,
        precision=0.88,
        recall=0.91,
        f1=0.89,
        areaDifferenceKm2=0.12,
        observedExtent={"type": "FeatureCollection", "features": []},
        simulatedExtent={"type": "FeatureCollection", "features": []},
        status="mock"
    )
