"""
FloodLens Phase 5 Unit Test Suite — GIS Polygonization & Settlement Exposure Engine
Validates flood extent polygonization, CRS preservation, village/road exposure analysis,
warning decision support alert generation, empty-flood edge cases, and file exporter.
"""

import json
import os
import tempfile
import unittest
import numpy as np

from simulation.engine import StandardGridResult, GridMetadata
from gis.raster_to_vector import polygonize_flood_extent, generate_flood_layer_descriptors
from gis.exposure import calculate_village_exposure, calculate_road_exposure, classify_exposure_severity
from gis.warning_engine import generate_warning_alerts
from gis.exporter import export_simulation_gis_results


class TestGISExposureEngine(unittest.TestCase):

    def setUp(self):
        self.temp_dir = tempfile.mkdtemp()
        self.grid_meta = GridMetadata(width=20, height=20, cell_size=30.0)

        # Create synthetic 3D depth array [3 timesteps, 20, 20]
        depth_data = np.zeros((3, 20, 20), dtype=np.float32)
        # Wet area at row 10..12, col 8..10 with depth 1.5m
        depth_data[2, 10:13, 8:11] = 1.5
        depth_data[2, 11, 9] = 3.2

        arrival_data = np.full((20, 20), np.nan, dtype=np.float32)
        arrival_data[10:13, 8:11] = 12.0

        self.grid_result = StandardGridResult(
            simulation_id="sim-test-gis-001",
            grid_meta=self.grid_meta,
            depth_array=depth_data,
            velocity_array=np.zeros_like(depth_data),
            arrival_time_array=arrival_data,
            solver_name="Level1_DiffusiveWave",
            solver_level="level1",
            execution_time_seconds=1.2,
            summary_stats={"total_flood_area_km2": 0.0081, "max_depth_m": 3.2}
        )

        # WGS84 for row 11, col 9 on 20x20 grid:
        # min_lon, max_lon = 76.80, 77.10 -> col 9 is ~ 76.935
        # min_lat, max_lat = 9.85, 10.20 -> row 11 is ~ 10.0075
        self.mock_villages = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "properties": {"id": "v-001", "name": "Test Inundated Village", "population": 2500},
                    "geometry": {"type": "Point", "coordinates": [85.335, 28.125]}
                },
                {
                    "type": "Feature",
                    "properties": {"id": "v-002", "name": "Test Safe Village", "population": 1200},
                    "geometry": {"type": "Point", "coordinates": [85.220, 28.380]}
                }
            ]
        }

        # Mock Road GeoJSON crossing cell (11, 9)
        self.mock_roads = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "properties": {"id": "rd-001", "name": "Primary Access Highway", "highway": "primary"},
                    "geometry": {
                        "type": "LineString",
                        "coordinates": [[85.325, 28.125], [85.335, 28.125], [85.345, 28.125]]
                    }
                }
            ]
        }

    def test_polygonize_flood_extent(self):
        geojson = polygonize_flood_extent(self.grid_result, timestep_index=-1, depth_threshold_m=0.10)
        self.assertEqual(geojson["type"], "FeatureCollection")
        self.assertEqual(len(geojson["features"]), 1)

        feat = geojson["features"][0]
        self.assertEqual(feat["geometry"]["type"], "Polygon")
        self.assertIn("area_km2", feat["properties"])
        self.assertGreater(feat["properties"]["area_km2"], 0.0)

    def test_empty_flood_extent_edge_case(self):
        empty_grid = np.zeros((2, 20, 20), dtype=np.float32)
        res_empty = StandardGridResult(
            simulation_id="sim-empty-001",
            grid_meta=self.grid_meta,
            depth_array=empty_grid
        )

        geojson = polygonize_flood_extent(res_empty, timestep_index=-1, depth_threshold_m=0.10)
        self.assertEqual(len(geojson["features"]), 0)
        self.assertEqual(geojson["properties"]["inundated_cell_count"], 0)

    def test_village_exposure_analysis(self):
        exposure = calculate_village_exposure(self.mock_villages, self.grid_result, depth_threshold_m=0.10)
        self.assertEqual(len(exposure), 2)

        v_inundated = [e for e in exposure if e["assetId"] == "v-001"][0]
        self.assertTrue(v_inundated["exposed"])
        self.assertEqual(v_inundated["exposureTier"], "CRITICAL")
        self.assertEqual(v_inundated["population"], 2500)
        self.assertEqual(v_inundated["populationExposed"], 2500)

        v_safe = [e for e in exposure if e["assetId"] == "v-002"][0]
        self.assertFalse(v_safe["exposed"])
        self.assertEqual(v_safe["exposureTier"], "SAFE")

    def test_road_exposure_analysis(self):
        road_exp = calculate_road_exposure(self.mock_roads, self.grid_result, depth_threshold_m=0.10)
        self.assertIn("totalNetworkLengthKm", road_exp)
        self.assertGreater(road_exp["totalNetworkLengthKm"], 0.0)
        self.assertIn("affectedPercent", road_exp)

    def test_warning_decision_support_alerts(self):
        exposure = calculate_village_exposure(self.mock_villages, self.grid_result)
        alerts = generate_warning_alerts(exposure, simulation_id="sim-test-gis-001")
        self.assertEqual(len(alerts), 1)

        alert = alerts[0]
        self.assertEqual(alert["villageId"], "v-001")
        self.assertEqual(alert["level"], "critical")
        self.assertIn("disclaimer", alert)

    def test_end_to_end_result_exporter(self):
        paths = export_simulation_gis_results(
            grid_result=self.grid_result,
            villages_path=self.mock_villages,
            roads_path=self.mock_roads,
            output_base_dir=self.temp_dir,
            depth_threshold_m=0.10
        )

        self.assertTrue(os.path.exists(paths["flood_extent"]))
        self.assertTrue(os.path.exists(paths["flood_layers"]))
        self.assertTrue(os.path.exists(paths["exposure"]))
        self.assertTrue(os.path.exists(paths["metadata"]))

        with open(paths["exposure"], "r") as f:
            exp_data = json.load(f)
        self.assertEqual(exp_data["simulationId"], "sim-test-gis-001")
        self.assertEqual(len(exp_data["warnings"]), 1)


if __name__ == "__main__":
    unittest.main()
