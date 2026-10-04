import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../services/currency';
import { EmptyState } from '../common/EmptyState';
import { HealthScoreCard } from './HealthScoreCard';
import { FinancialCharts } from './FinancialCharts';
import { WhereDidMyMoneyGoModal } from './WhereDidMyMoneyGoModal';
import { CategoryIcon } from '../common/CategoryIcon';
import { TransactionModal } from '../transactions/TransactionModal';
import { ReceiptViewerModal } from '../transactions/ReceiptViewerModal';
import { Transaction } from '../../types';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  PiggyBank,
  TrendingUp,
  Percent,
  Calendar,
  Sparkles,
  Plus,
  Sliders,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Paperclip,
  Copy,
  Trash2,
  Edit2
} from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (view: string) => void;
  onOpenTransactionModal: (type?: 'expense' | 'income') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenTransactionModal,
}) => {
  const { user } = useAuth();
  const {
    transactions,
    categories,
    budgets,
    displayCurrency,
    totalBalance,
    totalIncome,
    totalExpenses,
    netSavings,
    savingsRate,
    monthlySpending,
    monthlyBudgetRemaining,
    smartInsights,
    deleteTransaction,
    duplicateTransaction
  } = useFinance();

  const [showMoneyFlow, setShowMoneyFlow] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<{ url: string; name: string } | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const catMap = new Map(categories.map(c => [c.id, c]));
  const recentTransactions = transactions.slice(0, 5);

  const hasTransactions = transactions.length > 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* Welcome Banner & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Welcome, {user?.fullName?.split(' ')[0] || 'User'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time financial overview in {displayCurrency}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowMoneyFlow(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            Where did my money go?
          </button>
          <button
            onClick={() => onOpenTransactionModal('expense')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Transaction
          </button>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Balance */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Balance
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
            {formatCurrency(totalBalance, displayCurrency)}
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Net cumulative income minus logged expenses
          </div>
        </div>

        {/* Total Income */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Income
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
            {formatCurrency(totalIncome, displayCurrency)}
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            All recorded earnings and inflows
          </div>
        </div>

        {/* Total Expenses */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Expenses
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-rose-600 dark:text-rose-400">
            {formatCurrency(totalExpenses, displayCurrency)}
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            All recorded outflows & spending
          </div>
        </div>

        {/* Savings & Rate */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Savings Rate
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
              {savingsRate}%
            </span>
            <span className="text-xs font-mono font-medium text-slate-400">
              ({formatCurrency(netSavings, displayCurrency)})
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Proportion of income retained
          </div>
        </div>
      </div>

      {/* Monthly Budget Tracker Bar if user set target */}
      {(user?.monthlySpendingTarget || 0) > 0 && (
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs mb-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-500" />
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Monthly Spending Progress
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-slate-500 dark:text-slate-400">
                Spent: <strong className="text-slate-900 dark:text-white font-mono">{formatCurrency(monthlySpending, displayCurrency)}</strong>
              </span>
              <span className="text-slate-500 dark:text-slate-400">
                Remaining: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{formatCurrency(monthlyBudgetRemaining, displayCurrency)}</strong>
              </span>
            </div>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                (monthlySpending / (user?.monthlySpendingTarget || 1)) >= 1
                  ? 'bg-rose-500'
                  : (monthlySpending / (user?.monthlySpendingTarget || 1)) >= 0.8
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{
                width: `${Math.min(100, (monthlySpending / (user?.monthlySpendingTarget || 1)) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Empty State Banner if no transactions */}
      {!hasTransactions ? (
        <EmptyState
          title="No transactions yet"
          description="Start tracking your first expense or income to unlock real-time financial insights, analytics graphs, and your financial health score."
          onAddExpense={() => onOpenTransactionModal('expense')}
          onAddIncome={() => onOpenTransactionModal('income')}
          onImport={() => onNavigate('reports')}
        />
      ) : (
        <>
          {/* Smart Insights Section (Generated strictly from real transactions) */}
          {smartInsights.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Active Financial Insights
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {smartInsights.map(insight => (
                  <div
                    key={insight.id}
                    className={`p-4 rounded-2xl border flex items-start gap-3 transition-colors ${
                      insight.type === 'alert'
                        ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50 text-rose-900 dark:text-rose-200'
                        : insight.type === 'warning'
                        ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200'
                        : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-200'
                    }`}
                  >
                    {insight.type === 'alert' || insight.type === 'warning' ? (
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-current" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-current" />
                    )}
                    <div>
                      <h4 className="text-xs font-bold mb-0.5">{insight.title}</h4>
                      <p className="text-xs leading-relaxed opacity-90">{insight.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Charts & Financial Health Score Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <FinancialCharts
                transactions={transactions}
                categories={categories}
                budgets={budgets}
                currency={displayCurrency}
              />
            </div>
            <div>
              <HealthScoreCard onViewDetails={() => onNavigate('insights')} />
            </div>
          </div>

          {/* Recent Transactions List */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Recent Transactions
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Latest entries recorded in your account
                </p>
              </div>
              <button
                onClick={() => onNavigate('transactions')}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                View all ({transactions.length})
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentTransactions.map(tx => {
                const cat = catMap.get(tx.categoryId);
                const isExpense = tx.type === 'expense';
                const isIncome = tx.type === 'income';

                return (
                  <div
                    key={tx.id}
                    className="py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 px-2 rounded-xl transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${cat?.color || '#94a3b8'}20` }}
                      >
                        <CategoryIcon
                          name={cat?.icon || 'Tag'}
                          className="w-5 h-5"
                          color={cat?.color || '#94a3b8'}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {tx.merchant || cat?.name || 'Transaction'}
                          </h4>
                          {tx.receiptUrl && (
                            <button
                              type="button"
                              onClick={() => setSelectedReceipt({ url: tx.receiptUrl!, name: tx.receiptName || 'Receipt' })}
                              className="text-slate-400 hover:text-emerald-500"
                              title="View Receipt"
                            >
                              <Paperclip className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <span>{tx.date}</span>
                          <span>•</span>
                          <span>{tx.paymentMethod}</span>
                          {tx.currency !== displayCurrency && (
                            <>
                              <span>•</span>
                              <span className="font-mono">
                                {formatCurrency(tx.amount, tx.currency)} @ {tx.exchangeRate}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div
                          className={`font-mono font-bold text-xs sm:text-sm ${
                            isIncome
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : isExpense
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-blue-600 dark:text-blue-400'
                          }`}
                        >
                          {isIncome ? '+' : isExpense ? '-' : ''}
                          {formatCurrency(tx.convertedAmount || tx.amount, displayCurrency)}
                        </div>
                        <div className="text-[10px] text-slate-400 capitalize">{tx.type}</div>
                      </div>

                      {/* Quick action buttons on hover */}
                      <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditingTransaction(tx)}
                          title="Edit"
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => duplicateTransaction(tx)}
                          title="Duplicate"
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteTransaction(tx.id)}
                          title="Delete"
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Where Did My Money Go Modal */}
      <WhereDidMyMoneyGoModal
        isOpen={showMoneyFlow}
        onClose={() => setShowMoneyFlow(false)}
      />

      {/* Receipt Viewer Modal */}
      <ReceiptViewerModal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        receiptUrl={selectedReceipt?.url}
        receiptName={selectedReceipt?.name}
      />

      {/* Edit Transaction Modal */}
      {editingTransaction && (
        <TransactionModal
          isOpen={true}
          onClose={() => setEditingTransaction(null)}
          initialData={editingTransaction}
        />
      )}
    </div>
  );
};
