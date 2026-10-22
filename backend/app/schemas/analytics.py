from typing import List, Optional
from pydantic import BaseModel, Field

class ComponentMetric(BaseModel):
    component: str
    count: int
    percentage: float

class ActionTypeMetric(BaseModel):
    action_type: str
    count: int
    percentage: float

class IngestionStatusResponse(BaseModel):
    is_ingested: bool
    total_records: int
    source_files: List[str]
    last_ingested_at: Optional[str]
    vector_indexed: bool
    vector_count: int

class AnalyticsOverviewResponse(BaseModel):
    total_records: int
    unique_components: int
    unique_actions: int
    top_components: List[ComponentMetric]
    top_action_types: List[ActionTypeMetric]
    recent_records: List[dict] = Field(default_factory=list)
    ingestion_summary: IngestionStatusResponse
    disclaimer: str

class SafetyAlertItem(BaseModel):
    id: str
    ident: str
    title: str
    severity: str  # "CRITICAL", "HIGH", "ELEVATED", "ADVISORY"
    component: str
    problem: str
    action: str
    trigger_condition: str
    timestamp: str

class AlertsResponse(BaseModel):
    total_alerts: int
    critical_count: int
    high_count: int
    elevated_count: int
    advisory_count: int
    alerts: List[SafetyAlertItem]

class SubsystemComparisonItem(BaseModel):
    component: str
    total_records: int
    share_percentage: float
    top_action: str
    action_breakdown: List[ActionTypeMetric]
    sample_records: List[dict] = Field(default_factory=list)

class SubsystemComparisonResponse(BaseModel):
    selected_components: List[str]
    comparisons: List[SubsystemComparisonItem]

