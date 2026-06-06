import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Hero from '../components/Hero';
import UploadModal from '../components/UploadModal';
import '../styles/landing.css';

export default function Landing() {
  const [showUpload, setShowUpload] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="landing">
      {/* Nav */}
      <nav className="landing-nav">
        <div className="landing-nav-wordmark">Frank<span>ly</span></div>
        <div className="landing-nav-cta">
          <button className="btn-ghost" onClick={() => setShowUpload(true)}>Sign in</button>
          <button className="btn-primary" onClick={() => navigate('/app/dashboard')}>Open app</button>
        </div>
      </nav>

      {/* Hero */}
      <Hero onUpload={() => setShowUpload(true)} />

      {/* Stats */}
      <section className="landing-stats">
        <h2>The numbers your accountant knows but won't tell you</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">
              <span className="stat-figure">56</span><span className="stat-pct">%</span>
            </div>
            <p className="stat-label">of small business owners make financial decisions on incomplete data every month.</p>
          </div>
          <div className="stat-card">
            <div className="stat-number">
              <span className="stat-figure">43</span><span className="stat-pct">%</span>
            </div>
            <p className="stat-label">operate without reliable cash flow visibility, making runway invisible until it's too late.</p>
          </div>
          <div className="stat-card">
            <div className="stat-number">
              <span className="stat-figure">51</span><span className="stat-pct">%</span>
            </div>
            <p className="stat-label">have financial records with errors requiring correction before they can be acted on.</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="landing-features">
        <div className="landing-features-inner">
          <h2>Built around one insight: bad data should produce wider uncertainty ranges, not just a warning.</h2>
          <div className="features-grid">
            <div className="feature-block">
              <div className="feature-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h3>Data quality scoring</h3>
              <p>See exactly what's wrong with your numbers before you act. Every penalty is explicit — no black-box confidence scores.</p>
            </div>
            <div className="feature-block">
              <div className="feature-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
                </svg>
              </div>
              <h3>Cash flow forecasting</h3>
              <p>Know your runway. Plan your next move with confidence — or with honest uncertainty when the data warrants it.</p>
            </div>
            <div className="feature-block">
              <div className="feature-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="12" y1="2" x2="12" y2="22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <h3>Decision modeling</h3>
              <p>Simulate any financial decision and see the real risk range. Uncertainty widens when your data quality is low.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="landing-integrations">
        <h2>Works with your data</h2>
        <div className="integrations-row">
          {['QuickBooks', 'Xero', 'Stripe', 'Shopify', 'Square'].map((name) => (
            <div key={name} className="integration-pill">
              <div className="integration-pill-dot" />
              {name}
            </div>
          ))}
          <div className="integration-pill" style={{ opacity: 0.5 }}>+more coming</div>
        </div>
      </section>

      {/* Footer — wordmark only */}
      <footer style={{ borderTop: '1px solid var(--color-border)', padding: '40px 48px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div className="footer-wordmark">Frank<span>ly</span></div>
        </div>
      </footer>

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} />}
    </div>
  );
}
