import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, Users, Briefcase, Settings, LogOut, FileText, Menu, X, Calendar, UserCheck
} from 'lucide-react';

import { UserRole } from '@/types/types';

interface RecruiterLayoutProps {
  onLogout: () => void;
  onSwitchRole: (role: UserRole) => void;
  currentUser: any;
  children: React.ReactNode;
}

export const RecruiterLayout: React.FC<RecruiterLayoutProps> = ({ onLogout, children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const handleNavigate = (path: string) => {
        navigate(path);
        setSidebarOpen(false);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mobile Menu Button */}
            <div className="lg:hidden fixed top-4 left-4 z-50">
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors"
                >
                    {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Sidebar */}
            <div className="flex h-screen overflow-hidden">
                {/* Sidebar Overlay */}
                {sidebarOpen && (
                    <div 
                        className="fixed inset-0 bg-black/50 lg:hidden z-40"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Sidebar Content */}
                <div 
                    className={`
                        bg-white border-r border-gray-200 
                        w-64 flex flex-col shadow-sm
                        fixed lg:static inset-y-0 left-0 z-50 transform
                        transition-transform duration-300 ease-in-out
                        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                        lg:translate-x-0
                    `}
                >
                    <div className="p-5 border-b border-gray-200">
                        <h1 className="text-xl font-bold text-gray-900 flex items-center">
                            <Briefcase className="w-6 h-6 mr-2 text-emerald-600" />
                            Talent Pulse
                        </h1>
                        <p className="text-xs text-gray-500 mt-1">招聘者中心</p>
                    </div>

                    <nav className="flex-1 p-3 overflow-y-auto">
                        <ul className="space-y-1">
                            {
                                [
                                    { name: '仪表盘', icon: LayoutDashboard, path: '/recruiter/dashboard' },
                                    { name: '职位管理', icon: Briefcase, path: '/recruiter/jobs' },
                                    { name: '候选人', icon: Users, path: '/recruiter/candidates' },
                                    { name: '面试管理', icon: Calendar, path: '/recruiter/interviews' },
                                    { name: '入职管理', icon: UserCheck, path: '/recruiter/onboardings' },
                                    { name: '消息', icon: FileText, path: '/recruiter/messages' },
                                    { name: '个人中心', icon: Settings, path: '/recruiter/profile' },
                                ].map((item) => {
                                    const currentPath = location.pathname;
                                    // 精确匹配或作为前缀匹配（如 /recruiter/messages 匹配 /recruiter/messages 和 /recruiter/messages/:id）
                                    // 对于 dashboard，只精确匹配
                                    const isActive = currentPath === item.path || 
                                        (item.path !== '/recruiter/dashboard' && currentPath.startsWith(item.path + '/'));
                                    return (
                                        <li key={item.name}>
                                            <button
                                                onClick={() => handleNavigate(item.path)}
                                                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                                    isActive 
                                                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' 
                                                        : 'text-gray-700 hover:bg-gray-100'
                                                }`}
                                            >
                                                <item.icon className={`w-5 h-5 ${isActive ? 'text-emerald-600' : 'text-gray-500'}`} />
                                                {item.name}
                                            </button>
                                        </li>
                                    );
                                })
                            }
                        </ul>
                    </nav>

                    <div className="p-3 border-t border-gray-200">
                        <button
                            onClick={onLogout}
                            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                            退出登录
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                    {children}
                </div>
            </div>
        </div>
    );
};