import { useContext } from 'react';
import { FinancialContext } from '../context/FinancialContext';

export function useFinancialData() {
  const ctx = useContext(FinancialContext);
  if (!ctx) throw new Error('useFinancialData must be used inside FinancialProvider');
  return ctx;
}
