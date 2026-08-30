import os
import json
import datetime
import uuid
import time
import logging
from typing import List, Optional
from fastapi import HTTPException
from sqlalchemy.orm import Session

from backend.schemas import (
    SimulationCreateSchema,
    SimulationSchema,
    SimulationStatusSchema,
    SimulationStageSchema
)
from backend.services.scenario_service import get_scenario
from backend.models.database import (
    SimulationModel,
    SimulationResultModel,
    ResultArtifactModel
)
from simulation.engine import HydrodynamicEngineConfig, HydrodynamicSimulationEngine
from gis.exporter import export_simulation_gis_results

logger = logging.getLogger("floodlens.simulation")

_IN_MEMORY_SIMULATIONS: dict = {}

def list_simulations(db: Optional[Session] = None) -> List[SimulationSchema]:
    if db:
        sims = db.query(SimulationModel).all()
        if sims:
            return [
                SimulationSchema(
                    id=s.id,
                    scenarioId=s.scenario_id,
                    modelLevel=s.model_level,
                    status=s.status,
                    dataSource=s.data_source,
                    createdAt=s.created_at
                )
                for s in sims
            ]
    return list(_IN_MEMORY_SIMULATIONS.values())

def get_simulation(simulation_id: str, db: Optional[Session] = None) -> Optional[SimulationSchema]:
    if db:
        s = db.query(SimulationModel).filter(SimulationModel.id == simulation_id).first()
        if s:
            return SimulationSchema(
                id=s.id,
                scenarioId=s.scenario_id,
                modelLevel=s.model_level,
                status=s.status,
                dataSource=s.data_source,
                createdAt=s.created_at
            )
    return _IN_MEMORY_SIMULATIONS.get(simulation_id)

get_simulation_by_id = get_simulation

def get_simulation_status(simulation_id: str, db: Optional[Session] = None) -> SimulationStatusSchema:
    if db:
        s = db.query(SimulationModel).filter(SimulationModel.id == simulation_id).first()
        if s:
            stages = [
                SimulationStageSchema(name="Scenario Preparation & Validation", status="done"),
                SimulationStageSchema(name="Level 1 Hydrodynamic Solver Execution", status="done" if s.status == "completed" else "running" if s.status == "running" else "failed" if s.status == "failed" else "pending"),
                SimulationStageSchema(name="GIS Flood Layer & Vector Exporter", status="done" if s.status == "completed" else "pending"),
                SimulationStageSchema(name="Settlement Exposure & Warning Alerts", status="done" if s.status == "completed" else "pending")
            ]
            return SimulationStatusSchema(
                simulationId=s.id,
                stage=s.stage,
                stagePercent=s.stage_percent,
                stages=stages
            )

    sim = get_simulation(simulation_id, db)
    if not sim:
        raise HTTPException(
            status_code=404,
            detail=f"Simulation '{simulation_id}' not found."
        )

    stages = [
        SimulationStageSchema(name="Scenario Preparation & Validation", status="done"),
        SimulationStageSchema(name="Level 1 Hydrodynamic Solver Execution", status="done" if sim.status == "completed" else "failed" if sim.status == "failed" else "pending"),
        SimulationStageSchema(name="GIS Flood Layer & Vector Exporter", status="done" if sim.status == "completed" else "pending"),
        SimulationStageSchema(name="Settlement Exposure & Warning Alerts", status="done" if sim.status == "completed" else "pending")
    ]
    return SimulationStatusSchema(
        simulationId=sim.id,
        stage="Completed" if sim.status == "completed" else "Failed",
        stagePercent=100.0 if sim.status == "completed" else 0.0,
        stages=stages
    )

