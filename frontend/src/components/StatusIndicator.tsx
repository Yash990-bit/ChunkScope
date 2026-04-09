'use client';

import { useEffect, useState } from 'react';
import { fetchHealth } from '@/lib/api';

export default function StatusIndicator() {
  const [status, setStatus] = useState<'healthy' | 'offline' | 'loading'>('loading');

  useEffect(() => {
    const checkStatus = async () => {
      const data = await fetchHealth();
      setStatus(data.status === 'healthy' ? 'healthy' : 'offline');
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500 }}>
      <div 
        style={{ 
          width: '8px', 
          height: '8px', 
          borderRadius: '50%', 
          backgroundColor: status === 'healthy' ? '#10b981' : status === 'offline' ? '#ef4444' : '#f59e0b'
        }} 
      />
      <span style={{ color: 'var(--muted)' }}>
        Backend: {status === 'healthy' ? 'Connected' : status === 'offline' ? 'Disconnected' : 'Checking...'}
      </span>
    </div>
  );
}
