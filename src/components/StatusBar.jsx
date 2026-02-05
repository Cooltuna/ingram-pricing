import { useEffect, useState } from 'react';
import api from '../lib/api';

export default function StatusBar({ status, onStatusChange }) {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    setChecking(true);
    try {
      const data = await api.checkStatus();
      onStatusChange(data);
    } catch {
      onStatusChange({ status: 'error', message: 'Cannot reach API server' });
    } finally {
      setChecking(false);
    }
  };

  if (checking) return null;

  const isReady = status?.status === 'ready';
  const isConnected = status?.status === 'connected';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 12px',
        borderRadius: '20px',
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
        cursor: 'pointer',
      }}
      onClick={checkStatus}
      title="Click to refresh status"
    >
      <div
        style={{
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          background: isConnected
            ? 'var(--green)'
            : isReady
            ? 'var(--amber)'
            : 'var(--red)',
          boxShadow: isConnected
            ? '0 0 6px rgba(34,197,94,0.5)'
            : 'none',
        }}
      />
      <span
        style={{
          fontSize: '11px',
          fontWeight: 600,
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
          letterSpacing: '0.02em',
        }}
      >
        {isConnected
          ? 'CONNECTED'
          : isReady
          ? 'READY'
          : status?.status === 'needs_configuration'
          ? 'NOT CONFIGURED'
          : 'OFFLINE'}
      </span>
      {status?.config?.useSandbox && (
        <span
          style={{
            fontSize: '9px',
            fontWeight: 800,
            padding: '1px 5px',
            borderRadius: '3px',
            background: 'var(--accent-soft)',
            color: 'var(--accent)',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.05em',
          }}
        >
          SANDBOX
        </span>
      )}
    </div>
  );
}
