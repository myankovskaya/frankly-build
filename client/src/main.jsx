import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { FinancialProvider } from './context/FinancialContext';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <FinancialProvider>
        <App />
      </FinancialProvider>
    </BrowserRouter>
  </React.StrictMode>
);
