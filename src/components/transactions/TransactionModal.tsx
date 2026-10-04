import React, { useState, useEffect } from 'react';
import { Transaction, Category, TransactionType } from '../../types';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/Toast';
import { getExchangeRate, convertCurrency, formatCurrency } from '../../services/currency';
import { CategoryIcon } from '../common/CategoryIcon';
import { CurrencySelector } from '../common/CurrencySelector';
import {
  X,
  ChevronDown,
  ChevronUp,
  Paperclip,
  Calendar,
  DollarSign,
  ArrowRightLeft,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  Tag,
  Building,
  FileText,
  Repeat
} from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Transaction | null;
  defaultType?: TransactionType;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  initialData,
  defaultType = 'expense',
}) => {
  const { user } = useAuth();
  const { categories, addTransaction, updateTransaction, exchangeRates } = useFinance();
  const { toast } = useToast();

  const [amount, setAmount] = useState<string>('');
  const [type, setType] = useState<TransactionType>(defaultType);
  const [currency, setCurrency] = useState<string>('USD');
  const [categoryId, setCategoryId] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Collapsible Advanced Fields
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [merchant, setMerchant] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('Credit Card');
  const [notes, setNotes] = useState<string>('');
  const [tagInput, setTagInput] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [receiptUrl, setReceiptUrl] = useState<string>('');
  const [receiptName, setReceiptName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Initialize form state
  useEffect(() => {
    if (initialData) {
      setAmount(initialData.amount.toString());
      setType(initialData.type);
      setCurrency(initialData.currency);
      setCategoryId(initialData.categoryId || '');
      setDate(initialData.date);
      setMerchant(initialData.merchant || '');
      setPaymentMethod(initialData.paymentMethod || 'Credit Card');
      setNotes(initialData.notes || '');
      setTags(initialData.tags || []);
      setIsRecurring(initialData.isRecurring || false);
      setReceiptUrl(initialData.receiptUrl || '');
      setReceiptName(initialData.receiptName || '');
      setShowAdvanced(true);
    } else {
      setAmount('');
      setType(defaultType);
      const userCurr = user?.preferredCurrency || 'USD';
      setCurrency(userCurr);
      setDate(new Date().toISOString().split('T')[0]);
      setMerchant('');
      setPaymentMethod('Credit Card');
      setNotes('');
      setTags([]);
      setIsRecurring(false);
      setReceiptUrl('');
      setReceiptName('');
      setShowAdvanced(false);

      // Default category for this type
      const relevantCats = categories.filter(c => c.type === defaultType);
      if (relevantCats.length > 0) {
        setCategoryId(relevantCats[0].id);
      } else {
        setCategoryId('');
      }
    }
  }, [initialData, isOpen, defaultType, user?.preferredCurrency, categories]);

  // When type changes, update category selection if current one doesn't match
  const filteredCategories = categories.filter(c => c.type === type);

  useEffect(() => {
    if (!initialData && filteredCategories.length > 0) {
      const match = filteredCategories.find(c => c.id === categoryId);
      if (!match) {
        setCategoryId(filteredCategories[0].id);
      }
    }
  }, [type, filteredCategories, categoryId, initialData]);

  // Live currency conversion display calculation
  const numericAmount = parseFloat(amount) || 0;
  const userPreferredCurrency = user?.preferredCurrency || 'USD';
  const liveRate = exchangeRates
    ? getExchangeRate(currency, userPreferredCurrency, exchangeRates)
    : 1.0;
  const convertedPreview = convertCurrency(numericAmount, currency, userPreferredCurrency, liveRate);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast('Receipt file size must be under 5MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setReceiptUrl(reader.result as string);
      setReceiptName(file.name);
      toast('Receipt attached successfully', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
      toast('Please enter a valid amount greater than 0', 'error');
      return;
    }

    if (!date) {
      toast('Please select a transaction date', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (initialData) {
        await updateTransaction({
          ...initialData,
          amount: numericAmount,
          currency,
          type,
          categoryId: categoryId || 'other',
          merchant: merchant.trim() || undefined,
          date,
          paymentMethod,
          notes: notes.trim() || undefined,
          tags,
          isRecurring,
          receiptUrl: receiptUrl || undefined,
          receiptName: receiptName || undefined,
        });
        toast('Transaction updated successfully', 'success');
      } else {
        await addTransaction({
          amount: numericAmount,
          currency,
          type,
          categoryId: categoryId || 'other',
          merchant: merchant.trim() || undefined,
          date,
          paymentMethod,
          notes: notes.trim() || undefined,
          tags,
          isRecurring,
          receiptUrl: receiptUrl || undefined,
          receiptName: receiptName || undefined,
        });
        toast('Transaction recorded successfully', 'success');
      }
      onClose();
    } catch (err: any) {
      toast(err.message || 'Failed to save transaction', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {initialData ? 'Edit Transaction' : 'Record Transaction'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin">
          {/* Type Selector: Expense / Income / Transfer */}
          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                type === 'expense'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700/50'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700/50'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              Income
            </button>
            <button
              type="button"
              onClick={() => setType('transfer')}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                type === 'transfer'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700/50'
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              Transfer
            </button>
          </div>

          {/* Amount & Currency Input (Primary Flow Step 1 & 2) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Amount & Currency
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  required
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  autoFocus
                  className="w-full pl-4 pr-3 py-3 text-2xl font-bold font-mono rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
              <CurrencySelector
                value={currency}
                onChange={setCurrency}
                className="self-stretch flex items-center"
              />
            </div>

            {/* Live Exchange Rate Preview */}
            {currency !== userPreferredCurrency && numericAmount > 0 && (
              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 bg-slate-100 dark:bg-slate-800/50 p-2 rounded-xl">
                <span>Converted:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {formatCurrency(convertedPreview, userPreferredCurrency)}
                </span>
                <span className="text-slate-400">
                  (1 {currency} = {liveRate} {userPreferredCurrency})
                </span>
              </div>
            )}
          </div>

          {/* Category Selector (Primary Flow Step 3) */}
          {type !== 'transfer' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-1 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/30 dark:bg-slate-800/20 scrollbar-thin">
                {filteredCategories.map(cat => {
                  const isSelected = categoryId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategoryId(cat.id)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-medium text-left transition-all ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/20'
                          : 'bg-white dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50'
                      }`}
                    >
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : `${cat.color}20` }}
                      >
                        <CategoryIcon
                          name={cat.icon}
                          className="w-3.5 h-3.5"
                          color={isSelected ? '#ffffff' : cat.color}
                        />
                      </div>
                      <span className="truncate">{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Date Picker (Primary Flow Step 4) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Date
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
          </div>

          {/* Collapsible Advanced Details */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors py-1"
            >
              <span>{showAdvanced ? 'Hide Additional Details' : 'Show Additional Details (Merchant, Receipt, Notes, Tags)'}</span>
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showAdvanced && (
              <div className="mt-4 space-y-4 animate-in fade-in duration-100">
                {/* Merchant / Payee */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Merchant / Payee
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. Starbucks, Amazon, Landlord"
                      value={merchant}
                      onChange={e => setMerchant(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Payment Method
                  </label>
                  <div className="relative">
                    <CreditCard className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <select
                      value={paymentMethod}
                      onChange={e => setPaymentMethod(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    >
                      <option value="Credit Card">Credit Card</option>
                      <option value="Debit Card">Debit Card</option>
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="UPI">UPI / Digital Wallet</option>
                      <option value="PayPal">PayPal</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Notes
                  </label>
                  <div className="relative">
                    <FileText className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <textarea
                      rows={2}
                      placeholder="Add transaction notes or details..."
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none"
                    />
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Tags
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Vacation, TaxDeductible"
                      value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                      className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-3 py-2 text-xs font-medium bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-xl transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {tags.map(t => (
                        <span
                          key={t}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                        >
                          #{t}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(t)}
                            className="text-slate-400 hover:text-rose-500"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Receipt Upload */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Attach Receipt (JPG, PNG, PDF up to 5MB)
                  </label>
                  {receiptUrl ? (
                    <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <Paperclip className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="text-xs text-slate-700 dark:text-slate-300 truncate">
                          {receiptName || 'Receipt file attached'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setReceiptUrl(''); setReceiptName(''); }}
                        className="text-xs text-rose-500 hover:underline ml-2"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer text-xs text-slate-500 transition-colors">
                      <Paperclip className="w-4 h-4" />
                      <span>Upload receipt image or document</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Recurring Checkbox */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isRecurringCheckbox"
                    checked={isRecurring}
                    onChange={e => setIsRecurring(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700"
                  />
                  <label htmlFor="isRecurringCheckbox" className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer">
                    <Repeat className="w-3.5 h-3.5 text-emerald-500" />
                    Mark as Recurring Transaction
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : initialData ? 'Update Transaction' : 'Save Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
