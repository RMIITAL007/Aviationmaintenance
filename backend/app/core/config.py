import os
from pathlib import Path
from typing import List, Union
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    PROJECT_NAME: str = "Maintenance Copilot"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"

    # Database
    DATABASE_URL: str = Field(
        default=f"sqlite+aiosqlite:///{BASE_DIR}/maintenance_copilot.db"
    )
    SYNC_DATABASE_URL: str = Field(
        default=f"sqlite:///{BASE_DIR}/maintenance_copilot.db"
    )

    # File and Data Paths
    BASE_DIR: Path = BASE_DIR
    DATA_DIR: Path = BASE_DIR / "data"
    RAW_DATA_PATH: Path = BASE_DIR / "data" / "raw" / "Aircraft_Annotation_DataFile.csv"
    DICTIONARIES_DIR: Path = BASE_DIR / "data" / "dictionaries"
    VECTOR_INDEX_DIR: Path = BASE_DIR / "data" / "vector_index"

    # Retrieval & Embeddings
    EMBEDDING_MODEL_NAME: str = "all-MiniLM-L6-v2"
    HYBRID_DENSE_WEIGHT: float = 0.6
    HYBRID_LEXICAL_WEIGHT: float = 0.4
    DEFAULT_TOP_K: int = 5

    # LLM Settings
    LLM_PROVIDER: str = "mock"  # "mock", "gemini", "openai", "ollama"
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    OPENAI_BASE_URL: str = "https://api.openai.com/v1"
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    LLM_MODEL_NAME: str = "gpt-4o-mini"
    MAX_AGENT_STEPS: int = 3
    TEMPERATURE: float = 0.1

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8000"
    ]

settings = Settings()
