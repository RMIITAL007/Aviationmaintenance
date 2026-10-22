from fastapi import APIRouter
from app.api.routes import health, ingestion, records, search, chat, analytics, evaluation, settings

api_router = APIRouter()

# Mount all feature routes
api_router.include_router(health.router)
api_router.include_router(ingestion.router)
api_router.include_router(records.router)
api_router.include_router(search.router)
api_router.include_router(chat.router)
api_router.include_router(analytics.router)
api_router.include_router(evaluation.router)
api_router.include_router(settings.router)
