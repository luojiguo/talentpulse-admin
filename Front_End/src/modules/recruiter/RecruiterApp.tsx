import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Routes, Route, useParams, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Users, Briefcase, Settings, LogOut,
    Plus, PlusCircle, Search, Sparkles, MapPin, ChevronDown, User, FileText, CheckCircle, XCircle,
    Calendar, Clock, TrendingUp, TrendingDown, ArrowRight, Filter,
    Columns, ChevronLeft, Menu, Shield, Trash2
} from 'lucide-react';
import { generateJobDescription, generateRecruitmentSuggestions, generateFullJobInfo } from '@/services/aiService';
import { userAPI, jobAPI, candidateAPI, recruiterAPI, messageAPI, companyAPI } from '@/services/apiService';
import { UserRole, JobPosting, Conversation } from '@/types/types';
import { processAvatarUrl } from '@/components/AvatarUploadComponent';

// 导入拆分后的组件
import RecruiterMessageScreen from './components/RecruiterMessageScreen';
import RecruiterJobDetail from './components/RecruiterJobDetail';
import RecruiterProfileScreen from './components/RecruiterProfileScreen';
import { InputField, MessageAlert } from './components/CommonComponents';

// 导入布局和页面组件
import { RecruiterLayout } from './components/RecruiterLayout';
import { RecruiterDashboard } from './screens/RecruiterDashboard';
import { JobsView } from './views/JobsView';
import { CandidatesView } from './views/CandidatesView';
import InterviewsView from './views/InterviewsView';
import OnboardingsView from './views/OnboardingsView';

interface RecruiterAppProps {
    onLogout: () => void;
    onSwitchRole: (role: UserRole) => void;
    currentUser: any;
}

