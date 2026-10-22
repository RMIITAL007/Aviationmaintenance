from typing import List, Optional
from pydantic import BaseModel, Field

class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, description="Search terms in natural language or technical jargon")
    component: Optional[str] = Field(None, description="Optional component subsystem filter")
    top_k: int = Field(5, ge=1, le=50, description="Number of results to retrieve")
    dense_weight: float = Field(0.6, ge=0.0, le=1.0, description="Weight for semantic vector score")
    lexical_weight: float = Field(0.4, ge=0.0, le=1.0, description="Weight for keyword lexical score")

class SearchResultItem(BaseModel):
    ident: str
    problem: str
    action: str
    combined_clean: Optional[str] = None
    component_tag: Optional[str] = None
    action_type: Optional[str] = None
    score: float = Field(..., description="Combined relevance score")
    dense_score: Optional[float] = None
    lexical_score: Optional[float] = None
    match_reasons: List[str] = Field(default_factory=list)

class SearchResponse(BaseModel):
    query: str
    mode: str = "hybrid"  # "hybrid", "semantic", "lexical"
    total_hits: int
    results: List[SearchResultItem]
