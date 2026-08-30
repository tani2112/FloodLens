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
    from backend.models.database import StudyAreaModel, ScenarioModel
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        canonical_id = "idukki-canonical"
        existing_area = db.query(StudyAreaModel).filter(StudyAreaModel.id == canonical_id).first()
        if not existing_area:
            config_path = os.path.join("data", "config", "canonical_aoi.json")
            if os.path.exists(config_path):
                with open(config_path, "r", encoding="utf-8") as f:
                    aoi_data = json.load(f)
                
                area = StudyAreaModel(
                    id=aoi_data.get("id", canonical_id),
                    name=aoi_data.get("name", "Idukki Dam & Periyar River Catchment"),
                    description=aoi_data.get("description", "Canonical AOI for FloodLens MVP"),
                    bbox=aoi_data.get("bbox", [76.80, 9.85, 77.10, 10.20]),
                    river=aoi_data.get("river", "Periyar River"),
                    dam_or_blockage=aoi_data.get("dam_or_blockage", "Idukki Arch Dam & Cheruthoni Dam"),
                    dem_dataset=aoi_data.get("dem_dataset", "SRTM 30m / Copernicus DEM"),
                    satellite_dataset=aoi_data.get("satellite_dataset", "Sentinel-1 / Sentinel-2")
                )
                db.add(area)
                db.commit()

        # Seed canonical scenario
        default_scen_id = "scen-idukki-default"
        existing_scen = db.query(ScenarioModel).filter(ScenarioModel.id == default_scen_id).first()
        if not existing_scen:
            scen = ScenarioModel(
                id=default_scen_id,
                study_area_id=canonical_id,
                type="dam_break",
                parameters={
                    "initialWaterLevelM": 50.0,
                    "reservoirVolumeMm3": 10.0,
                    "breachWidthM": 100.0,
                    "breachFormationTimeMin": 30.0,
                    "simulationDurationHr": 1.0,
                    "roughnessCoefficient": 0.035
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
                name="Nepal Bhotekoshi–Trishuli GLOF Study Area",
                description="Analytical case study of Glacial Lake Outburst Flood (GLOF) propagation in Himalayan terrain",
                bbox=[85.20, 27.80, 85.50, 28.10],
                river="Bhotekoshi & Trishuli River Corridor",
                dam_or_blockage="Moraine Dam Breach / Glacial Lake Outburst",
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

    except Exception as e:
        db.rollback()
        logger.warning(f"[DB Init Warning] Failed seeding canonical data: {e}")
    finally:
        db.close()
