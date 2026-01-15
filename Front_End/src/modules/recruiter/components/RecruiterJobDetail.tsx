import React, { useState, useEffect } from 'react';
import { ChevronLeft, Edit, Share2, MapPin, Briefcase, User, Calendar, Calendar as CalendarIcon, XCircle, CheckCircle, Sparkles, AlertCircle, Heart, Star, Users, GraduationCap } from 'lucide-react';
import { processAvatarUrl } from '@/components/AvatarUploadComponent';
import { JobPosting } from '@/types/types';
import { useI18n } from '@/contexts/i18nContext';
import { message } from 'antd';
import { interviewAPI, applicationAPI } from '@/services/apiService';
import { socketService } from '@/services/socketService';

const TIME_SLOTS = Array.from({ length: 13 }).map((_, i) => {
    const hour = 8 + i; // 8到20点
    const hourStr = hour.toString().padStart(2, '0');
    return [0, 15, 30, 45].map(minute => {
        const minuteStr = minute.toString().padStart(2, '0');
        return `${hourStr}:${minuteStr}`;
    });
}).flat();

interface RecruiterJobDetailProps {
    job: JobPosting;
    onBack: () => void;
    currentUserId: number;
    currentUser?: {
        name: string;
        position?: string;
    };
    companyAddress?: string;
    companyLogo?: string;
    jobs?: JobPosting[];
    onEditJob?: (job: JobPosting) => void;
    onViewCandidate?: (candidate: any) => void;
}

