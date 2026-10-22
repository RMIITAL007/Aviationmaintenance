from typing import Dict, Any, List
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.record import MaintenanceRecord
from app.services.ingestion import ingestion_service
from app.services.embedding import embedding_service
from app.schemas.analytics import (
    AnalyticsOverviewResponse,
    ComponentMetric,
    ActionTypeMetric,
    IngestionStatusResponse
)

DISCLAIMER_TEXT = (
    "Descriptive historical statistics compiled from ingested aviation maintenance logbooks. "
    "These distributions reflect historical reporting frequencies and do not constitute "
    "predictive reliability models, failure rate forecasts, or airworthiness determinations."
)

class AnalyticsService:
    async def get_overview(self, db: AsyncSession) -> AnalyticsOverviewResponse:
        # Total count
        total_res = await db.execute(select(func.count(MaintenanceRecord.id)))
        total_records = total_res.scalar() or 0

        # Component breakdown
        comp_stmt = (
            select(
                MaintenanceRecord.component_tag,
                func.count(MaintenanceRecord.id).label("cnt")
            )
            .group_by(MaintenanceRecord.component_tag)
            .order_by(desc("cnt"))
        )
        comp_res = await db.execute(comp_stmt)
        comp_rows = comp_res.all()

        top_components: List[ComponentMetric] = []
        for tag, count in comp_rows:
            if tag:
                pct = round((count / total_records * 100), 1) if total_records > 0 else 0.0
                top_components.append(ComponentMetric(component=tag, count=count, percentage=pct))

        # Action type breakdown
        act_stmt = (
            select(
                MaintenanceRecord.action_type,
                func.count(MaintenanceRecord.id).label("cnt")
            )
            .group_by(MaintenanceRecord.action_type)
            .order_by(desc("cnt"))
        )
        act_res = await db.execute(act_stmt)
        act_rows = act_res.all()

        top_actions: List[ActionTypeMetric] = []
        for act, count in act_rows:
            if act:
                pct = round((count / total_records * 100), 1) if total_records > 0 else 0.0
                top_actions.append(ActionTypeMetric(action_type=act, count=count, percentage=pct))

        # Recent 5 records
        recent_stmt = select(MaintenanceRecord).order_by(desc(MaintenanceRecord.id)).limit(5)
        recent_res = await db.execute(recent_stmt)
        recent_records = [r.to_dict() for r in recent_res.scalars().all()]

        # Ingestion status
        ingest_status = await ingestion_service.get_ingestion_status(db)
        ingest_status["vector_indexed"] = embedding_service.is_indexed()
        ingest_status["vector_count"] = embedding_service.get_indexed_count()

        return AnalyticsOverviewResponse(
            total_records=total_records,
            unique_components=len(top_components),
            unique_actions=len(top_actions),
            top_components=top_components[:8],
            top_action_types=top_actions[:6],
            recent_records=recent_records,
            ingestion_summary=IngestionStatusResponse(**ingest_status),
            disclaimer=DISCLAIMER_TEXT
        )

analytics_service = AnalyticsService()
