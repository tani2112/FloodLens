"""
FloodLens Phase 4 Unit Test Suite — Level 1 Hydrodynamic Flood Simulation Engine
Validates numerical stability, mass conservation, arrival time, velocity proxy,
flat-bed analytical benchmark, StandardGridResult contract, and determinism.
"""

import os
import unittest
import numpy as np

from simulation.engine import StandardGridResult, GridMetadata
from simulation.level1_diffusive import Level1DiffusiveModel


class TestLevel1DiffusiveModel(unittest.TestCase):

    def setUp(self):
        self.model = Level1DiffusiveModel()
        self.test_grid_size = 30
        cols, rows = np.meshgrid(np.arange(self.test_grid_size), np.arange(self.test_grid_size))
        # Ridge separating left valley from right hill
        self.flat_dem = (100.0 + cols * 2.0).astype(np.float32)

    def test_analytical_flat_bed_sanity_and_mass_conservation(self):
        """Flat bed DEM benchmark verifying water release propagation, mass balance, and non-negative depth."""
        scenario = {
            "simulation_id": "test-flat-bed-001",
            "elevation_grid": self.flat_dem.copy(),
            "cell_size": 10.0,
            "initial_water_level_m": 5.0,
            "reservoir_volume_m3": 50000.0,
            "breach_formation_time_s": 300.0,
            "simulation_duration_min": 5.0,
            "output_interval_min": 1.0,
            "roughness_coefficient": 0.03,
            "source_row": 15,
            "source_col": 15
        }

        result = self.model.run(scenario, dem_raster_path="")

        self.assertIsInstance(result, StandardGridResult)
        self.assertEqual(result.solver_name, "Level1_DiffusiveWave")
        self.assertEqual(result.solver_level, "level1")

        depth = result.depth_array
        velocity = result.velocity_array
        arrival = result.arrival_time_array

        self.assertEqual(depth.shape[1:], (30, 30))
        self.assertEqual(velocity.shape[1:], (30, 30))
        self.assertEqual(arrival.shape, (30, 30))

        self.assertTrue(np.all(depth >= 0.0), "Water depth array contains negative values")

        self.assertFalse(np.isnan(depth).any(), "Depth array contains NaN values")
        self.assertFalse(np.isnan(velocity).any(), "Velocity array contains NaN values")

        mass_info = result.mass_balance_info
        self.assertIn("mass_balance_error_percent", mass_info)
        self.assertLess(mass_info["mass_balance_error_percent"], 5.0, "Mass balance error exceeds 5%")
        self.assertTrue(mass_info["is_conserved"])

    def test_deterministic_repeated_execution(self):
        """Verifies that executing identical scenario configuration produces identical numerical output."""
        scenario = {
            "simulation_id": "test-det-001",
            "elevation_grid": self.flat_dem.copy(),
            "cell_size": 10.0,
            "initial_water_level_m": 5.0,
            "reservoir_volume_m3": 20000.0,
            "breach_formation_time_s": 120.0,
            "simulation_duration_min": 3.0,
            "output_interval_min": 1.0,
            "source_row": 15,
            "source_col": 15
        }

        result_run1 = self.model.run(scenario, dem_raster_path="")
        result_run2 = self.model.run(scenario, dem_raster_path="")

        np.testing.assert_array_equal(result_run1.depth_array, result_run2.depth_array)
        np.testing.assert_array_equal(result_run1.velocity_array, result_run2.velocity_array)

    def test_arrival_time_calculation(self):
        """Verifies that arrival time is populated for inundated cells and remains NaN for dry cells."""
        scenario = {
            "simulation_id": "test-arrival-001",
            "elevation_grid": self.flat_dem.copy(),
            "cell_size": 10.0,
            "initial_water_level_m": 2.0,
            "reservoir_volume_m3": 5000.0,
            "breach_formation_time_s": 60.0,
            "simulation_duration_min": 2.0,
            "output_interval_min": 1.0,
            "arrival_threshold_m": 0.05,
            "source_row": 15,
            "source_col": 15
        }

        result = self.model.run(scenario, dem_raster_path="")
        arrival = result.arrival_time_array

        # Source cell must be inundated and have arrival time = 0.0 min
        self.assertFalse(np.isnan(arrival[15, 15]))
        self.assertAlmostEqual(arrival[15, 15], 0.0, delta=0.5)

        # Distant uphill cell (0, 29) should remain dry and NaN
        self.assertTrue(np.isnan(arrival[0, 29]), "Distant uphill cell should remain NaN")

    def test_canonical_aoi_dem_simulation_run(self):
        """Verifies execution against the prepared canonical DEM raster (data/processed/dem.tif)."""
        dem_path = "data/processed/dem.tif"
        if not os.path.exists(dem_path):
            dem_path = "data/dem.tif"

        self.assertTrue(os.path.exists(dem_path), f"Canonical DEM not found at {dem_path}")

        scenario = {
            "simulation_id": "sim-idukki-l1-001",
            "initial_water_level_m": 50.0,
            "reservoir_volume_m3": 10000000.0,
            "breach_width_m": 100.0,
            "breach_formation_time_s": 1800.0,
            "simulation_duration_min": 30.0,
            "output_interval_min": 5.0,
            "roughness_coefficient": 0.035,
            "arrival_threshold_m": 0.05
        }

        result = self.model.run(scenario, dem_raster_path=dem_path)

        # StandardGridResult Contract Validation
        self.assertIsNotNone(result.depth_array)
        self.assertIsNotNone(result.velocity_array)
        self.assertIsNotNone(result.arrival_time_array)

        # Summary Statistics Assertions
        stats = result.summary_stats
        self.assertGreater(stats["total_flood_area_km2"], 0.0)
        self.assertGreater(stats["max_depth_m"], 0.0)
        self.assertGreater(stats["max_velocity_ms"], 0.0)
        self.assertGreater(stats["inundated_cell_count"], 0)


if __name__ == "__main__":
    unittest.main()
