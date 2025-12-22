import React from 'react';

const MessageAlert = ({ text, type }: any) => {
    if (!text) return null;
    const baseClasses = "p-3 rounded-lg font-medium text-sm text-center transition-all duration-300 animate-in fade-in slide-in-from-top-2";
    const typeClasses = type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    return <div className={`${baseClasses} ${typeClasses} mb-6`}>{text}</div>;
};

export default MessageAlert;