"""
FloodLens GIS Processing Layer — Result Exporter
Exports GeoJSON flood extents, flood layer descriptors, exposure analysis, and metadata to data/results/<simulation_id>/
"""

import json
import os
import time
from typing import Dict, Any, List
import numpy as np

from simulation.engine import StandardGridResult
from gis.raster_to_vector import polygonize_flood_extent, generate_flood_layer_descriptors
from gis.exposure import calculate_village_exposure, calculate_road_exposure
from gis.warning_engine import generate_warning_alerts


class NumpyEncoder(json.JSONEncoder):
    """JSON Encoder that converts NumPy data types to Python standard native types."""
    def default(self, obj):
        if isinstance(obj, (np.bool_, bool)):
            return bool(obj)
        if isinstance(obj, (np.integer, int)):
            return int(obj)
        if isinstance(obj, (np.floating, float)):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return super().default(obj)


def export_simulation_gis_results(
    grid_result: StandardGridResult,
    villages_path: str = "data/processed/villages.geojson",
    roads_path: str = "data/processed/roads.geojson",
    output_base_dir: str = "data/results",
    depth_threshold_m: float = 0.10
) -> Dict[str, str]:
    """
    Executes end-to-end GIS processing on StandardGridResult and exports all spatial products to data/results/<simulation_id>/
    
    Returns:
        Dict of file paths created.
    """
    sim_id = grid_result.simulation_id
    target_dir = os.path.join(output_base_dir, sim_id)
    os.makedirs(target_dir, exist_ok=True)
    
    # 1. Polygonize Flood Extent (GeoJSON)
    flood_extent_geojson = polygonize_flood_extent(
        grid_result=grid_result,
        timestep_index=-1,
        depth_threshold_m=depth_threshold_m
    )
    extent_path = os.path.join(target_dir, "flood_extent.geojson")
    with open(extent_path, "w") as f:
        json.dump(flood_extent_geojson, f, indent=2, cls=NumpyEncoder)

    # 2. Flood Layer Descriptors
    flood_layers = generate_flood_layer_descriptors(
        grid_result=grid_result,
        extent_geojson=flood_extent_geojson,
        timestep_index=-1
    )
    layers_path = os.path.join(target_dir, "flood_layers.json")
    with open(layers_path, "w") as f:
        json.dump(flood_layers, f, indent=2, cls=NumpyEncoder)

    # 3. Village Exposure Analysis
    village_exposure = calculate_village_exposure(
        villages_geojson_path=villages_path,
        grid_result=grid_result,
        depth_threshold_m=depth_threshold_m
    )
    
    # 4. Road Exposure Analysis
    road_exposure = calculate_road_exposure(
        roads_geojson_path=roads_path,
        grid_result=grid_result,
        depth_threshold_m=depth_threshold_m
    )

    # 5. Early Warning Alerts
    warnings = generate_warning_alerts(
        exposure_results=village_exposure,
        simulation_id=sim_id
    )

    exposure_bundle = {
        "simulationId": sim_id,
        "depthThresholdM": depth_threshold_m,
        "villageExposure": village_exposure,
        "roadExposure": road_exposure,
        "warnings": warnings
    }
    exposure_path = os.path.join(target_dir, "exposure.json")
    with open(exposure_path, "w") as f:
        json.dump(exposure_bundle, f, indent=2, cls=NumpyEncoder)

    # 6. Master GIS Result Metadata
    master_metadata = {
        "simulation_id": sim_id,
        "solver_name": grid_result.solver_name,
        "solver_level": grid_result.solver_level,
        "execution_time_seconds": grid_result.execution_time_seconds,
        "depth_threshold_m": depth_threshold_m,
        "grid_meta": {
            "crs": grid_result.grid_meta.crs,
            "width": grid_result.grid_meta.width,
            "height": grid_result.grid_meta.height,
            "cell_size": grid_result.grid_meta.cell_size
        },
        "summary_stats": grid_result.summary_stats,
        "mass_balance_info": grid_result.mass_balance_info,
        "outputs": {
            "flood_extent_geojson": f"results/{sim_id}/flood_extent.geojson",
            "flood_layers_json": f"results/{sim_id}/flood_layers.json",
            "exposure_json": f"results/{sim_id}/exposure.json"
        }
    }
    meta_path = os.path.join(target_dir, "metadata.json")
    with open(meta_path, "w") as f:
        json.dump(master_metadata, f, indent=2, cls=NumpyEncoder)

    return {
        "flood_extent": extent_path,
        "flood_layers": layers_path,
        "exposure": exposure_path,
        "metadata": meta_path
    }
