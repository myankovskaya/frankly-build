import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as ReTooltip, ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts';
import { useFinancialData } from '../hooks/useFinancialData';
import Tooltip from '../components/Tooltip';
import '../styles/app.css';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--color-surface-raised)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '10px 14px', fontFamily: 'var(--font-body)', fontSize: '13px' }}>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '6px' }}>{label}</p>
      {payload.map((p) => p.value != null && (
        <p key={p.dataKey} style={{ color: p.stroke || p.fill || 'var(--color-text)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
          {p.name}: ${(typeof p.value === 'number' ? Math.abs(p.value) : p.value).toLocaleString()}
        </p>
      ))}
    </div>
  );
};

function buildTimelineAndForecast(timeline, forecast) {
  const actual = timeline.map((m) => ({
    month: m.month,
    income: m.income,
    expenses: m.expenses,
    netCash: m.netCash,
    projected: null,
    upper: null,
    lower: null,
  }));

  const last = actual[actual.length - 1];
  const fcast = (forecast || []).map((f) => ({
    month: f.month,
    income: null,
    expenses: null,
    netCash: null,
    projected: f.projected,
    upper: f.upper,
    lower: f.lower,
  }));

  return [...actual, ...fcast];
}

export default function CashFlow() {
  const { data, isLoading } = useFinancialData();

  if (isLoading && !data) return (
    <div className="page">
      <div className="page-header">
        <div className="skeleton" style={{ height: 28, width: 140, marginBottom: 8 }} />
        <div className="skeleton skeleton-text" style={{ width: 240 }} />
      </div>
      <div className="skeleton" style={{ height: 360, marginBottom: 'var(--space-lg)' }} />
      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
        <div className="skeleton" style={{ height: 160 }} />
        <div className="skeleton" style={{ height: 160 }} />
      </div>
      <div className="skeleton" style={{ height: 200 }} />
    </div>
  );

  if (!data) return (
    <div className="page">
      <div className="no-data">
        <div className="no-data-title">No data loaded</div>
        <p className="no-data-sub">Upload a CSV to see your cash flow timeline and forecast.</p>
      </div>
    </div>
  );

  const { cashFlowTimeline, forecast, summary, waterfallData, categoryBreakdown } = data;
  const chartData = buildTimelineAndForecast(cashFlowTimeline, forecast);
  const lastActualMonth = cashFlowTimeline[cashFlowTimeline.length - 1]?.month;

  const runwayClass = summary.runway === -1 ? 'safe' : summary.runway > 6 ? 'safe' : summary.runway > 3 ? 'caution' : 'danger';
  const runwayDisplay = summary.runway === -1 ? 'Profitable' : `${summary.runway}`;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Cash Flow</h1>
        <p className="page-subtitle">
          Timeline, <Tooltip term="runway">runway</Tooltip>, forecast cone, and category breakdown.
        </p>
      </div>

      {/* Timeline + forecast chart */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-title">
          Income vs Expenses — with 3-month forecast
        </div>
        <div className="chart-wrap-tall">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 16, left: 16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" tick={{ fontFamily: 'var(--font-mono)', fontSize: 11, fill: 'var(--color-text-muted)' }} />
              <YAxis tickFormatter={(v) => '$' + (v / 1000).toFixed(0) + 'k'} tick={{ fontFamily: 'var(--font-mono)', fontSize: 11, fill: 'var(--color-text-muted)' }} />
              <ReTooltip content={<CustomTooltip />} />
              {lastActualMonth && (
                <ReferenceLine x={lastActualMonth} stroke="rgba(0,168,168,0.3)" strokeDasharray="4 4" label={{ value: 'Forecast →', fill: 'var(--color-text-muted)', fontSize: 11, position: 'insideTopRight' }} />
              )}
              <Line type="monotone" dataKey="income" stroke="var(--color-primary)" strokeWidth={2} dot={false} name="Income" />
              <Line type="monotone" dataKey="expenses" stroke="var(--color-accent)" strokeWidth={2} strokeDasharray="5 3" dot={false} name="Expenses" />
              <Line type="monotone" dataKey="projected" stroke="var(--color-primary)" strokeWidth={2} strokeDasharray="6 3" dot={false} name="Projected cash" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 'var(--space-lg)', marginBottom: 'var(--space-lg)', alignItems: 'stretch' }}>
        {/* Runway */}
        <div className="card">
          <div className="card-title"><Tooltip term="runway">Runway</Tooltip></div>
          <div className="runway-stat">
            <div className={`runway-number ${runwayClass}`}>
              {runwayDisplay}
              {summary.runway !== -1 && <span style={{ fontSize: '22px', fontWeight: 400 }}> mo</span>}
            </div>
            {summary.runway !== -1 && (
              <p className="runway-label">at current <Tooltip term="burn rate">burn rate</Tooltip></p>
            )}
          </div>
        </div>

        {/* Waterfall */}
        <div className="card">
          <div className="card-title"><Tooltip term="waterfall chart">Waterfall</Tooltip> — cash movement this month</div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={waterfallData} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="label" tick={{ fontFamily: 'var(--font-body)', fontSize: 11, fill: 'var(--color-text-muted)' }} />
                <YAxis tickFormatter={(v) => '$' + (Math.abs(v) / 1000).toFixed(0) + 'k'} tick={{ fontFamily: 'var(--font-mono)', fontSize: 11, fill: 'var(--color-text-muted)' }} />
                <ReTooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Amount" radius={[4, 4, 0, 0]}>
                  {waterfallData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={
                        entry.type === 'start' || entry.type === 'end'
                          ? 'var(--color-text-muted)'
                          : entry.value >= 0
                            ? 'var(--color-primary)'
                            : 'var(--color-accent)'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="card">
        <div className="card-title">Category Breakdown — most recent month</div>
        <table className="category-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Amount</th>
              <th>% of Expenses</th>
              <th><Tooltip term="MoM">MoM</Tooltip> Change</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {categoryBreakdown.map((row, i) => (
              <tr key={i}>
                <td>{row.category}</td>
                <td className="mono">${row.amount.toLocaleString()}</td>
                <td className="mono">{row.percentOfExpenses}%</td>
                <td>
                  <span className="mono" style={{ color: row.MoMChange > 0 ? 'var(--color-accent)' : row.MoMChange < 0 ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                    {row.MoMChange > 0 ? '▲' : row.MoMChange < 0 ? '▼' : '—'} {row.MoMChange !== 0 ? Math.abs(row.MoMChange) + '%' : ''}
                  </span>
                </td>
                <td>
                  {row.flagged
                    ? <span className="badge high">Spike</span>
                    : <span className="badge low">Normal</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
