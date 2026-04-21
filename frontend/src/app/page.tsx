import Link from 'next/link';
import StatusIndicator from '@/components/StatusIndicator';

export default function Home() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <nav className="glass" style={{ 
        padding: '16px 40px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '32px', 
            height: '32px', 
            borderRadius: '8px', 
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '18px'
          }}>C</div>
          <h1 style={{ fontSize: '20px', fontWeight: 800 }}>ChunkScope</h1>
        </div>
        <StatusIndicator />
      </nav>

      {/* Hero Section */}
      <section style={{ 
        padding: '80px 40px', 
        maxWidth: '1200px', 
        margin: '0 auto', 
        textAlign: 'center' 
      }}>
        <div className="animate-fade-in">
          <span style={{ 
            background: 'rgba(34, 211, 238, 0.08)', 
            color: 'var(--primary)', 
            padding: '6px 16px', 
            borderRadius: '20px', 
            fontSize: '14px', 
            fontWeight: 600,
            marginBottom: '24px',
            border: '1px solid rgba(34, 211, 238, 0.2)',
            display: 'inline-block'
          }}>
            RAG Optimization Platform
          </span>
          <h2 style={{ fontSize: '56px', marginBottom: '24px', lineHeight: 1.1 }}>
            Stop guessing your <br />
            <span style={{ 
              background: 'linear-gradient(to right, #22d3ee, #0ea5e9)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>chunking strategy</span>
          </h2>
          <p className="text-muted" style={{ fontSize: '18px', maxWidth: '700px', margin: '0 auto 40px', lineHeight: 1.6 }}>
            Evaluate, compare, and optimize chunking strategies for real-world RAG systems.
            Visualize boundaries, measure retrieval performance, and simulate full pipelines.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <Link href="/playground">
              <button className="btn-primary" style={{ padding: '14px 32px', fontSize: '16px' }}>
                Launch Playground
              </button>
            </Link>
            <Link href="/documentation">
              <button className="glass" style={{ 
                padding: '14px 32px', 
                fontSize: '16px', 
                borderRadius: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.2)',
                backgroundColor: 'rgba(255,255,255,0.03)',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
              }}
              >
                View Documentation
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Preview Cards */}
      <section style={{ 
        padding: '0 40px 80px', 
        maxWidth: '1200px', 
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px'
      }}>
        <div className="card">
          <div style={{ color: 'var(--primary)', marginBottom: '16px', fontSize: '24px' }}>🧩</div>
          <h3 style={{ marginBottom: '12px' }}>Multi-Strategy Engine</h3>
          <p className="text-muted">Compare recursive, semantic, and fixed-size chunking side-by-side.</p>
        </div>
        <div className="card">
          <div style={{ color: 'var(--secondary)', marginBottom: '16px', fontSize: '24px' }}>📊</div>
          <h3 style={{ marginBottom: '12px' }}>Visual Inspector</h3>
          <p className="text-muted">Grade chunk quality and visualize context preservation in real-time.</p>
        </div>
        <div className="card">
          <div style={{ color: 'var(--accent)', marginBottom: '16px', fontSize: '24px' }}>🔍</div>
          <h3 style={{ marginBottom: '12px' }}>Retrieval Analytics</h3>
          <p className="text-muted">Measure Precision@K, Recall, and MRR to find the performance sweet spot.</p>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ 
        marginTop: 'auto', 
        padding: '40px', 
        borderTop: '1px solid var(--border)',
        textAlign: 'center',
        color: 'var(--muted)',
        fontSize: '14px'
      }}>
        &copy; 2026 ChunkScope AI. Built for RAG Excellence.
      </footer>
    </main>
  );
}
