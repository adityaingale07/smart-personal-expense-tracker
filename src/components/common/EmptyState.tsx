import React from 'react';
import { LucideIcon, PlusCircle, ArrowDownLeft, ArrowUpRight, Upload } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
  onAddExpense?: () => void;
  onAddIncome?: () => void;
  onImport?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
  secondaryActionText,
  onSecondaryAction,
  onAddExpense,
  onAddIncome,
  onImport,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 backdrop-blur-sm ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 ring-8 ring-emerald-50/50 dark:ring-emerald-950/20">
        {Icon ? <Icon className="w-7 h-7" /> : <PlusCircle className="w-7 h-7" />}
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1.5">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6">{description}</p>

      {/* Primary / Secondary custom action */}
      {actionText && onAction && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={onAction}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
          >
            {actionText}
          </button>
          {secondaryActionText && onSecondaryAction && (
            <button
              onClick={onSecondaryAction}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            >
              {secondaryActionText}
            </button>
          )}
        </div>
      )}

      {/* Standard Finance Empty Action Trio */}
      {onAddExpense && onAddIncome && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={onAddExpense}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-colors"
          >
            <ArrowUpRight className="w-4 h-4" />
            Add Expense
          </button>
          <button
            onClick={onAddIncome}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
          >
            <ArrowDownLeft className="w-4 h-4" />
            Add Income
          </button>
          {onImport && (
            <button
              onClick={onImport}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Import Transactions
            </button>
          )}
        </div>
      )}
    </div>
  );
};
