import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { useFinancialData } from '../hooks/useFinancialData';
import MetricCard from '../components/MetricCard';
import AlertBadge from '../components/AlertBadge';
import Argusbubble from '../components/Argusbubble';
import Tooltip from '../components/Tooltip';
import '../styles/app.css';

function fmt(n) {
  if (n == null) return '—';
  return '$' + Math.abs(n).toLocaleString();
}

function buildChartData(timeline, forecast) {
  const actual = timeline.map((m) => ({
    month: m.month,
    actual: m.cumulativeCash,
    projected: null,
    upper: null,
    lower: null,
  }));

  const lastActual = actual[actual.length - 1];
  const fcastData = (forecast || []).map((f) => ({
    month: f.month,
    actual: null,
    projected: f.projected,
    upper: f.upper,
    lower: f.lower,
  }));

  // Bridge: duplicate last actual point so the line connects
  if (lastActual && fcastData.length) {
    fcastData[0] = { ...fcastData[0], projected: lastActual.actual };
  }

  return [...actual, ...fcastData];
}

function NoData({ onUpload }) {
  return (
    <div className="no-data">
      <div style={{ color: 'var(--color-primary)' }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      </div>
      <div className="no-data-title">No data yet</div>
      <p className="no-data-sub">Upload a CSV to see your dashboard. Try the sample data to explore what Frankly surfaces.</p>
      <button className="btn-primary" onClick={onUpload}>Upload CSV</button>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--color-surface-raised)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '10px 14px', fontFamily: 'var(--font-body)', fontSize: '13px' }}>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '6px' }}>{label}</p>
      {payload.map((p) => p.value != null && (
        <p key={p.dataKey} style={{ color: p.color, fontFamily: 'var(--font-mono)' }}>
          {p.name}: ${p.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const { data, isLoading } = useFinancialData();
  const navigate = useNavigate();

  if (isLoading && !data) return (
    <div className="page">
      <div className="page-header">
        <div className="skeleton" style={{ height: 28, width: 140, marginBottom: 8 }} />
        <div className="skeleton skeleton-text" style={{ width: 320 }} />
      </div>
      <div className="metrics-grid">
        {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 100 }} />)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 'var(--space-lg)' }}>
        <div className="skeleton" style={{ height: 320 }} />
        <div className="skeleton" style={{ height: 320 }} />
      </div>
    </div>
  );

  if (!data) return (
    <div className="page">
      <NoData onUpload={() => navigate('/app/dashboard')} />
    </div>
  );

  const { summary, confidenceScores, cashFlowTimeline, forecast, anomalies } = data;

  const runwayDisplay = summary.runway === -1
    ? 'Profitable'
    : summary.runway === 0
      ? '< 1 mo'
      : `${summary.runway} mo`;

  const runwayClass = summary.runway === -1
    ? ''
    : summary.runway > 6 ? '' : summary.runway > 3 ? 'warning' : 'negative';

  const revDelta = summary.revenueLastMonth > 0
    ? Math.round(((summary.revenueThisMonth - summary.revenueLastMonth) / summary.revenueLastMonth) * 100)
    : null;

  const chartData = buildChartData(cashFlowTimeline, forecast);
  const topAlerts = anomalies.slice(0, 3);
  const overall = confidenceScores.overall;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">
          {summary.totalTransactions.toLocaleString()} transactions across {summary.monthsOfData} months
          &nbsp;·&nbsp; {summary.dateRange.start} – {summary.dateRange.end}
        </p>
      </div>

      {overall < 65 && (
        <Argusbubble
          message={`Your overall confidence score is ${overall}/100. ${confidenceScores.revenue.penalties[0]?.label || confidenceScores.cashFlow.penalties[0]?.label || 'Review your data quality issues to improve your score.'}. Fix this first.`}
          severity="warning"
        />
      )}

      {/* Metrics row */}
      <div className="metrics-grid">
        <MetricCard
          label="Cash on hand"
          value={fmt(summary.cashOnHand)}
          valueClass={summary.cashOnHand < 0 ? 'negative' : ''}
        />
        <MetricCard
          label={<Tooltip term="MTD">Net cash flow MTD</Tooltip>}
          value={fmt(summary.netCashFlowMTD)}
          valueClass={summary.netCashFlowMTD < 0 ? 'negative' : 'positive'}
        />
        <MetricCard
          label={<Tooltip term="runway">Runway</Tooltip>}
          value={runwayDisplay}
          valueClass={runwayClass}
          subtext={summary.runway !== -1 ? 'at current burn rate' : ''}
        />
        <MetricCard
          label={<>Revenue this month vs <Tooltip term="MoM">last</Tooltip></>}
          value={fmt(summary.revenueThisMonth)}
          delta={revDelta}
          deltaLabel="MoM"
        />
        <MetricCard
          label={<Tooltip term="gross margin">Gross margin</Tooltip>}
          value={`${summary.grossMargin}%`}
          valueClass={summary.grossMargin < 0 ? 'negative' : summary.grossMargin < 20 ? 'warning' : ''}
        />
        <MetricCard
          label={<Tooltip term="confidence score">Overall confidence</Tooltip>}
          value={`${overall}/100`}
          valueClass={overall >= 75 ? 'positive' : overall >= 50 ? 'warning' : 'negative'}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 'var(--space-lg)', marginBottom: 'var(--space-lg)', alignItems: 'stretch' }}>
        {/* 90-day forecast chart */}
        <div className="card">
          <div className="card-title">90-Day Cash Forecast</div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 16, left: 16, bottom: 0 }}>
                <defs>
                  <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00A8A8" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#00A8A8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="bandGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00A8A8" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#00A8A8" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" tick={{ fontFamily: 'var(--font-mono)', fontSize: 11, fill: 'var(--color-text-muted)' }} />
                <YAxis tickFormatter={(v) => '$' + (v / 1000).toFixed(0) + 'k'} tick={{ fontFamily: 'var(--font-mono)', fontSize: 11, fill: 'var(--color-text-muted)' }} />
                <ReTooltip content={<CustomTooltip />} />
                {cashFlowTimeline.length > 0 && (
                  <ReferenceLine x={cashFlowTimeline[cashFlowTimeline.length - 1].month} stroke="var(--color-border)" strokeDasharray="4 4" label={{ value: 'Forecast', fill: 'var(--color-text-muted)', fontSize: 11 }} />
                )}
                <Area type="monotone" dataKey="upper" stroke="none" fill="url(#bandGrad)" name="Upper bound" />
                <Area type="monotone" dataKey="lower" stroke="none" fill="var(--color-surface)" name="Lower bound" />
                <Area type="monotone" dataKey="actual" stroke="#00A8A8" strokeWidth={2} fill="url(#actualGrad)" dot={false} name="Actual" />
                <Area type="monotone" dataKey="projected" stroke="#00A8A8" strokeWidth={2} strokeDasharray="6 3" fill="none" dot={false} name="Projected" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alerts panel */}
        <div className="card">
          <div className="card-title">
            Top Alerts
            {' '}
            <span
              style={{ cursor: 'pointer', color: 'var(--color-primary)', fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}
              onClick={() => navigate('/app/insights')}
            >
              View all →
            </span>
          </div>
          {topAlerts.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>No anomalies detected.</p>
          ) : (
            <div className="alerts-panel">
              {topAlerts.map((a, i) => (
                <div
                  key={i}
                  className={`alert-item ${a.severity}`}
                  onClick={() => navigate('/app/insights')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && navigate('/app/insights')}
                >
                  <div className="alert-body">
                    <AlertBadge severity={a.severity} />
                    <p className="alert-desc" style={{ marginTop: '6px' }}>{a.description}</p>
                    <p className="alert-meta">
                      {a.date}{a.amount > 0 ? ` · $${a.amount.toLocaleString()}` : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
