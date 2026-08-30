import os
import json
import datetime
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from backend.config import settings

logger = logging.getLogger("floodlens.backend")

# Ensure data directory exists before database initialization
db_url = settings.DATABASE_URL
if db_url.startswith("sqlite:///"):
    db_path = db_url.replace("sqlite:///", "")
    db_dir = os.path.dirname(os.path.abspath(db_path))
    if db_dir and not os.path.exists(db_dir):
        os.makedirs(db_dir, exist_ok=True)

engine_kwargs = {}
if "sqlite" in db_url:
    engine_kwargs["connect_args"] = {"check_same_thread": False}

engine = create_engine(db_url, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    from backend.models.database import StudyAreaModel, ScenarioModel, SimulationModel, SimulationResultModel
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        canonical_id = "scen-nepal-glof"
        existing_area = db.query(StudyAreaModel).filter(StudyAreaModel.id == canonical_id).first()
        if not existing_area:
            config_path = os.path.join("data", "config", "canonical_aoi.json")
            if os.path.exists(config_path):
                with open(config_path, "r", encoding="utf-8") as f:
                    aoi_data = json.load(f)
                
                area = StudyAreaModel(
                    id=aoi_data.get("id", canonical_id),
                    name=aoi_data.get("name", "Lhende Khola & Bhote Koshi / Trishuli River Catchment"),
                    description=aoi_data.get("description", "Canonical AOI for Nepal Himalayan GLOF & Flash Flood Simulation"),
                    bbox=aoi_data.get("bbox", [85.20, 27.90, 85.50, 28.40]),
                    river=aoi_data.get("river", "Bhote Koshi / Trishuli River"),
                    dam_or_blockage=aoi_data.get("dam_or_blockage", "Rasuwagadhi Dam & Lhende Khola Barrier Lake"),
                    dem_dataset=aoi_data.get("dem_dataset", "Copernicus DEM 30m / SRTM 30m Nepal Himalayas"),
                    satellite_dataset=aoi_data.get("satellite_dataset", "Sentinel-1 / Sentinel-2 / PlanetScope")
                )
                db.add(area)
                db.commit()

        # Seed canonical scenario
        default_scen_id = "scen-nepal-glof"
        existing_scen = db.query(ScenarioModel).filter(ScenarioModel.id == default_scen_id).first()
        if not existing_scen:
            scen = ScenarioModel(
                id=default_scen_id,
                study_area_id=canonical_id,
                type="glof",
                parameters={
                    "initialWaterLevelM": 75.0,
                    "reservoirVolumeMm3": 15.0,
                    "breachWidthM": 120.0,
                    "breachFormationTimeMin": 20.0,
                    "simulationDurationHr": 2.25,
                    "roughnessCoefficient": 0.045
                },
                created_at=datetime.datetime.now(datetime.timezone.utc).isoformat()
            )
            db.add(scen)
            db.commit()

        # Seed Nepal study area
        nepal_id = "nepal-bhotekoshi"
        existing_nepal = db.query(StudyAreaModel).filter(StudyAreaModel.id == nepal_id).first()
        if not existing_nepal:
            area_nepal = StudyAreaModel(
                id=nepal_id,
                name="Nepal Himalayas — Lhende Khola to Bhote Koshi Flash Flood",
                description="Extreme flood caused by a large ice/rock avalanche creating a temporary landslide dam/barrier lake, followed by sudden failure and release of water, mud, rocks and debris downstream through Timure, Rasuwagadhi, and Syabrubesi.",
                bbox=[85.20, 27.80, 85.50, 28.30],
                river="Lhende Khola → Bhote Koshi River Corridor",
                dam_or_blockage="Ice/Rock Avalanche Temporary Landslide Dam (Breach Point)",
                dem_dataset="ALOS PALSAR 12.5m / Copernicus DEM",
                satellite_dataset="Sentinel-1 SAR / Sentinel-2 MSI"
            )
            db.add(area_nepal)
            db.commit()

        # Seed Nepal scenario
        nepal_scen_id = "scen-nepal-glof"
        existing_nepal_scen = db.query(ScenarioModel).filter(ScenarioModel.id == nepal_scen_id).first()
        if not existing_nepal_scen:
            scen_nepal = ScenarioModel(
                id=nepal_scen_id,
                study_area_id=nepal_id,
                type="glof",
                parameters={
                    "initialWaterLevelM": 75.0,
                    "reservoirVolumeMm3": 15.0,
                    "breachWidthM": 120.0,
                    "breachFormationTimeMin": 20.0,
                    "simulationDurationHr": 2.0,
                    "roughnessCoefficient": 0.045
                },
                created_at=datetime.datetime.now(datetime.timezone.utc).isoformat()
            )
            db.add(scen_nepal)
            db.commit()

        # Seed Nepal simulation runs
        for np_sim_id in ["NP-2026-08-26-001", "TRI-2025-08-26-001"]:
            existing_np_sim = db.query(SimulationModel).filter(SimulationModel.id == np_sim_id).first()
            if not existing_np_sim:
                sim_np = SimulationModel(
                    id=np_sim_id,
                    scenario_id=nepal_scen_id,
                    model_level="level1",
                    status="running" if np_sim_id == "NP-2026-08-26-001" else "completed",
                    stage="Level 1 Hydrodynamic Wave Routing (72%)",
                    stage_percent=72.0 if np_sim_id == "NP-2026-08-26-001" else 100.0,
                    data_source="dem_raster",
                    created_at=datetime.datetime.now(datetime.timezone.utc).isoformat()
                )
                db.add(sim_np)
                db.commit()

                sim_res = SimulationResultModel(
                    id=f"res-{np_sim_id}",
                    simulation_id=np_sim_id,
                    flood_area_km2=42.30,
                    max_depth_m=7.20,
                    max_velocity_ms=5.40,
                    arrival_time_min=18.0,
                    duration_hr=2.25,
                    roads_affected_km=14.5,
                    mass_balance_error_percent=0.08,
                    execution_time_seconds=18.4,
                    data_source="simulated"
                )
                db.add(sim_res)
                db.commit()

    except Exception as e:
        db.rollback()
        logger.warning(f"[DB Init Warning] Failed seeding canonical data: {e}")
    finally:
        db.close()
