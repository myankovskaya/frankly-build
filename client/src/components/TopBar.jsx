import { useFinancialData } from '../hooks/useFinancialData';

function formatDate(d) {
  if (!d) return 'Never';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function TopBar() {
  const { businessName, setBusinessName, data, lastAnalyzed } = useFinancialData();
  const score = data?.confidenceScores?.overall;

  const badgeClass = score == null ? '' : score >= 75 ? 'green' : score >= 50 ? 'amber' : 'red';
  const badgeLabel = score == null ? '' : score >= 75 ? 'Good' : score >= 50 ? 'Fair' : 'Poor';

  return (
    <header className="topbar">
      <div className="topbar-left">
        <input
          className="business-name"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          aria-label="Business name"
        />
        <span className="topbar-freshness">
          {lastAnalyzed ? `Last analyzed: ${formatDate(lastAnalyzed)}` : 'No data analyzed yet'}
        </span>
      </div>
      {score != null && (
        <div className={`confidence-badge ${badgeClass}`} title="Overall confidence score">
          <span className="confidence-badge-label">Confidence</span>
          <span>{score}/100</span>
          <span className="confidence-badge-label">{badgeLabel}</span>
        </div>
      )}
    </header>
  );
}
