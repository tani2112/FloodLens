"""
FloodLens REST API — Exports Router
Endpoints: POST /api/v1/export/{simulation_id}
"""

import os
from fastapi import APIRouter, HTTPException, status
from backend.schemas import ExportJobSchema, ExportRequestSchema
from backend.services.result_service import get_safe_result_file_path

router = APIRouter(prefix="/export", tags=["Exports"])


@router.post("/{simulation_id}", response_model=ExportJobSchema)
def create_export_job(simulation_id: str, payload: ExportRequestSchema):
    """
    Triggers GIS result export job.
    - Supported: 'geojson' (returns download path to exported flood_extent.geojson)
    - Unsupported ('shp', 'kml', 'geotiff', 'report_pdf'): Returns status 'idle' / HTTP 501 Not Implemented response cleanly without faking files.
    """
    fmt = payload.format.lower()
    
    if fmt == "geojson":
        path = get_safe_result_file_path(simulation_id, "flood_extent.geojson")
        if not path:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Simulation results for '{simulation_id}' not found."
            )
        return ExportJobSchema(
            simulationId=simulation_id,
            format="geojson",
            status="ready",
            downloadUrl=f"/api/v1/simulations/{simulation_id}/files/flood_extent.geojson"
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail=f"Export format '{fmt}' is planned and not currently executable. Supported format in Phase 6: 'geojson'."
        )
