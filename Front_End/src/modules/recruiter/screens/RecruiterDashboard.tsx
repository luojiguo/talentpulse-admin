import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard, Users, Briefcase, Settings, LogOut,
    Plus, Search, Sparkles, MapPin, ChevronDown, User, FileText, CheckCircle, XCircle,
    Calendar, Clock, TrendingUp, TrendingDown, ArrowRight, Filter,
    Columns, ChevronLeft, Menu, Shield, Info
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/i18nContext';

import { generateJobDescription, generateRecruitmentSuggestions } from '@/services/aiService';
import { jobAPI } from '@/services/apiService';
import { JobPosting } from '@/types/types';
import { processAvatarUrl } from '@/components/AvatarUploadComponent';

interface RecruiterDashboardProps {
    currentUser: any;
    jobs: JobPosting[];
    candidates: any[];
    interviews: any[];
    unreadMessageCount: number;
    profile: any;
    onSetIsPostModalOpen: (isOpen: boolean) => void;
    onSetNewJob: (job: any) => void;
    newJob: any;
    onHandleGenerateJD: () => void;
    isGeneratingJD: boolean;
    aiSuggestions: string | null;
    onHandleGetAiSuggestions: () => void;
    isLoadingSuggestions: boolean;
    onHandlePostJob: () => void;
    onSetViewingJobId: (jobId: string | number | null) => void;
    onSwitchRole?: (role: 'candidate' | 'recruiter') => void;
    onLogout: () => void;
}

