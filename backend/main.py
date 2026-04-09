from typing import Optional, List, Dict, Any
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from services.chunking import ChunkingService
from services.retrieval import RetrievalService
from services.evaluation import EvaluationService
from services.recommender import StrategyRecommender

app = FastAPI(title="ChunkScope API", version="0.1.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChunkRequest(BaseModel):
    text: str
    strategy: str = "recursive"
    chunk_size: int = 500
    chunk_overlap: int = 50

class ChunkData(BaseModel):
    index: int
    content: str
    metadata: Dict[str, Any]

class RetrievalRequest(BaseModel):
    query: str
    chunks: List[ChunkData]
    method: str = "vector" # "vector" or "bm25"
    k: int = 5

class EvaluationRequest(BaseModel):
    retrieved_indices: List[int]
    relevant_indices: List[int]
    k: int = 5

class RecommendRequest(BaseModel):
    text: str

@app.get("/")
async def root():
    return {"message": "Welcome to ChunkScope API"}

@app.post("/v1/chunk")
async def chunk_text(request: ChunkRequest):
    chunks = ChunkingService.split_text(
        text=request.text,
        strategy=request.strategy,
        chunk_size=request.chunk_size,
        chunk_overlap=request.chunk_overlap
    )
    return {
        "strategy": request.strategy,
        "chunk_count": len(chunks),
        "chunks": chunks
    }

@app.post("/v1/retrieve")
async def retrieve_chunks(request: RetrievalRequest):
    # Convert Pydantic models to dicts for the service
    chunks_dict = [chunk.model_dump() for chunk in request.chunks]
    
    if request.method == "bm25":
        results = RetrievalService.bm25_search(request.query, chunks_dict, request.k)
    else:
        results = RetrievalService.vector_search(request.query, chunks_dict, request.k)
        
    return {
        "query": request.query,
        "method": request.method,
        "results": results
    }

@app.post("/v1/evaluate")
async def evaluate_retrieval(request: EvaluationRequest):
    metrics = EvaluationService.calculate_metrics(
        retrieved_chunk_indices=request.retrieved_indices,
        relevant_chunk_indices=request.relevant_indices,
        k=request.k
    )
    return metrics

@app.post("/v1/recommend")
async def get_recommendation(request: RecommendRequest):
    recommendation = StrategyRecommender.get_recommendation(request.text)
    return recommendation

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": "0.1.0",
        "services": {
            "database": "not_initialized",
            "search_engine": "not_initialized"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
