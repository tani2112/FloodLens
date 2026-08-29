"""
FloodLens FastAPI Application Entry Point
Exposes REST API endpoints for hydrodynamic simulation orchestration, spatial GIS results, and early warning alerts.
Authoritative specification matching docs/ARCHITECTURE.md and docs/API.md.
"""

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.config import settings
from backend.routers import health_router
from backend.routers.v1 import v1_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="FloodLens Hydrodynamic Simulation & Early Warning System API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# CORS Configuration for local Vite frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Router Mounting
app.include_router(health_router)
app.include_router(health_router, prefix="/api")
app.include_router(v1_router, prefix="/api")


@app.get("/")
def root():
    return {
        "message": "Welcome to FloodLens API",
        "version": "1.0.0",
        "docs": "/docs",
        "openapi": "/openapi.json",
        "canonical_study_area": "/api/v1/study-areas/idukki-canonical"
    }


# Global Exception Handler preventing unhandled stack traces in production responses
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error occurred.", "type": type(exc).__name__}
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
