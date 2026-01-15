
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
  FileCheck, // Added icon
  Menu,
  X,
  Calendar,
  UserCheck,
  FileText,
  Bell
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
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, lang, onLogout, isMobileOpen, onMobileToggle, isCollapsed = false, onToggleCollapse }) => {
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
        flex flex-col h-screen bg-slate-900 text-white fixed left-0 top-0 overflow-y-auto z-50
        transform transition-all duration-300 ease-in-out
        ${isMobileOpen !== false ? 'translate-x-0' : '-translate-x-full'}
        ${isCollapsed ? 'w-16' : 'w-64'}
        lg:translate-x-0 lg:static
      `}>
        <div className={`p-6 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} gap-3 border-b border-slate-800`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && <span className="text-xl font-bold tracking-tight">TalentPulse</span>}
          </div>
          <div className="flex items-center gap-2">
            {/* 桌面端收缩/扩展按钮 */}
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors lg:flex hidden"
                aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isCollapsed ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  )}
                </svg>
              </button>
            )}
            {/* 移动端关闭按钮 */}
            <button
              onClick={onMobileToggle}
              className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1">
          <NavItem
            icon={<LayoutDashboard size={20} />}
            label={t.dashboard}
            active={currentView === 'dashboard'}
            onClick={() => handleNavigate('dashboard')}
            isCollapsed={isCollapsed}
          />
          <NavItem
            icon={<ShieldCheck size={20} />}
            label={t.users}
            active={currentView === 'users'}
            onClick={() => handleNavigate('users')}
            isCollapsed={isCollapsed}
          />
          <NavItem
            icon={<Building2 size={20} />}
            label={t.companies}
            active={currentView === 'companies'}
            onClick={() => handleNavigate('companies')}
            isCollapsed={isCollapsed}
          />
          <NavItem
            icon={<FileCheck size={20} />}
            label={t.certifications}
            active={currentView === 'certifications'}
            onClick={() => handleNavigate('certifications')}
            isCollapsed={isCollapsed}
          />
          <NavItem
            icon={<Users size={20} />}
            label={t.candidates}
            active={currentView === 'candidates'}
            onClick={() => handleNavigate('candidates')}
            isCollapsed={isCollapsed}
          />
          <NavItem
            icon={<Briefcase size={20} />}
            label={t.jobs}
            active={currentView === 'jobs'}
            onClick={() => handleNavigate('jobs')}
            isCollapsed={isCollapsed}
          />
          <NavItem
            icon={<MessageSquare size={20} />}
            label={t.applications}
            active={currentView === 'applications'}
            onClick={() => handleNavigate('applications')}
            isCollapsed={isCollapsed}
          />
          <NavItem
            icon={<Calendar size={20} />}
            label={t.interviews}
            active={currentView === 'interviews'}
            onClick={() => handleNavigate('interviews')}
            isCollapsed={isCollapsed}
          />
          <NavItem
            icon={<UserCheck size={20} />}
            label={t.onboardings}
            active={currentView === 'onboardings'}
            onClick={() => handleNavigate('onboardings')}
            isCollapsed={isCollapsed}
          />
          <NavItem
            icon={<FileText size={20} />}
            label={t.logs}
            active={currentView === 'logs'}
            onClick={() => handleNavigate('logs')}
            isCollapsed={isCollapsed}
          />
          <NavItem
            icon={<Bell size={20} />}
            label={t.notifications}
            active={currentView === 'notifications'}
            onClick={() => handleNavigate('notifications')}
            isCollapsed={isCollapsed}
          />
          <NavItem
            icon={<PieChart size={20} />}
            label={t.analytics}
            active={currentView === 'analytics'}
            onClick={() => handleNavigate('analytics')}
            isCollapsed={isCollapsed}
          />

        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={onLogout}
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'} gap-3 w-full px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors`}
            aria-label={t.signout}
          >
            <LogOut size={20} />
            {!isCollapsed && <span>{t.signout}</span>}
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
  isCollapsed?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick, isCollapsed = false }) => (
  <button
    onClick={onClick}
    className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'} gap-3 w-full px-4 py-3 rounded-md transition-all duration-200 ${active
      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    aria-label={label}
  >
    {icon}
    {!isCollapsed && <span className="font-medium text-sm">{label}</span>}
  </button>
);
