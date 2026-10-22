from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from app.core.config import settings

router = APIRouter(prefix="/settings", tags=["Settings"])

class ModelSettingsRequest(BaseModel):
    provider: str = Field(..., description="LLM provider: 'local', 'gemini', 'openai', 'ollama', 'mock'")
    api_key: Optional[str] = Field(None, description="API key for Gemini or OpenAI")
    model_name: Optional[str] = Field(None, description="Model identifier e.g. gemini-1.5-flash, gpt-4o-mini")
    base_url: Optional[str] = Field(None, description="Custom base URL for Ollama or custom gateway")
    temperature: Optional[float] = Field(0.1, ge=0.0, le=1.0)

class ModelSettingsResponse(BaseModel):
    provider: str
    model_name: str
    has_gemini_key: bool
    has_openai_key: bool
    masked_key: Optional[str] = None
    temperature: float
    base_url: Optional[str] = None

@router.get("/model", response_model=ModelSettingsResponse)
async def get_model_settings():
    provider = settings.LLM_PROVIDER.lower().strip()
    active_key = settings.GEMINI_API_KEY if provider == "gemini" else (settings.OPENAI_API_KEY if provider == "openai" else "")
    masked = f"{active_key[:4]}...{active_key[-4:]}" if len(active_key) > 8 else ("Configured" if active_key else None)
    
    return ModelSettingsResponse(
        provider=provider,
        model_name=settings.LLM_MODEL_NAME,
        has_gemini_key=bool(settings.GEMINI_API_KEY),
        has_openai_key=bool(settings.OPENAI_API_KEY),
        masked_key=masked,
        temperature=settings.TEMPERATURE,
        base_url=settings.OLLAMA_BASE_URL if provider == "ollama" else settings.OPENAI_BASE_URL
    )

@router.post("/model", response_model=ModelSettingsResponse)
async def update_model_settings(req: ModelSettingsRequest):
    provider = req.provider.lower().strip()
    if provider not in ["local", "gemini", "openai", "ollama", "mock"]:
        raise HTTPException(status_code=400, detail=f"Unsupported provider '{provider}'. Must be local, gemini, openai, ollama, or mock.")

    settings.LLM_PROVIDER = provider
    if req.model_name:
        settings.LLM_MODEL_NAME = req.model_name
    if req.temperature is not None:
        settings.TEMPERATURE = req.temperature

    if provider == "gemini" and req.api_key:
        settings.GEMINI_API_KEY = req.api_key.strip()
    elif provider == "openai" and req.api_key:
        settings.OPENAI_API_KEY = req.api_key.strip()
        if req.base_url:
            settings.OPENAI_BASE_URL = req.base_url.strip()
    elif provider == "ollama" and req.base_url:
        settings.OLLAMA_BASE_URL = req.base_url.strip()

    active_key = settings.GEMINI_API_KEY if provider == "gemini" else (settings.OPENAI_API_KEY if provider == "openai" else "")
    masked = f"{active_key[:4]}...{active_key[-4:]}" if len(active_key) > 8 else ("Configured" if active_key else None)

    return ModelSettingsResponse(
        provider=settings.LLM_PROVIDER,
        model_name=settings.LLM_MODEL_NAME,
        has_gemini_key=bool(settings.GEMINI_API_KEY),
        has_openai_key=bool(settings.OPENAI_API_KEY),
        masked_key=masked,
        temperature=settings.TEMPERATURE,
        base_url=settings.OLLAMA_BASE_URL if provider == "ollama" else settings.OPENAI_BASE_URL
    )
