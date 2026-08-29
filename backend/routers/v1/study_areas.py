"""
FloodLens REST API — Study Areas Router
Endpoints: GET /api/v1/study-areas, GET /api/v1/study-areas/{study_area_id}
"""

from typing import List
from fastapi import APIRouter, HTTPException, status
from backend.schemas import StudyAreaSchema
from backend.services.study_area_service import list_study_areas, get_study_area_by_id

router = APIRouter(prefix="/study-areas", tags=["Study Areas"])


@router.get("", response_model=List[StudyAreaSchema])
def get_all_study_areas():
    """Returns list of registered study areas (canonical Idukki AOI)."""
    return list_study_areas()


@router.get("/{study_area_id}", response_model=StudyAreaSchema)
def get_study_area(study_area_id: str):
    """Retrieves specific study area configuration by ID."""
    area = get_study_area_by_id(study_area_id)
    if not area:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Study area '{study_area_id}' not found."
        )
    return area
