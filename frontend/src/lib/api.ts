const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? '/_api' : 'http://localhost:8000');

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

export async function fetchChunks(text: string, strategy: string, chunkSize: number, chunkOverlap: number, breakpointThreshold: number = 90, sentencesPerChunk: number = 3, regexPattern: string = "\\n\\n") {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/chunk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        text, 
        strategy, 
        chunk_size: chunkSize, 
        chunk_overlap: chunkOverlap,
        breakpoint_threshold_amount: breakpointThreshold,
        sentences_per_chunk: sentencesPerChunk,
        regex_pattern: regexPattern
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

export async function fetchDatasets() {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/datasets`);
    if (!response.ok) throw new Error("Failed to fetch datasets");
    return await response.json();
  } catch (error) {
    console.error("Datasets fetch failed:", error);
    throw error;
  }
}

export async function fetchExplanation(chunk: string, index: number) {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/explain`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chunk, index }),
    });
    if (!response.ok) throw new Error("Failed to fetch explanation");
    return await response.json();
  } catch (error) {
    console.error("Explanation fetch failed:", error);
    throw error;
  }
}

export async function uploadFile(file: File) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE_URL}/v1/upload`, {
      method: "POST",
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to upload file");
    }
    
    return await response.json();
  } catch (error) {
    console.error("File upload failed:", error);
    throw error;
  }
}

export async function runBenchmark(text: string, query: string, targetContent?: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/benchmark`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, query, target_content: targetContent }),
    });
    if (!response.ok) throw new Error("Failed to run benchmark");
    return await response.json();
  } catch (error) {
    console.error("Benchmark request failed:", error);
    throw error;
  }
}
