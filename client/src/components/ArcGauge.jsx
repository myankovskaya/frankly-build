function arcPath(cx, cy, r, score) {
  // Full background arc: upper semicircle from left to right via top
  // sweep=1 (clockwise) from (cx-r, cy) to (cx+r, cy) passes through (cx, cy-r)
  const bg = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;

  if (score <= 0) return { bg, fill: '', top: { x: cx, y: cy - r } };

  if (score >= 100) return { bg, fill: bg, top: { x: cx, y: cy - r } };

  // SVG clockwise angle: 180° (left) + (score/100)*180° (sweep toward right through top)
  // At score=50: 270° (top of circle)
  const svgAngleDeg = 180 + (score / 100) * 180;
  const rad = (svgAngleDeg * Math.PI) / 180;
  const endX = cx + r * Math.cos(rad);
  const endY = cy + r * Math.sin(rad);

  // large-arc: score > 50 → swept arc > 90° but always < 180° → large-arc = 0
  const fill = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${endX.toFixed(3)} ${endY.toFixed(3)}`;
  return { bg, fill, top: { x: cx, y: cy - r } };
}

export default function ArcGauge({ score, label }) {
  const clamped = Math.max(0, Math.min(100, score ?? 0));
  const cx = 100, cy = 90, r = 72;
  const { bg, fill } = arcPath(cx, cy, r, clamped);

  const color = clamped >= 75
    ? 'var(--color-success)'
    : clamped >= 50
      ? 'var(--color-warning)'
      : 'var(--color-accent)';

  return (
    <div className="arc-gauge-wrap">
      <svg
        className="arc-gauge-svg"
        viewBox="0 0 200 100"
        width="200"
        height="100"
        aria-label={`${label}: ${clamped} out of 100`}
      >
        {/* Track */}
        <path d={bg} fill="none" stroke="var(--color-border)" strokeWidth="10" strokeLinecap="round" />
        {/* Fill */}
        {fill && (
          <path d={fill} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" />
        )}
        {/* Score text */}
        <text
          x={cx}
          y={cy - 2}
          textAnchor="middle"
          dominantBaseline="middle"
          className="arc-gauge-score"
          fill={color}
        >
          {clamped}
        </text>
      </svg>
      <div className="arc-gauge-label">{label}</div>
    </div>
  );
}
