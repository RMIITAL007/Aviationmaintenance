import json
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.core.database import get_db
from app.models.conversation import ChatSession, ChatMessage
from app.schemas.chat import (
    ChatRequest,
    ChatResponse,
    SessionSummary,
    MessageItem,
    CitationItem,
    AgentStepItem
)
from app.services.agent import agent_orchestrator

router = APIRouter(prefix="/chat", tags=["AI Copilot Chat"])

@router.post("", response_model=ChatResponse)
async def chat_turn(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Executes a controlled, tool-using Agentic RAG turn against aviation maintenance records.
    Returns grounded natural-language answer with verified inline citations and expandable sources.
    """
    session_id = request.session_id or str(uuid.uuid4())

    # Ensure session exists
    sess_res = await db.execute(select(ChatSession).where(ChatSession.id == session_id))
    session = sess_res.scalar_one_or_none()
    if not session:
        # Generate initial title from first 6 words of query
        title = " ".join(request.query.split()[:6])
        session = ChatSession(id=session_id, title=title)
        db.add(session)
        await db.flush()

    # Save user message
    user_msg = ChatMessage(
        session_id=session_id,
        role="user",
        content=request.query
    )
    db.add(user_msg)
    await db.flush()

    # Run agentic workflow
    chat_response = await agent_orchestrator.execute_workflow(
        query=request.query,
        session_id=session_id,
        db=db,
        max_steps=request.max_steps or 3,
        temperature=request.temperature or 0.1
    )

    # Save assistant message
    asst_msg = ChatMessage(
        session_id=session_id,
        role="assistant",
        content=chat_response.answer,
        intent=chat_response.intent,
        step_count=chat_response.step_count,
        citations_json=json.dumps([c.model_dump() for c in chat_response.citations]),
        agent_steps_json=json.dumps([s.model_dump() for s in chat_response.agent_steps])
    )
    db.add(asst_msg)
    await db.commit()

    return chat_response

@router.get("/sessions", response_model=List[SessionSummary])
async def list_sessions(db: AsyncSession = Depends(get_db)):
    stmt = select(ChatSession).order_by(desc(ChatSession.updated_at)).limit(20)
    res = await db.execute(stmt)
    sessions = res.scalars().all()
    return [SessionSummary(**s.to_dict()) for s in sessions]

@router.get("/sessions/{session_id}", response_model=List[MessageItem])
async def get_session_history(session_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(ChatMessage).where(ChatMessage.session_id == session_id).order_by(ChatMessage.id)
    res = await db.execute(stmt)
    messages = res.scalars().all()

    items = []
    for m in messages:
        citations = []
        if m.citations_json:
            try:
                citations = [CitationItem(**c) for c in json.loads(m.citations_json)]
            except Exception:
                pass

        agent_steps = []
        if m.agent_steps_json:
            try:
                agent_steps = [AgentStepItem(**s) for s in json.loads(m.agent_steps_json)]
            except Exception:
                pass

        items.append(
            MessageItem(
                id=m.id,
                role=m.role,
                content=m.content,
                intent=m.intent,
                step_count=m.step_count,
                citations=citations,
                agent_steps=agent_steps,
                created_at=m.created_at.isoformat() if m.created_at else None
            )
        )
    return items

@router.delete("/sessions/{session_id}")
async def delete_session(session_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(ChatSession).where(ChatSession.id == session_id)
    res = await db.execute(stmt)
    session = res.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    await db.delete(session)
    await db.commit()
    return {"status": "success", "message": f"Session {session_id} deleted"}
