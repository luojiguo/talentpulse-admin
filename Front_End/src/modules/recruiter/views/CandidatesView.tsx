import React, { useState, useEffect } from 'react';
import {
    Users, Search, Filter, ChevronDown, CheckCircle, Clock, Calendar,
    User, Briefcase, MapPin, FileText, ArrowRight, XCircle, RefreshCw
} from 'lucide-react';
import { message } from 'antd';
import { useI18n } from '@/contexts/i18nContext';
import { interviewAPI } from '@/services/apiService';
import OnboardingModal from '../components/OnboardingModal';

interface Interview {
    id: number;
    applicationId: number;
    interviewDate: string;
    interviewTime: string;
    location: string;
    interviewerId: number;
    status: string;
    notes: string;
    interviewRound: number;
    interviewType: string;
    interviewTopic: string;
    interviewDuration: number;
    interviewerName: string;
    interviewerPosition: string;
    interviewResult: string;
    interviewFeedback: string;
}

interface Candidate {
    id: number;
    candidateName: string;
    candidateId: number;
    userId?: number;
    jobId: number;
    jobTitle: string;
    companyName: string;
    stage: string;
    appliedDate: string;
    matchScore?: number;
    skills?: string[];
    experience?: string;
    education?: string;
    school?: string;
    interviews?: Interview[];
    currentPosition?: string;
    avatar?: string;
    latestInterviewTime?: string | null;
    latestInterviewStatus?: string;
    applicationResume?: {
        url: string;
        name: string;
    } | null;
}

interface CandidatesViewProps {
    candidates: Candidate[];
    currentUserId: number;
    onSendMessage?: (candidate: Candidate) => void;
    onViewDetails?: (candidate: Candidate) => void;
    onRefresh?: () => void;
}

