from fastapi import APIRouter
from typing import List
from backend.schemas import StudyAreaSchema

router = APIRouter(prefix="/study-areas", tags=["Study Areas"])

@router.get("", response_model=List[StudyAreaSchema])
def list_study_areas():
    return [
        StudyAreaSchema(
            id="sa-demo-01",
            name="Demo Catchment (Canonical AOI)",
            bbox=[76.8, 10.2, 77.2, 10.5],
            river="Demo River",
            damOrBlockage="Demo Main Dam",
            demDataset="SRTM",
            satelliteDataset="Sentinel-1",
            createdAt="2026-08-29T10:00:00Z"
        )
    ]
