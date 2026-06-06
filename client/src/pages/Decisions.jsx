import { useState } from 'react';
import { useFinancialData } from '../hooks/useFinancialData';
import ScenarioCard from '../components/ScenarioCard';
import Argusbubble from '../components/Argusbubble';
import Tooltip from '../components/Tooltip';
import '../styles/app.css';

const DECISION_TYPES = [
  { value: 'hire', label: 'Hire an employee' },
  { value: 'marketing', label: 'Increase marketing spend' },
  { value: 'delay-payment', label: 'Delay a supplier payment' },
  { value: 'equipment', label: 'Purchase equipment' },
  { value: 'debt', label: 'Take on debt / credit' },
  { value: 'reduce-headcount', label: 'Reduce headcount' },
];

function computeScenarios(decisionType, inputs, summary, confidenceScores) {
  const { avgMonthlyRevenue = 0, avgMonthlyExpenses = 0, avgMonthlyBurn = 0, cashOnHand = 0, runway = 0 } = summary;
  const uncertaintyMult = ((100 - confidenceScores.overall) / 100) * 1.5;

  let baseRevPct = 0, baseExpAdd = 0;

  if (decisionType === 'hire') {
    const salary = parseFloat(inputs.salary) || 0;
    const revImpact = parseFloat(inputs.revImpact) || 0;
    baseRevPct = revImpact;
    baseExpAdd = salary;
  } else if (decisionType === 'marketing') {
    const spend = parseFloat(inputs.spend) || 0;
    const revImpact = parseFloat(inputs.revImpact) || 0;
    baseRevPct = revImpact;
    baseExpAdd = spend;
  } else if (decisionType === 'delay-payment') {
    const amount = parseFloat(inputs.amount) || 0;
    baseRevPct = 0;
    baseExpAdd = -amount; // temporarily reduces expenses
  } else if (decisionType === 'equipment') {
    const cost = parseFloat(inputs.cost) || 0;
    baseRevPct = 0;
    baseExpAdd = cost / 12; // annualize
  } else if (decisionType === 'debt') {
    const amount = parseFloat(inputs.amount) || 0;
    const rate = parseFloat(inputs.rate) || 6;
    baseRevPct = 0;
    baseExpAdd = (amount * (rate / 100)) / 12;
  } else if (decisionType === 'reduce-headcount') {
    const saving = parseFloat(inputs.saving) || 0;
    const revLoss = parseFloat(inputs.revLoss) || 0;
    baseRevPct = -revLoss;
    baseExpAdd = -saving;
  }

  const spread = Math.abs(baseRevPct) * 0.6 * (1 + uncertaintyMult);

  const makeScenario = (revMult, label) => {
    const revChangePct = baseRevPct * revMult + (revMult > 1 ? spread / 2 : revMult < 1 ? -spread / 2 : 0);
    const revDelta = avgMonthlyRevenue * (revChangePct / 100);
    const netCash = revDelta - baseExpAdd;
    const newBurn = avgMonthlyBurn - netCash;
    const newRunway = newBurn > 0 ? cashOnHand / newBurn : -1;
    const runwayImpact = newRunway === -1 ? 999 : (runway === -1 ? 0 : newRunway - runway);
    const expChangePct = avgMonthlyExpenses > 0 ? (baseExpAdd / avgMonthlyExpenses) * 100 : 0;
    return { revChangePct, expChangePct, netCash, runwayImpact: Math.min(runwayImpact, 999) };
  };

  return {
    best: makeScenario(1.3, 'Best case'),
    likely: makeScenario(1.0, 'Likely'),
    worst: makeScenario(0.3, 'Worst case'),
  };
}

function getRecommendation(likely, summary) {
  const { netCash, runwayImpact } = likely;
  const newRunway = (summary.runway || 0) + runwayImpact;
  if (netCash >= 0 && newRunway > 3) return 'proceed';
  if (newRunway <= 3 || netCash < -summary.avgMonthlyExpenses * 0.3) return 'high-risk';
  return 'review';
}

function DecisionInputs({ type, inputs, setInputs }) {
  const update = (k, v) => setInputs((p) => ({ ...p, [k]: v }));
  const field = (label, key, placeholder) => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input className="form-input" type="number" placeholder={placeholder} value={inputs[key] || ''} onChange={(e) => update(key, e.target.value)} />
    </div>
  );

  if (type === 'hire') return (
    <div className="decision-form-row">
      {field('Monthly Salary ($)', 'salary', '5000')}
      {field('Expected Revenue Impact (%)', 'revImpact', '10')}
    </div>
  );
  if (type === 'marketing') return (
    <div className="decision-form-row">
      {field('Monthly Marketing Spend ($)', 'spend', '2000')}
      {field('Expected Revenue Impact (%)', 'revImpact', '8')}
    </div>
  );
  if (type === 'delay-payment') return (
    <div className="decision-form-row">
      {field('Payment Amount ($)', 'amount', '3000')}
    </div>
  );
  if (type === 'equipment') return (
    <div className="decision-form-row">
      {field('Equipment Cost ($)', 'cost', '12000')}
    </div>
  );
  if (type === 'debt') return (
    <div className="decision-form-row">
      {field('Loan Amount ($)', 'amount', '25000')}
      {field('Annual Interest Rate (%)', 'rate', '6')}
    </div>
  );
  if (type === 'reduce-headcount') return (
    <div className="decision-form-row">
      {field('Monthly Savings ($)', 'saving', '5000')}
      {field('Expected Revenue Loss (%)', 'revLoss', '5')}
    </div>
  );
  return null;
}

