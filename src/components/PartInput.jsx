import { useRef, useState } from 'react';
import { parseCSV } from '../lib/csv';

export default function PartInput({ parts, onPartsChange }) {
  const [input, setInput] = useState('');
  const [inputType, setInputType] = useState('ingram');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const addParts = () => {
    if (!input.trim()) return;
    const newParts = input
      .split(/[,\n;]+/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) =>
        inputType === 'vendor'
          ? { vendorPartNumber: p, displayNumber: p, type: 'VPN' }
          : { ingramPartNumber: p, displayNumber: p, type: 'IPN' }
      );
    onPartsChange([...parts, ...newParts]);
    setInput('');
  };

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const parsed = parseCSV(e.target.result);
      onPartsChange([...parts, ...parsed]);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.csv') || file.name.endsWith('.txt') || file.name.endsWith('.tsv'))) {
      handleFile(file);
    }
  };

  const removePart = (idx) => onPartsChange(parts.filter((_, i) => i !== idx));
  const clearAll = () => onPartsChange([]);

  return (
    <div className="card" style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Header */}
      <div className="card-header">
        <h2 className="card-title">Part Numbers</h2>
        <span className="count-badge">{parts.length}</span>
      </div>

      {/* Type toggle */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
        <div className="toggle-group">
          <button
            className={`toggle-btn ${inputType === 'ingram' ? 'active' : ''}`}
            onClick={() => setInputType('ingram')}
          >
            Ingram P/N
          </button>
          <button
            className={`toggle-btn ${inputType === 'vendor' ? 'active' : ''}`}
            onClick={() => setInputType('vendor')}
          >
            Vendor P/N
          </button>
        </div>
      </div>

      {/* Input area */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
        <textarea
          className="text-input mono"
          placeholder={'Enter part numbers separated by commas, semicolons, or new lines\ne.g. 4A0036, 01RW10, QQ0202'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              addParts();
            }
          }}
          rows={3}
          style={{ flex: 1, resize: 'vertical' }}
        />
        <button className="btn-add" onClick={addParts}>
          + Add
        </button>
      </div>

      {/* File upload */}
      <div
        className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <span>Drop a CSV file here or <u>browse</u></span>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.txt,.tsv"
          onChange={(e) => handleFile(e.target.files?.[0])}
          style={{ display: 'none' }}
        />
      </div>

      {/* Chips */}
      {parts.length > 0 && (
        <div className="chips-container">
          {parts.map((p, i) => (
            <div key={i} className="chip">
              <span className="chip-type">{p.type}</span>
              <span className="chip-text">{p.displayNumber}</span>
              <button className="chip-remove" onClick={() => removePart(i)} title="Remove">
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      {parts.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button className="btn-ghost" onClick={clearAll}>
            Clear all
          </button>
        </div>
      )}

      <style>{`
        .card {
          background: var(--surface);
          border-radius: var(--radius);
          border: 1px solid var(--border);
          padding: 24px;
        }
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .card-title {
          font-size: 15px;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.2px;
        }
        .count-badge {
          font-size: 12px;
          font-weight: 700;
          padding: 2px 10px;
          border-radius: 20px;
          background: var(--surface-3);
          color: var(--text-muted);
          font-family: var(--font-mono);
        }
        .toggle-group {
          display: flex;
          background: var(--surface-2);
          border-radius: var(--radius-sm);
          padding: 3px;
          border: 1px solid var(--border);
        }
        .toggle-btn {
          padding: 6px 16px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-muted);
          background: transparent;
        }
        .toggle-btn.active {
          background: var(--accent);
          color: #fff;
        }
        .text-input {
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 10px 12px;
          font-size: 13px;
          color: var(--text-primary);
          line-height: 1.5;
          transition: border-color var(--transition), box-shadow var(--transition);
          width: 100%;
        }
        .text-input.mono {
          font-family: var(--font-mono);
          font-size: 12px;
        }
        .btn-add {
          padding: 10px 20px;
          background: var(--surface-3);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          color: var(--text-primary);
          font-weight: 600;
          font-size: 13px;
          white-space: nowrap;
          align-self: stretch;
        }
        .btn-add:hover {
          background: var(--surface-hover);
          border-color: var(--border-light);
        }
        .drop-zone {
          margin-top: 12px;
          padding: 16px;
          border: 1.5px dashed var(--border);
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: var(--text-muted);
          font-size: 12px;
          cursor: pointer;
          transition: all var(--transition);
        }
        .drop-zone:hover, .drop-zone.drag-over {
          border-color: var(--accent);
          background: var(--accent-soft);
          color: var(--accent);
        }
        .chips-container {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 14px;
          max-height: 180px;
          overflow-y: auto;
          padding: 2px;
        }
        .chip {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 6px;
          border-radius: var(--radius-sm);
          background: var(--surface-2);
          border: 1px solid var(--border);
          font-size: 12px;
          animation: fadeIn 0.15s ease;
        }
        .chip-type {
          font-size: 9px;
          font-weight: 800;
          font-family: var(--font-mono);
          color: var(--accent);
          letter-spacing: 0.05em;
          padding: 1px 4px;
          border-radius: 3px;
          background: var(--accent-soft);
        }
        .chip-text {
          font-family: var(--font-mono);
          font-weight: 500;
          color: var(--text-primary);
        }
        .chip-remove {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          border-radius: 3px;
          color: var(--text-muted);
          font-size: 14px;
          line-height: 1;
        }
        .chip-remove:hover {
          background: var(--red-soft);
          color: var(--red);
        }
        .btn-ghost {
          padding: 6px 12px;
          color: var(--text-muted);
          font-size: 12px;
          font-weight: 500;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .btn-ghost:hover {
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
}
