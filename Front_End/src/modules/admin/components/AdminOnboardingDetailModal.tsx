import React from 'react';
import { X, Calendar, Clock, MapPin, User, Phone, Briefcase, Building, FileText, BadgeCheck, DollarSign, Timer } from 'lucide-react';

interface OnboardingDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    onboarding: any;
}

export const AdminOnboardingDetailModal: React.FC<OnboardingDetailModalProps> = ({ isOpen, onClose, onboarding }) => {
    if (!isOpen || !onboarding) return null;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Scheduled':
            case '已安排':
                return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Completed':
            case '已完成':
                return 'bg-green-100 text-green-700 border-green-200';
            case 'Pending':
            case '待安排':
            case '待处理':
                return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'Cancelled':
            case '已取消':
                return 'bg-red-100 text-red-700 border-red-200';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'Scheduled': return '已安排';
            case 'Completed': return '已完成';
            case 'Pending': return '待安排';
            case 'Cancelled': return '已取消';
            default: return status;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <BadgeCheck size={28} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">入职详情</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">记录编号: #{onboarding.id}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto">
                    {/* Status Banner */}
                    <div className={`p-4 rounded-xl border flex items-center justify-between ${getStatusColor(onboarding.status)}`}>
                        <div className="flex items-center gap-3 font-semibold">
                            <span className="text-sm">当前状态: {getStatusText(onboarding.status)}</span>
                        </div>
                        <div className="text-xs opacity-80">
                            {onboarding.onboardingDate && `安排日期: ${new Date(onboarding.onboardingDate).toLocaleDateString()}`}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Candidate & Job Info */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-l-4 border-indigo-500 pl-2">
                                核心信息
                            </h3>

                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-500">
                                        <User size={16} />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="relative h-10 w-10 flex-shrink-0">
                                            {/* Base Layer: Initials */}
                                            <div className="h-full w-full rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold border border-white dark:border-slate-800 shadow-sm text-xs">
                                                {onboarding.candidateName?.charAt(0) || '?'}
                                            </div>

                                            {/* Top Layer: Image */}
                                            {onboarding.candidateAvatar && (
                                                <img
                                                    src={onboarding.candidateAvatar.startsWith('http') ? onboarding.candidateAvatar : `http://localhost:8001${onboarding.candidateAvatar}`}
                                                    alt={onboarding.candidateName}
                                                    className="absolute inset-0 h-full w-full rounded-full object-cover"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                    }}
                                                />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">候选人</p>
                                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{onboarding.candidateName || '未知'}</p>
                                            <p className="text-xs text-slate-500">{onboarding.candidateEmail}</p>
                                            <p className="text-xs text-slate-500">{onboarding.candidatePhone}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-500">
                                        <Briefcase size={16} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">入职职位</p>
                                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{onboarding.jobTitle || '未知'}</p>
                                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                            <div className="relative h-5 w-5 flex-shrink-0">
                                                {/* Base Layer: Initials */}
                                                <div className="h-full w-full rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold border border-white dark:border-slate-800 shadow-sm text-[8px]">
                                                    {onboarding.companyName?.charAt(0) || '?'}
                                                </div>

                                                {/* Top Layer: Image */}
                                                {onboarding.companyLogo && (
                                                    <img
                                                        src={onboarding.companyLogo.startsWith('http') ? onboarding.companyLogo : `http://localhost:8001${onboarding.companyLogo}`}
                                                        alt={onboarding.companyName}
                                                        className="absolute inset-0 h-full w-full rounded object-cover"
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = 'none';
                                                        }}
                                                    />
                                                )}
                                            </div>
                                            {onboarding.companyName}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Logistics Info */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-l-4 border-emerald-500 pl-2">
                                报到物流
                            </h3>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                                    <Calendar size={16} className="text-slate-400" />
                                    <span className="text-sm">日期: {onboarding.onboardingDate ? new Date(onboarding.onboardingDate).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}</span>
                                </div>

                                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                                    <Clock size={16} className="text-slate-400" />
                                    <span className="text-sm">时间: {onboarding.onboardingTime || '未预约'}</span>
                                </div>

                                <div className="flex items-start gap-3 text-slate-600 dark:text-slate-300">
                                    <MapPin size={16} className="text-slate-400 mt-1" />
                                    <span className="text-sm">地点: {onboarding.onboardingLocation || '待定'}</span>
                                </div>

                                <div className="pt-2">
                                    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700">
                                        <p className="text-[10px] text-slate-400 font-bold mb-1 uppercase">入职负责人</p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">{onboarding.onboardingContact || '未指派'}</span>
                                            {onboarding.onboardingContactPhone && (
                                                <div className="flex items-center gap-1 text-xs text-indigo-600 font-bold">
                                                    <Phone size={12} />
                                                    {onboarding.onboardingContactPhone}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <hr className="border-slate-100 dark:border-slate-700" />

                    {/* Salary & Probation */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-l-4 border-amber-500 pl-2">
                            聘用详情
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="p-4 bg-amber-50/50 dark:bg-amber-900/10 rounded-2xl border border-amber-100/50 dark:border-amber-900/20 text-center">
                                <p className="text-[10px] text-amber-600/70 font-bold mb-1">试用期薪资</p>
                                <div className="flex items-center justify-center gap-1 text-amber-700 dark:text-amber-400 font-bold">
                                    <DollarSign size={14} />
                                    <span>{onboarding.probationSalary || '-'}</span>
                                </div>
                            </div>

                            <div className="p-4 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100/50 dark:border-emerald-900/20 text-center">
                                <p className="text-[10px] text-emerald-600/70 font-bold mb-1">转正后薪资</p>
                                <div className="flex items-center justify-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold">
                                    <DollarSign size={14} />
                                    <span>{onboarding.officialSalary || '-'}</span>
                                </div>
                            </div>

                            <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/20 text-center">
                                <p className="text-[10px] text-indigo-600/70 font-bold mb-1">试用期限</p>
                                <div className="flex items-center justify-center gap-1 text-indigo-700 dark:text-indigo-400 font-bold">
                                    <Timer size={14} />
                                    <span>{onboarding.probationPeriod ? `${onboarding.probationPeriod} 个月` : '-'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <FileText size={16} className="text-slate-400" />
                            备注信息
                        </h3>
                        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-sm text-slate-600 dark:text-slate-400 italic">
                            {onboarding.notes || '暂无特别说明'}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all font-sans"
                    >
                        关闭窗口
                    </button>
                </div>
            </div>
        </div>
    );
};
