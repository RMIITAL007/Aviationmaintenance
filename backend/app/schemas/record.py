from typing import List, Optional
from pydantic import BaseModel, Field

class RecordResponse(BaseModel):
    id: int
    ident: str
    problem: str
    action: str
    problem_clean: Optional[str] = None
    action_clean: Optional[str] = None
    combined_clean: Optional[str] = None
    component_tag: Optional[str] = None
    action_type: Optional[str] = None
    performed_edit: Optional[str] = None
    source_filename: str
    created_at: Optional[str] = None

class RecordListResponse(BaseModel):
    items: List[RecordResponse]
    total: int
    page: int
    page_size: int
    total_pages: int

class ComponentListResponse(BaseModel):
    components: List[str]

class ActionTypeListResponse(BaseModel):
    action_types: List[str]
