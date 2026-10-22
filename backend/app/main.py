import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select, func

from app.core.config import settings
from app.core.database import init_db, AsyncSessionLocal
from app.api.api_router import api_router
from app.models.record import MaintenanceRecord
from app.services.ingestion import ingestion_service
from app.services.embedding import embedding_service

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("maintenance_copilot")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION} [{settings.ENVIRONMENT}]")
    
    # 1. Initialize SQLite / PostgreSQL tables
    logger.info("Initializing database schema...")
    await init_db()

    # 2. Check if records exist; if empty, automatically ingest raw dataset
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(func.count(MaintenanceRecord.id)))
        total_records = res.scalar() or 0
        
        if total_records == 0 and settings.RAW_DATA_PATH.exists():
            logger.info(f"Database empty. Auto-ingesting dataset from {settings.RAW_DATA_PATH}...")
            try:
                with open(settings.RAW_DATA_PATH, "rb") as f:
                    content = f.read()
                ingest_res = await ingestion_service.ingest_csv_content(
                    content=content,
                    filename=settings.RAW_DATA_PATH.name,
                    db=db
                )
                logger.info(f"Auto-ingestion complete: {ingest_res.get('records_imported')} records imported.")
            except Exception as e:
                logger.error(f"Error during auto-ingestion: {e}")

        # 3. Check vector index; if not built, build now
        if not embedding_service.is_indexed():
            logger.info("Vector index not found on disk. Building dense vector embeddings from database records...")
            records_res = await db.execute(select(MaintenanceRecord))
            all_records = [r.to_dict() for r in records_res.scalars().all()]
            if all_records:
                indexed_count = embedding_service.build_index(all_records)
                logger.info(f"Vector index built with {indexed_count} embeddings.")

    yield
    logger.info("Shutting down Maintenance Copilot...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Agentic RAG decision-support system over aviation maintenance logbooks.",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routes
app.include_router(api_router, prefix=settings.API_PREFIX)

# Also expose /health at root for health-checks
from app.api.routes.health import router as health_router
app.include_router(health_router)
