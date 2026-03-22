import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { downloadMarkdown, getCompletionStats } from '../utils/export.js';

export default function ExportBar({ onApiKeyClick }) {
  const { state, setView } = useApp();
  const stats = getCompletionStats(state);
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      downloadMarkdown(state);
    } catch (e) {
      console.error('Export failed:', e);
    }
    setTimeout(() => setExporting(false), 1500);
  }

  return (
    <div className="export-bar">
      <div className="export-bar-left">
        <div className="export-bar-logo">
          VISIBILITY <span>INFRASTRUCTURE</span> OS
        </div>
        <div className="export-bar-progress">
          <strong>{stats.completed}</strong>/{stats.total} modules complete &nbsp;·&nbsp; <strong>{stats.percent}%</strong>
        </div>
      </div>

      <div className="export-bar-right">
        {!state.apiKey && (
          <button
            style={{
              padding: '6px 14px',
              background: 'rgba(223,178,74,0.12)',
              border: '1px solid rgba(223,178,74,0.3)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--gold)',
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
            onClick={onApiKeyClick}
          >
            🔒 Add API Key
          </button>
        )}

        <button className="btn-export" onClick={handleExport} disabled={stats.completed === 0}>
          {exporting ? '⏳ Exporting...' : '⬇ Export Strategy Doc'}
        </button>

        <button
          style={{
            padding: '6px 14px',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 'var(--radius-sm)',
            color: 'rgba(255,255,255,0.35)',
            fontSize: '0.72rem',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
          onClick={() => setView('landing')}
        >
          ← Home
        </button>
      </div>
    </div>
  );
}
