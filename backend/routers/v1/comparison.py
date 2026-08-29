"""
FloodLens REST API — Comparison Router
Endpoints: GET /api/v1/comparison
"""

from fastapi import APIRouter, HTTPException, status, Query
from backend.schemas import ComparisonResultSchema
from backend.services.result_service import get_flood_results

router = APIRouter(prefix="/comparison", tags=["Comparison"])


@router.get("", response_model=ComparisonResultSchema)
def compare_simulations(runA: str = Query(..., description="Simulation ID for Run A"), runB: str = Query(..., description="Simulation ID for Run B")):
    """Compares side-by-side KPI outputs between two simulation runs."""
    resA = get_flood_results(runA)
    resB = get_flood_results(runB)
    
    if not resA:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Simulation '{runA}' not found.")
    if not resB:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Simulation '{runB}' not found.")

    diff_area = resB.floodAreaKm2 - resA.floodAreaKm2
    diff_depth = resB.maxDepthM - resA.maxDepthM
    diff_pop = (resB.populationExposed or 0) - (resA.populationExposed or 0)

    return ComparisonResultSchema(
        runA={"simulationId": runA, "modelLevel": "level1", "result": resA.dict()},
        runB={"simulationId": runB, "modelLevel": "level1", "result": resB.dict()},
        diff={
            "floodAreaDiffKm2": round(diff_area, 4),
            "maxDepthDiffM": round(diff_depth, 2),
            "populationExposedDiff": diff_pop
        }
    )
