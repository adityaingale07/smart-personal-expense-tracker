import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import { BrandLogo } from '../common/BrandLogo';
import { CurrencySelector } from '../common/CurrencySelector';
import { NotificationCenter } from '../common/NotificationCenter';
import {
  LayoutDashboard,
  ArrowRightLeft,
  PieChart,
  TrendingUp,
  Target,
  Tv,
  Sparkles,
  FileSpreadsheet,
  Settings,
  Plus,
  LogOut,
  Menu,
  X,
  Sliders,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

interface AppLayoutProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenTransactionModal: (type?: 'expense' | 'income') => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentView,
  onNavigate,
  onOpenTransactionModal,
  children,
}) => {
  const { user, logout } = useAuth();
  const { displayCurrency, setDisplayCurrency } = useFinance();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: ArrowRightLeft },
    { id: 'budgets', label: 'Budgets', icon: PieChart },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'subscriptions', label: 'Subscriptions', icon: Tv },
    { id: 'insights', label: 'Insights & Health', icon: Sparkles },
    { id: 'reports', label: 'Reports & Export', icon: FileSpreadsheet },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (viewId: string) => {
    onNavigate(viewId);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 flex flex-col md:flex-row">
      {/* DESKTOP / TABLET SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 border-r border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0F1422] p-5 shrink-0 h-screen sticky top-0 justify-between select-none">
        <div className="space-y-6">
          {/* Brand Logo */}
          <div className="px-2 pt-2">
            <BrandLogo size="md" />
          </div>

          {/* Prominent '+ Add Transaction' Button */}
          <button
            onClick={() => onOpenTransactionModal('expense')}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Transaction</span>
          </button>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {user?.fullName || 'User'}
                </h4>
                <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>

            <button
              onClick={() => logout()}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* MOBILE TOP BAR */}
      <header className="md:hidden sticky top-0 z-40 bg-white/90 dark:bg-[#0B0F19]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
        <BrandLogo size="sm" />

        <div className="flex items-center gap-2">
          <CurrencySelector
            value={displayCurrency}
            onChange={setDisplayCurrency}
            compact
          />
          <NotificationCenter />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[57px] z-50 bg-white dark:bg-[#0F1422] p-5 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-top-5">
          <div className="space-y-4">
            <button
              onClick={() => {
                onOpenTransactionModal('expense');
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-bold text-sm bg-emerald-600 text-white shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Add Transaction</span>
            </button>

            <nav className="space-y-1">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold ${
                      isActive
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => logout()}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar for Desktop */}
        <header className="hidden md:flex h-16 border-b border-slate-200/80 dark:border-slate-800/80 px-8 items-center justify-between bg-white/50 dark:bg-[#0B0F19]/50 backdrop-blur-sm sticky top-0 z-30">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
            <span>Spendly</span>
            <span>/</span>
            <span className="capitalize text-slate-800 dark:text-slate-200 font-semibold">
              {currentView}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Display Currency:</span>
              <CurrencySelector
                value={displayCurrency}
                onChange={setDisplayCurrency}
                compact
              />
            </div>

            <NotificationCenter />
          </div>
        </header>

        {/* View Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 md:pb-8">
          {children}
        </main>
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0B0F19]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-4 py-2 flex items-center justify-around">
        <button
          onClick={() => handleNavClick('dashboard')}
          className={`flex flex-col items-center gap-1 text-[10px] font-semibold py-1 px-2 rounded-xl ${
            currentView === 'dashboard'
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => handleNavClick('transactions')}
          className={`flex flex-col items-center gap-1 text-[10px] font-semibold py-1 px-2 rounded-xl ${
            currentView === 'transactions'
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <ArrowRightLeft className="w-5 h-5" />
          <span>Ledger</span>
        </button>

        {/* Center Quick Add Action */}
        <button
          onClick={() => onOpenTransactionModal('expense')}
          className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 -mt-5"
        >
          <Plus className="w-6 h-6" />
        </button>

        <button
          onClick={() => handleNavClick('budgets')}
          className={`flex flex-col items-center gap-1 text-[10px] font-semibold py-1 px-2 rounded-xl ${
            currentView === 'budgets'
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <PieChart className="w-5 h-5" />
          <span>Budgets</span>
        </button>

        <button
          onClick={() => handleNavClick('analytics')}
          className={`flex flex-col items-center gap-1 text-[10px] font-semibold py-1 px-2 rounded-xl ${
            currentView === 'analytics'
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <TrendingUp className="w-5 h-5" />
          <span>Analytics</span>
        </button>
      </nav>
    </div>
  );
};
