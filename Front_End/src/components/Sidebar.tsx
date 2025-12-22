
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  Settings, 
  LogOut, 
  PieChart,
  MessageSquare,
  ShieldCheck,
  Building2,
  Menu,
  X,
  Calendar,
  UserCheck,
  FileText
} from 'lucide-react';
import { Language } from '../types/types';
import { TRANSLATIONS } from '../constants/constants';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: any) => void;
  lang: Language;
  onLogout?: () => void;
  isMobileOpen?: boolean;
  onMobileToggle?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, lang, onLogout, isMobileOpen, onMobileToggle }) => {
  const t = TRANSLATIONS[lang].nav;
  const navigate = useNavigate();

  const handleNavigate = (view: string) => {
    navigate(`/admin/${view}`);
    // 移动端导航后关闭侧边栏
    if (onMobileToggle) {
      onMobileToggle();
    }
  };

  return (
    <>
      {/* 移动端遮罩层 */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 lg:hidden z-40"
          onClick={onMobileToggle}
        />
      )}
      
      {/* 侧边栏 */}
      <aside className={`
        flex flex-col w-64 h-screen bg-slate-900 text-white fixed left-0 top-0 overflow-y-auto z-50
        transform transition-transform duration-300 ease-in-out
        ${isMobileOpen !== false ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static
      `}>
      <div className="p-6 flex items-center justify-between gap-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">TalentPulse</span>
        </div>
        {/* 移动端关闭按钮 */}
        <button
          onClick={onMobileToggle}
          className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1">
        <NavItem 
          icon={<LayoutDashboard size={20} />} 
          label={t.dashboard} 
          active={currentView === 'dashboard'} 
          onClick={() => handleNavigate('dashboard')}
        />
        <NavItem 
            icon={<ShieldCheck size={20} />} 
            label={t.users} 
            active={currentView === 'users'} 
            onClick={() => handleNavigate('users')}
        />
        <NavItem 
          icon={<Building2 size={20} />} 
          label={t.companies} 
          active={currentView === 'companies'} 
          onClick={() => handleNavigate('companies')}
        />
        <NavItem 
          icon={<Users size={20} />} 
          label={t.candidates} 
          active={currentView === 'candidates'} 
          onClick={() => handleNavigate('candidates')}
        />
        <NavItem 
          icon={<Briefcase size={20} />} 
          label={t.jobs} 
          active={currentView === 'jobs'} 
          onClick={() => handleNavigate('jobs')}
        />
        <NavItem 
          icon={<MessageSquare size={20} />} 
          label={t.applications} 
          active={currentView === 'applications'} 
          onClick={() => handleNavigate('applications')}
        />
        <NavItem 
          icon={<Calendar size={20} />} 
          label="面试管理" 
          active={currentView === 'interviews'} 
          onClick={() => handleNavigate('interviews')}
        />
        <NavItem 
          icon={<UserCheck size={20} />} 
          label="入职管理" 
          active={currentView === 'onboardings'} 
          onClick={() => handleNavigate('onboardings')}
        />
        <NavItem 
          icon={<FileText size={20} />} 
          label="系统日志" 
          active={currentView === 'logs'} 
          onClick={() => handleNavigate('logs')}
        />
        <NavItem 
          icon={<PieChart size={20} />} 
          label={t.analytics} 
          active={currentView === 'analytics'} 
          onClick={() => handleNavigate('analytics')}
        />
        <NavItem 
          icon={<Settings size={20} />} 
          label={t.settings} 
          active={currentView === 'settings'} 
          onClick={() => handleNavigate('settings')}
        />
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button 
          onClick={onLogout}
          className="flex items-center gap-3 w-full px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
        >
          <LogOut size={20} />
          <span>{t.signout}</span>
        </button>
      </div>
    </aside>
    </>
  );
};

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-3 w-full px-4 py-3 rounded-md transition-all duration-200 ${
    active 
      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
  }`}>
    {icon}
    <span className="font-medium text-sm">{label}</span>
  </button>
);
