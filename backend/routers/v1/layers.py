from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from backend.schemas import FloodLayerSchema
from backend.services.result_service import get_flood_layers
from backend.db import get_db

router = APIRouter(prefix="/simulations", tags=["Layers"])

@router.get("/{simulation_id}/layers", response_model=List[FloodLayerSchema])
def get_simulation_layers_endpoint(simulation_id: str, timestep: Optional[int] = -1, db: Session = Depends(get_db)):
    """Retrieves MapLibre vector/raster layer descriptors."""
    layers = get_flood_layers(simulation_id, timestep=timestep, db=db)
    if layers is None:
        raise HTTPException(
            status_code=404,
            detail=f"Simulation '{simulation_id}' not found."
        )
    return layers
