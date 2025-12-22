import React from 'react';

const FilterPill = ({ label, isActive, onClick }: any) => (
    <button 
        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-200 ${isActive ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-indigo-50 border border-transparent hover:border-indigo-200'}`}
        onClick={onClick}
    >
        {label}
    </button>
);

export default FilterPill;