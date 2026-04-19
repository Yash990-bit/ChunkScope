'use client';

import React from 'react';

interface Warning {
  type: string;
  severity: string;
  message: string;
}

interface ChunkMetadata {
  start_index: number;
  char_count: number;
  token_count?: number;
  warnings?: Warning[];
}

interface Chunk {
  index: number;
  content: string;
  metadata: ChunkMetadata;
}

interface ChunkWorkspaceProps {
  chunks: Chunk[];
  strategy: string;
}

export default function ChunkWorkspace({ chunks, strategy }: ChunkWorkspaceProps) {
  if (chunks.length === 0) {
    return (
      <div style={{ 
        height: '300px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        border: '2px dashed var(--border)',
        borderRadius: '20px',
        color: 'var(--muted)',
        background: 'rgba(15, 23, 42, 0.2)'
      }}>
        Input text and run chunking to see results here.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>
          Generated Chunks <span style={{ color: 'var(--muted)', fontWeight: 400, marginLeft: '8px', fontFamily: "'Inter', sans-serif" }}>({chunks.length})</span>
        </h3>
        <div className="badge">
          Strategy: {strategy.charAt(0).toUpperCase() + strategy.slice(1)}
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
        gap: '24px' 
      }}>
        {chunks.map((chunk) => (
          <div key={chunk.index} className="card" style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '16px',
            position: 'relative',
            overflow: 'hidden',
            background: 'rgba(15, 23, 42, 0.4)',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              borderBottom: '1px solid var(--border)',
              paddingBottom: '12px'
            }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary)', opacity: 0.8 }}>
                CHUNK #{chunk.index + 1}
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ 
                  fontSize: '10px', 
                  background: 'rgba(255,255,255,0.05)', 
                  padding: '4px 8px', 
                  borderRadius: '6px',
                  color: 'var(--muted)',
                  fontWeight: 600
                }}>
                  {chunk.metadata.char_count} chars
                </span>
                {chunk.metadata.token_count && (
                  <span style={{ 
                    fontSize: '10px', 
                    background: 'rgba(34, 211, 238, 0.1)', 
                    padding: '4px 8px', 
                    borderRadius: '6px',
                    color: 'var(--primary)',
                    fontWeight: 700
                  }}>
                    {chunk.metadata.token_count} tokens
                  </span>
                )}
              </div>
            </div>
            
            <div style={{ 
              fontSize: '13px', 
              lineHeight: 1.6, 
              maxHeight: '180px', 
              overflowY: 'auto',
              color: 'var(--foreground)',
              opacity: 0.9,
              fontFamily: 'monospace',
              paddingRight: '4px'
            }}>
              {chunk.content}
            </div>

            {chunk.metadata.warnings && chunk.metadata.warnings.length > 0 && (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '6px',
                marginTop: '4px',
                padding: '10px',
                background: 'rgba(244, 63, 94, 0.05)',
                borderRadius: '8px',
                border: '1px solid rgba(244, 63, 94, 0.1)'
              }}>
                {chunk.metadata.warnings.map((w, idx) => (
                  <div key={idx} style={{ 
                    fontSize: '10px', 
                    color: w.severity === 'high' ? 'var(--accent)' : '#f59e0b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span>⚠️</span>
                    <span style={{ fontWeight: 500 }}>{w.message}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ 
              marginTop: 'auto',
              fontSize: '10px',
              color: 'var(--muted)',
              display: 'flex',
              justifyContent: 'space-between',
              opacity: 0.6,
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              <span>Start index: {chunk.metadata.start_index}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
