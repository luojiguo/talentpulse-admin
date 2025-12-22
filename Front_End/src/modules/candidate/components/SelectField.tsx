import React from 'react';

const SelectField = ({ label, id, value, onChange, options, required = false }: any) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <select
            id={id}
            value={value}
            onChange={onChange}
            className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 sm:text-sm bg-white"
        >
            {/* Add default empty option for when value is empty string */}
            {!options.includes(value) && value === '' && (
                <option key="" value="">请选择</option>
            )}
            {options.map((opt: string) => (
                <option key={opt} value={opt}>{opt}</option>
            ))}
        </select>
    </div>
);

export default SelectField;