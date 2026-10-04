import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../services/currency';
import { HealthScoreCard } from '../dashboard/HealthScoreCard';
import { EmptyState } from '../common/EmptyState';
import {
  Sparkles,
  ShieldCheck,
  Zap,
  TrendingUp,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Compass,
  ArrowRight
} from 'lucide-react';

interface InsightsViewProps {
  onOpenMoneyFlowModal: () => void;
}

export const InsightsView: React.FC<InsightsViewProps> = ({ onOpenMoneyFlowModal }) => {
  const {
    transactions,
    healthScore,
    spendingPatterns,
    smartInsights,
    moneyFlow,
    displayCurrency
  } = useFinance();

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Financial Health & Patterns
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Objective metrics, behavioral spending analysis, and cashflow intelligence
          </p>
        </div>

        <button
          onClick={onOpenMoneyFlowModal}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md transition-all self-start sm:self-auto hover:opacity-90"
        >
          <Sliders className="w-3.5 h-3.5" />
          Where Did My Money Go?
        </button>
      </div>

      {transactions.length < 3 ? (
        <EmptyState
          title="Baseline data required for insights"
          description="Spendly strictly avoids guessing or generating artificial financial profiles. Record at least 3 transactions to calculate your Financial Health Score and detect behavioral spending patterns."
        />
      ) : (
        <>
          {/* Financial Health Score Deep Dive */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <HealthScoreCard />
            </div>

            <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                Transparent Factor Analysis
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Your Financial Health Score is computed mathematically without arbitrary factors:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span>Spending Control</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400">
                      {healthScore.breakdown.spendingControl} / 100
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Ratio of monthly spending against your defined spending target or income.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span>Savings Capacity</span>
                    <span className="font-mono text-teal-600 dark:text-teal-400">
                      {healthScore.breakdown.savingsRate} / 100
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Net cash surplus preserved as a percentage of total recorded inflow.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span>Budget Adherence</span>
                    <span className="font-mono text-blue-600 dark:text-blue-400">
                      {healthScore.breakdown.budgetAdherence} / 100
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Percentage of active category budgets respected without overruns.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span>Fixed Recurring Burden</span>
                    <span className="font-mono text-amber-600 dark:text-amber-400">
                      {healthScore.breakdown.recurringBurden} / 100
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Proportion of income consumed by non-negotiable subscriptions and rules.
                  </p>
                </div>
              </div>

              {healthScore.recommendations.length > 0 && (
                <div className="pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Actionable Recommendations
                  </h4>
                  <ul className="space-y-1.5">
                    {healthScore.recommendations.map((rec, i) => (
                      <li key={i} className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
                        <ArrowRight className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Behavioral Spending Patterns Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-indigo-500" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Detected Spending Patterns
              </h3>
            </div>

            {spendingPatterns.length === 0 ? (
              <div className="p-8 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                Not enough varied transactions yet to detect distinct behavioral patterns. Continue tracking your routine weekly expenses.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {spendingPatterns.map(p => (
                  <div
                    key={p.id}
                    className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {p.title}
                      </span>
                      {p.metric && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                          {p.metric}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {p.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