def create_and_run_simulation(data: SimulationCreateSchema, db: Optional[Session] = None) -> SimulationSchema:
    scenario = get_scenario(data.scenarioId, db)
    if not scenario:
        logger.warning(f"Simulation creation failed: Scenario '{data.scenarioId}' not found.")
        raise HTTPException(
            status_code=404,
            detail=f"Scenario '{data.scenarioId}' not found."
        )

    supported_models = {"level1"}
    planned_models = {"level2", "sph_adapter", "delft3d_adapter"}

    if data.modelLevel in planned_models:
        logger.warning(f"Simulation creation rejected: Model level '{data.modelLevel}' is planned/adapter-only.")
        raise HTTPException(
            status_code=501,
            detail=f"Model level '{data.modelLevel}' is planned/adapter-only for a future release and is not yet implemented."
        )

    if data.modelLevel not in supported_models:
        logger.warning(f"Simulation creation rejected: Invalid model level '{data.modelLevel}'.")
        raise HTTPException(
            status_code=400,
            detail=f"Invalid model level '{data.modelLevel}'. Must be one of {supported_models}."
        )

    sim_id = f"sim-level1-{uuid.uuid4().hex[:6]}"
    created_at = datetime.datetime.now(datetime.timezone.utc).isoformat()

    sim_schema = SimulationSchema(
        id=sim_id,
        scenarioId=data.scenarioId,
        modelLevel=data.modelLevel,
        status="running",
        dataSource="live",
        createdAt=created_at
    )
    _IN_MEMORY_SIMULATIONS[sim_id] = sim_schema

    if db:
        sim_model = SimulationModel(
            id=sim_id,
            scenario_id=data.scenarioId,
            model_level=data.modelLevel,
            status="running",
            stage="Running Level 1 Hydrodynamic Engine",
            stage_percent=25.0,
            data_source="live",
            created_at=created_at
        )
        db.add(sim_model)
        db.commit()

    logger.info(f"[{sim_id}] Simulation created and registered. Initializing Level 1 hydrodynamic engine...")
    start_time = time.time()
    try:
        engine_config = HydrodynamicEngineConfig(
            simulation_id=sim_id,
            aoi_id=scenario.studyAreaId,
            scenario_type=scenario.type,
            initial_head_m=float(scenario.parameters.get("initialWaterLevelM", 50.0)),
            storage_volume_mm3=float(scenario.parameters.get("reservoirVolumeMm3", 10.0)),
            breach_width_m=float(scenario.parameters.get("breachWidthM", 100.0)),
            breach_formation_time_min=float(scenario.parameters.get("breachFormationTimeMin", 30.0)),
            simulation_duration_hr=float(scenario.parameters.get("simulationDurationHr", 1.0)),
            manning_n=float(scenario.parameters.get("roughnessCoefficient", 0.035))
        )

        engine = HydrodynamicSimulationEngine(config=engine_config)
        grid_result = engine.run_simulation()
        logger.info(f"[{sim_id}] Level 1 2D hydrodynamic solver complete. Exporting GIS result layers...")

        export_paths = export_simulation_gis_results(
            grid_result=grid_result
        )
        results_dir = os.path.dirname(export_paths["metadata"])

        exec_time = time.time() - start_time
        logger.info(f"[{sim_id}] GIS export complete. Total duration: {exec_time:.2f}s.")

        # Read exported summary metadata KPI values
        meta_path = os.path.join(results_dir, "metadata.json")
        meta_data = {}
        if os.path.exists(meta_path):
            with open(meta_path, "r", encoding="utf-8") as f:
                meta_data = json.load(f)

        sim_schema.status = "completed"

        if db:
            sim_model = db.query(SimulationModel).filter(SimulationModel.id == sim_id).first()
            if sim_model:
                sim_model.status = "completed"
                sim_model.stage = "Completed"
                sim_model.stage_percent = 100.0
                sim_model.completed_at = datetime.datetime.now(datetime.timezone.utc).isoformat()

            stats = grid_result.summary_stats or {}
            mb = grid_result.mass_balance_info or {}

            # Insert SimulationResultModel
            res_model = SimulationResultModel(
                id=f"res-{uuid.uuid4().hex[:8]}",
                simulation_id=sim_id,
                flood_area_km2=float(meta_data.get("flood_area_km2", stats.get("total_flood_area_km2", 0.0))),
                max_depth_m=float(meta_data.get("max_depth_m", stats.get("max_depth_m", 0.0))),
                max_velocity_ms=float(meta_data.get("max_velocity_ms", stats.get("max_velocity_ms", 0.0))),
                arrival_time_min=float(meta_data.get("arrival_time_min", stats.get("min_arrival_time_min", 0.0))),
                duration_hr=float(meta_data.get("duration_hr", 1.0)),
                population_exposed=meta_data.get("population_exposed", 0),
                buildings_affected=meta_data.get("buildings_affected", 0),
                roads_affected_km=float(meta_data.get("roads_affected_km", 0.0)),
                mass_balance_error_percent=float(mb.get("mass_balance_error_percent", 0.0)),
                execution_time_seconds=float(exec_time),
                data_source="live"
            )
            db.add(res_model)

            # Insert ResultArtifactModel records
            artifact_files = [
                ("flood_extent.geojson", "extent_geojson", "application/geo+json"),
                ("flood_layers.json", "layers_json", "application/json"),
                ("exposure.json", "exposure_json", "application/json"),
                ("metadata.json", "metadata_json", "application/json")
            ]

            for fname, atype, ctype in artifact_files:
                fpath = os.path.join(results_dir, fname)
                fsize = os.path.getsize(fpath) if os.path.exists(fpath) else 0
                rel_path = os.path.relpath(fpath, os.getcwd())
                art_model = ResultArtifactModel(
                    id=f"art-{uuid.uuid4().hex[:8]}",
                    simulation_id=sim_id,
                    artifact_type=atype,
                    relative_path=rel_path,
                    file_size=fsize,
                    content_type=ctype
                )
                db.add(art_model)

            db.commit()
            logger.info(f"[{sim_id}] Simulation state and result artifacts persisted to database.")

        return sim_schema

    except Exception as e:
        logger.error(f"[{sim_id}] Simulation failed during execution: {e}", exc_info=True)
        sim_schema.status = "failed"
        if db:
            sim_model = db.query(SimulationModel).filter(SimulationModel.id == sim_id).first()
            if sim_model:
                sim_model.status = "failed"
                sim_model.stage = "Failed"
                sim_model.error_message = str(e)
                db.commit()
        raise HTTPException(
            status_code=500,
            detail=f"Simulation failed during execution: {str(e)}"
        )
