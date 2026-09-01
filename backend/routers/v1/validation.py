from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from backend.schemas import ValidationResultSchema
from backend.services.result_service import simulation_exists
from backend.db import get_db

router = APIRouter(prefix="/validation", tags=["Validation"])

@router.get("/{simulation_id}", response_model=ValidationResultSchema)
def get_validation_endpoint(simulation_id: str, db: Session = Depends(get_db)):
    """Retrieves satellite observation validation metrics."""
    if not simulation_exists(simulation_id, db=db):
        raise HTTPException(
            status_code=404,
            detail=f"Simulation '{simulation_id}' not found."
        )

    return ValidationResultSchema(
        simulationId=simulation_id,
        iou=0.842,
        precision=0.885,
        recall=0.912,
        f1=0.898,
        areaDifferenceKm2=0.12,
        status="mock"
    )
