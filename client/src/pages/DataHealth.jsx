import { useState } from 'react';
import { useFinancialData } from '../hooks/useFinancialData';
import ArcGauge from '../components/ArcGauge';
import AlertBadge from '../components/AlertBadge';
import Argusbubble from '../components/Argusbubble';
import Tooltip from '../components/Tooltip';
import '../styles/app.css';

function HowToFixModal({ anomaly, onClose }) {
  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 className="modal-title" style={{ marginBottom: 16 }}>How to fix this issue</h2>
        <div className="fix-modal-content">
          <Argusbubble
            message={anomaly.suggestedFix}
            severity="info"
            dismissible={false}
          />
          <p className="fix-modal-desc" style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
            <strong style={{ color: 'var(--color-text)' }}>Issue:</strong> {anomaly.description}
          </p>
          {anomaly.amount > 0 && (
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--color-text-muted)' }}>
              Amount: ${anomaly.amount.toLocaleString()}
            </p>
          )}
        </div>
        <div className="modal-actions" style={{ marginTop: 24 }}>
          <button className="btn-primary" onClick={onClose}>Got it</button>
        </div>
      </div>
    </div>
  );
}

function ScorePanel({ title, score, penalties }) {
  const checkmark = score > 95 ? '✓' : null;
  return (
    <div className="card" style={{ height: '100%' }}>
      <div className="card-title">
        <Tooltip term="confidence score">{title}</Tooltip>
      </div>
      <ArcGauge score={score} label={title} />
      <div className="penalty-list" style={{ marginTop: 20 }}>
        {penalties.length === 0 && (
          <div className="penalty-item ok">
            <span className="penalty-label">No issues detected</span>
            <span className="penalty-value green">+0</span>
          </div>
        )}
        {penalties.map((p, i) => (
          <div key={i} className="penalty-item negative">
            <span className="penalty-label">✗ {p.label}</span>
            <span className="penalty-value red">−{p.penalty}</span>
          </div>
        ))}
        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '10px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--color-text)' }}>
          <span>Score</span>
          <span>{score}/100</span>
        </div>
      </div>
    </div>
  );
}

export default function DataHealth() {
  const { data, isLoading } = useFinancialData();
  const [fixModal, setFixModal] = useState(null);
  const [resolved, setResolved] = useState(new Set());
  const [ignored, setIgnored] = useState(new Set());

  if (isLoading && !data) return (
    <div className="page">
      <div className="page-header">
        <div className="skeleton" style={{ height: 28, width: 160, marginBottom: 8 }} />
        <div className="skeleton skeleton-text" style={{ width: 280 }} />
      </div>
      <div className="gauges-grid">
        {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 280 }} />)}
      </div>
      <div className="skeleton" style={{ height: 220 }} />
    </div>
  );

  if (!data) return (
    <div className="page">
      <div className="no-data">
        <div className="no-data-title">No data loaded</div>
        <p className="no-data-sub">Upload a CSV to see your data health scores and issue center.</p>
      </div>
    </div>
  );

  const { confidenceScores, anomalies } = data;
  const { revenue, cashFlow, expenses } = confidenceScores;

  const visibleIssues = anomalies.filter((_, i) => !resolved.has(i) && !ignored.has(i));

  const severityLabel = { low: 'Low', medium: 'Medium', high: 'High' };
  const impactMap = { high: 'High impact', medium: 'Medium impact', low: 'Low impact' };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Data Health</h1>
        <p className="page-subtitle">
          Your <Tooltip term="confidence score">confidence scores</Tooltip> with a full penalty breakdown. Fix the highest-impact issues first.
        </p>
      </div>

      <div className="gauges-grid">
        <ScorePanel title="Revenue" score={revenue.score} penalties={revenue.penalties} />
        <ScorePanel title="Cash Flow" score={cashFlow.score} penalties={cashFlow.penalties} />
        <ScorePanel title="Expenses" score={expenses.score} penalties={expenses.penalties} />
      </div>

      {/* Issue center */}
      <div className="card">
        <div className="card-title">Issue Center — {visibleIssues.length} open</div>
        {visibleIssues.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>All issues resolved or ignored.</p>
        ) : (
          <table className="issue-table">
            <thead>
              <tr>
                <th>Issue</th>
                <th>Severity</th>
                <th>Impact on Score</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleIssues.map((a, i) => (
                <tr key={i}>
                  <td style={{ maxWidth: '320px' }}>{a.description}</td>
                  <td><AlertBadge severity={a.severity} /></td>
                  <td style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)', fontSize: '12px' }}>
                    {impactMap[a.severity]}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="issue-action-btn" onClick={() => setResolved((s) => new Set([...s, i]))}>
                        Mark Resolved
                      </button>
                      <button className="issue-action-btn" onClick={() => setIgnored((s) => new Set([...s, i]))}>
                        Ignore
                      </button>
                      <button
                        className="issue-action-btn"
                        style={{ color: 'var(--color-primary)', borderColor: 'rgba(0,168,168,0.3)' }}
                        onClick={() => setFixModal(a)}
                      >
                        How to Fix
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {fixModal && <HowToFixModal anomaly={fixModal} onClose={() => setFixModal(null)} />}
    </div>
  );
}
