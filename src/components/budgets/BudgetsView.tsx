import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Budget } from '../../types';
import { formatCurrency } from '../../services/currency';
import { CategoryIcon } from '../common/CategoryIcon';
import { EmptyState } from '../common/EmptyState';
import { useToast } from '../common/Toast';
import {
  Plus,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Edit2,
  Trash2,
  X,
  Target
} from 'lucide-react';

export const BudgetsView: React.FC = () => {
  const {
    budgets,
    categories,
    transactions,
    displayCurrency,
    saveBudget,
    deleteBudget,
  } = useFinance();
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  // Form states
  const [categoryId, setCategoryId] = useState('all');
  const [amount, setAmount] = useState('');
  const [alertThreshold, setAlertThreshold] = useState('80');
  const now = new Date();
  const [month, setMonth] = useState<number>(now.getMonth() + 1);
  const [year, setYear] = useState<number>(now.getFullYear());

  const catMap = new Map(categories.map(c => [c.id, c]));

  // Current month transactions
  const currentMonthTx = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() + 1 === month && d.getFullYear() === year && t.type === 'expense';
  });

  const openAddModal = () => {
    setEditingBudget(null);
    setCategoryId('all');
    setAmount('');
    setAlertThreshold('80');
    setMonth(now.getMonth() + 1);
    setYear(now.getFullYear());
    setIsModalOpen(true);
  };

  const openEditModal = (b: Budget) => {
    setEditingBudget(b);
    setCategoryId(b.categoryId);
    setAmount(b.amount.toString());
    setAlertThreshold(b.alertThreshold.toString());
    setMonth(b.month);
    setYear(b.year);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmt = parseFloat(amount);
    if (!amount || isNaN(numAmt) || numAmt <= 0) {
      toast('Please enter a valid budget amount', 'error');
      return;
    }

    try {
      await saveBudget({
        id: editingBudget?.id,
        categoryId,
        amount: numAmt,
        period: 'monthly',
        month,
        year,
        alertThreshold: parseFloat(alertThreshold) || 80,
      });
      toast(editingBudget ? 'Budget updated' : 'Budget created successfully', 'success');
      setIsModalOpen(false);
    } catch (err: any) {
      toast(err.message || 'Failed to save budget', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteBudget(id);
      toast('Budget deleted', 'info');
    } catch (err: any) {
      toast(err.message || 'Failed to delete budget', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Smart Budgets
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Set and monitor category limits and monthly targets
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all hover:scale-105 active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create Budget
        </button>
      </div>

      {/* Budgets Grid */}
      {budgets.length === 0 ? (
        <EmptyState
          title="No budgets configured"
          description="Establish monthly spending limits for key categories to protect your cashflow and avoid unexpected deficits."
          actionText="Create Your First Budget"
          onAction={openAddModal}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {budgets.map(b => {
            const isAll = b.categoryId === 'all';
            const cat = catMap.get(b.categoryId);
            const title = isAll ? 'Overall Monthly Limit' : (cat?.name || 'Category');

            const spent = currentMonthTx
              .filter(t => isAll || t.categoryId === b.categoryId)
              .reduce((s, t) => s + (t.convertedAmount || t.amount), 0);

            const remaining = Math.max(0, b.amount - spent);
            const percentage = b.amount > 0 ? (spent / b.amount) * 100 : 0;
            const isOver = percentage >= 100;
            const isApproaching = percentage >= (b.alertThreshold || 80) && !isOver;

            return (
              <div
                key={b.id}
                className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4 hover:shadow-md transition-shadow group relative overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: isAll
                          ? 'rgba(16, 185, 129, 0.15)'
                          : `${cat?.color || '#94a3b8'}20`,
                      }}
                    >
                      <CategoryIcon
                        name={isAll ? 'Target' : (cat?.icon || 'Tag')}
                        className="w-5 h-5"
                        color={isAll ? '#10B981' : cat?.color}
                      />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                        {title}
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        {new Date(b.year, b.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditModal(b)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(b.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Amount metrics */}
                <div className="flex items-baseline justify-between pt-1">
                  <div>
                    <span className="text-xs text-slate-400">Spent: </span>
                    <span className="font-mono font-bold text-base text-slate-900 dark:text-white">
                      {formatCurrency(spent, displayCurrency)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400">Limit: </span>
                    <span className="font-mono font-medium text-xs text-slate-600 dark:text-slate-300">
                      {formatCurrency(b.amount, displayCurrency)}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOver ? 'bg-rose-500' : isApproaching ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, percentage)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span
                      className={`font-semibold flex items-center gap-1 ${
                        isOver
                          ? 'text-rose-600 dark:text-rose-400'
                          : isApproaching
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {isOver ? (
                        <>
                          <AlertCircle className="w-3 h-3" /> Over budget ({percentage.toFixed(0)}%)
                        </>
                      ) : isApproaching ? (
                        <>
                          <AlertTriangle className="w-3 h-3" /> Approaching limit ({percentage.toFixed(0)}%)
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3 h-3" /> On track ({percentage.toFixed(0)}%)
                        </>
                      )}
                    </span>

                    <span className="text-slate-500 dark:text-slate-400">
                      Remaining: {formatCurrency(remaining, displayCurrency)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Budget Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {editingBudget ? 'Edit Budget' : 'Create Budget'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Budget Scope / Category
                </label>
                <select
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-900 dark:text-white"
                >
                  <option value="all">Overall Monthly Spending Limit</option>
                  {categories.filter(c => c.type === 'expense').map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Monthly Limit Amount ({displayCurrency})
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  required
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full px-4 py-2.5 text-base font-bold font-mono rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Alert Warning Threshold (%)
                </label>
                <select
                  value={alertThreshold}
                  onChange={e => setAlertThreshold(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-900 dark:text-white"
                >
                  <option value="70">70% of limit</option>
                  <option value="80">80% of limit (Recommended)</option>
                  <option value="90">90% of limit</option>
                  <option value="95">95% of limit</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
                >
                  Save Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
