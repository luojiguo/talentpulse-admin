import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Sun, Moon, Globe, Settings, LogOut, User, FileText, Building, ArrowRightLeft } from 'lucide-react';
import UserAvatar from '@/components/UserAvatar';
import { NotificationBell } from '@/components/NotificationBell';
import { useI18n } from '@/contexts/i18nContext';
import { useTheme } from '@/contexts/ThemeContext';

interface CandidateLayoutProps {
  children: React.ReactNode;
  currentUser: any;
  onLogout: () => void;
  onSwitchRole?: (newRole: string) => void;
  onOpenLogin?: () => void;
}

const CandidateLayout: React.FC<CandidateLayoutProps> = ({ children, currentUser, onLogout, onSwitchRole, onOpenLogin }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { language, setLanguage, t } = useI18n();
  const { mode, setTheme } = useTheme();

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // 监听头像更新事件
  useEffect(() => {
    const handleAvatarUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ avatar: string }>;
      if (customEvent.detail && customEvent.detail.avatar) {
        // 更新 currentUser 的头像
        if (currentUser && typeof currentUser === 'object') {
          (currentUser as any).avatar = customEvent.detail.avatar;
        }
      }
    };

    window.addEventListener('userAvatarUpdated', handleAvatarUpdate);
    return () => {
      window.removeEventListener('userAvatarUpdated', handleAvatarUpdate);
    };
  }, [currentUser]);

  // 判断导航项是否激活
  const isActive = (path: string) => {
    const currentPath = location.pathname;

    // 首页特殊处理：只匹配根路径或 /candidate，不匹配 /job/:id 等子路径
    if (path === '/') {
      return currentPath === '/' || currentPath === '/candidate' || currentPath === '/candidate/';
    }

    // 其他路径：精确匹配或作为前缀匹配（如 /messages 匹配 /messages 和 /messages/:id）
    return currentPath === path || currentPath.startsWith(path + '/');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFB] dark:bg-slate-900 flex flex-col font-sans transition-colors duration-300">
      <header className="bg-white/70 dark:bg-[#1C1C1E]/70 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/10 sticky top-0 z-40 shrink-0 transition-all duration-300 supports-[backdrop-filter]:bg-white/60 h-[60px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center group cursor-pointer" onClick={() => navigate('/')}>
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-500/30 dark:shadow-brand-500/20 transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3" style={{ background: 'linear-gradient(135deg, #007AFF, #0284c7)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white drop-shadow-sm"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
              </div>
              <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <h1 className="ml-3 text-xl font-bold tracking-tight text-slate-900 dark:text-white flex flex-col leading-none">
              <span>TalentPulse</span>
              <span className="text-[10px] font-medium text-brand-500 uppercase tracking-widest mt-0.5">Career</span>
            </h1>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2.5 rounded-full bg-slate-100/50 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-white/20 transition-all active:scale-95"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {[
              { path: '/', label: t.candidate.nav.home, guestVisible: true },
              { path: '/job', label: t.candidate.nav.jobs, guestVisible: true },
              { path: '/saved', label: t.candidate.nav.saved, guestVisible: false },
              { path: '/interviews', label: t.candidate.nav.interviews, guestVisible: false },
              { path: '/messages', label: t.candidate.nav.messages, guestVisible: false },
              { path: '/mock-interview', label: t.candidate.nav.mockInterview, guestVisible: false },
              { path: '/ai-chat', label: t.candidate.nav.aiAssistant, guestVisible: false }
            ]
              .filter(item => currentUser || item.guestVisible) // 访客只显示 guestVisible 为 true 的项
              .map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`px-4 py-2 rounded-full text-[12px] font-medium transition-all duration-300 relative ${isActive(item.path)
                    ? 'text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-white/5'
                    }`}
                >
                  {isActive(item.path) && (
                    <div className="absolute inset-0 bg-brand-500 rounded-full shadow-md shadow-brand-500/25 -z-10" style={{ backgroundColor: '#007AFF' }} />
                  )}
                  {item.label}
                </button>
              ))}
          </nav>

          {/* User Dropdown or Login Button */}
          <div className="flex items-center gap-2 sm:gap-4">
            {currentUser ? (
              <>
                <NotificationBell role="candidate" />
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center space-x-3 text-slate-700 dark:text-slate-200 hover:text-brand-600 transition-colors focus:outline-none py-1"
                  >
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-bold leading-tight">{currentUser?.name || '用户'}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">求职者</p>
                    </div>
                    <UserAvatar
                      src={currentUser?.avatar}
                      name={currentUser?.name}
                      size={36}
                      className="border-2 border-brand-100 dark:border-brand-900/30"
                      style={{ color: '#007AFF', backgroundColor: '#EFF6FF' }}
                      alt="头像"
                    />
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
                      className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                  {/* Dropdown Menu */}
                  <div className={`absolute right-0 mt-3 w-64 bg-white dark:bg-slate-800 rounded-[1.5rem] shadow-2xl py-2 z-50 ring-1 ring-black/5 transition-all duration-300 origin-top-right ${isDropdownOpen
                    ? 'opacity-100 scale-100 translate-y-0'
                    : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                    }`}>
                    <div className="px-4 py-3 border-b border-slate-50 dark:border-slate-700/50 mb-1">
                      <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-1">账户管理</p>
                      <p className="text-sm font-black text-slate-900 dark:text-white truncate">{currentUser?.name || '用户'}</p>
                    </div>

                    <div className="px-2 space-y-1">
                      <button
                        onClick={() => { navigate('/profile'); setIsDropdownOpen(false); }}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-brand-50 dark:hover:bg-brand-500/10 hover:text-brand-600 dark:hover:text-brand-400 rounded-xl transition-all group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center group-hover:bg-brand-100 dark:group-hover:bg-brand-900/30 transition-colors">
                          <User className="w-4 h-4" />
                        </div>
                        {t.candidate.dropdown.profile}
                      </button>
                      <button
                        onClick={() => { navigate('/applications'); setIsDropdownOpen(false); }}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-brand-50 dark:hover:bg-brand-500/10 hover:text-brand-600 dark:hover:text-brand-400 rounded-xl transition-all group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center group-hover:bg-brand-100 dark:group-hover:bg-brand-900/30 transition-colors">
                          <FileText className="w-4 h-4" />
                        </div>
                        {t.candidate.dropdown.applications}
                      </button>
                      <button
                        onClick={() => { navigate('/enterprise-verification'); setIsDropdownOpen(false); }}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-brand-50 dark:hover:bg-brand-500/10 hover:text-brand-600 dark:hover:text-brand-400 rounded-xl transition-all group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center group-hover:bg-brand-100 dark:group-hover:bg-brand-900/30 transition-colors">
                          <Building className="w-4 h-4" />
                        </div>
                        {t.candidate.dropdown.verification}
                      </button>
                      <button
                        onClick={() => { onSwitchRole?.('recruiter'); setIsDropdownOpen(false); }}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-brand-50 dark:hover:bg-brand-500/10 hover:text-brand-600 dark:hover:text-brand-400 rounded-xl transition-all group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center group-hover:bg-brand-100 dark:group-hover:bg-brand-900/30 transition-colors">
                          <ArrowRightLeft className="w-4 h-4" />
                        </div>
                        {t.candidate.dropdown.switchToRecruiter}
                      </button>
                    </div>

                    <div className="my-2 border-t border-slate-50 dark:border-slate-700/50"></div>

                    {/* Theme Switch Section */}
                    <div className="px-4 py-2">
                      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">{t.settings.theme}</p>
                      <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                        <button
                          onClick={() => setTheme('light')}
                          className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === 'light'
                            ? 'bg-white text-brand-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                        >
                          <Sun className="w-3.5 h-3.5" />
                          {t.settings.themeLight}
                        </button>
                        <button
                          onClick={() => setTheme('dark')}
                          className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === 'dark'
                            ? 'bg-slate-800 text-brand-400 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                        >
                          <Moon className="w-3.5 h-3.5" />
                          {t.settings.themeDark}
                        </button>
                      </div>
                    </div>

                    {/* Language Switch Section */}
                    <div className="px-4 py-2 mb-2">
                      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">{t.settings.language}</p>
                      <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                        <button
                          onClick={() => setLanguage('zh')}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${language === 'zh'
                            ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                        >
                          中文
                        </button>
                        <button
                          onClick={() => setLanguage('en')}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${language === 'en'
                            ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                        >
                          English
                        </button>
                      </div>
                    </div>

                    <div className="my-1 border-t border-slate-50 dark:border-slate-700/50"></div>

                    {/* 针对访客的菜单项 - PC端 */}
                    {!currentUser && (
                      <>
                        <button
                          onClick={onOpenLogin}
                          className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <LogOut className="w-4 h-4" />
                          登录 / 注册
                        </button>
                      </>
                    )}
                    <div className="px-2">
                      <button
                        onClick={onLogout}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center transition-colors">
                          <LogOut className="w-4 h-4" />
                        </div>
                        {t.candidate.dropdown.logout}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                {/* Theme Switch for Guest */}
                <button
                  onClick={() => setTheme(mode === 'light' ? 'dark' : 'light')}
                  className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  {mode === 'light' ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                <button
                  onClick={onOpenLogin}
                  className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-brand-500/30 hover:shadow-brand-500/40 active:scale-95"
                  style={{ backgroundColor: '#007AFF' }}
                >
                  登录 / 注册
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {
          mobileMenuOpen && (
            <div className="md:hidden bg-white dark:bg-slate-800 border-t border-brand-100 dark:border-slate-700 shadow-lg">
              <div className="px-4 py-3 space-y-1">
                {[
                  { path: '/', label: t.candidate.nav.home, guestVisible: true },
                  { path: '/job', label: t.candidate.nav.jobs, guestVisible: true },
                  { path: '/saved', label: t.candidate.nav.saved, guestVisible: false },
                  { path: '/interviews', label: t.candidate.nav.interviews, guestVisible: false },
                  { path: '/messages', label: t.candidate.nav.messages, guestVisible: false },
                  { path: '/mock-interview', label: t.candidate.nav.mockInterview, guestVisible: false },
                  { path: '/ai-chat', label: t.candidate.nav.aiAssistant, guestVisible: false }
                ]
                  .filter(item => currentUser || item.guestVisible) // 访客只显示 guestVisible 为 true 的项
                  .map((item) => (
                    <button
                      key={item.path}
                      onClick={() => { navigate(item.path); setMobileMenuOpen(false); }}
                      className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors ${isActive(item.path)
                        ? 'text-white bg-brand-500 dark:bg-brand-500'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-brand-50 dark:hover:bg-slate-700 hover:text-brand-600 dark:hover:text-brand-400'
                        }`}
                    >
                      {item.label}
                    </button>
                  ))}
              </div>
            </div>
          )
        }
      </header >
      <main className="flex-grow">{children}</main>
      <footer className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-center py-6 text-sm mt-auto shrink-0 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center">{t.candidate.footer.copyright}</p>
        </div>
      </footer>
    </div >
  );
};

export default CandidateLayout;