from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class EvaluationRunRequest(BaseModel):
    top_k: int = Field(5, ge=1, le=10)
    run_llm_answers: bool = Field(True, description="Evaluate generation correctness in addition to retrieval")

class TestCaseResult(BaseModel):
    id: str
    query: str
    query_type: str
    expected_idents: List[str]
    retrieved_idents: List[str]
    recall_hit: bool
    reciprocal_rank: float
    generated_answer: Optional[str] = None
    cited_idents: List[str] = Field(default_factory=list)
    citations_valid: bool = True
    citation_precision: float = 1.0
    latency_ms: float

class EvaluationMetrics(BaseModel):
    recall_at_1: float
    recall_at_3: float
    recall_at_5: float
    mean_reciprocal_rank: float
    citation_precision: float
    citation_validity: float
    avg_retrieval_latency_ms: float
    avg_total_latency_ms: float

class EvaluationReportResponse(BaseModel):
    run_id: str
    timestamp: str
    num_test_cases: int
    metrics: EvaluationMetrics
    results: List[TestCaseResult]
    evaluated_model: str
    embedding_model: str
