"""
FloodLens Backend — Result Service
Retrieves simulation summary KPI metrics, flood layer descriptors, exposure tables,
decision-support warnings, and safely serves result files from data/results/<simulation_id>/.
"""

import json
import os
from typing import List, Dict, Any, Optional

from backend.schemas import (
    FloodResultSchema,
    FloodLayerSchema,
    ExposureResultSchema,
    WarningSchema
)
from backend.services.simulation_service import SIMULATION_STORE


def get_simulation_result_dir(simulation_id: str) -> str:
    """Returns canonical directory path for simulation results."""
    return os.path.abspath(os.path.join("data", "results", simulation_id))


def simulation_exists(simulation_id: str) -> bool:
    """Checks if simulation exists in memory or disk results directory."""
    if simulation_id in SIMULATION_STORE:
        return True
    meta_path = os.path.join(get_simulation_result_dir(simulation_id), "metadata.json")
    return os.path.exists(meta_path)


def get_flood_results(simulation_id: str) -> Optional[FloodResultSchema]:
    """Retrieves high-level KPI summary metrics for completed simulation run."""
    meta_path = os.path.join(get_simulation_result_dir(simulation_id), "metadata.json")
    if not os.path.exists(meta_path):
        if simulation_id in SIMULATION_STORE and "summary_stats" in SIMULATION_STORE[simulation_id]:
            stats = SIMULATION_STORE[simulation_id]["summary_stats"]
            mb = SIMULATION_STORE[simulation_id].get("mass_balance_info", {})
        else:
            return None
    else:
        with open(meta_path, "r") as f:
            meta_data = json.load(f)
            stats = meta_data.get("summary_stats", {})
            mb = meta_data.get("mass_balance_info", {})

    exp_path = os.path.join(get_simulation_result_dir(simulation_id), "exposure.json")
    pop_exposed = 0
    roads_affected_km = 0.0
    
    if os.path.exists(exp_path):
        with open(exp_path, "r") as f:
            exp_bundle = json.load(f)
            v_exp = exp_bundle.get("villageExposure", [])
            pop_exposed = sum(v.get("populationExposed") or 0 for v in v_exp if v.get("exposed"))
            r_exp = exp_bundle.get("roadExposure", {})
            roads_affected_km = r_exp.get("affectedRoadsLengthKm", 0.0)

    return FloodResultSchema(
        simulationId=simulation_id,
        floodAreaKm2=stats.get("total_flood_area_km2", 0.0),
        maxDepthM=stats.get("max_depth_m", 0.0),
        maxVelocityMs=stats.get("max_velocity_ms", 0.0),
        arrivalTimeMin=stats.get("min_arrival_time_min", 0.0),
        durationHr=1.0,
        populationExposed=pop_exposed,
        buildingsAffected=0,
        roadsAffectedKm=roads_affected_km,
        massBalanceErrorPercent=mb.get("mass_balance_error_percent", 0.0),
        executionTimeSeconds=SIMULATION_STORE.get(simulation_id, {}).get("execution_time_seconds", 0.0),
        dataSource="live"
    )


def get_flood_layers(simulation_id: str, timestep: Optional[int] = -1) -> Optional[List[FloodLayerSchema]]:
    """Retrieves MapLibre layer descriptors for simulation."""
    if not simulation_exists(simulation_id):
        return None

    layers_path = os.path.join(get_simulation_result_dir(simulation_id), "flood_layers.json")
    if not os.path.exists(layers_path):
        return []
        
    with open(layers_path, "r") as f:
        layers_data = json.load(f)

    res = []
    for l in layers_data:
        res.append(FloodLayerSchema(**l))
    return res


def get_exposure_results(simulation_id: str) -> Optional[List[ExposureResultSchema]]:
    """Retrieves settlement exposure list."""
    if not simulation_exists(simulation_id):
        return None

    exp_path = os.path.join(get_simulation_result_dir(simulation_id), "exposure.json")
    if not os.path.exists(exp_path):
        return []

    with open(exp_path, "r") as f:
        data = json.load(f)
        v_exp = data.get("villageExposure", [])

    res = []
    for item in v_exp:
        res.append(ExposureResultSchema(
            simulationId=item.get("simulationId", simulation_id),
            assetId=item.get("assetId", "v-001"),
            assetType=item.get("assetType", "village"),
            name=item.get("name", "Settlement"),
            coordinates=item.get("coordinates"),
            maxDepthM=item.get("maxDepthM", 0.0),
            arrivalTimeMin=item.get("arrivalTimeMin"),
            exposed=item.get("exposed", False),
            warningLevel=item.get("warningLevel", "advisory"),
            exposureTier=item.get("exposureTier", "SAFE"),
            population=item.get("population"),
            populationExposed=item.get("populationExposed"),
            populationDataStatus=item.get("populationDataStatus", "available")
        ))
    return res


def get_warning_alerts(simulation_id: str) -> Optional[List[WarningSchema]]:
    """Retrieves decision-support warnings for simulation."""
    if not simulation_exists(simulation_id):
        return None

    exp_path = os.path.join(get_simulation_result_dir(simulation_id), "exposure.json")
    if not os.path.exists(exp_path):
        return []

    with open(exp_path, "r") as f:
        data = json.load(f)
        warnings_data = data.get("warnings", [])

    res = []
    for w in warnings_data:
        res.append(WarningSchema(**w))
    return res


def get_safe_result_file_path(simulation_id: str, filename: str) -> Optional[str]:
    """
    Validates filename and returns safe absolute path within data/results/<simulation_id>/
    Prevents path traversal attacks (e.g. filename='../../etc/passwd').
    """
    base_dir = get_simulation_result_dir(simulation_id)
    if not os.path.exists(base_dir):
        return None

    safe_name = os.path.basename(filename)
    target_path = os.path.abspath(os.path.join(base_dir, safe_name))

    if not target_path.startswith(base_dir):
        return None

    if os.path.exists(target_path):
        return target_path

    return None
