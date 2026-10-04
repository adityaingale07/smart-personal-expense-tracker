import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { ShieldCheck, Info, ChevronRight, AlertTriangle } from 'lucide-react';

interface HealthScoreCardProps {
  onViewDetails?: () => void;
}

export const HealthScoreCard: React.FC<HealthScoreCardProps> = ({ onViewDetails }) => {
  const { healthScore } = useFinance();

  if (!healthScore.isEligible) {
    return (
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Financial Health Score
            </h3>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
            Baseline Incomplete
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-start gap-3">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-500 dark:text-slate-400">
            <p className="font-medium text-slate-700 dark:text-slate-300 mb-1">
              {healthScore.ineligibleReason}
            </p>
            <p>
              Spendly does not fabricate arbitrary ratings. Once you log at least 3 transactions, your transparent financial wellness score will calculate automatically.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { overallScore, grade, breakdown } = healthScore;

  // Grade color
  const gradeColors: Record<string, string> = {
    'A+': 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30',
    'A': 'text-teal-500 bg-teal-500/10 border-teal-500/30',
    'B': 'text-blue-500 bg-blue-500/10 border-blue-500/30',
    'C': 'text-amber-500 bg-amber-500/10 border-amber-500/30',
    'D': 'text-rose-500 bg-rose-500/10 border-rose-500/30',
  };

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Financial Health Score
            </h3>
            <p className="text-[11px] text-slate-400">Calculated from 6 verified factors</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-xl text-xs font-black border ${gradeColors[grade] || gradeColors['B']}`}
          >
            {grade}
          </span>
          {onViewDetails && (
            <button
              onClick={onViewDetails}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-baseline gap-2 mb-6">
        <span className="text-4xl font-extrabold font-mono text-slate-900 dark:text-white tracking-tight">
          {overallScore}
        </span>
        <span className="text-sm font-semibold text-slate-400">/ 100</span>
      </div>

      {/* Component factors */}
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
            <span>Spending Control</span>
            <span className="font-mono font-semibold">{breakdown.spendingControl}</span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${breakdown.spendingControl}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
            <span>Savings Capacity</span>
            <span className="font-mono font-semibold">{breakdown.savingsRate}</span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-500 rounded-full transition-all duration-500"
              style={{ width: `${breakdown.savingsRate}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
            <span>Budget Adherence</span>
            <span className="font-mono font-semibold">{breakdown.budgetAdherence}</span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${breakdown.budgetAdherence}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
            <span>Recurring Burden</span>
            <span className="font-mono font-semibold">{breakdown.recurringBurden}</span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${breakdown.recurringBurden}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
