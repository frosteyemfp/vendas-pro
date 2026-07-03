import React from "react";

// ========================
// BOTOES (Buttons)
// ========================
export function Button({ variant = "primary", className = "", children, ...props }) {
  const baseStyles = "inline-flex items-center justify-center font-medium text-sm px-4 py-2.5 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-brand-slate-900 hover:bg-brand-slate-800 text-white shadow-premium focus:ring-brand-slate-950 dark:bg-brand-slate-100 dark:hover:bg-brand-slate-200 dark:text-brand-slate-900 dark:focus:ring-brand-slate-300",
    secondary: "bg-white border border-brand-slate-200 text-brand-slate-700 hover:bg-brand-slate-50 shadow-premium focus:ring-brand-slate-400 dark:bg-brand-slate-900 dark:border-brand-slate-800 dark:text-brand-slate-300 dark:hover:bg-brand-slate-800/50",
    danger: "bg-brand-accent-rose/10 border border-brand-accent-rose/20 text-brand-accent-rose hover:bg-brand-accent-rose/20 dark:bg-brand-accent-rose/20 dark:text-brand-accent-rose dark:hover:bg-brand-accent-rose/30",
    ghost: "text-brand-slate-600 hover:bg-brand-slate-100 hover:text-brand-slate-900 dark:text-brand-slate-400 dark:hover:bg-brand-slate-900 dark:hover:text-brand-slate-100"
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

// ========================
// INPUTS & LABELS
// ========================
export function Input({ label, error, className = "", ...props }) {
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="block text-xs font-semibold text-brand-slate-500 dark:text-brand-slate-400 uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        className={`w-full bg-white dark:bg-brand-slate-900 border border-brand-slate-200 dark:border-brand-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-brand-slate-900 dark:text-brand-slate-100 placeholder-brand-slate-400 dark:placeholder-brand-slate-500 focus:outline-none focus:border-brand-slate-400 dark:focus:border-brand-slate-600 focus:ring-1 focus:ring-brand-slate-400 dark:focus:ring-brand-slate-600 shadow-premium transition-all duration-150 ${
          error ? "border-brand-accent-rose focus:border-brand-accent-rose focus:ring-brand-accent-rose" : ""
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-brand-accent-rose font-medium mt-1">{error}</p>}
    </div>
  );
}

export function Select({ label, children, className = "", ...props }) {
  return (
    <div className="w-full space-y-1.5 relative">
      {label && (
        <label className="block text-xs font-semibold text-brand-slate-500 dark:text-brand-slate-400 uppercase tracking-wider">
          {label}
        </label>
      )}
      <select
        className={`w-full bg-white dark:bg-brand-slate-900 border border-brand-slate-200 dark:border-brand-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-brand-slate-900 dark:text-brand-slate-100 focus:outline-none focus:border-brand-slate-400 dark:focus:border-brand-slate-600 focus:ring-1 focus:ring-brand-slate-400 dark:focus:ring-brand-slate-600 shadow-premium cursor-pointer transition-all ${className}`}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}

// ========================
// CARDS
// ========================
export function Card({ className = "", children, ...props }) {
  return (
    <div 
      className={`bg-white dark:bg-brand-slate-900 border border-brand-slate-200/80 dark:border-brand-slate-800/80 rounded-premium-2xl shadow-premium hover:shadow-premium-md transition-all duration-300 w-full overflow-hidden ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
}

// ========================
// TABELAS (Tables)
// ========================
export function Table({ headers = [], children, className = "" }) {
  return (
    <div className={`w-full overflow-x-auto border border-brand-slate-200/60 dark:border-brand-slate-800/80 rounded-premium-xl bg-white dark:bg-brand-slate-900 shadow-premium ${className}`}>
      <table className="w-full text-left text-sm border-collapse">
        <thead>
          <tr className="bg-brand-slate-50 dark:bg-brand-slate-900/60 text-brand-slate-400 dark:text-brand-slate-500 font-semibold border-b border-brand-slate-100 dark:border-brand-slate-800/50">
            {headers.map((header, idx) => (
              <th key={idx} className="p-4 font-medium text-xs uppercase tracking-wider first:pl-6 last:pr-6">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-slate-100 dark:divide-brand-slate-800/50 text-brand-slate-700 dark:text-brand-slate-300 font-medium">
          {children}
        </tbody>
      </table>
    </div>
  );
}

// ========================
// MODAIS (Modals)
// ========================
export function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-brand-slate-950/40 dark:bg-brand-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div 
        className="bg-white dark:bg-brand-slate-900 border border-brand-slate-100 dark:border-brand-slate-800 w-full max-w-md rounded-premium-2xl p-6 shadow-premium-lg space-y-4 transition-all transform scale-100 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-brand-slate-100 dark:border-brand-slate-800/50 pb-3">
          <h3 className="text-base font-bold text-brand-slate-900 dark:text-white tracking-tight">{title}</h3>
          <button 
            onClick={onClose} 
            className="p-1 text-brand-slate-400 hover:bg-brand-slate-50 dark:hover:bg-brand-slate-800 rounded-lg transition-colors"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="pt-1">{children}</div>
      </div>
    </div>
  );
}

// ========================
// BADGES / INDICADORES
// ========================
export function Badge({ variant = "neutral", children }) {
  const styles = {
    neutral: "bg-brand-slate-100 text-brand-slate-700 border-brand-slate-200 dark:bg-brand-slate-800 dark:text-brand-slate-300 dark:border-brand-slate-700",
    success: "bg-brand-accent-emerald/10 text-brand-accent-emerald border-brand-accent-emerald/20",
    warning: "bg-brand-accent-amber/10 text-brand-accent-amber border-brand-accent-amber/20",
    danger: "bg-brand-accent-rose/10 text-brand-accent-rose border-brand-accent-rose/20",
  };

  return (
    <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full border ${styles[variant]}`}>
      {children}
    </span>
  );
}