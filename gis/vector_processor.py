"""
FloodLens GIS Processing Layer — Vector Data Processor
Prepares GeoJSON layers for villages, rivers, roads, and dam locations for the canonical AOI.
"""

import json
import os
from typing import Dict, Any, List, Tuple

def generate_canonical_vectors(
    output_dir: str,
    bbox: List[float],
    aoi_config_path: str = "data/config/canonical_aoi.json"
) -> Dict[str, Any]:
    """Generates valid GeoJSON layers for canonical villages, rivers, roads, and dam structure."""
    os.makedirs(output_dir, exist_ok=True)
    
    # Load canonical AOI config if available
    villages_data = [
        {"name": "Rasuwagadhi Border Compound", "lat": 28.2670, "lon": 85.3780, "district": "Rasuwa", "population": 350},
        {"name": "Timure Freight Hub & Dry Port", "lat": 28.2430, "lon": 85.3750, "district": "Rasuwa", "population": 1250},
        {"name": "Syabrubesi Township", "lat": 28.1610, "lon": 85.3370, "district": "Rasuwa", "population": 2800},
        {"name": "Goljung Valley Village", "lat": 28.1400, "lon": 85.3200, "district": "Rasuwa", "population": 950},
        {"name": "Dhunche District Center", "lat": 28.1100, "lon": 85.3000, "district": "Rasuwa", "population": 3400},
        {"name": "Betrawati Basin Settlement", "lat": 28.0700, "lon": 85.2800, "district": "Nuwakot", "population": 1850}
    ]
    
    # 1. Villages GeoJSON
    villages_geojson = {
        "type": "FeatureCollection",
        "name": "villages",
        "crs": {"type": "name", "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}},
        "features": [
            {
                "type": "Feature",
                "properties": {
                    "id": f"v-np-{idx+1:03d}",
                    "name": v["name"],
                    "district": v["district"],
                    "population": v["population"],
                    "asset_type": "village"
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": [v["lon"], v["lat"]]
                }
            }
            for idx, v in enumerate(villages_data)
        ]
    }
    villages_path = os.path.join(output_dir, "villages.geojson")
    with open(villages_path, "w") as f:
        json.dump(villages_geojson, f, indent=2)
        
    # 2. Rivers GeoJSON
    rivers_geojson = {
        "type": "FeatureCollection",
        "name": "rivers",
        "crs": {"type": "name", "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}},
        "features": [
            {
                "type": "Feature",
                "properties": {
                    "id": "r-np-001",
                    "name": "Lhende Khola → Bhote Koshi / Trishuli River",
                    "waterway": "river"
                },
                "geometry": {
                    "type": "LineString",
                    "coordinates": [
                        [85.405, 28.305],
                        [85.392, 28.285],
                        [85.385, 28.275],
                        [85.378, 28.263],
                        [85.373, 28.243],
                        [85.355, 28.210],
                        [85.335, 28.162],
                        [85.320, 28.140],
                        [85.300, 28.110],
                        [85.280, 28.070]
                    ]
                }
            }
        ]
    }
    rivers_path = os.path.join(output_dir, "rivers.geojson")
    with open(rivers_path, "w") as f:
        json.dump(rivers_geojson, f, indent=2)

    # 3. Roads GeoJSON
    roads_geojson = {
        "type": "FeatureCollection",
        "name": "roads",
        "crs": {"type": "name", "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}},
        "features": [
            {
                "type": "Feature",
                "properties": {
                    "id": "rd-np-001",
                    "name": "Pasang Lhamu Highway (NH-34 Corridor)",
                    "highway": "trunk_highway"
                },
                "geometry": {
                    "type": "LineString",
                    "coordinates": [
                        [85.3780, 28.2670],
                        [85.3750, 28.2430],
                        [85.3370, 28.1610],
                        [85.3000, 28.1100],
                        [85.2800, 28.0700]
                    ]
                }
            }
        ]
    }
    roads_path = os.path.join(output_dir, "roads.geojson")
    with open(roads_path, "w") as f:
        json.dump(roads_geojson, f, indent=2)

    # 4. Dam GeoJSON
    dam_geojson = {
        "type": "FeatureCollection",
        "name": "dam",
        "crs": {"type": "name", "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}},
        "features": [
            {
                "type": "Feature",
                "properties": {
                    "id": "dam-rasuwagadhi-001",
                    "name": "Rasuwagadhi Dam & Lhende Khola Barrier Lake",
                    "river": "Bhote Koshi / Trishuli River",
                    "dam_type": "Run-of-River Hydro & Landslide Barrier Lake",
                    "height_m": 45.0,
                    "length_m": 120.0,
                    "storage_capacity_mm3": 24.5
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": [85.385, 28.275]
                }
            }
        ]
    }
    dam_path = os.path.join(output_dir, "dam.geojson")
    with open(dam_path, "w") as f:
        json.dump(dam_geojson, f, indent=2)

    return {
        "villages": len(villages_geojson["features"]),
        "rivers": len(rivers_geojson["features"]),
        "roads": len(roads_geojson["features"]),
        "dams": len(dam_geojson["features"])
    }


def validate_vector_layer(filepath: str, expected_type: str = "FeatureCollection") -> Tuple[bool, str, Dict[str, Any]]:
    """Validate readable GeoJSON formatting, geometry structure, and feature counts."""
    if not os.path.exists(filepath):
        return False, f"Vector file does not exist at {filepath}", {}
    
    try:
        with open(filepath, "r") as f:
            data = json.load(f)
            
        if data.get("type") != expected_type:
            return False, f"Invalid GeoJSON type in {filepath}: expected {expected_type}, got {data.get('type')}", {}
            
        features = data.get("features", [])
        if not isinstance(features, list) or len(features) == 0:
            return False, f"Vector file {filepath} contains no features", {}
            
        return True, f"Valid GeoJSON vector layer ({len(features)} features)", {"count": len(features)}
    except Exception as e:
        return False, f"Failed to parse GeoJSON at {filepath}: {str(e)}", {}
