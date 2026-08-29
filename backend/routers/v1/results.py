"""
FloodLens REST API — Results & Result Files Router
Endpoints: GET /api/v1/simulations/{id}/results, GET /api/v1/simulations/{id}/files/{filename}
"""

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import FileResponse
from backend.schemas import FloodResultSchema
from backend.services.result_service import get_flood_results, get_safe_result_file_path

router = APIRouter(prefix="/simulations", tags=["Results"])


@router.get("/{simulation_id}/results", response_model=FloodResultSchema)
def get_results(simulation_id: str):
    """Retrieves high-level summary KPI metrics for completed simulation run."""
    res = get_flood_results(simulation_id)
    if not res:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Results for simulation '{simulation_id}' not found."
        )
    return res


@router.get("/{simulation_id}/files/{filename}")
def get_result_file(simulation_id: str, filename: str):
    """Safely serves generated GIS result files (GeoJSON, JSON metadata) with path-traversal protection."""
    safe_path = get_safe_result_file_path(simulation_id, filename)
    if not safe_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Result file '{filename}' for simulation '{simulation_id}' not found or access denied."
        )
    return FileResponse(safe_path)
