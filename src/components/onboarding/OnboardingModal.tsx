import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { SUPPORTED_CURRENCIES } from '../../services/currency';
import { INITIAL_CATEGORY_TEMPLATES } from '../../services/defaultCategories';
import { CategoryIcon } from '../common/CategoryIcon';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Sun,
  Moon,
  Monitor,
  Bell,
  Coins,
  DollarSign,
  Layers,
  ChevronRight
} from 'lucide-react';

export const OnboardingModal: React.FC = () => {
  const { user, completeOnboarding } = useAuth();
  const { theme, setTheme } = useTheme();

  const [step, setStep] = useState<number>(1);
  const [selectedCurrency, setSelectedCurrency] = useState<string>(user?.preferredCurrency || 'USD');
  const [currencySearch, setCurrencySearch] = useState<string>('');
  const [monthlyIncome, setMonthlyIncome] = useState<string>(user?.monthlyIncome ? user.monthlyIncome.toString() : '');
  const [monthlySpendingTarget, setMonthlySpendingTarget] = useState<string>('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    INITIAL_CATEGORY_TEMPLATES.filter(c => c.type === 'expense').map(c => c.name)
  );
  const [notifications, setNotifications] = useState<boolean>(true);
  const [appearance, setAppearance] = useState<'light' | 'dark' | 'system'>(theme);
  const [isFinishing, setIsFinishing] = useState<boolean>(false);

  // If user has already completed onboarding, do not render
  if (!user || user.onboardingCompleted) return null;

  const totalSteps = 6;

  const toggleCategory = (catName: string) => {
    if (selectedCategories.includes(catName)) {
      setSelectedCategories(selectedCategories.filter(c => c !== catName));
    } else {
      setSelectedCategories([...selectedCategories, catName]);
    }
  };

  const handleFinish = async () => {
    setIsFinishing(true);
    try {
      await completeOnboarding({
        currency: selectedCurrency,
        monthlyIncome: monthlyIncome ? parseFloat(monthlyIncome) : undefined,
        monthlySpendingTarget: monthlySpendingTarget ? parseFloat(monthlySpendingTarget) : undefined,
        categories: selectedCategories,
        notifications,
        theme: appearance,
      });
      setTheme(appearance);
    } catch (err) {
      console.error('Failed to complete onboarding', err);
    } finally {
      setIsFinishing(false);
    }
  };

  const filteredCurrencies = SUPPORTED_CURRENCIES.filter(c =>
    c.code.toLowerCase().includes(currencySearch.toLowerCase()) ||
    c.name.toLowerCase().includes(currencySearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Progress Bar & Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Welcome to Spendly
            </span>
            <span className="text-xs font-semibold text-slate-400">
              Step {step} of {totalSteps}
            </span>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all duration-300 rounded-full"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 scrollbar-thin">
          {/* STEP 1: CURRENCY */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                  1. What currency do you primarily use?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select your primary account currency. You can still log transactions in any world currency with automatic conversion.
                </p>
              </div>

              <input
                type="text"
                placeholder="Search by code or country name..."
                value={currencySearch}
                onChange={e => setCurrencySearch(e.target.value)}
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />

              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto p-1 scrollbar-thin">
                {filteredCurrencies.map(curr => {
                  const isSelected = selectedCurrency === curr.code;
                  return (
                    <button
                      key={curr.code}
                      type="button"
                      onClick={() => setSelectedCurrency(curr.code)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base">{curr.flag}</span>
                        <div className="truncate">
                          <div className="font-bold text-xs">{curr.code}</div>
                          <div className="text-[10px] text-slate-400 truncate">{curr.name}</div>
                        </div>
                      </div>
                      <span className="font-mono text-xs font-semibold shrink-0 ml-1">{curr.symbol}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: MONTHLY INCOME */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                  2. What is your monthly income?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Optional. This helps Spendly calculate your baseline savings rate and cashflow ratio. You can update or skip this anytime.
                </p>
              </div>

              <div className="pt-4">
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-base font-bold text-slate-400">
                    {selectedCurrency}
                  </span>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={monthlyIncome}
                    onChange={e => setMonthlyIncome(e.target.value)}
                    autoFocus
                    className="w-full pl-16 pr-4 py-3 text-2xl font-bold font-mono rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: SPENDING TARGET */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                  3. What is your monthly spending target?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Setting an overall monthly limit allows Spendly to provide real-time budget adherence tracking and warnings.
                </p>
              </div>

              <div className="pt-4">
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-base font-bold text-slate-400">
                    {selectedCurrency}
                  </span>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 2500"
                    value={monthlySpendingTarget}
                    onChange={e => setMonthlySpendingTarget(e.target.value)}
                    autoFocus
                    className="w-full pl-16 pr-4 py-3 text-2xl font-bold font-mono rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: CATEGORIES */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                    4. Which categories do you want to track?
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Choose the expense categories relevant to your lifestyle. You can customize, rename, or delete these anytime.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto p-1 scrollbar-thin">
                {INITIAL_CATEGORY_TEMPLATES.filter(c => c.type === 'expense').map(cat => {
                  const isChecked = selectedCategories.includes(cat.name);
                  return (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => toggleCategory(cat.name)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                        isChecked
                          ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30 text-slate-900 dark:text-white'
                          : 'border-slate-200 dark:border-slate-800 opacity-60 hover:opacity-100 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${cat.color}20` }}
                      >
                        <CategoryIcon name={cat.icon} className="w-4 h-4" color={cat.color} />
                      </div>
                      <span className="text-xs font-medium truncate flex-1">{cat.name}</span>
                      {isChecked && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 5: NOTIFICATIONS */}
          {step === 5 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                  5. Do you want smart notifications?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Receive in-app alerts when budgets reach 80% or 100%, when subscriptions are upcoming, and when goals hit milestones.
                </p>
              </div>

              <div className="pt-4 space-y-3">
                <button
                  type="button"
                  onClick={() => setNotifications(true)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all ${
                    notifications
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white">
                        Yes, keep me notified
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Get proactive warnings before spending runs over budget
                      </div>
                    </div>
                  </div>
                  {notifications && <Check className="w-5 h-5 text-emerald-600" />}
                </button>

                <button
                  type="button"
                  onClick={() => setNotifications(false)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all ${
                    !notifications
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
                      <Bell className="w-5 h-5 opacity-40" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white">
                        No, disable alerts
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Keep the dashboard quiet with no alert notifications
                      </div>
                    </div>
                  </div>
                  {!notifications && <Check className="w-5 h-5 text-emerald-600" />}
                </button>
              </div>
            </div>
          )}

          {/* STEP 6: APPEARANCE */}
          {step === 6 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                  6. Light or Dark appearance?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Choose the visual theme for your personal finance workspace.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setAppearance('light'); setTheme('light'); }}
                  className={`flex flex-col items-center justify-center p-5 rounded-2xl border text-center transition-all ${
                    appearance === 'light'
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <Sun className="w-6 h-6 text-amber-500 mb-2" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Light</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setAppearance('dark'); setTheme('dark'); }}
                  className={`flex flex-col items-center justify-center p-5 rounded-2xl border text-center transition-all ${
                    appearance === 'dark'
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <Moon className="w-6 h-6 text-indigo-400 mb-2" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Dark</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setAppearance('system'); setTheme('system'); }}
                  className={`flex flex-col items-center justify-center p-5 rounded-2xl border text-center transition-all ${
                    appearance === 'system'
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <Monitor className="w-6 h-6 text-slate-400 mb-2" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">System</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            {/* Optional step skip */}
            {(step === 2 || step === 3) && (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-2 py-1"
              >
                Skip
              </button>
            )}

            {step < totalSteps ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                disabled={isFinishing}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
              >
                {isFinishing ? 'Setting Up...' : 'Go to Dashboard'} <Sparkles className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
