from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text

from app.core.database import get_db
from app.models.record import MaintenanceRecord
from app.services.embedding import embedding_service
from app.core.config import settings

router = APIRouter(tags=["Health"])

@router.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    db_connected = False
    record_count = 0
    try:
        count_res = await db.execute(select(func.count(MaintenanceRecord.id)))
        record_count = count_res.scalar() or 0
        db_connected = True
    except Exception:
        db_connected = False

    return {
        "status": "healthy" if db_connected else "degraded",
        "version": settings.VERSION,
        "database": {
            "connected": db_connected,
            "record_count": record_count
        },
        "vector_store": {
            "indexed": embedding_service.is_indexed(),
            "indexed_count": embedding_service.get_indexed_count(),
            "model": settings.EMBEDDING_MODEL_NAME
        },
        "llm_provider": settings.LLM_PROVIDER,
        "timestamp": datetime.utcnow().isoformat()
    }

@router.get("/health/db")
async def db_ping(db: AsyncSession = Depends(get_db)):
    try:
        await db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
