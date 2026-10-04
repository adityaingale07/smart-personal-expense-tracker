import React, { useState, useRef, useEffect } from 'react';
import { SUPPORTED_CURRENCIES } from '../../services/currency';
import { ChevronDown, Search } from 'lucide-react';

interface CurrencySelectorProps {
  value: string;
  onChange: (code: string) => void;
  className?: string;
  compact?: boolean;
  showFullName?: boolean;
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  value,
  onChange,
  className = '',
  compact = false,
  showFullName = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedCurrency = SUPPORTED_CURRENCIES.find(c => c.code === value) || {
    code: value,
    name: value,
    symbol: value,
    decimals: 2,
    flag: '🌐'
  };

  const filteredCurrencies = SUPPORTED_CURRENCIES.filter(c =>
    c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
          compact
            ? 'px-2.5 py-1.5 text-xs'
            : showFullName
            ? 'px-3.5 py-2.5 text-sm min-h-[44px]'
            : 'px-3 py-2 text-sm'
        }`}
      >
        <span className="flex items-center gap-2 min-w-0 text-left">
          <span className="text-base shrink-0">{selectedCurrency.flag}</span>
          <span className="font-bold text-slate-900 dark:text-white shrink-0">
            {selectedCurrency.code}
          </span>
          {showFullName ? (
            <>
              <span className="text-slate-300 dark:text-slate-600 shrink-0 font-normal">—</span>
              <span className="text-slate-600 dark:text-slate-300 font-medium truncate">
                {selectedCurrency.name}
              </span>
            </>
          ) : (
            <span className="text-slate-400">({selectedCurrency.symbol})</span>
          )}
        </span>

        <div className="flex items-center gap-2 shrink-0 ml-1">
          {showFullName && (
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {selectedCurrency.symbol}
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
              isOpen ? 'rotate-180 text-emerald-500' : ''
            }`}
          />
        </div>
      </button>

      {isOpen && (
        <div
          className={`absolute z-50 mt-1.5 rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-100 ${
            showFullName
              ? 'w-full left-0 min-w-[280px] max-w-full'
              : 'right-0 w-72 max-w-[90vw]'
          }`}
        >
          <div className="p-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search currency by name or code..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                autoFocus
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto p-1.5 scrollbar-thin">
            {filteredCurrencies.length === 0 ? (
              <div className="py-6 text-xs text-slate-400 text-center">
                No currencies found matching "{searchTerm}"
              </div>
            ) : (
              filteredCurrencies.map(curr => {
                const isSelected = curr.code === value;
                return (
                  <button
                    key={curr.code}
                    type="button"
                    onClick={() => {
                      onChange(curr.code);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold ring-1 ring-emerald-500/30'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="flex items-center gap-2 min-w-0 text-left">
                      <span className="text-base shrink-0">{curr.flag}</span>
                      <span className="font-bold text-slate-900 dark:text-white shrink-0">
                        {curr.code}
                      </span>
                      <span className="text-slate-300 dark:text-slate-600 shrink-0 font-normal">—</span>
                      <span className={`${isSelected ? 'text-emerald-700 dark:text-emerald-300 font-semibold' : 'text-slate-600 dark:text-slate-300 font-medium'} truncate`}>
                        {curr.name}
                      </span>
                    </span>
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 shrink-0 ml-2">
                      {curr.symbol}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
