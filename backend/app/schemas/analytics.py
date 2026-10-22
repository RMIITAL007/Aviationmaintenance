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
