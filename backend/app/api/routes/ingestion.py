import os
from pathlib import Path
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.record import MaintenanceRecord
from app.services.ingestion import ingestion_service
from app.services.embedding import embedding_service
from app.services.normalizer import normalizer
from app.schemas.analytics import IngestionStatusResponse

router = APIRouter(prefix="/ingestion", tags=["Ingestion"])

@router.post("/upload")
async def upload_logbook(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Uploaded file missing filename")

    ext = Path(file.filename).suffix.lower()
    content = await file.read()

    if len(content) > 25 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds maximum permitted limit (25 MB)")

    if ext == ".csv":
        result = await ingestion_service.ingest_csv_content(content, file.filename, db)
    elif ext in [".xlsx", ".xls"]:
        temp_path = Path("/tmp") / file.filename
        try:
            with open(temp_path, "wb") as f:
                f.write(content)
            result = await ingestion_service.ingest_excel_file(temp_path, db)
        finally:
            if temp_path.exists():
                os.remove(temp_path)
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported file format '{ext}'. Expected .csv, .xlsx, or .xls")

    return result

@router.get("/status", response_model=IngestionStatusResponse)
async def get_status(db: AsyncSession = Depends(get_db)):
    status_dict = await ingestion_service.get_ingestion_status(db)
    status_dict["vector_indexed"] = embedding_service.is_indexed()
    status_dict["vector_count"] = embedding_service.get_indexed_count()
    return IngestionStatusResponse(**status_dict)

@router.get("/dictionaries")
async def get_dictionaries():
    return {
        "abbreviations_count": len(normalizer.abbreviations),
        "abbreviations": normalizer.abbreviations,
        "misspellings_count": len(normalizer.misspellings),
        "misspellings": normalizer.misspellings,
        "unexpanded_acronyms_count": len(normalizer.unexpanded_acronyms),
        "unexpanded_acronyms": sorted(list(normalizer.unexpanded_acronyms))
    }

@router.post("/reindex")
async def reindex_vector_embeddings(db: AsyncSession = Depends(get_db)):
    """Generates dense vector embeddings for all records currently in the database."""
    res = await db.execute(select(MaintenanceRecord))
    records = [r.to_dict() for r in res.scalars().all()]
    
    if not records:
        raise HTTPException(status_code=400, detail="Database contains no records to index.")

    count = embedding_service.build_index(records)
    return {
        "status": "success",
        "records_indexed": count,
        "model": embedding_service.model_name
    }
