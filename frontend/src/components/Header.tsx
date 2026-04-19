'use client';

import Link from 'next/link';

export default function Header() {
  return (
    <nav style={{ 
      padding: '32px 0 24px', 
      display: 'flex', 
      alignItems: 'center',
      gap: '10px',
      fontSize: '13px',
      color: 'var(--muted)',
      fontWeight: 500,
      fontFamily: "'Outfit', sans-serif"
    }}>
      <Link href="/" style={{ transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = 'white'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--muted)'}>Home</Link>
      <span style={{ opacity: 0.3 }}>/</span>
      <Link href="#" style={{ transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = 'white'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--muted)'}>Tools</Link>
      <span style={{ opacity: 0.3 }}>/</span>
      <span style={{ color: 'white', fontWeight: 700 }}>RAG Chunking Playground</span>
    </nav>
  );
}
