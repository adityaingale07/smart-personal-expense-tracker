import React from 'react';
import { X, Download, ExternalLink, FileText } from 'lucide-react';

interface ReceiptViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptUrl?: string;
  receiptName?: string;
}

export const ReceiptViewerModal: React.FC<ReceiptViewerModalProps> = ({
  isOpen,
  onClose,
  receiptUrl,
  receiptName = 'Receipt',
}) => {
  if (!isOpen || !receiptUrl) return null;

  const isPdf = receiptUrl.includes('application/pdf') || receiptName.endsWith('.pdf');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-500" />
            <h3 className="font-semibold text-slate-900 dark:text-white truncate max-w-sm">
              {receiptName}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={receiptUrl}
              download={receiptName}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Download Receipt"
            >
              <Download className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-auto flex items-center justify-center bg-slate-50 dark:bg-slate-950/50">
          {isPdf ? (
            <div className="text-center p-8">
              <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 font-medium">
                PDF Receipt Document
              </p>
              <a
                href={receiptUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open PDF in new tab
              </a>
            </div>
          ) : (
            <img
              src={receiptUrl}
              alt={receiptName}
              className="max-h-[70vh] w-auto max-w-full rounded-xl object-contain shadow-sm border border-slate-200 dark:border-slate-800"
            />
          )}
        </div>
      </div>
    </div>
  );
};
