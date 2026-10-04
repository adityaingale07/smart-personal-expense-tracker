import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../services/currency';
import { CategoryIcon } from '../common/CategoryIcon';
import { EmptyState } from '../common/EmptyState';
import {
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  PiggyBank,
  Calendar,
  Zap,
  Tag,
  BarChart2,
  PieChart
} from 'lucide-react';

type DatePreset = '7d' | '30d' | '3m' | '6m' | '1y' | 'custom';

export const AnalyticsView: React.FC = () => {
  const { transactions, categories, displayCurrency } = useFinance();

  const [preset, setPreset] = useState<DatePreset>('30d');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');

  const catMap = new Map(categories.map(c => [c.id, c]));

  // Filter transactions by selected range
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    let startDate = new Date();

    if (preset === '7d') startDate.setDate(now.getDate() - 7);
    else if (preset === '30d') startDate.setDate(now.getDate() - 30);
    else if (preset === '3m') startDate.setMonth(now.getMonth() - 3);
    else if (preset === '6m') startDate.setMonth(now.getMonth() - 6);
    else if (preset === '1y') startDate.setFullYear(now.getFullYear() - 1);
    else if (preset === 'custom') {
      startDate = customStart ? new Date(customStart) : new Date(0);
    }

    const startStr = startDate.toISOString().split('T')[0];
    const endStr = preset === 'custom' && customEnd ? customEnd : now.toISOString().split('T')[0];

    return transactions.filter(t => t.date >= startStr && t.date <= endStr);
  }, [transactions, preset, customStart, customEnd]);

  // Calculations
  const incomeTx = filteredTransactions.filter(t => t.type === 'income');
  const expenseTx = filteredTransactions.filter(t => t.type === 'expense');

  const totalIncome = incomeTx.reduce((s, t) => s + (t.convertedAmount || t.amount), 0);
  const totalExpenses = expenseTx.reduce((s, t) => s + (t.convertedAmount || t.amount), 0);
  const netSavings = Math.max(0, totalIncome - totalExpenses);
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

  // Number of distinct days in range
  const distinctDays = Math.max(1, new Set(filteredTransactions.map(t => t.date)).size);
  const avgDailySpending = totalExpenses / distinctDays;
  const avgMonthlySpending = totalExpenses / Math.max(1, distinctDays / 30);

  // Highest spending category
  const catExpenses: Record<string, number> = {};
  expenseTx.forEach(t => {
    catExpenses[t.categoryId] = (catExpenses[t.categoryId] || 0) + (t.convertedAmount || t.amount);
  });

  const sortedCatExpenses = Object.entries(catExpenses).sort((a, b) => b[1] - a[1]);
  const highestCategory = sortedCatExpenses.length > 0 ? catMap.get(sortedCatExpenses[0][0]) : null;
  const highestCategoryAmount = sortedCatExpenses.length > 0 ? sortedCatExpenses[0][1] : 0;

  // Highest spending day
  const dayExpenses: Record<string, number> = {};
  expenseTx.forEach(t => {
    dayExpenses[t.date] = (dayExpenses[t.date] || 0) + (t.convertedAmount || t.amount);
  });

  const sortedDays = Object.entries(dayExpenses).sort((a, b) => b[1] - a[1]);
  const highestDay = sortedDays.length > 0 ? sortedDays[0][0] : null;
  const highestDayAmount = sortedDays.length > 0 ? sortedDays[0][1] : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header & Date Range Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Financial Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Statistical breakdown and trends based on your real transactions
          </p>
        </div>

        {/* Date Presets */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl self-start sm:self-auto">
          {(['7d', '30d', '3m', '6m', '1y', 'custom'] as DatePreset[]).map(p => (
            <button
              key={p}
              onClick={() => setPreset(p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                preset === p
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : p === '3m' ? '3 Months' : p === '6m' ? '6 Months' : p === '1y' ? '1 Year' : 'Custom'}
            </button>
          ))}
        </div>
      </div>

      {preset === 'custom' && (
        <div className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <input
            type="date"
            value={customStart}
            onChange={e => setCustomStart(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          />
          <span className="text-xs text-slate-400">to</span>
          <input
            type="date"
            value={customEnd}
            onChange={e => setCustomEnd(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>
      )}

      {transactions.length === 0 ? (
        <EmptyState
          title="No analytics to display"
          description="Analytics graphs and statistics calculate exclusively from real transactions. Record expenses or income to generate insights."
        />
      ) : (
        <>
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Period Income
              </span>
              <div className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                {formatCurrency(totalIncome, displayCurrency)}
              </div>
              <span className="text-[11px] text-slate-400">{incomeTx.length} inflows</span>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Period Expenses
              </span>
              <div className="text-2xl font-extrabold font-mono text-rose-600 dark:text-rose-400">
                {formatCurrency(totalExpenses, displayCurrency)}
              </div>
              <span className="text-[11px] text-slate-400">{expenseTx.length} outflows</span>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Net Period Savings
              </span>
              <div className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white">
                {formatCurrency(netSavings, displayCurrency)}
              </div>
              <span className="text-[11px] text-slate-400">
                {savingsRate.toFixed(1)}% savings rate
              </span>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Avg Daily Spending
              </span>
              <div className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white">
                {formatCurrency(avgDailySpending, displayCurrency)}
              </div>
              <span className="text-[11px] text-slate-400">
                Across {distinctDays} active days
              </span>
            </div>
          </div>

          {/* Highlights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Highest Spending Category */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Highest Spending Category
                </span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                  {highestCategory ? highestCategory.name : 'N/A'}
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  {formatCurrency(highestCategoryAmount, displayCurrency)} total spent
                </p>
              </div>
              {highestCategory && (
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${highestCategory.color}20` }}
                >
                  <CategoryIcon
                    name={highestCategory.icon}
                    className="w-6 h-6"
                    color={highestCategory.color}
                  />
                </div>
              )}
            </div>

            {/* Highest Spending Day */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Peak Spending Day
                </span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                  {highestDay ? new Date(highestDay).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  {formatCurrency(highestDayAmount, displayCurrency)} logged on single day
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center shrink-0">
                <Calendar className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Category Distribution Breakdown Table */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Category Spending Breakdown
            </h3>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {sortedCatExpenses.map(([catId, amount]) => {
                const cat = catMap.get(catId);
                const share = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
                return (
                  <div key={catId} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${cat?.color || '#94a3b8'}20` }}
                      >
                        <CategoryIcon
                          name={cat?.icon || 'Tag'}
                          className="w-4 h-4"
                          color={cat?.color || '#94a3b8'}
                        />
                      </div>
                      <span className="text-xs font-semibold text-slate-900 dark:text-white">
                        {cat?.name || 'Uncategorized'}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                        {formatCurrency(amount, displayCurrency)}
                      </span>
                      <span className="font-mono text-xs text-slate-400 w-12">
                        {share.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
