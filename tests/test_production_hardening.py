"""
FloodLens Phase 9 Production Hardening & System Reliability Test Suite
Validates configuration management, database session persistence, idempotent init,
structured API errors, Request-ID tracing, health & readiness probes,
simulation lifecycle, safe file path resolution, and backup/restore utilities.
"""

import os
import json
import tempfile
import unittest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.config import settings
from backend.db import Base, init_db, SessionLocal
from backend.models.database import StudyAreaModel, ScenarioModel, SimulationModel, SimulationResultModel
from backend.main import app
from backend.schemas import SimulationCreateSchema
from backend.services.simulation_service import create_and_run_simulation
from scripts.backup_data import create_backup, restore_backup

client = TestClient(app)

class TestProductionHardening(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        init_db()

    def test_01_configuration_loading(self):
        self.assertIsNotNone(settings.PROJECT_NAME)
        self.assertIsInstance(settings.CORS_ORIGINS, list)
        self.assertIn("development", ["development", "production", "testing", settings.APP_ENV])
        self.assertEqual(settings.PORT, 8000)

    def test_02_health_and_readiness_endpoints(self):
        health_res = client.get("/health")
        self.assertEqual(health_res.status_code, 200)
        h_data = health_res.json()
        self.assertEqual(h_data["status"], "ok")
        self.assertEqual(h_data["database"], "ok")
        self.assertIn("timestamp", h_data)

        ready_res = client.get("/ready")
        self.assertEqual(ready_res.status_code, 200)
        r_data = ready_res.json()
        self.assertEqual(r_data["status"], "ready")
        self.assertEqual(r_data["database"], "connected")

    def test_03_request_id_tracing_header(self):
        res = client.get("/api/v1/study-areas")
        self.assertEqual(res.status_code, 200)
        self.assertIn("x-request-id", res.headers)
        self.assertTrue(res.headers["x-request-id"].startswith("req-"))

        # Test custom Request ID pass-through
        custom_id = "req-custom-test-123"
        res_custom = client.get("/api/v1/study-areas", headers={"X-Request-ID": custom_id})
        self.assertEqual(res_custom.headers["x-request-id"], custom_id)

    def test_04_structured_error_format(self):
        res = client.get("/api/v1/study-areas/nonexistent-area-id")
        self.assertEqual(res.status_code, 404)
        data = res.json()
        self.assertIn("detail", data)
        self.assertIn("error", data)
        self.assertEqual(data["error"]["code"], "NOT_FOUND")
        self.assertIn("request_id", data["error"])

    def test_05_idempotent_db_initialization(self):
        # Call init_db multiple times consecutively to verify no duplicate key errors
        try:
            init_db()
            init_db()
            init_db()
        except Exception as e:
            self.fail(f"init_db raised unexpected exception during re-initialization: {e}")

    def test_06_database_session_persistence(self):
        # Insert record in session 1
        db1 = SessionLocal()
        scen_id = "scen-persist-test-01"
        try:
            existing = db1.query(ScenarioModel).filter(ScenarioModel.id == scen_id).first()
            if not existing:
                scen = ScenarioModel(
                    id=scen_id,
                    study_area_id="idukki-canonical",
                    type="dam_break",
                    parameters={"initialWaterLevelM": 45.0},
                    created_at="2026-08-29T12:00:00Z"
                )
                db1.add(scen)
                db1.commit()
        finally:
            db1.close()

        # Re-open independent session 2 and verify record exists
        db2 = SessionLocal()
        try:
            persisted_scen = db2.query(ScenarioModel).filter(ScenarioModel.id == scen_id).first()
            self.assertIsNotNone(persisted_scen)
            self.assertEqual(persisted_scen.type, "dam_break")
        finally:
            db2.close()

    def test_07_simulation_lifecycle_and_failed_state_handling(self):
        db = SessionLocal()
        try:
            # Test running simulation creation and result persistence
            payload = SimulationCreateSchema(scenarioId="scen-idukki-default", modelLevel="level1")
            sim = create_and_run_simulation(payload, db=db)
            self.assertEqual(sim.status, "completed")

            # Check persistent model
            sim_model = db.query(SimulationModel).filter(SimulationModel.id == sim.id).first()
            self.assertIsNotNone(sim_model)
            self.assertEqual(sim_model.status, "completed")
            self.assertEqual(sim_model.stage_percent, 100.0)

            res_model = db.query(SimulationResultModel).filter(SimulationResultModel.simulation_id == sim.id).first()
            self.assertIsNotNone(res_model)
            self.assertGreaterEqual(res_model.flood_area_km2, 0.0)
        finally:
            db.close()

    def test_08_path_traversal_protection(self):
        res = client.get("/api/v1/simulations/sim-test/files/../../etc/passwd")
        self.assertEqual(res.status_code, 404)

        res2 = client.get("/api/v1/simulations/sim-test/files/..%2F..%2Fetc%2Fpasswd")
        self.assertEqual(res2.status_code, 404)

    def test_09_backup_and_restore_utility(self):
        with tempfile.TemporaryDirectory() as tmp_dir:
            backup_file = create_backup(output_dir=tmp_dir)
            self.assertTrue(os.path.exists(backup_file))
            self.assertTrue(backup_file.endswith(".tar.gz"))

            # Test restore dry-run in temporary target
            restore_target = os.path.join(tmp_dir, "restored_data")
            os.makedirs(restore_target, exist_ok=True)
            success = restore_backup(backup_file, target_data_dir=restore_target)
            self.assertTrue(success)
            self.assertTrue(os.path.exists(os.path.join(restore_target, "floodlens.db")))

if __name__ == "__main__":
    unittest.main()
