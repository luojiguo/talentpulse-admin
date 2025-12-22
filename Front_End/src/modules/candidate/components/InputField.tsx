import React from 'react';

const InputField = ({ label, id, type = 'text', value, onChange, placeholder, required = false, name, className = "" }: any) => (
    <div className={className}>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
            type={type}
            id={id}
            name={name || id}
            value={value || ''}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 sm:text-sm"
        />
    </div>
);

export default InputField;