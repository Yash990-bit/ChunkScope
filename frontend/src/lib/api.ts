const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function fetchHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) throw new Error('Backend unavailable');
    return await response.json();
  } catch (error) {
    console.error('Health check failed:', error);
    return { status: 'offline', version: 'unknown' };
  }
}

export async function fetchChunks(text: string, strategy: string, chunkSize: number, chunkOverlap: number, breakpointThreshold: number = 90) {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/chunk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        text, 
        strategy, 
        chunk_size: chunkSize, 
        chunk_overlap: chunkOverlap,
        breakpoint_threshold_amount: breakpointThreshold 
      }),
    });
    if (!response.ok) throw new Error("Failed to fetch chunks");
    return await response.json();
  } catch (error) {
    console.error("Chunking request failed:", error);
    throw error;
  }
}

export async function retrieveChunks(query: string, chunks: any[], method: string = "vector", k: number = 5, rerank: boolean = false) {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/retrieve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, chunks, method, k, rerank }),
    });
    if (!response.ok) throw new Error("Failed to fetch retrieved chunks");
    return await response.json();
  } catch (error) {
    console.error("Retrieval request failed:", error);
    throw error;
  }
}

export async function evaluateRetrieval(retrievedIndices: number[], relevantIndices: number[], k: number = 5) {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ retrieved_indices: retrievedIndices, relevant_indices: relevantIndices, k }),
    });
    if (!response.ok) throw new Error("Failed to fetch evaluation metrics");
    return await response.json();
  } catch (error) {
    console.error("Evaluation request failed:", error);
    throw error;
  }
}

export async function fetchRecommendation(text: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/recommend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!response.ok) throw new Error("Failed to fetch AI recommendation");
    return await response.json();
  } catch (error) {
    console.error("Recommendation request failed:", error);
    throw error;
  }
}

export async function generateAnswer(query: string, contexts: string[], model: string, evaluateGroundedness: boolean = true) {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, contexts, model, evaluate_groundedness: evaluateGroundedness }),
    });
    if (!response.ok) throw new Error("Failed to generate answer");
    return await response.json();
  } catch (error) {
    console.error("Generation request failed:", error);
    throw error;
  }
}
