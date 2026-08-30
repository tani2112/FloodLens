import os

class Settings:
    PROJECT_NAME: str = "FloodLens API Engine"
    API_V1_PREFIX: str = "/api/v1"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./data/floodlens.db")
    
    _cors_raw: str = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://localhost:80,http://localhost,http://127.0.0.1"
    )
    CORS_ORIGINS: list = [origin.strip() for origin in _cors_raw.split(",") if origin.strip()]
    
    APP_ENV: str = os.getenv("APP_ENV", "development")
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO").upper()

settings = Settings()
