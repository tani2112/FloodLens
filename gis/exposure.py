"""
FloodLens GIS Processing Layer — Exposure Analysis Engine
Computes spatial point-in-polygon and grid sampling intersections for villages, roads, and infrastructure.
Authoritative contract matching docs/ARCHITECTURE.md, docs/API.md, and Phase 5 specs.
"""

import json
import math
import os
from typing import Dict, Any, List, Tuple, Optional
import numpy as np

from simulation.engine import StandardGridResult, GridMetadata


def wgs84_to_grid_idx(lon: float, lat: float, meta: GridMetadata) -> Tuple[int, int]:
    """
    Converts WGS84 EPSG:4326 longitude/latitude into DEM grid cell indices (row, col).
    Uses canonical Idukki geographic bounding box [76.80, 9.85, 77.10, 10.20].
    """
    min_lon, max_lon = 76.80, 77.10
    min_lat, max_lat = 9.85, 10.20
    
    col_frac = (lon - min_lon) / (max_lon - min_lon)
    row_frac = (max_lat - lat) / (max_lat - min_lat)
    
    col = int(col_frac * meta.width)
    row = int(row_frac * meta.height)
    
    col = max(0, min(col, meta.width - 1))
    row = max(0, min(row, meta.height - 1))
    
    return row, col


def classify_exposure_severity(
    max_depth_m: float,
    arrival_time_min: float,
    depth_threshold_m: float = 0.10
) -> Tuple[str, str]:
    """
    Categorizes settlement exposure severity based on depth and arrival time thresholds.
    """
    if max_depth_m < 0.05:
        return "advisory", "SAFE"
    elif max_depth_m < 0.30:
        return "advisory", "LOW"
    elif max_depth_m < 1.00:
        return "watch", "MODERATE"
    elif max_depth_m < 2.50:
        if arrival_time_min < 15.0:
            return "critical", "CRITICAL"
        return "warning", "HIGH"
    else:
        return "critical", "CRITICAL"


def calculate_village_exposure(
    villages_geojson_path: Any,
    grid_result: StandardGridResult,
    depth_threshold_m: float = 0.10
) -> List[Dict[str, Any]]:
    """
    Computes spatial intersection between final flood simulation grid state and downstream settlement nodes.
    """
    if grid_result.depth_array is None:
        raise ValueError("StandardGridResult lacks depth_array")
        
    final_depth_grid = grid_result.depth_array[-1]
    arrival_grid = grid_result.arrival_time_array
    meta = grid_result.grid_meta
    sim_id = grid_result.simulation_id
    
    if isinstance(villages_geojson_path, dict):
        geojson_data = villages_geojson_path
    elif os.path.exists(str(villages_geojson_path)):
        with open(str(villages_geojson_path), "r") as f:
            geojson_data = json.load(f)
    else:
        alt_path = "data/processed/villages.geojson"
        if os.path.exists(alt_path):
            with open(alt_path, "r") as f:
                geojson_data = json.load(f)
        else:
            return []

    features = geojson_data.get("features", [])
    results = []
    
    for feat in features:
        props = feat.get("properties", {})
        geom = feat.get("geometry", {})
        coords = geom.get("coordinates", [76.9740, 10.0510])
        
        lon, lat = coords[0], coords[1]
        row, col = wgs84_to_grid_idx(lon, lat, meta)
        
        r_min, r_max = max(0, row - 2), min(meta.height, row + 3)
        c_min, c_max = max(0, col - 2), min(meta.width, col + 3)
        
        sub_depth = final_depth_grid[r_min:r_max, c_min:c_max]
        v_depth = float(np.max(sub_depth)) if sub_depth.size > 0 else 0.0
        
        if arrival_grid is not None:
            sub_arr = arrival_grid[r_min:r_max, c_min:c_max]
            valid_arr = sub_arr[~np.isnan(sub_arr)]
            v_arrival = float(np.min(valid_arr)) if len(valid_arr) > 0 else 999.0
        else:
            v_arrival = 999.0
            
        exposed = bool(v_depth >= depth_threshold_m)
        warning_level, exposure_tier = classify_exposure_severity(v_depth, v_arrival, depth_threshold_m)
        
        raw_pop = props.get("population")
        pop_exposed = int(raw_pop) if (exposed and raw_pop is not None) else (0 if exposed else None)
        
        asset_id = props.get("id", f"v-{len(results)+1:03d}")
        asset_name = props.get("name", "Unnamed Settlement")
        
        exp_record = {
            "simulationId": sim_id,
            "assetId": asset_id,
            "assetType": "village",
            "name": asset_name,
            "coordinates": [lon, lat],
            "maxDepthM": round(v_depth, 2),
            "arrivalTimeMin": round(v_arrival, 1) if v_arrival < 900.0 else None,
            "exposed": exposed,
            "warningLevel": warning_level,
            "exposureTier": exposure_tier,
            "population": raw_pop,
            "populationExposed": pop_exposed,
            "populationDataStatus": "available" if raw_pop is not None else "requires_census_dataset"
        }
        results.append(exp_record)
        
    return results


