'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ChunkWorkspace from '@/components/ChunkWorkspace';
import { fetchChunks, retrieveChunks, evaluateRetrieval, fetchRecommendation, generateAnswer } from '@/lib/api';

const ResultCard = ({ chunk, rank, isRelevant, onToggle }: { chunk: any, rank: number, isRelevant: boolean, onToggle: () => void }) => {
  const gradeColor = rank === 0 ? '#10b981' : rank < 3 ? '#f59e0b' : '#ef4444';
  const gradeLabel = rank === 0 ? 'Optimal' : rank < 3 ? 'Relevant' : 'Low Relevance';
  
  return (
    <div 
      className="card" 
      style={{ 
        border: isRelevant ? '2px solid var(--secondary)' : '1px solid var(--border)', 
        cursor: 'pointer',
        position: 'relative',
        transition: 'all 0.2s',
        transform: isRelevant ? 'scale(1.02)' : 'none'
      }} 
      onClick={onToggle}
    >
      <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span style={{ fontSize: '10px', color: gradeColor, fontWeight: 700, textTransform: 'uppercase' }}>{gradeLabel}</span>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: gradeColor }}></div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', paddingRight: '100px' }}>
        <span style={{ fontSize: '11px', fontWeight: 700 }}>RANK #{rank+1} <span style={{ opacity: 0.5 }}>(Index {chunk.index})</span></span>
        <span style={{ fontSize: '11px', color: 'var(--secondary)', fontWeight: 600 }}>Score: {chunk.retrieval_score.toFixed(4)}</span>
      </div>
      <div style={{ fontSize: '13px', lineHeight: 1.5, opacity: 0.9 }}>{chunk.content}</div>
      
      {chunk.metadata.warnings && chunk.metadata.warnings.length > 0 && (
        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {chunk.metadata.warnings.map((w: any, idx: number) => (
            <div key={idx} style={{ fontSize: '11px', color: w.severity === 'high' ? '#ef4444' : '#f59e0b', background: 'rgba(0,0,0,0.2)', padding: '4px 8px', borderRadius: '4px', border: `1px solid ${w.severity === 'high' ? '#ef4444' : '#f59e0b'}`, display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span>⚠️</span>
              <span>{w.message}</span>
            </div>
          ))}
        </div>
      )}

      {isRelevant && (
        <div style={{ marginTop: '12px', color: 'var(--secondary)', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>✨ Ground Truth Relevant</span>
        </div>
      )}
    </div>
  );
};

export default function Playground() {
  const [activeTab, setActiveTab] = useState<'chunking' | 'evaluation'>('chunking');
  
  // Chunking States
  const [text, setText] = useState('');
  const [strategy, setStrategy] = useState('recursive');
  const [chunkSize, setChunkSize] = useState(500);
  const [chunkOverlap, setChunkOverlap] = useState(50);
  const [breakpointThreshold, setBreakpointThreshold] = useState(90);
  const [chunks, setChunks] = useState<any[]>([]);
  const [isChunking, setIsChunking] = useState(false);
  
  // Evaluation States
  const [query, setQuery] = useState('');
  const [retrievalMethod, setRetrievalMethod] = useState('vector');
  const [useRerank, setUseRerank] = useState(false);
  const [retrievedChunks, setRetrievedChunks] = useState<any[]>([]);
  const [relevantIndices, setRelevantIndices] = useState<number[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Comparison States
  const [compareMode, setCompareMode] = useState(false);
  const [compareResults, setCompareResults] = useState<any[]>([]);
  const [compareMetrics, setCompareMetrics] = useState<any>(null);
  const [compareMethod, setCompareMethod] = useState('bm25');
  const [isComparing, setIsComparing] = useState(false);
  const [latencyMetrics, setLatencyMetrics] = useState<any>({ primary: 0, compare: 0 });

  // Generation States
  const [generationResult, setGenerationResult] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [ragModel, setRagModel] = useState('gpt-4o-mini');
  const [compareGeneration, setCompareGeneration] = useState<any>(null);

  // Recommendation States
  const [recommendation, setRecommendation] = useState<any>(null);
  const [isRecommending, setIsRecommending] = useState(false);
  
  const [error, setError] = useState<string | null>(null);

  const handleRunChunking = async () => {
    if (!text.trim()) {
      setError('Please enter some text to chunk.');
      return;
    }
    setIsChunking(true);
    setError(null);
    try {
      const result = await fetchChunks(text, strategy, chunkSize, chunkOverlap, breakpointThreshold);
      setChunks(result.chunks);
      setMetrics(null);
      setRelevantIndices([]);
      setRetrievedChunks([]);
    } catch (err: any) {
      setError(err.message || 'Failed to process chunks.');
    } finally {
      setIsChunking(false);
    }
  };

  const handleGetRecommendation = async () => {
    if (!text.trim()) {
      setError('Please enter some text for analysis.');
      return;
    }
    setIsRecommending(true);
    setError(null);
    try {
      const result = await fetchRecommendation(text);
      setRecommendation(result);
    } catch (err: any) {
      setError('Failed to get recommendation. Check your OpenAI API key.');
    } finally {
      setIsRecommending(false);
    }
  };

  const applyRecommendation = () => {
    if (!recommendation) return;
    setStrategy(recommendation.strategy);
    setChunkSize(recommendation.chunk_size);
    setChunkOverlap(recommendation.chunk_overlap);
    setRecommendation(null); // Clear recommendation after applying
  };

  const handleSearch = async () => {
    if (!query.trim() || chunks.length === 0) return;
    setIsSearching(true);
    if (compareMode) setIsComparing(true);

    try {
      // Transition search results
      const result = await retrieveChunks(query, chunks, retrievalMethod, 5, useRerank);
      setRetrievedChunks(result.results);
      setLatencyMetrics((prev: any) => ({ ...prev, primary: result.latency_ms }));
      setMetrics(null);

      // Comparison Search
      if (compareMode) {
        const compareRes = await retrieveChunks(query, chunks, compareMethod, 5, false);
        setCompareResults(compareRes.results);
        setLatencyMetrics((prev: any) => ({ ...prev, compare: compareRes.latency_ms }));
        setCompareMetrics(null);
      }
    } catch (err: any) {
      setError(err.message || 'Search failed.');
    } finally {
      setIsSearching(false);
      setIsComparing(false);
    }
  };

  const toggleRelevance = (index: number) => {
    setRelevantIndices(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const handleEvaluate = async () => {
    if (retrievedChunks.length === 0 || relevantIndices.length === 0) return;
    try {
      const retrievedIndices = retrievedChunks.map(c => c.index);
      const result = await evaluateRetrieval(retrievedIndices, relevantIndices, 5);
      setMetrics(result);

      if (compareMode && compareResults.length > 0) {
        const compareRetrievedIndices = compareResults.map(c => c.index);
        const compareResult = await evaluateRetrieval(compareRetrievedIndices, relevantIndices, 5);
        setCompareMetrics(compareResult);
      }
    } catch (err: any) {
      setError(err.message || 'Evaluation failed.');
    }
  };

  const handleGenerate = async () => {
    if (retrievedChunks.length === 0) return;
    setIsGenerating(true);
    setGenerationResult(null);
    setCompareGeneration(null);
    try {
      const contexts = retrievedChunks.map(c => c.content);
      const res = await generateAnswer(query, contexts, ragModel, true);
      setGenerationResult(res);

      if (compareMode && compareResults.length > 0) {
        const compareContexts = compareResults.map(c => c.content);
        const compRes = await generateAnswer(query, compareContexts, ragModel, true);
        setCompareGeneration(compRes);
      }
    } catch (err: any) {
      setError(err.message || 'Generation failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <Header />
      
      <main style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', background: 'var(--surface)', padding: '4px', borderRadius: '12px', width: 'fit-content', border: '1px solid var(--border)' }}>
          <button onClick={() => setActiveTab('chunking')} style={{ padding: '8px 24px', borderRadius: '8px', border: 'none', background: activeTab === 'chunking' ? 'var(--primary)' : 'transparent', color: activeTab === 'chunking' ? 'white' : 'var(--muted)', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>🧩 Chunking</button>
          <button onClick={() => setActiveTab('evaluation')} style={{ padding: '8px 24px', borderRadius: '8px', border: 'none', background: activeTab === 'evaluation' ? 'var(--primary)' : 'transparent', color: activeTab === 'evaluation' ? 'white' : 'var(--muted)', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>🔍 Evaluation</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'start' }}>
          
          {/* Left Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {activeTab === 'chunking' ? (
              <>
                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '20px' }}>Strategy Configuration</h2>
                    <button 
                      onClick={handleGetRecommendation}
                      disabled={isRecommending || !text.trim()}
                      style={{ padding: '6px 12px', borderRadius: '6px', background: 'var(--glass)', border: '1px solid var(--primary)', color: 'var(--primary)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      {isRecommending ? 'Analyzing...' : '✨ AI Suggest'}
                    </button>
                  </div>

                  {recommendation && (
                    <div style={{ marginBottom: '20px', padding: '16px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px', border: '1px solid var(--primary)' }}>
                      <div style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 600, marginBottom: '8px' }}>🤖 AI Recommendation</div>
                      <div style={{ fontSize: '14px', marginBottom: '12px', lineHeight: 1.5 }}>{recommendation.rationale}</div>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{ fontSize: '12px', opacity: 0.8 }}>Suggested: {recommendation.strategy} ({recommendation.chunk_size}/{recommendation.chunk_overlap})</div>
                        <button onClick={applyRecommendation} style={{ padding: '4px 10px', background: 'var(--primary)', border: 'none', borderRadius: '4px', color: 'white', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>Apply</button>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: 'var(--muted)' }}>Strategy</label>
                      <select 
                        value={strategy} 
                        onChange={(e) => setStrategy(e.target.value)}
                        style={{ width: '100%', padding: '10px', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--foreground)' }}
                      >
                        <option value="recursive">Recursive Character</option>
                        <option value="fixed">Fixed Size</option>
                        <option value="token">Token-based</option>
                        <option value="semantic">Semantic (Topic-aware)</option>
                        <option value="sliding">Sliding Window</option>
                      </select>
                    </div>

                    {strategy === 'semantic' && (
                      <div style={{ padding: '16px', background: 'var(--glass)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <label style={{ fontSize: '12px', color: 'var(--muted)' }}>Breakpoint Percentile</label>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)' }}>{breakpointThreshold}</span>
                        </div>
                        <input 
                          type="range" min="1" max="100" 
                          value={breakpointThreshold} 
                          onChange={(e) => setBreakpointThreshold(parseInt(e.target.value))}
                          style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
                        />
                        <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '8px' }}>
                          Higher percentile = splitter only breaks on massive semantic shifts (fewer chunks).
                        </p>
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: 'var(--muted)' }}>Chunk Size</label>
                        <input type="number" value={isNaN(chunkSize) ? '' : chunkSize} onChange={(e) => setChunkSize(parseInt(e.target.value) || 0)} style={{ width: '100%', padding: '10px', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--foreground)' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: 'var(--muted)' }}>Overlap</label>
                        <input type="number" value={isNaN(chunkOverlap) ? '' : chunkOverlap} onChange={(e) => setChunkOverlap(parseInt(e.target.value) || 0)} style={{ width: '100%', padding: '10px', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--foreground)' }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card" style={{ flex: 1 }}>
                  <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>Input Text</h2>
                  <textarea 
                    value={text} onChange={(e) => setText(e.target.value)}
                    placeholder="Paste your document content here..."
                    style={{ minHeight: '400px', width: '100%', padding: '16px', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--foreground)', fontFamily: 'inherit', resize: 'vertical', fontSize: '15px', lineHeight: 1.6 }}
                  />
                  <button onClick={handleRunChunking} disabled={isChunking} className="btn-primary" style={{ marginTop: '16px', padding: '14px', width: '100%' }}>
                    {isChunking ? 'Processing...' : 'Run Chunking Engine'}
                  </button>
                </div>
              </>
            ) : (
              /* Evaluation UI */
              <div className="card">
                <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>Retrieval Tester</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: 'var(--muted)' }}>Retrieval Method</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => setRetrievalMethod('vector')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: retrievalMethod === 'vector' ? 'var(--primary)' : 'transparent', color: 'white', cursor: 'pointer', fontSize: '12px' }}>Vector</button>
                      <button onClick={() => setRetrievalMethod('bm25')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: retrievalMethod === 'bm25' ? 'var(--primary)' : 'transparent', color: 'white', cursor: 'pointer', fontSize: '12px' }}>BM25</button>
                      <button onClick={() => setRetrievalMethod('hybrid')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: retrievalMethod === 'hybrid' ? 'var(--primary)' : 'transparent', color: 'white', cursor: 'pointer', fontSize: '12px' }}>Hybrid</button>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input 
                        type="checkbox" 
                        id="rerank" 
                        checked={useRerank} 
                        onChange={(e) => setUseRerank(e.target.checked)}
                        style={{ width: '16px', height: '16px' }}
                      />
                      <label htmlFor="rerank" style={{ fontSize: '14px', cursor: 'pointer' }}>Apply Reranking</label>
                    </div>

                    <button 
                      onClick={() => setCompareMode(!compareMode)}
                      style={{ padding: '4px 12px', borderRadius: '6px', background: compareMode ? 'var(--secondary)' : 'var(--glass)', border: '1px solid var(--border)', color: 'white', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      {compareMode ? '✕ End Compare' : '⚖️ Compare Mode'}
                    </button>
                  </div>

                  {compareMode && (
                    <div style={{ padding: '12px', background: 'var(--glass)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <label style={{ display: 'block', fontSize: '12px', marginBottom: '8px', color: 'var(--muted)' }}>Compare With:</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => setCompareMethod('vector')} style={{ flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid var(--border)', background: compareMethod === 'vector' ? 'var(--secondary)' : 'transparent', color: 'white', cursor: 'pointer', fontSize: '11px' }}>Vector</button>
                        <button onClick={() => setCompareMethod('bm25')} style={{ flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid var(--border)', background: compareMethod === 'bm25' ? 'var(--secondary)' : 'transparent', color: 'white', cursor: 'pointer', fontSize: '11px' }}>BM25</button>
                        <button onClick={() => setCompareMethod('hybrid')} style={{ flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid var(--border)', background: compareMethod === 'hybrid' ? 'var(--secondary)' : 'transparent', color: 'white', cursor: 'pointer', fontSize: '11px' }}>Hybrid</button>
                      </div>
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: 'var(--muted)' }}>Search Query</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input 
                        type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                        placeholder="Enter a query to test retrieval..."
                        style={{ flex: 1, padding: '12px', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--foreground)' }}
                      />
                      <button onClick={handleSearch} disabled={isSearching || chunks.length === 0} className="btn-primary" style={{ padding: '0 24px' }}>
                        {isSearching ? '...' : 'Search'}
                      </button>
                    </div>
                  </div>

                  {metrics && (
                    <div style={{ marginTop: '20px', padding: '16px', background: 'var(--glass)', borderRadius: '12px', border: '1px solid var(--primary)' }}>
                      <div style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 700, marginBottom: '12px', textAlign: 'center' }}>SYSTEM A PERFORMANCE ({retrievalMethod.toUpperCase()})</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase' }}>Hit Rate</div>
                          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary)' }}>{Math.round(metrics.hit_rate * 100)}%</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase' }}>MRR</div>
                          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--secondary)' }}>{metrics.mrr}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {compareMetrics && (
                    <div style={{ marginTop: '12px', padding: '16px', background: 'var(--glass)', borderRadius: '12px', border: '1px solid var(--secondary)' }}>
                      <div style={{ fontSize: '12px', color: 'var(--secondary)', fontWeight: 700, marginBottom: '12px', textAlign: 'center' }}>SYSTEM B PERFORMANCE ({compareMethod.toUpperCase()})</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase' }}>Hit Rate</div>
                          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--secondary)' }}>{Math.round(compareMetrics.hit_rate * 100)}%</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase' }}>MRR</div>
                          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary)' }}>{compareMetrics.mrr}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  <hr style={{ border: '0.5px solid var(--border)', margin: '10px 0' }} />

                  {/* RAG Simulation Panel */}
                  <div style={{ background: 'var(--glass)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: 700 }}>🚀 RAG Simulation</h3>
                      <select 
                        value={ragModel} 
                        onChange={(e) => setRagModel(e.target.value)}
                        style={{ padding: '4px 8px', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '11px', color: 'white' }}
                      >
                        <option value="gpt-4o-mini">gpt-4o-mini</option>
                        <option value="gpt-4o">gpt-4o</option>
                      </select>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '16px' }}>Generate answers based on retrieved context to test pipeline grounding.</p>
                    <button 
                      onClick={handleGenerate} 
                      disabled={isGenerating || retrievedChunks.length === 0}
                      className="btn-primary" 
                      style={{ width: '100%', padding: '10px' }}
                    >
                      {isGenerating ? 'Generating...' : 'Synthesize Answer'}
                    </button>
                  </div>

                  {/* Pipeline Insights Dashboard */}
                  {(latencyMetrics.primary > 0 || generationResult) && (
                    <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '12px', border: '1px solid #10b981' }}>
                      <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#10b981', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        📊 Pipeline Insights
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                          <span style={{ color: 'var(--muted)' }}>Retrieval Latency</span>
                          <span style={{ fontWeight: 600 }}>{latencyMetrics.primary}ms</span>
                        </div>
                        {generationResult && (
                          <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                              <span style={{ color: 'var(--muted)' }}>LLM Latency</span>
                              <span style={{ fontWeight: 600 }}>{generationResult.latency_ms}ms</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                              <span style={{ color: 'var(--muted)' }}>Est. Cost (OpenAI)</span>
                              <span style={{ fontWeight: 700, color: 'var(--secondary)' }}>${(generationResult.usage.total * 0.00000015).toFixed(6)}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {error && <p style={{ color: 'var(--accent)', marginTop: '12px', fontSize: '14px' }}>{error}</p>}
          </div>

          {/* Right Panel */}
          <div style={{ minHeight: '600px' }}>
            {activeTab === 'chunking' ? (
              <ChunkWorkspace chunks={chunks} strategy={strategy} />
            ) : (
              /* Evaluation Results */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '18px' }}>
                    {compareMode ? 'Dual Search Comparison' : 'Search Results'}
                  </h3>
                  {retrievedChunks.length > 0 && relevantIndices.length > 0 && (
                    <button onClick={handleEvaluate} className="btn-primary" style={{ padding: '8px 16px', fontSize: '14px' }}>Update Metrics</button>
                  )}
                </div>
                
                <p style={{ fontSize: '13px', color: 'var(--muted)' }}>
                  💡 Mark chunks as <span style={{ color: 'var(--secondary)' }}>relevant</span> to compare strategies.
                </p>

                <div style={{ 
                  display: compareMode ? 'grid' : 'flex', 
                  gridTemplateColumns: compareMode ? '1fr 1fr' : 'none',
                  flexDirection: 'column',
                  gap: '24px' 
                }}>
                  {/* Results Column A */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {compareMode && <div style={{ fontSize: '11px', fontWeight: 700, opacity: 0.6 }}>SYSTEM A: {retrievalMethod.toUpperCase()} {useRerank ? '+ Rerank' : ''}</div>}
                    
                    {retrievedChunks.length === 0 ? (
                      <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--border)', borderRadius: '12px', color: 'var(--muted)', fontSize: '13px' }}>
                        Run search to see results A
                      </div>
                    ) : (
                      <>
                        {generationResult && (
                          <div style={{ padding: '16px', background: 'var(--glass)', borderRadius: '12px', border: '1px solid var(--secondary)', position: 'relative' }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--secondary)', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                              <span>GENERATED RESPONSE (A)</span>
                              {generationResult.groundedness && (
                                <span style={{ color: generationResult.groundedness.score > 0.8 ? '#10b981' : '#f59e0b' }}>
                                  Faithfulness: {Math.round(generationResult.groundedness.score * 100)}%
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '13px', lineHeight: 1.6, color: 'white' }}>{generationResult.answer}</div>
                            {generationResult.groundedness && (
                              <div style={{ fontSize: '10px', marginTop: '8px', opacity: 0.6, fontStyle: 'italic' }}>
                                Rationale: {generationResult.groundedness.reason}
                              </div>
                            )}
                          </div>
                        )}
                        {retrievedChunks.map((chunk, i) => (
                          <ResultCard 
                            key={i} 
                            chunk={chunk} 
                            rank={i} 
                            isRelevant={relevantIndices.includes(chunk.index)} 
                            onToggle={() => toggleRelevance(chunk.index)} 
                          />
                        ))}
                      </>
                    )}
                  </div>

                  {/* Results Column B (Comparison) */}
                  {compareMode && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, opacity: 0.6 }}>SYSTEM B: {compareMethod.toUpperCase()}</div>
                      
                      {compareResults.length === 0 ? (
                        <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--border)', borderRadius: '12px', color: 'var(--muted)', fontSize: '13px' }}>
                          Run search to see results B
                        </div>
                      ) : (
                        <>
                          {compareGeneration && (
                            <div style={{ padding: '16px', background: 'var(--glass)', borderRadius: '12px', border: '1px solid var(--primary)' }}>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                                <span>GENERATED RESPONSE (B)</span>
                                {compareGeneration.groundedness && (
                                  <span style={{ color: compareGeneration.groundedness.score > 0.8 ? '#10b981' : '#f59e0b' }}>
                                    Faithfulness: {Math.round(compareGeneration.groundedness.score * 100)}%
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '13px', lineHeight: 1.6, color: 'white' }}>{compareGeneration.answer}</div>
                            </div>
                          )}
                          {compareResults.map((chunk, i) => (
                            <ResultCard 
                              key={i} 
                              chunk={chunk} 
                              rank={i} 
                              isRelevant={relevantIndices.includes(chunk.index)} 
                              onToggle={() => toggleRelevance(chunk.index)} 
                            />
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
