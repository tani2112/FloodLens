import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "FloodLens API"
    API_V1_STR: str = "/api/v1"
    PORT: int = int(os.getenv("PORT", "8000"))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://floodlens:floodlens_secret@localhost:5432/floodlens_db")

settings = Settings()
