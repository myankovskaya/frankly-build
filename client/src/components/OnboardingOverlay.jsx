import { useNavigate } from 'react-router-dom';
import { useFinancialData } from '../hooks/useFinancialData';
import '../styles/app.css';

export default function OnboardingOverlay() {
  const { data, dismissOnboarding } = useFinancialData();
  const navigate = useNavigate();

  const handleView = () => {
    dismissOnboarding();
    navigate('/app/dashboard');
  };

  if (!data) return null;

  const highSeverity = data.anomalies.filter((a) => a.severity === 'high').length;
  const totalIssues = data.anomalies.length;
  const { totalTransactions, monthsOfData, runway } = data.summary;
  const overall = data.confidenceScores.overall;

  const runwayText = runway === -1
    ? 'Profitable — positive cash flow'
    : `Projected runway: ${runway} months`;

  const volatility = (() => {
    const nets = data.cashFlowTimeline.map((m) => m.netCash);
    if (nets.length < 2) return 'Stable';
    const mean = nets.reduce((s, v) => s + v, 0) / nets.length;
    const stddev = Math.sqrt(nets.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / nets.length);
    const cv = mean !== 0 ? stddev / Math.abs(mean) : 0;
    if (cv < 0.2) return 'Low cash flow volatility';
    if (cv < 0.5) return 'Moderate cash flow volatility';
    return 'High cash flow volatility';
  })();

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-card">
        <h1 className="onboarding-headline">Analysis complete.</h1>
        <p className="onboarding-line">
          We reviewed <span className="onboarding-num">{totalTransactions.toLocaleString()}</span> transactions across <span className="onboarding-num">{monthsOfData}</span> months.
        </p>
        <p className="onboarding-line">Found:</p>
        <p className="onboarding-line" style={{ paddingLeft: '16px' }}>
          • <span className="onboarding-num">{totalIssues}</span> data quality issues
        </p>
        <p className="onboarding-line" style={{ paddingLeft: '16px' }}>
          • {volatility}
        </p>
        <p className="onboarding-line" style={{ paddingLeft: '16px' }}>
          • {runwayText}
        </p>
        <p className="onboarding-line" style={{ paddingLeft: '16px' }}>
          • <span className="onboarding-num">{highSeverity}</span> high-severity anomalies
        </p>
        <p className="onboarding-score-line">
          Your overall <span style={{ color: 'var(--color-text-muted)' }}>confidence score:</span>&nbsp;
          <span className="onboarding-num" style={{ fontSize: '24px' }}>{overall}/100</span>
        </p>
        <div className="onboarding-cta">
          <button className="btn-primary" onClick={handleView} style={{ fontSize: '16px', padding: '16px 32px' }}>
            View Dashboard →
          </button>
        </div>
      </div>
    </div>
  );
}
