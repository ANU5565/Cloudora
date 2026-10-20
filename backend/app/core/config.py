import os
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    APP_ENV: str = "development"
    APP_NAME: str = "Cloudora"
    APP_URL: str = "http://localhost:8000"
    FRONTEND_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001"
    ]

    # Database
    DATABASE_URL: str = "sqlite:///./cloudora.db"

    # Security & JWT
    JWT_SECRET_KEY: str = "cloudora-production-strength-secure-secret-key-entropy-928374928"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Storage
    STORAGE_PROVIDER: str = "local"  # "local" or "s3"
    LOCAL_STORAGE_PATH: str = "./storage_data"
    S3_ENDPOINT_URL: Optional[str] = None
    S3_BUCKET_NAME: str = "cloudora-files"
    S3_REGION: str = "auto"
    S3_ACCESS_KEY_ID: Optional[str] = None
    S3_SECRET_ACCESS_KEY: Optional[str] = None

    # Quotas & Limits
    DEFAULT_STORAGE_QUOTA: int = 5 * 1024 * 1024 * 1024  # 5 GB
    MAX_UPLOAD_SIZE: int = 250 * 1024 * 1024  # 250 MB
    SIGNED_URL_TTL_SECONDS: int = 900  # 15 minutes
    TRASH_RETENTION_DAYS: int = 30


settings = Settings()
