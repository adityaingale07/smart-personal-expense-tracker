import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import { useTheme } from '../../context/ThemeContext';
import { CurrencySelector } from '../common/CurrencySelector';
import { useToast } from '../common/Toast';
import {
  saveSupabaseConfig,
  getStoredSupabaseConfig,
  clearSupabaseConfig,
  isSupabaseConfigured
} from '../../services/supabase';
import {
  User,
  Lock,
  Sliders,
  Moon,
  Sun,
  Monitor,
  Bell,
  Database,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Cloud,
  ShieldAlert,
  Save
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { user, updateProfile, changePassword, deleteAccount } = useAuth();
  const { deleteAllTransactions } = useFinance();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  // Profile state
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [countryRegion, setCountryRegion] = useState(user?.countryRegion || '');
  const [preferredCurrency, setPreferredCurrency] = useState(user?.preferredCurrency || 'USD');
  const [monthlyIncome, setMonthlyIncome] = useState(user?.monthlyIncome ? user.monthlyIncome.toString() : '');
  const [monthlySpendingTarget, setMonthlySpendingTarget] = useState(user?.monthlySpendingTarget ? user.monthlySpendingTarget.toString() : '');

  // Password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Supabase Cloud Sync state
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
  const [hasCloudConfig, setHasCloudConfig] = useState(isSupabaseConfigured());

  // Confirmations
  const [showDeleteTxModal, setShowDeleteTxModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

  useEffect(() => {
    const config = getStoredSupabaseConfig();
    if (config) {
      setSupabaseUrl(config.url);
      setSupabaseAnonKey(config.anonKey);
      setHasCloudConfig(true);
    }
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile({
        fullName: fullName.trim(),
        countryRegion: countryRegion.trim() || undefined,
        preferredCurrency,
        monthlyIncome: monthlyIncome ? parseFloat(monthlyIncome) : 0,
        monthlySpendingTarget: monthlySpendingTarget ? parseFloat(monthlySpendingTarget) : 0,
      });
      toast('Profile preferences saved successfully', 'success');
    } catch (err: any) {
      toast(err.message || 'Failed to update profile', 'error');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      toast('New passwords do not match', 'error');
      return;
    }
    const res = await changePassword(oldPassword, newPassword);
    if (res.success) {
      toast('Password changed successfully', 'success');
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } else {
      toast(res.error || 'Password update failed', 'error');
    }
  };

  const handleSaveCloudConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseUrl.trim() || !supabaseAnonKey.trim()) {
      toast('Please provide both Supabase URL and Anon Key', 'error');
      return;
    }
    saveSupabaseConfig(supabaseUrl, supabaseAnonKey);
    setHasCloudConfig(true);
    toast('Supabase configuration saved. Reloading page to connect...', 'success');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleDisconnectCloud = () => {
    clearSupabaseConfig();
    setSupabaseUrl('');
    setSupabaseAnonKey('');
    setHasCloudConfig(false);
    toast('Switched to Local Persistent Engine mode', 'info');
  };

  const handleDeleteAllTx = async () => {
    await deleteAllTransactions();
    setShowDeleteTxModal(false);
    toast('All transaction history cleared', 'info');
  };

  const handleDeleteAcc = async () => {
    await deleteAccount();
    setShowDeleteAccountModal(false);
  };

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-150">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Settings & Preferences
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Manage your account credentials, preferences, appearance, and cloud database
        </p>
      </div>

      {/* Profile Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Profile & Regional Settings</h3>
            <p className="text-xs text-slate-400">Account identity and primary currency</p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Email Address (Read-only)
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Default Account Currency
              </label>
              <CurrencySelector
                value={preferredCurrency}
                onChange={setPreferredCurrency}
                className="w-full"
                showFullName
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Country / Region
              </label>
              <input
                type="text"
                value={countryRegion}
                onChange={e => setCountryRegion(e.target.value)}
                placeholder="e.g. India, United States"
                className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Monthly Income Baseline ({preferredCurrency})
              </label>
              <input
                type="number"
                step="any"
                value={monthlyIncome}
                onChange={e => setMonthlyIncome(e.target.value)}
                className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Monthly Spending Target ({preferredCurrency})
              </label>
              <input
                type="number"
                step="any"
                value={monthlySpendingTarget}
                onChange={e => setMonthlySpendingTarget(e.target.value)}
                className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
            >
              <Save className="w-4 h-4" /> Save Profile
            </button>
          </div>
        </form>
      </div>

      {/* Appearance Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Theme & Appearance</h3>
            <p className="text-xs text-slate-400">Select light mode, dark mode, or system default</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-2">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
              theme === 'light'
                ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Sun className="w-5 h-5 text-amber-500 mb-1.5" />
            <span className="text-xs font-bold text-slate-900 dark:text-white">Light Mode</span>
          </button>

          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
              theme === 'dark'
                ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Moon className="w-5 h-5 text-indigo-400 mb-1.5" />
            <span className="text-xs font-bold text-slate-900 dark:text-white">Dark Mode</span>
          </button>

          <button
            type="button"
            onClick={() => setTheme('system')}
            className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
              theme === 'system'
                ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Monitor className="w-5 h-5 text-slate-400 mb-1.5" />
            <span className="text-xs font-bold text-slate-900 dark:text-white">System Default</span>
          </button>
        </div>
      </div>

      {/* Security / Password */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Account Security</h3>
            <p className="text-xs text-slate-400">Change password and authenticate sessions</p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Current Password
              </label>
              <input
                type="password"
                required
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                New Password
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmNewPassword}
                onChange={e => setConfirmNewPassword(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              Update Password
            </button>
          </div>
        </form>
      </div>

      {/* Database & Cloud Sync Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Database & Cloud Sync (Supabase)
              </h3>
              <p className="text-xs text-slate-400">
                Active Mode: {hasCloudConfig ? 'Connected to Supabase PostgreSQL' : 'Local Persistent Engine (IndexedDB/Storage)'}
              </p>
            </div>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-[11px] font-bold ${
              hasCloudConfig
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                : 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
            }`}
          >
            {hasCloudConfig ? 'Cloud Synced' : 'Local Persistent'}
          </span>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Spendly operates offline-first with full persistence. You can connect your live Supabase project by providing your Project URL and Anon Public Key below. A full PostgreSQL schema with Row Level Security is provided in <code className="font-mono text-emerald-600">supabase/schema.sql</code>.
        </p>

        <form onSubmit={handleSaveCloudConfig} className="space-y-3 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Supabase Project URL
            </label>
            <input
              type="text"
              placeholder="https://xyzcompany.supabase.co"
              value={supabaseUrl}
              onChange={e => setSupabaseUrl(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Supabase Anon Public Key
            </label>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={supabaseAnonKey}
              onChange={e => setSupabaseAnonKey(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            {hasCloudConfig ? (
              <button
                type="button"
                onClick={handleDisconnectCloud}
                className="text-xs text-rose-500 hover:underline"
              >
                Disconnect Supabase Cloud
              </button>
            ) : <div />}

            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            >
              Connect Cloud Database
            </button>
          </div>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="bg-rose-50/30 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-rose-900 dark:text-rose-200">Danger Zone</h3>
            <p className="text-xs text-rose-700/80 dark:text-rose-400">Irreversible account and data actions</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => setShowDeleteTxModal(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 text-rose-600 border border-rose-300 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
          >
            Clear All Transactions
          </button>
          <button
            onClick={() => setShowDeleteAccountModal(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-colors"
          >
            Delete Account Permanently
          </button>
        </div>
      </div>

      {/* Confirmation Modals */}
      {showDeleteTxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-center text-slate-900 dark:text-white">
              Delete all transactions?
            </h4>
            <p className="text-xs text-center text-slate-500">
              This action cannot be undone. All your logged expenses, incomes, and attached receipts will be erased.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowDeleteTxModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAllTx}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-center text-slate-900 dark:text-white">
              Permanently delete account?
            </h4>
            <p className="text-xs text-center text-slate-500">
              Your profile, categories, transactions, budgets, and goals will be completely destroyed.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowDeleteAccountModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAcc}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
