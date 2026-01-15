import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, MessageSquare, Bookmark, ChevronUp, ChevronDown, MapPin, Briefcase, Clock, Building, Search, Filter, GraduationCap, Monitor, TrendingUp, Flame } from 'lucide-react';
import { JobPosting } from '@/types/types';
import { jobAPI, companyAPI, recruiterAPI, candidateAPI } from '@/services/apiService';
import { message, Tooltip } from 'antd';
import { processAvatarUrl } from '@/components/AvatarUploadComponent';
import UserAvatar from '@/components/UserAvatar';
import JobCard from '../components/JobCard';

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

    // Filter States for Similar Jobs
    // ... (Keep existing state logic if needed, or simplify if we just show random similar jobs)
    // For "Similar Jobs", we can filter `jobs` based on the current job's category or just show others.

    // 公司信息展开/折叠状态
    const [isCompanyInfoExpanded, setIsCompanyInfoExpanded] = useState(true);

    // Effect to fetch job details
    useEffect(() => {
        const fetchJobDetail = async () => {
            if (!id) return;
            window.scrollTo(0, 0); // Scroll to top when ID changes
            setLoading(true);
            setError(null);
            try {
                const jobResponse = await jobAPI.getJobById(parseInt(id));
                if ((jobResponse as any).status !== 'success') throw new Error('获取职位详情失败');
                setJob(jobResponse.data);

                // Recruiter & Company logic...
                const recruiterData = jobResponse.data;
                // ... (simplified for brevity in thought, but implementation will keep full logic)
                if (recruiterData.recruiter_name) {
                    setRecruiter({
                        id: recruiterData.recruiter_id,
                        name: recruiterData.recruiter_name,
                        avatar: recruiterData.recruiter_avatar || '👤',
                        position: recruiterData.recruiter_position || 'HR',
                        is_default: false
                    });
                } else {
                    setRecruiter({ name: '招聘负责人', avatar: '👤', position: 'HR', is_default: true, error: '暂无招聘负责人信息' });
                }

                if (jobResponse.data.company_id) {
                    const companyResponse = await companyAPI.getCompanyById(jobResponse.data.company_id);
                    if (companyResponse.status === 'success') setCompany(companyResponse.data);
                }
            } catch (err) {
                console.error(err);
                setError(err instanceof Error ? err.message : '获取详情失败');
            } finally {
                setLoading(false);
            }
        };
        fetchJobDetail();
    }, [id]);

    // Check saved status...
    useEffect(() => {
        const checkSavedStatus = async () => {
            if (!job?.id || !currentUser?.id) return;
            try {
                const savedJobsResponse = await candidateAPI.getCandidateSavedJobs(currentUser.id);
                if ((savedJobsResponse as any).status === 'success') {
                    const savedJobIds = (savedJobsResponse.data || []).map((j: any) => j.id);
                    setIsSaved(savedJobIds.includes(job.id));
                }
            } catch (e) { console.error(e); }
        };
        checkSavedStatus();
    }, [job?.id, currentUser?.id]);

    const toggleSaveJob = async () => {
        if (!job?.id || !currentUser?.id || saving) return;
        setSaving(true);
        try {
            if (isSaved) {
                await candidateAPI.removeSavedJob(currentUser.id, job.id);
                setIsSaved(false);
                message.success('已取消收藏');
            } else {
                await candidateAPI.saveJob(currentUser.id, job.id);
                setIsSaved(true);
                message.success('收藏成功');
            }
        } catch (e: any) {
            message.error(e.message || '操作失败');
        } finally {
            setSaving(false);
        }
    };

    // Calculate Similar Jobs (Simple logic: Same location or random, excluding current)
    const similarJobs = useMemo(() => {
        if (!job) return [];
        return jobs.filter(j => j.id !== job.id).slice(0, 6); // Show up to 6 similar jobs
    }, [jobs, job]);

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-white dark:bg-slate-950">
            <div className="flex flex-col items-center gap-6">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-brand-100 dark:border-slate-800 border-t-brand-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2 h-2 bg-brand-500 rounded-full animate-pulse"></div>
                    </div>
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-bold tracking-wider animate-pulse text-sm">正在为您加载职位详情...</p>
            </div>
        </div>
    );

    if (error || !job) return (
        <div className="flex h-screen items-center justify-center flex-col bg-white dark:bg-slate-950 px-4">
            <div className="w-24 h-24 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center mb-8 relative">
                <div className="absolute inset-0 bg-rose-100 dark:bg-rose-900/30 rounded-full animate-ping opacity-20"></div>
                <span className="text-5xl relative z-10">⚠️</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-3">{error || '职位已下线或不存在'}</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-10 text-center max-w-md leading-relaxed">抱歉，该职位可能已被关闭或移动，您可以去看看其他类似的优质职位。</p>
            <button
                onClick={() => navigate('/')}
                className="px-10 py-4 bg-brand-500 text-white font-black rounded-2xl hover:bg-brand-600 transition-all shadow-xl shadow-brand-500/20 active:scale-95 flex items-center gap-2"
            >
                <Search className="w-5 h-5" /> 探索更多职位
            </button>
        </div>
    );

    return (
        <div className="bg-slate-50/30 dark:bg-slate-950 min-h-screen">
            <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="mb-10">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-all font-black group active:scale-95 bg-white dark:bg-slate-900 px-6 py-3 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800"
                    >
                        <ChevronLeft className="w-5 h-5 mr-1.5 group-hover:-translate-x-1 transition-transform" /> 返回职位列表
                    </button>
                </div>

                <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden mb-12 relative group">
                    {/* Top highlight gradient */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600 opacity-80"></div>

                    {/* Header Section */}
                    <div className="p-8 md:p-10 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-b from-white to-slate-50/50 dark:from-[#1C1C1E] dark:to-[#1C1C1E]">
                        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                            <div className="flex-1">
                                <div className="flex gap-3 mb-4">
                                    {job.urgency && ['紧急', '非常紧急'].includes(job.urgency) && (
                                        <span className="flex items-center px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-500 border border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20">
                                            <Flame className="w-3 h-3 mr-1" /> {job.urgency}
                                        </span>
                                    )}
                                    <span className="flex items-center px-3 py-1 rounded-full text-xs font-bold bg-brand-50 text-brand-600 border border-brand-100 dark:bg-brand-500/10 dark:text-brand-400 dark:border-brand-500/20">
                                        <Clock className="w-3 h-3 mr-1" /> {job.expire_date ? new Date(job.expire_date).toLocaleDateString() : '不限'}
                                    </span>
                                </div>
                                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight mb-6">{job.title}</h1>

                                <div className="flex flex-wrap gap-2 text-sm">
                                    {[
                                        { icon: <MapPin className="w-3.5 h-3.5" />, text: job.location },
                                        { icon: <Briefcase className="w-3.5 h-3.5" />, text: job.experience },
                                        { icon: <GraduationCap className="w-3.5 h-3.5" />, text: job.degree },
                                        { icon: <Monitor className="w-3.5 h-3.5" />, text: job.work_mode || job.type },
                                    ].map((item, idx) => (
                                        <div key={idx} className="flex items-center bg-slate-50 dark:bg-slate-800/50 px-3.5 py-2 rounded-xl border border-slate-100 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 font-medium">
                                            <span className="text-brand-500 mr-2">{item.icon}</span>
                                            {item.text || '不限'}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="text-left md:text-right shrink-0 w-full md:w-auto flex flex-col items-start md:items-end gap-6">
                                <div
                                    className="inline-flex items-center justify-center px-6 py-3 rounded-2xl border shadow-sm transition-all"
                                    style={{
                                        backgroundColor: '#EFF6FF',
                                        color: '#007AFF',
                                        borderColor: '#DBEAFE',
                                        boxShadow: '0 4px 6px -1px rgba(0, 122, 255, 0.1)'
                                    }}
                                >
                                    <span className="text-3xl font-black tracking-tight">{job.salary}</span>
                                </div>
                                <div className="flex gap-3 w-full md:w-auto">
                                    <Tooltip title={isSaved ? "取消收藏" : "收藏该职位"} placement="top">
                                        <button
                                            onClick={toggleSaveJob}
                                            disabled={saving}
                                            className={`p-3.5 rounded-xl border transition-all active:scale-95 ${isSaved
                                                ? 'bg-brand-50 border-brand-200 text-brand-600 dark:bg-brand-500/10 dark:border-brand-500/20 dark:text-brand-400'
                                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:border-brand-200 dark:hover:border-brand-500/30'
                                                }`}
                                        >
                                            <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
                                        </button>
                                    </Tooltip>
                                    <button
                                        onClick={() => onChat(Number(job.id), Number(job.recruiter_id) || 0)}
                                        className="flex-1 md:flex-none px-8 py-3.5 bg-brand-500 text-white font-bold rounded-xl hover:bg-brand-600 shadow-lg shadow-brand-500/30 dark:shadow-brand-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                                        style={{ backgroundColor: '#007AFF' }}
                                    >
                                        <MessageSquare className="w-5 h-5" /> 立即沟通
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-8 md:p-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
                        <div className="lg:col-span-2 space-y-10">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center">
                                    职位描述
                                </h3>
                                <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                                    {job.description || '暂无职位描述'}
                                </div>
                            </div>

                            {/* Tags or Requirements could go here */}
                        </div>

                        <div className="space-y-8">
                            {/* Recruiter Section */}
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-700/50">
                                <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6">招聘负责人</h4>
                                <div className="flex items-center gap-4 mb-4">
                                    <UserAvatar
                                        src={recruiter?.avatar}
                                        name={recruiter?.name}
                                        size={56}
                                        className="bg-white dark:bg-slate-700 ring-2 ring-white dark:ring-slate-800"
                                    />
                                    <div>
                                        <div className="font-bold text-slate-900 dark:text-white text-lg">{recruiter?.name}</div>
                                        <div className="text-sm text-slate-500 dark:text-slate-400">{recruiter?.position}</div>
                                    </div>
                                </div>
                                <div className="text-xs text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-100 dark:border-slate-700/50 inline-block">
                                    通常 1 小时内回复
                                </div>
                            </div>

                            {/* Company Section */}
                            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer group" onClick={() => navigate(`/company/${job.company_id}`)}>
                                <div className="flex items-center gap-4 mb-5">
                                    <div className="w-14 h-14 rounded-xl bg-slate-50 dark:bg-slate-700 flex items-center justify-center p-2 border border-slate-100 dark:border-slate-600 group-hover:scale-105 transition-transform">
                                        {job.company_logo && job.company_logo !== 'C' ? <img src={processAvatarUrl(job.company_logo)} className="w-full h-full object-contain" alt={job.company_name} /> : <Building className="w-7 h-7 text-slate-400" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-slate-900 dark:text-white truncate text-lg group-hover:text-brand-600 transition-colors">{job.company_name}</div>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            {company?.is_verified && (
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-brand-50 text-brand-600 border border-brand-100 dark:bg-brand-500/10 dark:text-brand-400 dark:border-brand-500/20">
                                                    已认证
                                                </span>
                                            )}
                                            <span className="text-xs text-slate-500">{company?.industry}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-50 dark:border-slate-700/50">
                                    <div>
                                        <div className="text-xs text-slate-400 mb-1">规模</div>
                                        <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">{company?.size || '未知'}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-400 mb-1">地点</div>
                                        <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate" title={company?.address || job.location}>{company?.address || job.location}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom: Similar Jobs Masonry */}
                <div className="mb-16">
                    <div className="flex items-center justify-between mb-10">
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white flex items-center">
                            <div className="w-2.5 h-8 bg-gradient-to-b from-brand-400 to-brand-600 mr-5 rounded-full shadow-lg shadow-brand-200 dark:shadow-none"></div>
                            相似职位推荐
                            <span className="ml-5 text-[10px] font-black text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30 px-4 py-1.5 rounded-full uppercase tracking-widest border border-brand-100 dark:border-brand-900/50">AI 智能匹配</span>
                        </h2>
                    </div>

                    {similarJobs.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {similarJobs.map(similarJob => (
                                <JobCard key={similarJob.id} job={similarJob} onChat={onChat} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-400 font-bold text-lg">
                            <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            暂无相似职位推荐
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default JobDetailScreen;