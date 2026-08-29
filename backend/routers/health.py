from fastapi import APIRouter

router = APIRouter(tags=["Health"])

@router.get("/health", summary="System Health Check")
def health_check():
    return {
        "status": "ok",
        "service": "FloodLens API Engine",
        "phase": "Phase 2 — Shell Active"
    }
