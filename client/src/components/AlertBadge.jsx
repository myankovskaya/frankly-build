export default function AlertBadge({ severity }) {
  const labels = { high: 'High', medium: 'Medium', low: 'Low' };
  return (
    <span className={`badge ${severity}`}>{labels[severity] || severity}</span>
  );
}
