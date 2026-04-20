import React from 'react';

interface StrategyMetrics {
  name: string;
  strategy: string;
  hit_rate: number;
  latency_ms: number;
  cost_score: number;
  chunk_count: number;
}

interface LeaderboardProps {
  results: StrategyMetrics[];
}

export default function BenchmarkLeaderboard({ results }: LeaderboardProps) {
  // Sort by hit_rate (primary) and latency (secondary)
  const sortedResults = [...results].sort((a, b) => {
    if (b.hit_rate !== a.hit_rate) return b.hit_rate - a.hit_rate;
    return a.latency_ms - b.latency_ms;
  });

  return (
    <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
      <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Strategy Leaderboard</h3>
        <span style={{ fontSize: '11px', color: 'var(--muted)', background: 'var(--glass)', padding: '4px 10px', borderRadius: '100px' }}>
          {results.length} Configurations Tested
        </span>
      </div>
      
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)', fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase' }}>
              <th style={{ padding: '12px 20px' }}>Rank</th>
              <th style={{ padding: '12px 20px' }}>Configuration</th>
              <th style={{ padding: '12px 20px' }}>Hit Rate</th>
              <th style={{ padding: '12px 20px' }}>Latency</th>
              <th style={{ padding: '12px 20px' }}>Est. Cost</th>
              <th style={{ padding: '12px 20px' }}>Verdict</th>
            </tr>
          </thead>
          <tbody>
            {sortedResults.map((res, index) => (
              <tr key={index} style={{ borderBottom: '1px solid var(--border)', fontSize: '13px' }}>
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ 
                    width: '24px', height: '24px', borderRadius: '50%', 
                    background: index === 0 ? 'var(--secondary)' : 'var(--glass)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', fontWeight: 800, color: index === 0 ? 'black' : 'white'
                  }}>
                    {index + 1}
                  </div>
                </td>
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ fontWeight: 600 }}>{res.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{res.strategy}</div>
                </td>
                <td style={{ padding: '16px 20px' }}>
                  <span style={{ color: res.hit_rate > 0 ? 'var(--secondary)' : 'var(--accent)', fontWeight: 700 }}>
                    {Math.round(res.hit_rate * 100)}%
                  </span>
                </td>
                <td style={{ padding: '16px 20px', color: 'var(--foreground)' }}>
                  {res.latency_ms}ms
                </td>
                <td style={{ padding: '16px 20px', color: 'var(--muted)' }}>
                  ${res.cost_score.toFixed(6)}
                </td>
                <td style={{ padding: '16px 20px' }}>
                  {index === 0 ? (
                    <span style={{ fontSize: '10px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '4px 8px', borderRadius: '4px', fontWeight: 700 }}>
                      BEST ACCURACY
                    </span>
                  ) : res.latency_ms < 100 ? (
                    <span style={{ fontSize: '10px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '4px 8px', borderRadius: '4px', fontWeight: 700 }}>
                      BEST SPEED
                    </span>
                  ) : (
                    <span style={{ color: 'var(--muted)', fontSize: '11px' }}>Sub-optimal</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
