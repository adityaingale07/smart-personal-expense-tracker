import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { useFinance } from './context/FinanceContext';
import { LandingPage } from './components/landing/LandingPage';
import { AuthModal } from './components/auth/AuthModal';
import { OnboardingModal } from './components/onboarding/OnboardingModal';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardView } from './components/dashboard/DashboardView';
import { TransactionsView } from './components/transactions/TransactionsView';
import { BudgetsView } from './components/budgets/BudgetsView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { GoalsView } from './components/goals/GoalsView';
import { SubscriptionsView } from './components/subscriptions/SubscriptionsView';
import { InsightsView } from './components/insights/InsightsView';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';
import { TransactionModal } from './components/transactions/TransactionModal';
import { WhereDidMyMoneyGoModal } from './components/dashboard/WhereDidMyMoneyGoModal';
import { BrandLogo } from './components/common/BrandLogo';

import { Transaction, TransactionType } from './types';

export const App: React.FC = () => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [currentView, setCurrentView] = useState<string>('dashboard');

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot'>('signup');

  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [transactionDefaultType, setTransactionDefaultType] = useState<TransactionType>('expense');

  const [whereDidMoneyGoOpen, setWhereDidMoneyGoOpen] = useState(false);

  // 1. Loading splash screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] flex flex-col items-center justify-center p-4">
        <BrandLogo size="lg" />
        <div className="mt-6 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs font-semibold text-slate-400">Loading Spendly...</span>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated state -> Landing Page + Auth Modal
  if (!isAuthenticated || !user) {
    return (
      <>
        <LandingPage
          onOpenAuth={mode => {
            setAuthMode(mode);
            setAuthModalOpen(true);
          }}
        />
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          defaultMode={authMode}
        />
      </>
    );
  }

  // 3. Authenticated but onboarding incomplete -> 6-step Onboarding Modal
  if (!user.onboardingCompleted) {
    return <OnboardingModal />;
  }

  // 4. Authenticated & Onboarded -> Full Fintech App Experience
  return (
    <>
      <AppLayout
        currentView={currentView}
        onNavigate={setCurrentView}
        onOpenTransactionModal={type => {
          setTransactionDefaultType(type || 'expense');
          setTransactionModalOpen(true);
        }}
      >
        {currentView === 'dashboard' && (
          <DashboardView
            onNavigate={setCurrentView}
            onOpenTransactionModal={type => {
              setTransactionDefaultType(type || 'expense');
              setTransactionModalOpen(true);
            }}
          />
        )}

        {currentView === 'transactions' && (
          <TransactionsView
            onOpenTransactionModal={type => {
              setTransactionDefaultType(type || 'expense');
              setTransactionModalOpen(true);
            }}
          />
        )}

        {currentView === 'budgets' && <BudgetsView />}

        {currentView === 'analytics' && <AnalyticsView />}

        {currentView === 'goals' && <GoalsView />}

        {currentView === 'subscriptions' && <SubscriptionsView />}

        {currentView === 'insights' && (
          <InsightsView
            onOpenMoneyFlowModal={() => setWhereDidMoneyGoOpen(true)}
          />
        )}

        {currentView === 'reports' && <ReportsView />}

        {currentView === 'settings' && <SettingsView />}
      </AppLayout>

      {/* Global Add Transaction Modal */}
      <TransactionModal
        isOpen={transactionModalOpen}
        onClose={() => setTransactionModalOpen(false)}
        defaultType={transactionDefaultType}
      />

      {/* Global 'Where did my money go?' Waterfall Modal */}
      <WhereDidMyMoneyGoModal
        isOpen={whereDidMoneyGoOpen}
        onClose={() => setWhereDidMoneyGoOpen(false)}
      />
    </>
  );
};

export default App;
