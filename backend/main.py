from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.config import settings
from backend.routers import health_router
from backend.routers.v1 import v1_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="FloodLens Hydrodynamic Simulation & Early Warning System API",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for local frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(health_router)
app.include_router(health_router, prefix="/api")
app.include_router(health_router, prefix="/api/v1")
app.include_router(v1_router, prefix="/api")

@app.get("/")
def root():
    return {
        "message": "Welcome to FloodLens API",
        "docs": "/docs",
        "phase": "Phase 2 — Shell Active"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
