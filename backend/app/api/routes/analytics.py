from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.core.database import get_db
from app.schemas.analytics import (
    AnalyticsOverviewResponse,
    AlertsResponse,
    SubsystemComparisonResponse
)
from app.services.analytics import analytics_service

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/overview", response_model=AnalyticsOverviewResponse)
async def get_analytics_overview(db: AsyncSession = Depends(get_db)):
    """
    Returns fleet maintenance statistics, top failing components, and maintenance action distributions.
    Clearly states that figures are descriptive historical records, not predictive forecasts.
    """
    return await analytics_service.get_overview(db)

@router.get("/alerts", response_model=AlertsResponse)
async def get_safety_alerts(db: AsyncSession = Depends(get_db)):
    """
    Returns prioritized safety-critical discrepancies and operational anomalies
    derived from historical maintenance logbooks.
    """
    return await analytics_service.get_safety_alerts(db)

@router.get("/compare", response_model=SubsystemComparisonResponse)
async def compare_subsystems(
    components: str = Query("CYLINDER,BAFFLE,MAGNETO,EXHAUST", description="Comma-separated list of component tags to compare"),
    db: AsyncSession = Depends(get_db)
):
    """
    Provides side-by-side comparative analysis of failure frequencies,
    remedy distributions, and fault patterns across aircraft subsystems.
    """
    comp_list = [c.strip() for c in components.split(",") if c.strip()]
    return await analytics_service.compare_subsystems(db, comp_list)

