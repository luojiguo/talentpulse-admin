import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, Users, Briefcase, Settings, LogOut, FileText, Menu, X, Calendar, UserCheck
} from 'lucide-react';

import { UserRole } from '@/types/types';
import UserAvatar from '@/components/UserAvatar';

interface RecruiterLayoutProps {
  onLogout: () => void;
  onSwitchRole: (role: UserRole) => void;
  currentUser: any;
  children: React.ReactNode;
}

export const RecruiterLayout: React.FC<RecruiterLayoutProps> = ({ onLogout, onSwitchRole, currentUser, children }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const location = useLocation();

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

    // 导航处理函数
    const handleNavigate = (path: string) => {
        navigate(path);
        setSidebarOpen(false);
    };

    // 判断导航项是否激活
    const isActive = (path: string) => {
        const currentPath = location.pathname;
        
        // 精确匹配或作为前缀匹配（如 /recruiter/messages 匹配 /recruiter/messages 和 /recruiter/messages/:id）
        // 对于 dashboard，只精确匹配
        return currentPath === path || 
            (path !== '/recruiter/dashboard' && currentPath.startsWith(path + '/'));
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Top Navigation */}
            <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30">
                <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
                    {/* Logo and Mobile Menu Toggle */}
                    <div className="flex items-center">
                        <div className="md:hidden">
                            <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
                        >
                            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                        </div>
                        <div className="flex items-center">
                            <Briefcase className="w-6 h-6 mr-2 text-emerald-600" />
                            <h1 className="text-xl font-bold text-gray-900">Talent Pulse</h1>
                        </div>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex space-x-1 flex-1 justify-center">
                        {
                            [
                                { name: '仪表盘', icon: LayoutDashboard, path: '/recruiter/dashboard' },
                                { name: '职位管理', icon: Briefcase, path: '/recruiter/jobs' },
                                { name: '候选人', icon: Users, path: '/recruiter/candidates' },
                                { name: '面试管理', icon: Calendar, path: '/recruiter/interviews' },
                                { name: '入职管理', icon: UserCheck, path: '/recruiter/onboardings' },
                                { name: '消息', icon: FileText, path: '/recruiter/messages' },
                            ].map((item) => {
                                return (
                                    <button
                                        key={item.name}
                                        onClick={() => navigate(item.path)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                            isActive(item.path) 
                                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' 
                                                : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        {item.name}
                                    </button>
                                );
                            })
                        }
                    </nav>

                    {/* User Profile */}
                    <div className="relative" ref={dropdownRef}>
                        <button 
                            onClick={() => setDropdownOpen(!dropdownOpen)} 
                            className="flex items-center space-x-3 text-gray-700 hover:text-emerald-600 transition-colors focus:outline-none py-1"
                        >
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold leading-tight">{currentUser.name}</p>
                                <p className="text-xs text-gray-500">招聘者</p>
                            </div>
                            <UserAvatar 
                                src={currentUser.avatar} 
                                name={currentUser.name} 
                                size={36} 
                                className="bg-emerald-100 text-emerald-800 border-2 border-emerald-300" 
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
                                className={`transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                            >
                                <path d="m6 9 6 6 6-6" />
                            </svg>
                        </button>
                        {/* Dropdown Menu */}
                        <div className={`absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-1 z-50 ring-1 ring-black ring-opacity-5 transition-all duration-200 origin-top-right ${
                            dropdownOpen 
                                ? 'opacity-100 scale-100 translate-y-0' 
                                : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                        }`}>
                            <button 
                                onClick={() => { navigate('/recruiter/profile'); setDropdownOpen(false); }}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                            >
                                个人中心
                            </button>
                            <button 
                                onClick={() => { onSwitchRole?.('candidate'); setDropdownOpen(false); }}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                            >
                                切换为求职者
                            </button>
                            <div className="border-t border-gray-100 my-1"></div>
                            <button 
                                onClick={() => { onLogout(); setDropdownOpen(false); }}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                            >
                                退出登录
                            </button>
                        </div>
                    </div>
                </div>
                

            </header>

            {/* Main Content */}
            <main className="flex-grow p-4 md:p-6 lg:p-8">
                {children}
            </main>
        </div>
    );
};