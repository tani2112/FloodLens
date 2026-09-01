import uuid
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from backend.schemas import ExportRequestSchema, ExportJobSchema
from backend.services.result_service import simulation_exists
from backend.db import get_db

router = APIRouter(prefix="/export", tags=["Exports"])

@router.post("/{simulation_id}", response_model=ExportJobSchema)
def trigger_export_endpoint(simulation_id: str, payload: ExportRequestSchema, db: Session = Depends(get_db)):
    """Triggers GIS vector export job."""
    if not simulation_exists(simulation_id, db=db):
        raise HTTPException(
            status_code=404,
            detail=f"Simulation '{simulation_id}' not found."
        )

    supported_formats = {"geojson"}
    if payload.format not in supported_formats:
        raise HTTPException(
            status_code=400,
            detail=f"Export format '{payload.format}' is not supported. Choose from {supported_formats}."
        )

    job_id = f"exp-{uuid.uuid4().hex[:8]}"
    return ExportJobSchema(
        jobId=job_id,
        simulationId=simulation_id,
        format=payload.format,
        status="completed",
        downloadUrl=f"/api/v1/simulations/{simulation_id}/files/flood_extent.geojson"
    )
