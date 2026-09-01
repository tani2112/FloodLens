"""
FloodLens Phase 6 Unit & Integration Test Suite — FastAPI Backend REST Endpoints
Validates study areas, scenarios, simulation orchestration, status polling, results,
layers, exposure tables, warning decision-support alerts, safe file access, error handling,
and planned model rejection.
"""

import json
import os
import unittest
from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)


class TestBackendAPI(unittest.TestCase):

    def test_01_get_study_areas(self):
        response = client.get("/api/v1/study-areas")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)
        self.assertGreater(len(data), 0)
        self.assertEqual(data[0]["id"], "idukki-canonical")

    def test_02_get_canonical_study_area(self):
        response = client.get("/api/v1/study-areas/idukki-canonical")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["name"], "Idukki Dam & Periyar River Catchment")
        self.assertEqual(data["river"], "Periyar River")

    def test_03_invalid_study_area_returns_404(self):
        response = client.get("/api/v1/study-areas/nonexistent-area")
        self.assertEqual(response.status_code, 404)
        self.assertIn("not found", response.json()["detail"].lower())

    def test_04_get_scenarios(self):
        response = client.get("/api/v1/scenarios")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)
        self.assertGreater(len(data), 0)

    def test_05_create_valid_scenario(self):
        payload = {
            "studyAreaId": "idukki-canonical",
            "type": "dam_break",
            "parameters": {
                "initialWaterLevelM": 55.0,
                "reservoirVolumeMm3": 12.0,
                "breachWidthM": 120.0,
                "breachFormationTimeMin": 25.0,
                "simulationDurationHr": 1.0
            }
        }
        response = client.post("/api/v1/scenarios", json=payload)
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertTrue(data["id"].startswith("scen-"))
        self.assertEqual(data["type"], "dam_break")

    def test_06_reject_invalid_scenario_type(self):
        payload = {
            "studyAreaId": "idukki-canonical",
            "type": "invalid_scenario_type",
            "parameters": {}
        }
        response = client.post("/api/v1/scenarios", json=payload)
        self.assertEqual(response.status_code, 400)

    def test_07_simulation_orchestration_and_status(self):
        # 1. Create Scenario
        scen_resp = client.post("/api/v1/scenarios", json={
            "studyAreaId": "idukki-canonical",
            "type": "dam_break",
            "parameters": {
                "initialWaterLevelM": 40.0,
                "reservoirVolumeMm3": 5.0,
                "breachWidthM": 80.0,
                "breachFormationTimeMin": 20.0,
                "simulationDurationHr": 0.5
            }
        })
        scen_id = scen_resp.json()["id"]

        # 2. Trigger Level 1 Simulation
        sim_resp = client.post("/api/v1/simulations", json={
            "scenarioId": scen_id,
            "modelLevel": "level1"
        })
        self.assertEqual(sim_resp.status_code, 201)
        sim_data = sim_resp.json()
        sim_id = sim_data["id"]
        self.assertEqual(sim_data["status"], "completed")

        # 3. Check Status
        status_resp = client.get(f"/api/v1/simulations/{sim_id}/status")
        self.assertEqual(status_resp.status_code, 200)
        self.assertEqual(status_resp.json()["stagePercent"], 100.0)

        # 4. Retrieve Summary Results
        res_resp = client.get(f"/api/v1/simulations/{sim_id}/results")
        self.assertEqual(res_resp.status_code, 200)
        res_data = res_resp.json()
        self.assertEqual(res_data["simulationId"], sim_id)
        self.assertGreaterEqual(res_data["floodAreaKm2"], 0.0)

        # 5. Retrieve Map Layers
        layers_resp = client.get(f"/api/v1/simulations/{sim_id}/layers")
        self.assertEqual(layers_resp.status_code, 200)
        self.assertIsInstance(layers_resp.json(), list)

        # 6. Retrieve Exposure Table
        exp_resp = client.get(f"/api/v1/simulations/{sim_id}/exposure")
        self.assertEqual(exp_resp.status_code, 200)
        self.assertIsInstance(exp_resp.json(), list)

        # 7. Retrieve Warning Alerts
        warn_resp = client.get(f"/api/v1/simulations/{sim_id}/warnings")
        self.assertEqual(warn_resp.status_code, 200)
        self.assertIsInstance(warn_resp.json(), list)

        # 8. Test Safe Result File Access
        file_resp = client.get(f"/api/v1/simulations/{sim_id}/files/flood_extent.geojson")
        self.assertEqual(file_resp.status_code, 200)

    def test_08_planned_model_returns_501(self):
        response = client.post("/api/v1/simulations", json={
            "scenarioId": "scen-idukki-default",
            "modelLevel": "level2"
        })
        self.assertEqual(response.status_code, 501)
        self.assertIn("planned/adapter-only", response.json()["detail"].lower())

    def test_09_path_traversal_attack_prevention(self):
        # Attempt path traversal
        response = client.get("/api/v1/simulations/sim-test/files/../../etc/passwd")
        self.assertEqual(response.status_code, 404)

    def test_10_missing_simulation_returns_404(self):
        response = client.get("/api/v1/simulations/sim-nonexistent-999/results")
        self.assertEqual(response.status_code, 404)

    def test_11_health_and_root_endpoint(self):
        root_resp = client.get("/")
        self.assertEqual(root_resp.status_code, 200)
        self.assertIn("canonical_study_area", root_resp.json())

    def test_12_simulation_timeline_endpoint(self):
        # Retrieve timeline for default or completed simulation
        timeline_resp = client.get("/api/v1/simulations/sim-level1-default/timeline")
        self.assertEqual(timeline_resp.status_code, 200)
        data = timeline_resp.json()
        self.assertEqual(data["simulationId"], "sim-level1-default")
        self.assertIsInstance(data["timesteps"], list)
        self.assertGreater(len(data["timesteps"]), 0)
        first_ts = data["timesteps"][0]
        self.assertIn("timeMin", first_ts)
        self.assertIn("floodAreaKm2", first_ts)
        self.assertIn("maxDepthM", first_ts)
        self.assertIn("maxVelocityMs", first_ts)


if __name__ == "__main__":
    unittest.main()
