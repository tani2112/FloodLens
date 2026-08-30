"""
FloodLens FastAPI Application Entry Point
Exposes REST API endpoints for hydrodynamic simulation orchestration, spatial GIS results, and early warning alerts.
Authoritative specification matching docs/ARCHITECTURE.md and docs/API.md.
"""

import uuid
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.config import settings
from backend.db import init_db
from backend.routers import health_router
from backend.routers.v1 import v1_router

# Configure logging according to LOG_LEVEL setting
log_level = getattr(logging, settings.LOG_LEVEL, logging.INFO)
logging.basicConfig(level=log_level, format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s")
logger = logging.getLogger("floodlens.backend")

# Ensure database tables are initialized on import
init_db()

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.PROJECT_NAME} (env={settings.APP_ENV}, log_level={settings.LOG_LEVEL})...")
    yield
    logger.info(f"Shutting down {settings.PROJECT_NAME}.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="FloodLens Hydrodynamic Simulation & Early Warning System API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# Request ID Tracing Middleware
@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID") or f"req-{uuid.uuid4().hex[:8]}"
    request.state.request_id = request_id
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response

# CORS Configuration for frontend development & production deployment
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

# Structured HTTP Exception Handler
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    request_id = getattr(request.state, "request_id", "req-unknown")
    code_map = {
        400: "BAD_REQUEST",
        404: "NOT_FOUND",
        500: "INTERNAL_SERVER_ERROR",
        501: "NOT_IMPLEMENTED",
        503: "SERVICE_UNAVAILABLE"
    }
    error_code = code_map.get(exc.status_code, "API_ERROR")
    logger.warning(f"[{request_id}] HTTP {exc.status_code} ({error_code}): {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "error": {
                "code": error_code,
                "message": exc.detail,
                "request_id": request_id
            }
        },
        headers={"X-Request-ID": request_id}
    )

# Global Exception Handler preventing unhandled stack traces in production responses
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    request_id = getattr(request.state, "request_id", "req-unknown")
    logger.error(f"[{request_id}] Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "Internal server error occurred.",
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "Internal server error occurred.",
                "request_id": request_id
            }
        },
        headers={"X-Request-ID": request_id}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=settings.HOST, port=settings.PORT, reload=False)
