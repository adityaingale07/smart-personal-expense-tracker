import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 'md', showText = true, className = '' }) => {
  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  };

  const textClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <div className={`flex items-center gap-2.5 font-bold tracking-tight select-none ${className}`}>
      <div
        className={`${sizeClasses[size]} rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-md shadow-emerald-500/20 text-white shrink-0`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5/6 h-5/6"
        >
          {/* Subtle custom fintech S-curve with upward growth trajectory */}
          <path d="M7 16c0 2 2 3.5 5 3.5s5-1.5 5-3.5-3-3-5-4-5-2-5-4 2-3.5 5-3.5 5 1.5 5 3.5" />
          <path d="M12 3v2" strokeWidth="2" />
          <path d="M12 19v2" strokeWidth="2" />
          <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      </div>
      {showText && (
        <span className={`${textClasses[size]} text-slate-900 dark:text-white font-extrabold flex items-center`}>
          Spendly
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 ml-1 mb-1"></span>
        </span>
      )}
    </div>
  );
};
