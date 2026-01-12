import React, { useState, useEffect } from 'react';
import {
    Users, Search, Filter, ChevronDown, CheckCircle, Clock, Calendar,
    User, Briefcase, MapPin, FileText, ArrowRight, XCircle
} from 'lucide-react';
import { message } from 'antd';

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

import { RefreshCw } from 'lucide-react';

interface CandidatesViewProps {
    candidates: Candidate[];
    currentUserId: number;
    onSendMessage?: (candidate: Candidate) => void;
    onViewDetails?: (candidate: Candidate) => void;
    onRefresh?: () => void;
}

export const CandidatesView: React.FC<CandidatesViewProps> = ({ candidates, currentUserId, onSendMessage, onViewDetails, onRefresh }) => {
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
        { key: 'all', label: '全部' },
        { key: 'New', label: '新申请' },
        { key: 'Interview', label: '面试中' },
        { key: 'Offer', label: '已录用' },
        { key: 'Rejected', label: '已淘汰' }
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
                const response = await interviewAPI.getAllInterviews();
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
                // Find the interview that matches the candidate
                // Note: We need to adjust this logic based on how interviews are associated with candidates
                // For now, we'll just return all interviews, but this should be fixed to match the actual data model
                return true;
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
                return 'bg-blue-100 text-blue-700';
            case 'Screening':
                return 'bg-purple-100 text-purple-700';
            case 'Interview':
                return 'bg-amber-100 text-amber-700';
            case 'Offer':
                return 'bg-green-100 text-green-700';
            case 'Rejected':
                return 'bg-red-100 text-red-700';
            case 'Hired':
                return 'bg-emerald-100 text-emerald-700';
            default:
                return 'bg-gray-100 text-gray-700';
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
                message.error('请填写必填字段');
                return;
            }

            const response = await interviewAPI.createInterview({
                ...interviewForm,
                interviewerId: currentUserId
            });

            if ((response as any).status === 'success') {
                message.success('面试邀请创建成功');
                // 重新获取面试列表
                const fetchResponse = await interviewAPI.getAllInterviews();
                if ((fetchResponse as any).status === 'success') {
                    setInterviews((fetchResponse as any).data || []);
                }
                closeInterviewModal();
            }
        } catch (error) {
            console.error('创建面试失败:', error);
            message.error('创建面试邀请失败，请重试');
        } finally {
            setFormLoading(false);
        }
    };

    // Helper to translate degree
    const translateDegree = (degree: string) => {
        const map: Record<string, string> = {
            'Master': '硕士',
            'Bachelor': '本科',
            'PhD': '博士',
            'Associate': '大专',
            'High School': '高中'
        };
        return map[degree] || degree;
    };

    // Helper to translate interview status
    const translateInterviewStatus = (status: string) => {
        const map: Record<string, string> = {
            'pending': '待确认',
            'accepted': '已接受',
            'rejected': '已拒绝',
            'completed': '已完成',
            'cancelled': '已取消'
        };
        return map[status] || status;
    };

    return (
        <div className="space-y-4 p-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-2 mb-1">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">候选人管理</h1>
                    <p className="text-sm text-gray-500">管理所有职位的候选人申请和面试流程</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onRefresh}
                        className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="刷新列表"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <div className="text-sm text-gray-500 flex items-center bg-white px-3 py-1.5 rounded-lg shadow-sm border border-gray-200">
                        <Users className="w-4 h-4 mr-2 text-emerald-500" />
                        共 {filteredCandidates.length} 名候选人
                    </div>
                </div>
            </div>

            {/* 状态标签栏 - 快速筛选 */}
            <div className="flex flex-wrap gap-2 mb-2 border-b border-gray-100 pb-1">
                {tabList.map(tab => {
                    const count = getTabCount(tab.key);
                    const isActive = selectedStage === tab.key;

                    return (
                        <button
                            key={tab.key}
                            onClick={() => setSelectedStage(tab.key)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all relative ${isActive
                                ? 'text-emerald-700 bg-emerald-50'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                                }`}
                        >
                            {tab.label}
                            <span className={`px-1.5 py-0.5 rounded-full text-xs ${isActive ? 'bg-emerald-200 text-emerald-800' : 'bg-gray-100 text-gray-400'
                                }`}>
                                {count}
                            </span>
                            {isActive && (
                                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500 rounded-full transform translate-y-1"></span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* 搜索和高级筛选区 */}
            <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 transition-all hover:shadow-md">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* 搜索框 */}
                    <div className="flex-1 relative group">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-emerald-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="搜索候选人姓名、职位..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none transition-all"
                        />
                    </div>

                    {/* 筛选按钮组 */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg transition-all text-sm font-medium ${isFilterOpen || selectedJob !== 'all' || filterSchool || filterExperience !== 'all'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <Filter className="w-4 h-4" />
                            高级筛选
                            {(selectedJob !== 'all' || filterSchool || filterExperience !== 'all') && (
                                <span className="w-2 h-2 rounded-full bg-emerald-500 ml-1"></span>
                            )}
                            <ChevronDown className={`w-4 h-4 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {(searchTerm || selectedStage !== 'all' || selectedJob !== 'all' || filterSchool || filterExperience !== 'all') && (
                            <button
                                onClick={handleResetFilters}
                                className="px-4 py-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                            >
                                重置
                            </button>
                        )}
                    </div>
                </div>

                {/* 展开的筛选面板 */}
                {isFilterOpen && (
                    <div className="mt-5 pt-5 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-5 animate-in fade-in slide-in-from-top-2">
                        {/* 职位筛选 */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">申请职位</label>
                            <div className="relative">
                                <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <select
                                    value={selectedJob}
                                    onChange={(e) => setSelectedJob(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none transition-all appearance-none cursor-pointer"
                                >
                                    <option value="all">全部职位</option>
                                    {uniqueJobs.map(job => (
                                        <option key={job} value={job}>{job}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                            </div>
                        </div>

                        {/* 学校筛选 */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">毕业院校</label>
                            <div className="relative group">
                                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-emerald-500" />
                                <input
                                    type="text"
                                    value={filterSchool}
                                    onChange={(e) => setFilterSchool(e.target.value)}
                                    placeholder="输入学校名称..."
                                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* 经验筛选 */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">工作经验</label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <select
                                    value={filterExperience}
                                    onChange={(e) => setFilterExperience(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none transition-all appearance-none cursor-pointer"
                                >
                                    <option value="all">经验不限</option>
                                    <option value="0-1">1年以下</option>
                                    <option value="1-3">1-3年</option>
                                    <option value="3-5">3-5年</option>
                                    <option value="5-10">5-10年</option>
                                    <option value="10+">10年以上</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Candidates Table */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] text-sm">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left py-3 px-4 font-semibold text-gray-700">候选人</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700 hidden sm:table-cell">申请职位</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700 hidden lg:table-cell">技能</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700">经验/学历</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700 hidden md:table-cell">匹配度</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700 hidden lg:table-cell">申请日期</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700 hidden xl:table-cell">最近面试</th>
                                <th className="text-right py-3 px-4 font-semibold text-gray-700">操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCandidates.length > 0 ? (
                                filteredCandidates.map(candidate => {
                                    return (
                                        <tr key={candidate.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                        {candidate.avatar ? (
                                                            <img src={candidate.avatar} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-emerald-100 text-emerald-600 font-bold">
                                                                {candidate.candidateName ? candidate.candidateName.charAt(0).toUpperCase() : '?'}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-900">{candidate.candidateName}</div>
                                                        <div className="text-xs text-gray-500">{candidate.currentPosition || '暂无职位'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 hidden sm:table-cell">
                                                <div className="font-medium text-gray-900">{candidate.jobTitle}</div>
                                            </td>
                                            <td className="py-3 px-4 hidden lg:table-cell">
                                                <div className="flex flex-wrap gap-1">
                                                    {candidate.skills && candidate.skills.length > 0 ? (
                                                        candidate.skills.slice(0, 2).map((skill, index) => (
                                                            <span key={index} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded border border-gray-200">
                                                                {skill}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-xs text-gray-400">-</span>
                                                    )}
                                                    {candidate.skills && candidate.skills.length > 2 && (
                                                        <span className="text-xs text-gray-400">+{candidate.skills.length - 2}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-gray-900">{candidate.experience || '经验不限'}</span>
                                                    <span className="text-xs text-gray-500">
                                                        {translateDegree(candidate.education || '学历不限')}
                                                        {candidate.school && ` · ${candidate.school}`}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 hidden md:table-cell">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-12 h-6 bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                                                            style={{ width: `${candidate.matchScore || 0}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-700">{candidate.matchScore || 0}%</span>
                                                </div>
                                            </td>

                                            <td className="py-3 px-4 hidden lg:table-cell">
                                                <div className="text-sm text-gray-600">{candidate.appliedDate}</div>
                                            </td>
                                            <td className="py-3 px-4 hidden xl:table-cell">
                                                {candidate.latestInterviewTime ? (
                                                    <div className="flex items-start gap-2">
                                                        <Calendar className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                                        <div className="flex flex-col">
                                                            <div className="text-sm font-medium text-gray-900">{candidate.latestInterviewTime.split(' ')[0]}</div>
                                                            <div className="text-xs text-gray-500">
                                                                {candidate.latestInterviewTime.split(' ')[1] || ''} · <span className={
                                                                    candidate.latestInterviewStatus === 'accepted' ? 'text-emerald-600' :
                                                                        candidate.latestInterviewStatus === 'rejected' ? 'text-red-500' : 'text-amber-500'
                                                                }>
                                                                    {translateInterviewStatus(candidate.latestInterviewStatus || 'pending')}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-sm text-gray-500 flex items-center gap-2">
                                                        <Clock className="w-4 h-4" />
                                                        <span>暂无面试安排</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <button
                                                    className="text-emerald-600 hover:text-emerald-800 mr-3 text-sm font-medium"
                                                    onClick={() => onViewDetails && onViewDetails(candidate)}
                                                >
                                                    查看详情
                                                </button>
                                                <button
                                                    className="text-purple-600 hover:text-purple-800 mr-3 text-sm font-medium"
                                                    onClick={() => {
                                                        setSelectedCandidate(candidate);
                                                        setInterviewForm(prev => ({
                                                            ...prev,
                                                            applicationId: candidate.id, // 假设候选人ID就是申请ID，实际项目中可能需要调整
                                                            // 自动填充字段
                                                            location: candidate.companyName || '', // 面试地点自动使用公司名称或位置
                                                            interviewTopic: `${candidate.jobTitle}面试`, // 面试主题自动使用职位名称
                                                            // 面试岗位信息已包含在候选人数据中
                                                        }));
                                                        setIsInterviewModalOpen(true);
                                                    }}
                                                >
                                                    发起面试
                                                </button>
                                                <button
                                                    className="text-emerald-600 hover:text-emerald-800 mr-3 text-sm font-medium"
                                                    onClick={() => {
                                                        setSelectedCandidate(candidate);
                                                        setIsOnboardingModalOpen(true);
                                                    }}
                                                >
                                                    安排入职
                                                </button>
                                                <button
                                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                    onClick={() => onSendMessage && onSendMessage(candidate)}
                                                >
                                                    发送消息
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={8} className="text-center py-8">
                                        <div className="flex flex-col items-center gap-3">
                                            <Users className="w-12 h-12 text-gray-300" />
                                            <p className="text-gray-500">暂无候选人数据</p>
                                            <p className="text-sm text-gray-400">当候选人申请您的职位时，这里将显示相关信息</p>
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
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden transform transition-all duration-300 animate-in fade-in zoom-in-95"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-5 border-b flex justify-between items-center bg-emerald-50/50">
                            <h3 className="text-xl font-bold text-gray-800 flex items-center">
                                <Calendar className="w-5 h-5 mr-2 text-emerald-600" />
                                安排面试邀请 - {selectedCandidate.candidateName}
                            </h3>
                            <button
                                onClick={closeInterviewModal}
                                className="p-2 rounded-full text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                            >
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
                            <form className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {/* 申请ID - 隐藏字段 */}
                                    <input
                                        type="hidden"
                                        name="applicationId"
                                        value={interviewForm.applicationId}
                                    />

                                    {/* 候选人姓名 - 只读显示 */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">候选人姓名</label>
                                        <input
                                            type="text"
                                            value={selectedCandidate.candidateName}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
                                            disabled
                                        />
                                    </div>

                                    {/* 面试岗位 - 只读显示 */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">面试岗位</label>
                                        <input
                                            type="text"
                                            value={selectedCandidate.jobTitle}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
                                            disabled
                                        />
                                    </div>

                                    {/* 面试日期 */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">面试日期 *</label>
                                        <input
                                            type="date"
                                            name="interviewDate"
                                            value={interviewForm.interviewDate}
                                            onChange={handleFormChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                            required
                                        />
                                    </div>

                                    {/* 面试时间 */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">面试时间 *</label>
                                        <input
                                            type="time"
                                            name="interviewTime"
                                            value={interviewForm.interviewTime}
                                            onChange={handleFormChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                            required
                                        />
                                    </div>

                                    {/* 面试类型 */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">面试类型 *</label>
                                        <select
                                            name="interviewType"
                                            value={interviewForm.interviewType}
                                            onChange={handleFormChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                            required
                                        >
                                            <option value="电话">电话</option>
                                            <option value="视频">视频</option>
                                            <option value="现场">现场</option>
                                        </select>
                                    </div>

                                    {/* 面试轮次 */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">面试轮次</label>
                                        <input
                                            type="number"
                                            name="interviewRound"
                                            value={interviewForm.interviewRound}
                                            onChange={handleFormChange}
                                            min="1"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        />
                                    </div>

                                    {/* 面试时长 */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">面试时长 (分钟)</label>
                                        <input
                                            type="number"
                                            name="interviewDuration"
                                            value={interviewForm.interviewDuration}
                                            onChange={handleFormChange}
                                            min="15"
                                            max="180"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        />
                                    </div>

                                    {/* 时区选择 - 保持默认值，用户可修改 */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">时区</label>
                                        <select
                                            name="timeZone"
                                            value={interviewForm.timeZone}
                                            onChange={handleFormChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        >
                                            <option value="Asia/Shanghai">亚洲/上海</option>
                                            <option value="Asia/Beijing">亚洲/北京</option>
                                            <option value="Asia/Hong_Kong">亚洲/香港</option>
                                            <option value="Asia/Tokyo">亚洲/东京</option>
                                            <option value="Asia/Seoul">亚洲/首尔</option>
                                            <option value="Europe/London">欧洲/伦敦</option>
                                            <option value="Europe/Paris">欧洲/巴黎</option>
                                            <option value="America/New_York">美洲/纽约</option>
                                            <option value="America/Los_Angeles">美洲/洛杉矶</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">面试官姓名</label>
                                        <input
                                            type="text"
                                            name="interviewerName"
                                            value={interviewForm.interviewerName}
                                            onChange={handleFormChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">面试官职位</label>
                                        <input
                                            type="text"
                                            name="interviewerPosition"
                                            value={interviewForm.interviewerPosition}
                                            onChange={handleFormChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">面试地点</label>
                                        <input
                                            type="text"
                                            name="location"
                                            value={interviewForm.location}
                                            onChange={handleFormChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                            placeholder="默认使用公司地址"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">面试主题</label>
                                        <input
                                            type="text"
                                            name="interviewTopic"
                                            value={interviewForm.interviewTopic}
                                            onChange={handleFormChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                            placeholder="例如：高级前端工程师初试"
                                        />
                                    </div>

                                    {/* 邀请消息 - 核心字段 */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">邀请详情信息/备注</label>
                                        <textarea
                                            name="invitationMessage"
                                            value={interviewForm.invitationMessage}
                                            onChange={handleFormChange}
                                            rows={4}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                            placeholder="在邀请中添加更多详细信息..."
                                        ></textarea>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={closeInterviewModal}
                                        className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                                    >
                                        取消
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleCreateInterview}
                                        disabled={formLoading}
                                        className={`px-6 py-2.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-medium transition-colors shadow-sm flex items-center ${formLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        {formLoading && (
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        )}
                                        {formLoading ? '创建中...' : '发送面试邀请'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};