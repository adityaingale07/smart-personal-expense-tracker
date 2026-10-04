import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../services/currency';
import {
  X,
  ArrowDown,
  ShieldCheck,
  Coffee,
  Tv,
  PiggyBank,
  Target,
  Wallet,
  Sparkles
} from 'lucide-react';

interface WhereDidMyMoneyGoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WhereDidMyMoneyGoModal: React.FC<WhereDidMyMoneyGoModalProps> = ({ isOpen, onClose }) => {
  const { moneyFlow, displayCurrency } = useFinance();

  if (!isOpen) return null;

  const total = moneyFlow.totalIncome || 1; // avoid divide by zero for percentages
  const essentialPct = Math.round((moneyFlow.essentialExpenses / total) * 100);
  const lifestylePct = Math.round((moneyFlow.lifestyleExpenses / total) * 100);
  const subsPct = Math.round((moneyFlow.subscriptions / total) * 100);
  const savingsPct = Math.round((moneyFlow.savings / total) * 100);
  const goalsPct = Math.round((moneyFlow.goalsAllocated / total) * 100);

  const steps = [
    {
      title: 'Total Monthly Inflow (Income)',
      amount: moneyFlow.totalIncome,
      pct: 100,
      icon: Wallet,
      color: 'from-emerald-500 to-teal-600',
      bgColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      desc: 'All recorded earnings, salaries, freelance income, and revenue.',
      isSurplus: true,
    },
    {
      title: '1. Essential Living Expenses',
      amount: moneyFlow.essentialExpenses,
      pct: essentialPct,
      icon: ShieldCheck,
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
      desc: 'Housing, food, utilities, transport, healthcare, and education.',
      isSurplus: false,
    },
    {
      title: '2. Lifestyle & Discretionary',
      amount: moneyFlow.lifestyleExpenses,
      pct: lifestylePct,
      icon: Coffee,
      color: 'from-amber-500 to-orange-600',
      bgColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
      desc: 'Dining out, shopping, entertainment, travel, and personal treats.',
      isSurplus: false,
    },
    {
      title: '3. Recurring Subscriptions',
      amount: moneyFlow.subscriptions,
      pct: subsPct,
      icon: Tv,
      color: 'from-purple-500 to-violet-600',
      bgColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
      desc: 'Streaming services, software subscriptions, memberships.',
      isSurplus: false,
    },
    {
      title: '4. Net Cash Savings',
      amount: moneyFlow.savings,
      pct: savingsPct,
      icon: PiggyBank,
      color: 'from-teal-500 to-emerald-600',
      bgColor: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30',
      desc: 'Remaining unspent surplus cash flow preserved this period.',
      isSurplus: true,
    },
    {
      title: '5. Capital Allocated to Goals',
      amount: moneyFlow.goalsAllocated,
      pct: goalsPct,
      icon: Target,
      color: 'from-cyan-500 to-blue-600',
      bgColor: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
      desc: 'Funds purposefully locked into targeted financial goals.',
      isSurplus: true,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Where Did My Money Go?
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Visual cascade of your authenticated financial flow
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
          {moneyFlow.totalIncome === 0 && moneyFlow.essentialExpenses === 0 && moneyFlow.lifestyleExpenses === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                No financial transactions recorded yet. Once you record your income and expenses, this flow will calculate your cash distribution in real time.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {steps.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <React.Fragment key={step.title}>
                    <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${step.bgColor}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                              {step.title}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{step.desc}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-base font-bold font-mono text-slate-900 dark:text-white">
                            {formatCurrency(step.amount, displayCurrency)}
                          </div>
                          <span className="text-xs font-semibold text-slate-400">
                            {step.pct}% of income
                          </span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${step.color}`}
                          style={{ width: `${Math.min(100, Math.max(0, step.pct))}%` }}
                        />
                      </div>
                    </div>

                    {idx < steps.length - 1 && (
                      <div className="flex justify-center -my-1">
                        <ArrowDown className="w-4 h-4 text-slate-300 dark:text-slate-700" />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-4 px-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 hover:opacity-90 transition-opacity"
          >
            Close Flow
          </button>
        </div>
      </div>
    </div>
  );
};
