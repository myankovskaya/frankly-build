import { Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import AppShell from './components/AppShell';
import Dashboard from './pages/Dashboard';
import DataHealth from './pages/DataHealth';
import CashFlow from './pages/CashFlow';
import Decisions from './pages/Decisions';
import Insights from './pages/Insights';
import OnboardingOverlay from './components/OnboardingOverlay';
import { useFinancialData } from './hooks/useFinancialData';

export default function App() {
  const { showOnboarding } = useFinancialData();

  return (
    <>
      {showOnboarding && <OnboardingOverlay />}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/app" element={<AppShell />}>
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="data-health" element={<DataHealth />} />
          <Route path="cash-flow" element={<CashFlow />} />
          <Route path="decisions" element={<Decisions />} />
          <Route path="insights" element={<Insights />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
