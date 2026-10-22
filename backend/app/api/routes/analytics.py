from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.analytics import AnalyticsOverviewResponse
from app.services.analytics import analytics_service

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/overview", response_model=AnalyticsOverviewResponse)
async def get_analytics_overview(db: AsyncSession = Depends(get_db)):
    """
    Returns fleet maintenance statistics, top failing components, and maintenance action distributions.
    Clearly states that figures are descriptive historical records, not predictive forecasts.
    """
    return await analytics_service.get_overview(db)
