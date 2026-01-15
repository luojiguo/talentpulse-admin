import React, { useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { TRANSLATIONS } from '@/constants/constants';
import { Language } from '@/types/types';

const SettingsView: React.FC<{
    lang: Language,
    setLang: (lang: Language) => void,
    theme: 'light' | 'dark',
    setTheme: (theme: 'light' | 'dark') => void
}> = ({ lang, setLang, theme, setTheme }) => {
    const t = TRANSLATIONS[lang].settings;
    const [message, setMessage] = useState('');

    const handleSave = () => {
        setMessage(lang === 'zh' ? '设置已成功保存！' : 'Settings saved successfully!');
        setTimeout(() => setMessage(''), 3000);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t.title}</h1>

            {message && (
                <div className="p-3 rounded-lg font-medium text-sm text-center bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-500/30">
                    {message}
                </div>
            )}

            <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-8">
                {/* Language Setting */}
                <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-3">{t.language}</h3>
                    <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1 space-x-1">
                        <button
                            onClick={() => setLang('zh')}
                            className={`w-full py-2 rounded-md text-sm font-semibold transition-colors ${lang === 'zh' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow' : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-600'}`}
                        >
                            中文 (Chinese)
                        </button>
                        <button
                            onClick={() => setLang('en')}
                            className={`w-full py-2 rounded-md text-sm font-semibold transition-colors ${lang === 'en' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow' : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-600'}`}
                        >
                            English
                        </button>
                    </div>
                </div>

                {/* Theme Setting */}
                <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-3">{t.theme}</h3>
                    <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1 space-x-1">
                        <button
                            onClick={() => setTheme('light')}
                            className={`w-full py-2 rounded-md text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${theme === 'light' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow' : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-600'}`}
                        >
                            <Sun size={16} /> {lang === 'zh' ? '浅色模式' : 'Light Mode'}
                        </button>
                        <button
                            onClick={() => setTheme('dark')}
                            className={`w-full py-2 rounded-md text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${theme === 'dark' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow' : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-600'}`}
                        >
                            <Moon size={16} /> {lang === 'zh' ? '深色模式' : 'Dark Mode'}
                        </button>
                    </div>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700 pt-6 flex justify-end">
                    <button
                        onClick={handleSave}
                        className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition shadow-lg shadow-blue-500/20"
                    >
                        {t.save}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsView;