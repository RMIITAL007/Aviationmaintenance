import pytest
from app.services.citation import citation_service
from app.services.agent import agent_orchestrator
from app.schemas.search import SearchResultItem

def test_extract_cited_idents():
    text = "Actions in [Rec #100001] and [Rec #100002] resolved the issue [100003]."
    cited = citation_service.extract_cited_idents(text)
    assert cited == ["100001", "100002", "100003"]

def test_build_citations_grounded():
    evidence = [
        SearchResultItem(
            ident="100001",
            problem="ENGINE IDLE OVERRIDE KILLED ENGINE.",
            action="TRIED TO ADJUST IDLE SEVERAL TIMES.",
            score=10.0
        ),
        SearchResultItem(
            ident="100002",
            problem="ENGINE IDLE OVERRIDE KILLED ENGINE.",
            action="REMOVED & REPLACED FUEL SERVO",
            score=9.5
        )
    ]
    answer = "Adjusted idle [Rec #100001] and replaced servo [Rec #100002]."
    citations, std_text = citation_service.build_citations(answer, evidence)
    assert len(citations) == 2
    assert citations[0].ident == "100001"
    assert citations[0].verified is True
    assert citations[1].ident == "100002"
    assert citations[1].verified is True

def test_build_citations_phantom_detection():
    # Model hallucinated 999999 which is not in evidence
    evidence = [
        SearchResultItem(
            ident="100001",
            problem="ENGINE IDLE OVERRIDE KILLED ENGINE.",
            action="TRIED TO ADJUST IDLE SEVERAL TIMES.",
            score=10.0
        )
    ]
    answer = "Replaced fuel servo [Rec #999999]."
    citations, std_text = citation_service.build_citations(answer, evidence)
    assert len(citations) == 1
    assert citations[0].ident == "999999"
    assert citations[0].verified is False

def test_agent_classify_intent():
    assert agent_orchestrator.classify_intent("Show details for record 100004") == "DIRECT_LOOKUP"
    assert agent_orchestrator.classify_intent("Compare repairs for intake leaks versus baffle cracks") == "RECORD_COMPARISON"
    assert agent_orchestrator.classify_intent("What causes #3 cylinder exhaust valve sticking?") == "SIMILAR_FAULT_SEARCH"
    assert agent_orchestrator.classify_intent("hello") == "CLARIFICATION_REQUIRED"
