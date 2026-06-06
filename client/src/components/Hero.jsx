import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinancialData } from '../hooks/useFinancialData';
import '../styles/Hero.css';

export default function Hero({ onUpload }) {
  const { uploadAndAnalyze } = useFinancialData();
  const navigate = useNavigate();
  const [sampleLoading, setSampleLoading] = useState(false);

  const handleSampleData = async () => {
    setSampleLoading(true);
    try {
      const res = await fetch('/sample-data.csv');
      const text = await res.text();
      const blob = new Blob([text], { type: 'text/csv' });
      const file = new File([blob], 'sample-data.csv', { type: 'text/csv' });
      await uploadAndAnalyze(file);
      navigate('/app/dashboard');
    } finally {
      setSampleLoading(false);
    }
  };

  return (
    <section className="hero-section">
      <div className="hero-bg-gradient" aria-hidden="true" />
      <div className="hero-bg-grain" aria-hidden="true" />

      <div className="hero-inner">
        {/* ── Left column ─────────────────────────────── */}
        <div className="hero-left">
          <p className="hero-eyebrow">Financial clarity for small businesses</p>

          <h1 className="hero-headline">
            Your numbers are only useful if you can act on them.
          </h1>

          <p className="hero-subtext">
            Frankly shows you what to trust, what to question, and what to fix before it matters.
          </p>

          <div className="hero-ctas">
            <button className="hero-btn-primary" onClick={onUpload}>
              Try Frankly →
            </button>
            <button
              className="hero-btn-secondary"
              onClick={handleSampleData}
              disabled={sampleLoading}
            >
              {sampleLoading ? 'Loading…' : 'Load sample data'}
            </button>
          </div>
        </div>

        {/* ── Right column — product card ───────────── */}
        <div className="hero-right" aria-hidden="true">
          <div className="hero-card">
            <div className="hero-card-top">
              <div>
                <div className="hero-card-kicker">Data Confidence Score</div>
                <div className="hero-card-period">Dec 2024</div>
              </div>
              <div className="hero-card-badge">Good</div>
            </div>

            <div className="hero-card-score-row">
              <span className="hero-card-score-num">80</span>
              <span className="hero-card-score-denom">/100</span>
            </div>

            {/* Sparkline */}
            <svg
              className="hero-sparkline"
              viewBox="0 0 220 52"
              fill="none"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="heroSparklineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00A8A8" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#00A8A8" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Fill area */}
              <path
                d="M 0 46 C 25 44 35 40 55 38 C 75 36 85 34 110 28 C 135 22 150 16 175 12 C 190 9 205 7 220 6 L 220 52 L 0 52 Z"
                fill="url(#heroSparklineGrad)"
              />
              {/* Line */}
              <path
                d="M 0 46 C 25 44 35 40 55 38 C 75 36 85 34 110 28 C 135 22 150 16 175 12 C 190 9 205 7 220 6"
                stroke="#00A8A8"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* End dot */}
              <circle cx="220" cy="6" r="3" fill="#00A8A8" />
            </svg>

            <div className="hero-card-divider" />

            <div className="hero-card-rows">
              <div className="hero-card-row">
                <span className="hero-card-row-label">Cash on hand</span>
                <span className="hero-card-row-value">$46,670</span>
              </div>
              <div className="hero-card-row">
                <span className="hero-card-row-label">Net cash flow MTD</span>
                <span className="hero-card-row-value hero-card-row-pos">+$5,770</span>
              </div>
              <div className="hero-card-row">
                <span className="hero-card-row-label">Issues flagged</span>
                <span className="hero-card-row-value hero-card-row-warn">8 issues</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
