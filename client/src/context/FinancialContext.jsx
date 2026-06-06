import { createContext, useState, useCallback } from 'react';

export const FinancialContext = createContext(null);

export function FinancialProvider({ children }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastAnalyzed, setLastAnalyzed] = useState(null);
  const [businessName, setBusinessName] = useState('My Business');
  const [showOnboarding, setShowOnboarding] = useState(false);

  const uploadAndAnalyze = useCallback(async (file) => {
    setIsLoading(true);
    setError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const formData = new FormData();
      formData.append('csv', file);

      const res = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Analysis failed');
      }
      const result = await res.json();
      setData(result);
      setLastAnalyzed(new Date());
      setShowOnboarding(true);
      return true;
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Analysis timed out after 10 seconds. Please try again with a smaller file.');
      } else {
        setError(err.message);
      }
      return false;
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  }, []);

  const dismissOnboarding = useCallback(() => {
    setShowOnboarding(false);
  }, []);

  return (
    <FinancialContext.Provider
      value={{
        data,
        isLoading,
        error,
        lastAnalyzed,
        businessName,
        setBusinessName,
        showOnboarding,
        dismissOnboarding,
        uploadAndAnalyze,
      }}
    >
      {children}
    </FinancialContext.Provider>
  );
}
