export default function MetricCard({ label, value, delta, deltaLabel, subtext, valueClass }) {
  return (
    <div className="metric-card">
      <div className="metric-label">{label}</div>
      <div className={`metric-value ${valueClass || ''}`}>{value}</div>
      {delta !== undefined && (
        <div className={`metric-delta ${delta >= 0 ? 'up' : 'down'}`}>
          <span>{delta >= 0 ? '▲' : '▼'}</span>
          <span>{Math.abs(delta)}%</span>
          {deltaLabel && <span style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }}>{deltaLabel}</span>}
        </div>
      )}
      {subtext && (
        <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-muted)' }}>
          {subtext}
        </div>
      )}
    </div>
  );
}
