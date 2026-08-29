from fastapi import APIRouter
from .study_areas import router as study_areas_router

v1_router = APIRouter(prefix="/v1")
v1_router.include_router(study_areas_router)
