'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ChunkWorkspace from '@/components/ChunkWorkspace';
import { fetchChunks, retrieveChunks, evaluateRetrieval, fetchRecommendation } from '@/lib/api';

export default function Playground() {
  const [activeTab, setActiveTab] = useState<'chunking' | 'evaluation'>('chunking');
  
  // Chunking States
  const [text, setText] = useState('');
  const [strategy, setStrategy] = useState('recursive');
  const [chunkSize, setChunkSize] = useState(500);
  const [chunkOverlap, setChunkOverlap] = useState(50);
  const [chunks, setChunks] = useState<any[]>([]);
  const [isChunking, setIsChunking] = useState(false);
  
  // Evaluation States
  const [query, setQuery] = useState('');
  const [retrievalMethod, setRetrievalMethod] = useState('vector');
  const [retrievedChunks, setRetrievedChunks] = useState<any[]>([]);
  const [relevantIndices, setRelevantIndices] = useState<number[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

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
      const result = await fetchChunks(text, strategy, chunkSize, chunkOverlap);
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
    try {
      const result = await retrieveChunks(query, chunks, retrievalMethod, 5);
      setRetrievedChunks(result.results);
      setMetrics(null);
    } catch (err: any) {
      setError(err.message || 'Search failed.');
    } finally {
      setIsSearching(false);
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
    } catch (err: any) {
      setError(err.message || 'Evaluation failed.');
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
                      </select>
                    </div>
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
              /* Evaluation UI... (same as before) */
              <div className="card">
                <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>Retrieval Tester</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: 'var(--muted)' }}>Retrieval Method</label>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button onClick={() => setRetrievalMethod('vector')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: retrievalMethod === 'vector' ? 'var(--primary)' : 'transparent', color: 'white', cursor: 'pointer' }}>Vector Search</button>
                      <button onClick={() => setRetrievalMethod('bm25')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: retrievalMethod === 'bm25' ? 'var(--primary)' : 'transparent', color: 'white', cursor: 'pointer' }}>BM25 Search</button>
                    </div>
                  </div>
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
                    <div style={{ marginTop: '20px', padding: '20px', background: 'var(--glass)', borderRadius: '12px', border: '1px solid var(--primary)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Hit Rate@5</div>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary)' }}>{Math.round(metrics.hit_rate * 100)}%</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '4px' }}>MRR</div>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--secondary)' }}>{metrics.mrr}</div>
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
              /* Evaluation Results... (same as before) */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '18px' }}>Search Results</h3>
                  {retrievedChunks.length > 0 && relevantIndices.length > 0 && (
                    <button onClick={handleEvaluate} className="btn-primary" style={{ padding: '8px 16px', fontSize: '14px' }}>Calculate Metrics</button>
                  )}
                </div>
                
                {retrievedChunks.length === 0 ? (
                  <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--border)', borderRadius: '12px', color: 'var(--muted)' }}>
                    Run a search to see retrieved chunks and mark relevance.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <p style={{ fontSize: '13px', color: 'var(--muted)' }}>
                      💡 Mark chunks as <span style={{ color: 'var(--secondary)' }}>relevant</span> to calculate Ground Truth metrics.
                    </p>
                    {retrievedChunks.map((chunk, i) => (
                      <div key={i} className="card" style={{ border: relevantIndices.includes(chunk.index) ? '1px solid var(--secondary)' : '1px solid var(--border)', cursor: 'pointer' }} onClick={() => toggleRelevance(chunk.index)}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700 }}>RANK #{i+1} (Original Index {chunk.index})</span>
                          <span style={{ fontSize: '12px', color: 'var(--secondary)' }}>Score: {chunk.retrieval_score.toFixed(4)}</span>
                        </div>
                        <div style={{ fontSize: '14px', lineHeight: 1.5, opacity: 0.9 }}>{chunk.content}</div>
                        {relevantIndices.includes(chunk.index) && (
                          <div style={{ marginTop: '8px', color: 'var(--secondary)', fontSize: '12px', fontWeight: 600 }}>✓ Marked as Relevant</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
