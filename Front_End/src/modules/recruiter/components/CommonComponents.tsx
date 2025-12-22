import React from 'react';

interface InputFieldProps {
    label: string;
    value: string | undefined | null;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    placeholder?: string;
    required?: boolean;
    textarea?: boolean;
    type?: string;
    options?: { value: string; label: string }[];
    disabled?: boolean;
}

export const InputField: React.FC<InputFieldProps> = ({ 
    label, 
    value, 
    onChange, 
    onBlur, 
    onKeyDown, 
    placeholder, 
    required, 
    textarea, 
    type = "text", 
    options, 
    disabled = false 
}) => (
    <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        {textarea ? (
            <textarea 
            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all disabled:bg-gray-50 disabled:cursor-not-allowed" 
            rows={5} 
            value={value || ''} 
            onChange={onChange} 
            onBlur={onBlur} 
            onKeyDown={onKeyDown} 
            placeholder={placeholder} 
            disabled={disabled}
        />
        ) : options ? (
            <select 
            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all disabled:bg-gray-50 disabled:cursor-not-allowed" 
            value={value || ''} 
            onChange={onChange} 
            onBlur={onBlur} 
            disabled={disabled}
        >
                <option value="">{placeholder || "请选择"}</option>
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        ) : (
            <input 
                type={type} 
                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all disabled:bg-gray-50 disabled:cursor-not-allowed" 
                value={value || ''} 
                onChange={onChange} 
                onBlur={onBlur} 
                onKeyDown={onKeyDown} 
                placeholder={placeholder} 
                disabled={disabled}
            />
        )}
    </div>
);

interface MessageAlertProps {
    text: string;
}

export const MessageAlert: React.FC<MessageAlertProps> = ({ text }) => {
    if (!text) return null;
    return (
        <div className="p-3 mb-6 rounded-lg font-medium text-sm text-center bg-emerald-50 text-emerald-700 border border-emerald-200 animate-in fade-in slide-in-from-top-2">
            {text}
        </div>
    );
};