"""
FloodLens Backend — Study Area Service
Loads canonical AOI configuration and manages study area definitions.
"""

import json
import os
from typing import List, Dict, Any, Optional
from backend.schemas import StudyAreaSchema


def get_canonical_aoi_data() -> Dict[str, Any]:
    """Loads study area configuration from data/config/canonical_aoi.json."""
    path = "data/config/canonical_aoi.json"
    if os.path.exists(path):
        with open(path, "r") as f:
            return json.load(f)
            
    # Default fallback matching canonical specification
    return {
        "id": "idukki-canonical",
        "name": "Idukki Dam & Periyar River Catchment",
        "river": "Periyar River",
        "dam_or_blockage": "Idukki Arch Dam / Cheruthoni Spillway",
        "bbox_wgs84": [76.80, 9.85, 77.10, 10.20],
        "dem_dataset": "SRTM 30m / Copernicus DEM",
        "crs_metric": "EPSG:32643",
        "crs_geographic": "EPSG:4326"
    }


def list_study_areas() -> List[StudyAreaSchema]:
    """Returns list of all registered study areas."""
    raw = get_canonical_aoi_data()
    area = StudyAreaSchema(
        id=raw.get("id", "idukki-canonical"),
        name=raw.get("name", "Idukki Dam & Periyar River Catchment"),
        bbox=raw.get("bbox_wgs84", [76.80, 9.85, 77.10, 10.20]),
        river=raw.get("river", "Periyar River"),
        damOrBlockage=raw.get("dam_or_blockage", "Idukki Arch Dam / Cheruthoni Spillway"),
        demDataset=raw.get("dem_dataset", "SRTM 30m / Copernicus DEM"),
        satelliteDataset="Sentinel-1 / Sentinel-2",
        createdAt="2026-08-29T10:00:00Z"
    )
    return [area]


def get_study_area_by_id(study_area_id: str) -> Optional[StudyAreaSchema]:
    """Retrieves specific study area by ID."""
    areas = list_study_areas()
    for a in areas:
        if a.id == study_area_id:
            return a
    return None
