import React, { useState, useEffect } from 'react';
import {
    Users, Search, Filter, ChevronDown, CheckCircle, Clock, Calendar,
    User, Briefcase, MapPin, FileText, ArrowRight, XCircle
} from 'lucide-react';

import { interviewAPI } from '@/services/apiService';

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
    jobId: number;
    jobTitle: string;
    companyName: string;
    stage: string;
    appliedDate: string;
    matchScore?: number;
    skills?: string[];
    experience?: string;
    education?: string;
    interviews?: Interview[];
}

interface CandidatesViewProps {
    candidates: Candidate[];
}

export const CandidatesView: React.FC<CandidatesViewProps> = ({ candidates }) => {
    const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>(candidates);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStage, setSelectedStage] = useState<string>('all');
    const [selectedJob, setSelectedJob] = useState<string>('all');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [loading, setLoading] = useState(false);

    // Extract unique job titles from candidates
    const uniqueJobs = Array.from(new Set(candidates.map(c => c.jobTitle)));

    // Extract unique stages from candidates
    const uniqueStages = Array.from(new Set(candidates.map(c => c.stage)));

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

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">候选人管理</h1>
                    <p className="text-sm text-gray-500">管理所有职位的候选人申请和面试流程</p>
                </div>
                <div className="text-sm text-gray-500 flex items-center bg-white px-3 py-1.5 rounded-lg shadow-sm border border-gray-200">
                    <Users className="w-4 h-4 mr-2 text-emerald-500" />
                    共 {filteredCandidates.length} 名候选人
                </div>
            </div>

            {/* Search and Filter */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search Bar */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="搜索候选人或职位名称"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                        />
                    </div>

                    {/* Filter Button */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                        >
                            <Filter className="w-4 h-4" />
                            筛选
                            {isFilterOpen && <ChevronDown className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {/* Filter Panel */}
                {isFilterOpen && (
                    <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">申请阶段</label>
                            <select
                                value={selectedStage}
                                onChange={(e) => setSelectedStage(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                            >
                                <option value="all">全部阶段</option>
                                {uniqueStages.map(stage => (
                                    <option key={stage} value={stage}>{stage}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">职位</label>
                            <select
                                value={selectedJob}
                                onChange={(e) => setSelectedJob(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                            >
                                <option value="all">全部职位</option>
                                {uniqueJobs.map(job => (
                                    <option key={job} value={job}>{job}</option>
                                ))}
                            </select>
                        </div>

                        <div className="md:col-span-2 flex justify-end">
                            <button
                                onClick={handleResetFilters}
                                className="px-4 py-2.5 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                            >
                                重置筛选
                            </button>
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
                                <th className="text-left py-3 px-4 font-semibold text-gray-700 hidden md:table-cell">匹配度</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700">申请阶段</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700 hidden lg:table-cell">申请日期</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700 hidden xl:table-cell">最近面试</th>
                                <th className="text-right py-3 px-4 font-semibold text-gray-700">操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCandidates.length > 0 ? (
                                filteredCandidates.map(candidate => {
                                    // Find the latest interview for this candidate
                                    const latestInterview = candidate.interviews?.sort((a, b) => {
                                        const dateA = new Date(`${a.interviewDate} ${a.interviewTime}`);
                                        const dateB = new Date(`${b.interviewDate} ${b.interviewTime}`);
                                        return dateB.getTime() - dateA.getTime();
                                    })[0];

                                    return (
                                        <tr key={candidate.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-semibold">
                                                        {candidate.candidateName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-900">{candidate.candidateName}</div>
                                                        <div className="text-xs text-gray-500">ID: {candidate.candidateId}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 hidden sm:table-cell">
                                                <div className="font-medium text-gray-900">{candidate.jobTitle}</div>
                                                <div className="text-xs text-gray-500">{candidate.companyName}</div>
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
                                            <td className="py-3 px-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStageColor(candidate.stage)}`}>
                                                    {candidate.stage}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 hidden lg:table-cell">
                                                <div className="text-sm text-gray-600">{candidate.appliedDate}</div>
                                            </td>
                                            <td className="py-3 px-4 hidden xl:table-cell">
                                                {latestInterview ? (
                                                    <div className="flex items-start gap-2">
                                                        <Calendar className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                                        <div>
                                                            <div className="text-sm text-gray-700">{latestInterview.interviewDate}</div>
                                                            <div className="text-xs text-gray-500">
                                                                {latestInterview.interviewTime} · {latestInterview.interviewType}
                                                            </div>
                                                            <div className="text-xs mt-0.5">
                                                                <span className={`px-2 py-0.5 rounded-full ${latestInterview.status === 'scheduled' ? 'bg-blue-100 text-blue-700' : latestInterview.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                                                    {latestInterview.status}
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
                                                >
                                                    查看详情
                                                </button>
                                                <button
                                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                >
                                                    发送消息
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={7} className="text-center py-8">
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
        </div>
    );
};