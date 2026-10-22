from functools import lru_cache
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application configuration for BookSphere AI Recommendation Service.
    Reads values from environment variables and the .env file.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    SERVICE_NAME: str = "BookSphere AI Recommendation Service"
    SERVICE_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    # Service-to-service authentication secret token
    AI_SERVICE_TOKEN: str = "bd6b0002abf3404cb10e83815b23d0e47dbf6c1efb8d9b2f532ae2ec7b63a0ab"

    # Recommendation defaults
    DEFAULT_LIMIT: int = 5
    MAX_LIMIT: int = 50


@lru_cache()
def get_settings() -> Settings:
    """Returns cached settings instance."""
    return Settings()
