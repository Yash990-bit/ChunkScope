from typing import Optional, List, Dict, Any
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from services.chunking import ChunkingService
from services.retrieval import RetrievalService
from services.evaluation import EvaluationService
from services.recommender import StrategyRecommender
from services.generation import GenerationService
from services.analyzer import DocumentAnalyzer
import time

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
    breakpoint_threshold_amount: Optional[int] = 90

class ChunkData(BaseModel):
    index: int
    content: str
    metadata: Dict[str, Any]

class RetrievalRequest(BaseModel):
    query: str
    chunks: List[ChunkData]
    method: str = "vector" # "vector", "bm25", or "hybrid"
    rerank: bool = False
    k: int = 5

class EvaluationRequest(BaseModel):
    retrieved_indices: List[int]
    relevant_indices: List[int]
    k: int = 5

class RecommendRequest(BaseModel):
    text: str

class GenerationRequest(BaseModel):
    query: str
    contexts: List[str]
    model: str = "gpt-4o-mini"
    evaluate_groundedness: bool = False

@app.get("/")
async def root():
    return {"message": "Welcome to ChunkScope API"}



@app.post("/v1/chunk")
async def chunk_text(request: ChunkRequest):
    chunks = ChunkingService.split_text(
        text=request.text,
        strategy=request.strategy,
        chunk_size=request.chunk_size,
        chunk_overlap=request.chunk_overlap,
        breakpoint_threshold_amount=request.breakpoint_threshold_amount
    )
    
    # 🕵️ Add Failure Mode Detection (Validation)
    validated_chunks = DocumentAnalyzer.validate_chunks(chunks)
    
    return {
        "strategy": request.strategy,
        "chunk_count": len(validated_chunks),
        "chunks": validated_chunks
    }

@app.post("/v1/retrieve")
async def retrieve_chunks(request: RetrievalRequest):
    start_time = time.perf_counter()
    # Convert Pydantic models to dicts for the service
    chunks_dict = [chunk.model_dump() for chunk in request.chunks]
    
    if request.method == "bm25":
        results = RetrievalService.bm25_search(request.query, chunks_dict, request.k)
    elif request.method == "hybrid":
        results = RetrievalService.hybrid_search(request.query, chunks_dict, request.k)
    else:
        results = RetrievalService.vector_search(request.query, chunks_dict, request.k)
        
    # Apply reranking if requested
    if request.rerank:
        results = RetrievalService.rerank(request.query, results, request.k)

    latency = (time.perf_counter() - start_time) * 1000

    return {
        "query": request.query,
        "method": request.method,
        "rerank_applied": request.rerank,
        "results": results,
        "latency_ms": round(latency, 2)
    }

@app.post("/v1/generate")
async def generate_answer(request: GenerationRequest):
    result = GenerationService.generate_answer(
        query=request.query,
        contexts=request.contexts,
        model_name=request.model
    )
    
    if request.evaluate_groundedness:
        groundedness = EvaluationService.evaluate_groundedness(
            query=request.query,
            answer=result["answer"],
            contexts=request.contexts
        )
        result["groundedness"] = groundedness
        
    return result

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
