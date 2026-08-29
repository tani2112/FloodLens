"""
FloodLens Early Warning Decision Support Engine
Maps settlement exposure metrics to structured 4-tier decision-support warning alerts.
Authoritative contract matching docs/ARCHITECTURE.md, docs/API.md, and Phase 5 specs.
"""

from typing import List, Dict, Any

def generate_warning_alerts(
    exposure_results: List[Dict[str, Any]],
    simulation_id: str = "sim-level1-default"
) -> List[Dict[str, Any]]:
    """
    Transforms settlement exposure statistics into actionable, scenario-based decision-support alerts.
    
    Parameters:
        exposure_results: List of ExposureResult objects from calculate_village_exposure
        simulation_id: ID of the simulation run
        
    Returns:
        List of Warning objects matching docs/API.md schema.
    """
    warnings = []
    
    for exp in exposure_results:
        # Generate warnings only for exposed settlements
        if not exp.get("exposed", False):
            continue
            
        w_level = exp.get("warningLevel", "advisory")
        v_id = exp.get("assetId", "v-000")
        v_name = exp.get("name", "Unnamed Village")
        depth_m = exp.get("maxDepthM", 0.0)
        arr_min = exp.get("arrivalTimeMin", 999.0)
        
        # Triggered rationale explanation
        if w_level == "critical":
            trigger_reason = f"Critical flood depth ({depth_m}m) or rapid arrival time ({arr_min} min)"
        elif w_level == "warning":
            trigger_reason = f"High inundation depth ({depth_m}m) threatening residential structures"
        elif w_level == "watch":
            trigger_reason = f"Moderate water depth ({depth_m}m) affecting low-lying access roads"
        else:
            trigger_reason = f"Minor water depth ({depth_m}m) near river channel"

        warning_card = {
            "simulationId": exp.get("simulationId", simulation_id),
            "villageId": v_id,
            "villageName": v_name,
            "level": w_level,
            "arrivalTimeMin": arr_min,
            "maxDepthM": depth_m,
            "maxVelocityMs": round(float(depth_m * 1.8), 2), # Derived local flow velocity proxy
            "triggeredBy": trigger_reason,
            "disclaimer": "Scenario-based early-warning / decision-support output — not an official disaster warning."
        }
        warnings.append(warning_card)
        
    return warnings
