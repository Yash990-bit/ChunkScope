import os
import sys
import numpy as np
from typing import List, Dict, Any

# Mock OpenAIEmbeddings to avoid real API calls and dependency on env vars for this test
class MockEmbeddings:
    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return [[0.1 * (i+1), 0.2, 0.3] for i in range(len(texts))]
    def embed_query(self, text: str) -> List[float]:
        return [0.1, 0.2, 0.3]

# Add the project directory to sys.path to import services
sys.path.append("/Users/yashraghubanshi/Desktop/ChunkScope/backend")

from services.retrieval import RetrievalService

def verify_retrieval():
    print("Testing RetrievalService.vector_search with numpy refactor...")
    
    # Mock the get_embedding_model
    RetrievalService._embedding_model = MockEmbeddings()
    
    chunks = [
        {"index": 0, "content": "Chunk 1", "metadata": {}},
        {"index": 1, "content": "Chunk 2", "metadata": {}},
        {"index": 2, "content": "Chunk 3", "metadata": {}}
    ]
    query = "test query"
    
    try:
        results = RetrievalService.vector_search(query, chunks, k=2)
        print(f"Results: {results}")
        if len(results) == 2 and "retrieval_score" in results[0]:
            print("SUCCESS: vector_search returned results with scores.")
        else:
            print("FAILURE: results format incorrect.")
    except Exception as e:
        print(f"FAILURE: vector_search crashed with error: {e}")

    print("\nTesting RetrievalService.hybrid_search index lookup optimization...")
    try:
        # hybrid_search uses bm25_search too. we need to make sure bm25 works.
        # bm25_search is static, uses rank_bm25.
        results = RetrievalService.hybrid_search(query, chunks, k=2)
        print(f"Hybrid Results: {results}")
        if len(results) > 0:
            print("SUCCESS: hybrid_search returned results.")
    except Exception as e:
        print(f"FAILURE: hybrid_search crashed with error: {e}")

if __name__ == "__main__":
    verify_retrieval()
