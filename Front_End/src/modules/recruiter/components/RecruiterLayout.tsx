import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, Users, Briefcase, LogOut, FileText, Menu, X, Calendar, UserCheck, User, ArrowRight
} from 'lucide-react';

import { UserRole } from '@/types/types';
import UserAvatar from '@/components/UserAvatar';
import { processAvatarUrl } from '@/components/AvatarUploadComponent';
import { NotificationBell } from '@/components/NotificationBell';
import { useTheme, ThemeMode } from '@/contexts/ThemeContext';
import { useI18n, Language } from '@/contexts/i18nContext';
import { Sun, Moon, Globe } from 'lucide-react';

interface RecruiterLayoutProps {
    onLogout: () => void;
    onSwitchRole: (role: UserRole) => void;
    currentUser: any;
    children: React.ReactNode;
}

export const RecruiterLayout: React.FC<RecruiterLayoutProps> = ({ onLogout, onSwitchRole, currentUser, children }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const location = useLocation();
    const { colors, mode, setTheme } = useTheme();
    const { language, setLanguage, t } = useI18n();

    // 点击外部关闭下拉框
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };

        if (dropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [dropdownOpen]);

    // 导航处理函数
    const handleNavigate = (path: string) => {
        navigate(path);
        setSidebarOpen(false);
    };

    // 主题切换处理
    const handleThemeChange = (newMode: ThemeMode) => {
        setTheme(newMode);
    };

    // 语言切换处理
    const handleLanguageChange = (newLang: Language) => {
        setLanguage(newLang);
    };

    // 判断导航项是否激活
    const isActive = (path: string) => {
        const currentPath = location.pathname;
        return currentPath === path ||
            (path !== '/recruiter/dashboard' && currentPath.startsWith(path + '/'));
    };

    // 导航菜单项
    const navItems = [
        { name: t.nav.dashboard, icon: LayoutDashboard, path: '/recruiter/dashboard' },
        { name: t.nav.jobs, icon: Briefcase, path: '/recruiter/jobs' },
        { name: t.nav.candidates, icon: Users, path: '/recruiter/candidates' },
        { name: t.nav.interviews, icon: Calendar, path: '/recruiter/interviews' },
        { name: t.nav.onboardings, icon: UserCheck, path: '/recruiter/onboardings' },
        { name: t.nav.messages, icon: FileText, path: '/recruiter/messages' },
    ];

    return (
        <div className="recruiter-root min-h-screen flex flex-col transition-colors duration-300" style={{ backgroundColor: colors.background }}>
            {/* 顶部导航栏 */}
            <header
                className="recruiter-header sticky top-0 z-30 shadow-sm backdrop-blur-md bg-opacity-90 transition-all duration-300 h-[60px]"
                style={{
                    backgroundColor: mode === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(15, 23, 42, 0.8)',
                    borderBottom: `1px solid ${mode === 'light' ? colors.border : 'rgba(51, 65, 85, 0.5)'}`
                }}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex justify-between items-center">
                    {/* Logo和移动端菜单按钮 */}
                    <div className="flex items-center gap-3">
                        {/* 移动端菜单按钮 */}
                        <div className="md:hidden">
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="p-2 rounded-lg transition-colors"
                                style={{
                                    backgroundColor: sidebarOpen ? colors.primary : 'transparent',
                                    color: sidebarOpen ? 'white' : colors.textSecondary
                                }}
                            >
                                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>

                        {/* 公司Logo和名称 */}
                        <div className="flex items-center">
                            {currentUser.company?.logo && currentUser.company.logo !== 'C' ? (
                                <img
                                    src={processAvatarUrl(currentUser.company.logo)}
                                    alt="Company Logo"
                                    className="w-10 h-10 mr-3 rounded-lg object-contain shadow-sm"
                                    style={{
                                        backgroundColor: colors.cardBackground,
                                        borderColor: colors.border,
                                        borderWidth: '1px'
                                    }}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                            ) : (
                                <div
                                    className="w-10 h-10 mr-3 rounded-lg flex items-center justify-center"
                                    style={{ backgroundColor: colors.primaryLight }}
                                >
                                    <Briefcase className="w-6 h-6" style={{ color: colors.primary }} />
                                </div>
                            )}
                            <h1
                                className="text-xl font-bold"
                                style={{ color: colors.textPrimary }}
                            >
                                {currentUser.company?.name || 'Talent Pulse'}
                            </h1>
                        </div>
                    </div>

                    {/* 桌面端导航 */}
                    <nav className="hidden md:flex space-x-1 flex-1 justify-center">
                        {navItems.map((item) => {
                            const active = isActive(item.path);
                            return (
                                <button
                                    key={item.name}
                                    onClick={() => navigate(item.path)}
                                    className={`recruiter-nav-button px-5 py-2 text-[12px] font-semibold rounded-full transition-all duration-300 ${active ? 'shadow-sm translate-y-[-1px]' : 'hover:translate-y-[-1px]'
                                        }`}
                                    style={{
                                        backgroundColor: active ? colors.primary : 'transparent',
                                        color: active ? '#FFFFFF' : colors.textSecondary,
                                    }}
                                >
                                    {item.name}
                                </button>
                            );
                        })}
                    </nav>

                    {/* 右侧功能区 */}
                    <div className="flex items-center gap-3">
                        {/* 通知铃铛 */}
                        <NotificationBell role="recruiter" />

                        {/* 用户下拉菜单 */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                className="flex items-center space-x-3 transition-colors focus:outline-none py-1 px-2 rounded-lg"
                                style={{
                                    color: colors.textPrimary,
                                }}
                            >
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-bold leading-tight" style={{ color: colors.textPrimary }}>
                                        {currentUser.name}
                                    </p>
                                    <p className="text-xs" style={{ color: colors.textSecondary }}>
                                        {language === 'zh' ? '招聘负责人' : 'Recruitment Manager'}
                                    </p>
                                </div>
                                <div
                                    className="w-9 h-9 rounded-full border-2 overflow-hidden shrink-0 flex items-center justify-center"
                                    style={{
                                        backgroundColor: colors.primaryLight,
                                        borderColor: colors.primary
                                    }}
                                >
                                    <UserAvatar
                                        src={currentUser.avatar}
                                        name={currentUser.name}
                                        size={36}
                                        className="w-full h-full object-cover"
                                        alt="Avatar"
                                    />
                                </div>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className={`transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                                >
                                    <path d="m6 9 6 6 6-6" />
                                </svg>
                            </button>

                            {/* 下拉菜单 */}
                            <div
                                className={`absolute right-0 mt-2 w-64 rounded-2xl shadow-2xl py-2 z-50 transition-all duration-300 border-0 ${dropdownOpen
                                    ? 'opacity-100 scale-100 translate-y-0'
                                    : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                                    }`}
                                style={{
                                    backgroundColor: colors.cardBackground,
                                    boxShadow: mode === 'light' ? '0 10px 25px -5px rgba(13, 153, 255, 0.1), 0 8px 10px -6px rgba(13, 153, 255, 0.05)' : '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
                                }}
                            >
                                {/* 管理中心标题 */}
                                <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: colors.border }}>
                                    <div className="w-1.5 h-4 bg-blue-600 rounded-full"></div>
                                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">{t.common.managementCenter}</p>
                                </div>

                                <div className="py-2">
                                    <button
                                        onClick={() => { navigate('/recruiter/profile'); setDropdownOpen(false); }}
                                        className="flex items-center gap-3 w-full text-left px-5 py-3 text-sm font-semibold transition-all duration-200"
                                        style={{ color: colors.textPrimary }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = colors.primaryLight;
                                            e.currentTarget.style.color = colors.primary;
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                            e.currentTarget.style.color = colors.textPrimary;
                                        }}
                                    >
                                        <User className="w-4 h-4" />
                                        {t.nav.profile}
                                    </button>
                                    <button
                                        onClick={() => { onSwitchRole?.('candidate'); setDropdownOpen(false); }}
                                        className="flex items-center gap-3 w-full text-left px-5 py-3 text-sm font-semibold transition-all duration-200"
                                        style={{ color: colors.textPrimary }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = colors.primaryLight;
                                            e.currentTarget.style.color = colors.primary;
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                            e.currentTarget.style.color = colors.textPrimary;
                                        }}
                                    >
                                        <ArrowRight className="w-4 h-4" />
                                        {t.nav.switchToCandidate}
                                    </button>
                                </div>

                                {/* 设置区域 */}
                                <div className="mx-2 my-1 border-t px-3 py-4 space-y-4" style={{ borderColor: colors.border }}>
                                    {/* 主题设置 */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 px-1">
                                            <Sun className="w-3 h-3 text-slate-400" />
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.settings.theme}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={() => handleThemeChange('light')}
                                                className={`flex items-center justify-center gap-2 py-2 rounded-xl border text-[10px] font-black transition-all ${mode === 'light'
                                                    ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-100 dark:shadow-none'
                                                    : 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-700/50 hover:bg-white'
                                                    }`}
                                            >
                                                <Sun className="w-3 h-3" />
                                                {t.settings.themeLight}
                                            </button>
                                            <button
                                                onClick={() => handleThemeChange('dark')}
                                                className={`flex items-center justify-center gap-2 py-2 rounded-xl border text-[10px] font-black transition-all ${mode === 'dark'
                                                    ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-950/30'
                                                    : 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-700/50 hover:bg-white'
                                                    }`}
                                            >
                                                <Moon className="w-3 h-3" />
                                                {t.settings.themeDark}
                                            </button>
                                        </div>
                                    </div>

                                    {/* 语言设置 */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 px-1">
                                            <Globe className="w-3 h-3 text-slate-400" />
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.settings.language}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={() => handleLanguageChange('zh')}
                                                className={`flex items-center justify-center gap-1.5 py-2 rounded-xl border text-[10px] font-black transition-all ${language === 'zh'
                                                    ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-100 dark:shadow-none'
                                                    : 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-700/50 hover:bg-white'
                                                    }`}
                                            >
                                                <span>🇨🇳</span>
                                                {t.settings.languageChinese}
                                            </button>
                                            <button
                                                onClick={() => handleLanguageChange('en')}
                                                className={`flex items-center justify-center gap-1.5 py-2 rounded-xl border text-[10px] font-black transition-all ${language === 'en'
                                                    ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-100 dark:shadow-none'
                                                    : 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-700/50 hover:bg-white'
                                                    }`}
                                            >
                                                <span>🇺🇸</span>
                                                {t.settings.languageEnglish}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => { onLogout(); setDropdownOpen(false); }}
                                    className="flex items-center gap-3 w-full text-left px-5 py-3 text-sm font-black transition-all duration-200 mt-1"
                                    style={{ color: colors.error }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.05)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                    }}
                                >
                                    <LogOut className="w-4 h-4" />
                                    {t.nav.logout}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 移动端导航菜单 */}
                {sidebarOpen && (
                    <div
                        className="md:hidden border-t"
                        style={{
                            backgroundColor: colors.cardBackground,
                            borderTopColor: colors.border
                        }}
                    >
                        <nav className="px-4 py-2 space-y-1">
                            {navItems.map((item) => {
                                const active = isActive(item.path);
                                const Icon = item.icon;
                                return (
                                    <button
                                        key={item.name}
                                        onClick={() => handleNavigate(item.path)}
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors"
                                        style={{
                                            backgroundColor: active ? colors.primaryLight : 'transparent',
                                            color: active ? colors.primaryDark : colors.textSecondary,
                                        }}
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span>{item.name}</span>
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                )}
            </header>

            {/* 主内容区 */}
            <main className="flex-grow p-4 md:p-6 lg:p-8">
                {children}
            </main>
        </div>
    );
};