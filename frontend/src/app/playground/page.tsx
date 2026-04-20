'use client';

import { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ChunkWorkspace from '@/components/ChunkWorkspace';
import StrategyRadarChart from '@/components/StrategyRadarChart';
import BenchmarkLeaderboard from '@/components/BenchmarkLeaderboard';
import { fetchChunks, retrieveChunks, evaluateRetrieval, fetchRecommendation, generateAnswer, fetchDatasets, fetchExplanation, uploadFile, runBenchmark } from '@/lib/api';

const ResultCard = ({ chunk, rank, isRelevant, onToggle, onAnalyze, isAnalyzing }: { chunk: any, rank: number, isRelevant: boolean, onToggle: () => void, onAnalyze: () => void, isAnalyzing?: boolean }) => {
  const gradeColor = rank === 0 ? 'var(--primary)' : rank < 3 ? '#f59e0b' : '#ef4444';
  const gradeLabel = rank === 0 ? 'Optimal' : rank < 3 ? 'Relevant' : 'Low Relevance';
  
  return (
    <div 
      className="card" 
      style={{ 
        border: isRelevant ? '2px solid var(--primary)' : '1px solid var(--border)', 
        cursor: 'default',
        position: 'relative',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        transform: isRelevant ? 'scale(1.02)' : 'none',
        background: 'rgba(15, 23, 42, 0.4)'
      }} 
    >
      <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <button 
          onClick={(e) => { e.stopPropagation(); onAnalyze(); }}
          disabled={isAnalyzing}
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'white', fontSize: '10px', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
        >
          {isAnalyzing ? 'Analyzing...' : '🔍 Explain'}
        </button>
        <span style={{ fontSize: '10px', color: gradeColor, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{gradeLabel}</span>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: gradeColor, boxShadow: `0 0 8px ${gradeColor}` }}></div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', paddingRight: '140px' }}>
        <div onClick={onToggle} style={{ cursor: 'pointer' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, fontFamily: "'Outfit', sans-serif", color: 'rgba(255,255,255,0.5)' }}>#RANK {rank+1} <span style={{ opacity: 0.5, marginLeft: '4px' }}>(ID {chunk.index})</span></span>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>Score: {chunk.retrieval_score.toFixed(4)}</span>
      </div>
      
      <div style={{ fontSize: '13px', lineHeight: 1.6, color: 'rgba(255,255,255,0.9)' }}>{chunk.content}</div>
      
      {chunk.explanation && (
        <div style={{ marginTop: '16px', padding: '14px', background: 'rgba(34, 211, 238, 0.03)', borderRadius: '10px', borderLeft: '4px solid var(--primary)', fontSize: '12.5px', lineHeight: 1.6 }}>
          <div style={{ fontWeight: 800, color: 'var(--primary)', marginBottom: '6px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Outfit', sans-serif" }}>AI Optimization Insight</div>
          {chunk.explanation}
        </div>
      )}

      {chunk.metadata.warnings && chunk.metadata.warnings.length > 0 && (
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {chunk.metadata.warnings.map((w: any, idx: number) => (
            <div key={idx} style={{ fontSize: '11.5px', color: w.severity === 'high' ? 'var(--accent)' : '#f59e0b', background: 'rgba(0,0,0,0.3)', padding: '6px 10px', borderRadius: '6px', border: `1px solid ${w.severity === 'high' ? 'rgba(244, 63, 94, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`, display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span>⚠️</span>
              <span style={{ fontWeight: 500 }}>{w.message}</span>
            </div>
          ))}
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
  const [chunkSize, setChunkSize] = useState(400);
  const [chunkOverlap, setChunkOverlap] = useState(50);
  const [sentencesPerChunk, setSentencesPerChunk] = useState(3);
  const [regexPattern, setRegexPattern] = useState('\\n## | Q: | —');
  const [chunks, setChunks] = useState<any[]>([]);
  const [isChunking, setIsChunking] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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

  // Dataset States
  const [availableDatasets, setAvailableDatasets] = useState<any[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState('');
  
  // Analysis States
  const [analyzingChunkIndex, setAnalyzingChunkIndex] = useState<number | null>(null);

  // Benchmarking States
  const [benchmarkResults, setBenchmarkResults] = useState<any[]>([]);
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [benchmarkQuery, setBenchmarkQuery] = useState('');
  const [benchmarkTarget, setBenchmarkTarget] = useState('');
  
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDatasets = async () => {
      try {
        const data = await fetchDatasets();
        setAvailableDatasets(data);
      } catch (err) {
        console.error("Failed to load datasets", err);
      }
    };
    loadDatasets();
  }, []);

  const handleLoadDataset = (datasetId: string) => {
    const dataset = availableDatasets.find(d => d.id === datasetId);
    if (dataset) {
      setText(dataset.content);
      setSelectedDatasetId(datasetId);
      if (dataset.recommended_query) {
        setQuery(dataset.recommended_query);
      }
    }
  };

  const explainChunkResult = async (chunkIndex: number, isSystemB: boolean = false) => {
    const chunkList = isSystemB ? compareResults : retrievedChunks;
    const chunk = chunkList.find(c => c.index === chunkIndex);
    if (!chunk) return;

    setAnalyzingChunkIndex(chunkIndex);
    try {
      const res = await fetchExplanation(chunk.content, chunkIndex);
      const updateFn = (list: any[]) => list.map(c => 
        c.index === chunkIndex ? { ...c, explanation: res.explanation } : c
      );
      
      if (isSystemB) {
        setCompareResults(updateFn);
      } else {
        setRetrievedChunks(updateFn);
      }
    } catch (err: any) {
      setError("Failed to get explanation.");
    } finally {
      setAnalyzingChunkIndex(null);
    }
  };

  const handleRunBenchmark = async () => {
    if (!text.trim() || !benchmarkQuery.trim()) {
      setError("Please provide both content and a representative query for benchmarking.");
      return;
    }
    setIsBenchmarking(true);
    setBenchmarkResults([]);
    try {
      const res = await runBenchmark(text, benchmarkQuery, benchmarkTarget);
      setBenchmarkResults(res.benchmark_results);
    } catch (err: any) {
      setError("Benchmark failed. Check connectivity.");
    } finally {
      setIsBenchmarking(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    try {
      const result = await uploadFile(file);
      setText(result.content);
      setChunks([]); // Clear previous chunks to avoid confusion
    } catch (err: any) {
      setError(err.message || 'Failed to upload and parse file.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRunChunking = async () => {
    if (!text.trim()) {
      setError('Please enter some text to chunk.');
      return;
    }
    setIsChunking(true);
    setError(null);
    try {
      const result = await fetchChunks(
        text, 
        strategy, 
        chunkSize, 
        chunkOverlap, 
        90,
        sentencesPerChunk,
        regexPattern
      );
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

  const handleSearch = async () => {
    if (!query.trim() || chunks.length === 0) return;
    setIsSearching(true);
    if (compareMode) setIsComparing(true);

    try {
      const result = await retrieveChunks(query, chunks, retrievalMethod, 5, useRerank);
      setRetrievedChunks(result.results);
      setLatencyMetrics((prev: any) => ({ ...prev, primary: result.latency_ms }));
      
      if (compareMode) {
        const compareRes = await retrieveChunks(query, chunks, compareMethod, 5, false);
        setCompareResults(compareRes.results);
        setLatencyMetrics((prev: any) => ({ ...prev, compare: compareRes.latency_ms }));
      }
    } catch (err: any) {
      setError(err.message || 'Search failed.');
    } finally {
      setIsSearching(false);
      setIsComparing(false);
    }
  };

  const handleExportBenchmark = () => {
    if (benchmarkResults.length === 0) return;
    const headers = "Name,Strategy,Hit Rate,Latency (ms),Estimated Cost,Chunk Count\n";
    const csvContent = "data:text/csv;charset=utf-8," + headers + 
      benchmarkResults.map(r => `${r.name},${r.strategy},${r.hit_rate},${r.latency_ms},${r.cost_score},${r.chunk_count}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "chunkscope_benchmark.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', padding: '0 40px' }}>
      <main style={{ maxWidth: '1240px', margin: '0 auto' }}>
        <Header />
        
        {/* Hero Section */}
        <section style={{ textAlign: 'center', margin: '60px 0 80px' }} className="animate-fade-in">
          <div className="badge" style={{ marginBottom: '28px' }}>Free RAG Optimization Tool</div>
          <h1 className="text-gradient" style={{ fontSize: '64px', fontWeight: 900, marginBottom: '20px', lineHeight: 1.1, letterSpacing: '-0.03em' }}>
            RAG Chunking Playground<br />
            <span style={{ color: 'white' }}>Visualize & Compare Strategies</span>
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '16px', maxWidth: '720px', margin: '0 auto', lineHeight: 1.7, fontWeight: 400 }}>
            How you split your documents matters more than which embedding model you pick. Paste any text and instantly see how different chunking strategies handle context, mid-word cuts, and semantic continuity.
          </p>
        </section>

        {/* Main Interface Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }} className="animate-fade-in">
          
          {/* Strategy Selector Tabs */}
          <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '16px', border: '1px solid var(--border)', width: 'fit-content', margin: '0 auto' }}>
            {['recursive', 'semantic', 'sentence', 'regex', 'fixed'].map((s) => (
              <button
                key={s}
                onClick={() => setStrategy(s)}
                style={{
                  padding: '10px 24px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                  border: 'none',
                  transition: 'all 0.2s',
                  background: strategy === s ? 'var(--primary)' : 'transparent',
                  color: strategy === s ? 'black' : 'rgba(255,255,255,0.5)',
                  fontFamily: "'Outfit', sans-serif"
                }}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="card" style={{ padding: '32px', background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.05)', display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '40px' }}>
            
            {/* Left Column: Text Input Area */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ position: 'relative' }}>
                <textarea 
                  value={text} 
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste your document here, upload a file, or click a sample below..."
                  style={{ 
                    width: '100%', 
                    height: '420px', 
                    background: 'rgba(0,0,0,0.5)', 
                    border: '1px solid var(--border)', 
                    borderRadius: '16px', 
                    padding: '24px', 
                    color: 'white', 
                    fontSize: '14px', 
                    lineHeight: 1.7, 
                    resize: 'none',
                    outline: 'none',
                    fontFamily: '"Inter", sans-serif',
                    boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.4)',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(34, 211, 238, 0.4)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                />
                <div style={{ position: 'absolute', bottom: '20px', left: '20px', display: 'flex', gap: '10px' }}>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    accept=".txt,.md,.pdf" 
                    style={{ display: 'none' }} 
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()} 
                    disabled={isUploading}
                    className="btn-secondary" 
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}
                  >
                     <span style={{ fontSize: '16px' }}>{isUploading ? '⏳' : '📁'}</span> 
                     {isUploading ? 'Uploading...' : 'Upload .txt / .md / .pdf'}
                  </button>
                  <button onClick={() => { setText(''); setChunks([]); }} className="btn-secondary" style={{ fontSize: '12px' }}>✕ Clear</button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {availableDatasets.map((d) => (
                  <button 
                    key={d.id} 
                    onClick={() => handleLoadDataset(d.id)}
                    className="btn-secondary" 
                    style={{ 
                      fontSize: '11px', 
                      padding: '8px 14px', 
                      background: selectedDatasetId === d.id ? 'rgba(34, 211, 238, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                      borderColor: selectedDatasetId === d.id ? 'var(--primary)' : 'var(--border)',
                      color: selectedDatasetId === d.id ? 'var(--primary)' : 'white'
                    }}
                  >
                    {d.name.includes(':') ? d.name.split(':')[1].trim() : d.name}
                  </button>
                ))}
              </div>
              
              <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                👉 Paste text or select a curated sample from above
              </div>
            </div>

            {/* Right Column: Interactive Configuration */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', padding: '10px 0' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                
                {/* Fixed/Recursive/Sentence/Regex Controls */}
                {(strategy !== 'semantic') && (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <label className="label-small">Chunk Size (Tokens)</label>
                        <span style={{ fontSize: '14px', fontWeight: 900, color: 'var(--primary)', fontFamily: "'Outfit', sans-serif" }}>{chunkSize}</span>
                      </div>
                      <input type="range" min="100" max="2000" step="50" value={chunkSize} onChange={(e) => setChunkSize(parseInt(e.target.value))} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <label className="label-small">Overlap (Tokens)</label>
                        <span style={{ fontSize: '14px', fontWeight: 900, color: 'var(--primary)', fontFamily: "'Outfit', sans-serif" }}>{chunkOverlap}</span>
                      </div>
                      <input type="range" min="0" max="500" step="10" value={chunkOverlap} onChange={(e) => setChunkOverlap(parseInt(e.target.value))} />
                    </div>
                  </>
                )}

                {/* Sentence Mode Extra Control */}
                {strategy === 'sentence' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <label className="label-small">Min Sentences</label>
                      <span style={{ fontSize: '14px', fontWeight: 900, color: 'var(--primary)', fontFamily: "'Outfit', sans-serif" }}>{sentencesPerChunk}</span>
                    </div>
                    <input type="range" min="1" max="20" value={sentencesPerChunk} onChange={(e) => setSentencesPerChunk(parseInt(e.target.value))} />
                  </div>
                )}

                {/* Regex Mode Context Control */}
                {strategy === 'regex' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <label className="label-small">Breakpoint Pattern</label>
                    <input 
                      type="text" 
                      value={regexPattern} 
                      onChange={(e) => setRegexPattern(e.target.value)}
                      style={{ 
                        width: '100%', 
                        background: 'rgba(0,0,0,0.5)', 
                        border: '1px solid var(--border)', 
                        borderRadius: '10px', 
                        padding: '14px', 
                        color: 'white', 
                        fontFamily: 'monospace', 
                        fontSize: '13px',
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }} 
                      onFocus={(e) => e.target.style.borderColor = 'rgba(34, 211, 238, 0.4)'}
                      onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                    />
                  </div>
                )}
                
                {/* Semantic Intensity Control */}
                {strategy === 'semantic' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <label className="label-small">Breakpoint Sensitivity</label>
                      <span style={{ fontSize: '14px', fontWeight: 900, color: 'var(--primary)', fontFamily: "'Outfit', sans-serif" }}>90%</span>
                    </div>
                    <input type="range" min="50" max="100" step="1" value={90} readOnly />
                  </div>
                )}
              </div>

              <button 
                onClick={handleRunChunking} 
                disabled={isChunking} 
                className={`btn-primary ${text.length > 20 ? 'pulse' : ''}`}
                style={{ width: '100%', height: '64px', fontSize: '18px', marginTop: 'auto' }}
              >
                {isChunking ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className="animate-spin" style={{ fontSize: '20px' }}>○</span> Processing Chunks...
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '22px' }}>○</span> Chunk It
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Visualization & Evaluation Results */}
          {chunks.length > 0 && (
            <div className="animate-fade-in" style={{ marginTop: '40px' }}>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '14px', width: 'fit-content', border: '1px solid var(--border)' }}>
                 <button 
                  onClick={() => setActiveTab('chunking')} 
                  style={{ 
                    background: activeTab === 'chunking' ? 'var(--primary)' : 'transparent', 
                    color: activeTab === 'chunking' ? '#000' : 'white', 
                    border: 'none', 
                    padding: '10px 24px', 
                    borderRadius: '10px', 
                    fontWeight: 800, 
                    fontSize: '13px', 
                    cursor: 'pointer',
                    fontFamily: "'Outfit', sans-serif"
                  }}
                 >
                   Workspace
                 </button>
                 <button 
                  onClick={() => setActiveTab('evaluation')} 
                  style={{ 
                    background: activeTab === 'evaluation' ? 'var(--primary)' : 'transparent', 
                    color: activeTab === 'evaluation' ? '#000' : 'white', 
                    border: 'none', 
                    padding: '10px 24px', 
                    borderRadius: '10px', 
                    fontWeight: 800, 
                    fontSize: '13px', 
                    cursor: 'pointer',
                    fontFamily: "'Outfit', sans-serif"
                  }}
                 >
                   RAG Evaluation
                 </button>
              </div>

              {activeTab === 'chunking' ? (
                <ChunkWorkspace chunks={chunks} strategy={strategy} />
              ) : (
                <>
                  <div className="card" style={{ padding: '40px', background: 'var(--surface)' }}>
                   <div style={{ display: 'flex', gap: '20px', marginBottom: '40px' }}>
                      <input 
                         type="text" 
                         placeholder="Test semantic retrieval with a natural language query..." 
                         value={query} onChange={(e) => setQuery(e.target.value)}
                         style={{ flex: 1, background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px', color: 'white', outline: 'none', fontSize: '15px' }}
                      />
                      <button 
                        onClick={handleSearch} 
                        disabled={isSearching} 
                        className="btn-primary" 
                        style={{ height: '60px', padding: '0 44px' }}
                      >
                        {isSearching ? '...' : 'Search Context'}
                      </button>
                   </div>

                   <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '48px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                         <div className="label-small" style={{ opacity: 0.6, marginBottom: '-8px' }}>Top Retrieved Results</div>
                         {retrievedChunks.length === 0 ? (
                           <div style={{ padding: '60px', textAlign: 'center', border: '2px dashed var(--border)', borderRadius: '20px', color: 'var(--muted)' }}>
                             Enter a search query to evaluate your chunking strategy.
                           </div>
                         ) : (
                           retrievedChunks.map((c, i) => (
                             <ResultCard key={i} chunk={c} rank={i} isRelevant={false} onToggle={() => {}} onAnalyze={() => explainChunkResult(c.index, false)} isAnalyzing={analyzingChunkIndex === c.index} />
                           ))
                         )}
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                         <div className="card" style={{ background: 'rgba(34, 211, 238, 0.03)', border: '1px solid rgba(34, 211, 238, 0.1)' }}>
                            <h4 className="label-small" style={{ marginBottom: '16px', color: 'var(--primary)' }}>Performance Metrics</h4>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                              <div style={{ fontSize: '42px', fontWeight: 900, color: 'white', fontFamily: "'Outfit', sans-serif" }}>{latencyMetrics.primary}</div>
                              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary)' }}>ms</div>
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>Retrieval Latency (Local Agent)</div>
                            
                            <hr style={{ margin: '24px 0', border: 'none', borderTop: '1px solid var(--border)' }} />
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                               <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Precision@5</span>
                                  <span style={{ fontSize: '14px', fontWeight: 700 }}>--</span>
                               </div>
                               <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span style={{ fontSize: '13px', color: 'var(--muted)' }}>MRR</span>
                                  <span style={{ fontSize: '14px', fontWeight: 700 }}>--</span>
                               </div>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Command Center: Multi-Strategy Benchmarking Dashboard */}
                <div style={{ marginTop: '80px', paddingTop: '80px', borderTop: '1px solid var(--border)' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                     <div>
                       <h2 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '8px' }}>Command Center: Cross-Strategy Benchmark</h2>
                       <p style={{ color: 'var(--muted)', fontSize: '14px' }}>Automatically compare different chunking configurations against your target data.</p>
                     </div>
                     {benchmarkResults.length > 0 && (
                       <button onClick={handleExportBenchmark} className="btn-secondary" style={{ padding: '10px 20px' }}>
                         📥 Export CSV Report
                       </button>
                     )}
                   </div>

                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.5rem 1.5fr', gap: '32px', marginBottom: '40px' }}>
                     <div className="card" style={{ background: 'var(--glass)' }}>
                       <h3 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '24px' }}>Run Multi-Strategy Test</h3>
                       
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                         <div>
                           <label className="label-small">Benchmark Query</label>
                           <input 
                             type="text" 
                             value={benchmarkQuery} 
                             onChange={(e) => setBenchmarkQuery(e.target.value)}
                             placeholder="Enter a standard query..."
                             style={{ width: '100%', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px', color: 'white', marginTop: '8px' }}
                           />
                         </div>
                         
                         <div>
                           <label className="label-small">Target Content (Ground Truth)</label>
                           <textarea 
                             value={benchmarkTarget} 
                             onChange={(e) => setBenchmarkTarget(e.target.value)}
                             placeholder="Paste the exact sentence that should be found..."
                             style={{ width: '100%', minHeight: '80px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px', color: 'white', marginTop: '8px', fontSize: '12px' }}
                           />
                         </div>

                         <button 
                           onClick={handleRunBenchmark} 
                           disabled={isBenchmarking || !text.trim()} 
                           className="btn-primary" 
                           style={{ width: '100%', height: '54px', marginTop: '10px' }}
                         >
                           {isBenchmarking ? 'Running Leaderboard...' : '🚀 Start Benchmarking'}
                         </button>
                       </div>
                     </div>

                     <div style={{ width: '1px', background: 'var(--border)', height: '100%' }}></div>

                     {benchmarkResults.length > 0 ? (
                       <div style={{ height: '400px' }}>
                         <StrategyRadarChart data={benchmarkResults} />
                       </div>
                     ) : (
                       <div style={{ border: '2px dashed var(--border)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: '14px', textAlign: 'center', padding: '40px' }}>
                         Run a benchmark to see visual trade-off analysis across Accuracy, Speed, and Cost.
                       </div>
                     )}
                   </div>

                   {benchmarkResults.length > 0 && (
                     <div className="animate-fade-in" style={{ marginBottom: '60px' }}>
                       <BenchmarkLeaderboard results={benchmarkResults} />
                     </div>
                    )}
                 </div>
                </>
              )}
            </div>
          )}
        </div>

        <Footer />
      </main>
      
      {error && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: 'var(--accent)', color: 'white', padding: '16px 24px', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', zIndex: 1000, fontWeight: 600 }}>
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}
