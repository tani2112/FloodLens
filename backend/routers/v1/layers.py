"""
FloodLens REST API — Layers Router
Endpoints: GET /api/v1/simulations/{id}/layers
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Query
from backend.schemas import FloodLayerSchema
from backend.services.result_service import get_flood_layers

router = APIRouter(prefix="/simulations", tags=["Layers"])


@router.get("/{simulation_id}/layers", response_model=List[FloodLayerSchema])
def get_layers(simulation_id: str, timestep: Optional[int] = Query(-1, description="Timestep index (-1 for final frame)")):
    """Retrieves MapLibre layer descriptors for simulation."""
    layers = get_flood_layers(simulation_id, timestep=timestep)
    if layers is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Simulation '{simulation_id}' not found."
        )
    return layers
