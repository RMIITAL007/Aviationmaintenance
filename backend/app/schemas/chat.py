from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field

class ChatRequest(BaseModel):
    query: str = Field(..., min_length=1, description="Technician inquiry in natural language")
    session_id: Optional[str] = Field(None, description="Conversation session ID for continuity")
    temperature: Optional[float] = Field(0.1, ge=0.0, le=1.0)
    max_steps: Optional[int] = Field(3, ge=1, le=5)

class CitationItem(BaseModel):
    ident: str
    problem: str
    action: str
    excerpt: str
    verified: bool = True

class AgentStepItem(BaseModel):
    step: int
    tool: str
    input_args: Dict[str, Any]
    output_summary: str

class ChatResponse(BaseModel):
    session_id: str
    answer: str
    intent: str
    step_count: int
    agent_steps: List[AgentStepItem] = Field(default_factory=list)
    citations: List[CitationItem] = Field(default_factory=list)
    disclaimer: str
    latency_ms: float

class SessionSummary(BaseModel):
    id: str
    title: str
    created_at: Optional[str]
    updated_at: Optional[str]
    message_count: int

class MessageItem(BaseModel):
    id: int
    role: str
    content: str
    intent: Optional[str]
    step_count: Optional[int]
    citations: List[CitationItem] = Field(default_factory=list)
    agent_steps: List[AgentStepItem] = Field(default_factory=list)
    created_at: Optional[str]
