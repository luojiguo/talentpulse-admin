import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, MessageSquare, Bookmark, ChevronUp, ChevronDown, MapPin, Briefcase, Clock, Building, Search, Filter, GraduationCap, Monitor, TrendingUp, Flame } from 'lucide-react';
import { JobPosting } from '@/types/types';
import { jobAPI, companyAPI, recruiterAPI, candidateAPI } from '@/services/apiService';
import { message } from 'antd';

interface JobDetailScreenProps {
    jobs: JobPosting[];
    onBack: () => void;
    collectedJobs: any[];
    setCollectedJobs: any;
    onChat: (jobId: number, recruiterId: number) => void;
    currentUser?: { id: number | string };
}

const JobDetailScreen: React.FC<JobDetailScreenProps> = ({ jobs, onBack, collectedJobs, setCollectedJobs, onChat, currentUser }) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [job, setJob] = useState<JobPosting | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [recruiter, setRecruiter] = useState<any>(null);
    const [company, setCompany] = useState<any>(null);
    const [isSaved, setIsSaved] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);

    // Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [locationFilter, setLocationFilter] = useState('');
    const [experienceFilter, setExperienceFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [degreeFilter, setDegreeFilter] = useState('');
    const [workModeFilter, setWorkModeFilter] = useState('');
    const [jobLevelFilter, setJobLevelFilter] = useState('');

    // 公司信息展开/折叠状态
    const [isCompanyInfoExpanded, setIsCompanyInfoExpanded] = useState(true);

    // Extract unique values for filters
    const locations = useMemo(() => [...new Set(jobs.map(j => j.location).filter(Boolean))], [jobs]);
    const experiences = useMemo(() => [...new Set(jobs.map(j => j.experience).filter(Boolean))], [jobs]);
    const types = useMemo(() => [...new Set(jobs.map(j => j.type).filter(Boolean))], [jobs]);
    const degrees = useMemo(() => [...new Set(jobs.map(j => j.degree).filter(Boolean))], [jobs]);
    const workModes = useMemo(() => [...new Set(jobs.map(j => j.work_mode).filter(Boolean))], [jobs]);
    const jobLevels = useMemo(() => [...new Set(jobs.map(j => j.job_level).filter(Boolean))], [jobs]);

    // Filter Logic
    const filteredJobs = useMemo(() => {
        return jobs.filter(job => {
            const matchesSearch =
                (job.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (job.company_name?.toLowerCase() || '').includes(searchTerm.toLowerCase());
            const matchesLocation = locationFilter ? job.location === locationFilter : true;
            const matchesExperience = experienceFilter ? job.experience === experienceFilter : true;
            const matchesType = typeFilter ? job.type === typeFilter : true;
            const matchesDegree = degreeFilter ? job.degree === degreeFilter : true;
            const matchesWorkMode = workModeFilter ? job.work_mode === workModeFilter : true;
            const matchesJobLevel = jobLevelFilter ? job.job_level === jobLevelFilter : true;

            return matchesSearch && matchesLocation && matchesExperience && matchesType && matchesDegree && matchesWorkMode && matchesJobLevel;
        });
    }, [jobs, searchTerm, locationFilter, experienceFilter, typeFilter, degreeFilter, workModeFilter, jobLevelFilter]);

    useEffect(() => {
        const fetchJobDetail = async () => {
            if (!id) {
                // If no ID is present but we have jobs, redirect to the first job
                if (filteredJobs.length > 0) {
                    navigate(`/job/${filteredJobs[0].id}`);
                    return;
                }
                setError('无效的职位ID');
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                // 获取职位详情
                const jobResponse = await jobAPI.getJobById(parseInt(id));
                if (jobResponse.status !== 'success') {
                    throw new Error('获取职位详情失败');
                }
                setJob(jobResponse.data);

                // 从职位数据中提取招聘负责人信息
                const recruiterData = jobResponse.data;
                if (recruiterData.recruiter_name) {
                    // 使用从job数据中直接获取的招聘负责人信息
                    setRecruiter({
                        id: recruiterData.recruiter_id,
                        name: recruiterData.recruiter_name,
                        avatar: recruiterData.recruiter_avatar || '👤',
                        position: recruiterData.recruiter_position || 'HR',
                        is_default: false
                    });
                } else {
                    // 如果没有招聘负责人信息，设置默认信息
                    setRecruiter({
                        name: '招聘负责人',
                        avatar: '👤',
                        position: 'HR',
                        is_default: true,
                        error: '暂无招聘负责人信息'
                    });
                }

                // 获取公司信息
                if (jobResponse.data.company_id) {
                    const companyResponse = await companyAPI.getCompanyById(jobResponse.data.company_id);
                    if (companyResponse.status === 'success') {
                        setCompany(companyResponse.data);
                    }
                }
            } catch (err) {
                console.error('获取职位详情失败:', err);
                setError(err instanceof Error ? err.message : '获取职位详情失败');
            } finally {
                setLoading(false);
            }
        };

        fetchJobDetail();
    }, [id, jobs, navigate]); // Removed filteredJobs from dependency to prevent loop on initial load

    // 检查职位是否已收藏
    useEffect(() => {
        const checkSavedStatus = async () => {
            if (!job?.id || !currentUser?.id) return;

            try {
                // 获取用户收藏的所有职位
                const savedJobsResponse = await candidateAPI.getCandidateSavedJobs(currentUser.id);
                if (savedJobsResponse.status === 'success') {
                    const savedJobIds = (savedJobsResponse.data || []).map((j: any) => j.id);
                    setIsSaved(savedJobIds.includes(job.id));
                }
            } catch (error) {
                console.error('检查收藏状态失败:', error);
            }
        };

        checkSavedStatus();
    }, [job?.id, currentUser?.id]);

    // 收藏/取消收藏职位
    const toggleSaveJob = async () => {
        if (!job?.id || !currentUser?.id || saving) return;

        try {
            setSaving(true);
            
            if (isSaved) {
                // 取消收藏
                await candidateAPI.removeSavedJob(currentUser.id, job.id);
                setIsSaved(false);
                message.success('已取消收藏');
            } else {
                // 收藏
                await candidateAPI.saveJob(currentUser.id, job.id);
                setIsSaved(true);
                message.success('收藏成功');
            }
        } catch (error: any) {
            console.error('收藏操作失败:', error);
            message.error(error.message || '操作失败，请重试');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 h-[calc(100vh-80px)] flex flex-col gap-6">

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-4">
                <div className="flex flex-wrap gap-4 items-center w-full">
                    <div className="flex-1 min-w-[200px] relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="搜索职位或公司..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                        />
                    </div>

                    <div className="flex gap-3 flex-wrap">
                        <select
                            value={locationFilter}
                            onChange={(e) => setLocationFilter(e.target.value)}
                            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer text-gray-700"
                        >
                            <option value="">所有地点</option>
                            {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                        </select>

                        <select
                            value={experienceFilter}
                            onChange={(e) => setExperienceFilter(e.target.value)}
                            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer text-gray-700"
                        >
                            <option value="">所有经验</option>
                            {experiences.map(exp => <option key={exp} value={exp}>{exp}</option>)}
                        </select>

                        <select
                            value={degreeFilter}
                            onChange={(e) => setDegreeFilter(e.target.value)}
                            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer text-gray-700"
                        >
                            <option value="">所有学历</option>
                            {degrees.map(deg => <option key={deg} value={deg}>{deg}</option>)}
                        </select>

                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer text-gray-700"
                        >
                            <option value="">所有类型</option>
                            {types.map(type => <option key={type} value={type}>{type}</option>)}
                        </select>

                        <select
                            value={workModeFilter}
                            onChange={(e) => setWorkModeFilter(e.target.value)}
                            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer text-gray-700"
                        >
                            <option value="">工作模式</option>
                            {workModes.map(mode => <option key={mode} value={mode}>{mode}</option>)}
                        </select>

                        <select
                            value={jobLevelFilter}
                            onChange={(e) => setJobLevelFilter(e.target.value)}
                            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer text-gray-700"
                        >
                            <option value="">职位级别</option>
                            {jobLevels.map(level => <option key={level} value={level}>{level}</option>)}
                        </select>

                        {(searchTerm || locationFilter || experienceFilter || typeFilter || degreeFilter || workModeFilter || jobLevelFilter) && (
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setLocationFilter('');
                                    setExperienceFilter('');
                                    setTypeFilter('');
                                    setDegreeFilter('');
                                    setWorkModeFilter('');
                                    setJobLevelFilter('');
                                }}
                                className="px-4 py-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors font-medium text-sm"
                            >
                                重置
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex-1 flex gap-6 overflow-hidden">
                {/* Left Pane: Job List (30%) */}
                <div className="w-[30%] bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">职位列表</h2>
                            <p className="text-sm text-gray-500">共 {filteredJobs.length} 个职位</p>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                        {filteredJobs.length > 0 ? (
                            filteredJobs.map((item) => (
                                <div
                                    key={item.id}
                                    onClick={() => navigate(`/job/${item.id}`)}
                                    className={`p-4 rounded-xl cursor-pointer transition-all border ${item.id === parseInt(id || '0')
                                        ? 'bg-indigo-50 border-indigo-200 shadow-sm'
                                        : 'hover:bg-gray-50 border-transparent hover:border-gray-200'
                                        }`}
                                >
                                    <h3 className={`font-bold text-base mb-1 ${item.id === parseInt(id || '0') ? 'text-indigo-700' : 'text-gray-900'}`}>
                                        {item.title}
                                    </h3>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm text-gray-600 truncate max-w-[60%]">{item.company_name}</span>
                                        <span className="text-sm font-bold text-indigo-600">{item.salary}</span>
                                    </div>
                                    <div className="flex gap-2 text-xs text-gray-400">
                                        <span className="flex items-center"><MapPin className="w-3 h-3 mr-1" />{item.location}</span>
                                        <span className="flex items-center"><Briefcase className="w-3 h-3 mr-1" />{item.experience || '经验不限'}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center text-gray-500">
                                <p>没有找到匹配的职位</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Pane: Job Details (70%) */}
                <div className="w-[70%] bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                    {loading ? (
                        <div className="h-full flex items-center justify-center">
                            <div className="inline-block animate-pulse text-center">
                                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4 mx-auto"></div>
                                <p className="text-gray-500">加载职位详情...</p>
                            </div>
                        </div>
                    ) : error || !job ? (
                        <div className="h-full flex flex-col items-center justify-center p-10 text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                <span className="text-2xl">⚠️</span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{error || '职位信息加载失败'}</h3>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {/* Header Section */}
                            <div className="p-8 border-b border-slate-100 bg-gradient-to-r from-white to-slate-50">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="flex items-center gap-3 mb-3">
                                            <h1 className="text-3xl font-extrabold text-gray-900">{job.title}</h1>
                                            {job.urgency && ['紧急', '非常紧急'].includes(job.urgency) && (
                                                <span className="flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                    <Flame className="w-3 h-3 mr-1" />
                                                    {job.urgency}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                                            <span className="flex items-center bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                                                <MapPin className="w-4 h-4 mr-1.5 text-indigo-500" /> {job.location}
                                            </span>
                                            <span className="flex items-center bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                                                <Briefcase className="w-4 h-4 mr-1.5 text-indigo-500" /> {job.experience || '经验不限'}
                                            </span>
                                            <span className="flex items-center bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                                                <GraduationCap className="w-4 h-4 mr-1.5 text-indigo-500" /> {job.degree || '学历不限'}
                                            </span>
                                            <span className="flex items-center bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                                                <Clock className="w-4 h-4 mr-1.5 text-indigo-500" /> {job.type}
                                            </span>
                                            <span className="flex items-center bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                                                <Monitor className="w-4 h-4 mr-1.5 text-indigo-500" /> {job.work_mode || '现场'}
                                            </span>
                                            <span className="flex items-center bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                                                <TrendingUp className="w-4 h-4 mr-1.5 text-indigo-500" /> {job.job_level || '初级'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-3xl font-bold text-indigo-600 mb-2">{job.salary}</div>
                                        <div className="flex gap-3 justify-end">
                                            <button
                                                onClick={toggleSaveJob}
                                                disabled={saving}
                                                className={`p-2 rounded-lg border transition-all ${
                                                    isSaved
                                                        ? 'bg-indigo-50 border-indigo-300 text-indigo-600 hover:bg-indigo-100'
                                                        : 'bg-white border-gray-200 text-gray-400 hover:text-indigo-600 hover:border-indigo-300'
                                                } ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                                title={isSaved ? '取消收藏' : '收藏职位'}
                                            >
                                                <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
                                            </button>
                                            <button
                                                onClick={() => onChat(job.id, job.recruiter_id || 0)}
                                                className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition shadow-md shadow-indigo-200 flex items-center"
                                            >
                                                <MessageSquare className="w-4 h-4 mr-2" /> 立即沟通
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 grid grid-cols-3 gap-8">
                                {/* Main Description (2/3) */}
                                <div className="col-span-2 space-y-8">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                            <div className="w-1 h-5 bg-indigo-600 mr-3 rounded-full"></div> 职位描述
                                        </h3>
                                        <div className="text-gray-600 leading-relaxed whitespace-pre-line text-base bg-slate-50 p-6 rounded-xl border border-slate-100">
                                            {job.description || '暂无职位描述'}
                                        </div>
                                    </div>
                                </div>

                                {/* Sidebar Info (1/3) - Embedded Company & Recruiter */}
                                <div className="space-y-6">
                                    {/* Recruiter Info */}
                                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">招聘负责人</h4>
                                        <div className="flex items-center">
                                            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-xl mr-3 border-2 border-white shadow-sm overflow-hidden">
                                                {recruiter?.avatar ? (
                                                    <img 
                                                        src={recruiter.avatar} 
                                                        alt={recruiter.name} 
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="text-xl">👤</div>
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900">{recruiter?.name || '招聘负责人'}</h3>
                                                <p className="text-xs text-gray-500">{recruiter?.position || 'HR'}</p>
                                                {recruiter?.error && (
                                                    <p className="text-xs text-red-500 mt-1">{recruiter.error}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Company Info */}
                                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">公司信息</h4>
                                            <button
                                                onClick={() => setIsCompanyInfoExpanded(!isCompanyInfoExpanded)}
                                                className="text-indigo-600 hover:text-indigo-800"
                                            >
                                                {isCompanyInfoExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                            </button>
                                        </div>

                                        <div className="flex items-center mb-3">
                                            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 mr-3">
                                                <Building className="w-5 h-5" />
                                            </div>
                                            <div className="font-bold text-gray-900">{job.company_name}</div>
                                        </div>

                                        {isCompanyInfoExpanded && (
                                            <div className="space-y-3 text-sm text-gray-600 mt-4 pt-4 border-t border-gray-100">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">行业</span>
                                                    <span className="font-medium">{company?.industry || '互联网 / 软件'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">规模</span>
                                                    <span className="font-medium">{company?.size || '100-500人'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">状态</span>
                                                    <span className={`font-medium ${company?.is_verified ? 'text-green-600' : 'text-gray-500'}`}>
                                                        {company?.is_verified ? '已认证' : '未认证'}
                                                    </span>
                                                </div>
                                                <div className="pt-2">
                                                    <span className="text-gray-400 block mb-1">地址</span>
                                                    <span className="font-medium block leading-snug">{company?.address || `${job.location}科技园区`}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default JobDetailScreen;