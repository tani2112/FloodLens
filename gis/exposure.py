"""
FloodLens GIS Processing Layer — Exposure & Impact Analysis Engine
Computes spatial point-in-polygon and grid sampling intersections for villages, roads, and infrastructure.
Authoritative contract matching docs/ARCHITECTURE.md, docs/API.md, and Phase 12 specs.
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
    Computes spatial intersection between flood simulation grid state and downstream settlement nodes.
    Computes per-settlement time of peak depth and duration inundated if temporal grid slices exist.
    """
    if grid_result.depth_array is None:
        raise ValueError("StandardGridResult lacks depth_array")

    final_depth_grid = grid_result.depth_array[-1]
    arrival_grid = grid_result.arrival_time_array
    meta = grid_result.grid_meta
    sim_id = grid_result.simulation_id
    num_timesteps = grid_result.depth_array.shape[0] if grid_result.depth_array.ndim == 3 else 1

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

        # Compute temporal peak depth time and duration if 3D array exists
        time_of_peak_min = None
        duration_inundated_min = None

        if grid_result.depth_array.ndim == 3 and num_timesteps > 1:
            depth_series = []
            for t_idx in range(num_timesteps):
                slice_depth = grid_result.depth_array[t_idx, r_min:r_max, c_min:c_max]
                depth_series.append(float(np.max(slice_depth)) if slice_depth.size > 0 else 0.0)

            peak_step = int(np.argmax(depth_series))
            if meta.timesteps and peak_step < len(meta.timesteps):
                time_of_peak_min = round(float(meta.timesteps[peak_step]), 1)

            inundated_steps = sum(1 for d in depth_series if d >= depth_threshold_m)
            step_dt = 5.0
            if meta.timesteps and len(meta.timesteps) > 1:
                step_dt = meta.timesteps[1] - meta.timesteps[0]
            duration_inundated_min = round(float(inundated_steps * step_dt), 1)

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
            "timeOfPeakDepthMin": time_of_peak_min,
            "durationInundatedMin": duration_inundated_min,
            "exposed": exposed,
            "warningLevel": warning_level,
            "exposureTier": exposure_tier,
            "population": raw_pop,
            "populationExposed": pop_exposed,
            "populationDataStatus": "available" if raw_pop is not None else "requires_census_dataset"
        }
        results.append(exp_record)

    return results


