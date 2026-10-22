from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.search import SearchRequest, SearchResponse, SearchResultItem
from app.services.retrieval import retrieval_service

router = APIRouter(prefix="/search", tags=["Search"])

@router.post("/hybrid", response_model=SearchResponse)
async def hybrid_search_endpoint(
    request: SearchRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Executes hybrid retrieval combining BM25 keyword matching and dense vector embeddings
    using Reciprocal Rank Fusion (RRF).
    """
    return await retrieval_service.hybrid_search(
        query=request.query,
        db=db,
        component=request.component,
        top_k=request.top_k,
        dense_weight=request.dense_weight,
        lexical_weight=request.lexical_weight
    )

@router.post("/lexical", response_model=SearchResponse)
async def lexical_search_endpoint(
    request: SearchRequest,
    db: AsyncSession = Depends(get_db)
):
    """Executes keyword-only search over problem and action text."""
    results = await retrieval_service.lexical_search(
        query=request.query,
        db=db,
        component=request.component,
        top_k=request.top_k
    )
    items = []
    for item in results:
        rec = item["record"]
        items.append(
            SearchResultItem(
                ident=rec.ident,
                problem=rec.problem_raw,
                action=rec.action_raw,
                combined_clean=rec.combined_clean,
                component_tag=rec.component_tag,
                action_type=rec.action_type,
                score=round(item["lexical_score"], 2),
                lexical_score=round(item["lexical_score"], 2),
                match_reasons=[f"Token match: {', '.join(item.get('matching_tokens', []))}"]
            )
        )
    return SearchResponse(query=request.query, mode="lexical", total_hits=len(items), results=items)

@router.post("/semantic", response_model=SearchResponse)
async def semantic_search_endpoint(
    request: SearchRequest,
    db: AsyncSession = Depends(get_db)
):
    """Executes dense vector semantic search using SentenceTransformer embeddings."""
    results = await retrieval_service.semantic_search(
        query=request.query,
        db=db,
        component=request.component,
        top_k=request.top_k
    )
    items = []
    for item in results:
        rec = item["record"]
        score = item["dense_score"]
        items.append(
            SearchResultItem(
                ident=rec.ident,
                problem=rec.problem_raw,
                action=rec.action_raw,
                combined_clean=rec.combined_clean,
                component_tag=rec.component_tag,
                action_type=rec.action_type,
                score=round(score * 100, 2),
                dense_score=round(score, 3),
                match_reasons=[f"Vector similarity: {score:.3f}"]
            )
        )
    return SearchResponse(query=request.query, mode="semantic", total_hits=len(items), results=items)
