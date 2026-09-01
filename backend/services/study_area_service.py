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
    
    canonical_areas = [
        StudyAreaSchema(
            id="nepal-lhende-bhotekoshi-aoi",
            name="Nepal Himalayas — Lhende Khola & Bhote Koshi / Trishuli Catchment (2026)",
            bbox=(85.20, 27.90, 85.50, 28.40),
            river="Lhende Khola → Bhote Koshi / Trishuli River",
            damOrBlockage="Landslide Dam / Temporary Barrier Lake & Rasuwagadhi Dam",
            demDataset="Copernicus GLO-30 / ALOS PALSAR 12.5m Himalayan DEM",
            satelliteDataset="Sentinel-1 SAR / Sentinel-2 MSI / PlanetScope",
            createdAt="2026-08-26T10:42:00Z"
        ),
        StudyAreaSchema(
            id="rishiganga-uttarakhand-2021",
            name="Rishi Ganga River, Uttarakhand (Feb 2021) — Natural Lake & Chamoli Flash Flood",
            bbox=(79.50, 30.30, 79.85, 30.65),
            river="Rishi Ganga → Dhauliganga → Alaknanda River",
            damOrBlockage="Ronti Peak Ice/Rock Avalanche Natural Dam & Tapovan Vishnugad Hydropower Project",
            demDataset="Copernicus DEM 30m / Cartosat-1 DEM",
            satelliteDataset="Sentinel-2 / PlanetScope / Landsat-8",
            createdAt="2021-02-07T04:30:00Z"
        ),
        StudyAreaSchema(
            id="phuktal-zanskar-2015",
            name="Phuktal River near Sumdo, Zanskar, J&K / Ladakh (Mar 2015) — Landslide Dam Lake",
            bbox=(76.80, 33.10, 77.40, 33.55),
            river="Tsarap Chu / Phuktal River → Zanskar River",
            damOrBlockage="Marshun-Sumdo Massive Landslide Blockage (15M m³ Artificial Lake)",
            demDataset="SRTM 30m / ALOS World 3D-30m",
            satelliteDataset="WorldView / Sentinel-2 / Cartosat",
            createdAt="2015-03-15T08:00:00Z"
        ),
        StudyAreaSchema(
            id="wapriyang-2021",
            name="Wapriyang River (Nov 2021) — Natural Landslide Lake Outburst",
            bbox=(94.00, 28.40, 94.40, 28.80),
            river="Wapriyang River → Siang / Brahmaputra Tributaries",
            damOrBlockage="Steep Gorge Debris Avalanche Natural River Dam",
            demDataset="Copernicus GLO-30 / AW3D30",
            satelliteDataset="Sentinel-1 SAR / PlanetScope",
            createdAt="2021-11-12T14:00:00Z"
        ),
        StudyAreaSchema(
            id="kosi-2008",
            name="Kosi River (Aug 2008) — Kushaha Transboundary Embankment Breach & Mega-Avulsion",
            bbox=(86.70, 25.80, 87.20, 26.80),
            river="Saptakoshi / Kosi River Basin",
            damOrBlockage="Kosi Barrage Kushaha Left Afflux Embankment (12.9 km upstream)",
            demDataset="SRTM 30m / HydroSHEDS DEM",
            satelliteDataset="MODIS / Landsat-7 / IRS-P6",
            createdAt="2008-08-18T07:30:00Z"
        )
    ]
    return canonical_areas

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
    
    # Flexible identifier fallback for Trishuli / Bhote Koshi / Nepal GLOF AOI
    if areas and any(k in (study_area_id or "").lower() for k in ["nepal", "glof", "trishuli", "lhende", "bhote", "aoi"]):
        return areas[0]
    
    return areas[0] if areas else None