export const RecruiterDashboard: React.FC<RecruiterDashboardProps> = ({
    currentUser,
    jobs,
    candidates,
    interviews,
    unreadMessageCount,
    profile,
    onSetIsPostModalOpen,
    onSetNewJob,
    newJob,
    onHandleGenerateJD,
    isGeneratingJD,
    aiSuggestions,
    onHandleGetAiSuggestions,
    isLoadingSuggestions,
    onHandlePostJob,
    onSetViewingJobId
}) => {
    const { colors, mode } = useTheme();
    const { t } = useI18n();

    // 根据当前时间返回问候语
    const getGreeting = () => {
        const hour = new Date().getHours();
        const isZh = t.settings.language !== 'English';
        if (hour < 12) return isZh ? '早安' : 'Good Morning';
        if (hour < 18) return isZh ? '下午好' : 'Good Afternoon';
        return isZh ? '晚上好' : 'Good Evening';
    };

    // 折叠状态管理
    const [isSuggestionsExpanded, setIsSuggestionsExpanded] = useState(true);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Header with Welcome */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
                <div className="flex items-center gap-4">
                    {profile.company?.logo && profile.company.logo !== 'C' && (
                        <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center justify-center overflow-hidden p-2 transition-colors">
                            <img
                                src={processAvatarUrl(profile.company.logo)}
                                alt="Company Logo"
                                className="max-w-full max-h-full object-contain"
                            />
                        </div>
                    )}
                    <div>
                        <h2 className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                            {getGreeting()}，{currentUser.name || (t.settings.language === 'English' ? 'Recruiter' : '招聘者')} 👋
                            <span className="block text-sm font-normal mt-1" style={{ color: colors.textSecondary }}>
                                {profile.company?.name || 'Talent Pulse'} · {profile.position || (t.settings.language === 'English' ? 'Hiring Manager' : '招聘负责人')}
                            </span>
                        </h2>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Compact AI Module (200x88) */}
                    <div className="w-[200px] h-[88px] bg-white dark:bg-slate-900 rounded-2xl p-3 shadow-sm relative overflow-hidden group border border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-colors">
                        <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-100/50 dark:bg-blue-600/20 rounded-full blur-2xl group-hover:bg-blue-200/50 dark:group-hover:bg-blue-600/40 transition-all duration-500"></div>
                        <div className="flex items-center gap-2 relative z-10">
                            <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-lg shadow-lg">
                                <Sparkles className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">{t.recruiter.aiCopilot}</span>
                        </div>

                        <button
                            onClick={onHandleGetAiSuggestions}
                            disabled={isLoadingSuggestions}
                            className={`w-full py-1.5 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-1.5 active:scale-95 border ${isLoadingSuggestions
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-100 dark:border-slate-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400'
                                }`}
                        >
                            {isLoadingSuggestions ? t.recruiter.generating : t.recruiter.smartAnalysis}
                            {!isLoadingSuggestions && <ArrowRight className="w-3 h-3" />}
                        </button>
                    </div>

                    <div className="h-[88px] px-6 flex flex-col justify-center bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.recruiter.currentDate}</div>
                        <div className="text-sm font-bold flex items-center" style={{ color: colors.textSecondary }}>
                            <Calendar className="w-4 h-4 mr-2" style={{ color: colors.primary }} />
                            {new Date().toLocaleDateString(t.settings.language === 'English' ? 'en-US' : 'zh-CN', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Suggestions Dropdown Panel */}
            {aiSuggestions && (
                <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl border border-blue-100 dark:border-slate-800 rounded-[32px] overflow-hidden shadow-xl shadow-blue-500/5 transition-all duration-500 animate-in fade-in zoom-in-95">
                    <button
                        onClick={() => setIsSuggestionsExpanded(!isSuggestionsExpanded)}
                        className="w-full p-6 flex items-center justify-between group hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                                    {t.recruiter.aiCopilot} · <span className="text-blue-600">{t.recruiter.smartAnalysis}</span>
                                </h3>
                                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
                                    {isSuggestionsExpanded ? t.recruiter.collapseAnalysis : t.recruiter.expandAnalysis}
                                </p>
                            </div>
                        </div>
                        <div className={`p-2 rounded-xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 transition-all duration-500 ${isSuggestionsExpanded ? 'rotate-180' : ''}`}>
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                        </div>
                    </button>

                    <div className={`transition-all duration-500 ease-in-out ${isSuggestionsExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
                        <div className="px-8 pb-8">
                            <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full"></div>
                                <div className="relative z-10">
                                    <div className="prose prose-slate dark:prose-invert max-w-none">
                                        {aiSuggestions.split('\n').map((line, idx) => {
                                            // 进一步清理行内的 * 和 #
                                            const cleanLine = line.replace(/[*#]/g, '').trim();
                                            const isListItem = cleanLine.startsWith('-') || cleanLine.startsWith('•');
                                            const content = cleanLine.replace(/^([-•])\s*/, '').trim();

                                            if (!content) return null;

                                            return (
                                                <div key={idx} className={`flex items-start gap-3 ${idx > 0 ? 'mt-3' : ''}`}>
                                                    {isListItem ? (
                                                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                                                    ) : (
                                                        <div className="p-1 px-2 bg-blue-100/50 dark:bg-blue-900/30 rounded text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-tighter whitespace-nowrap">
                                                            {t.recruiter.analysisPoint}
                                                        </div>
                                                    )}
                                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                                                        {content}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 企业认证提示 */}
            {!profile.company.is_verified && (
                <div className="bg-blue-50 dark:bg-blue-900/10 border-2 border-blue-100 dark:border-blue-800/50 rounded-2xl p-4 md:p-6 shadow-sm overflow-hidden relative group transition-all duration-300">
                    <div className="absolute -right-8 -top-8 w-32 h-32 bg-blue-100/50 dark:bg-blue-800/20 rounded-full blur-3xl transition-all duration-300 group-hover:scale-125"></div>
                    <div className="flex items-start gap-4 relative z-10">
                        <div className="flex-shrink-0 p-3 bg-blue-100 dark:bg-blue-800/30 text-blue-600 dark:text-blue-400 rounded-2xl shadow-inner">
                            <Shield size={24} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-blue-800 dark:text-blue-200 mb-2">{t.recruiter.certificationTitle}</h3>
                            <p className="text-sm text-blue-700/80 dark:text-blue-300/80 mb-4">{t.recruiter.certificationDesc}</p>
                            <a
                                href="/recruiter/certification"
                                className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-md hover:shadow-lg text-sm font-semibold active:scale-95"
                            >
                                {t.recruiter.verifyNow}
                                <ArrowRight className="w-4 h-4" />
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-[28px] shadow-sm border border-slate-100 dark:border-slate-800 transition-colors group hover:shadow-2xl hover:shadow-blue-200/40 dark:hover:shadow-blue-900/20 hover:translate-y-[-6px] transition-all duration-500">
                    <div className="flex items-center justify-between mb-5">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-2xl group-hover:scale-110 transition-transform duration-500">
                            <Briefcase className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{t.recruiter.activeJobs}</h3>
                    </div>
                    <div className="flex items-baseline">
                        <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{jobs.filter(j => j.status === 'active').length}</span>
                        <div className="ml-3 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/40 rounded-lg flex items-center gap-1">
                            <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                            <span className="text-[10px] text-blue-600 font-black">+12%</span>
                        </div>
                    </div>
                    <div className="mt-6 h-1.5 w-full bg-slate-100 dark:bg-slate-700/50 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full w-[70%] shadow-[0_0_12px_rgba(13,153,255,0.4)]"></div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-[28px] shadow-sm border border-slate-100 dark:border-slate-800 transition-colors group hover:shadow-2xl hover:shadow-sky-200/40 dark:hover:shadow-sky-900/20 hover:translate-y-[-6px] transition-all duration-500">
                    <div className="flex items-center justify-between mb-5">
                        <div className="p-3 bg-sky-50 dark:bg-sky-900/30 rounded-2xl group-hover:scale-110 transition-transform duration-500">
                            <Users className="w-6 h-6 text-sky-600 dark:text-sky-400" />
                        </div>
                        <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{t.recruiter.totalCandidates}</h3>
                    </div>
                    <div className="flex items-baseline">
                        <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{candidates.length}</span>
                        <div className="ml-3 px-2 py-0.5 bg-green-50 dark:bg-green-900/40 rounded-lg flex items-center gap-1">
                            <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                            <span className="text-[10px] text-green-600 font-black">+8%</span>
                        </div>
                    </div>
                    <div className="mt-6 h-1.5 w-full bg-slate-100 dark:bg-slate-700/50 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-sky-400 to-sky-600 rounded-full w-[45%] shadow-[0_0_12px_rgba(56,189,248,0.4)]"></div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-[28px] shadow-sm border border-slate-100 dark:border-slate-800 transition-colors group hover:shadow-2xl hover:shadow-indigo-200/40 dark:hover:shadow-indigo-900/20 hover:translate-y-[-6px] transition-all duration-500">
                    <div className="flex items-center justify-between mb-5">
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl group-hover:scale-110 transition-transform duration-500">
                            <Calendar className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{t.nav.interviews}</h3>
                    </div>
                    <div className="flex items-baseline">
                        <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{interviews.length}</span>
                        <div className="ml-3 px-2 py-0.5 bg-amber-50 dark:bg-amber-900/40 rounded-lg flex items-center gap-1">
                            <TrendingDown className="w-3.5 h-3.5 text-amber-600" />
                            <span className="text-[10px] text-amber-600 font-black">-3%</span>
                        </div>
                    </div>
                    <div className="mt-6 h-1.5 w-full bg-slate-100 dark:bg-slate-700/50 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-full w-[30%] shadow-[0_0_12px_rgba(79,70,229,0.4)]"></div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-[28px] shadow-sm border border-slate-100 dark:border-slate-800 transition-colors group hover:shadow-2xl hover:shadow-blue-200/40 dark:hover:shadow-blue-900/20 hover:translate-y-[-6px] transition-all duration-500">
                    <div className="flex items-center justify-between mb-5">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-2xl group-hover:scale-110 transition-transform duration-500">
                            <FileText className="w-6 h-6 text-blue-700 dark:text-blue-300" />
                        </div>
                        <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{t.recruiter.unreadMessages}</h3>
                    </div>
                    <div className="flex items-baseline">
                        <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{unreadMessageCount}</span>
                        <div className="ml-3 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/40 rounded-lg flex items-center gap-1">
                            <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                            <span className="text-[10px] text-blue-600 font-black">+15%</span>
                        </div>
                    </div>
                    <div className="mt-6 h-1.5 w-full bg-slate-100 dark:bg-slate-700/50 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full w-[60%] shadow-[0_0_12px_rgba(37,99,235,0.4)]"></div>
                    </div>
                </div>
            </div>



            {/* Recent Jobs */}
            <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors">
                <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                            最近发布的招聘职位
                            <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-black rounded-xl border border-blue-100 dark:border-blue-800/40">{jobs.length}</span>
                        </h3>
                        <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest">Manage your active recruitment postings</p>
                    </div>
                    <button
                        onClick={() => onSetIsPostModalOpen(true)}
                        className="flex items-center gap-2 px-8 py-3.5 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 dark:shadow-blue-900/20 text-sm font-black active:scale-95 group"
                    >
                        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                        发布新职位
                    </button>
                </div>

                <div className="overflow-x-auto p-2">
                    <table className="w-full text-sm min-w-[640px]">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-900/80 rounded-2xl transition-colors">
                                <th className="text-left py-4 px-6 font-black text-slate-400 uppercase tracking-[0.15em] text-[10px] rounded-l-2xl">职位名称</th>
                                <th className="text-left py-4 px-4 font-black text-slate-400 uppercase tracking-[0.15em] text-[10px] hidden sm:table-cell">办公地点</th>
                                <th className="text-left py-4 px-4 font-black text-slate-400 uppercase tracking-[0.15em] text-[10px] hidden md:table-cell">薪资范围</th>
                                <th className="text-left py-4 px-4 font-black text-slate-400 uppercase tracking-[0.15em] text-[10px] hidden lg:table-cell">申请热度</th>
                                <th className="text-left py-4 px-4 font-black text-slate-400 uppercase tracking-[0.15em] text-[10px] hidden xl:table-cell">发布日期</th>
                                <th className="text-left py-4 px-4 font-black text-slate-400 uppercase tracking-[0.15em] text-[10px]">当前状态</th>
                                <th className="text-right py-4 px-6 font-black text-slate-400 uppercase tracking-[0.15em] text-[10px] rounded-r-2xl">快捷操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/50 dark:divide-slate-700/20">
                            {jobs.slice(0, 5).map((job) => (
                                <tr key={job.id} className="group hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all duration-300">
                                    <td className="py-5 px-6 font-black text-slate-900 dark:text-slate-100 text-sm group-hover:text-blue-600 transition-colors">{job.title}</td>
                                    <td className="py-5 px-4 text-slate-500 dark:text-slate-400 hidden sm:table-cell font-bold text-xs uppercase">
                                        <div className="flex items-center">
                                            <MapPin className="w-4 h-4 mr-2 text-blue-500/60" />
                                            {job.location}
                                        </div>
                                    </td>
                                    <td className="py-5 px-4 text-indigo-600 dark:text-indigo-400 hidden md:table-cell font-black text-xs">{job.salary}</td>
                                    <td className="py-5 px-4 text-slate-500 dark:text-slate-400 hidden lg:table-cell">
                                        <div className="flex items-center gap-2">
                                            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700/50 rounded-lg text-[10px] font-black">{job.applicants} {t.recruiter.applicantsUnit}</span>
                                            {job.applicants > 10 && <TrendingUp className="w-3.5 h-3.5 text-green-500" />}
                                        </div>
                                    </td>
                                    <td className="py-5 px-4 text-slate-400 dark:text-slate-500 hidden xl:table-cell font-bold text-[10px]">{job.postedDate}</td>
                                    <td className="py-5 px-4">
                                        <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-colors ${job.status === 'active' ? 'bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-900/40 dark:text-blue-400 dark:border-blue-800/40' : 'bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700'}`}>
                                            {job.status === 'active' ? `● ${t.recruiter.recruiting}` : `○ ${t.recruiter.closed}`}
                                        </span>
                                    </td>
                                    <td className="py-5 px-6 text-right">
                                        <a
                                            href={`/recruiter/jobs/${job.id}`}
                                            className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all duration-300 shadow-sm border border-slate-100 dark:border-slate-700 group-hover:border-blue-200 group-hover:scale-110"
                                        >
                                            <ArrowRight className="w-5 h-5" />
                                        </a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {jobs.length === 0 && (
                    <div className="text-center py-16 text-slate-400">
                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Briefcase className="w-10 h-10 text-slate-200 dark:text-slate-600" />
                        </div>
                        <p className="text-sm font-bold">暂无发布的职位</p>
                        <p className="text-xs mt-1">开始发布您的第一个招聘需求吧</p>
                        <button
                            onClick={() => onSetIsPostModalOpen(true)}
                            className="mt-6 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-md text-sm font-bold"
                        >
                            立即发布职位
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};