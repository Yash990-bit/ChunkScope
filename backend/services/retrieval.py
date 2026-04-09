import numpy as np
from typing import List, Dict, Any
from rank_bm25 import BM25Okapi
from sentence_transformers import SentenceTransformer
import faiss

class RetrievalService:
    _model = None

    @classmethod
    def get_model(cls):
        if cls._model is None:
            # Using a small, fast local model
            cls._model = SentenceTransformer('all-MiniLM-L6-v2')
        return cls._model

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
            chunks[i]["retrieval_score"] = float(score)
            scored_chunks.append(chunks[i])
            
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
