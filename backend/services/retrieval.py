import numpy as np
from typing import List, Dict, Any
from rank_bm25 import BM25Okapi
from sentence_transformers import SentenceTransformer, CrossEncoder
import faiss

class RetrievalService:
    _model = None
    _reranker = None

    @classmethod
    def get_model(cls):
        if cls._model is None:
            # Using a small, fast local model
            cls._model = SentenceTransformer('all-MiniLM-L6-v2')
        return cls._model

    @classmethod
    def get_reranker(cls):
        if cls._reranker is None:
            # Cross-encoder for high-precision reranking
            cls._reranker = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')
        return cls._reranker

    @staticmethod
    def bm25_search(query: str, chunks: List[Dict[str, Any]], k: int = 5) -> List[Dict[str, Any]]:
        """Performs keyword search using BM25."""
        if not chunks:
            return []
            
        tokenized_corpus = [chunk["content"].lower().split() for chunk in chunks]
        bm25 = BM25Okapi(tokenized_corpus)
        
        tokenized_query = query.lower().split()
        scores = bm25.get_scores(tokenized_query)
        
        # Sort chunks by score
        scored_chunks = []
        for i, score in enumerate(scores):
            # Create a copy to avoid mutating the original until we return
            chunk_copy = chunks[i].copy()
            chunk_copy["retrieval_score"] = float(score)
            scored_chunks.append(chunk_copy)
            
        scored_chunks.sort(key=lambda x: x["retrieval_score"], reverse=True)
        return scored_chunks[:k]

    @classmethod
    def vector_search(cls, query: str, chunks: List[Dict[str, Any]], k: int = 5) -> List[Dict[str, Any]]:
        """Performs semantic search using SentenceTransformers and FAISS."""
        if not chunks:
            return []
            
        model = cls.get_model()
        
        # 1. Generate embeddings for chunks
        chunk_texts = [chunk["content"] for chunk in chunks]
        chunk_embeddings = model.encode(chunk_texts)
        
        # 2. Setup FAISS index
        dimension = chunk_embeddings.shape[1]
        index = faiss.IndexFlatL2(dimension)
        index.add(np.array(chunk_embeddings).astype('float32'))
        
        # 3. Search
        query_embedding = model.encode([query])
        distances, indices = index.search(np.array(query_embedding).astype('float32'), k)
        
        results = []
        for i, idx in enumerate(indices[0]):
            if idx != -1 and idx < len(chunks):
                chunk = chunks[int(idx)].copy()
                chunk["retrieval_score"] = float(1 / (1 + distances[0][i])) # Normalize L2 distance to a 0-1 score
                results.append(chunk)
                
        return results

    @classmethod
    def hybrid_search(cls, query: str, chunks: List[Dict[str, Any]], k: int = 5) -> List[Dict[str, Any]]:
        """Combines BM25 and Vector search using Reciprocal Rank Fusion (RRF)."""
        if not chunks:
            return []

        # 1. Get results from both methods (get more than K to allow for overlap)
        bm25_results = cls.bm25_search(query, chunks, k=max(k*2, 20))
        vector_results = cls.vector_search(query, chunks, k=max(k*2, 20))

        # 2. Apply RRF
        # RRF Score = sum(1 / (60 + rank))
        rrf_constant = 60
        rrf_scores = {} # index -> score
        
        for rank, res in enumerate(bm25_results, 1):
            idx = res["index"]
            rrf_scores[idx] = rrf_scores.get(idx, 0) + (1.0 / (rrf_constant + rank))
            
        for rank, res in enumerate(vector_results, 1):
            idx = res["index"]
            rrf_scores[idx] = rrf_scores.get(idx, 0) + (1.0 / (rrf_constant + rank))

        # 3. Sort by RRF score
        sorted_indices = sorted(rrf_scores.items(), key=lambda x: x[1], reverse=True)
        
        # 4. Construct final results
        results = []
        for idx, score in sorted_indices[:k]:
            chunk = chunks[idx].copy()
            chunk["retrieval_score"] = float(score)
            results.append(chunk)
            
        return results

    @classmethod
    def rerank(cls, query: str, chunks: List[Dict[str, Any]], k: int = 5) -> List[Dict[str, Any]]:
        """Reranks retrieved chunks using a Cross-Encoder for higher accuracy."""
        if not chunks:
            return []

        reranker = cls.get_reranker()
        
        # Prepare pairs for cross-encoder
        pairs = [[query, chunk["content"]] for chunk in chunks]
        
        # Get relevance scores
        scores = reranker.predict(pairs)
        
        # Update chunks with rerank scores
        for i, score in enumerate(scores):
            chunks[i]["retrieval_score"] = float(score)
            
        # Sort by score
        chunks.sort(key=lambda x: x["retrieval_score"], reverse=True)
        
        return chunks[:k]
