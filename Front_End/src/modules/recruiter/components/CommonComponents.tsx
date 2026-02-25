import React from 'react';

// 通用表单输入框组件的属性定义
interface InputFieldProps {
    label: string;            // 输入框标签名
    value: string | undefined | null; // 输入框当前值，支持空值处理
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void; // 变更回调
    onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;   // 失去焦点回调
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void; // 按键事件（常用于回车提交）
    placeholder?: string;      // 占位文本
    required?: boolean;        // 是否必填（显示红色星号）
    textarea?: boolean;        // 是否渲染为长文本框
    type?: string;             // 输入框类型（如：text, date, password）
    options?: { value: string; label: string }[]; // 若提供此参数，则渲染为下拉选择框 (select)
    disabled?: boolean;        // 禁用状态
}

/**
 * 通用交互组件：InputField
 * 设计说明：该组件通过条件渲染实现了 input、textarea、select 的三合一高度抽象。
 * 这样做可以保持样式的一致性，同时减少重复编写 Tailwind CSS 类名。
 */
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
            // 默认渲染为标准 Input
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

// 顶部提示条组件：用于展示表单提交成功或简单的系统反馈
interface MessageAlertProps {
    text: string; // 提示文本内容
}

export const MessageAlert: React.FC<MessageAlertProps> = ({ text }) => {
    if (!text) return null;
    return (
        // 采用 animate-in 动画效果，让提示语从上方缓缓滑入（slide-in-from-top-2）
        <div className="p-4 mb-6 rounded-2xl font-bold text-sm text-center bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800/50 animate-in fade-in slide-in-from-top-2 shadow-sm">
            {text}
        </div>
    );
};