import { useFinancialData } from '../hooks/useFinancialData';
import AlertBadge from '../components/AlertBadge';
import Argusbubble from '../components/Argusbubble';
import Tooltip from '../components/Tooltip';
import '../styles/app.css';

const BENCHMARKS = [
  { label: 'Payroll as % of revenue',           median: 24 },
  { label: 'Marketing as % of revenue',          median: 8 },
  { label: 'Operating expenses as % of revenue', median: 35 },
];

function BenchmarkPanel({ revenue, categoryBreakdown }) {
  const total = categoryBreakdown.reduce((s, c) => s + c.amount, 0);

  const getYourPct = (label) => {
    if (!revenue) return 0;
    if (label.startsWith('Payroll')) {
      const pay = categoryBreakdown.find((c) => c.category.toLowerCase().includes('payroll'));
      return revenue > 0 ? Math.round(((pay?.amount || 0) / revenue) * 100) : 0;
    }
    if (label.startsWith('Marketing')) {
      const mkt = categoryBreakdown.find((c) => c.category.toLowerCase().includes('marketing'));
      return revenue > 0 ? Math.round(((mkt?.amount || 0) / revenue) * 100) : 0;
    }
    // Operating expenses
    return revenue > 0 ? Math.round((total / revenue) * 100) : 0;
  };

  return (
    <div className="card" style={{ marginBottom: '24px' }}>
      <div className="card-title">Industry Benchmarks — Retail / Services SMB</div>
      {BENCHMARKS.map((b, i) => {
        const yours = getYourPct(b.label);
        const maxBar = Math.max(yours, b.median, 1);
        return (
          <div key={i} className="benchmark-item">
            <div className="benchmark-label">{b.label}</div>
            <div className="benchmark-bars">
              <div className="benchmark-bar-row">
                <span className="benchmark-bar-label" style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                  Yours {yours}%
                </span>
                <div className="benchmark-bar-track">
                  <div className="benchmark-bar-fill yours" style={{ width: `${(yours / maxBar) * 100}%` }} />
                </div>
              </div>
              <div className="benchmark-bar-row">
                <span className="benchmark-bar-label" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                  Median {b.median}%
                </span>
                <div className="benchmark-bar-track">
                  <div className="benchmark-bar-fill median" style={{ width: `${(b.median / maxBar) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const TYPE_LABELS = { duplicate: 'Duplicate', gap: 'Gap', spike: 'Spike', uncategorized: 'Uncategorized' };

export default function Insights() {
  const { data, isLoading } = useFinancialData();

  if (isLoading && !data) return (
    <div className="page">
      <div className="page-header">
        <div className="skeleton" style={{ height: 28, width: 120, marginBottom: 8 }} />
        <div className="skeleton skeleton-text" style={{ width: 300 }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 120 }} />)}
      </div>
      <div className="skeleton" style={{ height: 180 }} />
    </div>
  );

  if (!data) return (
    <div className="page">
      <div className="no-data">
        <div className="no-data-title">No data loaded</div>
        <p className="no-data-sub">Upload a CSV to see anomaly detection, benchmarks, and revenue concentration analysis.</p>
      </div>
    </div>
  );

  const { anomalies, summary, categoryBreakdown } = data;

  // Revenue concentration
  const revenues = data.cashFlowTimeline.reduce((s, m) => s + m.income, 0);
  const monthlyRevCats = {}; // using category breakdown as proxy
  // Calculate revenue by source from waterfallData (revenue line)
  const revBySource = {};
  // Simple: use whatever the backend returned
  const totalRevCheck = summary.avgMonthlyRevenue * summary.monthsOfData;

  // Check concentration from categoryBreakdown context (revenue sources aren't in breakdown)
  // We'll approximate from the summary
  const concentrationRisk = false; // Will surface only if data shows it

  // Determine top 2 high-severity anomalies for Argus
  const top2 = anomalies.slice(0, 2);

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Insights</h1>
        <p className="page-subtitle">
          {anomalies.length} anomalies detected — sorted by severity. Benchmarks from retail/services SMB medians.
        </p>
      </div>

      {/* Anomaly list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', marginBottom: 'var(--space-2xl)' }}>
        {anomalies.length === 0 && (
          <div className="card">
            <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>No anomalies detected. Your data is clean.</p>
          </div>
        )}
        {anomalies.map((a, i) => (
          <div key={i}>
            <div className={`anomaly-card ${a.severity}`}>
              <div className="anomaly-header">
                <AlertBadge severity={a.severity} />
                <span className="anomaly-type">{TYPE_LABELS[a.type] || a.type}</span>
              </div>
              <p className="anomaly-desc">{a.description}</p>
              {a.suggestedFix && (
                <p className="anomaly-fix">→ {a.suggestedFix}</p>
              )}
              {(a.amount > 0 || a.date) && (
                <div className="anomaly-meta">
                  {a.amount > 0 && <span className="anomaly-amount">${a.amount.toLocaleString()}</span>}
                  {a.date && <span className="anomaly-date">{a.date}</span>}
                </div>
              )}
            </div>
            {/* Argus appears inline next to top 2 severity anomalies only */}
            {i < 2 && (
              <Argusbubble
                message={`${a.type === 'duplicate' ? 'Duplicate transactions inflate your totals and distort trend analysis.' : a.type === 'spike' ? 'A 30%+ spending spike in one category can quickly erode your runway.' : a.type === 'gap' ? 'A data gap this long means your cash flow picture is incomplete for that period.' : 'Uncategorized transactions prevent accurate spending analysis.'}`}
                severity={a.severity === 'high' ? 'critical' : a.severity === 'medium' ? 'warning' : 'info'}
              />
            )}
          </div>
        ))}
      </div>

      {/* Benchmarks */}
      <BenchmarkPanel revenue={summary.avgMonthlyRevenue} categoryBreakdown={categoryBreakdown} />

      {/* Revenue concentration warning */}
      {data.confidenceScores.revenue.penalties.some((p) => p.label.includes('concentration')) && (
        <div className="card" style={{ borderColor: 'rgba(255,146,77,0.3)', borderLeft: '4px solid var(--color-accent)' }}>
          <div className="card-title" style={{ color: 'var(--color-accent)' }}>Revenue Concentration Risk</div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text)', lineHeight: '1.6' }}>
            One revenue source accounts for more than 70% of your total revenue. High concentration means a single client or channel loss could be catastrophic.
          </p>
        </div>
      )}
    </div>
  );
}