export const RecruiterApp: React.FC<RecruiterAppProps> = ({ onLogout, onSwitchRole, currentUser }) => {
    // 初始化视图状态，检查是否需要认证
    const initialView = currentUser.needs_verification ? 'profile' : 'dashboard';
    const [jobs, setJobs] = useState<JobPosting[]>([]);
    const [candidates, setCandidates] = useState<any[]>([]);
    const [conversations, setConversations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // 自动保存相关状态
    const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Profile state moved to main component so navigation bar can access it
    const [profile, setProfile] = useState({
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        phone: currentUser.phone,
        position: '',
        avatar: currentUser.avatar || 'RP',
        company: {
            id: '',
            name: '',
            industry: '',
            size: '',
            address: '',
            description: '',
            logo: 'C',
            company_type: '',
            establishment_date: '',
            registered_capital: '',
            social_credit_code: '',
            company_website: '',
            company_phone: '',
            company_email: '',
            is_verified: false,
            verification_date: null,
            verification_status: 'pending',
            status: 'active',
            job_count: 0,
            follower_count: 0,
            created_at: null,
            updated_at: null,
            business_license: '',
            contact_info: ''
        }
    });

    // 监听头像更新事件
    useEffect(() => {
        const handleAvatarUpdate = (event: Event) => {
            const customEvent = event as CustomEvent<{ avatar: string }>;
            if (customEvent.detail && customEvent.detail.avatar) {
                setProfile(prev => ({
                    ...prev,
                    avatar: customEvent.detail.avatar
                }));
            }
        };

        window.addEventListener('userAvatarUpdated', handleAvatarUpdate);
        return () => {
            window.removeEventListener('userAvatarUpdated', handleAvatarUpdate);
        };
    }, []);

    // 获取招聘者详细信息
    const fetchRecruiterProfile = async () => {
        try {
            // 调用后端API获取招聘者详细信息
            const userResponse = await userAPI.getUserById(currentUser.id);

            // 调用公司API获取完整的公司信息
            const companyResponse = await companyAPI.getCompanyByUserId(currentUser.id);

            if ((userResponse as any).status === 'success') {
                // 确保id始终是数字类型，避免类型不匹配导致的死循环
                const userData = {
                    ...userResponse.data,
                    id: typeof userResponse.data.id === 'string' ? parseInt(userResponse.data.id, 10) : userResponse.data.id
                };

                // 初始化公司信息变量
                let companyInfo = profile.company;

                // 如果公司API调用成功，且返回了数据数组，取第一个公司
                if ((companyResponse as any).status === 'success' && Array.isArray(companyResponse.data) && companyResponse.data.length > 0) {
                    const apiCompanyData = companyResponse.data[0];

                    // 格式化成立日期为YYYY-MM-DD格式，适配HTML5 date输入控件
                    const formatDate = (dateString: string | Date | null) => {
                        if (!dateString) return '';
                        const date = new Date(dateString);
                        if (isNaN(date.getTime())) return '';
                        return date.toISOString().split('T')[0];
                    };

                    // 映射API返回的字段到前端期望的格式
                    companyInfo = {
                        ...apiCompanyData,
                        // 映射recruiter_user表的字段到company对象
                        business_license: apiCompanyData.recruiter_business_license || apiCompanyData.business_license,
                        contact_info: apiCompanyData.recruiter_contact_info || apiCompanyData.contact_info,
                        verification_status: apiCompanyData.verification_status,
                        // 格式化成立日期
                        establishment_date: formatDate(apiCompanyData.establishment_date)
                    };
                }

                // 更新profile状态，包括头像和公司信息
                const updatedProfile = {
                    ...profile,
                    ...userData,
                    company: companyInfo
                };

                setProfile(updatedProfile);
                return updatedProfile; // 返回更新后的profile数据
            }
            return null;
        } catch (error) {
            console.error('获取招聘者详细信息失败:', error);
            return null;
        }
    };

    // 本地缓存机制，存储API响应结果
    const [cache, setCache] = useState<{
        jobs?: any[];
        candidates?: any[];
        conversations?: any[];
        profile?: any;
        lastUpdated?: number;
    }>({});

    // 缓存有效期（1分钟）
    const CACHE_DURATION = 60 * 1000;

    // 获取招聘者数据 - 优化版，实现并行加载和优先级渲染
    useEffect(() => {
        const fetchRecruiterData = async () => {
            try {
                const now = Date.now();
                const isCacheValid = cache.lastUpdated && (now - cache.lastUpdated) < CACHE_DURATION;

                // 1. 先使用缓存数据快速渲染页面，立即设置loading为false
                if (isCacheValid) {
                    if (cache.jobs) setJobs(cache.jobs);
                    if (cache.candidates) setCandidates(cache.candidates);
                    if (cache.conversations) setConversations(cache.conversations);
                    if (cache.profile) setProfile(cache.profile);
                    setLoading(false); // 缓存有效时立即显示页面
                }

                // 2. 并行获取所有数据，不阻塞UI渲染
                const fetchJobs = recruiterAPI.getJobs(currentUser.id);
                const fetchCandidates = recruiterAPI.getCandidates(currentUser.id);
                const fetchConversations = messageAPI.getConversations(currentUser.id);
                const fetchProfile = fetchRecruiterProfile();

                // 并行处理所有请求
                const [jobsResponse, candidatesResponse, conversationsResponse, profileData] = await Promise.all([
                    fetchJobs,
                    fetchCandidates,
                    fetchConversations,
                    fetchProfile
                ]);

                // 从响应中提取数据数组 - 响应拦截器已经将res.data赋值给了data字段
                const jobsData = jobsResponse.data || [];
                const candidatesData = candidatesResponse.data || [];
                const allConversations = conversationsResponse.data || [];

                // 过滤对话：只保留当前用户作为招聘者的对话
            const realConversations = allConversations.filter((c: any) => {
                const rId = c.recruiterUserId || c.recruiter_user_id;
                return Number(rId) === Number(currentUser.id);
            });

                // 映射职位数据
                const filteredJobs = jobsData.map((job: any) => ({
                    id: job.id,
                    title: job.title,
                    company: job.company || job.company_name || '未设置公司',
                    company_name: job.company || job.company_name || '未设置公司',
                    department: job.department || '',
                    location: job.location,
                    salary: job.salary || '面议',
                    description: job.description || '',
                    type: job.type || '全职',
                    posterId: job.posterId || job.poster_id || job.recruiter_id,
                    recruiter_id: job.recruiter_id,
                    recruiter_name: job.recruiter_name || '未知发布人',
                    recruiter_avatar: job.recruiter_avatar,
                    recruiter_position: job.recruiter_position || '未知职位',
                    applicants: job.applicants || job.applications_count || 0,
                    status: job.status === 'active' || job.status === 'Active' ? 'Active' : 'Closed',
                    postedDate: job.posted_date || job.postedDate || job.publish_date ? new Date(job.posted_date || job.postedDate || job.publish_date).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date(job.created_at || job.updated_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }),
                    expire_date: job.expire_date,
                    updated_at: job.updated_at || job.created_at,
                    is_own_job: job.is_own_job || false,
                    required_skills: job.required_skills,
                    preferred_skills: job.preferred_skills,
                    benefits: job.benefits
                }));

                // 映射候选人数据
                const filteredCandidates = candidatesData.map((candidate: any) => ({
                    ...candidate,
                    // Ensure required fields for frontend
                    stage: candidate.stage || 'New',
                    appliedJob: candidate.job_title,
                    appliedDate: new Date(candidate.applied_date).toLocaleDateString()
                }));

                // 更新主要数据
                setJobs(filteredJobs);
                setCandidates(filteredCandidates);
                setConversations(realConversations);

                // 更新缓存
                setCache(prev => ({
                    ...prev,
                    jobs: filteredJobs,
                    candidates: filteredCandidates,
                    conversations: realConversations,
                    profile: profileData,
                    lastUpdated: now
                }));

            } catch (error) {
                console.error('获取招聘者数据失败:', error);
            } finally {
                // 无论是否有缓存，最终都要设置loading为false
                setLoading(false);
            }
        };

        fetchRecruiterData();
    }, [currentUser.id]); // 移除 cache 依赖，防止死循环



    // 定时刷新对话列表，确保消息实时更新（只在有对话时刷新）
    useEffect(() => {
        if (conversations.length === 0) return;

        // 降低刷新频率，减少服务器压力
        const refreshInterval = setInterval(async () => {
            try {
                // 只在用户活跃时刷新（例如：窗口聚焦时）
                if (document.visibilityState === 'visible') {
                    const conversationsResponse = await messageAPI.getConversations(currentUser.id);
                    const allConversations = conversationsResponse.data || [];

                    // 过滤对话：只保留当前用户作为招聘者的对话
                const realConversations = allConversations.filter((c: any) => {
                    const rId = c.recruiterUserId || c.recruiter_user_id;
                    return Number(rId) === Number(currentUser.id);
                });

                    // 优化更新逻辑，只更新有变化的对话
                    setConversations(prevConversations => {
                        // 检查是否有新对话
                        if (realConversations.length > prevConversations.length) {
                            return realConversations;
                        }

                        // 检查是否有更新的对话
                        let hasChanges = false;
                        const updatedConversations = prevConversations.map(prevConv => {
                            const newConv = realConversations.find((c: any) => c.id === prevConv.id);
                            if (newConv && newConv.updated_at !== prevConv.updated_at) {
                                hasChanges = true;
                                // 保留现有消息，只更新对话元数据
                                return {
                                    ...newConv,
                                    messages: prevConv.messages || []
                                };
                            }
                            return prevConv;
                        });

                        return hasChanges ? updatedConversations : prevConversations;
                    });
                }
            } catch (error) {
                console.error('刷新对话列表失败:', error);
            }
        }, 30000); // 每30秒刷新一次，仅在窗口聚焦时

        return () => clearInterval(refreshInterval);
    }, [currentUser.id, conversations.length]);

    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

    // 监听activeConversationId变化，获取完整的消息记录 - 优化：真正的按需加载
    useEffect(() => {
        const fetchConversationMessages = async (limit = 20, offset = 0) => {
            if (!activeConversationId) return;

            try {
                // 获取对话的详细消息，默认获取最新的20条
                const response = await (messageAPI as any).getConversationDetail(activeConversationId, limit, offset, 'desc');
                if ((response as any).status === 'success') {
                    const { conversation, messages, total } = response.data;

                    if (!messages || messages.length === 0) {
                        return; // 没有新消息，不需要更新
                    }

                    // 将消息按时间升序排序，确保聊天记录顺序正确
                    const sortedMessages = messages.sort((a, b) =>
                        new Date(a.time).getTime() - new Date(b.time).getTime()
                    );

                    // 更新对话的消息
                    setConversations(prev => prev.map(conv => {
                        if (conv.id === activeConversationId) {
                            return {
                                ...conv,
                                messages: offset === 0 ? sortedMessages : [...sortedMessages, ...(conv.messages || [])],
                                total_messages: total // 更新总消息数
                            };
                        }
                        return conv;
                    }));
                }
            } catch (error) {
                console.error('获取对话消息失败:', error);
            }
        };

        fetchConversationMessages();
    }, [activeConversationId, currentUser.id, conversations]);

    // 加载更多历史消息
    const handleLoadMoreMessages = async (conversationId: string, currentMessageCount: number) => {
        try {
            // 获取更早的消息
            const response = await (messageAPI as any).getConversationDetail(conversationId, 20, currentMessageCount, 'desc');

            if ((response as any).status === 'success') {
                const { messages } = response.data;
                if (!messages || messages.length === 0) return false;

                // 排序新获取的消息
                const sortedNewMessages = messages.sort((a, b) =>
                    new Date(a.time).getTime() - new Date(b.time).getTime()
                );

                // 将更早的消息添加到现有消息列表的开头
                setConversations(prevConversations =>
                    prevConversations.map(conv =>
                        conv.id === conversationId
                            ? {
                                ...conv,
                                messages: [...sortedNewMessages, ...(conv.messages || [])]
                            }
                            : conv
                    )
                );
                return true;
            }
            return false;
        } catch (error) {
            console.error('加载更多消息失败:', error);
            return false;
        }
    };

    // Job Detail State
    const [viewingJobId, setViewingJobId] = useState<string | number | null>(null);

    // Post Job Modal
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);
    const [newJob, setNewJob] = useState({
        title: '',
        location: '深圳',
        salary: '',
        description: '',
        skills: [''],
        preferredSkills: [''],
        experience: '1-3年',
        degree: '本科',
        type: '全职',
        workMode: '现场',
        jobLevel: '初级',
        hiringCount: 1,
        urgency: '普通',
        department: '',
        benefits: [''],
        expireDate: ''
    });
    const [isGeneratingJD, setIsGeneratingJD] = useState(false);
    const [isGeneratingFullJob, setIsGeneratingFullJob] = useState(false);

    // Edit Job Modal
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingJob, setEditingJob] = useState<JobPosting | null>(null);

    // AI Suggestions State
    const [aiSuggestions, setAiSuggestions] = useState<string | null>(null);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

    // Job Columns Visibility State
    const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
        location: true,
        salary: true,
        applicants: true,
        postedDate: true,
        status: true
    });
    const [isColumnSelectorOpen, setIsColumnSelectorOpen] = useState(false);

    const handleGenerateJD = async () => {
        if (!newJob.title || !newJob.skills) return;
        setIsGeneratingJD(true);
        const description = await generateJobDescription(newJob.title, newJob.skills);
        setNewJob(prev => ({ ...prev, description }));
        setIsGeneratingJD(false);
    };

    // AI一键填写所有字段
    const handleGenerateFullJob = async () => {
        if (!newJob.title) {
            alert('请先输入职位名称');
            return;
        }

        setIsGeneratingFullJob(true);
        try {
            const fullJobInfo = await generateFullJobInfo(newJob.title);
            setNewJob(prev => ({
                ...prev,
                ...fullJobInfo
            }));
        } catch (error) {
            console.error('AI一键填写失败:', error);
            alert('AI一键填写失败，请稍后重试');
        } finally {
            setIsGeneratingFullJob(false);
        }
    };

    const handleGetAiSuggestions = async () => {
        setIsLoadingSuggestions(true);
        const companyInfo = `${profile.company.name || '未设置公司'} (${profile.company.industry || '未设置行业'})`;
        const activeJobTitles = jobs.filter(j => j.status === 'Active').map(j => j.title);
        const pipelineStats = `New: ${candidates.filter(c => c.stage === 'New').length}, Interview: ${candidates.filter(c => c.stage === 'Interview').length}`;

        const suggestions = await generateRecruitmentSuggestions(companyInfo, activeJobTitles, pipelineStats);
        setAiSuggestions(suggestions);
        setIsLoadingSuggestions(false);
    };

    const handlePostJob = async () => {
        try {
            const jobData: Omit<JobPosting, 'id'> = {
                // Map frontend fields to backend expected fields
                title: newJob.title,
                location: newJob.location,
                salary: newJob.salary,
                description: newJob.description,
                required_skills: newJob.skills.filter(Boolean).map(s => s.trim()),
                preferred_skills: newJob.preferredSkills.filter(Boolean).map(s => s.trim()),
                benefits: newJob.benefits.filter(Boolean).map(s => s.trim()),
                experience: newJob.experience,
                degree: newJob.degree,
                type: newJob.type,
                work_mode: newJob.workMode,
                job_level: newJob.jobLevel,
                hiring_count: parseInt(newJob.hiringCount.toString()) || 1,
                urgency: newJob.urgency,
                department: newJob.department,
                expire_date: newJob.expireDate || undefined,
                posterId: currentUser.id,
                company: profile.company.name || "科技之星有限公司",
                applicants: 0,
                status: 'Active',
                postedDate: new Date().toISOString().split('T')[0]
            };

            // 调用API保存职位到数据库
            const response = await jobAPI.createJob(jobData);

            // 如果API调用成功，更新本地状态
            if ((response as any).status === 'success') {
                const newJobFromDB = response.data;
                // 映射新创建的职位数据，确保格式一致
                const mappedNewJob = {
                    id: newJobFromDB.id,
                    title: newJobFromDB.title,
                    company: profile.company.name || newJobFromDB.company_id,
                    company_name: profile.company.name,
                    department: newJobFromDB.department || '',
                    location: newJobFromDB.location,
                    salary: newJobFromDB.salary || '面议',
                    description: newJobFromDB.description || '',
                    type: newJobFromDB.type || '全职',
                    posterId: newJobFromDB.recruiter_id,
                    recruiter_id: newJobFromDB.recruiter_id,
                    recruiter_name: currentUser.name, // 当前用户即为发布人
                    recruiter_avatar: processAvatarUrl(currentUser.avatar),
                    recruiter_position: profile.company.position || '未知职位',
                    applicants: newJobFromDB.applications_count || 0,
                    status: newJobFromDB.status === 'active' || newJobFromDB.status === 'Active' ? 'Active' : 'Closed',
                    postedDate: new Date(newJobFromDB.publish_date || newJobFromDB.created_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
                };
                setJobs([mappedNewJob, ...jobs]);
                setIsPostModalOpen(false);
                setNewJob({
                    title: '',
                    location: '深圳',
                    salary: '',
                    description: '',
                    skills: [''],
                    preferredSkills: [''],
                    experience: '1-3年',
                    degree: '本科',
                    type: '全职',
                    workMode: '现场',
                    jobLevel: '初级',
                    hiringCount: 1,
                    urgency: '普通',
                    department: '',
                    benefits: [''],
                    expireDate: ''
                });
            }
        } catch (error) {
            console.error('发布职位失败:', error);
            alert('发布职位失败，请稍后重试');
        }
    };

    // 编辑职位处理函数
    const handleEditJob = (job: JobPosting) => {
        setEditingJob(job);
        setNewJob({
            title: job.title,
            location: job.location,
            salary: job.salary || '',
            description: job.description,
            skills: job.required_skills || [''],
            preferredSkills: job.preferred_skills || [''],
            experience: job.experience || '1-3年',
            degree: job.degree || '本科',
            type: job.type || '全职',
            workMode: job.work_mode || '现场',
            jobLevel: job.job_level || '初级',
            hiringCount: job.hiring_count || 1,
            urgency: job.urgency || '普通',
            department: job.department || '',
            benefits: job.benefits || [''],
            expireDate: job.expire_date ? new Date(job.expire_date).toISOString().split('T')[0] : ''
        });
        setIsEditModalOpen(true);
    };

    // 更新职位处理函数
    const handleUpdateJob = async () => {
        if (!editingJob) return;

        try {
            const jobData: Partial<JobPosting> = {
                title: newJob.title,
                location: newJob.location,
                salary: newJob.salary,
                description: newJob.description,
                required_skills: newJob.skills.filter(Boolean).map(s => s.trim()),
                preferred_skills: newJob.preferredSkills.filter(Boolean).map(s => s.trim()),
                benefits: newJob.benefits.filter(Boolean).map(s => s.trim()),
                experience: newJob.experience,
                degree: newJob.degree,
                type: newJob.type,
                work_mode: newJob.workMode,
                job_level: newJob.jobLevel,
                hiring_count: parseInt(newJob.hiringCount.toString()) || 1,
                urgency: newJob.urgency,
                department: newJob.department,
                expire_date: newJob.expireDate || undefined,
                status: editingJob.status === 'Active' ? 'Active' : 'Closed' // 转换为数据库期望的格式
            };

            // 调用API更新职位
            const response = await jobAPI.updateJob(editingJob.id, jobData);

            // 如果API调用成功，更新本地状态
            if ((response as any).status === 'success') {
                const updatedJob = response.data;
                // 映射更新后的职位数据，确保格式一致
                const mappedUpdatedJob = {
                    ...editingJob,
                    title: updatedJob.title,
                    location: updatedJob.location,
                    salary: updatedJob.salary || '面议',
                    description: updatedJob.description || '',
                    required_skills: updatedJob.required_skills || [],
                    preferred_skills: updatedJob.preferred_skills || [],
                    benefits: updatedJob.benefits || [],
                    experience: updatedJob.experience || '',
                    degree: updatedJob.degree || '',
                    type: updatedJob.type || '全职',
                    work_mode: updatedJob.work_mode || '现场',
                    job_level: updatedJob.job_level || '初级',
                    hiring_count: updatedJob.hiring_count || 1,
                    urgency: updatedJob.urgency || '普通',
                    department: updatedJob.department || '',
                    status: updatedJob.status === 'active' || updatedJob.status === 'Active' ? 'Active' : 'Closed',
                    updated_at: updatedJob.updated_at // 使用数据库返回的updated_at字段
                };
                setJobs(jobs.map(job => job.id.toString() === editingJob.id.toString() ? mappedUpdatedJob : job));
                setIsEditModalOpen(false);
                setEditingJob(null);
                setNewJob({
                    title: '',
                    location: '深圳',
                    salary: '',
                    description: '',
                    skills: '',
                    experience: '1-3年',
                    degree: '本科',
                    type: '全职',
                    workMode: '现场',
                    jobLevel: '初级',
                    hiringCount: 1,
                    urgency: '普通',
                    department: '',
                    benefits: ''
                });
            }
        } catch (error) {
            console.error('更新职位失败:', error);
            alert('更新职位失败，请稍后重试');
        }
    };

    // 删除职位处理函数
    const handleDeleteJob = (jobId: number | string) => {
        if (window.confirm('确定要删除这个职位吗？')) {
            try {
                // 调用API删除职位
                jobAPI.deleteJob(jobId);
                // 更新本地状态
                setJobs(jobs.filter(job => job.id !== jobId));
            } catch (error) {
                console.error('删除职位失败:', error);
                alert('删除职位失败，请稍后重试');
            }
        }
    };

    // 切换职位状态处理函数
    const handleToggleJobStatus = async (jobId: number | string, currentStatus: string) => {
        try {
            // 切换状态
            const newStatus = currentStatus.toLowerCase() === 'active' ? 'closed' : 'active';

            // 调用API更新职位状态
            const response = await jobAPI.updateJob(jobId, { status: newStatus });

            // 更新本地状态
            if ((response as any).status === 'success') {
                setJobs(jobs.map(job => {
                    if (job.id.toString() === jobId.toString()) {
                        return {
                            ...job,
                            status: newStatus === 'active' ? 'Active' : 'Closed'
                        };
                    }
                    return job;
                }));
            }
        } catch (error) {
            console.error('更新职位状态失败:', error);
            alert('更新职位状态失败，请稍后重试');
        }
    };

    // Debounce函数，用于延迟执行自动保存
    const debounce = (func: Function, delay: number) => {
        return (...args: any[]) => {
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
            }
            autoSaveTimerRef.current = setTimeout(() => func.apply(null, args), delay);
        };
    };

    // 自动保存职位函数
    const autoSaveJob = async () => {
        if (!editingJob || !isEditModalOpen) return;

        try {
            setAutoSaveStatus('saving');

            const jobData: Partial<JobPosting> = {
                title: newJob.title,
                location: newJob.location,
                salary: newJob.salary,
                description: newJob.description,
                required_skills: newJob.skills.filter(Boolean).map(s => s.trim()),
                preferred_skills: newJob.preferredSkills.filter(Boolean).map(s => s.trim()),
                benefits: newJob.benefits.filter(Boolean).map(s => s.trim()),
                experience: newJob.experience,
                degree: newJob.degree,
                type: newJob.type,
                work_mode: newJob.workMode,
                job_level: newJob.jobLevel,
                hiring_count: parseInt(newJob.hiringCount.toString()) || 1,
                urgency: newJob.urgency,
                department: newJob.department,
                status: editingJob.status === 'Active' ? 'Active' : 'Closed'
            };

            // 调用API更新职位
            const response = await jobAPI.updateJob(editingJob.id, jobData);

            if ((response as any).status === 'success') {
                setAutoSaveStatus('saved');
                // 更新本地职位列表
                const updatedJobData = {
                    ...response.data,
                    status: response.data.status === 'active' ? 'Active' : 'Closed',
                    updated_at: response.data.updated_at // 使用数据库返回的updated_at字段
                };

                // 更新职位列表
                setJobs(jobs.map(job => {
                    if (job.id.toString() === editingJob.id.toString()) {
                        return {
                            ...job,
                            ...updatedJobData
                        };
                    }
                    return job;
                }));

                // 更新editingJob对象，确保模态框中的内容及时更新
                if (editingJob) {
                    setEditingJob({
                        ...editingJob,
                        ...updatedJobData
                    });
                }

                // 3秒后重置保存状态
                setTimeout(() => setAutoSaveStatus('idle'), 3000);
            } else {
                setAutoSaveStatus('error');
            }
        } catch (error) {
            console.error('自动保存失败:', error);
            setAutoSaveStatus('error');
        }
    };

    // 创建防抖的自动保存函数，延迟2秒执行
    const debouncedAutoSave = debounce(autoSaveJob, 2000);

    // 监听表单变化，触发自动保存
    useEffect(() => {
        if (isEditModalOpen && editingJob) {
            debouncedAutoSave();
        }
        // 清理函数
        return () => {
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
            }
        };
    }, [newJob, editingJob?.status, isEditModalOpen, debouncedAutoSave]);

    // 查看职位处理函数
    const handleViewJob = (jobId: number | string) => {
        setViewingJobId(jobId);
    };

    const handleSendMessage = async (text: string, type: any = 'text') => {
        if (!activeConversationId || !text) return;

        try {
            // 获取当前对话
            const activeConv = conversations.find(conv => conv.id.toString() === activeConversationId.toString());
            if (!activeConv) return;

            // 发送消息到后端
            // 确保receiverId是users表中的id，而不是recruiters表中的id
            // 使用多种可能的字段名，确保兼容性
            const receiverId = activeConv.candidateId || activeConv.candidate_id || activeConv.CandidateId || activeConv.candidate_user_id || activeConv.candidateUserId;
            if (!receiverId) {
                console.error('无法获取接收者ID');
                return;
            }

            const response = await messageAPI.sendMessage({
                conversationId: activeConversationId,
                senderId: currentUser.id,
                receiverId,
                text,
                type
            });

            // 更新本地状态
            if ((response as any).status === 'success') {
                // 创建新消息对象，确保包含所有必要的字段
                const newMessage = {
                    ...response.data,
                    sender_name: currentUser.name,
                    sender_avatar: processAvatarUrl(currentUser.avatar),
                    sender_id: currentUser.id,
                    role: 'ai', // 'ai' represents recruiter self
                    time: new Date().toISOString(),
                    type: type || 'text',
                    status: 'sent'
                };

                // 如果对话有messages数组，直接添加新消息
                if (activeConv.messages) {
                    setConversations(prev => prev.map(conv => {
                        if (conv.id === activeConversationId) {
                            return {
                                ...conv,
                                last_message: type === 'text' ? text : `[${type}]`,
                                lastTime: new Date().toLocaleString('zh-CN'),
                                last_time: new Date().toISOString(),
                                updated_at: new Date().toISOString(),
                                total_messages: (conv.total_messages || 0) + 1,
                                messages: [...conv.messages, newMessage]
                            };
                        }
                        return conv;
                    }));
                } else {
                    // 如果没有messages数组，重新获取完整对话
                    const updatedConvResponse = await (messageAPI as any).getConversationDetail(activeConversationId);
                    if ((updatedConvResponse as any).status === 'success') {
                        const { conversation } = updatedConvResponse.data;
                        setConversations(prev => prev.map(conv => {
                            if (conv.id.toString() === activeConversationId.toString()) {
                                return conversation;
                            }
                            return conv;
                        }));
                    }
                }
            }
        } catch (error) {
            console.error('发送消息失败:', error);
        }
    };

    const handleDeleteMessage = async (conversationId: string, messageId: number | string) => {
        try {
            // 调用后端API删除消息
            await messageAPI.deleteMessage(messageId, { deletedBy: currentUser.id });

            // 更新本地状态
            setConversations(prev => prev.map(conv => {
                if (conv.id === conversationId) {
                    const newMessages = conv.messages.filter(msg => msg.id !== messageId);
                    const lastMsg = newMessages.length > 0 ? newMessages[newMessages.length - 1] : null;
                    return {
                        ...conv,
                        messages: newMessages,
                        lastMessage: lastMsg ? (lastMsg.type === 'text' ? lastMsg.text : `[${lastMsg.type}]`) : ''
                    };
                }
                return conv;
            }));

            // 同步获取最新的对话列表，确保侧边栏预览也是最新的
            const response = await messageAPI.getConversations(currentUser.id);
            if ((response as any).status === 'success') {
                const updatedConversations = response.data;
                setConversations(prev => {
                    return updatedConversations.map((newConv: any) => {
                        const existingConv = prev.find(p => p.id.toString() === newConv.id.toString());
                        if (existingConv) {
                            return { ...existingConv, ...newConv };
                        }
                        return newConv;
                    });
                });
            }
        } catch (error) {
            console.error('删除消息失败:', error);
        }
    };

    const handleDeleteConversation = async (conversationId: string) => {
        try {
            // 调用后端API删除对话，传入当前用户ID用于软删除
            await messageAPI.deleteConversation(conversationId, { deletedBy: currentUser.id });

            // 更新本地状态
            setConversations(prev => prev.filter(conv => conv.id !== conversationId));

            // 如果删除的是当前选中的对话，清除选中状态
            if (activeConversationId === conversationId) {
                setActiveConversationId(null);
            }
        } catch (error) {
            console.error('删除对话失败:', error);
        }
    };

    // Job Detail Page Component with useParams
    const JobDetailPage: React.FC = () => {
        const { jobId } = useParams<{ jobId: string }>();
        const navigate = useNavigate();

        const job = jobs.find(j => j.id === parseInt(jobId || ''));

        if (!job) {
            return <div className="text-center py-10">职位不存在</div>;
        }

        return (
            <RecruiterJobDetail
                job={job}
                onBack={() => navigate('/recruiter/dashboard')}
            />
        );
    };

    // 骨架屏组件
    const SkeletonLoader: React.FC = () => {
        return (
            <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-gray-100 rounded-lg p-4 space-y-3">
                            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                            <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                        </div>
                    ))}
                </div>
                <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2].map((i) => (
                        <div key={i} className="bg-gray-100 rounded-lg p-4 space-y-3">
                            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                            <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <RecruiterLayout onLogout={onLogout} onSwitchRole={onSwitchRole} currentUser={currentUser}>
            {loading ? (
                <SkeletonLoader />
            ) : (
                <Routes>
                    <Route
                        path="/dashboard"
                        element={
                            <RecruiterDashboard
                                currentUser={currentUser}
                                jobs={jobs}
                                candidates={candidates}
                                profile={profile}
                                onSetIsPostModalOpen={setIsPostModalOpen}
                                onSetNewJob={setNewJob}
                                newJob={newJob}
                                onHandleGenerateJD={handleGenerateJD}
                                isGeneratingJD={isGeneratingJD}
                                aiSuggestions={aiSuggestions}
                                onHandleGetAiSuggestions={handleGetAiSuggestions}
                                isLoadingSuggestions={isLoadingSuggestions}
                                onHandlePostJob={handlePostJob}
                                onSetViewingJobId={setViewingJobId}
                            />
                        }
                    />
                    <Route
                        path="/jobs"
                        element={
                            <JobsView
                                jobs={jobs}
                                onPostJob={() => setIsPostModalOpen(true)}
                                onEditJob={handleEditJob}
                                onDeleteJob={handleDeleteJob}
                                onViewJob={handleViewJob}
                                onToggleJobStatus={handleToggleJobStatus}
                                currentUserId={currentUser.id}
                            />
                        }
                    />
                    <Route
                        path="/jobs/:jobId"
                        element={<JobDetailPage />}
                    />
                    <Route
                        path="/candidates"
                        element={
                            <CandidatesView candidates={candidates} />
                        }
                    />
                    <Route
                        path="/messages"
                        element={
                            <RecruiterMessageScreen
                                conversations={conversations}
                                candidates={candidates}
                                jobs={jobs}
                                activeConversationId={activeConversationId}
                                onSelectConversation={setActiveConversationId}
                                onSendMessage={handleSendMessage}
                                onDeleteMessage={handleDeleteMessage}
                                onDeleteConversation={handleDeleteConversation}
                                onLoadMoreMessages={handleLoadMoreMessages}
                                currentUser={currentUser}
                            />
                        }
                    />
                    <Route
                        path="/messages/:conversationId"
                        element={
                            <RecruiterMessageScreen
                                conversations={conversations}
                                candidates={candidates}
                                jobs={jobs}
                                activeConversationId={activeConversationId}
                                onSelectConversation={setActiveConversationId}
                                onSendMessage={handleSendMessage}
                                onDeleteMessage={handleDeleteMessage}
                                onDeleteConversation={handleDeleteConversation}
                                onLoadMoreMessages={handleLoadMoreMessages}
                                currentUser={currentUser}
                            />
                        }
                    />
                    <Route
                        path="/profile"
                        element={
                            <RecruiterProfileScreen
                                onSwitchRole={onSwitchRole}
                                profile={profile}
                                setProfile={setProfile}
                                fetchRecruiterProfile={fetchRecruiterProfile}
                            />
                        }
                    />
                    <Route
                        path="/interviews"
                        element={
                            <InterviewsView currentUserId={currentUser.id} />
                        }
                    />
                    <Route
                        path="/onboardings"
                        element={
                            <OnboardingsView currentUserId={currentUser.id} />
                        }
                    />
                    {/* 默认重定向到dashboard */}
                    <Route path="*" element={<RecruiterDashboard
                        currentUser={currentUser}
                        jobs={jobs}
                        candidates={candidates}
                        profile={profile}
                        onSetIsPostModalOpen={setIsPostModalOpen}
                        onSetNewJob={setNewJob}
                        newJob={newJob}
                        onHandleGenerateJD={handleGenerateJD}
                        isGeneratingJD={isGeneratingJD}
                        aiSuggestions={aiSuggestions}
                        onHandleGetAiSuggestions={handleGetAiSuggestions}
                        isLoadingSuggestions={isLoadingSuggestions}
                        onHandlePostJob={handlePostJob}
                        onSetViewingJobId={setViewingJobId}
                    />} />
                </Routes>
            )}

            {/* Post Job Modal */}
            {(isPostModalOpen || isEditModalOpen) && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-gray-900">{isEditModalOpen ? '编辑职位' : '发布新职位'}</h2>
                                {isEditModalOpen && (
                                    <div className="flex items-center gap-2 text-sm">
                                        {autoSaveStatus === 'saving' && (
                                            <span className="text-yellow-600 flex items-center gap-1">
                                                <Clock className="w-4 h-4 animate-spin" />
                                                自动保存中...
                                            </span>
                                        )}
                                        {autoSaveStatus === 'saved' && (
                                            <span className="text-green-600 flex items-center gap-1">
                                                <CheckCircle className="w-4 h-4" />
                                                已自动保存
                                            </span>
                                        )}
                                        {autoSaveStatus === 'error' && (
                                            <span className="text-red-600 flex items-center gap-1">
                                                <XCircle className="w-4 h-4" />
                                                保存失败
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => {
                                    if (isEditModalOpen) {
                                        setIsEditModalOpen(false);
                                        setEditingJob(null);
                                    } else {
                                        setIsPostModalOpen(false);
                                    }
                                    setNewJob({ title: '', location: '深圳', salary: '', description: '', skills: [''], preferredSkills: [''], benefits: [''] });
                                }}
                                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <div className="flex justify-between items-center mb-1.5">
                                        <label className="block text-sm font-medium text-gray-700">职位名称</label>
                                        <button
                                            onClick={handleGenerateFullJob}
                                            disabled={isGeneratingFullJob}
                                            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium flex items-center gap-1"
                                        >
                                            {isGeneratingFullJob ? (
                                                <Clock className="w-3 h-3 animate-spin" />
                                            ) : (
                                                <Sparkles className="w-3 h-3" />
                                            )}
                                            {isGeneratingFullJob ? '生成中...' : 'AI一键填写'}
                                        </button>
                                    </div>
                                    <input
                                        type="text"
                                        value={newJob.title}
                                        onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                        placeholder="例如：前端开发工程师"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">工作地点</label>
                                    <input
                                        type="text"
                                        value={newJob.location}
                                        onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                        placeholder="例如：深圳"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">薪资范围</label>
                                    <input
                                        type="text"
                                        value={newJob.salary}
                                        onChange={(e) => setNewJob({ ...newJob, salary: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                        placeholder="例如：15-25K"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">所需技能</label>
                                    <div className="space-y-2">
                                        {newJob.skills.map((skill, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={skill}
                                                    onChange={(e) => {
                                                        const updatedSkills = [...newJob.skills];
                                                        updatedSkills[index] = e.target.value;
                                                        setNewJob({ ...newJob, skills: updatedSkills });
                                                    }}
                                                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                                    placeholder="例如：React"
                                                />
                                                {newJob.skills.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const updatedSkills = newJob.skills.filter((_, i) => i !== index);
                                                            setNewJob({ ...newJob, skills: updatedSkills });
                                                        }}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setNewJob({ ...newJob, skills: [...newJob.skills, ''] });
                                            }}
                                            className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 transition-colors"
                                        >
                                            <PlusCircle className="w-4 h-4" />
                                            添加技能
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">优先技能</label>
                                    <div className="space-y-2">
                                        {newJob.preferredSkills.map((skill, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={skill}
                                                    onChange={(e) => {
                                                        const updatedSkills = [...newJob.preferredSkills];
                                                        updatedSkills[index] = e.target.value;
                                                        setNewJob({ ...newJob, preferredSkills: updatedSkills });
                                                    }}
                                                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                                    placeholder="例如：Next.js"
                                                />
                                                {newJob.preferredSkills.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const updatedSkills = newJob.preferredSkills.filter((_, i) => i !== index);
                                                            setNewJob({ ...newJob, preferredSkills: updatedSkills });
                                                        }}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setNewJob({ ...newJob, preferredSkills: [...newJob.preferredSkills, ''] });
                                            }}
                                            className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 transition-colors"
                                        >
                                            <PlusCircle className="w-4 h-4" />
                                            添加优先技能
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">部门</label>
                                    <input
                                        type="text"
                                        value={newJob.department}
                                        onChange={(e) => setNewJob({ ...newJob, department: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                        placeholder="例如：技术部"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">招聘人数</label>
                                    <input
                                        type="number"
                                        value={newJob.hiringCount}
                                        onChange={(e) => setNewJob({ ...newJob, hiringCount: parseInt(e.target.value) || 1 })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                        placeholder="例如：1"
                                        min="1"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">经验要求</label>
                                    <select
                                        value={newJob.experience}
                                        onChange={(e) => setNewJob({ ...newJob, experience: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                    >
                                        <option value="应届毕业生">应届毕业生</option>
                                        <option value="1年以内">1年以内</option>
                                        <option value="1-3年">1-3年</option>
                                        <option value="3-5年">3-5年</option>
                                        <option value="5-10年">5-10年</option>
                                        <option value="10年以上">10年以上</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">过期日期</label>
                                    <input
                                        type="date"
                                        value={newJob.expireDate}
                                        onChange={(e) => setNewJob({ ...newJob, expireDate: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                        lang="zh-CN"
                                        title="选择过期日期"
                                        placeholder="YYYY-MM-DD"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">学历要求</label>
                                    <select
                                        value={newJob.degree}
                                        onChange={(e) => setNewJob({ ...newJob, degree: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                    >
                                        <option value="初中及以下">初中及以下</option>
                                        <option value="高中/中专">高中/中专</option>
                                        <option value="大专">大专</option>
                                        <option value="本科">本科</option>
                                        <option value="硕士">硕士</option>
                                        <option value="博士">博士</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">职位类型</label>
                                    <select
                                        value={newJob.type}
                                        onChange={(e) => setNewJob({ ...newJob, type: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                    >
                                        <option value="全职">全职</option>
                                        <option value="兼职">兼职</option>
                                        <option value="实习">实习</option>
                                        <option value="临时工">临时工</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">工作模式</label>
                                    <select
                                        value={newJob.workMode}
                                        onChange={(e) => setNewJob({ ...newJob, workMode: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                    >
                                        <option value="现场">现场</option>
                                        <option value="远程">远程</option>
                                        <option value="混合">混合</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">职位级别</label>
                                    <select
                                        value={newJob.jobLevel}
                                        onChange={(e) => setNewJob({ ...newJob, jobLevel: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                    >
                                        <option value="初级">初级</option>
                                        <option value="中级">中级</option>
                                        <option value="高级">高级</option>
                                        <option value="资深">资深</option>
                                        <option value="管理">管理</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">紧急程度</label>
                                    <select
                                        value={newJob.urgency}
                                        onChange={(e) => setNewJob({ ...newJob, urgency: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                    >
                                        <option value="普通">普通</option>
                                        <option value="紧急">紧急</option>
                                        <option value="非常紧急">非常紧急</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">公司福利</label>
                                    <div className="space-y-2">
                                        {newJob.benefits.map((benefit, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={benefit}
                                                    onChange={(e) => {
                                                        const updatedBenefits = [...newJob.benefits];
                                                        updatedBenefits[index] = e.target.value;
                                                        setNewJob({ ...newJob, benefits: updatedBenefits });
                                                    }}
                                                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                                    placeholder="例如：五险一金"
                                                />
                                                {newJob.benefits.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const updatedBenefits = newJob.benefits.filter((_, i) => i !== index);
                                                            setNewJob({ ...newJob, benefits: updatedBenefits });
                                                        }}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setNewJob({ ...newJob, benefits: [...newJob.benefits, ''] });
                                            }}
                                            className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 transition-colors"
                                        >
                                            <PlusCircle className="w-4 h-4" />
                                            添加公司福利
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-sm font-medium text-gray-700">职位描述</label>
                                    <button
                                        onClick={handleGenerateJD}
                                        disabled={isGeneratingJD || !newJob.title || !newJob.skills}
                                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-sm font-medium"
                                    >
                                        {isGeneratingJD ? '生成中...' : 'AI生成'}
                                    </button>
                                </div>
                                <textarea
                                    value={newJob.description}
                                    onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all min-h-[200px] resize-vertical"
                                    placeholder="详细描述职位职责、任职要求、公司福利等"
                                />
                            </div>

                            {/* 编辑模式下显示状态切换 */}
                            {isEditModalOpen && editingJob && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">职位状态</label>
                                    <select
                                        value={editingJob.status}
                                        onChange={(e) => setEditingJob({ ...editingJob, status: e.target.value as 'Active' | 'Closed' })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                    >
                                        <option value="Active">发布中</option>
                                        <option value="Closed">已关闭</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    if (isEditModalOpen) {
                                        setIsEditModalOpen(false);
                                        setEditingJob(null);
                                    } else {
                                        setIsPostModalOpen(false);
                                    }
                                    setNewJob({ title: '', location: '深圳', salary: '', description: '', skills: '' });
                                }}
                                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                            >
                                取消
                            </button>
                            <button
                                onClick={isEditModalOpen ? handleUpdateJob : handlePostJob}
                                disabled={!newJob.title || !newJob.description}
                                className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                            >
                                {isEditModalOpen ? '更新职位' : '发布职位'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </RecruiterLayout>
    );
};