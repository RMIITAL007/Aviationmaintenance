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

    async def get_safety_alerts(self, db: AsyncSession):
        """
        Identifies safety-critical and high-priority anomalies from historical logbooks.
        Categorizes events into CRITICAL, HIGH, ELEVATED, and ADVISORY.
        """
        from app.schemas.analytics import SafetyAlertItem, AlertsResponse

        critical_keywords = ["kill", "shutdown", "zero", "flameout", "fire", "0 psi", "smoke"]
        high_keywords = ["crack", "metal", "shaving", "fail", "low compression", "fuel leak"]
        elevated_keywords = ["fell off", "loose", "leak", "intake leak", "foul", "overheat"]
        advisory_keywords = ["stick", "si 388", "wear", "corrosion", "ad "]

        stmt = select(MaintenanceRecord).order_by(MaintenanceRecord.id)
        res = await db.execute(stmt)
        all_records = res.scalars().all()

        alerts: List[SafetyAlertItem] = []
        for r in all_records:
            prob = r.problem_raw.lower() if r.problem_raw else ""
            severity = None
            title = ""
            trigger = ""

            if any(k in prob for k in critical_keywords):
                severity = "CRITICAL"
                title = f"Engine / Flight Safety Critical Discrepancy"
                trigger = "Engine shutdown / Zero pressure / Flight-safety keyword detected"
            elif any(k in prob for k in high_keywords):
                severity = "HIGH"
                title = f"Structural / Internal Engine Integrity Fault"
                trigger = "Cracking, metal contamination, or severe compression loss detected"
            elif any(k in prob for k in elevated_keywords):
                severity = "ELEVATED"
                title = f"Component Separation / High Severity Fluid Leak"
                trigger = "Hardware separation or recurrent leakage anomaly detected"
            elif any(k in prob for k in advisory_keywords):
                severity = "ADVISORY"
                title = f"Service Bulletin / Recurrent Valve Sticking Advisory"
                trigger = "Service Instruction or valve train compliance anomaly detected"

            if severity:
                alerts.append(SafetyAlertItem(
                    id=f"alt_{r.ident}",
                    ident=r.ident,
                    title=title,
                    severity=severity,
                    component=r.component_tag or "ENGINE",
                    problem=r.problem_raw,
                    action=r.action_raw,
                    trigger_condition=trigger,
                    timestamp=r.created_at.isoformat() if r.created_at else "2026-10-22T05:00:00Z"
                ))

        # Sort so CRITICAL is first, then HIGH, then ELEVATED, then ADVISORY
        severity_order = {"CRITICAL": 0, "HIGH": 1, "ELEVATED": 2, "ADVISORY": 3}
        alerts.sort(key=lambda a: severity_order.get(a.severity, 4))

        crit_cnt = sum(1 for a in alerts if a.severity == "CRITICAL")
        high_cnt = sum(1 for a in alerts if a.severity == "HIGH")
        elev_cnt = sum(1 for a in alerts if a.severity == "ELEVATED")
        adv_cnt = sum(1 for a in alerts if a.severity == "ADVISORY")

        return AlertsResponse(
            total_alerts=len(alerts),
            critical_count=crit_cnt,
            high_count=high_cnt,
            elevated_count=elev_cnt,
            advisory_count=adv_cnt,
            alerts=alerts[:50]  # Return top 50 prioritized safety anomalies
        )

    async def compare_subsystems(self, db: AsyncSession, components: List[str]):
        """
        Calculates side-by-side comparative metrics across requested subsystems.
        """
        from app.schemas.analytics import SubsystemComparisonItem, SubsystemComparisonResponse

        total_res = await db.execute(select(func.count(MaintenanceRecord.id)))
        total_records = total_res.scalar() or 1

        comparisons: List[SubsystemComparisonItem] = []
        for comp in components:
            clean_comp = comp.strip().upper()
            if not clean_comp:
                continue

            # Total records for component matching tag or keyword
            cnt_res = await db.execute(
                select(func.count(MaintenanceRecord.id)).where(MaintenanceRecord.component_tag.ilike(f"%{clean_comp}%"))
            )
            comp_cnt = cnt_res.scalar() or 0

            # Action breakdown for component
            act_stmt = (
                select(MaintenanceRecord.action_type, func.count(MaintenanceRecord.id).label("cnt"))
                .where(MaintenanceRecord.component_tag.ilike(f"%{clean_comp}%"))
                .group_by(MaintenanceRecord.action_type)
                .order_by(desc("cnt"))
            )
            act_res = await db.execute(act_stmt)
            act_rows = act_res.all()

            action_breakdown: List[ActionTypeMetric] = []
            top_action = "N/A"
            for act, cnt in act_rows:
                if act:
                    if top_action == "N/A":
                        top_action = act
                    pct = round((cnt / comp_cnt * 100), 1) if comp_cnt > 0 else 0.0
                    action_breakdown.append(ActionTypeMetric(action_type=act, count=cnt, percentage=pct))

            # Sample records
            sample_res = await db.execute(
                select(MaintenanceRecord).where(MaintenanceRecord.component_tag.ilike(f"%{clean_comp}%")).limit(3)
            )
            sample_records = [r.to_dict() for r in sample_res.scalars().all()]

            comparisons.append(SubsystemComparisonItem(
                component=clean_comp,
                total_records=comp_cnt,
                share_percentage=round((comp_cnt / total_records * 100), 1),
                top_action=top_action,
                action_breakdown=action_breakdown[:5],
                sample_records=sample_records
            ))

        return SubsystemComparisonResponse(
            selected_components=components,
            comparisons=comparisons
        )

analytics_service = AnalyticsService()

