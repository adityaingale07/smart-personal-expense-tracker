import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/common/Toast';
import { FinanceProvider } from './context/FinanceContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <FinanceProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </FinanceProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
