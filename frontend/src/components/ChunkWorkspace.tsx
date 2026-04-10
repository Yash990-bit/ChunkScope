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
  token_count_estimated: number;
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
        height: '400px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        border: '2px dashed var(--border)',
        borderRadius: '12px',
        color: 'var(--muted)'
      }}>
        Input text and run chunking to see results here.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '18px' }}>
          Chunks ({chunks.length})
        </h3>
        <span style={{ fontSize: '14px', color: 'var(--primary)', fontWeight: 600 }}>
          Strategy: {strategy.charAt(0).toUpperCase() + strategy.slice(1)}
        </span>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
        gap: '16px' 
      }}>
        {chunks.map((chunk) => (
          <div key={chunk.index} className="card" style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '12px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              borderBottom: '1px solid var(--border)',
              paddingBottom: '8px'
            }}>
              <span style={{ fontSize: '12px', fontWeight: 700, opacity: 0.5 }}>
                CHUNK #{chunk.index + 1}
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ 
                  fontSize: '10px', 
                  background: 'var(--glass)', 
                  padding: '2px 6px', 
                  borderRadius: '4px',
                  border: '1px solid var(--glass-border)'
                }}>
                  {chunk.metadata.char_count} chars
                </span>
                <span style={{ 
                  fontSize: '10px', 
                  background: 'var(--glass)', 
                  padding: '2px 6px', 
                  borderRadius: '4px',
                  border: '1px solid var(--glass-border)'
                }}>
                  ~{chunk.metadata.token_count_estimated} tokens
                </span>
              </div>
            </div>
            
            <div style={{ 
              fontSize: '14px', 
              lineHeight: 1.5, 
              maxHeight: '150px', 
              overflowY: 'auto',
              color: 'var(--foreground)',
              opacity: 0.9,
              fontFamily: 'monospace'
            }}>
              {chunk.content}
            </div>

            {chunk.metadata.warnings && chunk.metadata.warnings.length > 0 && (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '4px',
                marginTop: '4px'
              }}>
                {chunk.metadata.warnings.map((w, idx) => (
                  <div key={idx} style={{ 
                    fontSize: '10px', 
                    color: w.severity === 'high' ? 'var(--accent)' : '#f59e0b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <span>⚠️</span>
                    <span>{w.message}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ 
              marginTop: 'auto',
              fontSize: '11px',
              color: 'var(--muted)',
              display: 'flex',
              justifyContent: 'spaceBetween'
            }}>
              <span>Start index: {chunk.metadata.start_index}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
