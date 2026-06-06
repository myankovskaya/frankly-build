export default function ScenarioCard({ scenario, revChange, expChange, netCash, runwayImpact }) {
  const isPos = (v) => v > 0;
  const fmt = (v) => (v >= 0 ? '+' : '') + v.toLocaleString();
  const fmtPct = (v) => (v >= 0 ? '+' : '') + v.toFixed(1) + '%';
  const fmtMo = (v) => (v >= 0 ? '+' : '') + v.toFixed(1) + ' mo';

  return (
    <tr>
      <td><span className="scenario-name">{scenario}</span></td>
      <td className={isPos(revChange) ? 'pos' : 'neg'}>{fmtPct(revChange)}</td>
      <td className="neg">{fmtPct(expChange)}</td>
      <td className={isPos(netCash) ? 'pos' : 'neg'}>${fmt(Math.round(netCash))}</td>
      <td className={isPos(runwayImpact) ? 'pos' : 'neg'}>{fmtMo(runwayImpact)}</td>
    </tr>
  );
}
