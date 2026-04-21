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
from services.document import DocumentService
from fastapi import File, UploadFile, HTTPException
import time

import os

# Initialize FastAPI
# We use root_path ONLY if specifically requested (likely for Vercel unified)
# For Render split, this should be empty.
root_path = os.getenv("ROOT_PATH", "").strip()

app = FastAPI(
    title="ChunkScope API", 
    version="0.1.0",
    root_path=root_path
)

# Robust path resolving for data files
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

from fastapi.responses import JSONResponse
from fastapi import Request

# Hardcore CORS Middleware
@app.middleware("http")
async def add_cors_header(request: Request, call_next):
    if request.method == "OPTIONS":
        response = JSONResponse(content="OK")
    else:
        try:
            response = await call_next(request)
        except Exception as e:
            # Handle cases where the app crashes and doesn't reach the normal response stage
            response = JSONResponse(
                status_code=500,
                content={"detail": "Internal Server Error", "error": str(e)}
            )
    
    # Force headers on every single response (success or failure)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
    response.headers["Access-Control-Allow-Credentials"] = "false"
    return response

# Standard middleware (as backup)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChunkRequest(BaseModel):
    text: str
    strategy: str = "recursive"
    chunk_size: int = 500
    chunk_overlap: int = 50
    breakpoint_threshold_amount: Optional[float] = 90.0
    sentences_per_chunk: Optional[int] = 3
    regex_pattern: Optional[str] = "\\n\\n"

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

class BenchmarkRequest(BaseModel):
    text: str
    query: str
    target_content: Optional[str] = None
    strategies: List[Dict[str, Any]] = [
        {"name": "Recursive Small", "strategy": "recursive", "size": 500, "overlap": 50},
        {"name": "Recursive Large", "strategy": "recursive", "size": 1000, "overlap": 100},
        {"name": "Semantic", "strategy": "semantic", "size": 0, "overlap": 0}
    ]

@app.get("/")
async def root():
    return {"message": "Welcome to ChunkScope API"}

@app.get("/health")
async def health_check():
    return {"status": "online", "version": "0.1.0"}



@app.post("/v1/chunk")
async def chunk_text(request: ChunkRequest):
    chunks = ChunkingService.split_text(
        text=request.text,
        strategy=request.strategy,
        chunk_size=request.chunk_size,
        chunk_overlap=request.chunk_overlap,
        breakpoint_threshold_amount=request.breakpoint_threshold_amount,
        sentences_per_chunk=request.sentences_per_chunk or 3,
        regex_pattern=request.regex_pattern or "\\n\\n"
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

@app.get("/v1/datasets")
async def get_datasets():
    import json
    datasets_path = os.path.join(BASE_DIR, "data", "datasets.json")
    try:
        if not os.path.exists(datasets_path):
             return {"error": f"Dataset file not found at {datasets_path}", "datasets": []}
        with open(datasets_path, "r") as f:
            return json.load(f)
    except Exception as e:
        return {"error": f"Failed to load datasets: {str(e)}"}

class ExplainRequest(BaseModel):
    chunk: str
    index: int

@app.post("/v1/explain")
async def explain_chunk(request: ExplainRequest):
    result = DocumentAnalyzer.explain_chunk(request.chunk, request.index)
    return result

@app.post("/v1/benchmark")
async def run_benchmark(request: BenchmarkRequest):
    results = []
    
    for config in request.strategies:
        start_time = time.perf_counter()
        
        # 1. Chunk
        chunks = ChunkingService.split_text(
            text=request.text,
            strategy=config["strategy"],
            chunk_size=config["size"],
            chunk_overlap=config["overlap"]
        )
        
        # 2. Retrieve (Vector search is default for benchmarking)
        retrieval_results = RetrievalService.vector_search(request.query, chunks, k=5)
        
        latency = (time.perf_counter() - start_time) * 1000
        
        # 3. Calculate "Hit" if target_content is in top results
        hit = False
        if request.target_content:
            target_norm = request.target_content.lower().strip()
            hit = any(target_norm in res["content"].lower() for res in retrieval_results)
        
        # 4. Estimate cost (simplified)
        token_count = sum(c["metadata"]["token_count"] for c in chunks)
        est_cost = (token_count * 0.0000001) + 0.0001 # Base model + retrieval cost
        
        results.append({
            "name": config["name"],
            "strategy": config["strategy"],
            "hit_rate": 1.0 if hit else 0.0,
            "latency_ms": round(latency, 2),
            "cost_score": round(est_cost, 6),
            "chunk_count": len(chunks)
        })
        
    return {"benchmark_results": results}

@app.post("/v1/upload")
async def upload_document(file: UploadFile = File(...)):
    try:
        text = await DocumentService.parse_file(file)
        return {"filename": file.filename, "content": text}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Parsing error: {str(e)}")

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
