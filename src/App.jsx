import { useState, useCallback } from 'react';
import api from './lib/api';
import StatusBar from './components/StatusBar';
import PartInput from './components/PartInput';
import ResultsTable from './components/ResultsTable';

export default function App() {
  const [serverStatus, setServerStatus] = useState(null);
  const [token, setToken] = useState(null);
  const [tokenExpiry, setTokenExpiry] = useState(null);
  const [parts, setParts] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  const isConfigured = serverStatus?.status === 'ready' || serverStatus?.status === 'connected';
  const isTokenValid = token && tokenExpiry && Date.now() < tokenExpiry;

  // Authenticate and get token
  const authenticate = useCallback(async () => {
    setError(null);
    try {
      const data = await api.authenticate();
      setToken(data.access_token);
      setTokenExpiry(Date.now() + (data.expires_in || 3600) * 1000);
      setServerStatus((prev) => ({ ...prev, status: 'connected' }));
      return data.access_token;
    } catch (e) {
      setError(`Authentication failed: ${e.message}`);
      return null;
    }
  }, []);

  // Fetch pricing
  const fetchPricing = useCallback(async () => {
    if (parts.length === 0) {
      setError('Add at least one part number first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Auto-authenticate if needed
      let currentToken = token;
      if (!isTokenValid) {
        currentToken = await authenticate();
        if (!currentToken) {
          setLoading(false);
          return;
        }
      }

      const data = await api.getPricing(currentToken, parts);
      setResults(data.results || []);
      setLastFetch(new Date());

      if (data.errors?.length) {
        setError(`Completed with ${data.errors.length} batch error(s): ${data.errors[0].message}`);
      }
    } catch (e) {
      // If token expired, try re-auth once
      if (e.message?.includes('401') || e.message?.includes('Unauthorized')) {
        try {
          const newToken = await authenticate();
          if (newToken) {
            const data = await api.getPricing(newToken, parts);
            setResults(data.results || []);
            setLastFetch(new Date());
            setLoading(false);
            return;
          }
        } catch (retryErr) {
          setError(`Retry failed: ${retryErr.message}`);
        }
      }
      setError(`Pricing lookup failed: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [parts, token, isTokenValid, authenticate]);

  return (
    <div className="app-shell">
      {/* Ambient background */}
      <div className="bg-ambient" />

      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <div className="logo-group">
            <div className="logo-mark">IM</div>
            <div>
              <h1 className="app-title">Ingram Micro Pricing</h1>
              <p className="app-subtitle">Price & Availability Tool</p>
            </div>
          </div>
          <StatusBar status={serverStatus} onStatusChange={setServerStatus} />
        </div>
      </header>

      {/* Main content */}
      <main className="main-content">
        {/* Setup banner if not configured */}
        {serverStatus?.status === 'needs_configuration' && (
          <div className="setup-banner">
            <div className="setup-icon">⚙️</div>
            <div>
              <h3 style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 700, marginBottom: '4px' }}>
                Environment Variables Required
              </h3>
              <p style={{ fontSize: '13px', lineHeight: 1.5 }}>
                Set these in your Vercel Dashboard → Settings → Environment Variables:
              </p>
              <div className="env-list">
                <code>INGRAM_CLIENT_ID</code>
                <code>INGRAM_CLIENT_SECRET</code>
                <code>INGRAM_CUSTOMER_NUMBER</code>
                <code>INGRAM_COUNTRY_CODE</code> <span style={{ color: 'var(--text-muted)' }}>(optional, default: US)</span>
                <code>INGRAM_USE_SANDBOX</code> <span style={{ color: 'var(--text-muted)' }}>(optional, default: true)</span>
              </div>
            </div>
          </div>
        )}

        {/* Part Input */}
        <PartInput parts={parts} onPartsChange={setParts} />

        {/* Fetch Button */}
        <button
          className="btn-fetch"
          onClick={fetchPricing}
          disabled={parts.length === 0 || loading || !isConfigured}
        >
          {loading ? (
            <span className="spinner-wrap">
              <span className="spinner" />
              Fetching Prices...
            </span>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              Get Pricing & Availability
              {parts.length > 0 && <span className="fetch-count">{parts.length}</span>}
            </>
          )}
        </button>

        {/* Error */}
        {error && (
          <div className="error-banner">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span style={{ flex: 1 }}>{error}</span>
            <button className="error-close" onClick={() => setError(null)}>×</button>
          </div>
        )}

        {/* Results */}
        <ResultsTable results={results} />

        {/* Footer info */}
        {lastFetch && results.length > 0 && (
          <div className="fetch-meta">
            Last updated: {lastFetch.toLocaleTimeString()} · {results.length} products returned
            {serverStatus?.config?.useSandbox && ' · Sandbox mode'}
          </div>
        )}
      </main>

      <style>{`
        .app-shell {
          min-height: 100vh;
          position: relative;
        }
        .bg-ambient {
          position: fixed;
          inset: 0;
          background:
            radial-gradient(ellipse 70% 50% at 50% -15%, rgba(59,130,246,0.07), transparent),
            radial-gradient(ellipse 50% 35% at 85% 100%, rgba(139,92,246,0.04), transparent);
          pointer-events: none;
          z-index: 0;
        }

        /* Header */
        .header {
          position: sticky;
          top: 0;
          z-index: 50;
          border-bottom: 1px solid var(--border);
          background: rgba(10, 12, 16, 0.88);
          backdrop-filter: blur(20px);
        }
        .header-inner {
          max-width: 1100px;
          margin: 0 auto;
          padding: 14px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .logo-group {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .logo-mark {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 15px;
          color: #fff;
          font-family: var(--font-mono);
          letter-spacing: -0.5px;
          box-shadow: 0 2px 12px rgba(59, 130, 246, 0.25);
        }
        .app-title {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.3px;
        }
        .app-subtitle {
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 1px;
          letter-spacing: 0.02em;
        }

        /* Main */
        .main-content {
          max-width: 1100px;
          margin: 0 auto;
          padding: 24px;
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        /* Setup banner */
        .setup-banner {
          display: flex;
          gap: 16px;
          padding: 20px;
          border-radius: var(--radius);
          background: var(--surface);
          border: 1px solid var(--amber);
          border-left: 4px solid var(--amber);
          animation: fadeIn 0.3s ease;
        }
        .setup-icon { font-size: 24px; }
        .env-list {
          margin-top: 8px;
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          align-items: center;
        }
        .env-list code {
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 4px;
          background: var(--surface-3);
          color: var(--accent);
          border: 1px solid var(--border);
        }

        /* Fetch button */
        .btn-fetch {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 14px 28px;
          background: var(--accent);
          border-radius: var(--radius);
          color: #fff;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: -0.2px;
          transition: all 0.2s ease;
          box-shadow: 0 2px 12px rgba(59, 130, 246, 0.2);
        }
        .btn-fetch:hover:not(:disabled) {
          background: var(--accent-hover);
          box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
          transform: translateY(-1px);
        }
        .btn-fetch:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        .fetch-count {
          font-size: 11px;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 10px;
          background: rgba(255,255,255,0.2);
          font-family: var(--font-mono);
        }
        .spinner-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .spinner {
          display: inline-block;
          width: 18px;
          height: 18px;
          border: 2.5px solid rgba(255,255,255,0.25);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        /* Error */
        .error-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-radius: var(--radius-sm);
          background: var(--red-soft);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #fca5a5;
          font-size: 13px;
          animation: fadeIn 0.2s ease;
        }
        .error-close {
          color: #fca5a5;
          font-size: 18px;
          line-height: 1;
          padding: 2px 6px;
        }

        /* Footer meta */
        .fetch-meta {
          text-align: center;
          font-size: 11px;
          color: var(--text-muted);
          font-family: var(--font-mono);
          padding: 8px;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .header-inner { padding: 12px 16px; }
          .main-content { padding: 16px; }
          .app-title { font-size: 14px; }
        }
      `}</style>
    </div>
  );
}
