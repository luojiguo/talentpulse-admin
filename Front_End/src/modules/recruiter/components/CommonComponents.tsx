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
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all disabled:bg-slate-50 disabled:cursor-not-allowed bg-white dark:bg-slate-800"
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
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all disabled:bg-slate-50 disabled:cursor-not-allowed bg-white dark:bg-slate-800"
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
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all disabled:bg-slate-50 disabled:cursor-not-allowed bg-white dark:bg-slate-800"
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
        <div className="p-4 mb-6 rounded-2xl font-bold text-sm text-center bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800/50 animate-in fade-in slide-in-from-top-2 shadow-sm">
            {text}
        </div>
    );
};