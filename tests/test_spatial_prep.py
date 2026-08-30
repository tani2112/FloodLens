"""
FloodLens Phase 3 Unit Tests — Spatial Data Preparation Pipeline & Validation
"""

import json
import os
import tempfile
import unittest
import numpy as np

from gis.dem_processor import validate_aoi_bbox, generate_canonical_dem_raster, validate_dem_raster
from gis.vector_processor import generate_canonical_vectors, validate_vector_layer


class TestSpatialPreparationPipeline(unittest.TestCase):

    def setUp(self):
        self.temp_dir = tempfile.mkdtemp()
        self.canonical_bbox = [85.20, 27.90, 85.50, 28.40]

    def test_validate_aoi_bbox(self):
        # Valid Bounding Box
        valid, msg = validate_aoi_bbox(self.canonical_bbox)
        self.assertTrue(valid)

        # Invalid Bounding Box (min_lon > max_lon)
        invalid, msg = validate_aoi_bbox([86.0, 27.90, 85.0, 28.40])
        self.assertFalse(invalid)

        # Invalid Bounding Box (out of range lat)
        invalid_lat, msg = validate_aoi_bbox([85.2, -95.0, 85.5, 28.4])
        self.assertFalse(invalid_lat)

    def test_dem_raster_generation_and_validation(self):
        dem_path = os.path.join(self.temp_dir, "test_dem.tif")
        meta = generate_canonical_dem_raster(
            output_path=dem_path,
            bbox=self.canonical_bbox,
            crs_epsg="EPSG:32645",
            resolution_m=30.0
        )
        self.assertEqual(meta["crs"], "EPSG:32645")
        self.assertTrue(os.path.exists(dem_path))

        valid, msg, info = validate_dem_raster(dem_path)
        self.assertTrue(valid)
        self.assertGreater(info["size_bytes"], 0)

    def test_vector_layers_generation_and_validation(self):
        counts = generate_canonical_vectors(output_dir=self.temp_dir, bbox=self.canonical_bbox)
        self.assertEqual(counts["villages"], 6)
        self.assertEqual(counts["rivers"], 1)
        self.assertEqual(counts["roads"], 1)
        self.assertEqual(counts["dams"], 1)

        vpath = os.path.join(self.temp_dir, "villages.geojson")
        valid, msg, info = validate_vector_layer(vpath)
        self.assertTrue(valid)
        self.assertEqual(info["count"], 6)

    def test_canonical_aoi_config_file(self):
        config_path = "data/config/canonical_aoi.json"
        self.assertTrue(os.path.exists(config_path))
        with open(config_path, "r") as f:
            data = json.load(f)
        self.assertEqual(data["aoi_name"], "Lhende Khola & Bhote Koshi / Trishuli River Catchment")
        self.assertEqual(data["crs_metric"], "EPSG:32645")
        self.assertEqual(len(data["downstream_villages"]), 6)


if __name__ == "__main__":
    unittest.main()
