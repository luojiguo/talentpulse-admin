import React from 'react';
import { Sparkles, Bell, LogOut } from 'lucide-react';
import { InsightStatus, Language, UserRole } from '@/types/types';

interface HeaderProps {
  onGenerateInsight: () => void;
  insightStatus: InsightStatus;
  lang: Language;
  t: any;
  userRole: UserRole;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ onGenerateInsight, insightStatus, lang, t, userRole, onLogout }) => {
  return (
    <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-30 px-4 md:px-6 py-4 flex items-center justify-between lg:ml-0">
      <div className="flex items-center gap-4 flex-1">
        {/* 移除了导航栏搜索框，搜索功能移至各页面表格上方 */}
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={onGenerateInsight}
          disabled={insightStatus === InsightStatus.LOADING}
          className="flex items-center gap-2 px-3 md:px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {insightStatus === InsightStatus.LOADING ? (
             <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
             <Sparkles size={16} />
          )}
          <span className="hidden sm:inline">{insightStatus === InsightStatus.LOADING ? t.dashboard.ai_analyzing : t.dashboard.ai_btn}</span>
        </button>

        <button className="relative p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-slate-800"></span>
        </button>
        
        <div className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-700">
           <div className="text-right hidden sm:block">
             <div className="text-sm font-bold text-slate-900 dark:text-white">{userRole === 'admin' ? t.roles.admin : t.roles.recruiter}</div>
             <div className="text-xs text-slate-500 dark:text-slate-400">{userRole === 'admin' ? t.roles.super_user : t.roles.hiring_manager}</div>
           </div>
           <div className="h-9 w-9 bg-slate-200 rounded-full overflow-hidden border border-slate-300">
             <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userRole}`} alt="User" className="w-full h-full object-cover" />
           </div>
           <button onClick={onLogout} className="ml-2 text-slate-400 hover:text-rose-500" title="Logout">
              <LogOut size={20} />
           </button>
        </div>
      </div>
    </header>
  );
};

export default Header;