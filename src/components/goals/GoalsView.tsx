import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Goal } from '../../types';
import { formatCurrency } from '../../services/currency';
import { EmptyState } from '../common/EmptyState';
import { useToast } from '../common/Toast';
import {
  Target,
  Plus,
  Calendar,
  Sparkles,
  ArrowUpRight,
  Edit2,
  Trash2,
  CheckCircle2,
  X
} from 'lucide-react';

export const GoalsView: React.FC = () => {
  const { goals, displayCurrency, saveGoal, deleteGoal, contributeToGoal } = useFinance();
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  // Contribute Modal
  const [contributeGoalItem, setContributeGoalItem] = useState<Goal | null>(null);
  const [contributeAmount, setContributeAmount] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [category, setCategory] = useState('Savings');
  const [description, setDescription] = useState('');

  const openAddModal = () => {
    setEditingGoal(null);
    setName('');
    setTargetAmount('');
    setCurrentAmount('0');
    // Default 6 months from now
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    setTargetDate(d.toISOString().split('T')[0]);
    setCategory('Savings');
    setDescription('');
    setIsModalOpen(true);
  };

  const openEditModal = (g: Goal) => {
    setEditingGoal(g);
    setName(g.name);
    setTargetAmount(g.targetAmount.toString());
    setCurrentAmount(g.currentAmount.toString());
    setTargetDate(g.targetDate);
    setCategory(g.category || 'Savings');
    setDescription(g.description || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const numTarget = parseFloat(targetAmount);
    const numCurrent = parseFloat(currentAmount) || 0;

    if (!name.trim()) {
      toast('Please enter a goal name', 'error');
      return;
    }
    if (isNaN(numTarget) || numTarget <= 0) {
      toast('Please enter a valid target amount', 'error');
      return;
    }
    if (!targetDate) {
      toast('Please select a target date', 'error');
      return;
    }

    try {
      await saveGoal({
        id: editingGoal?.id,
        name: name.trim(),
        targetAmount: numTarget,
        currentAmount: numCurrent,
        currency: displayCurrency,
        targetDate,
        category,
        description: description.trim() || undefined,
        isCompleted: numCurrent >= numTarget,
      });
      toast(editingGoal ? 'Goal updated' : 'Goal created successfully', 'success');
      setIsModalOpen(false);
    } catch (err: any) {
      toast(err.message || 'Failed to save goal', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteGoal(id);
      toast('Goal removed', 'info');
    } catch (err: any) {
      toast(err.message || 'Failed to delete goal', 'error');
    }
  };

  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributeGoalItem) return;

    const amt = parseFloat(contributeAmount);
    if (isNaN(amt) || amt <= 0) {
      toast('Please enter a valid contribution amount', 'error');
      return;
    }

    try {
      await contributeToGoal(contributeGoalItem.id, amt);
      toast(`Contributed ${formatCurrency(amt, displayCurrency)} to ${contributeGoalItem.name}!`, 'success');
      setContributeGoalItem(null);
      setContributeAmount('');
    } catch (err: any) {
      toast(err.message || 'Contribution failed', 'error');
    }
  };

  // Helper to calculate required monthly savings
  const calculateRequiredMonthly = (g: Goal): number => {
    const remaining = Math.max(0, g.targetAmount - g.currentAmount);
    if (remaining === 0) return 0;

    const now = new Date();
    const target = new Date(g.targetDate);
    const diffMonths = Math.max(1, (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth()));

    return Number((remaining / diffMonths).toFixed(2));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Financial Goals
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Track purposeful savings, milestones, and required monthly contributions
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all hover:scale-105 active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create Goal
        </button>
      </div>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <EmptyState
          title="No financial goals set"
          description="Create savings targets for an Emergency Fund, a New Device, a Vacation, or Long-Term Investments to calculate required monthly savings."
          actionText="Create Your First Goal"
          onAction={openAddModal}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {goals.map(g => {
            const remaining = Math.max(0, g.targetAmount - g.currentAmount);
            const percentage = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0;
            const requiredMonthly = calculateRequiredMonthly(g);
            const isFinished = g.isCompleted || percentage >= 100;

            return (
              <div
                key={g.id}
                className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4 hover:shadow-md transition-shadow group relative overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                      <Target className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                        {g.name}
                      </h3>
                      <span className="text-[11px] text-slate-400">{g.category}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditModal(g)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(g.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {g.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {g.description}
                  </p>
                )}

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {formatCurrency(g.currentAmount, displayCurrency)}
                    </span>
                    <span className="text-slate-400">
                      of {formatCurrency(g.targetAmount, displayCurrency)}
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-500"
                      style={{ width: `${Math.min(100, percentage)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {percentage.toFixed(0)}% reached
                    </span>
                    <span className="text-slate-400">
                      {remaining > 0 ? `${formatCurrency(remaining, displayCurrency)} left` : 'Completed!'}
                    </span>
                  </div>
                </div>

                {/* Target Date & Required Monthly */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800/80 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Target Date:</span>
                    <strong className="text-slate-800 dark:text-slate-200">
                      {new Date(g.targetDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </strong>
                  </div>
                  {!isFinished && (
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                      <span>Required Monthly:</span>
                      <strong className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        {formatCurrency(requiredMonthly, displayCurrency)}/mo
                      </strong>
                    </div>
                  )}
                </div>

                {/* Action button */}
                <button
                  onClick={() => {
                    setContributeGoalItem(g);
                    setContributeAmount('');
                  }}
                  className="w-full py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-500" />
                  Add Contribution
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Goal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {editingGoal ? 'Edit Goal' : 'Create Financial Goal'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-xl text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Goal Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Emergency Fund, New Laptop"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Target Amount *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="0.00"
                    value={targetAmount}
                    onChange={e => setTargetAmount(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Current Amount
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={currentAmount}
                    onChange={e => setCurrentAmount(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Target Date *
                </label>
                <input
                  type="date"
                  required
                  value={targetDate}
                  onChange={e => setTargetDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-900 dark:text-white"
                >
                  <option value="Savings">Savings & Emergency</option>
                  <option value="Electronics">Electronics & Hardware</option>
                  <option value="Travel">Travel & Vacation</option>
                  <option value="Education">Education</option>
                  <option value="Vehicle">Car & Transport</option>
                  <option value="Investment">Investments</option>
                  <option value="Other">Other Custom Goal</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Description / Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional details or motivation..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-900 dark:text-white resize-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
                >
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contribution Modal */}
      {contributeGoalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Contribute to {contributeGoalItem.name}
              </h3>
              <button onClick={() => setContributeGoalItem(null)} className="p-1 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleContribute} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Contribution Amount ({displayCurrency})
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="0.00"
                  autoFocus
                  value={contributeAmount}
                  onChange={e => setContributeAmount(e.target.value)}
                  className="w-full px-4 py-2.5 text-xl font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <p className="text-xs text-slate-400">
                This adds to your goal's current progress and records a savings transfer entry in your transaction log.
              </p>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setContributeGoalItem(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
                >
                  Deposit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
