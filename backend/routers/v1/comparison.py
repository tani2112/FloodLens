from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from backend.schemas import ComparisonResultSchema, ModelResultSchema
from backend.services.result_service import get_flood_results
from backend.services.simulation_service import get_simulation
from backend.services.impact_service import get_impact_summary
from backend.db import get_db

router = APIRouter(prefix="/comparison", tags=["Comparison"])

@router.get("", response_model=ComparisonResultSchema)
def compare_simulations_endpoint(runA: str, runB: str, db: Session = Depends(get_db)):
    """Computes side-by-side KPI differential comparison between baseline (runA) and comparison (runB) scenarios."""
    res_a = get_flood_results(runA, db=db)
    res_b = get_flood_results(runB, db=db)
    sim_a = get_simulation(runA, db=db)
    sim_b = get_simulation(runB, db=db)

    if not res_a or not sim_a:
        raise HTTPException(status_code=404, detail=f"Simulation run A '{runA}' not found or results not available.")
    if not res_b or not sim_b:
        raise HTTPException(status_code=404, detail=f"Simulation run B '{runB}' not found or results not available.")

    imp_a = get_impact_summary(runA, db=db)
    imp_b = get_impact_summary(runB, db=db)

    settlements_a = imp_a.get("settlementMetrics", {}).get("totalAffected", 0) if imp_a else 0
    settlements_b = imp_b.get("settlementMetrics", {}).get("totalAffected", 0) if imp_b else 0

    critical_a = imp_a.get("settlementMetrics", {}).get("criticalCount", 0) if imp_a else 0
    critical_b = imp_b.get("settlementMetrics", {}).get("criticalCount", 0) if imp_b else 0

    roads_a = imp_a.get("roadMetrics", {}).get("affectedRoadsLengthKm", res_a.roadsAffectedKm) if imp_a else res_a.roadsAffectedKm
    roads_b = imp_b.get("roadMetrics", {}).get("affectedRoadsLengthKm", res_b.roadsAffectedKm) if imp_b else res_b.roadsAffectedKm

    roads_pct_a = imp_a.get("roadMetrics", {}).get("affectedPercent", 0.0) if imp_a else 0.0
    roads_pct_b = imp_b.get("roadMetrics", {}).get("affectedPercent", 0.0) if imp_b else 0.0

    area_diff = round(res_b.floodAreaKm2 - res_a.floodAreaKm2, 4)
    area_pct_diff = round(((res_b.floodAreaKm2 - res_a.floodAreaKm2) / max(0.001, res_a.floodAreaKm2)) * 100.0, 2)

    depth_diff = round(res_b.maxDepthM - res_a.maxDepthM, 2)
    vel_diff = round(res_b.maxVelocityMs - res_a.maxVelocityMs, 2)

    arr_diff = round(res_b.arrivalTimeMin - res_a.arrivalTimeMin, 1)

    pop_diff = res_b.populationExposed - res_a.populationExposed

    return ComparisonResultSchema(
        runA=ModelResultSchema(simulationId=runA, modelLevel=sim_a.modelLevel, result=res_a),
        runB=ModelResultSchema(simulationId=runB, modelLevel=sim_b.modelLevel, result=res_b),
        diff={
            "floodAreaDiffKm2": area_diff,
            "floodAreaDiffPercent": area_pct_diff,
            "maxDepthDiffM": depth_diff,
            "maxVelocityDiffMs": vel_diff,
            "arrivalTimeDiffMin": arr_diff,
            "populationExposedDiff": pop_diff,
            "affectedSettlementsDiff": settlements_b - settlements_a,
            "criticalSettlementsDiff": critical_b - critical_a,
            "affectedRoadLengthDiffKm": round(roads_b - roads_a, 3),
            "affectedRoadPercentDiff": round(roads_pct_b - roads_pct_a, 1)
        }
    )
