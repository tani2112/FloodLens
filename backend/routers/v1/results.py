from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from backend.schemas import FloodResultSchema
from backend.services.result_service import (
    get_flood_results,
    get_safe_result_file_path,
    simulation_exists
)
from backend.db import get_db

router = APIRouter(prefix="/simulations", tags=["Results"])

@router.get("/{simulation_id}/results", response_model=FloodResultSchema)
def get_simulation_results_endpoint(simulation_id: str, db: Session = Depends(get_db)):
    """Retrieves high-level flood extent and severity summary KPI metrics."""
    res = get_flood_results(simulation_id, db=db)
    if not res:
        if not simulation_exists(simulation_id, db=db):
            raise HTTPException(
                status_code=404,
                detail=f"Simulation '{simulation_id}' not found."
            )
        raise HTTPException(
            status_code=404,
            detail=f"Results for simulation '{simulation_id}' are not yet available or failed."
        )
    return res

@router.get("/{simulation_id}/files/{filename}")
def serve_result_file_endpoint(simulation_id: str, filename: str, db: Session = Depends(get_db)):
    """Safely serves GIS vector layer files and JSON artifacts for simulation run."""
    safe_path = get_safe_result_file_path(simulation_id, filename, db=db)
    if not safe_path:
        raise HTTPException(
            status_code=404,
            detail=f"File '{filename}' for simulation '{simulation_id}' not found or access denied."
        )
    media_type = "application/geo+json" if filename.endswith(".geojson") else "application/json"
    return FileResponse(safe_path, media_type=media_type)
