import React from 'react';

const FilterPill = ({ label, isActive, onClick }: any) => (
    <button
        className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all duration-300 active:scale-95 ${isActive
            ? 'bg-brand-500 text-white shadow-lg shadow-brand-100 dark:shadow-none'
            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-300 hover:bg-white dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 hover:border-brand-200 dark:hover:border-slate-600 shadow-sm'
            }`}
        onClick={onClick}
        style={{
            backgroundColor: isActive ? '#007AFF' : undefined,
            color: isActive ? '#ffffff' : undefined,
            boxShadow: isActive ? '0 10px 15px -3px rgba(0, 122, 255, 0.2)' : undefined
        }}
    >
        {label}
    </button>
);

export default FilterPill;