export const CandidatesView: React.FC<CandidatesViewProps> = ({ candidates, currentUserId, onSendMessage, onViewDetails, onRefresh }) => {
    const { language, t } = useI18n();
    const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>(candidates);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStage, setSelectedStage] = useState<string>('all');
    const [selectedJob, setSelectedJob] = useState<string>('all');
    const [filterSchool, setFilterSchool] = useState('');
    const [filterExperience, setFilterExperience] = useState('all');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [loading, setLoading] = useState(false);

    // 面试邀请模态框状态
    const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
    // 入职安排模态框状态
    const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
    // 当前选中的候选人
    const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
    // 面试表单状态
    const [interviewForm, setInterviewForm] = useState({
        applicationId: 0,
        interviewDate: '',
        interviewTime: '',
        location: '',
        interviewType: '电话' as '电话' | '视频' | '现场',
        interviewRound: 1,
        interviewDuration: 60,
        interviewerName: '',
        interviewerPosition: '',
        notes: '',
        interviewTopic: '',
        invitationMessage: '',
        invitationExpiresAt: '',
        timeZone: 'Asia/Shanghai'
    });
    // 表单加载状态
    const [formLoading, setFormLoading] = useState(false);

    // Extract unique job titles from candidates
    const uniqueJobs = Array.from(new Set(candidates.map(c => c.jobTitle)));

    // Extract unique stages from candidates
    // Extract unique stages from candidates
    // const uniqueStages = Array.from(new Set(candidates.map(c => c.stage)));

    // Define standard tabs with counts
    const tabList = [
        { key: 'all', label: t.recruiter.allStatus },
        { key: 'New', label: t.recruiter.statusNew },
        { key: 'Interview', label: t.recruiter.statusInterview },
        { key: 'Offer', label: t.recruiter.statusOffer },
        { key: 'Rejected', label: t.recruiter.statusRejected }
    ];

    // Calculate counts for each tab
    const getTabCount = (key: string) => {
        if (key === 'all') return candidates.length;
        return candidates.filter(c => c.stage === key).length;
    };

    // Fetch all interviews
    useEffect(() => {
        const fetchInterviews = async () => {
            setLoading(true);
            try {
                const response = await interviewAPI.getAllInterviews({
                    userId: currentUserId,
                    role: 'recruiter'
                });
                if ((response as any).status === 'success' && (response as any).data) {
                    setInterviews((response as any).data);
                }
            } catch (error) {
                console.error('获取面试数据失败:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchInterviews();
    }, []);

    // Apply filters and associate interviews with candidates
    useEffect(() => {
        let result = [...candidates];

        // Apply search filter
        if (searchTerm) {
            const lowerCaseSearch = searchTerm.toLowerCase();
            result = result.filter(candidate =>
                candidate.candidateName.toLowerCase().includes(lowerCaseSearch) ||
                candidate.jobTitle.toLowerCase().includes(lowerCaseSearch)
            );
        }

        // Apply stage filter
        if (selectedStage !== 'all') {
            result = result.filter(candidate => candidate.stage === selectedStage);
        }

        // Apply job filter
        if (selectedJob !== 'all') {
            result = result.filter(candidate => candidate.jobTitle === selectedJob);
        }

        // Apply school filter
        if (filterSchool) {
            const lowerCaseSchool = filterSchool.toLowerCase();
            result = result.filter(candidate =>
                candidate.school && candidate.school.toLowerCase().includes(lowerCaseSchool)
            );
        }

        // Apply experience filter
        if (filterExperience !== 'all') {
            result = result.filter(candidate => {
                const expStr = candidate.experience || '0';
                const years = parseInt(expStr) || 0;

                switch (filterExperience) {
                    case '0-1': return years < 1;
                    case '1-3': return years >= 1 && years <= 3;
                    case '3-5': return years > 3 && years <= 5;
                    case '5-10': return years > 5 && years <= 10;
                    case '10+': return years > 10;
                    default: return true;
                }
            });
        }

        // Associate interviews with candidates
        const candidatesWithInterviews = result.map(candidate => {
            const candidateInterviews = interviews.filter(interview => {
                // 根据申请ID关联面试
                return interview.applicationId === candidate.id;
            });
            return {
                ...candidate,
                interviews: candidateInterviews
            };
        });

        setFilteredCandidates(candidatesWithInterviews);
    }, [searchTerm, selectedStage, selectedJob, candidates, interviews]);

    const handleResetFilters = () => {
        setSearchTerm('');
        setSelectedStage('all');
        setSelectedJob('all');
        setFilterSchool('');
        setFilterExperience('all');
    };

    const getStageColor = (stage: string) => {
        switch (stage) {
            case 'New':
                return 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
            case 'Screening':
                return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300';
            case 'Interview':
                return 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
            case 'Offer':
                return 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300';
            case 'Rejected':
                return 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300';
            case 'Hired':
                return 'bg-blue-600 text-white shadow-lg shadow-blue-200';
            default:
                return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
        }
    };

    // 关闭面试邀请模态框
    const closeInterviewModal = () => {
        setIsInterviewModalOpen(false);
        setSelectedCandidate(null);
        // 重置表单
        setInterviewForm({
            applicationId: 0,
            interviewDate: '',
            interviewTime: '',
            location: '',
            interviewType: '电话',
            interviewRound: 1,
            interviewDuration: 60,
            interviewerName: '',
            interviewerPosition: '',
            notes: '',
            interviewTopic: '',
            invitationMessage: '',
            invitationExpiresAt: '',
            timeZone: 'Asia/Shanghai'
        });
    };

    // 处理表单字段变化
    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setInterviewForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // 创建面试邀请
    const handleCreateInterview = async () => {
        try {
            setFormLoading(true);
            // 验证必填字段
            if (!interviewForm.interviewDate || !interviewForm.interviewTime) {
                message.error(language === 'zh' ? '请填写必填字段' : 'Please fill in required fields');
                return;
            }

            const response = await interviewAPI.createInterview({
                ...interviewForm,
                interviewerId: currentUserId
            });

            if ((response as any).status === 'success') {
                message.success(language === 'zh' ? '面试邀请创建成功' : 'Interview invitation created successfully');
                // 重新获取面试列表
                const fetchResponse = await interviewAPI.getAllInterviews({
                    userId: currentUserId,
                    role: 'recruiter'
                });
                if ((fetchResponse as any).status === 'success') {
                    setInterviews((fetchResponse as any).data || []);
                }
                closeInterviewModal();
            }
        } catch (error) {
            console.error('创建面试失败:', error);
            message.error(language === 'zh' ? '创建面试邀请失败，请重试' : 'Failed to create interview invitation. Please try again.');
        } finally {
            setFormLoading(false);
        }
    };

    // Helper to translate degree
    const translateDegree = (degree: string) => {
        const map: Record<string, string> = {
            'Master': language === 'zh' ? '硕士' : 'Master',
            'Bachelor': language === 'zh' ? '本科' : 'Bachelor',
            'PhD': language === 'zh' ? '博士' : 'PhD',
            'Associate': language === 'zh' ? '大专' : 'Associate',
            'High School': language === 'zh' ? '高中' : 'High School'
        };
        return map[degree] || degree;
    };

    // Helper to translate interview status
    const translateInterviewStatus = (status: string) => {
        const map: Record<string, string> = {
            'pending': language === 'zh' ? '待确认' : 'Pending',
            'accepted': language === 'zh' ? '已接受' : 'Accepted',
            'rejected': language === 'zh' ? '已拒绝' : 'Rejected',
            'completed': language === 'zh' ? '已完成' : 'Completed',
            'cancelled': language === 'zh' ? '已取消' : 'Cancelled'
        };
        return map[status] || status;
    };

    return (
        <div className="space-y-4 p-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{language === 'zh' ? '候选人中心' : 'Candidates Center'}</h1>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">{language === 'zh' ? '深度管理招聘漏斗，把握每一位优秀人才' : 'Managing the recruitment funnel and every great talent'}</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={onRefresh}
                        className="p-2.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all active:scale-90"
                        title={language === 'zh' ? '同步最新数据' : 'Refresh Data'}
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                    <div className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center bg-white dark:bg-slate-800 px-4 py-2.5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <Users className="w-4 h-4 mr-2.5 text-blue-600" />
                        {t.recruiter.talentPoolTotal}{filteredCandidates.length}{t.recruiter.talentPoolUnit}
                    </div>
                </div>
            </div>

            {/* 状态阶段切换 */}
            <div className="flex flex-wrap gap-2.5 mb-6 border-b border-slate-100 dark:border-slate-700/50 pb-2">
                {tabList.map(tab => {
                    const count = getTabCount(tab.key);
                    const isActive = selectedStage === tab.key;

                    return (
                        <button
                            key={tab.key}
                            onClick={() => setSelectedStage(tab.key)}
                            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all relative group ${isActive
                                ? 'text-blue-700 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300'
                                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700'
                                }`}
                        >
                            {tab.label}
                            <span className={`px-2 py-0.5 rounded-full text-xs transition-colors ${isActive ? 'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200' : 'bg-slate-100 text-slate-400 dark:bg-slate-700 group-hover:bg-slate-200'
                                }`}>
                                {count}
                            </span>
                            {isActive && (
                                <span className="absolute bottom-0 left-2 right-2 h-1 bg-blue-600 rounded-full transform translate-y-2 shadow-sm"></span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* 搜索与高级过滤 */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-8">
                <div className="flex flex-col lg:flex-row gap-5">
                    {/* 搜索框 */}
                    <div className="flex-1 relative group">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-blue-600 transition-colors" />
                        <input
                            type="text"
                            placeholder={t.recruiter.searchCandidatesPlaceholder}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium"
                        />
                    </div>

                    {/* 按钮组 */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={`flex items-center gap-2 px-6 py-3 border rounded-xl transition-all text-sm font-black active:scale-95 ${isFilterOpen || selectedJob !== 'all' || filterSchool || filterExperience !== 'all'
                                ? 'bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-200 dark:shadow-blue-900/20'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50'
                                }`}
                        >
                            <Filter className="w-4 h-4" />
                            {t.recruiter.multiFilters}
                            {(selectedJob !== 'all' || filterSchool || filterExperience !== 'all') && (
                                <span className="w-2 h-2 rounded-full bg-white ml-1 animate-pulse"></span>
                            )}
                            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isFilterOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {(searchTerm || selectedStage !== 'all' || selectedJob !== 'all' || filterSchool || filterExperience !== 'all') && (
                            <button
                                onClick={handleResetFilters}
                                className="px-5 py-3 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-xl transition-all text-sm font-bold"
                            >
                                {t.recruiter.clear}
                            </button>
                        )}
                    </div>
                </div>

                {/* 展开的筛选面板 */}
                {isFilterOpen && (
                    <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-3 duration-300">
                        {/* 职位筛选 */}
                        <div className="space-y-2">
                            <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">{language === 'zh' ? '申请岗位目标' : 'Target Job'}</label>
                            <div className="relative group">
                                <Briefcase className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-4.5 h-4.5 group-focus-within:text-blue-500 transition-colors" />
                                <select
                                    value={selectedJob}
                                    onChange={(e) => setSelectedJob(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer font-medium text-slate-700 dark:text-slate-200"
                                >
                                    <option value="all">{language === 'zh' ? '查看全部职位' : 'All Jobs'}</option>
                                    {uniqueJobs.map(job => (
                                        <option key={job} value={job}>{job}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-4.5 h-4.5 pointer-events-none" />
                            </div>
                        </div>

                        {/* 学校筛选 */}
                        <div className="space-y-2">
                            <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">{language === 'zh' ? '毕业院校搜索' : 'School Search'}</label>
                            <div className="relative group">
                                <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-4.5 h-4.5 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    type="text"
                                    value={filterSchool}
                                    onChange={(e) => setFilterSchool(e.target.value)}
                                    placeholder={language === 'zh' ? '输入关键词如：北京大学' : 'e.g. Peking University'}
                                    className="w-full pl-11 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium text-slate-700 dark:text-slate-200"
                                />
                            </div>
                        </div>

                        {/* 经验筛选 */}
                        <div className="space-y-2">
                            <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">{language === 'zh' ? '职场工作年限' : 'Experience Years'}</label>
                            <div className="relative group">
                                <Clock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-4.5 h-4.5 group-focus-within:text-blue-500 transition-colors" />
                                <select
                                    value={filterExperience}
                                    onChange={(e) => setFilterExperience(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer font-medium text-slate-700 dark:text-slate-200"
                                >
                                    <option value="all">{language === 'zh' ? '不限经验年限' : 'Any Experience'}</option>
                                    <option value="0-1">{language === 'zh' ? '1年以下经验' : '< 1 Year'}</option>
                                    <option value="1-3">{language === 'zh' ? '1-3年职场经验' : '1-3 Years'}</option>
                                    <option value="3-5">{language === 'zh' ? '3-5年成熟经验' : '3-5 Years'}</option>
                                    <option value="5-10">{language === 'zh' ? '5-10年资深经验' : '5-10 Years'}</option>
                                    <option value="10+">{language === 'zh' ? '10年以上专家' : '10+ Years'}</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-4.5 h-4.5 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 候选人数据表格 */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px]">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700/50">
                                <th className="text-left py-4 px-6 font-black text-slate-400 dark:text-slate-500 text-xs uppercase tracking-widest">{t.recruiter.talentPool}</th>
                                <th className="text-left py-4 px-6 font-black text-slate-400 dark:text-slate-500 text-xs uppercase tracking-widest hidden sm:table-cell">{t.recruiter.applicantsUnit}</th>
                                <th className="text-left py-4 px-6 font-black text-slate-400 dark:text-slate-500 text-xs uppercase tracking-widest hidden lg:table-cell">{t.recruiter.skills}</th>
                                <th className="text-left py-4 px-6 font-black text-slate-400 dark:text-slate-500 text-xs uppercase tracking-widest">{t.recruiter.resumeInfo}</th>
                                <th className="text-left py-4 px-6 font-black text-slate-400 dark:text-slate-500 text-xs uppercase tracking-widest hidden md:table-cell">{t.recruiter.matching}</th>
                                <th className="text-left py-4 px-6 font-black text-slate-400 dark:text-slate-500 text-xs uppercase tracking-widest hidden lg:table-cell">{t.recruiter.appliedAt}</th>
                                <th className="text-left py-4 px-6 font-black text-slate-400 dark:text-slate-500 text-xs uppercase tracking-widest hidden xl:table-cell">{t.recruiter.recentActivities}</th>
                                <th className="text-right py-4 px-6 font-black text-slate-400 dark:text-slate-500 text-xs uppercase tracking-widest">{t.recruiter.actions || (language === 'zh' ? '管理操作' : 'Actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {filteredCandidates.length > 0 ? (
                                filteredCandidates.map(candidate => {
                                    return (
                                        <tr key={candidate.id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-all duration-300">
                                            <td className="py-5 px-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="relative">
                                                        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm transition-transform group-hover:scale-105">
                                                            {candidate.avatar ? (
                                                                <img src={candidate.avatar} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black text-lg">
                                                                    {candidate.candidateName ? candidate.candidateName.charAt(0).toUpperCase() : '?'}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-100 dark:border-slate-700 flex items-center justify-center">
                                                            <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900 dark:text-slate-100">{candidate.candidateName}</div>
                                                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-[120px]">{candidate.currentPosition || t.recruiter.lookingForOpportunity}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-5 px-6 hidden sm:table-cell">
                                                <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">{candidate.jobTitle}</div>
                                                <div className="text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded inline-block mt-1">
                                                    {candidate.companyName}
                                                </div>
                                            </td>
                                            <td className="py-5 px-6 hidden lg:table-cell">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {candidate.skills && candidate.skills.length > 0 ? (
                                                        candidate.skills.slice(0, 2).map((skill, index) => (
                                                            <span key={index} className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-black rounded-lg border border-blue-100 dark:border-blue-800/50">
                                                                {skill}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-xs text-slate-400">-</span>
                                                    )}
                                                    {candidate.skills && candidate.skills.length > 2 && (
                                                        <span className="text-[10px] text-slate-400 font-bold ml-0.5">+{candidate.skills.length - 2}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-5 px-6">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm whitespace-nowrap">{candidate.experience || t.recruiter.fresher}</span>
                                                    <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
                                                        {translateDegree(candidate.education || (language === 'zh' ? '学历' : 'Degree'))} · {candidate.school || (language === 'zh' ? '校招' : 'Campus')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-5 px-6 hidden md:table-cell">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-16 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-1000 ${(candidate.matchScore || 0) > 80 ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
                                                                (candidate.matchScore || 0) > 60 ? 'bg-gradient-to-r from-indigo-400 to-indigo-600' : 'bg-slate-400'
                                                                }`}
                                                            style={{ width: `${candidate.matchScore || 0}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-black text-slate-600 dark:text-slate-400">{(candidate.matchScore || 0).toFixed(0)}%</span>
                                                </div>
                                            </td>

                                            <td className="py-5 px-6 hidden lg:table-cell">
                                                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{candidate.appliedDate}</div>
                                            </td>
                                            <td className="py-5 px-6 hidden xl:table-cell">
                                                {candidate.latestInterviewTime ? (
                                                    <div className="flex items-start gap-2.5">
                                                        <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                                            <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <div className="text-[11px] font-black text-slate-800 dark:text-slate-200">{candidate.latestInterviewTime.split(' ')[0]}</div>
                                                            <div className="text-[10px] font-bold mt-0.5 flex items-center">
                                                                <span className={
                                                                    candidate.latestInterviewStatus === 'accepted' ? 'text-green-600 dark:text-green-400' :
                                                                        candidate.latestInterviewStatus === 'rejected' ? 'text-rose-600 dark:text-rose-400' : 'text-amber-500'
                                                                }>
                                                                    {translateInterviewStatus(candidate.latestInterviewStatus || 'pending')}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-[11px] text-slate-400 flex items-center gap-2 font-medium">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        <span>{t.recruiter.tbd}</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-5 px-6 text-right">
                                                <div className="flex items-center justify-end gap-2 text-xs font-bold">
                                                    <button
                                                        className="px-2.5 py-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                                                        onClick={() => onViewDetails && onViewDetails(candidate)}
                                                    >
                                                        {t.recruiter.showDetails}
                                                    </button>
                                                    <button
                                                        className="px-2.5 py-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all"
                                                        onClick={() => {
                                                            setSelectedCandidate(candidate);
                                                            setInterviewForm(prev => ({
                                                                ...prev,
                                                                applicationId: candidate.id,
                                                                location: candidate.companyName || '',
                                                                interviewTopic: language === 'zh' ? `${candidate.jobTitle}初试` : `${candidate.jobTitle} 1st Interview`,
                                                            }));
                                                            setIsInterviewModalOpen(true);
                                                        }}
                                                    >
                                                        {t.recruiter.interview}
                                                    </button>
                                                    <button
                                                        className="px-2.5 py-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-all"
                                                        onClick={() => {
                                                            setSelectedCandidate(candidate);
                                                            setIsOnboardingModalOpen(true);
                                                        }}
                                                    >
                                                        {t.recruiter.onboard}
                                                    </button>
                                                    <button
                                                        className="px-2.5 py-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"
                                                        onClick={() => onSendMessage && onSendMessage(candidate)}
                                                    >
                                                        {t.recruiter.messageCandidate}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={8} className="text-center py-8">
                                        <div className="flex flex-col items-center gap-3">
                                            <Users className="w-12 h-12 text-gray-300" />
                                            <p className="text-gray-500">{t.recruiter.noCandidatesData}</p>
                                            <p className="text-sm text-gray-400">{t.recruiter.candidatesDataHint}</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <OnboardingModal
                open={isOnboardingModalOpen}
                onCancel={() => {
                    setIsOnboardingModalOpen(false);
                    setSelectedCandidate(null);
                }}
                onSuccess={() => {
                    setIsOnboardingModalOpen(false);
                    // Optionally refresh candidate list or show success message, handled in modal
                    setSelectedCandidate(null);
                }}
                candidateName={selectedCandidate?.candidateName}
                recruiterId={currentUserId}
                initialValues={selectedCandidate ? {
                    candidateId: selectedCandidate.candidateId || selectedCandidate.id, // Ensure we use the correct candidate ID
                    jobId: selectedCandidate.jobId,
                    // Pre-fill other fields if available
                } : undefined}
            />

            {/* 面试邀请模态框 */}
            {isInterviewModalOpen && selectedCandidate && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex justify-center items-center p-4 overflow-y-auto">
                    <div
                        className="bg-white dark:bg-slate-800 rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all duration-500 animate-in fade-in zoom-in-95"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-8 border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm text-blue-600">
                                    <Calendar className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                                        {language === 'zh' ? `面试邀请：${selectedCandidate.candidateName}` : `Interview Invite: ${selectedCandidate.candidateName}`}
                                    </h3>
                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">{language === 'zh' ? '面试邀请调度程序' : 'Interview Invitation Scheduling'}</p>
                                </div>
                            </div>
                            <button
                                onClick={closeInterviewModal}
                                className="p-3 rounded-2xl text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-900/20 transition-all active:scale-95"
                            >
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto max-h-[calc(90vh-120px)]">
                            <form className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* 申请ID - 隐藏字段 */}
                                    <input
                                        type="hidden"
                                        name="applicationId"
                                        value={interviewForm.applicationId}
                                    />

                                    {/* 候选人姓名 - 只读显示 */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">{language === 'zh' ? '候选人姓名' : 'Candidate Name'}</label>
                                        <div className="px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 font-bold">
                                            {selectedCandidate.candidateName}
                                        </div>
                                    </div>

                                    {/* 面试岗位 - 只读显示 */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">{language === 'zh' ? '预约面试职位' : 'Applied Job'}</label>
                                        <div className="px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 font-bold">
                                            {selectedCandidate.jobTitle}
                                        </div>
                                    </div>

                                    {/* 面试日期 */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">{language === 'zh' ? '面试日期 *' : 'Interview Date *'}</label>
                                        <div className="relative group">
                                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                                            <input
                                                type="date"
                                                name="interviewDate"
                                                value={interviewForm.interviewDate}
                                                onChange={handleFormChange}
                                                className="w-full pl-11 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all dark:bg-slate-900 dark:text-slate-200 font-bold"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* 面试时间 */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">{language === 'zh' ? '面试具体时间 *' : 'Specific Time *'}</label>
                                        <div className="relative group">
                                            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                                            <input
                                                type="time"
                                                name="interviewTime"
                                                value={interviewForm.interviewTime}
                                                onChange={handleFormChange}
                                                className="w-full pl-11 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all dark:bg-slate-900 dark:text-slate-200 font-bold"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* 面试类型 */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">{language === 'zh' ? '面试形式 *' : 'Interview Type *'}</label>
                                        <div className="relative group">
                                            <select
                                                name="interviewType"
                                                value={interviewForm.interviewType}
                                                onChange={handleFormChange}
                                                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer font-bold text-slate-700 dark:text-slate-200"
                                                required
                                            >
                                                <option value="电话">{language === 'zh' ? '电话面试 (Phone)' : 'Phone Interview'}</option>
                                                <option value="视频">{language === 'zh' ? '视频面试 (Remote Video)' : 'Video Interview'}</option>
                                                <option value="现场">{language === 'zh' ? '现场面试 (On-site)' : 'On-site Interview'}</option>
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>

                                    {/* 面试轮次 */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">{language === 'zh' ? '当前面试轮次' : 'Round Number'}</label>
                                        <input
                                            type="number"
                                            name="interviewRound"
                                            value={interviewForm.interviewRound}
                                            onChange={handleFormChange}
                                            min="1"
                                            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all dark:bg-slate-900 dark:text-slate-200 font-bold"
                                        />
                                    </div>

                                    {/* 面试时长 */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">{language === 'zh' ? '预计面试时长 (分钟)' : 'Duration (Mins)'}</label>
                                        <input
                                            type="number"
                                            name="interviewDuration"
                                            value={interviewForm.interviewDuration}
                                            onChange={handleFormChange}
                                            min="15"
                                            max="180"
                                            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all dark:bg-slate-900 dark:text-slate-200 font-bold"
                                        />
                                    </div>

                                    {/* 时区选择 */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">所选时区</label>
                                        <div className="relative group">
                                            <select
                                                name="timeZone"
                                                value={interviewForm.timeZone}
                                                onChange={handleFormChange}
                                                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer font-bold text-slate-700 dark:text-slate-200"
                                            >
                                                <option value="Asia/Shanghai">标准时区 (上海/北京)</option>
                                                <option value="Asia/Hong_Kong">中国香港 (HKT)</option>
                                                <option value="Asia/Tokyo">日本东京 (JST)</option>
                                                <option value="America/New_York">美洲/纽约 (EST)</option>
                                                <option value="Europe/London">欧洲/伦敦 (GMT)</option>
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>

                                    {/* 面试官信息 */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">{language === 'zh' ? '面试官姓名' : 'Interviewer Name'}</label>
                                        <input
                                            type="text"
                                            name="interviewerName"
                                            value={interviewForm.interviewerName}
                                            onChange={handleFormChange}
                                            placeholder={language === 'zh' ? '输入面试官姓名' : 'Enter interviewer name'}
                                            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all dark:bg-slate-900 dark:text-slate-200 font-bold"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">{language === 'zh' ? '面试官职位' : 'Interviewer Position'}</label>
                                        <input
                                            type="text"
                                            name="interviewerPosition"
                                            value={interviewForm.interviewerPosition}
                                            onChange={handleFormChange}
                                            placeholder={language === 'zh' ? '如：前端专家 / 招聘经理' : 'e.g. Frontend Expert'}
                                            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all dark:bg-slate-900 dark:text-slate-200 font-bold"
                                        />
                                    </div>

                                    {/* 面试地点/会议链接 */}
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">{language === 'zh' ? '面试地点 / 会议链接' : 'Location / Meeting Link'}</label>
                                        <input
                                            type="text"
                                            name="location"
                                            value={interviewForm.location}
                                            onChange={handleFormChange}
                                            placeholder={language === 'zh' ? '输入详细地址或视频会议URL' : 'Enter address or video URL'}
                                            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all dark:bg-slate-900 dark:text-slate-200 font-bold"
                                        />
                                    </div>

                                    {/* 面试主题 */}
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">面试主题说明</label>
                                        <input
                                            type="text"
                                            name="interviewTopic"
                                            value={interviewForm.interviewTopic}
                                            onChange={handleFormChange}
                                            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all dark:bg-slate-900 dark:text-slate-200 font-bold"
                                            placeholder="例如：高级开发工程师岗位复试"
                                        />
                                    </div>

                                    {/* 邀请备注 */}
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">{language === 'zh' ? '面试邀请补充备注' : 'Additional Notes'}</label>
                                        <textarea
                                            name="invitationMessage"
                                            value={interviewForm.invitationMessage}
                                            onChange={handleFormChange}
                                            rows={3}
                                            placeholder={language === 'zh' ? '提醒候选人准备的事项，或面试相关要求...' : 'Remind candidates what to prepare...'}
                                            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all dark:bg-slate-900 dark:text-slate-200 font-bold resize-none"
                                        ></textarea>
                                    </div>

                                    {/* 邀请有效期 */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">{language === 'zh' ? '邀请反馈截止日期' : 'Invitation Deadline'}</label>
                                        <input
                                            type="datetime-local"
                                            name="invitationExpiresAt"
                                            value={interviewForm.invitationExpiresAt}
                                            onChange={handleFormChange}
                                            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all dark:bg-slate-900 dark:text-slate-200 font-bold"
                                        />
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="p-8 border-t border-slate-100 dark:border-slate-700/50 flex justify-end gap-4 bg-slate-50/50 dark:bg-slate-900/50">
                            <button
                                type="button"
                                onClick={closeInterviewModal}
                                className="px-8 py-3.5 text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest text-xs hover:bg-slate-100 dark:hover:bg-slate-900/50 rounded-2xl transition-all"
                            >
                                {language === 'zh' ? '取消' : 'Cancel'}
                            </button>
                            <button
                                type="button"
                                onClick={handleCreateInterview}
                                disabled={formLoading}
                                className={`px-10 py-3.5 bg-blue-600 dark:bg-blue-500 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-blue-200/50 dark:shadow-blue-900/10 hover:bg-blue-700 dark:hover:bg-blue-600 transition-all flex items-center gap-2 group active:scale-95 ${formLoading ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                            >
                                {formLoading ? (
                                    language === 'zh' ? '发送中...' : 'Sending...'
                                ) : (
                                    <>
                                        {language === 'zh' ? '确认并发送邀请' : 'Confirm & Send Invite'}
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};