const RecruiterJobDetail: React.FC<RecruiterJobDetailProps> = ({ job, onBack, currentUserId, currentUser, companyAddress, companyLogo, jobs = [], onEditJob, onViewCandidate }) => {
    const { language, t } = useI18n();
    const [activeTab, setActiveTab] = useState<'details' | 'candidates'>('details');
    // 面试邀请模态框状态
    const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
    // 面试表单状态
    const [interviewForm, setInterviewForm] = useState({
        applicationId: 0,
        interviewDate: '',
        interviewTime: '',
        interviewTimeEnd: '',
        interviewerName: '',
        interviewerPosition: '',
        notes: '',
        location: '',
        interviewPosition: ''
    });
    // 表单加载状态
    const [formLoading, setFormLoading] = useState(false);
    // 申请列表状态
    const [applications, setApplications] = useState<any[]>([]);
    // 申请列表加载状态
    const [applicationsLoading, setApplicationsLoading] = useState(false);

    // 获取该职位的申请列表
    useEffect(() => {
        const fetchApplications = async () => {
            try {
                setApplicationsLoading(true);
                const response = await applicationAPI.getJobApplications(job.id);
                if ((response as any).status === 'success') {
                    setApplications(response.data || []);
                }
            } catch (error) {
                console.error('获取申请列表失败:', error);
                message.error(language === 'zh' ? '获取申请列表失败' : 'Failed to fetch application list');
            } finally {
                setApplicationsLoading(false);
            }
        };

        fetchApplications();
    }, [job.id]);

    // 打开面试邀请模态框
    const openInterviewModal = () => {
        // 使用招聘者所在公司的地址作为面试地点默认值
        const companyLocation = companyAddress || '';

        // 获取当前日期的第二天
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        setInterviewForm(prev => ({
            ...prev,
            // 默认值设置
            interviewDate: tomorrowStr, // 默认为当前日期的第二天
            interviewTime: '12:00', // 默认开始时间 12:00
            interviewTimeEnd: '13:00', // 默认结束时间 13:00
            // 自动填充字段
            interviewerName: currentUser?.name || '', // 自动填充面试官姓名
            interviewerPosition: currentUser?.position || '', // 自动填充面试官职位
            location: companyLocation, // 自动填充面试地址
            interviewPosition: job.title || '' // 自动填充面试岗位
        }));
        setIsInterviewModalOpen(true);
    };

    // 关闭面试邀请模态框
    const closeInterviewModal = () => {
        setIsInterviewModalOpen(false);
        // 重置表单
        setInterviewForm({
            applicationId: 0,
            interviewDate: '',
            interviewTime: '',
            interviewTimeEnd: '',
            interviewerName: '',
            interviewerPosition: '',
            notes: '',
            location: '',
            interviewPosition: ''
        });
    };

    // 处理表单字段变化
    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setInterviewForm(prev => {
            const newState = { ...prev, [name]: value };

            // 如果修改了开始时间，需要同步检查结束时间
            if (name === 'interviewTime') {
                const startTimeStr = value;
                const endTimeStr = prev.interviewTimeEnd;

                if (startTimeStr && endTimeStr) {
                    const [startH, startM] = startTimeStr.split(':').map(Number);
                    const [endH, endM] = endTimeStr.split(':').map(Number);
                    const startTotal = startH * 60 + startM;
                    const endTotal = endH * 60 + endM;

                    // 如果结束时间早于或等于新的开始时间，自动向后推迟1小时
                    if (endTotal <= startTotal) {
                        const newEndTotal = startTotal + 60;
                        const newEndH = Math.min(Math.floor(newEndTotal / 60), 23);
                        const newEndM = newEndTotal % 60;
                        newState.interviewTimeEnd = `${newEndH.toString().padStart(2, '0')}:${newEndM.toString().padStart(2, '0')}`;
                    }
                }
            }
            return newState;
        });
    };

    // 创建面试邀请
    const handleCreateInterview = async () => {
        try {
            setFormLoading(true);
            // 验证必填字段
            if (interviewForm.applicationId === 0 || !interviewForm.interviewDate || !interviewForm.interviewTime || !interviewForm.interviewTimeEnd) {
                message.error(language === 'zh' ? '请填写必填字段' : 'Please fill in required fields');
                return;
            }

            // 验证结束时间必须晚于开始时间
            const startTime = new Date(`2000-01-01T${interviewForm.interviewTime}`);
            const endTime = new Date(`2000-01-01T${interviewForm.interviewTimeEnd}`);
            if (endTime <= startTime) {
                message.error(language === 'zh' ? '面试结束时间必须晚于开始时间' : 'Interview end time must be later than start time');
                return;
            }

            // 准备完整的面试数据，只包含数据库中存在的字段
            const interviewData = {
                applicationId: interviewForm.applicationId,
                interviewDate: interviewForm.interviewDate,
                interviewTime: interviewForm.interviewTime,
                interviewTimeEnd: interviewForm.interviewTimeEnd,
                interviewerId: currentUserId,
                status: 'scheduled', // 默认状态：已安排
                notes: interviewForm.notes,
                interviewRound: 1, // 默认第1轮
                interviewerName: interviewForm.interviewerName,
                interviewerPosition: interviewForm.interviewerPosition,
                location: interviewForm.location,
                interviewPosition: interviewForm.interviewPosition
            };

            const response = await interviewAPI.createInterview(interviewData);

            if ((response as any).status === 'success') {
                // 更新对应的申请状态为Interview，并增加面试次数
                await applicationAPI.updateApplicationStatus(
                    interviewForm.applicationId,
                    'Interview',
                    language === 'zh' ? '已安排面试' : 'Interview Scheduled'
                );

                message.success(language === 'zh' ? '面试邀请创建成功' : 'Interview invitation created successfully');
                // 通过Socket.IO发送面试邀请通知
                const socket = socketService.getSocket();
                if (socket) {
                    socket.emit('interview_invitation', {
                        interview: response.data,
                        message: language === 'zh' ? `已向您发送面试邀请，请查收！` : `You have received an interview invitation!`,
                        interviewerId: currentUserId
                    });
                }
                closeInterviewModal();
            }
        } catch (error) {
            console.error('创建面试失败:', error);
            message.error(language === 'zh' ? '创建面试邀请失败，请重试' : 'Failed to create interview invitation, please try again');
        } finally {
            setFormLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <button onClick={onBack} className="flex items-center text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 font-black transition-all mb-2 px-6 py-2.5 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 w-fit active:scale-95 text-sm uppercase tracking-widest">
                <ChevronLeft className="w-5 h-5 mr-2" /> {language === 'zh' ? '返回职位列表' : 'Back to Jobs'}
            </button>

            <div className="bg-white dark:bg-slate-900 p-10 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-64 h-64 bg-blue-50/50 dark:bg-blue-900/10 rounded-full blur-3xl -mr-32 -mt-32"></div>

                <div className="flex items-center gap-8 relative z-10">
                    {companyLogo && companyLogo !== 'C' && (
                        <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-[24px] shadow-lg border border-slate-100 dark:border-slate-700 flex items-center justify-center overflow-hidden p-3 flex-shrink-0 group hover:scale-105 transition-transform">
                            <img
                                src={processAvatarUrl(companyLogo)}
                                alt="Company Logo"
                                className="max-w-full max-h-full object-contain"
                            />
                        </div>
                    )}
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{job.title}</h1>
                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-100 dark:border-blue-800/50 ${job.status === 'active' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                                {job.status === 'active' ? t.recruiter.recruiting : t.recruiter.closed}
                            </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500 dark:text-slate-400 font-bold">
                            <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-blue-500" /> {job.location}</span>
                            <span className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-blue-500" /> {job.experience || (language === 'zh' ? '经验不限' : 'No Exp. Req.')}</span>
                            <span className="flex items-center gap-2"><User className="w-4 h-4 text-blue-500" /> {job.type}</span>
                            <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-blue-500" /> {language === 'zh' ? '发布于' : 'Posted on'}: {job.postedDate}</span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-5 relative z-10">
                    <span className="text-3xl font-black text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-6 py-3 rounded-2xl border border-blue-100 dark:border-blue-800/50 shadow-sm">{job.salary}</span>
                    <div className="flex gap-3">
                        <button
                            onClick={() => onEditJob?.(job)}
                            className="p-3 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/40 rounded-2xl transition-all border border-slate-100 dark:border-slate-700 hover:border-blue-200 active:scale-95"
                            title="编辑职位"
                        >
                            <Edit className="w-5 h-5" />
                        </button>
                        <button className="p-3 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/40 rounded-2xl transition-all border border-slate-100 dark:border-slate-700 hover:border-blue-200 active:scale-95" title="分享职位">
                            <Share2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex gap-4 border-b border-slate-200 dark:border-slate-800">
                <button
                    onClick={() => setActiveTab('details')}
                    className={`pb-4 px-2 text-sm font-bold transition-all relative ${activeTab === 'details'
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                >
                    {language === 'zh' ? '职位详情' : 'Job Details'}
                    {activeTab === 'details' && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('candidates')}
                    className={`pb-4 px-2 text-sm font-bold transition-all relative ${activeTab === 'candidates'
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                >
                    {language === 'zh' ? '候选人列表' : 'Candidates'}
                    <span className="ml-2 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full text-xs">
                        {applications.length}
                    </span>
                    {activeTab === 'candidates' && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                    )}
                </button>
            </div>

            {
                activeTab === 'details' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            {/* Job Description */}
                            <div className="bg-white dark:bg-slate-900 p-10 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none min-h-[400px]">
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-8 flex items-center gap-4">
                                    <div className="w-2 h-8 bg-blue-600 rounded-full shadow-lg shadow-blue-200"></div>
                                    {language === 'zh' ? '职位职能描述 (JD)' : 'Job Description (JD)'}
                                </h3>
                                <div className="text-slate-600 dark:text-slate-300 leading-[1.8] whitespace-pre-line text-base font-medium bg-slate-50 dark:bg-slate-800/30 p-8 rounded-[24px] border border-slate-50 dark:border-slate-800/50">
                                    {job.description || (language === 'zh' ? "该职位暂未提供详细描述信息。" : "No detailed description available for this role.")}
                                </div>
                            </div>

                            {/* Additional Job Info: Skills & Benefits */}
                            <div className="bg-white dark:bg-slate-900 p-10 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-8">
                                {/* Skills */}
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-amber-500" />
                                        {language === 'zh' ? '技能要求' : 'Skills'}
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {job.required_skills && job.required_skills.length > 0 ? (
                                            job.required_skills.map((skill, index) => (
                                                <span key={index} className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl text-sm font-bold border border-blue-100 dark:border-blue-800/50">
                                                    {skill}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-slate-400 italic text-sm">{language === 'zh' ? '未指定技能' : 'No skills specified'}</span>
                                        )}
                                    </div>
                                </div>

                                {/* Preferred Skills */}
                                {job.preferred_skills && job.preferred_skills.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                            <Star className="w-5 h-5 text-blue-500" />
                                            {language === 'zh' ? '加分项' : 'Preferred'}
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {job.preferred_skills.map((skill, index) => (
                                                <span key={index} className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-xl text-sm font-bold border border-indigo-100 dark:border-indigo-800/50">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Benefits */}
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                        <Heart className="w-5 h-5 text-rose-500" />
                                        {language === 'zh' ? '福利待遇' : 'Benefits'}
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {job.benefits && job.benefits.length > 0 ? (
                                            job.benefits.map((benefit, index) => (
                                                <span key={index} className="px-4 py-2 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 rounded-xl text-sm font-bold border border-rose-100 dark:border-rose-800/50">
                                                    {benefit}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-slate-400 italic text-sm">{language === 'zh' ? '未指定福利' : 'No benefits specified'}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
                                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">{language === 'zh' ? '职位概览' : 'Overview'}</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white dark:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400">
                                                <GraduationCap className="w-5 h-5" />
                                            </div>
                                            <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{language === 'zh' ? '学历要求' : 'Degree'}</span>
                                        </div>
                                        <span className="text-sm font-black text-slate-900 dark:text-white">{job.degree || '-'}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white dark:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400">
                                                <Briefcase className="w-5 h-5" />
                                            </div>
                                            <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{language === 'zh' ? '工作模式' : 'Work Mode'}</span>
                                        </div>
                                        <span className="text-sm font-black text-slate-900 dark:text-white">{job.work_mode || '-'}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white dark:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400">
                                                <Users className="w-5 h-5" />
                                            </div>
                                            <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{language === 'zh' ? '招聘人数' : 'Hiring'}</span>
                                        </div>
                                        <span className="text-sm font-black text-slate-900 dark:text-white">{job.hiring_count || 1} {language === 'zh' ? '人' : ''}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white dark:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400">
                                                <AlertCircle className="w-5 h-5" />
                                            </div>
                                            <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{language === 'zh' ? '紧急程度' : 'Urgency'}</span>
                                        </div>
                                        <span className={`text-sm font-black px-3 py-1 rounded-lg ${job.urgency === '紧急' || job.urgency === 'Urgent' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                                            {job.urgency || (language === 'zh' ? '普通' : 'Normal')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
                                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">{language === 'zh' ? '招聘实时数据' : 'Real-time Stats'}</h3>
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-8 rounded-3xl border border-blue-100 dark:border-blue-800/50 text-center shadow-inner group hover:bg-blue-100 transition-colors">
                                        <p className="text-5xl font-black text-blue-600 dark:text-blue-400 tracking-tighter group-hover:scale-110 transition-transform">{job.applicants || 0}</p>
                                        <p className="text-xs font-black text-blue-800 dark:text-blue-300 mt-3 uppercase tracking-[0.2em] opacity-60">{language === 'zh' ? '申请总数' : 'Applications'}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-4 mt-6">
                                    <button
                                        className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 dark:shadow-none active:scale-95 text-sm tracking-widest uppercase"
                                        onClick={openInterviewModal}
                                    >
                                        {language === 'zh' ? '发起面试邀请' : 'Send Invite'}
                                    </button>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8 rounded-[32px] text-white shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-white/20 transition-colors"></div>
                                <h3 className="font-black text-xl mb-3 flex items-center gap-3">
                                    <CheckCircle className="w-6 h-6 text-blue-400" />
                                    {language === 'zh' ? 'AI 智能建议' : 'AI Analysis'}
                                </h3>
                                <p className="text-slate-300 text-sm mb-6 leading-relaxed font-medium">
                                    {language === 'zh'
                                        ? <>该职位的浏览量比平均水平高 <span className="text-blue-400 font-black">20%</span>，但申请转化率略低。建议系统性优化薪资范围展示或增加企业福利描述。</>
                                        : <>Views for this job are <span className="text-blue-400 font-black">20%</span> higher than average, but the conversion rate is slightly low. Consider optimizing salary or adding benefits.</>}
                                </p>
                                <button className="text-[10px] font-black tracking-widest uppercase bg-white/10 hover:bg-white/20 px-6 py-2.5 rounded-xl transition-all border border-white/10 active:scale-95">{language === 'zh' ? '获取优化方案' : 'Get Insight'}</button>
                            </div>
                        </div>
                    </div>
                ) : (
                    // Candidates Tab Content
                    <div className="space-y-6">
                        {applicationsLoading ? (
                            <div className="flex justify-center py-20">
                                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : applications.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {applications.map((app) => (
                                    <div key={app.id} className="bg-white dark:bg-slate-900 p-6 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-lg hover:shadow-xl transition-all group relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 dark:bg-slate-800 rounded-bl-[100px] -mr-8 -mt-8 opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
                                        <div className="flex items-start justify-between mb-4 relative z-10">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 overflow-hidden shadow-sm">
                                                    {app.candidate_avatar ? (
                                                        <img src={processAvatarUrl(app.candidate_avatar)} alt="Avatar" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User className="w-7 h-7" />
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className="text-lg font-black text-slate-900 dark:text-white">{app.candidate_name || (language === 'zh' ? '匿名候选人' : 'Anonymous')}</h4>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{app.applied_at ? new Date(app.applied_at).toLocaleDateString() : 'Recent'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2 mb-6 relative z-10">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-slate-500 dark:text-slate-400 font-medium">{language === 'zh' ? '状态' : 'Status'}</span>
                                                <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wide ${app.status === 'Pending' ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
                                                    app.status === 'Interview' ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' :
                                                        app.status === 'Rejected' ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' :
                                                            'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                                    }`}>
                                                    {app.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-slate-500 dark:text-slate-400 font-medium">{language === 'zh' ? '匹配度' : 'Match'}</span>
                                                <span className="text-slate-900 dark:text-slate-200 font-black">{app.match_score || '85'}%</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 relative z-10">
                                            <button
                                                onClick={() => onViewCandidate?.(app)}
                                                className="py-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-sm transition-colors"
                                            >
                                                {language === 'zh' ? '查看简历' : 'View Profile'}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    // Quick interview - reuse modal logic by simulating
                                                    setInterviewForm(prev => ({ ...prev, applicationId: app.id }));
                                                    openInterviewModal();
                                                }}
                                                className="py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-colors shadow-lg shadow-blue-200 dark:shadow-none"
                                            >
                                                {language === 'zh' ? '面试' : 'Interview'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-[32px] border-2 border-dashed border-slate-200 dark:border-slate-800">
                                <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">{language === 'zh' ? '暂无申请' : 'No Applications'}</h3>
                                <p className="text-slate-500 dark:text-slate-400">{language === 'zh' ? '该职位目前还没有收到申请。' : 'No candidates have applied for this position yet.'}</p>
                            </div>
                        )}
                    </div>
                )
            }

            {/* 面试邀请模态框 */}
            {
                isInterviewModalOpen && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex justify-center items-center p-4 animate-in fade-in duration-300">
                        <div
                            className="bg-white dark:bg-slate-900 rounded-[32px] shadow-[0_32px_128px_-15px_rgba(0,0,0,0.5)] w-full max-w-2xl max-h-[92vh] overflow-hidden transform transition-all duration-300 animate-in zoom-in-95 border border-white/20 dark:border-slate-800"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-8 border-b border-slate-100 dark:border-slate-800/50 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20 relative overflow-hidden">
                                <div className="absolute right-0 top-0 w-48 h-48 bg-blue-100/30 dark:bg-blue-900/10 rounded-full blur-3xl -mr-24 -mt-24"></div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center relative z-10 tracking-tight">
                                    <CalendarIcon className="w-6 h-6 mr-3 text-blue-600" />
                                    {language === 'zh' ? '编排面试邀请' : 'Schedule Interview'}
                                </h3>
                                <button
                                    onClick={closeInterviewModal}
                                    className="p-3 rounded-2xl text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-rose-500 transition-all shadow-sm border border-slate-100 dark:border-slate-800 active:scale-95 relative z-10"
                                >
                                    <XCircle className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="p-8 overflow-y-auto max-h-[calc(92vh-120px)] bg-white dark:bg-slate-900">
                                <form className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* 面试日期 */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Appointment Date *</label>
                                            <div className="relative">
                                                <input
                                                    type="date"
                                                    name="interviewDate"
                                                    value={interviewForm.interviewDate}
                                                    onChange={handleFormChange}
                                                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-slate-900 dark:text-white outline-none"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {/* 面试时间段 */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Start *</label>
                                                <select
                                                    name="interviewTime"
                                                    value={interviewForm.interviewTime}
                                                    onChange={handleFormChange}
                                                    className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-slate-900 dark:text-white outline-none appearance-none"
                                                    required
                                                >
                                                    <option value="">Start</option>
                                                    {TIME_SLOTS.map(timeValue => (
                                                        <option key={timeValue} value={timeValue}>{timeValue}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">End *</label>
                                                <select
                                                    name="interviewTimeEnd"
                                                    value={interviewForm.interviewTimeEnd}
                                                    onChange={handleFormChange}
                                                    className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-slate-900 dark:text-white outline-none appearance-none"
                                                    required
                                                >
                                                    <option value="">End</option>
                                                    {TIME_SLOTS.filter(timeValue => {
                                                        if (!interviewForm.interviewTime) return true;
                                                        const [startH, startM] = interviewForm.interviewTime.split(':').map(Number);
                                                        const [endH, endM] = timeValue.split(':').map(Number);
                                                        return (endH * 60 + endM) > (startH * 60 + startM);
                                                    }).map(timeValue => (
                                                        <option key={timeValue} value={timeValue}>{timeValue}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* 候选人选择 */}
                                        <div className="md:col-span-2 space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Candidate *</label>
                                            <select
                                                name="applicationId"
                                                value={interviewForm.applicationId}
                                                onChange={handleFormChange}
                                                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-black text-slate-900 dark:text-white outline-none"
                                                required
                                            >
                                                <option value={0}>{language === 'zh' ? '请选择面试候选人' : 'Select Candidate'}</option>
                                                {applicationsLoading ? (
                                                    <option value={0} disabled>{language === 'zh' ? '正在同步申请数据...' : 'Syncing applications...'}</option>
                                                ) : (
                                                    applications.map(application => (
                                                        <option key={application.id} value={application.id}>
                                                            {application.candidate_name || (language === 'zh' ? '候选人' : 'Candidate')} ({language === 'zh' ? '目前状态' : 'Status'}: {application.status})
                                                        </option>
                                                    ))
                                                )}
                                            </select>
                                        </div>

                                        {/* 面试官身份 - 读卡式显示 */}
                                        {currentUser && (
                                            <div className="md:col-span-2 grid grid-cols-2 gap-4">
                                                <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Interviewer</label>
                                                    <div className="font-black text-slate-900 dark:text-white">{interviewForm.interviewerName}</div>
                                                </div>
                                                {currentUser.position && (
                                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Title</label>
                                                        <div className="font-black text-slate-900 dark:text-white truncate">{interviewForm.interviewerPosition}</div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* 面试岗位 */}
                                        <div className="md:col-span-2 space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Interview Role *</label>
                                            <select
                                                name="interviewPosition"
                                                value={interviewForm.interviewPosition}
                                                onChange={handleFormChange}
                                                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-black text-slate-900 dark:text-white outline-none"
                                                required
                                            >
                                                {jobs.map(job => (
                                                    <option key={job.id} value={job.title}>{job.title}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* 面试地址 */}
                                        <div className="md:col-span-2 space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Location / Link</label>
                                            <div className="relative">
                                                <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                                <input
                                                    type="text"
                                                    name="location"
                                                    value={interviewForm.location}
                                                    onChange={handleFormChange}
                                                    className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-slate-900 dark:text-white outline-none"
                                                    placeholder={language === 'zh' ? "请输入线下详细地址或线上会议会议链接" : "Enter offline address or online meeting link"}
                                                />
                                            </div>
                                        </div>

                                        {/* 面试备注 */}
                                        <div className="md:col-span-2 space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Additional Notes</label>
                                            <textarea
                                                name="notes"
                                                value={interviewForm.notes}
                                                onChange={handleFormChange}
                                                rows={4}
                                                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[24px] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-slate-900 dark:text-white outline-none resize-none"
                                                placeholder={language === 'zh' ? "在此输入相关的面试说明、注意事项或准备建议..." : "Enter interview instructions, notes or preparation suggestions..."}
                                            ></textarea>
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-4 pt-6 mt-4 border-t border-slate-100 dark:border-slate-800">
                                        <button
                                            type="button"
                                            onClick={closeInterviewModal}
                                            className="px-8 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-black text-sm rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95"
                                        >
                                            {language === 'zh' ? '暂不发送' : 'Cancel'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleCreateInterview}
                                            disabled={formLoading}
                                            className="px-10 py-4 bg-blue-600 text-white font-black text-sm rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 dark:shadow-none flex items-center gap-3 disabled:opacity-50 active:scale-95"
                                        >
                                            {formLoading ? (
                                                <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                                            ) : (
                                                <CheckCircle className="w-5 h-5" />
                                            )}
                                            {formLoading
                                                ? (language === 'zh' ? '编排中...' : 'Processing...')
                                                : (language === 'zh' ? '确认发布邀请' : 'Confirm & Send')
                                            }
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default RecruiterJobDetail;