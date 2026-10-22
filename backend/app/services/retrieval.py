import re
from typing import List, Dict, Any, Optional
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.record import MaintenanceRecord
from app.services.embedding import embedding_service
from app.services.normalizer import normalizer
from app.schemas.search import SearchResultItem, SearchResponse

class RetrievalService:
    def __init__(self):
        pass

    async def lexical_search(
        self,
        query: str,
        db: AsyncSession,
        component: Optional[str] = None,
        top_k: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Token-based lexical matching over problem, action, and combined clean text.
        """
        clean_q = normalizer.normalize_whitespace(query)
        if not clean_q:
            return []

        # Tokenize query into alphanumeric words, ignoring 1-letter stop noise
        tokens = [w for w in re.findall(r"\b\w+\b", clean_q.upper()) if len(w) > 1 or w.isdigit()]
        if not tokens:
            tokens = [clean_q.upper()]

        filters = []
        if component and component != "ALL":
            filters.append(MaintenanceRecord.component_tag == component)

        # Build OR conditions for tokens across fields
        token_conditions = []
        for t in tokens[:6]:  # Limit token clauses
            token_conditions.append(MaintenanceRecord.problem_clean.ilike(f"%{t}%"))
            token_conditions.append(MaintenanceRecord.action_clean.ilike(f"%{t}%"))
            token_conditions.append(MaintenanceRecord.ident == t)

        stmt = select(MaintenanceRecord)
        if filters:
            stmt = stmt.where(*filters)
        if token_conditions:
            stmt = stmt.where(or_(*token_conditions))

        stmt = stmt.limit(max(top_k * 3, 50))
        result = await db.execute(stmt)
        candidates = result.scalars().all()

        # Score candidates by token overlap count
        scored_candidates = []
        q_token_set = set(tokens)
        for rec in candidates:
            text_tokens = set(re.findall(r"\b\w+\b", f"{rec.problem_clean} {rec.action_clean} {rec.ident}".upper()))
            overlap = len(q_token_set.intersection(text_tokens))
            exact_phrase_bonus = 3.0 if clean_q.upper() in rec.combined_clean.upper() else 0.0
            ident_match_bonus = 5.0 if clean_q == rec.ident else 0.0
            
            score = float(overlap) + exact_phrase_bonus + ident_match_bonus
            scored_candidates.append((rec, score))

        scored_candidates.sort(key=lambda x: x[1], reverse=True)

        results = []
        for rank, (rec, score) in enumerate(scored_candidates[:top_k], start=1):
            matching_tokens = list(q_token_set.intersection(set(re.findall(r"\b\w+\b", rec.combined_clean.upper()))))
            results.append({
                "record": rec,
                "lexical_score": score,
                "lexical_rank": rank,
                "matching_tokens": matching_tokens
            })
        return results

    async def semantic_search(
        self,
        query: str,
        db: AsyncSession,
        component: Optional[str] = None,
        top_k: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Dense vector semantic search using SentenceTransformer embeddings.
        """
        if not embedding_service.is_indexed():
            return []

        # Retrieve more candidates if component filtering is active
        fetch_k = top_k * 4 if component and component != "ALL" else top_k
        similar_items = embedding_service.search_similar(query, top_k=fetch_k)

        if not similar_items:
            return []

        ident_score_map = {ident: score for ident, score in similar_items}
        idents_to_fetch = list(ident_score_map.keys())

        stmt = select(MaintenanceRecord).where(MaintenanceRecord.ident.in_(idents_to_fetch))
        if component and component != "ALL":
            stmt = stmt.where(MaintenanceRecord.component_tag == component)

        db_res = await db.execute(stmt)
        records = db_res.scalars().all()

        results = []
        for rec in records:
            score = ident_score_map.get(rec.ident, 0.0)
            results.append({
                "record": rec,
                "dense_score": score
            })

        results.sort(key=lambda x: x["dense_score"], reverse=True)
        return results[:top_k]

    async def hybrid_search(
        self,
        query: str,
        db: AsyncSession,
        component: Optional[str] = None,
        top_k: int = 5,
        dense_weight: float = 0.6,
        lexical_weight: float = 0.4
    ) -> SearchResponse:
        """
        Hybrid search combining Lexical and Semantic vector retrieval using
        Reciprocal Rank Fusion (RRF) and normalized linear combination.
        """
        clean_q = normalizer.normalize_whitespace(query)
        if not clean_q:
            return SearchResponse(query=query, mode="hybrid", total_hits=0, results=[])

        # Step 1: Execute both lexical and semantic searches
        lexical_results = await self.lexical_search(clean_q, db, component=component, top_k=top_k * 3)
        semantic_results = await self.semantic_search(clean_q, db, component=component, top_k=top_k * 3)

        # Step 2: Combine candidates and compute RRF scores
        # RRF formula: score(d) = sum( 1 / (k + rank) )
        RRF_K = 60.0
        combined_records: Dict[str, MaintenanceRecord] = {}
        rrf_scores: Dict[str, float] = {}
        dense_scores: Dict[str, float] = {}
        lexical_scores: Dict[str, float] = {}
        reasons_map: Dict[str, List[str]] = {}

        for rank, item in enumerate(lexical_results, start=1):
            rec = item["record"]
            ident = rec.ident
            combined_records[ident] = rec
            lex_score = item["lexical_score"]
            lexical_scores[ident] = lex_score
            rrf_scores[ident] = rrf_scores.get(ident, 0.0) + lexical_weight * (1.0 / (RRF_K + rank))
            
            matched = item.get("matching_tokens", [])
            if matched:
                reasons_map.setdefault(ident, []).append(f"Keyword match: {', '.join(matched[:4])}")

        for rank, item in enumerate(semantic_results, start=1):
            rec = item["record"]
            ident = rec.ident
            combined_records[ident] = rec
            dense_score = item["dense_score"]
            dense_scores[ident] = dense_score
            rrf_scores[ident] = rrf_scores.get(ident, 0.0) + dense_weight * (1.0 / (RRF_K + rank))
            
            if dense_score > 0.4:
                reasons_map.setdefault(ident, []).append(f"Semantic similarity: {dense_score:.2f}")

        # Sort by composite RRF score
        sorted_idents = sorted(rrf_scores.keys(), key=lambda x: rrf_scores[x], reverse=True)
        top_candidates = sorted_idents[:top_k]

        result_items = []
        for ident in top_candidates:
            rec = combined_records[ident]
            final_score = rrf_scores[ident]
            reasons = reasons_map.get(ident, ["Relevant match"])

            result_items.append(
                SearchResultItem(
                    ident=rec.ident,
                    problem=rec.problem_raw,
                    action=rec.action_raw,
                    combined_clean=rec.combined_clean,
                    component_tag=rec.component_tag,
                    action_type=rec.action_type,
                    score=round(final_score * 100, 3),
                    dense_score=round(dense_scores.get(ident, 0.0), 3) if ident in dense_scores else None,
                    lexical_score=round(lexical_scores.get(ident, 0.0), 2) if ident in lexical_scores else None,
                    match_reasons=reasons
                )
            )

        return SearchResponse(
            query=clean_q,
            mode="hybrid",
            total_hits=len(combined_records),
            results=result_items
        )

retrieval_service = RetrievalService()
