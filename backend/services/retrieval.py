import numpy as np
from typing import List, Dict, Any
from rank_bm25 import BM25Okapi
from langchain_openai import OpenAIEmbeddings
import os

class RetrievalService:
    _embedding_model = None

    @classmethod
    def get_embedding_model(cls):
        if cls._embedding_model is None:
            # Check for API key
            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                raise ValueError("OPENAI_API_KEY is not set in the environment.")
            
            # Using OpenAI embeddings to save local memory
            cls._embedding_model = OpenAIEmbeddings(model="text-embedding-3-small")
        return cls._embedding_model

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
            chunk_copy = chunks[i].copy()
            chunk_copy["retrieval_score"] = float(score)
            scored_chunks.append(chunk_copy)
            
        scored_chunks.sort(key=lambda x: x["retrieval_score"], reverse=True)
        return scored_chunks[:k]

    @classmethod
    def vector_search(cls, query: str, chunks: List[Dict[str, Any]], k: int = 5) -> List[Dict[str, Any]]:
        """Performs semantic search using OpenAI Embeddings and Cosine Similarity."""
        if not chunks:
            return []
            
        embed_model = cls.get_embedding_model()
        
        # 1. Generate embeddings for chunks (in a real app, you'd cache these)
        chunk_texts = [chunk["content"] for chunk in chunks]
        chunk_embeddings = embed_model.embed_documents(chunk_texts)
        
        # 2. Generate embedding for query
        query_embedding = embed_model.embed_query(query)
        
        # 3. Calculate cosine similarity using numpy (L2 search is also fine)
        # normalize vectors for cosine similarity
        q_norm = query_embedding / np.linalg.norm(query_embedding)
        c_norms = [c / np.linalg.norm(c) for c in chunk_embeddings]
        
        similarities = [np.dot(q_norm, c_norm) for c_norm in c_norms]
        
        results = []
        for i, score in enumerate(similarities):
            chunk = chunks[i].copy()
            chunk["retrieval_score"] = float(score)
            results.append(chunk)
                
        results.sort(key=lambda x: x["retrieval_score"], reverse=True)
        return results[:k]

    @classmethod
    def hybrid_search(cls, query: str, chunks: List[Dict[str, Any]], k: int = 5) -> List[Dict[str, Any]]:
        """Combines BM25 and Vector search using Reciprocal Rank Fusion (RRF)."""
        if not chunks:
            return []

        # 1. Get results from both methods
        bm25_results = cls.bm25_search(query, chunks, k=max(k*2, 20))
        vector_results = cls.vector_search(query, chunks, k=max(k*2, 20))

        # 2. Apply RRF
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
            chunk = next((c for c in chunks if c["index"] == idx), None)
            if chunk:
                chunk_copy = chunk.copy()
                chunk_copy["retrieval_score"] = float(score)
                results.append(chunk_copy)
            
        return results

    @classmethod
    def rerank(cls, query: str, chunks: List[Dict[str, Any]], k: int = 5) -> List[Dict[str, Any]]:
        """
        Local Reranking is disabled to save memory for deployment.
        Returns original chunks as-is.
        """
        return chunks[:k]
