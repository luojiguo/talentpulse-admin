import React, { useState, useRef, useEffect } from 'react';
import { Settings, Sun, Moon, Globe } from 'lucide-react';
import { useTheme, ThemeMode } from '@/contexts/ThemeContext';
import { useI18n, Language } from '@/contexts/i18nContext';

/**
 * SettingsPanel 组件 - 求职者界面专用
 * 提供深浅色模式切换和中英文语言切换
 */
export const SettingsPanel: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const { mode, setTheme } = useTheme();
    const { language, setLanguage, t } = useI18n();

    // 点击外部关闭面板
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // 主题切换处理
    const handleThemeChange = (newMode: ThemeMode) => {
        setTheme(newMode);
    };

    // 语言切换处理
    const handleLanguageChange = (newLang: Language) => {
        setLanguage(newLang);
    };

    return (
        <div className="relative" ref={panelRef}>
            {/* 设置按钮 */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-brand-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center"
                aria-label={t.settings.title}
                title={t.settings.title}
            >
                <Settings className={`w-5 h-5 transition-transform duration-500 ${isOpen ? 'rotate-90 text-brand-500' : ''}`} />
            </button>

            {/* 设置面板 - 弹出层 */}
            <div
                className={`absolute right-0 mt-3 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-2xl ring-1 ring-black/5 z-[60] overflow-hidden transition-all duration-300 origin-top-right
                ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}
            >
                {/* 面板头部 */}
                <div className="px-4 py-3 bg-brand-50/50 dark:bg-slate-700/50 border-b border-brand-100 dark:border-slate-700">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{t.settings.title}</h3>
                </div>

                <div className="p-4 space-y-6">
                    {/* 主题设置部分 */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                            <Sun className="w-3.5 h-3.5" />
                            <span>{t.settings.theme}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => handleThemeChange('light')}
                                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                                ${mode === 'light'
                                        ? 'bg-brand-50 text-brand-600 ring-1 ring-brand-200 shadow-sm shadow-brand-100'
                                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-700/50 dark:text-slate-300 dark:hover:bg-slate-700'}`}
                            >
                                <Sun className="w-4 h-4" />
                                <span>{t.settings.themeLight}</span>
                            </button>
                            <button
                                onClick={() => handleThemeChange('dark')}
                                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                                ${mode === 'dark'
                                        ? 'bg-brand-500 text-white shadow-lg shadow-brand-200 dark:shadow-none'
                                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-700/50 dark:text-slate-300 dark:hover:bg-slate-700'}`}
                            >
                                <Moon className="w-4 h-4" />
                                <span>{t.settings.themeDark}</span>
                            </button>
                        </div>
                    </div>

                    {/* 语言设置部分 */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                            <Globe className="w-3.5 h-3.5" />
                            <span>{t.settings.language}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => handleLanguageChange('zh')}
                                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                                ${language === 'zh'
                                        ? 'bg-brand-50 text-brand-600 ring-1 ring-brand-200 shadow-sm shadow-brand-100'
                                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-700/50 dark:text-slate-300 dark:hover:bg-slate-700'}`}
                            >
                                <span className="text-base">🇨🇳</span>
                                <span>{t.settings.languageChinese}</span>
                            </button>
                            <button
                                onClick={() => handleLanguageChange('en')}
                                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                                ${language === 'en'
                                        ? 'bg-brand-50 text-brand-600 ring-1 ring-brand-200 shadow-sm shadow-brand-100'
                                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-700/50 dark:text-slate-300 dark:hover:bg-slate-700'}`}
                            >
                                <span className="text-base">🇺🇸</span>
                                <span>{t.settings.languageEnglish}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
