import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Subscription, RecurringTransaction, BillingCycle, RecurrenceFrequency } from '../../types';
import { formatCurrency } from '../../services/currency';
import { EmptyState } from '../common/EmptyState';
import { useToast } from '../common/Toast';
import {
  Tv,
  Repeat,
  Plus,
  Calendar,
  AlertCircle,
  Play,
  Pause,
  Trash2,
  Edit2,
  X,
  CreditCard,
  DollarSign
} from 'lucide-react';

export const SubscriptionsView: React.FC = () => {
  const {
    subscriptions,
    recurringTransactions,
    categories,
    displayCurrency,
    saveSubscription,
    deleteSubscription,
    saveRecurring,
    deleteRecurring,
  } = useFinance();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'subscriptions' | 'recurring'>('subscriptions');

  // Subscription modal
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [subName, setSubName] = useState('');
  const [subAmount, setSubAmount] = useState('');
  const [subCycle, setSubCycle] = useState<BillingCycle>('monthly');
  const [subNextDate, setSubNextDate] = useState('');
  const [subNotes, setSubNotes] = useState('');

  // Recurring modal
  const [isRecModalOpen, setIsRecModalOpen] = useState(false);
  const [editingRec, setEditingRec] = useState<RecurringTransaction | null>(null);
  const [recDesc, setRecDesc] = useState('');
  const [recAmount, setRecAmount] = useState('');
  const [recType, setRecType] = useState<'expense' | 'income'>('expense');
  const [recFreq, setRecFreq] = useState<RecurrenceFrequency>('monthly');
  const [recStartDate, setRecStartDate] = useState('');
  const [recEndDate, setRecEndDate] = useState('');

  // Subscription KPI Calculations
  const activeSubs = subscriptions.filter(s => s.status === 'active');
  const totalMonthlySubCost = activeSubs.reduce((sum, s) => {
    if (s.billingCycle === 'yearly') return sum + s.amount / 12;
    if (s.billingCycle === 'weekly') return sum + s.amount * 4.33;
    if (s.billingCycle === 'quarterly') return sum + s.amount / 3;
    return sum + s.amount;
  }, 0);

  const totalYearlySubCost = totalMonthlySubCost * 12;

  // Upcoming renewals in the next 7 days
  const now = new Date();
  const in7Days = new Date();
  in7Days.setDate(now.getDate() + 7);
  const in7DaysStr = in7Days.toISOString().split('T')[0];
  const nowStr = now.toISOString().split('T')[0];

  const upcomingRenewals = activeSubs.filter(
    s => s.nextBillingDate >= nowStr && s.nextBillingDate <= in7DaysStr
  );

  // Subscription handlers
  const openAddSub = () => {
    setEditingSub(null);
    setSubName('');
    setSubAmount('');
    setSubCycle('monthly');
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    setSubNextDate(d.toISOString().split('T')[0]);
    setSubNotes('');
    setIsSubModalOpen(true);
  };

  const openEditSub = (s: Subscription) => {
    setEditingSub(s);
    setSubName(s.name);
    setSubAmount(s.amount.toString());
    setSubCycle(s.billingCycle);
    setSubNextDate(s.nextBillingDate);
    setSubNotes(s.notes || '');
    setIsSubModalOpen(true);
  };

  const handleSaveSub = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(subAmount);
    if (!subName.trim() || isNaN(amt) || amt <= 0 || !subNextDate) {
      toast('Please enter valid subscription details', 'error');
      return;
    }

    try {
      await saveSubscription({
        id: editingSub?.id,
        name: subName.trim(),
        amount: amt,
        currency: displayCurrency,
        billingCycle: subCycle,
        nextBillingDate: subNextDate,
        status: editingSub ? editingSub.status : 'active',
        notes: subNotes.trim() || undefined,
      });
      toast(editingSub ? 'Subscription updated' : 'Subscription added', 'success');
      setIsSubModalOpen(false);
    } catch (err: any) {
      toast(err.message || 'Failed to save', 'error');
    }
  };

  const toggleSubStatus = async (s: Subscription) => {
    const newStatus = s.status === 'active' ? 'paused' : 'active';
    await saveSubscription({ ...s, status: newStatus });
    toast(`Subscription ${newStatus === 'active' ? 'resumed' : 'paused'}`, 'info');
  };

  // Recurring handlers
  const openAddRec = () => {
    setEditingRec(null);
    setRecDesc('');
    setRecAmount('');
    setRecType('expense');
    setRecFreq('monthly');
    setRecStartDate(nowStr);
    setRecEndDate('');
    setIsRecModalOpen(true);
  };

  const handleSaveRec = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(recAmount);
    if (!recDesc.trim() || isNaN(amt) || amt <= 0 || !recStartDate) {
      toast('Please enter valid recurring transaction details', 'error');
      return;
    }

    try {
      await saveRecurring({
        id: editingRec?.id,
        description: recDesc.trim(),
        amount: amt,
        currency: displayCurrency,
        type: recType,
        frequency: recFreq,
        startDate: recStartDate,
        endDate: recEndDate || undefined,
        nextDueDate: recStartDate,
        paymentMethod: 'Automatic Payment',
        status: editingRec ? editingRec.status : 'active',
      });
      toast(editingRec ? 'Recurring rule updated' : 'Recurring rule created', 'success');
      setIsRecModalOpen(false);
    } catch (err: any) {
      toast(err.message || 'Failed to save rule', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Subscriptions & Recurring
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your recurring services, billing dates, and automated schedule entries
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'subscriptions' ? (
            <button
              onClick={openAddSub}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Add Subscription
            </button>
          ) : (
            <button
              onClick={openAddRec}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Add Recurring Rule
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards (Subscriptions Summary) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Monthly Subscriptions
          </span>
          <div className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white">
            {formatCurrency(totalMonthlySubCost, displayCurrency)}
          </div>
          <span className="text-[11px] text-slate-400">{activeSubs.length} active services</span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Projected Yearly Cost
          </span>
          <div className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white">
            {formatCurrency(totalYearlySubCost, displayCurrency)}
          </div>
          <span className="text-[11px] text-slate-400">Annual recurring commitment</span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Upcoming Renewals (7 Days)
          </span>
          <div className="text-2xl font-extrabold font-mono text-amber-500">
            {upcomingRenewals.length}
          </div>
          <span className="text-[11px] text-slate-400">Due within one week</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`pb-3 text-xs font-bold transition-all relative ${
            activeTab === 'subscriptions'
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          Active Subscriptions ({subscriptions.length})
          {activeTab === 'subscriptions' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('recurring')}
          className={`pb-3 text-xs font-bold transition-all relative ${
            activeTab === 'recurring'
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          Recurring Rules ({recurringTransactions.length})
          {activeTab === 'recurring' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />
          )}
        </button>
      </div>

      {/* Content */}
      {activeTab === 'subscriptions' ? (
        subscriptions.length === 0 ? (
          <EmptyState
            title="No subscriptions tracked"
            description="Add recurring subscriptions like Netflix, Spotify, AWS, or Gym memberships to monitor your ongoing overhead and renewal dates."
            actionText="Add Subscription"
            onAction={openAddSub}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subscriptions.map(s => {
              const isPaused = s.status === 'paused';
              return (
                <div
                  key={s.id}
                  className={`p-5 rounded-3xl border transition-all ${
                    isPaused
                      ? 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
                      : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                        <Tv className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          {s.name}
                        </h4>
                        <span className="text-[11px] text-slate-400 capitalize">
                          {s.billingCycle} billing
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                        s.status === 'active'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {s.status}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between py-2 border-y border-slate-100 dark:border-slate-800 my-2">
                    <span className="text-xs text-slate-400">Billing Amount:</span>
                    <span className="font-mono font-bold text-base text-slate-900 dark:text-white">
                      {formatCurrency(s.amount, displayCurrency)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-4">
                    <span>Next Billing:</span>
                    <strong className="text-slate-800 dark:text-slate-200">
                      {new Date(s.nextBillingDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </strong>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => toggleSubStatus(s)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                      title={isPaused ? 'Resume' : 'Pause'}
                    >
                      {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => openEditSub(s)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteSubscription(s.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : recurringTransactions.length === 0 ? (
        <EmptyState
          title="No recurring transactions set"
          description="Create recurring rules for salaries, rent, or insurance. The recurring engine automatically generates transactions as dates mature."
          actionText="Add Recurring Rule"
          onAction={openAddRec}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recurringTransactions.map(r => (
            <div
              key={r.id}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Repeat className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      {r.description}
                    </h4>
                    <span className="text-[11px] text-slate-400 capitalize">
                      {r.frequency} • {r.type}
                    </span>
                  </div>
                </div>

                <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                  {formatCurrency(r.amount, displayCurrency)}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Next Due Date:</span>
                  <strong className="text-slate-800 dark:text-slate-200 font-mono">
                    {r.nextDueDate}
                  </strong>
                </div>
                {r.lastGeneratedDate && (
                  <div className="flex justify-between text-slate-400">
                    <span>Last Generated:</span>
                    <strong className="text-slate-800 dark:text-slate-200 font-mono">
                      {r.lastGeneratedDate}
                    </strong>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => deleteRecurring(r.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Subscription Modal */}
      {isSubModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {editingSub ? 'Edit Subscription' : 'Add Subscription'}
              </h3>
              <button onClick={() => setIsSubModalOpen(false)} className="p-1.5 rounded-xl text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSub} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Service Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Netflix, Spotify, iCloud"
                  value={subName}
                  onChange={e => setSubName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Amount ({displayCurrency}) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="0.00"
                    value={subAmount}
                    onChange={e => setSubAmount(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Billing Cycle
                  </label>
                  <select
                    value={subCycle}
                    onChange={e => setSubCycle(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-900 dark:text-white"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                    <option value="weekly">Weekly</option>
                    <option value="quarterly">Quarterly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Next Billing Date *
                </label>
                <input
                  type="date"
                  required
                  value={subNextDate}
                  onChange={e => setSubNextDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsSubModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
                >
                  Save Subscription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Recurring Modal */}
      {isRecModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Create Recurring Rule
              </h3>
              <button onClick={() => setIsRecModalOpen(false)} className="p-1.5 rounded-xl text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRec} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Description / Merchant *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Monthly Rent, Monthly Salary"
                  value={recDesc}
                  onChange={e => setRecDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Amount ({displayCurrency}) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="0.00"
                    value={recAmount}
                    onChange={e => setRecAmount(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Type
                  </label>
                  <select
                    value={recType}
                    onChange={e => setRecType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-900 dark:text-white"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Recurrence Frequency
                </label>
                <select
                  value={recFreq}
                  onChange={e => setRecFreq(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-900 dark:text-white"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={recStartDate}
                    onChange={e => setRecStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={recEndDate}
                    onChange={e => setRecEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsRecModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
                >
                  Save Recurring Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
