from typing import List
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from backend.schemas import StudyAreaSchema
from backend.services.study_area_service import get_all_study_areas, get_study_area_by_id
from backend.db import get_db

router = APIRouter(prefix="/study-areas", tags=["Study Areas"])

@router.get("", response_model=List[StudyAreaSchema])
def list_study_areas_endpoint(db: Session = Depends(get_db)):
    """Returns list of registered study areas."""
    return get_all_study_areas(db=db)

@router.get("/{study_area_id}", response_model=StudyAreaSchema)
def get_study_area_endpoint(study_area_id: str, db: Session = Depends(get_db)):
    """Retrieves single study area configuration by ID."""
    area = get_study_area_by_id(study_area_id, db=db)
    if not area:
        raise HTTPException(
            status_code=404,
            detail=f"Study area '{study_area_id}' not found."
        )
    return area
