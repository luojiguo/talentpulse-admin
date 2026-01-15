import React from 'react';
import {
    User,
    Rocket,
    Briefcase,
    Layout,
    GraduationCap,
    Wrench,
    Sparkles,
    FileText
} from 'lucide-react';

interface ProfileSidebarProps {
    activeSection: string;
    onSectionChange: (section: string) => void;
}

const ProfileSidebar: React.FC<ProfileSidebarProps> = ({ activeSection, onSectionChange }) => {
    const menuItems = [
        {
            key: 'personal-info',
            icon: <User className="w-4 h-4" />,
            label: '个人信息',
        },
        {
            key: 'expected-job',
            icon: <Rocket className="w-4 h-4" />,
            label: '期望职位',
        },
        {
            key: 'work-experience',
            icon: <Briefcase className="w-4 h-4" />,
            label: '工作经历',
        },
        {
            key: 'project-experience',
            icon: <Layout className="w-4 h-4" />,
            label: '项目经历',
        },
        {
            key: 'education',
            icon: <GraduationCap className="w-4 h-4" />,
            label: '教育经历',
        },
        {
            key: 'skills',
            icon: <Wrench className="w-4 h-4" />,
            label: '专业技能',
        },
        {
            key: 'advantages',
            icon: <Sparkles className="w-4 h-4" />,
            label: '个人优势',
        }
    ];

    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-3 transition-all duration-500">
            <div className="mb-4 px-4 pt-3 pb-2 border-b border-slate-50 dark:border-slate-800/50">
                <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 flex items-center gap-2 uppercase tracking-wider">
                    <FileText className="w-4 h-4" />
                    简历目录
                </h3>
            </div>

            <div className="space-y-1">
                {menuItems.map((item) => {
                    const isActive = activeSection === item.key;
                    return (
                        <button
                            key={item.key}
                            onClick={() => onSectionChange(item.key)}
                            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-500 group relative
                                ${isActive
                                    ? 'bg-brand-50/80 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 font-black shadow-lg shadow-brand-500/5'
                                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                                }`}
                        >
                            {isActive && (
                                <div className="absolute left-0 w-1 h-6 bg-brand-500 rounded-r-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                            )}
                            <div className={`transition-all duration-500 ${isActive ? 'scale-110 text-brand-500' : 'group-hover:scale-110 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`}>
                                {item.icon}
                            </div>
                            <span className="text-sm tracking-wide">{item.label}</span>
                            {isActive && (
                                <div className="ml-auto flex items-center">
                                    <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse"></div>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default ProfileSidebar;
