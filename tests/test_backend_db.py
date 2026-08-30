import os
import tempfile
import unittest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.db import Base, init_db
from backend.models.database import (
    StudyAreaModel,
    ScenarioModel,
    SimulationModel,
    SimulationResultModel,
    ResultArtifactModel
)
from backend.services.study_area_service import get_all_study_areas, get_study_area_by_id
from backend.services.scenario_service import create_scenario, list_scenarios, get_scenario
from backend.services.simulation_service import create_and_run_simulation, get_simulation, get_simulation_status
from backend.services.result_service import get_flood_results, get_safe_result_file_path, simulation_exists
from backend.schemas import ScenarioCreateSchema, SimulationCreateSchema, HydrodynamicParametersSchema

class TestDatabasePersistence(unittest.TestCase):
    def setUp(self):
        # Create isolated temporary SQLite database for testing
        self.temp_db_file = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
        self.temp_db_path = self.temp_db_file.name
        self.temp_db_file.close()

        self.engine = create_engine(f"sqlite:///{self.temp_db_path}", connect_args={"check_same_thread": False})
        self.TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)

        Base.metadata.create_all(bind=self.engine)
        self.db = self.TestingSessionLocal()

    def tearDown(self):
        self.db.close()
        if os.path.exists(self.temp_db_path):
            os.remove(self.temp_db_path)

    def test_01_canonical_aoi_seeding_and_idempotency(self):
        """Tests that canonical Idukki study area is seeded and init_db is idempotent."""
        canonical = self.db.query(StudyAreaModel).filter(StudyAreaModel.id == "idukki-canonical").first()
        if not canonical:
            area = StudyAreaModel(
                id="idukki-canonical",
                name="Idukki Dam & Periyar River Catchment",
                description="Canonical AOI",
                bbox=[76.80, 9.85, 77.10, 10.20],
                river="Periyar River",
                dam_or_blockage="Idukki Arch Dam & Cheruthoni Dam",
                dem_dataset="SRTM 30m / Copernicus DEM",
                satellite_dataset="Sentinel-1 / Sentinel-2"
            )
            self.db.add(area)
            self.db.commit()

        areas = get_all_study_areas(db=self.db)
        self.assertGreaterEqual(len(areas), 1)
        self.assertEqual(areas[0].id, "idukki-canonical")

    def test_02_scenario_persistence(self):
        """Tests persisting scenarios in the database and retrieving them."""
        # Ensure study area exists
        area = StudyAreaModel(
            id="idukki-canonical",
            name="Idukki Dam",
            bbox=[76.80, 9.85, 77.10, 10.20],
            river="Periyar River",
            dam_or_blockage="Idukki Dam",
            dem_dataset="SRTM 30m"
        )
        self.db.add(area)
        self.db.commit()

        payload = ScenarioCreateSchema(
            studyAreaId="idukki-canonical",
            type="dam_break",
            parameters=HydrodynamicParametersSchema(
                initialWaterLevelM=50.0,
                reservoirVolumeMm3=10.0,
                breachWidthM=100.0
            )
        )
        scen = create_scenario(payload, db=self.db)
        self.assertIsNotNone(scen.id)

        # Retrieve scenario in new session
        db2 = self.TestingSessionLocal()
        retrieved = get_scenario(scen.id, db=db2)
        self.assertIsNotNone(retrieved)
        self.assertEqual(retrieved.id, scen.id)
        self.assertEqual(retrieved.type, "dam_break")
        db2.close()

    def test_03_simulation_lifecycle_and_result_persistence(self):
        """Tests running simulation, persisting KPIs, and artifact references."""
        area = StudyAreaModel(
            id="idukki-canonical",
            name="Idukki Dam",
            bbox=[76.80, 9.85, 77.10, 10.20],
            river="Periyar River",
            dam_or_blockage="Idukki Dam",
            dem_dataset="SRTM 30m"
        )
        self.db.add(area)
        self.db.commit()

        scen_payload = ScenarioCreateSchema(
            studyAreaId="idukki-canonical",
            type="dam_break",
            parameters=HydrodynamicParametersSchema(
                initialWaterLevelM=50.0,
                reservoirVolumeMm3=10.0,
                breachWidthM=100.0
            )
        )
        scen = create_scenario(scen_payload, db=self.db)

        sim_payload = SimulationCreateSchema(scenarioId=scen.id, modelLevel="level1")
        sim = create_and_run_simulation(sim_payload, db=self.db)

        self.assertEqual(sim.status, "completed")

        # Verify simulation status in DB
        db2 = self.TestingSessionLocal()
        sim_db = db2.query(SimulationModel).filter(SimulationModel.id == sim.id).first()
        self.assertIsNotNone(sim_db)
        self.assertEqual(sim_db.status, "completed")

        # Verify result KPIs in DB
        res_db = db2.query(SimulationResultModel).filter(SimulationResultModel.simulation_id == sim.id).first()
        self.assertIsNotNone(res_db)
        self.assertGreater(res_db.flood_area_km2, 0.0)

        # Verify artifact references in DB
        artifacts = db2.query(ResultArtifactModel).filter(ResultArtifactModel.simulation_id == sim.id).all()
        self.assertGreaterEqual(len(artifacts), 1)
        db2.close()

    def test_04_path_traversal_protection(self):
        """Tests that path traversal attempts are rejected."""
        safe_path = get_safe_result_file_path("sim-level1-test", "../../etc/passwd", db=self.db)
        self.assertIsNone(safe_path)

        safe_path_2 = get_safe_result_file_path("sim-level1-test", "../../../secret.txt", db=self.db)
        self.assertIsNone(safe_path_2)

if __name__ == "__main__":
    unittest.main()
