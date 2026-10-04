import React, { useState } from 'react';
import { Transaction, Category, Budget } from '../../types';
import { formatCurrency } from '../../services/currency';
import { CategoryIcon } from '../common/CategoryIcon';
import { BarChart3, PieChart as PieIcon, TrendingUp, Calendar } from 'lucide-react';

interface FinancialChartsProps {
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  currency: string;
}

export const FinancialCharts: React.FC<FinancialChartsProps> = ({
  transactions,
  categories,
  budgets,
  currency,
}) => {
  const [activeTab, setActiveTab] = useState<'distribution' | 'monthly' | 'trend'>('distribution');

  const catMap = new Map<string, Category>(categories.map(c => [c.id, c]));

  // Calculate category distribution
  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  const totalExpense = expenseTransactions.reduce((s, t) => s + (t.convertedAmount || t.amount), 0);

  const catSums: Record<string, number> = {};
  expenseTransactions.forEach(t => {
    catSums[t.categoryId] = (catSums[t.categoryId] || 0) + (t.convertedAmount || t.amount);
  });

  const categoryDistribution = Object.entries(catSums)
    .map(([catId, amount]) => {
      const cat = catMap.get(catId);
      return {
        id: catId,
        name: cat?.name || 'Uncategorized',
        color: cat?.color || '#94a3b8',
        icon: cat?.icon || 'Tag',
        amount,
        percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  // Calculate monthly cashflow for past 6 months
  const monthsData: { label: string; income: number; expense: number }[] = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = d.getMonth() + 1;
    const y = d.getFullYear();
    const label = d.toLocaleString('default', { month: 'short' });

    const monthTxs = transactions.filter(t => {
      const td = new Date(t.date);
      return td.getMonth() + 1 === m && td.getFullYear() === y;
    });

    const inc = monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + (t.convertedAmount || t.amount), 0);
    const exp = monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + (t.convertedAmount || t.amount), 0);

    monthsData.push({ label, income: inc, expense: exp });
  }

  const maxMonthlyVal = Math.max(
    ...monthsData.map(m => Math.max(m.income, m.expense)),
    100
  );

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
      {/* Chart Switcher Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            Financial Analytics & Trends
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real dynamic visual data from your authenticated entries
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('distribution')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === 'distribution'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <PieIcon className="w-3.5 h-3.5" />
            Categories
          </button>
          <button
            onClick={() => setActiveTab('monthly')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === 'monthly'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Cash Flow
          </button>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="py-16 text-center text-slate-400 text-xs">
          No transaction data available to plot charts. Add expenses or income to view real graphs.
        </div>
      ) : activeTab === 'distribution' ? (
        // CATEGORY DISTRIBUTION
        <div className="space-y-4">
          <div className="space-y-3">
            {categoryDistribution.slice(0, 6).map(item => (
              <div key={item.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${item.color}20` }}
                    >
                      <CategoryIcon name={item.icon} className="w-3 h-3" color={item.color} />
                    </div>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(item.amount, currency)}
                    </span>
                    <span className="font-mono text-slate-400 text-[11px] w-10 text-right">
                      {item.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        // MONTHLY CASH FLOW (INCOME VS EXPENSE)
        <div className="space-y-4">
          <div className="flex items-center justify-end gap-4 text-xs font-medium mb-4">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> Income
            </span>
            <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" /> Expense
            </span>
          </div>

          <div className="grid grid-cols-6 gap-2 sm:gap-4 items-end h-44 pt-4 border-b border-slate-100 dark:border-slate-800 pb-2">
            {monthsData.map(m => {
              const incHeight = maxMonthlyVal > 0 ? (m.income / maxMonthlyVal) * 100 : 0;
              const expHeight = maxMonthlyVal > 0 ? (m.expense / maxMonthlyVal) * 100 : 0;

              return (
                <div key={m.label} className="flex flex-col items-center h-full justify-end group">
                  <div className="w-full flex items-end justify-center gap-1 sm:gap-2 h-full">
                    {/* Income Bar */}
                    <div
                      title={`Income: ${formatCurrency(m.income, currency)}`}
                      className="w-1/2 sm:w-5 bg-emerald-500/80 hover:bg-emerald-500 rounded-t-md transition-all group-hover:brightness-110"
                      style={{ height: `${Math.max(4, incHeight)}%` }}
                    />
                    {/* Expense Bar */}
                    <div
                      title={`Expense: ${formatCurrency(m.expense, currency)}`}
                      className="w-1/2 sm:w-5 bg-rose-500/80 hover:bg-rose-500 rounded-t-md transition-all group-hover:brightness-110"
                      style={{ height: `${Math.max(4, expHeight)}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-2">
                    {m.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
