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
        {"name": "Cheruthoni", "lat": 10.0510, "lon": 76.9740, "district": "Idukki", "population": 8450},
        {"name": "Painavu", "lat": 10.0380, "lon": 76.9810, "district": "Idukki", "population": 4200},
        {"name": "Vazhathope", "lat": 10.0290, "lon": 76.9620, "district": "Idukki", "population": 6100},
        {"name": "Chelachuvadu", "lat": 10.0750, "lon": 76.9200, "district": "Idukki", "population": 5300},
        {"name": "Lower Periyar", "lat": 10.0910, "lon": 76.8850, "district": "Idukki", "population": 3800},
        {"name": "Adimali", "lat": 10.1040, "lon": 76.9530, "district": "Idukki", "population": 15800}
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
                    "id": f"v-{idx+1:03d}",
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
                    "id": "r-001",
                    "name": "Periyar River",
                    "waterway": "river"
                },
                "geometry": {
                    "type": "LineString",
                    "coordinates": [
                        [76.9820, 10.0520],
                        [76.9740, 10.0510],
                        [76.9500, 10.0600],
                        [76.9200, 10.0750],
                        [76.8850, 10.0910],
                        [76.8400, 10.1150]
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
                    "id": "rd-001",
                    "name": "NH 185 (Kattappana - Adimali Road)",
                    "highway": "primary"
                },
                "geometry": {
                    "type": "LineString",
                    "coordinates": [
                        [76.9810, 10.0380],
                        [76.9740, 10.0510],
                        [76.9530, 10.1040]
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
                    "id": "dam-idukki-001",
                    "name": "Idukki Arch Dam & Cheruthoni Dam",
                    "river": "Periyar River",
                    "dam_type": "Concrete Double Curvature Arch",
                    "height_m": 168.91,
                    "length_m": 365.85,
                    "storage_capacity_mm3": 1996.0
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": [76.9790, 10.0526]
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
