import Link from 'next/link';

export default function Documentation() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <nav className="glass" style={{ 
        padding: '16px 40px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '28px', 
            height: '28px', 
            borderRadius: '6px', 
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '14px'
          }}>C</div>
          <h1 style={{ fontSize: '18px', fontWeight: 800 }}>ChunkScope</h1>
        </Link>
        <Link href="/playground">
          <button className="btn-secondary">Launch Playground</button>
        </Link>
      </nav>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '80px 40px' }}>
        <article className="animate-fade-in">
          <div className="badge" style={{ marginBottom: '24px' }}>Documentation</div>
          <h1 style={{ fontSize: '48px', marginBottom: '16px' }}>Master Your RAG Strategy</h1>
          <p className="text-muted" style={{ fontSize: '18px', marginBottom: '60px', lineHeight: 1.6 }}>
            The definitive guide to optimizing chunking, retrieval, and generation using ChunkScope.
          </p>

          <section style={{ marginBottom: '80px' }}>
            <h2 style={{ fontSize: '28px', marginBottom: '24px', color: 'var(--primary)' }}>1. What is ChunkScope?</h2>
            <div className="card" style={{ padding: '32px' }}>
              <p style={{ lineHeight: 1.8, marginBottom: '20px' }}>
                ChunkScope is a visual RAG analytics platform that helps you build better AI systems by eliminating the guesswork in how you process and retrieve data. 
              </p>
              <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '16px' }}>
                <li style={{ display: 'flex', gap: '12px' }}>
                  <span style={{ color: 'var(--primary)' }}>✔</span> 
                  <span><strong>Visualize Boundaries:</strong> See exactly where your documents are being split.</span>
                </li>
                <li style={{ display: 'flex', gap: '12px' }}>
                  <span style={{ color: 'var(--primary)' }}>✔</span> 
                  <span><strong>Benchmark Results:</strong> Compare Vector, BM25, and Hybrid search logic.</span>
                </li>
                <li style={{ display: 'flex', gap: '12px' }}>
                  <span style={{ color: 'var(--primary)' }}>✔</span> 
                  <span><strong>Evaluate Quality:</strong> Measure Precision, Recall, and Groundedness automatically.</span>
                </li>
              </ul>
            </div>
          </section>

          <section style={{ marginBottom: '80px' }}>
            <h2 style={{ fontSize: '28px', marginBottom: '24px', color: 'var(--secondary)' }}>2. Chunking Strategies</h2>
            <p style={{ marginBottom: '24px', color: 'var(--muted)', lineHeight: 1.6 }}>
              Choosing the right strategy is the foundation of a high-performance RAG pipeline.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="card">
                <h4 style={{ color: 'var(--primary)', marginBottom: '12px' }}>Recursive Character</h4>
                <p style={{ fontSize: '14px', lineHeight: 1.6 }}>Splits text based on common separators like newlines and spaces. Best for maintaining structural hierarchy.</p>
              </div>
              <div className="card">
                <h4 style={{ color: 'var(--secondary)', marginBottom: '12px' }}>Semantic</h4>
                <p style={{ fontSize: '14px', lineHeight: 1.6 }}>Uses embeddings to find natural "meaning" boundaries. Best for complex, conversational documents.</p>
              </div>
              <div className="card">
                <h4 style={{ color: 'white', marginBottom: '12px' }}>Fixed Size</h4>
                <p style={{ fontSize: '14px', lineHeight: 1.6 }}>The simplest method, splitting strictly by character count. Good for baseline comparisons.</p>
              </div>
              <div className="card">
                <h4 style={{ color: 'var(--accent)', marginBottom: '12px' }}>Token-Based</h4>
                <p style={{ fontSize: '14px', lineHeight: 1.6 }}>Splits based on LLM token limits (e.g., Tiktoken). Essential for preventing context overflow.</p>
              </div>
            </div>
          </section>

          <section style={{ marginBottom: '80px' }}>
            <h2 style={{ fontSize: '28px', marginBottom: '24px', color: 'var(--accent)' }}>3. Understanding Metrics</h2>
            <div className="card" style={{ padding: '32px', background: 'rgba(244, 63, 94, 0.03)', borderColor: 'rgba(244, 63, 94, 0.2)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '15px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ textAlign: 'left', padding: '12px', color: 'var(--muted)' }}>Metric</th>
                    <th style={{ textAlign: 'left', padding: '12px', color: 'var(--muted)' }}>What it measures</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px', fontWeight: 600 }}>Precision@K</td>
                    <td style={{ padding: '12px' }}>Percentage of retrieved chunks that are actually relevant.</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px', fontWeight: 600 }}>Recall@K</td>
                    <td style={{ padding: '12px' }}>How many of the total relevant chunks were successfully retrieved.</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px', fontWeight: 600 }}>MRR</td>
                    <td style={{ padding: '12px' }}>The rank of the first relevant chunk (higher is better).</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '12px', fontWeight: 600 }}>Latency</td>
                    <td style={{ padding: '12px' }}>Time taken to process and retrieve results in milliseconds.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <footer style={{ borderTop: '1px solid var(--border)', paddingTop: '40px', textAlign: 'center' }}>
            <p style={{ marginBottom: '24px' }}>Ready to optimize your pipeline?</p>
            <Link href="/playground">
              <button className="btn-primary" style={{ margin: '0 auto' }}>Launch Playground Now</button>
            </Link>
          </footer>
        </article>
      </div>
    </main>
  );
}