const RECOMMENDATION_COPY = {
  proceed: { label: 'Proceed', cls: 'proceed', desc: 'This decision is net positive under current conditions and improves your runway.' },
  review: { label: 'Review Assumptions', cls: 'review', desc: null },
  'high-risk': { label: 'High Risk Under Current Conditions', cls: 'high-risk', desc: null },
};

const ARGUS_MESSAGES = {
  review: (s) => `Your data confidence is ${s.confidenceScores.overall}/100 — the likely outcome may shift significantly with better data. Verify your assumptions before committing.`,
  'high-risk': (s) => `This decision drops your projected runway below 3 months. At current cash on hand ($${s.summary.cashOnHand.toLocaleString()}), that leaves very little room for error.`,
};

export default function Decisions() {
  const { data, isLoading } = useFinancialData();
  const [decisionType, setDecisionType] = useState('hire');
  const [inputs, setInputs] = useState({});

  if (isLoading && !data) return (
    <div className="page">
      <div className="page-header">
        <div className="skeleton" style={{ height: 28, width: 200, marginBottom: 8 }} />
        <div className="skeleton skeleton-text" style={{ width: 360 }} />
      </div>
      <div className="skeleton" style={{ height: 160, marginBottom: 'var(--space-lg)' }} />
      <div className="skeleton" style={{ height: 200, marginBottom: 'var(--space-lg)' }} />
      <div className="skeleton" style={{ height: 80 }} />
    </div>
  );

  if (!data) return (
    <div className="page">
      <div className="no-data">
        <div className="no-data-title">No data loaded</div>
        <p className="no-data-sub">Upload a CSV to model financial decisions against your actual numbers.</p>
      </div>
    </div>
  );

  const { summary, confidenceScores } = data;
  const scenarios = computeScenarios(decisionType, inputs, summary, confidenceScores);
  const rec = getRecommendation(scenarios.likely, summary);
  const recCopy = RECOMMENDATION_COPY[rec];

  const breakeven = (() => {
    if (scenarios.likely.netCash <= 0) return null;
    const months = Math.abs(parseFloat(inputs.salary || inputs.spend || inputs.cost || inputs.amount || 0)) / scenarios.likely.netCash;
    return isFinite(months) && months > 0 ? Math.min(months, 12) : null;
  })();

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Decision Modeling</h1>
        <p className="page-subtitle">
          Simulate a financial decision against your actual data. Uncertainty ranges widen when your <Tooltip term="confidence score">confidence score</Tooltip> is low.
        </p>
      </div>

      {/* Decision selector */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-title">Configure Decision</div>
        <div className="decision-form">
          <div className="form-group">
            <label className="form-label">Decision Type</label>
            <select className="form-select" value={decisionType} onChange={(e) => { setDecisionType(e.target.value); setInputs({}); }}>
              {DECISION_TYPES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
          <DecisionInputs type={decisionType} inputs={inputs} setInputs={setInputs} />
        </div>
      </div>

      {/* Scenario table */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-title">Scenario Analysis</div>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
          Uncertainty multiplier: <span style={{ fontFamily: 'var(--font-mono)' }}>×{(1 + ((100 - confidenceScores.overall) / 100) * 1.5).toFixed(2)}</span> at {confidenceScores.overall}/100 confidence
        </p>
        <table className="scenario-table">
          <thead>
            <tr>
              <th>Scenario</th>
              <th>Revenue Change</th>
              <th>Expense Change</th>
              <th>Net Cash Impact</th>
              <th><Tooltip term="runway">Runway</Tooltip> Impact</th>
            </tr>
          </thead>
          <tbody>
            <ScenarioCard
              scenario="Best case"
              revChange={scenarios.best.revChangePct}
              expChange={scenarios.best.expChangePct}
              netCash={scenarios.best.netCash}
              runwayImpact={Math.min(scenarios.best.runwayImpact, 99)}
            />
            <ScenarioCard
              scenario="Likely"
              revChange={scenarios.likely.revChangePct}
              expChange={scenarios.likely.expChangePct}
              netCash={scenarios.likely.netCash}
              runwayImpact={Math.min(scenarios.likely.runwayImpact, 99)}
            />
            <ScenarioCard
              scenario="Worst case"
              revChange={scenarios.worst.revChangePct}
              expChange={scenarios.worst.expChangePct}
              netCash={scenarios.worst.netCash}
              runwayImpact={Math.min(scenarios.worst.runwayImpact, 99)}
            />
          </tbody>
        </table>
      </div>

      {/* Break-even */}
      {breakeven != null && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-title">Break-even</div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text)', marginBottom: '12px' }}>
            This decision becomes cash-positive after{' '}
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-primary)' }}>{breakeven.toFixed(1)} months</span>.
          </p>
          <div className="breakeven-bar-wrap">
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '6px' }}>
              <span>Now</span><span>12 months</span>
            </div>
            <div className="breakeven-bar-track">
              <div className="breakeven-bar-fill" style={{ width: `${Math.min((breakeven / 12) * 100, 100)}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* Recommendation banner */}
      <div className={`recommendation-banner ${recCopy.cls}`}>
        <div>
          <div className="recommendation-label">{recCopy.label}</div>
          {recCopy.desc && <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>{recCopy.desc}</p>}
        </div>
      </div>

      {(rec === 'review' || rec === 'high-risk') && (
        <Argusbubble
          message={ARGUS_MESSAGES[rec](data)}
          severity={rec === 'high-risk' ? 'critical' : 'warning'}
        />
      )}
    </div>
  );
}
