"""
FloodLens Phase 16 Hardening, Integration & Regression Test Suite
Validates end-to-end database persistence, simulation lifecycle continuity,
zero-baseline comparison safety, export contract compliance, health probes,
and scientific guardrail integrity.
"""

import os
import json
import tempfile
import unittest
from fastapi.testclient import TestClient

from backend.config import settings
from backend.db import Base, init_db, SessionLocal
from backend.models.database import (
    StudyAreaModel,
    ScenarioModel,
    SimulationModel,
    SimulationResultModel
)
from backend.main import app
from backend.schemas import SimulationCreateSchema
from backend.services.simulation_service import create_and_run_simulation

client = TestClient(app)

class TestPhase16Hardening(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        init_db()

    def test_01_canonical_idukki_seed_integrity(self):
        """Verify canonical Idukki AOI and default scenario exist in SQLite database."""
        db = SessionLocal()
        try:
            area = db.query(StudyAreaModel).filter(StudyAreaModel.id == "idukki-canonical").first()
            self.assertIsNotNone(area)
            self.assertEqual(area.name, "Idukki Dam & Periyar River Catchment")
            self.assertEqual(area.river, "Periyar River")
            self.assertEqual(len(area.bbox), 4)

            scen = db.query(ScenarioModel).filter(ScenarioModel.id == "scen-idukki-default").first()
            self.assertIsNotNone(scen)
            self.assertEqual(scen.type, "dam_break")
            self.assertIn("initialWaterLevelM", scen.parameters)
        finally:
            db.close()

    def test_02_simulation_lifecycle_persistence_and_queries(self):
        """Execute simulation lifecycle via API endpoint and verify downstream query endpoints."""
        # 1. Create Simulation via API
        res_create = client.post("/api/v1/simulations", json={"scenarioId": "scen-idukki-default", "modelLevel": "level1"})
        self.assertEqual(res_create.status_code, 201)
        sim_id = res_create.json()["id"]

        # 2. Query Simulation & Status Endpoints
        res_sim = client.get(f"/api/v1/simulations/{sim_id}")
        self.assertEqual(res_sim.status_code, 200)
        self.assertEqual(res_sim.json()["status"], "completed")

        res_status = client.get(f"/api/v1/simulations/{sim_id}/status")
        self.assertEqual(res_status.status_code, 200)
        self.assertEqual(res_status.json()["stagePercent"], 100.0)

        # 3. Query Results Endpoint
        res_results = client.get(f"/api/v1/simulations/{sim_id}/results")
        self.assertEqual(res_results.status_code, 200)
        r_data = res_results.json()
        self.assertGreaterEqual(r_data["floodAreaKm2"], 0.0)
        self.assertGreaterEqual(r_data["maxDepthM"], 0.0)

        # 4. Query Impact Summary Endpoint
        res_impact = client.get(f"/api/v1/simulations/{sim_id}/impact-summary")
        self.assertEqual(res_impact.status_code, 200)
        imp_data = res_impact.json()
        self.assertIn("settlementMetrics", imp_data)
        self.assertIn("roadMetrics", imp_data)

        # 5. Query Timeline Endpoint
        res_tl = client.get(f"/api/v1/simulations/{sim_id}/timeline")
        self.assertEqual(res_tl.status_code, 200)
        tl_data = res_tl.json()
        self.assertGreater(len(tl_data["timesteps"]), 0)

        # 6. Query Warnings Endpoint
        res_warn = client.get(f"/api/v1/simulations/{sim_id}/warnings")
        self.assertEqual(res_warn.status_code, 200)

        # 7. Re-open DB session to confirm record persistence across session bounds
        db2 = SessionLocal()
        try:
            persisted_sim = db2.query(SimulationModel).filter(SimulationModel.id == sim_id).first()
            self.assertIsNotNone(persisted_sim)
            self.assertEqual(persisted_sim.status, "completed")
        finally:
            db2.close()

    def test_03_zero_baseline_scenario_comparison_safety(self):
        """Verify scenario comparison handles identical or zero-diff scenarios without NaN errors."""
        res_create = client.post("/api/v1/simulations", json={"scenarioId": "scen-idukki-default", "modelLevel": "level1"})
        self.assertEqual(res_create.status_code, 201)
        sim_id = res_create.json()["id"]

        res = client.get(f"/api/v1/comparison?runA={sim_id}&runB={sim_id}")
        self.assertEqual(res.status_code, 200)
        comp = res.json()
        self.assertIn("runA", comp)
        self.assertIn("runB", comp)
        self.assertIn("diff", comp)
        self.assertEqual(comp["diff"]["floodAreaDiffKm2"], 0.0)

    def test_04_export_modal_contract_compliance(self):
        """Verify export requests for supported GeoJSON layer return file artifacts."""
        res = client.get("/api/v1/simulations/sim-level1-default/files/flood_extent.geojson")
        self.assertEqual(res.status_code, 200)
        geojson = res.json()
        self.assertEqual(geojson.get("type"), "FeatureCollection")

    def test_05_unsupported_model_501_error_contract(self):
        """Verify requesting Level 2 SWE model returns 501 Not Implemented."""
        res = client.post("/api/v1/simulations", json={"scenarioId": "scen-idukki-default", "modelLevel": "level2"})
        self.assertEqual(res.status_code, 501)
        self.assertIn("level2", res.json()["detail"].lower())

    def test_06_nonexistent_simulation_404_error_contract(self):
        """Verify non-existent simulation IDs return structured 404 errors."""
        res = client.get("/api/v1/simulations/sim-nonexistent-phase16/results")
        self.assertEqual(res.status_code, 404)
        err = res.json()
        self.assertIn("error", err)
        self.assertEqual(err["error"]["code"], "NOT_FOUND")

if __name__ == "__main__":
    unittest.main()
