"""
FloodLens API v1 Router Aggregator
Combines all v1 domain routers under the /api/v1 prefix.
"""

from fastapi import APIRouter
from backend.routers.v1 import (
    study_areas,
    scenarios,
    simulations,
    results,
    layers,
    exposure,
    warnings,
    comparison,
    validation,
    exports
)

v1_router = APIRouter(prefix="/v1")

v1_router.include_router(study_areas.router)
v1_router.include_router(scenarios.router)
v1_router.include_router(simulations.router)
v1_router.include_router(results.router)
v1_router.include_router(layers.router)
v1_router.include_router(exposure.router)
v1_router.include_router(warnings.router)
v1_router.include_router(comparison.router)
v1_router.include_router(validation.router)
v1_router.include_router(exports.router)
