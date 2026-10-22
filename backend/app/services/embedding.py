import os
import json
import logging
from pathlib import Path
from typing import List, Dict, Any, Tuple, Optional
import numpy as np

from app.core.config import settings

logger = logging.getLogger(__name__)

class EmbeddingService:
    def __init__(self, index_dir: Optional[Path] = None):
        self.index_dir = index_dir or settings.VECTOR_INDEX_DIR
        self.index_dir.mkdir(parents=True, exist_ok=True)
        self.model = None
        self.model_name = settings.EMBEDDING_MODEL_NAME
        self.embeddings: Optional[np.ndarray] = None
        self.idents: List[str] = []
        self.ident_to_index: Dict[str, int] = {}
        self._load_index_from_disk()

    def _get_model(self):
        if self.model is None:
            try:
                from sentence_transformers import SentenceTransformer
                logger.info(f"Loading SentenceTransformer model: {self.model_name}")
                self.model = SentenceTransformer(self.model_name)
            except Exception as e:
                logger.error(f"Failed to load SentenceTransformer: {e}")
                self.model = None
        return self.model

    def _load_index_from_disk(self) -> bool:
        emb_path = self.index_dir / "embeddings.npy"
        meta_path = self.index_dir / "metadata.json"
        if emb_path.exists() and meta_path.exists():
            try:
                self.embeddings = np.load(str(emb_path))
                with open(meta_path, "r", encoding="utf-8") as f:
                    meta = json.load(f)
                    self.idents = meta.get("idents", [])
                    self.ident_to_index = {ident: idx for idx, ident in enumerate(self.idents)}
                logger.info(f"Loaded vector index from disk: {len(self.idents)} records, dim {self.embeddings.shape[1] if self.embeddings is not None else 0}")
                return True
            except Exception as e:
                logger.warning(f"Could not load vector index from disk: {e}")
        return False

    def is_indexed(self) -> bool:
        return self.embeddings is not None and len(self.idents) > 0

    def get_indexed_count(self) -> int:
        return len(self.idents) if self.idents else 0

    def build_index(self, records: List[Dict[str, Any]], batch_size: int = 128) -> int:
        """
        Builds embeddings for all provided records and persists to disk.
        """
        model = self._get_model()
        if not model:
            logger.warning("No embedding model available, falling back to TF-IDF vectorizer")
            return self._build_tfidf_index(records)

        texts = []
        idents = []
        for r in records:
            ident = str(r["ident"])
            clean_text = r.get("combined_clean") or f"{r.get('problem', '')} {r.get('action', '')}".strip()
            # Format text representation for domain-dense representation
            comp = r.get("component_tag") or "GENERAL"
            formatted = f"COMPONENT: {comp}. PROBLEM: {clean_text}"
            texts.append(formatted)
            idents.append(ident)

        if not texts:
            return 0

        logger.info(f"Encoding {len(texts)} maintenance records with {self.model_name}...")
        embeddings = model.encode(
            texts,
            batch_size=batch_size,
            show_progress_bar=False,
            normalize_embeddings=True
        )

        self.embeddings = np.array(embeddings, dtype=np.float32)
        self.idents = idents
        self.ident_to_index = {ident: idx for idx, ident in enumerate(idents)}

        # Persist index
        np.save(str(self.index_dir / "embeddings.npy"), self.embeddings)
        with open(self.index_dir / "metadata.json", "w", encoding="utf-8") as f:
            json.dump({
                "model": self.model_name,
                "count": len(idents),
                "idents": idents
            }, f, indent=2)

        logger.info(f"Vector index built and persisted: {len(idents)} records")
        return len(idents)

    def _build_tfidf_index(self, records: List[Dict[str, Any]]) -> int:
        from sklearn.feature_extraction.text import TfidfVectorizer
        texts = [f"{r.get('problem', '')} {r.get('action', '')}" for r in records]
        self.idents = [str(r["ident"]) for r in records]
        self.ident_to_index = {ident: idx for idx, ident in enumerate(self.idents)}
        
        vectorizer = TfidfVectorizer(max_features=512, ngram_range=(1, 2))
        matrix = vectorizer.fit_transform(texts).toarray()
        # Normalize
        norms = np.linalg.norm(matrix, axis=1, keepdims=True)
        norms[norms == 0] = 1.0
        self.embeddings = np.array(matrix / norms, dtype=np.float32)

        np.save(str(self.index_dir / "embeddings.npy"), self.embeddings)
        with open(self.index_dir / "metadata.json", "w", encoding="utf-8") as f:
            json.dump({"model": "tfidf_fallback", "count": len(self.idents), "idents": self.idents}, f)
        return len(self.idents)

    def search_similar(self, query: str, top_k: int = 10) -> List[Tuple[str, float]]:
        """
        Computes cosine similarity of query against all stored embeddings.
        Returns List of (ident, similarity_score).
        """
        if not self.is_indexed():
            return []

        model = self._get_model()
        if model is not None:
            query_emb = model.encode([query], normalize_embeddings=True)
            q_vec = np.array(query_emb[0], dtype=np.float32)
        else:
            return []

        # Cosine similarity using dot product on normalized vectors
        scores = np.dot(self.embeddings, q_vec)
        top_indices = np.argsort(scores)[::-1][:top_k]

        results = []
        for idx in top_indices:
            score = float(scores[idx])
            ident = self.idents[idx]
            results.append((ident, score))

        return results

embedding_service = EmbeddingService()
