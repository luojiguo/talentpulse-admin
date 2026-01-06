import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard, Users, Briefcase, Settings, LogOut,
    Plus, Search, Sparkles, MapPin, ChevronDown, User, FileText, CheckCircle, XCircle,
    Calendar, Clock, TrendingUp, TrendingDown, ArrowRight, Filter,
    Columns, ChevronLeft, Menu, Shield
} from 'lucide-react';

import { generateJobDescription, generateRecruitmentSuggestions } from '@/services/aiService';
import { jobAPI } from '@/services/apiService';
import { JobPosting } from '@/types/types';

interface RecruiterDashboardProps {
    currentUser: any;
    jobs: JobPosting[];
    candidates: any[];
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
}

export const RecruiterDashboard: React.FC<RecruiterDashboardProps> = ({
    currentUser,
    jobs,
    candidates,
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
    // 根据当前时间返回问候语
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return '早安';
        if (hour < 18) return '下午好';
        return '晚上好';
    };

    // 折叠状态管理
    const [isSuggestionsExpanded, setIsSuggestionsExpanded] = useState(true);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Header with Welcome */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">{getGreeting()}，{currentUser.name || '招聘者'} 👋</h2>
                    <p className="text-sm text-gray-500">这里是您的今日招聘动态概览。</p>
                </div>
                <div className="text-sm text-gray-500 flex items-center bg-white px-3 py-1.5 rounded-lg shadow-sm border border-gray-200">
                    <Calendar className="w-4 h-4 mr-2 text-emerald-500" /> {new Date().toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            {/* 企业认证提示 */}
            {!profile.company.is_verified && (
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-4 md:p-6 shadow-md">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 p-3 bg-yellow-100 text-yellow-600 rounded-full">
                            <Shield size={24} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-yellow-800 mb-2">您的企业尚未认证</h3>
                            <p className="text-sm text-yellow-700 mb-4">
                                完成企业认证后，您将获得：
                            </p>
                            <ul className="space-y-2 text-sm text-yellow-700 mb-4">
                                <li className="flex items-center gap-2">
                                    <svg className="h-4 w-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    发布职位权限
                                </li>
                                <li className="flex items-center gap-2">
                                    <svg className="h-4 w-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    查看候选人完整信息
                                </li>
                                <li className="flex items-center gap-2">
                                    <svg className="h-4 w-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    AI智能招聘建议
                                </li>
                            </ul>
                            <a
                                href="/recruiter/profile"
                                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition shadow-sm text-sm"
                            >
                                立即认证
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-gray-500">活跃职位</h3>
                        <div className="p-2 bg-emerald-100 rounded-lg">
                            <Briefcase className="w-5 h-5 text-emerald-600" />
                        </div>
                    </div>
                    <div className="flex items-baseline">
                        <span className="text-3xl font-bold text-gray-900">{jobs.filter(j => j.status === 'active').length}</span>
                        <span className="ml-2 text-sm text-green-600 flex items-center">
                            <TrendingUp className="w-4 h-4 mr-1" />
                            12%
                        </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">较上月增长</p>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-gray-500">总候选人</h3>
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Users className="w-5 h-5 text-blue-600" />
                        </div>
                    </div>
                    <div className="flex items-baseline">
                        <span className="text-3xl font-bold text-gray-900">{candidates.length}</span>
                        <span className="ml-2 text-sm text-green-600 flex items-center">
                            <TrendingUp className="w-4 h-4 mr-1" />
                            8%
                        </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">较上月增长</p>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-gray-500">面试邀请</h3>
                        <div className="p-2 bg-amber-100 rounded-lg">
                            <Calendar className="w-5 h-5 text-amber-600" />
                        </div>
                    </div>
                    <div className="flex items-baseline">
                        <span className="text-3xl font-bold text-gray-900">5</span>
                        <span className="ml-2 text-sm text-red-600 flex items-center">
                            <TrendingDown className="w-4 h-4 mr-1" />
                            3%
                        </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">较上月变化</p>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-gray-500">待处理消息</h3>
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <FileText className="w-5 h-5 text-purple-600" />
                        </div>
                    </div>
                    <div className="flex items-baseline">
                        <span className="text-3xl font-bold text-gray-900">{candidates.length}</span>
                        <span className="ml-2 text-sm text-green-600 flex items-center">
                            <TrendingUp className="w-4 h-4 mr-1" />
                            15%
                        </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">较上月增长</p>
                </div>
            </div>

            {/* AI Suggestions Card */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 p-3 bg-emerald-100 text-emerald-600 rounded-full">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-bold text-emerald-800">AI 招聘建议</h3>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={onHandleGetAiSuggestions}
                                    disabled={isLoadingSuggestions}
                                    className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-sm font-medium"
                                >
                                    {isLoadingSuggestions ? '生成中...' : '获取建议'}
                                </button>
                                <button
                                    onClick={() => setIsSuggestionsExpanded(!isSuggestionsExpanded)}
                                    className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition flex items-center justify-center"
                                >
                                    <ChevronDown 
                                        className={`w-4 h-4 transition-transform duration-300 ${isSuggestionsExpanded ? 'rotate-180' : ''}`} 
                                    />
                                </button>
                            </div>
                        </div>
                        <div 
                            className={`transition-all duration-300 ease-in-out overflow-hidden ${isSuggestionsExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
                        >
                            {aiSuggestions ? (
                                <div className="text-sm text-emerald-700 leading-relaxed whitespace-pre-line">
                                    {aiSuggestions}
                                </div>
                            ) : (
                                <p className="text-sm text-emerald-600">点击"获取建议"查看AI为您提供的招聘优化方案</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Jobs */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between flex-wrap gap-4 mb-5">
                    <h3 className="text-lg font-bold text-gray-900">最近发布的职位</h3>
                    <button
                        onClick={() => onSetIsPostModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-sm font-medium"
                    >
                        <Plus className="w-4 h-4" />
                        发布新职位
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[640px]">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left py-3 px-4 font-semibold text-gray-700">职位名称</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700 hidden sm:table-cell">地点</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700 hidden md:table-cell">薪资</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700 hidden lg:table-cell">申请人数</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700 hidden xl:table-cell">发布日期</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700">状态</th>
                                <th className="text-right py-3 px-4 font-semibold text-gray-700">操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {jobs.slice(0, 5).map((job) => (
                                <tr key={job.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                    <td className="py-3 px-4 font-medium text-gray-900">{job.title}</td>
                                    <td className="py-3 px-4 text-gray-600 flex items-center hidden sm:table-cell">
                                        <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                                        {job.location}
                                    </td>
                                    <td className="py-3 px-4 text-gray-600 hidden md:table-cell">{job.salary}</td>
                                    <td className="py-3 px-4 text-gray-600 hidden lg:table-cell">{job.applicants}</td>
                                    <td className="py-3 px-4 text-gray-600 hidden xl:table-cell">{job.postedDate}</td>
                                    <td className="py-3 px-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${job.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {job.status === 'active' ? '发布中' : '已关闭'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <a
                                            href={`/recruiter/jobs/${job.id}`}
                                            className="text-emerald-600 hover:text-emerald-800 text-sm font-medium"
                                        >
                                            查看详情
                                        </a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {jobs.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        <Briefcase className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm">暂无发布的职位</p>
                        <button
                            onClick={() => onSetIsPostModalOpen(true)}
                            className="mt-3 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-sm font-medium"
                        >
                            发布第一个职位
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};