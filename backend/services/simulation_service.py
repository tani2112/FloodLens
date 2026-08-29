"""
FloodLens Backend — Simulation Orchestration Service
Orchestrates simulation execution, connects Level 1 solver to Phase 5 GIS exporter,
and tracks simulation lifecycle status.
"""

import os
import time
import uuid
from typing import List, Dict, Any, Optional

from backend.schemas import (
    SimulationSchema,
    SimulationCreateSchema,
    SimulationStatusSchema,
    SimulationStageSchema
)
from backend.services.scenario_service import get_scenario_by_id
from simulation.level1_diffusive import Level1DiffusiveModel
from gis.exporter import export_simulation_gis_results

# In-Memory Lifecycle Store
SIMULATION_STORE: Dict[str, Dict[str, Any]] = {}


def list_simulations() -> List[SimulationSchema]:
    """Returns list of past simulation runs."""
    res = []
    for s_id, s_data in SIMULATION_STORE.items():
        res.append(SimulationSchema(
            id=s_id,
            scenarioId=s_data["scenarioId"],
            modelLevel=s_data["modelLevel"],
            status=s_data["status"],
            dataSource="live" if s_data["status"] == "completed" else "mock",
            createdAt=s_data.get("createdAt", "2026-08-29T10:00:00Z")
        ))
    return res


def get_simulation_by_id(simulation_id: str) -> Optional[SimulationSchema]:
    """Retrieves simulation record by ID."""
    if simulation_id in SIMULATION_STORE:
        d = SIMULATION_STORE[simulation_id]
        return SimulationSchema(
            id=simulation_id,
            scenarioId=d["scenarioId"],
            modelLevel=d["modelLevel"],
            status=d["status"],
            dataSource="live" if d["status"] == "completed" else "mock",
            createdAt=d.get("createdAt", "2026-08-29T10:00:00Z")
        )
    return None


def get_simulation_status(simulation_id: str) -> Optional[SimulationStatusSchema]:
    """Returns lifecycle progress status for polling."""
    if simulation_id not in SIMULATION_STORE:
        return None
        
    d = SIMULATION_STORE[simulation_id]
    status = d["status"]
    
    if status == "completed":
        stages = [
            SimulationStageSchema(name="DEM Grid Ingestion", status="done"),
            SimulationStageSchema(name="2D Diffusive Propagation", status="done"),
            SimulationStageSchema(name="GIS Extent Vectorization", status="done"),
            SimulationStageSchema(name="Settlement Exposure Analysis", status="done"),
            SimulationStageSchema(name="Warning Alert Generation", status="done")
        ]
        pct = 100.0
        current_stage = "Completed"
    elif status == "failed":
        stages = [
            SimulationStageSchema(name="Model Selection", status="done"),
            SimulationStageSchema(name="Execution", status="failed")
        ]
        pct = 0.0
        current_stage = d.get("error", "Execution Failed")
    else:
        stages = [
            SimulationStageSchema(name="Model Selection", status="done"),
            SimulationStageSchema(name="Execution", status="running")
        ]
        pct = 50.0
        current_stage = "Running Simulation Engine"
        
    return SimulationStatusSchema(
        simulationId=simulation_id,
        stage=current_stage,
        stagePercent=pct,
        stages=stages
    )


def create_and_run_simulation(req: SimulationCreateSchema) -> SimulationSchema:
    """
    Orchestrates end-to-end simulation execution pipeline.
    
    1. Validates Scenario.
    2. Validates Model Level.
    3. Executes Level 1 Diffusive Solver if requested.
    4. Passes StandardGridResult to GIS Exporter.
    5. Returns completed simulation record.
    """
    scenario = get_scenario_by_id(req.scenarioId)
    if not scenario:
        raise ValueError(f"Unknown scenarioId: {req.scenarioId}")

    supported_models = ["level1", "level2", "sph_adapter", "delft3d_adapter"]
    if req.modelLevel not in supported_models:
        raise ValueError(f"Invalid modelLevel: {req.modelLevel}. Must be one of {supported_models}")

    sim_id = f"sim-{req.modelLevel}-{uuid.uuid4().hex[:6]}"
    created_at = "2026-08-29T10:40:00Z"

    # Handle Planned / Unimplemented Models explicitly
    if req.modelLevel != "level1":
        SIMULATION_STORE[sim_id] = {
            "id": sim_id,
            "scenarioId": req.scenarioId,
            "modelLevel": req.modelLevel,
            "status": "failed",
            "error": f"Model '{req.modelLevel}' is planned/adapter-only and not executable at Level 1 REST pipeline.",
            "createdAt": created_at
        }
        raise NotImplementedError(
            f"Model '{req.modelLevel}' is planned/adapter-only. Only Level 1 ('level1') native solver is executable in Phase 6."
        )

    # Register Running State
    SIMULATION_STORE[sim_id] = {
        "id": sim_id,
        "scenarioId": req.scenarioId,
        "modelLevel": req.modelLevel,
        "status": "running",
        "createdAt": created_at
    }

    try:
        # Prepare Scenario Parameters for Level 1 Solver
        scen_params = scenario.parameters
        solver_config = {
            "simulation_id": sim_id,
            "initial_water_level_m": float(scen_params.get("initialWaterLevelM", 50.0)),
            "reservoir_volume_m3": float(scen_params.get("reservoirVolumeMm3", 10.0)) * 1000000.0,
            "dam_height_m": float(scen_params.get("damHeightM", 168.9)),
            "breach_width_m": float(scen_params.get("breachWidthM", 100.0)),
            "breach_depth_m": float(scen_params.get("breachDepthM", 25.0)),
            "breach_formation_time_s": float(scen_params.get("breachFormationTimeMin", 30.0)) * 60.0,
            "simulation_duration_min": float(scen_params.get("simulationDurationHr", 1.0)) * 60.0,
            "roughness_coefficient": float(scen_params.get("roughnessCoefficient", 0.035)),
            "output_interval_min": 5.0,
            "arrival_threshold_m": 0.05
        }

        # Dem Path Resolution
        dem_path = "data/processed/dem.tif"
        if not os.path.exists(dem_path):
            dem_path = "data/dem.tif"

        # 1. Execute Level 1 Hydrodynamic Solver
        solver = Level1DiffusiveModel()
        grid_result = solver.run(solver_config, dem_raster_path=dem_path)

        # 2. Execute GIS Processing & Export Pipeline
        export_paths = export_simulation_gis_results(
            grid_result=grid_result,
            villages_path="data/processed/villages.geojson",
            roads_path="data/processed/roads.geojson",
            output_base_dir="data/results",
            depth_threshold_m=0.10
        )

        # 3. Save Completed State in Store
        SIMULATION_STORE[sim_id].update({
            "status": "completed",
            "grid_result": grid_result,
            "export_paths": export_paths,
            "summary_stats": grid_result.summary_stats,
            "mass_balance_info": grid_result.mass_balance_info
        })

        return SimulationSchema(
            id=sim_id,
            scenarioId=req.scenarioId,
            modelLevel=req.modelLevel,
            status="completed",
            dataSource="live",
            createdAt=created_at
        )

    except Exception as e:
        SIMULATION_STORE[sim_id]["status"] = "failed"
        SIMULATION_STORE[sim_id]["error"] = str(e)
        raise RuntimeError(f"Simulation pipeline failed: {str(e)}")
