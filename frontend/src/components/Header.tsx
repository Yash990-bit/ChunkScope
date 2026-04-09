'use client';

import Link from 'next/link';
import StatusIndicator from './StatusIndicator';

export default function Header() {
  return (
    <nav className="glass" style={{ 
      padding: '16px 40px', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
        <div style={{ 
          width: '32px', 
          height: '32px', 
          borderRadius: '8px', 
          background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          fontSize: '18px',
          color: 'white'
        }}>C</div>
        <h1 style={{ fontSize: '20px', fontWeight: 800 }}>ChunkScope</h1>
      </Link>
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <Link href="/playground" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--foreground)' }}>Playground</Link>
        <Link href="#" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--muted)' }}>Evaluation</Link>
        <StatusIndicator />
      </div>
    </nav>
  );
}
