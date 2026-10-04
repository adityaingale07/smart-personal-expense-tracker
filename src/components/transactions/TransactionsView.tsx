import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Transaction, TransactionType } from '../../types';
import { formatCurrency } from '../../services/currency';
import { CategoryIcon } from '../common/CategoryIcon';
import { TransactionModal } from './TransactionModal';
import { ReceiptViewerModal } from './ReceiptViewerModal';
import { EmptyState } from '../common/EmptyState';
import {
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  Paperclip,
  Repeat,
  Copy,
  Trash2,
  Edit2,
  X,
  Calendar,
  ChevronDown,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft
} from 'lucide-react';

interface TransactionsViewProps {
  onOpenTransactionModal: (type?: TransactionType) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({ onOpenTransactionModal }) => {
  const {
    transactions,
    categories,
    displayCurrency,
    deleteTransaction,
    duplicateTransaction,
  } = useFinance();

  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [recurringOnly, setRecurringOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');

  // Modals
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<{ url: string; name: string } | null>(null);

  const catMap = new Map(categories.map(c => [c.id, c]));

  // Filter & Search Logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const cat = catMap.get(tx.categoryId);
        const match =
          (tx.merchant && tx.merchant.toLowerCase().includes(query)) ||
          (cat && cat.name.toLowerCase().includes(query)) ||
          (tx.notes && tx.notes.toLowerCase().includes(query)) ||
          (tx.tags && tx.tags.some(t => t.toLowerCase().includes(query))) ||
          tx.amount.toString().includes(query) ||
          tx.id.toLowerCase().includes(query);

        if (!match) return false;
      }

      // Type filter
      if (selectedType !== 'all' && tx.type !== selectedType) return false;

      // Category filter
      if (selectedCategory !== 'all' && tx.categoryId !== selectedCategory) return false;

      // Date range
      if (startDate && tx.date < startDate) return false;
      if (endDate && tx.date > endDate) return false;

      // Payment method
      if (paymentMethodFilter !== 'all' && tx.paymentMethod !== paymentMethodFilter) return false;

      // Recurring only
      if (recurringOnly && !tx.isRecurring) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'date_desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === 'date_asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === 'amount_desc') return (b.convertedAmount || b.amount) - (a.convertedAmount || a.amount);
      if (sortBy === 'amount_asc') return (a.convertedAmount || a.amount) - (b.convertedAmount || b.amount);
      return 0;
    });
  }, [transactions, searchTerm, selectedType, selectedCategory, startDate, endDate, paymentMethodFilter, recurringOnly, sortBy, catMap]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedType('all');
    setSelectedCategory('all');
    setStartDate('');
    setEndDate('');
    setPaymentMethodFilter('all');
    setRecurringOnly(false);
    setSortBy('date_desc');
  };

  const hasActiveFilters =
    searchTerm ||
    selectedType !== 'all' ||
    selectedCategory !== 'all' ||
    startDate ||
    endDate ||
    paymentMethodFilter !== 'all' ||
    recurringOnly;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Transactions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage, filter, search, and audit your personal transactions
          </p>
        </div>

        <button
          onClick={() => onOpenTransactionModal('expense')}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all hover:scale-105 active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Transaction
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by merchant, category, notes, tags, amount..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-xs font-semibold border transition-colors ${
                showFilters || hasActiveFilters
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              Filters
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 ml-1" />
              )}
            </button>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="flex-1 sm:flex-initial px-3 py-2.5 text-xs font-semibold rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            >
              <option value="date_desc">Newest First</option>
              <option value="date_asc">Oldest First</option>
              <option value="amount_desc">Highest Amount</option>
              <option value="amount_asc">Lowest Amount</option>
            </select>
          </div>
        </div>

        {/* Collapsible Advanced Filters Drawer */}
        {showFilters && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 animate-in fade-in duration-100">
            {/* Type Filter */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Type
              </label>
              <select
                value={selectedType}
                onChange={e => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-800 dark:text-slate-200"
              >
                <option value="all">All Types</option>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
                <option value="transfer">Transfer</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-800 dark:text-slate-200"
              >
                <option value="all">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Start */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-800 dark:text-slate-200"
              />
            </div>

            {/* Date Range End */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-800 dark:text-slate-200"
              />
            </div>

            {/* Recurring toggle & Clear filter */}
            <div className="sm:col-span-2 md:col-span-4 flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={recurringOnly}
                  onChange={e => setRecurringOnly(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Show Recurring Transactions Only</span>
              </label>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-semibold"
                >
                  Clear all filters
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Transactions List Table / Empty State */}
      {transactions.length === 0 ? (
        <EmptyState
          title="No transactions recorded"
          description="Your transactions list is currently empty. Record your daily expenses or income to manage your financial ledger."
          onAddExpense={() => onOpenTransactionModal('expense')}
          onAddIncome={() => onOpenTransactionModal('income')}
        />
      ) : filteredTransactions.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
            No transactions match your current filters or search term.
          </p>
          <button
            onClick={clearFilters}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-4 px-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Showing {filteredTransactions.length} of {transactions.length} transactions</span>
            <span>Display currency: <strong className="text-slate-700 dark:text-slate-300">{displayCurrency}</strong></span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredTransactions.map(tx => {
              const cat = catMap.get(tx.categoryId);
              const isExpense = tx.type === 'expense';
              const isIncome = tx.type === 'income';

              return (
                <div
                  key={tx.id}
                  className="p-4 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors group"
                >
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 sm:mt-0"
                      style={{ backgroundColor: `${cat?.color || '#94a3b8'}20` }}
                    >
                      <CategoryIcon
                        name={cat?.icon || 'Tag'}
                        className="w-5 h-5"
                        color={cat?.color || '#94a3b8'}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {tx.merchant || cat?.name || 'Transaction'}
                        </h4>
                        {tx.isRecurring && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                            <Repeat className="w-2.5 h-2.5" /> Recurring
                          </span>
                        )}
                        {tx.receiptUrl && (
                          <button
                            type="button"
                            onClick={() => setSelectedReceipt({ url: tx.receiptUrl!, name: tx.receiptName || 'Receipt' })}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 hover:underline"
                          >
                            <Paperclip className="w-2.5 h-2.5" /> Receipt
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 flex-wrap">
                        <span>{tx.date}</span>
                        <span>•</span>
                        <span>{cat?.name || 'General'}</span>
                        <span>•</span>
                        <span>{tx.paymentMethod}</span>

                        {/* Multi-currency breakdown */}
                        {tx.currency !== displayCurrency && (
                          <>
                            <span>•</span>
                            <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px] text-slate-600 dark:text-slate-300">
                              {formatCurrency(tx.amount, tx.currency)} (1 {tx.currency} = {tx.exchangeRate} {displayCurrency})
                            </span>
                          </>
                        )}
                      </div>

                      {tx.notes && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">
                          "{tx.notes}"
                        </p>
                      )}

                      {tx.tags && tx.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {tx.tags.map(t => (
                            <span
                              key={t}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 self-end sm:self-auto w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-slate-100 dark:border-slate-800">
                    <div className="text-left sm:text-right">
                      <div
                        className={`font-mono font-bold text-base sm:text-lg ${
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
                      <span className="text-[11px] text-slate-400 capitalize">{tx.type}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingTransaction(tx)}
                        title="Edit"
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => duplicateTransaction(tx)}
                        title="Duplicate"
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteTransaction(tx.id)}
                        title="Delete"
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {editingTransaction && (
        <TransactionModal
          isOpen={true}
          onClose={() => setEditingTransaction(null)}
          initialData={editingTransaction}
        />
      )}

      {/* Receipt Viewer Modal */}
      <ReceiptViewerModal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        receiptUrl={selectedReceipt?.url}
        receiptName={selectedReceipt?.name}
      />
    </div>
  );
};