def calculate_settlement_impact_summary(village_exposure: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Computes aggregate metrics for evaluated settlements.
    """
    total_eval = len(village_exposure)
    affected_list = [v for v in village_exposure if v.get("exposed")]
    total_affected = len(affected_list)

    safe_cnt = sum(1 for v in village_exposure if v.get("exposureTier") == "SAFE")
    low_cnt = sum(1 for v in village_exposure if v.get("exposureTier") == "LOW")
    mod_cnt = sum(1 for v in village_exposure if v.get("exposureTier") == "MODERATE")
    high_cnt = sum(1 for v in village_exposure if v.get("exposureTier") == "HIGH")
    crit_cnt = sum(1 for v in village_exposure if v.get("exposureTier") == "CRITICAL")

    earliest_name = None
    earliest_time = 999.0
    latest_name = None
    latest_time = -1.0

    for v in affected_list:
        arr_t = v.get("arrivalTimeMin")
        if arr_t is not None:
            if arr_t < earliest_time:
                earliest_time = arr_t
                earliest_name = v.get("name")
            if arr_t > latest_time:
                latest_time = arr_t
                latest_name = v.get("name")

    earliest_str = f"{earliest_name} ({earliest_time:.1f} min)" if earliest_name else "None"
    latest_str = f"{latest_name} ({latest_time:.1f} min)" if latest_name else "None"

    max_d = max([v.get("maxDepthM", 0.0) for v in village_exposure], default=0.0)

    tier_order = ["SAFE", "LOW", "MODERATE", "HIGH", "CRITICAL"]
    max_tier = "SAFE"
    for v in village_exposure:
        t = v.get("exposureTier", "SAFE")
        if t in tier_order and tier_order.index(t) > tier_order.index(max_tier):
            max_tier = t

    has_missing_pop = any(v.get("populationDataStatus") == "requires_census_dataset" for v in village_exposure)
    pop_status = "requires_census_dataset" if has_missing_pop else "available"

    return {
        "totalEvaluated": total_eval,
        "totalAffected": total_affected,
        "safeCount": safe_cnt,
        "lowCount": low_cnt,
        "moderateCount": mod_cnt,
        "highCount": high_cnt,
        "criticalCount": crit_cnt,
        "earliestAffectedSettlement": earliest_str,
        "latestAffectedSettlement": latest_str,
        "maxSettlementDepthM": round(max_d, 2),
        "maxSettlementSeverity": max_tier,
        "populationDataStatus": pop_status,
        "settlements": village_exposure
    }


def calculate_road_exposure(
    roads_geojson_path: Any,
    grid_result: StandardGridResult,
    depth_threshold_m: float = 0.10
) -> Dict[str, Any]:
    """
    Calculates affected road segments, total affected road length (km), unaffected length (km), and temporal road impact.
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
            return {
                "simulationId": grid_result.simulation_id,
                "totalNetworkLengthKm": 0.0,
                "affectedRoadsLengthKm": 0.0,
                "unaffectedLengthKm": 0.0,
                "affectedPercent": 0.0,
                "affectedSegmentsCount": 0,
                "firstTimestepAffectedMin": None,
                "peakAffectedRoadLengthKm": 0.0,
                "affectedSegments": [],
                "roadImpactTimeline": []
            }

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
            aff_pct = (segment_affected_m / max(1.0, segment_length_m)) * 100.0
            severity = "LOW"
            if aff_pct > 75.0:
                severity = "CRITICAL"
            elif aff_pct > 50.0:
                severity = "HIGH"
            elif aff_pct > 25.0:
                severity = "MODERATE"

            affected_segments.append({
                "roadId": props.get("id", f"rd-{len(affected_segments)+1:03d}"),
                "name": props.get("name", "Unnamed Road Corridor"),
                "highwayType": props.get("highway", "unclassified"),
                "lengthKm": round(segment_length_m / 1000.0, 3),
                "affectedLengthKm": round(segment_affected_m / 1000.0, 3),
                "affectedPercent": round(aff_pct, 1),
                "severity": severity
            })

    total_km = round(total_length_m / 1000.0, 3)
    affected_km = round(affected_length_m / 1000.0, 3)
    unaffected_km = round(max(0.0, total_km - affected_km), 3)
    affected_pct = round((affected_length_m / max(1.0, total_length_m)) * 100.0, 1)

    # Calculate temporal road impact over timesteps
    road_timeline = []
    first_affected_t = None
    peak_affected_km = affected_km

    num_ts = grid_result.depth_array.shape[0] if grid_result.depth_array.ndim == 3 else 1
    if num_ts > 1:
        for t_idx in range(num_ts):
            ts_depth = grid_result.depth_array[t_idx]
            ts_aff_m = 0.0

            for feat in features:
                geom = feat.get("geometry", {})
                coords = geom.get("coordinates", [])
                if geom.get("type") != "LineString" or len(coords) < 2:
                    continue
                for i in range(len(coords) - 1):
                    lon1, lat1 = coords[i]
                    lon2, lat2 = coords[i+1]
                    dx_m = (lon2 - lon1) * 108000.0 * math.cos(math.radians((lat1 + lat2) / 2.0))
                    dy_m = (lat2 - lat1) * 111000.0
                    dist_m = math.sqrt(dx_m * dx_m + dy_m * dy_m)
                    mid_lon = (lon1 + lon2) / 2.0
                    mid_lat = (lat1 + lat2) / 2.0
                    r, c = wgs84_to_grid_idx(mid_lon, mid_lat, meta)
                    if ts_depth[r, c] >= depth_threshold_m:
                        ts_aff_m += dist_m

            t_min = meta.timesteps[t_idx] if meta.timesteps else float(t_idx * 5.0)
            t_aff_km = round(ts_aff_m / 1000.0, 3)
            t_aff_pct = round((ts_aff_m / max(1.0, total_length_m)) * 100.0, 1)

            if t_aff_km > 0.0 and first_affected_t is None:
                first_affected_t = round(float(t_min), 1)

            road_timeline.append({
                "timestepIndex": t_idx,
                "timeMin": round(float(t_min), 1),
                "affectedRoadsLengthKm": t_aff_km,
                "affectedPercent": t_aff_pct
            })

        peak_affected_km = max([item["affectedRoadsLengthKm"] for item in road_timeline], default=affected_km)

    return {
        "simulationId": grid_result.simulation_id,
        "totalNetworkLengthKm": total_km,
        "affectedRoadsLengthKm": affected_km,
        "unaffectedLengthKm": unaffected_km,
        "affectedPercent": affected_pct,
        "affectedSegmentsCount": len(affected_segments),
        "firstTimestepAffectedMin": first_affected_t,
        "peakAffectedRoadLengthKm": round(peak_affected_km, 3),
        "affectedSegments": affected_segments,
        "roadImpactTimeline": road_timeline
    }


def calculate_infrastructure_exposure(
    infrastructure_geojson_path: str,
    grid_result: StandardGridResult,
    asset_type: str = "critical_infrastructure"
) -> Dict[str, Any]:
    """
    Extensible infrastructure exposure calculator for hospitals, schools, bridges, or emergency facilities.
    Returns explicit 'dataset_unavailable' status if dataset does not exist on disk (never fabricates data).
    """
    if not os.path.exists(infrastructure_geojson_path):
        return {
            "status": "dataset_unavailable",
            "message": "Critical infrastructure dataset (hospitals, schools, emergency facilities) unavailable for this AOI. Schema ready for future spatial ingestion.",
            "evaluatedAssetsCount": 0,
            "affectedAssetsCount": 0,
            "assets": []
        }

    with open(infrastructure_geojson_path, "r") as f:
        data = json.load(f)

    features = data.get("features", [])
    results = []
    meta = grid_result.grid_meta
    depth_grid = grid_result.depth_array[-1] if grid_result.depth_array is not None else None

    affected_count = 0
    for feat in features:
        props = feat.get("properties", {})
        geom = feat.get("geometry", {})
        coords = geom.get("coordinates", [76.95, 10.05])

        r, c = wgs84_to_grid_idx(coords[0], coords[1], meta)
        d = float(depth_grid[r, c]) if depth_grid is not None else 0.0
        is_exp = d >= 0.10
        if is_exp:
            affected_count += 1

        results.append({
            "simulationId": grid_result.simulation_id,
            "assetId": props.get("id", f"infra-{len(results)+1:03d}"),
            "assetType": asset_type,
            "name": props.get("name", "Critical Asset"),
            "coordinates": coords,
            "maxDepthM": round(d, 2),
            "exposed": is_exp
        })

    return {
        "status": "available",
        "message": f"Evaluated {len(features)} infrastructure assets.",
        "evaluatedAssetsCount": len(features),
        "affectedAssetsCount": affected_count,
        "assets": results
    }


def calculate_temporal_impact_milestones(
    grid_result: StandardGridResult,
    village_exposure: List[Dict[str, Any]],
    road_exposure: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Calculates key temporal milestone timestamps for flood onset, peak area, peak depth, peak velocity, and asset impacts.
    """
    meta = grid_result.grid_meta
    timesteps = meta.timesteps or [0.0, 5.0, 10.0, 15.0, 20.0, 25.0, 30.0, 45.0, 60.0]

    num_ts = len(timesteps)
    first_inundation_time = None
    peak_area_time = timesteps[-1] if timesteps else 60.0
    peak_depth_time = timesteps[0] if timesteps else 0.0
    peak_velocity_time = timesteps[0] if timesteps else 0.0

    max_area = 0.0
    max_d = 0.0
    max_v = 0.0

    timeline_items = []

    for idx in range(num_ts):
        t_min = timesteps[idx]
        area_km2 = 0.0
        d_val = 0.0
        v_val = 0.0

        if grid_result.depth_array is not None and idx < grid_result.depth_array.shape[0]:
            d_grid = grid_result.depth_array[idx]
            v_grid = grid_result.velocity_array[idx] if grid_result.velocity_array is not None else None
            inundated = (d_grid >= 0.10)
            inundated_cnt = int(np.sum(inundated))
            cell_size = meta.cell_size
            area_km2 = float((inundated_cnt * cell_size * cell_size) / 1e6)

            if inundated_cnt > 0:
                if first_inundation_time is None:
                    first_inundation_time = round(float(t_min), 1)
                d_val = float(np.max(d_grid))
                if v_grid is not None:
                    v_val = float(np.max(v_grid[inundated]))

        if area_km2 > max_area:
            max_area = area_km2
            peak_area_time = t_min
        if d_val > max_d:
            max_d = d_val
            peak_depth_time = t_min
        if v_val > max_v:
            max_v = v_val
            peak_velocity_time = t_min

        # Settlements affected up to this timestep
        settlements_affected_at_t = sum(
            1 for v in village_exposure
            if v.get("exposed") and v.get("arrivalTimeMin") is not None and v.get("arrivalTimeMin") <= t_min
        )
        critical_settlements_at_t = sum(
            1 for v in village_exposure
            if v.get("exposureTier") == "CRITICAL" and v.get("arrivalTimeMin") is not None and v.get("arrivalTimeMin") <= t_min
        )

        # Road impact at this timestep
        road_t_list = road_exposure.get("roadImpactTimeline", [])
        road_item = next((r for r in road_t_list if r["timestepIndex"] == idx), None)
        road_aff_km = road_item["affectedRoadsLengthKm"] if road_item else 0.0
        road_aff_pct = road_item["affectedPercent"] if road_item else 0.0

        timeline_items.append({
            "timestepIndex": idx,
            "timeMin": round(float(t_min), 1),
            "floodAreaKm2": round(float(area_km2), 4),
            "maxDepthM": round(float(d_val), 2),
            "maxVelocityMs": round(float(v_val), 2),
            "settlementsAffectedCount": settlements_affected_at_t,
            "criticalSettlementsCount": critical_settlements_at_t,
            "affectedRoadsLengthKm": road_aff_km,
            "affectedPercent": road_aff_pct
        })

    # Settlement first impact time
    settlement_first_t = None
    affected_settlements = [v for v in village_exposure if v.get("exposed") and v.get("arrivalTimeMin") is not None]
    if affected_settlements:
        settlement_first_t = min(v["arrivalTimeMin"] for v in affected_settlements)

    return {
        "firstInundationTimeMin": first_inundation_time or 0.0,
        "peakInundationAreaTimeMin": round(float(peak_area_time), 1),
        "peakDepthTimeMin": round(float(peak_depth_time), 1),
        "peakVelocityTimeMin": round(float(peak_velocity_time), 1),
        "settlementFirstImpactTimeMin": settlement_first_t,
        "roadFirstImpactTimeMin": road_exposure.get("firstTimestepAffectedMin"),
        "impactTimeline": timeline_items
    }
