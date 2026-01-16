import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Bell, LogOut, Sun, Moon, Languages } from 'lucide-react';
import { InsightStatus, Language, UserRole } from '@/types/types';
import UserAvatar from '@/components/UserAvatar';
import { SocketService } from '@/services/socketService';
import { message } from 'antd';

interface HeaderProps {
  onGenerateInsight: () => void;
  insightStatus: InsightStatus;
  lang: Language;
  setLang: (lang: Language) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  t: any;
  currentUser: any;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ onGenerateInsight, insightStatus, lang, setLang, theme, setTheme, t, currentUser, onLogout }) => {
  const userRole = currentUser.role;
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationDropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const socketService = SocketService.getInstance();

  // Socket 连接与通知监听
  useEffect(() => {
    if (currentUser?.id) {
      const socket = socketService.connect(currentUser.id);

      // 如果是管理员，加入管理员房间
      if (userRole === 'admin') {
        socketService.joinRole('admin');
      }

      const handleSystemNotification = (notification: any) => {
        console.log('Received system notification:', notification);
        setNotificationCount(prev => prev + 1);
        setNotifications(prev => [notification, ...prev]);

        // 显示一个全局提示
        message.info({
          content: `${notification.title}: ${notification.message}`,
          duration: 4,
        });
      };

      socketService.onSystemNotification(handleSystemNotification);

      return () => {
        socketService.offSystemNotification(handleSystemNotification);
      };
    }
  }, [currentUser, userRole]);

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(event.target as Node)) {
        setNotificationDropdownOpen(false);
      }
    };

    // 总是添加事件监听，避免重复添加/移除
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen, notificationDropdownOpen]);

  return (
    <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-30 px-4 md:px-6 py-3 sm:py-4 flex items-center justify-between lg:ml-0 h-[60px] transition-all duration-300">
      {/* 页面标题区域 */}
      <div className="flex items-center gap-3">
        <div className="text-lg font-bold text-slate-900 dark:text-white">
          {t.roles.admin}
        </div>
        <div className="text-sm text-slate-500 dark:text-slate-400">
          {t.dashboard.welcome}
        </div>
      </div>

      {/* 右侧功能区域 */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={onGenerateInsight}
          disabled={insightStatus === InsightStatus.LOADING}
          className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {insightStatus === InsightStatus.LOADING ? (
            <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Sparkles className="w-[14px] h-[14px] sm:w-4 sm:h-4" />
          )}
          <span className="hidden sm:inline">{insightStatus === InsightStatus.LOADING ? t.dashboard.ai_analyzing : t.dashboard.ai_btn}</span>
        </button>

        <div className="relative" ref={notificationDropdownRef}>
          <button
            onClick={() => {
              setNotificationCount(0);
              setNotificationDropdownOpen(!notificationDropdownOpen);
            }}
            className="relative p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
          >
            <Bell className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
            {notificationCount > 0 && (
              <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 min-w-[16px] h-4 flex items-center justify-center px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full border-2 border-white dark:border-slate-800">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </button>

          {/* 通知下拉菜单 */}
          <div className={`absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-xl py-2 z-50 ring-1 ring-slate-300 dark:ring-slate-700 transition-all duration-200 origin-top-right ${notificationDropdownOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}>
            <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{t.header.notifications}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t.header.you_have} {notifications.length} {t.header.messages}</p>
            </div>

            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-sm text-slate-500 dark:text-slate-400">{t.header.no_notifications}</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {notifications.map((notification, index) => (
                  <div
                    key={index}
                    className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1 w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-slate-900 dark:text-white truncate">{notification.title}</h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">{notification.message}</p>
                        <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                          {new Date(notification.timestamp).toLocaleString(lang === 'zh' ? 'zh-CN' : 'en-US')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {notifications.length > 0 && (
              <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => {
                    setNotifications([]);
                    setNotificationDropdownOpen(false);
                  }}
                  className="w-full text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                >
                  {t.header.clear_all}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 pl-3 sm:pl-4 border-l border-slate-200 dark:border-slate-700">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-bold text-slate-900 dark:text-white">{userRole === 'admin' ? t.roles.admin : t.roles.recruiter}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{userRole === 'admin' ? t.roles.super_user : t.roles.hiring_manager}</div>
          </div>
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors focus:outline-none"
            >
              <UserAvatar
                name={userRole === 'admin' ? (lang === 'zh' ? '管理员' : 'Admin') : (lang === 'zh' ? '招聘者' : 'Recruiter')}
                size={userRole === 'admin' ? 32 : 36}
                className="bg-slate-200 border border-slate-300"
                alt="User Avatar"
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
                className={`transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            {/* Dropdown Menu */}
            <div className={`absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl py-1 z-50 ring-1 ring-slate-300 dark:ring-slate-700 transition-all duration-200 origin-top-right ${dropdownOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}>


              {/* Settings Section */}
              <div className="px-4 py-2 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    {theme === 'light' ? <Sun size={16} /> : <Moon size={16} />}
                    <span>{t.settings.theme}</span>
                  </div>
                  <button
                    onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${theme === 'dark' ? 'bg-blue-600' : 'bg-slate-200'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <Languages size={16} />
                    <span>{t.settings.language}</span>
                  </div>
                  <div className="flex bg-slate-100 dark:bg-slate-700 rounded p-0.5">
                    <button
                      onClick={() => setLang('zh')}
                      className={`px-2 py-0.5 text-xs font-bold rounded transition-colors ${lang === 'zh' ? 'bg-white dark:bg-slate-600 text-blue-600 shadow-sm' : 'text-slate-400 dark:text-slate-500'}`}
                    >
                      中
                    </button>
                    <button
                      onClick={() => setLang('en')}
                      className={`px-2 py-0.5 text-xs font-bold rounded transition-colors ${lang === 'en' ? 'bg-white dark:bg-slate-600 text-blue-600 shadow-sm' : 'text-slate-400 dark:text-slate-500'}`}
                    >
                      En
                    </button>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-700 my-1"></div>
              <button
                onClick={() => { onLogout(); setDropdownOpen(false); }}
                className="block w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                {t.nav.signout}
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