def calculate_road_exposure(
    roads_geojson_path: Any,
    grid_result: StandardGridResult,
    depth_threshold_m: float = 0.10
) -> Dict[str, Any]:
    """
    Calculates affected road segments, total affected road length (km), and network percentage.
    """
    if grid_result.depth_array is None:
        raise ValueError("StandardGridResult lacks depth_array")

    final_depth_grid = grid_result.depth_array[-1]
    meta = grid_result.grid_meta

    if isinstance(roads_geojson_path, dict):
        geojson_data = roads_geojson_path
    elif os.path.exists(str(roads_geojson_path)):
        with open(str(roads_geojson_path), "r") as f:
            geojson_data = json.load(f)
    else:
        alt_path = "data/processed/roads.geojson"
        if os.path.exists(alt_path):
            with open(alt_path, "r") as f:
                geojson_data = json.load(f)
        else:
            return {"totalNetworkLengthKm": 0.0, "affectedRoadsLengthKm": 0.0, "affectedPercent": 0.0, "affectedSegments": []}

    features = geojson_data.get("features", [])
    total_length_m = 0.0
    affected_length_m = 0.0
    affected_segments = []

    for feat in features:
        props = feat.get("properties", {})
        geom = feat.get("geometry", {})
        coords = geom.get("coordinates", [])
        
        if geom.get("type") != "LineString" or len(coords) < 2:
            continue

        segment_length_m = 0.0
        segment_affected_m = 0.0

        for i in range(len(coords) - 1):
            lon1, lat1 = coords[i]
            lon2, lat2 = coords[i+1]
            
            dx_m = (lon2 - lon1) * 108000.0 * math.cos(math.radians((lat1 + lat2) / 2.0))
            dy_m = (lat2 - lat1) * 111000.0
            dist_m = math.sqrt(dx_m * dx_m + dy_m * dy_m)
            segment_length_m += dist_m
            
            mid_lon = (lon1 + lon2) / 2.0
            mid_lat = (lat1 + lat2) / 2.0
            r, c = wgs84_to_grid_idx(mid_lon, mid_lat, meta)
            
            if final_depth_grid[r, c] >= depth_threshold_m:
                segment_affected_m += dist_m

        total_length_m += segment_length_m
        affected_length_m += segment_affected_m

        if segment_affected_m > 0:
            affected_segments.append({
                "roadId": props.get("id", f"rd-{len(affected_segments)+1:03d}"),
                "name": props.get("name", "Unnamed Road"),
                "highwayType": props.get("highway", "unclassified"),
                "lengthKm": round(segment_length_m / 1000.0, 3),
                "affectedLengthKm": round(segment_affected_m / 1000.0, 3),
                "affectedPercent": round((segment_affected_m / max(1.0, segment_length_m)) * 100.0, 1)
            })

    total_km = round(total_length_m / 1000.0, 3)
    affected_km = round(affected_length_m / 1000.0, 3)
    affected_pct = round((affected_length_m / max(1.0, total_length_m)) * 100.0, 1)

    return {
        "simulationId": grid_result.simulation_id,
        "totalNetworkLengthKm": total_km,
        "affectedRoadsLengthKm": affected_km,
        "affectedPercent": affected_pct,
        "affectedSegmentsCount": len(affected_segments),
        "affectedSegments": affected_segments
    }


def calculate_infrastructure_exposure(
    infrastructure_geojson_path: str,
    grid_result: StandardGridResult,
    asset_type: str = "critical_infrastructure"
) -> List[Dict[str, Any]]:
    """
    Extensible infrastructure exposure calculator for hospitals, schools, bridges, or agricultural lands.
    """
    if not os.path.exists(infrastructure_geojson_path):
        return []
        
    with open(infrastructure_geojson_path, "r") as f:
        data = json.load(f)
        
    features = data.get("features", [])
    results = []
    meta = grid_result.grid_meta
    depth_grid = grid_result.depth_array[-1] if grid_result.depth_array is not None else None
    
    for feat in features:
        props = feat.get("properties", {})
        geom = feat.get("geometry", {})
        coords = geom.get("coordinates", [76.95, 10.05])
        
        r, c = wgs84_to_grid_idx(coords[0], coords[1], meta)
        d = float(depth_grid[r, c]) if depth_grid is not None else 0.0
        
        results.append({
            "simulationId": grid_result.simulation_id,
            "assetId": props.get("id", "asset-001"),
            "assetType": asset_type,
            "name": props.get("name", "Critical Asset"),
            "maxDepthM": round(d, 2),
            "exposed": d >= 0.10
        })
    return results
