from typing import List
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from backend.schemas import WarningSchema
from backend.services.result_service import get_warning_alerts
from backend.db import get_db

router = APIRouter(prefix="/simulations", tags=["Warnings"])

@router.get("/{simulation_id}/warnings", response_model=List[WarningSchema])
def get_simulation_warnings_endpoint(simulation_id: str, db: Session = Depends(get_db)):
    """Retrieves 4-tier decision support warning cards."""
    warnings = get_warning_alerts(simulation_id, db=db)
    if warnings is None:
        raise HTTPException(
            status_code=404,
            detail=f"Simulation '{simulation_id}' not found."
        )
    return warnings
