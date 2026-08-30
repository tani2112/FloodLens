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
from gis.exposure import (
    calculate_village_exposure,
    calculate_road_exposure,
    calculate_infrastructure_exposure,
    calculate_settlement_impact_summary,
    calculate_temporal_impact_milestones
)
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
    
    # 1. Polygonize Flood Extents per Timestep and Generate Timeline Summary
    timesteps_summary = []
    num_ts = len(grid_result.grid_meta.timesteps) if grid_result.grid_meta.timesteps else 1

    for idx in range(num_ts):
        ts_geojson = polygonize_flood_extent(
            grid_result=grid_result,
            timestep_index=idx,
            depth_threshold_m=depth_threshold_m
        )
        ts_path = os.path.join(target_dir, f"flood_extent_t{idx}.geojson")
        with open(ts_path, "w") as f:
            json.dump(ts_geojson, f, indent=2, cls=NumpyEncoder)

        # Extract timestep metrics
        t_min = grid_result.grid_meta.timesteps[idx] if grid_result.grid_meta.timesteps else float(idx * 5.0)
        area_km2 = 0.0
        max_d = 0.0
        max_v = 0.0

        if grid_result.depth_array is not None and idx < grid_result.depth_array.shape[0]:
            d_grid = grid_result.depth_array[idx]
            v_grid = grid_result.velocity_array[idx] if grid_result.velocity_array is not None else None
            inundated = (d_grid >= depth_threshold_m)
            inundated_cnt = int(np.sum(inundated))
            cell_size = grid_result.grid_meta.cell_size
            area_km2 = float((inundated_cnt * cell_size * cell_size) / 1e6)
            if inundated_cnt > 0:
                max_d = float(np.max(d_grid))
                if v_grid is not None:
                    max_v = float(np.max(v_grid[inundated]))

        timesteps_summary.append({
            "timestepIndex": idx,
            "timeMin": round(float(t_min), 1),
            "floodAreaKm2": round(float(area_km2), 4),
            "maxDepthM": round(float(max_d), 2),
            "maxVelocityMs": round(float(max_v), 2)
        })

    # Master final extent (t = -1)
    flood_extent_geojson = polygonize_flood_extent(
        grid_result=grid_result,
        timestep_index=-1,
        depth_threshold_m=depth_threshold_m
    )
    extent_path = os.path.join(target_dir, "flood_extent.geojson")
    with open(extent_path, "w") as f:
        json.dump(flood_extent_geojson, f, indent=2, cls=NumpyEncoder)

    # Timeline Summary File
    timeline_bundle = {
        "simulationId": sim_id,
        "timesteps": timesteps_summary
    }
    timeline_path = os.path.join(target_dir, "timeline.json")
    with open(timeline_path, "w") as f:
        json.dump(timeline_bundle, f, indent=2, cls=NumpyEncoder)

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

    # 5. Infrastructure Exposure Analysis (explicit dataset_unavailable check)
    infra_path = "data/processed/infrastructure.geojson"
    infrastructure_exposure = calculate_infrastructure_exposure(
        infrastructure_geojson_path=infra_path,
        grid_result=grid_result
    )

    # 6. Early Warning Alerts
    warnings = generate_warning_alerts(
        exposure_results=village_exposure,
        simulation_id=sim_id
    )

    exposure_bundle = {
        "simulationId": sim_id,
        "depthThresholdM": depth_threshold_m,
        "villageExposure": village_exposure,
        "roadExposure": road_exposure,
        "infrastructureExposure": infrastructure_exposure,
        "warnings": warnings
    }
    exposure_path = os.path.join(target_dir, "exposure.json")
    with open(exposure_path, "w") as f:
        json.dump(exposure_bundle, f, indent=2, cls=NumpyEncoder)

    # 7. Impact Summary & Impact Timeline Exports
    settlement_summary = calculate_settlement_impact_summary(village_exposure)
    temporal_milestones = calculate_temporal_impact_milestones(
        grid_result=grid_result,
        village_exposure=village_exposure,
        road_exposure=road_exposure
    )

    overall_severity = settlement_summary.get("maxSettlementSeverity", "SAFE")

    impact_summary_bundle = {
        "simulationId": sim_id,
        "scenarioType": "dam_break",
        "modelLevel": grid_result.solver_level,
        "floodMetrics": {
            "floodAreaKm2": grid_result.summary_stats.get("flood_area_km2", 0.0),
            "maxDepthM": grid_result.summary_stats.get("max_depth_m", 0.0),
            "maxVelocityMs": grid_result.summary_stats.get("max_velocity_ms", 0.0),
            "arrivalTimeMin": grid_result.summary_stats.get("min_arrival_time_min", 0.0)
        },
        "settlementMetrics": settlement_summary,
        "roadMetrics": road_exposure,
        "infrastructureMetrics": infrastructure_exposure,
        "temporalMetrics": temporal_milestones,
        "severitySummary": {
            "overallImpactSeverity": overall_severity,
            "advisoryLevel": overall_severity,
            "primaryRiskFactors": [
                f"Peak water depth of {grid_result.summary_stats.get('max_depth_m', 0.0):.2f}m in river valley",
                f"{settlement_summary.get('totalAffected', 0)} settlements in flood path",
                f"{road_exposure.get('affectedRoadsLengthKm', 0.0):.2f}km road corridor affected"
            ]
        },
        "scientificDisclaimer": "Scenario-based early-warning / decision-support output — not an official disaster warning."
    }
    impact_summary_path = os.path.join(target_dir, "impact_summary.json")
    with open(impact_summary_path, "w") as f:
        json.dump(impact_summary_bundle, f, indent=2, cls=NumpyEncoder)

    impact_timeline_bundle = {
        "simulationId": sim_id,
        "firstInundationTimeMin": temporal_milestones.get("firstInundationTimeMin"),
        "peakInundationAreaTimeMin": temporal_milestones.get("peakInundationAreaTimeMin"),
        "peakDepthTimeMin": temporal_milestones.get("peakDepthTimeMin"),
        "peakVelocityTimeMin": temporal_milestones.get("peakVelocityTimeMin"),
        "settlementFirstImpactTimeMin": temporal_milestones.get("settlementFirstImpactTimeMin"),
        "roadFirstImpactTimeMin": temporal_milestones.get("roadFirstImpactTimeMin"),
        "timeline": temporal_milestones.get("impactTimeline", [])
    }
    impact_timeline_path = os.path.join(target_dir, "impact_timeline.json")
    with open(impact_timeline_path, "w") as f:
        json.dump(impact_timeline_bundle, f, indent=2, cls=NumpyEncoder)

    # 8. Master GIS Result Metadata
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
            "exposure_json": f"results/{sim_id}/exposure.json",
            "impact_summary_json": f"results/{sim_id}/impact_summary.json",
            "impact_timeline_json": f"results/{sim_id}/impact_timeline.json"
        }
    }
    meta_path = os.path.join(target_dir, "metadata.json")
    with open(meta_path, "w") as f:
        json.dump(master_metadata, f, indent=2, cls=NumpyEncoder)

    return {
        "flood_extent": extent_path,
        "flood_layers": layers_path,
        "exposure": exposure_path,
        "impact_summary": impact_summary_path,
        "impact_timeline": impact_timeline_path,
        "metadata": meta_path
    }
