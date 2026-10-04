import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../services/currency';
import { useToast } from '../common/Toast';
import { Transaction } from '../../types';
import {
  Download,
  Upload,
  FileSpreadsheet,
  FileText,
  FileCode,
  Printer,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { user } = useAuth();
  const { transactions, categories, displayCurrency, addTransaction } = useFinance();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');

  // CSV Import States
  const [csvRawLines, setCsvRawLines] = useState<string[][]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  // Column Mappings
  const [mappingDate, setMappingDate] = useState<number>(-1);
  const [mappingAmount, setMappingAmount] = useState<number>(-1);
  const [mappingMerchant, setMappingMerchant] = useState<number>(-1);
  const [mappingCategory, setMappingCategory] = useState<number>(-1);
  const [mappingType, setMappingType] = useState<number>(-1);

  const [importSummary, setImportSummary] = useState<{
    valid: number;
    invalid: number;
    skipped: number;
  } | null>(null);

  const catMap = new Map(categories.map(c => [c.id, c]));

  // EXPORT CSV
  const handleExportCSV = () => {
    if (transactions.length === 0) {
      toast('No transactions available to export', 'error');
      return;
    }

    const headers = [
      'Transaction ID',
      'Date',
      'Type',
      'Amount',
      'Currency',
      'Converted Amount',
      'Category',
      'Merchant',
      'Payment Method',
      'Notes',
      'Tags',
      'Recurring'
    ];

    const rows = transactions.map(t => {
      const cat = catMap.get(t.categoryId);
      return [
        `"${t.id}"`,
        `"${t.date}"`,
        `"${t.type}"`,
        t.amount,
        `"${t.currency}"`,
        t.convertedAmount || t.amount,
        `"${cat?.name || 'Uncategorized'}"`,
        `"${(t.merchant || '').replace(/"/g, '""')}"`,
        `"${t.paymentMethod}"`,
        `"${(t.notes || '').replace(/"/g, '""')}"`,
        `"${(t.tags || []).join(';')}"`,
        t.isRecurring ? 'Yes' : 'No'
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Spendly_Transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast('CSV file downloaded successfully', 'success');
  };

  // EXPORT JSON
  const handleExportJSON = () => {
    if (transactions.length === 0) {
      toast('No transactions available to export', 'error');
      return;
    }

    const exportData = {
      app: 'Spendly',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      user: {
        id: user?.id,
        fullName: user?.fullName,
        email: user?.email,
        preferredCurrency: user?.preferredCurrency,
      },
      transactionsCount: transactions.length,
      transactions,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `Spendly_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast('JSON backup downloaded successfully', 'success');
  };

  // PRINTABLE PDF REPORT
  const handlePrintStatement = () => {
    window.print();
  };

  // CSV FILE PARSING
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      const text = evt.target?.result as string;
      if (!text) return;

      const lines = text
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(l => l.length > 0);

      if (lines.length < 2) {
        toast('CSV file must contain a header line and at least one data row', 'error');
        return;
      }

      // Simple CSV line splitter respecting quotes
      const parseCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(cur.trim().replace(/^"|"$/g, ''));
            cur = '';
          } else {
            cur += char;
          }
        }
        result.push(cur.trim().replace(/^"|"$/g, ''));
        return result;
      };

      const headerCols = parseCSVLine(lines[0]);
      const dataRows = lines.slice(1).map(l => parseCSVLine(l));

      setCsvHeaders(headerCols);
      setCsvRawLines(dataRows);

      // Auto-detect columns
      headerCols.forEach((col, idx) => {
        const lower = col.toLowerCase();
        if (lower.includes('date')) setMappingDate(idx);
        else if (lower.includes('amount') || lower.includes('cost') || lower.includes('price')) setMappingAmount(idx);
        else if (lower.includes('merchant') || lower.includes('payee') || lower.includes('desc') || lower.includes('name')) setMappingMerchant(idx);
        else if (lower.includes('cat')) setMappingCategory(idx);
        else if (lower.includes('type')) setMappingType(idx);
      });

      toast(`Loaded ${dataRows.length} rows from CSV`, 'info');
    };

    reader.readAsText(file);
  };

  // EXECUTE IMPORT WITH COLUMN MAPPING
  const handleExecuteImport = async () => {
    if (mappingAmount === -1 || mappingDate === -1) {
      toast('Please map both Amount and Date columns to proceed', 'error');
      return;
    }

    setIsImporting(true);
    let validCount = 0;
    let invalidCount = 0;
    let skippedCount = 0;

    for (const row of csvRawLines) {
      const rawDate = row[mappingDate];
      const rawAmount = row[mappingAmount];
      const rawMerchant = mappingMerchant >= 0 ? row[mappingMerchant] : '';
      const rawType = mappingType >= 0 ? row[mappingType]?.toLowerCase() : 'expense';

      // Validate date
      const parsedDate = new Date(rawDate);
      if (isNaN(parsedDate.getTime()) || !rawDate) {
        invalidCount++;
        continue;
      }

      // Validate amount
      const cleanAmt = parseFloat(rawAmount.replace(/[^0-9.-]+/g, ''));
      if (isNaN(cleanAmt) || cleanAmt <= 0) {
        invalidCount++;
        continue;
      }

      const txType: 'expense' | 'income' | 'transfer' =
        rawType.includes('inc') ? 'income' : rawType.includes('trans') ? 'transfer' : 'expense';

      try {
        await addTransaction({
          amount: cleanAmt,
          currency: displayCurrency,
          type: txType,
          categoryId: 'other',
          merchant: rawMerchant || undefined,
          date: parsedDate.toISOString().split('T')[0],
          paymentMethod: 'Imported Entry',
          notes: 'Imported via CSV ledger upload',
          tags: ['CSV Import'],
          isRecurring: false,
        });
        validCount++;
      } catch {
        skippedCount++;
      }
    }

    setIsImporting(false);
    setImportSummary({ valid: validCount, invalid: invalidCount, skipped: skippedCount });
    toast(`Successfully imported ${validCount} transactions!`, 'success');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Reports & Data Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Export backups, download CSV/JSON ledgers, and import bank statements with column mapping
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'export'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Download className="w-3.5 h-3.5" /> Export Data
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'import'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Upload className="w-3.5 h-3.5" /> Import CSV
          </button>
        </div>
      </div>

      {activeTab === 'export' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* CSV Export Card */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Export to CSV
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Download spreadsheet format compatible with Excel, Google Sheets, or Apple Numbers. Includes exchange rates and tags.
                </p>
              </div>

              <button
                onClick={handleExportCSV}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Download CSV ({transactions.length} rows)
              </button>
            </div>

            {/* JSON Export Card */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <FileCode className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Export to JSON Backup
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Full programmatic backup with all transaction properties, original ISO currencies, snapshots, and timestamps.
                </p>
              </div>

              <button
                onClick={handleExportJSON}
                className="w-full py-2.5 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Download JSON Backup
              </button>
            </div>

            {/* Printable Statement / PDF Card */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Printer className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Print Financial Statement (PDF)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Clean printable summary report formatted for physical printing or saving as a crisp PDF document.
                </p>
              </div>

              <button
                onClick={handlePrintStatement}
                className="w-full py-2.5 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-colors flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" /> Print / Save as PDF
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* IMPORT CSV WITH COLUMN MAPPING */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="max-w-xl">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">
              Import Transactions via CSV
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Upload your bank statement or CSV ledger. Use our interactive column mapper to map your file's columns to Spendly fields before saving.
            </p>
          </div>

          {/* Upload input */}
          <div className="p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center bg-slate-50/50 dark:bg-slate-800/20">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="csvUploadInput"
            />
            <label
              htmlFor="csvUploadInput"
              className="cursor-pointer inline-flex flex-col items-center gap-2"
            >
              <Upload className="w-8 h-8 text-emerald-500" />
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Click to browse or drop your CSV file here
              </span>
              <span className="text-xs text-slate-400">Supports standard comma-delimited files</span>
            </label>
          </div>

          {/* Column Mapping Section if file loaded */}
          {csvHeaders.length > 0 && (
            <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    Map Columns ({csvRawLines.length} rows detected)
                  </h4>
                  <p className="text-xs text-slate-400">
                    Specify which columns in your CSV match Spendly requirements
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Date column */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Date Column *
                  </label>
                  <select
                    value={mappingDate}
                    onChange={e => setMappingDate(parseInt(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value={-1}>Select column...</option>
                    {csvHeaders.map((h, i) => (
                      <option key={i} value={i}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount column */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Amount Column *
                  </label>
                  <select
                    value={mappingAmount}
                    onChange={e => setMappingAmount(parseInt(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value={-1}>Select column...</option>
                    {csvHeaders.map((h, i) => (
                      <option key={i} value={i}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Merchant column */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Merchant / Description
                  </label>
                  <select
                    value={mappingMerchant}
                    onChange={e => setMappingMerchant(parseInt(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value={-1}>None / Skip</option>
                    {csvHeaders.map((h, i) => (
                      <option key={i} value={i}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Type column */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Transaction Type
                  </label>
                  <select
                    value={mappingType}
                    onChange={e => setMappingType(parseInt(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value={-1}>Default to Expense</option>
                    {csvHeaders.map((h, i) => (
                      <option key={i} value={i}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Data Preview sample */}
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Sample Preview (First 3 Rows)
                </span>
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500">
                      <tr>
                        {csvHeaders.map((h, idx) => (
                          <th key={idx} className="p-2.5 px-3 font-semibold">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                      {csvRawLines.slice(0, 3).map((row, rIdx) => (
                        <tr key={rIdx}>
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="p-2.5 px-3 truncate max-w-[140px]">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action */}
              <div className="flex items-center justify-between pt-2">
                {importSummary ? (
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-emerald-600 font-bold">
                      Imported: {importSummary.valid}
                    </span>
                    <span className="text-rose-500 font-bold">
                      Invalid: {importSummary.invalid}
                    </span>
                    <span className="text-slate-400">
                      Skipped: {importSummary.skipped}
                    </span>
                  </div>
                ) : <div />}

                <button
                  type="button"
                  onClick={handleExecuteImport}
                  disabled={isImporting}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
                >
                  {isImporting ? 'Validating & Importing...' : 'Import Valid Transactions'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
