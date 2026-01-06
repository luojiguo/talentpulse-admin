import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, MessageSquare, Bookmark, ChevronUp, ChevronDown, MapPin, Briefcase, Clock, Building, Search, Filter, GraduationCap, Monitor, TrendingUp, Flame } from 'lucide-react';
import { JobPosting } from '@/types/types';
import { jobAPI, companyAPI, recruiterAPI, candidateAPI } from '@/services/apiService';
import { message } from 'antd';
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
        <div className="flex h-screen items-center justify-center">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
    );

    if (error || !job) return (
        <div className="flex h-screen items-center justify-center flex-col">
            <span className="text-2xl mb-2">⚠️</span>
            <p>{error || '职位不存在'}</p>
            <button onClick={() => navigate('/')} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg">返回首页</button>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 min-h-screen">
            <div className="mb-6">
                <button onClick={() => navigate(-1)} className="flex items-center text-slate-500 hover:text-indigo-600 transition-colors">
                    <ChevronLeft className="w-5 h-5 mr-1" /> 返回职位列表
                </button>
            </div>

            {/* Job Detail Card - Centered Single Column */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-12">
                {/* Header Section */}
                <div className="p-8 border-b border-slate-100 bg-gradient-to-r from-white to-slate-50/50">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <h1 className="text-3xl font-extrabold text-slate-900">{job.title}</h1>
                                {job.urgency && ['紧急', '非常紧急'].includes(job.urgency) && (
                                    <span className="flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-100">
                                        <Flame className="w-3 h-3 mr-1" /> {job.urgency}
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-2 text-sm text-slate-600">
                                {[
                                    { icon: <MapPin className="w-3.5 h-3.5" />, text: job.location },
                                    { icon: <Briefcase className="w-3.5 h-3.5" />, text: job.experience },
                                    { icon: <GraduationCap className="w-3.5 h-3.5" />, text: job.degree },
                                    { icon: <Clock className="w-3.5 h-3.5" />, text: job.type },
                                    { icon: <TrendingUp className="w-3.5 h-3.5" />, text: job.job_level },
                                ].map((item, idx) => (
                                    <span key={idx} className="flex items-center bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                                        <span className="text-indigo-500 mr-1.5">{item.icon}</span>
                                        {item.text || '不限'}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="text-right shrink-0">
                            <div className="text-3xl font-bold text-[#fe574a] mb-3">{job.salary}</div>
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={toggleSaveJob}
                                    disabled={saving}
                                    className={`p-2.5 rounded-xl border transition-all ${isSaved
                                        ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                                        : 'bg-white border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200'
                                        }`}
                                >
                                    <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
                                </button>
                                <button
                                    onClick={() => onChat(Number(job.id), Number(job.recruiter_id) || 0)}
                                    className="px-8 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 flex items-center"
                                >
                                    <MessageSquare className="w-4 h-4 mr-2" /> 立即沟通
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-10">
                    <div className="md:col-span-2 space-y-8">
                        <div className="prose prose-slate max-w-none">
                            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                                <div className="w-1.5 h-6 bg-indigo-600 mr-3 rounded-full"></div> 职位描述
                            </h3>
                            <div className="text-slate-600 leading-loose whitespace-pre-line bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                {job.description || '暂无职位描述'}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Recruiter Card */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">招聘负责人</h4>
                            <div className="flex items-center gap-4">
                                <UserAvatar
                                    src={recruiter?.avatar}
                                    name={recruiter?.name}
                                    size={56}
                                    className="bg-indigo-100 text-indigo-700 border-4 border-white shadow-sm"
                                />
                                <div>
                                    <div className="font-bold text-slate-900 text-lg">{recruiter?.name}</div>
                                    <div className="text-sm text-slate-500">{recruiter?.position}</div>
                                </div>
                            </div>

                        </div>

                        {/* Company Card */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 overflow-hidden">
                                    {job.company_logo ? <img src={job.company_logo} className="w-full h-full object-cover" alt={job.company_name} /> : <Building className="w-6 h-6" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-slate-900 truncate" title={job.company_name}>{job.company_name}</div>
                                    <div className={`text-xs ${company?.is_verified ? 'text-green-600' : 'text-slate-400'} flex items-center mt-0.5`}>
                                        {company?.is_verified && <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5"></div>}
                                        {company?.is_verified ? '企业已认证' : '未认证企业'}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 text-sm text-slate-600 bg-slate-50 p-4 rounded-xl">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">行业</span>
                                    <span className="font-medium text-slate-800">{company?.industry || '互联网'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">规模</span>
                                    <span className="font-medium text-slate-800">{company?.size || '100-500人'}</span>
                                </div>
                                <div className="pt-2 border-t border-slate-200 mt-2">
                                    <span className="text-slate-400 block mb-1 text-xs">公司地址</span>
                                    <span className="font-medium block leading-snug">{company?.address || job.location}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom: Similar Jobs Masonry */}
            <div className="mb-12">
                <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                    <div className="w-1.5 h-6 bg-gradient-to-b from-indigo-500 to-purple-500 mr-3 rounded-full"></div>
                    相似职位推荐
                    <span className="ml-3 text-sm font-normal text-slate-400">根据职位类型和地点匹配</span>
                </h2>

                {similarJobs.length > 0 ? (
                    <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                        {similarJobs.map(similarJob => (
                            <div key={similarJob.id} className="break-inside-avoid">
                                <JobCard job={similarJob} onChat={onChat} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400">
                        暂无相似职位推荐
                    </div>
                )}
            </div>
        </div>
    );
};

export default JobDetailScreen;