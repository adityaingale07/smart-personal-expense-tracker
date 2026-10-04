import React from 'react';
import { BrandLogo } from '../common/BrandLogo';
import {
  Globe2,
  ShieldCheck,
  TrendingUp,
  PieChart,
  Target,
  Repeat,
  ArrowRight,
  Lock,
  Zap,
  Sparkles,
  BarChart3,
  Sliders,
  DollarSign
} from 'lucide-react';

interface LandingPageProps {
  onOpenAuth: (mode: 'login' | 'signup') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth }) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 flex flex-col selection:bg-emerald-500/20 selection:text-emerald-700">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#0B0F19]/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <BrandLogo size="md" />

          <div className="flex items-center gap-3">
            <button
              onClick={() => onOpenAuth('login')}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => onOpenAuth('signup')}
              className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smart Personal Expense & Cashflow Management</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
              Master your money with complete{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">
                clarity and control
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Spendly provides multi-currency transaction tracking, real-time budgeting limits, transparent financial health scoring, and automatic recurring schedules. Start fresh with your real data.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => onOpenAuth('signup')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/25 transition-all hover:scale-105 active:scale-95"
              >
                <span>Create Your Account</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onOpenAuth('login')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-semibold border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-colors"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-16 bg-white dark:bg-slate-900/60 border-y border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Built for real financial accountability
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Every statistic, insight, and health metric is calculated solely from your authentic transactions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 1. Multi-Currency */}
            <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Globe2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Global Multi-Currency
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Log transactions in USD, EUR, INR, GBP, JPY, and over 30 ISO currencies. Dynamic exchange rates are locked at transaction time so historical balances stay stable.
              </p>
            </div>

            {/* 2. Financial Health Score */}
            <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Transparent Health Score
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                No random rating algorithms. Your score is derived from 6 verifiable factors: spending control, savings capacity, budget discipline, and fixed recurring burdens.
              </p>
            </div>

            {/* 3. Where Did My Money Go */}
            <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Sliders className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Where Did My Money Go?
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Interactive waterfall breakdown classifying net cashflow into Essential living, Lifestyle treats, Subscriptions, Savings, and Financial goals.
              </p>
            </div>

            {/* 4. Smart Budgeting */}
            <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <PieChart className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Proactive Budget Alerts
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Category and total monthly limits with early warnings at 80% and over-limit notifications when expenses exceed thresholds.
              </p>
            </div>

            {/* 5. Subscriptions & Recurring */}
            <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <Repeat className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Recurring Engine & Subscriptions
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Automate fixed commitments like rent, internet, and subscriptions. The recurring engine automatically generates transactions as schedules mature.
              </p>
            </div>

            {/* 6. Privacy & Architecture */}
            <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Private & Secure Architecture
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Built with strict Row Level Security (RLS) PostgreSQL schema, isolated accounts, local persistent engine options, and full data exportability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              How Spendly works
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Three simple steps to take full command of your personal finances.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center space-y-3 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 font-extrabold text-lg flex items-center justify-center mx-auto">
                1
              </div>
              <h4 className="font-bold text-base text-slate-900 dark:text-white">60-Second Setup</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Select your primary currency, pick the categories that fit your life, and set an optional monthly spending target.
              </p>
            </div>

            <div className="text-center space-y-3 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 font-extrabold text-lg flex items-center justify-center mx-auto">
                2
              </div>
              <h4 className="font-bold text-base text-slate-900 dark:text-white">Log in Any Currency</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Record expenses and income with attached receipts, tags, and payment methods. Spendly handles instant currency conversion.
              </p>
            </div>

            <div className="text-center space-y-3 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 font-extrabold text-lg flex items-center justify-center mx-auto">
                3
              </div>
              <h4 className="font-bold text-base text-slate-900 dark:text-white">Real Financial Insights</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Watch your Financial Health Score grow, explore your spending waterfall, and track progress toward your financial goals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-emerald-600 to-teal-800 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to track your expenses honestly?
          </h2>
          <p className="text-emerald-100 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Create your account today. No placeholder records, no prefilled fake statistics. Clean, real financial tracking from day one.
          </p>
          <div className="pt-2">
            <button
              onClick={() => onOpenAuth('signup')}
              className="px-8 py-3.5 rounded-2xl text-sm font-bold bg-white text-emerald-800 hover:bg-emerald-50 shadow-xl transition-all hover:scale-105 active:scale-95"
            >
              Get Started with Spendly Free
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0F19]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <BrandLogo size="sm" />
          <p>© {new Date().getFullYear()} Spendly. Personal finance tracking built with security and integrity.</p>
        </div>
      </footer>
    </div>
  );
};
