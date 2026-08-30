"""
Unit and Integration Tests for FloodLens Phase 12 — Advanced Flood Impact Analytics
Tests endpoints, exposure logic, road temporal impact, infrastructure unavailable state, and scenario comparison.
"""

import unittest
import os
import json
import numpy as np
from fastapi.testclient import TestClient

from backend.main import app
from simulation.engine import StandardGridResult, GridMetadata
from gis.exposure import (
    calculate_village_exposure,
    calculate_settlement_impact_summary,
    calculate_road_exposure,
    calculate_infrastructure_exposure,
    calculate_temporal_impact_milestones
)


class TestImpactAnalytics(unittest.TestCase):

    def setUp(self):
        self.client = TestClient(app)
        self.sim_id = "sim-level1-default"
        
        # Mock 3D depth and 3D velocity arrays
        shape = (5, 50, 50)
        self.depth_3d = np.zeros(shape, dtype=np.float32)
        self.depth_3d[1:, 20:30, 20:30] = 1.5
        self.depth_3d[3:, 22:28, 22:28] = 3.5

        self.vel_3d = np.zeros(shape, dtype=np.float32)
        self.vel_3d[1:, 20:30, 20:30] = 0.8
        self.vel_3d[3:, 22:28, 22:28] = 2.2

        self.grid_meta = GridMetadata(
            crs="EPSG:32643",
            width=50,
            height=50,
            cell_size=30.0,
            timesteps=[0.0, 5.0, 10.0, 15.0, 20.0]
        )

        self.mock_grid_result = StandardGridResult(
            simulation_id=self.sim_id,
            solver_name="native_python_diffusive_wave",
            solver_level="level1",
            depth_array=self.depth_3d,
            velocity_array=self.vel_3d,
            arrival_time_array=np.full((50, 50), 12.0, dtype=np.float32),
            grid_meta=self.grid_meta,
            execution_time_seconds=1.5,
            mass_balance_info={"error": 0.001},
            summary_stats={
                "flood_area_km2": 0.36,
                "max_depth_m": 3.5,
                "max_velocity_ms": 2.2,
                "min_arrival_time_min": 5.0
            }
        )

    def test_01_settlement_impact_summary_aggregation(self):
        villages_path = "data/processed/villages.geojson"
        if os.path.exists(villages_path):
            exp_results = calculate_village_exposure(villages_path, self.mock_grid_result)
            self.assertIsInstance(exp_results, list)
            summary = calculate_settlement_impact_summary(exp_results)
            self.assertIn("totalEvaluated", summary)
            self.assertIn("totalAffected", summary)
            self.assertIn("maxSettlementSeverity", summary)
            self.assertIn("populationDataStatus", summary)
            self.assertEqual(summary["totalEvaluated"], len(exp_results))

    def test_02_road_impact_temporal_metrics(self):
        roads_path = "data/processed/roads.geojson"
        if os.path.exists(roads_path):
            road_res = calculate_road_exposure(roads_path, self.mock_grid_result)
            self.assertIn("totalNetworkLengthKm", road_res)
            self.assertIn("affectedRoadsLengthKm", road_res)
            self.assertIn("unaffectedLengthKm", road_res)
            self.assertIn("affectedPercent", road_res)
            self.assertIn("roadImpactTimeline", road_res)
            self.assertGreaterEqual(road_res["unaffectedLengthKm"], 0.0)

    def test_03_infrastructure_dataset_unavailable_state(self):
        non_existent_path = "data/processed/non_existent_infrastructure.geojson"
        infra_res = calculate_infrastructure_exposure(non_existent_path, self.mock_grid_result)
        self.assertEqual(infra_res["status"], "dataset_unavailable")
        self.assertEqual(infra_res["evaluatedAssetsCount"], 0)
        self.assertEqual(infra_res["affectedAssetsCount"], 0)
        self.assertEqual(infra_res["assets"], [])
        self.assertIn("unavailable", infra_res["message"].lower())

    def test_04_temporal_impact_milestones(self):
        villages_path = "data/processed/villages.geojson"
        roads_path = "data/processed/roads.geojson"
        if os.path.exists(villages_path) and os.path.exists(roads_path):
            exp = calculate_village_exposure(villages_path, self.mock_grid_result)
            rd = calculate_road_exposure(roads_path, self.mock_grid_result)
            ms = calculate_temporal_impact_milestones(self.mock_grid_result, exp, rd)
            self.assertIn("firstInundationTimeMin", ms)
            self.assertIn("peakInundationAreaTimeMin", ms)
            self.assertIn("peakDepthTimeMin", ms)
            self.assertIn("impactTimeline", ms)
            self.assertEqual(len(ms["impactTimeline"]), 5)

    def test_05_impact_summary_endpoint(self):
        response = self.client.get(f"/api/v1/simulations/{self.sim_id}/impact-summary")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["simulationId"], self.sim_id)
        self.assertIn("floodMetrics", data)
        self.assertIn("settlementMetrics", data)
        self.assertIn("roadMetrics", data)
        self.assertIn("infrastructureMetrics", data)
        self.assertIn("severitySummary", data)
        self.assertIn("scientificDisclaimer", data)

    def test_06_impact_timeline_endpoint(self):
        response = self.client.get(f"/api/v1/simulations/{self.sim_id}/impact-timeline")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["simulationId"], self.sim_id)
        self.assertIn("timeline", data)
        self.assertIsInstance(data["timeline"], list)

    def test_07_impact_unknown_simulation_404(self):
        response = self.client.get("/api/v1/simulations/sim-non-existent/impact-summary")
        self.assertEqual(response.status_code, 404)

        response2 = self.client.get("/api/v1/simulations/sim-non-existent/impact-timeline")
        self.assertEqual(response2.status_code, 404)

    def test_08_scenario_impact_comparison_endpoint(self):
        # Create scenario first via API
        scen_payload = {
            "studyAreaId": "idukki-canonical",
            "type": "dam_break",
            "parameters": {
                "peakInflowM3s": 5000.0,
                "breachWidthM": 120.0,
                "breachFormationTimeMin": 30.0,
                "simulationDurationHr": 1.0
            }
        }
        res_scen = self.client.post("/api/v1/scenarios", json=scen_payload)
        self.assertEqual(res_scen.status_code, 201)
        scen_id = res_scen.json()["id"]

        sim_payload = {
            "scenarioId": scen_id,
            "modelLevel": "level1"
        }
        res_sim = self.client.post("/api/v1/simulations", json=sim_payload)
        self.assertEqual(res_sim.status_code, 201)
        sim_id_a = res_sim.json()["id"]

        response = self.client.get(f"/api/v1/comparison?runA={sim_id_a}&runB={sim_id_a}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("runA", data)
        self.assertIn("runB", data)
        self.assertIn("diff", data)
        self.assertIn("floodAreaDiffKm2", data["diff"])
        self.assertIn("affectedSettlementsDiff", data["diff"])


if __name__ == "__main__":
    unittest.main()
