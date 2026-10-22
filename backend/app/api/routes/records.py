import math
from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, desc, asc

from app.core.database import get_db
from app.models.record import MaintenanceRecord
from app.schemas.record import (
    RecordResponse,
    RecordListResponse,
    ComponentListResponse,
    ActionTypeListResponse
)

router = APIRouter(prefix="/records", tags=["Records"])

@router.get("", response_model=RecordListResponse)
async def list_records(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(25, ge=1, le=100, description="Page size"),
    query: Optional[str] = Query(None, description="Search term in IDENT, problem, or action"),
    component: Optional[str] = Query(None, description="Filter by component subsystem"),
    action_type: Optional[str] = Query(None, description="Filter by maintenance action type"),
    sort_by: str = Query("ident", description="Field to sort by ('ident', 'id', 'created_at')"),
    sort_order: str = Query("asc", description="Sort order ('asc', 'desc')"),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(MaintenanceRecord)
    count_stmt = select(func.count(MaintenanceRecord.id))

    filters = []
    if component and component != "ALL":
        filters.append(MaintenanceRecord.component_tag == component)
    if action_type and action_type != "ALL":
        filters.append(MaintenanceRecord.action_type == action_type)
    if query and query.strip():
        q_term = query.strip()
        search_filter = or_(
            MaintenanceRecord.ident.ilike(f"%{q_term}%"),
            MaintenanceRecord.problem_raw.ilike(f"%{q_term}%"),
            MaintenanceRecord.action_raw.ilike(f"%{q_term}%"),
            MaintenanceRecord.combined_clean.ilike(f"%{q_term}%")
        )
        filters.append(search_filter)

    if filters:
        stmt = stmt.where(*filters)
        count_stmt = count_stmt.where(*filters)

    # Total count
    total_res = await db.execute(count_stmt)
    total = total_res.scalar() or 0

    # Sorting
    sort_col = getattr(MaintenanceRecord, sort_by, MaintenanceRecord.id)
    if sort_order.lower() == "desc":
        stmt = stmt.order_by(desc(sort_col))
    else:
        stmt = stmt.order_by(asc(sort_col))

    # Pagination
    offset = (page - 1) * page_size
    stmt = stmt.offset(offset).limit(page_size)

    result = await db.execute(stmt)
    records = result.scalars().all()

    items = [
        RecordResponse(
            id=r.id,
            ident=r.ident,
            problem=r.problem_raw,
            action=r.action_raw,
            problem_clean=r.problem_clean,
            action_clean=r.action_clean,
            combined_clean=r.combined_clean,
            component_tag=r.component_tag,
            action_type=r.action_type,
            performed_edit=r.performed_edit,
            source_filename=r.source_filename,
            created_at=r.created_at.isoformat() if r.created_at else None
        )
        for r in records
    ]

    total_pages = math.ceil(total / page_size) if page_size > 0 else 1

    return RecordListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.get("/components/list", response_model=ComponentListResponse)
async def list_components(db: AsyncSession = Depends(get_db)):
    stmt = select(MaintenanceRecord.component_tag).distinct().order_by(MaintenanceRecord.component_tag)
    res = await db.execute(stmt)
    components = [c for c in res.scalars().all() if c]
    return ComponentListResponse(components=components)

@router.get("/actions/list", response_model=ActionTypeListResponse)
async def list_action_types(db: AsyncSession = Depends(get_db)):
    stmt = select(MaintenanceRecord.action_type).distinct().order_by(MaintenanceRecord.action_type)
    res = await db.execute(stmt)
    action_types = [a for a in res.scalars().all() if a]
    return ActionTypeListResponse(action_types=action_types)

@router.get("/{ident}", response_model=RecordResponse)
async def get_record_detail(ident: str, db: AsyncSession = Depends(get_db)):
    stmt = select(MaintenanceRecord).where(MaintenanceRecord.ident == ident)
    res = await db.execute(stmt)
    record = res.scalar_one_or_none()

    if not record:
        raise HTTPException(status_code=404, detail=f"Maintenance record #{ident} not found")

    return RecordResponse(
        id=record.id,
        ident=record.ident,
        problem=record.problem_raw,
        action=record.action_raw,
        problem_clean=record.problem_clean,
        action_clean=record.action_clean,
        combined_clean=record.combined_clean,
        component_tag=record.component_tag,
        action_type=record.action_type,
        performed_edit=record.performed_edit,
        source_filename=record.source_filename,
        created_at=record.created_at.isoformat() if record.created_at else None
    )
