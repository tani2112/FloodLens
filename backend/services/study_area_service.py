import os
import json
from typing import List, Optional
from sqlalchemy.orm import Session
from backend.schemas import StudyAreaSchema
from backend.models.database import StudyAreaModel

def get_all_study_areas(db: Optional[Session] = None) -> List[StudyAreaSchema]:
    if db:
        areas = db.query(StudyAreaModel).all()
        if areas:
            return [
                StudyAreaSchema(
                    id=a.id,
                    name=a.name,
                    bbox=tuple(a.bbox),
                    river=a.river,
                    damOrBlockage=a.dam_or_blockage,
                    demDataset=a.dem_dataset,
                    satelliteDataset=a.satellite_dataset,
                    createdAt=a.created_at
                )
                for a in areas
            ]
    
    # Fallback to config file
    config_path = os.path.join("data", "config", "canonical_aoi.json")
    if os.path.exists(config_path):
        with open(config_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return [
            StudyAreaSchema(
                id=data.get("id", "scen-nepal-glof"),
                name=data.get("name", "Lhende Khola & Bhote Koshi / Trishuli River Catchment"),
                bbox=tuple(data.get("bbox", [85.20, 27.90, 85.50, 28.40])),
                river=data.get("river", "Bhote Koshi / Trishuli River"),
                damOrBlockage=data.get("dam_or_blockage", "Rasuwagadhi Dam & Lhende Khola Barrier Lake"),
                demDataset=data.get("dem_dataset", "Copernicus DEM 30m / SRTM 30m Nepal Himalayas"),
                satelliteDataset=data.get("satellite_dataset", "Sentinel-1 / Sentinel-2 / PlanetScope")
            )
        ]
    return []

list_study_areas = get_all_study_areas
get_canonical_aoi_data = lambda db=None: get_all_study_areas(db)[0] if get_all_study_areas(db) else None

def get_study_area_by_id(study_area_id: str, db: Optional[Session] = None) -> Optional[StudyAreaSchema]:
    if db:
        a = db.query(StudyAreaModel).filter(StudyAreaModel.id == study_area_id).first()
        if a:
            return StudyAreaSchema(
                id=a.id,
                name=a.name,
                bbox=tuple(a.bbox),
                river=a.river,
                damOrBlockage=a.dam_or_blockage,
                demDataset=a.dem_dataset,
                satelliteDataset=a.satellite_dataset,
                createdAt=a.created_at
            )
    
    areas = get_all_study_areas(db)
    for area in areas:
        if area.id == study_area_id:
            return area
    return None
