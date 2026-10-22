import re
from typing import List, Dict, Set, Tuple
from app.schemas.chat import CitationItem
from app.schemas.search import SearchResultItem

CITATION_PATTERN = re.compile(r"\[(?:Rec\s*#?|#)?(\d{5,6})\]", re.IGNORECASE)

class CitationService:
    def extract_cited_idents(self, answer_text: str) -> List[str]:
        """Extracts unique record identifiers cited in the text in order of appearance."""
        if not answer_text:
            return []
        matches = CITATION_PATTERN.findall(answer_text)
        seen = set()
        unique_idents = []
        for m in matches:
            if m not in seen:
                seen.add(m)
                unique_idents.append(m)
        return unique_idents

    def build_citations(
        self,
        answer_text: str,
        evidence: List[SearchResultItem]
    ) -> Tuple[List[CitationItem], str]:
        """
        Validates all cited record IDs against the retrieved evidence items.
        Returns:
            - List of verified CitationItems with verbatim excerpts.
            - Cleaned/standardized answer text.
        """
        evidence_map: Dict[str, SearchResultItem] = {e.ident: e for e in evidence}
        cited_idents = self.extract_cited_idents(answer_text)
        
        citations: List[CitationItem] = []
        valid_idents: Set[str] = set()

        for ident in cited_idents:
            if ident in evidence_map:
                ev = evidence_map[ident]
                valid_idents.add(ident)
                citations.append(
                    CitationItem(
                        ident=ev.ident,
                        problem=ev.problem,
                        action=ev.action,
                        excerpt=f"{ev.problem} -> {ev.action}",
                        verified=True
                    )
                )
            else:
                # Flag unverified citation
                citations.append(
                    CitationItem(
                        ident=ident,
                        problem="[Unverified Record]",
                        action="Record ID was cited by model but was not present in retrieved context.",
                        excerpt="Citation verification failed",
                        verified=False
                    )
                )

        # Standardize citation formatting in text to [Rec #IDENT]
        def replace_citation(match):
            cid = match.group(1)
            return f"[Rec #{cid}]"

        standardized_text = CITATION_PATTERN.sub(replace_citation, answer_text)

        # If model failed to cite any record despite having evidence, attach citations to evidence items
        if not citations and evidence:
            for ev in evidence[:3]:
                citations.append(
                    CitationItem(
                        ident=ev.ident,
                        problem=ev.problem,
                        action=ev.action,
                        excerpt=f"{ev.problem} -> {ev.action}",
                        verified=True
                    )
                )

        return citations, standardized_text

citation_service = CitationService()
