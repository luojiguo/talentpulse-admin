import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Bell, LogOut } from 'lucide-react';
import { InsightStatus, Language, UserRole } from '@/types/types';
import UserAvatar from '@/components/UserAvatar';

interface HeaderProps {
  onGenerateInsight: () => void;
  insightStatus: InsightStatus;
  lang: Language;
  t: any;
  userRole: UserRole;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ onGenerateInsight, insightStatus, lang, t, userRole, onLogout }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

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

  return (
    <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-30 px-4 md:px-6 py-3 sm:py-4 flex items-center justify-between lg:ml-0 h-16">
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
             <Sparkles size={14} sm:size={16} />
          )}
          <span className="hidden sm:inline">{insightStatus === InsightStatus.LOADING ? t.dashboard.ai_analyzing : t.dashboard.ai_btn}</span>
        </button>

        <button className="relative p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
          <Bell size={18} sm:size={20} />
          <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-slate-800"></span>
        </button>
        
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
                 name={userRole === 'admin' ? '管理员' : '招聘者'} 
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
               <button 
                 onClick={() => { navigate('/admin/settings'); setDropdownOpen(false); }}
                 className="block w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
               >
                 个人中心
               </button>
               <div className="border-t border-slate-100 dark:border-slate-700 my-1"></div>
               <button 
                 onClick={() => { onLogout(); setDropdownOpen(false); }}
                 className="block w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
               >
                 退出登录
               </button>
             </div>
           </div>
        </div>
      </div>
    </header>
  );
};

export default Header;