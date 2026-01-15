import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Routes, Route, useParams, useNavigate, Navigate } from 'react-router-dom';
import {
    LayoutDashboard, Users, Briefcase, Settings, LogOut,
    Plus, PlusCircle, Search, Sparkles, MapPin, ChevronDown, User, FileText, CheckCircle, XCircle,
    Calendar, Clock, TrendingUp, TrendingDown, ArrowRight, Filter,
    Columns, ChevronLeft, Menu, Shield, Trash2
} from 'lucide-react';
import { message } from 'antd';
import { generateJobDescription, generateRecruitmentSuggestions, generateFullJobInfo } from '@/services/aiService';
import { userAPI, jobAPI, candidateAPI, recruiterAPI, messageAPI, companyAPI, interviewAPI } from '@/services/apiService';
import { socketService } from '@/services/socketService';
import { UserRole, JobPosting, Conversation } from '@/types/types';
import { processAvatarUrl } from '@/components/AvatarUploadComponent';

// 导入拆分后的组件
import RecruiterMessageScreen from './components/RecruiterMessageScreen';
import RecruiterJobDetail from './components/RecruiterJobDetail';
import RecruiterProfileScreen from './components/RecruiterProfileScreen';
import CertificationScreen from './screens/CertificationScreen'; // Import CertificationScreen
import { InputField, MessageAlert } from './components/CommonComponents';
import { CandidateDetailModal } from './components/CandidateDetailModal';

// 导入布局和页面组件
import { RecruiterLayout } from './components/RecruiterLayout';
import { RecruiterDashboard } from './screens/RecruiterDashboard';
import { JobsView } from './views/JobsView';
import { CandidatesView } from './views/CandidatesView';
import InterviewsView from './views/InterviewsView';
import OnboardingsView from './views/OnboardingsView';

// 导入主题和国际化Provider
import { ThemeProvider } from '@/contexts/ThemeContext';
import { I18nProvider } from '@/contexts/i18nContext';

interface RecruiterAppProps {
    onLogout: () => void;
    onSwitchRole: (role: UserRole) => void;
    currentUser: any;
}

export const RecruiterApp: React.FC<RecruiterAppProps> = ({ onLogout, onSwitchRole, currentUser }) => {
    const navigate = useNavigate();
    // 初始化视图状态，检查是否需要认证
    const initialView = currentUser.needs_verification ? 'profile' : 'dashboard';
    const [jobs, setJobs] = useState<JobPosting[]>([]);
    const [candidates, setCandidates] = useState<any[]>([]);
    const [conversations, setConversations] = useState<any[]>([]);
    const [interviews, setInterviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const activeConversationIdRef = useRef<string | null>(null);
    const joinedConversationIdRef = useRef<string | null>(null);

    // Modals
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    // Forms & Selections
    const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);
    const [editingJob, setEditingJob] = useState<any>(null);

    // Sync ref
    useEffect(() => {
        activeConversationIdRef.current = activeConversationId;
    }, [activeConversationId]);

    // Function to open candidate detail modal
    const onViewDetails = (candidate: any) => {
        setSelectedCandidate(candidate);
        setIsDetailModalOpen(true);
    };


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

    // Sync profile with currentUser prop updates (especially avatar and other user fields)
    useEffect(() => {
        if (currentUser) {
            setProfile(prev => ({
                ...prev,
                id: currentUser.id,
                name: currentUser.name,
                email: currentUser.email,
                phone: currentUser.phone,
                avatar: currentUser.avatar || prev.avatar,
                position: prev.position // Keep position from profile as it may not be in currentUser
            }));
        }
    }, [currentUser.id, currentUser.name, currentUser.email, currentUser.phone, currentUser.avatar]);

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
    // 缓存有效期（1分钟）
    const CACHE_DURATION = 60 * 1000;

    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleRefresh = () => {
        setCache({}); // Clear cache
        setRefreshTrigger(prev => prev + 1); // Trigger fetch
    };

    // 获取招聘者数据 - 优化版，实现并行加载和优先级渲染
    useEffect(() => {
        const fetchRecruiterData = async () => {
            try {
                const now = Date.now();
                const token = localStorage.getItem('token');
                if (!token) {
                    setLoading(false);
                    return;
                }

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
                const fetchConversations = messageAPI.getConversations(currentUser.id, 'recruiter');
                const fetchInterviews = interviewAPI.getAllInterviews();
                const fetchProfile = fetchRecruiterProfile();

                // 并行处理所有请求
                const [jobsResponse, candidatesResponse, conversationsResponse, interviewsResponse, profileData] = await Promise.all([
                    fetchJobs,
                    fetchCandidates,
                    fetchConversations,
                    fetchInterviews,
                    fetchProfile
                ]);

                // 从响应中提取数据数组
                const jobsData = jobsResponse.data || [];
                const candidatesData = candidatesResponse.data || [];
                const realConversations = conversationsResponse.data || [];
                const allInterviews = (interviewsResponse as any).data || [];

                // Get Recruiter ID from profile data (profileData includes recruiter info)
                const currentRecruiterId = profileData ? profileData.id : null;

                // Filter interviews for the current recruiter
                const myInterviews = currentRecruiterId
                    ? allInterviews.filter((i: any) => i.interviewerId === currentRecruiterId)
                    : [];

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
                    status: job.status === 'active' || job.status === 'Active' ? 'active' : 'closed',
                    postedDate: job.posted_date || job.postedDate || job.publish_date ? new Date(job.posted_date || job.postedDate || job.publish_date).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date(job.created_at || job.updated_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }),
                    expire_date: job.expire_date,
                    updated_at: job.updated_at || job.created_at,
                    is_own_job: job.is_own_job || false,
                    required_skills: job.required_skills,
                    preferred_skills: job.preferred_skills,
                    benefits: job.benefits,
                    experience: job.experience,
                    degree: job.degree,
                    work_mode: job.work_mode,
                    job_level: job.job_level,
                    hiring_count: job.hiring_count,
                    urgency: job.urgency
                }));

                // 映射候选人数据
                const filteredCandidates = candidatesData.map((candidate: any) => ({
                    id: candidate.application_id || candidate.id, // Use application ID as unique row ID
                    candidateId: candidate.id,
                    userId: candidate.user_id,
                    candidateName: candidate.name || '未知候选人',
                    jobId: candidate.job_id,
                    jobTitle: candidate.job_title || '未知职位',
                    companyName: profile.company?.name || 'My Company',
                    stage: candidate.stage || 'New',
                    appliedDate: candidate.applied_date ? new Date(candidate.applied_date).toLocaleDateString() : '刚刚',
                    matchScore: Math.floor(Math.random() * 30) + 70, // Mock score for now as backend doesn't provide it
                    skills: candidate.skills || [],
                    experience: candidate.years_of_experience ? `${candidate.years_of_experience}年` : '经验不限',
                    education: candidate.education || '学历不限',
                    school: candidate.school || '',
                    currentPosition: candidate.current_position || '',
                    avatar: candidate.avatar,
                    latestInterviewTime: candidate.latest_interview_date ? `${new Date(candidate.latest_interview_date).toLocaleDateString()} ${candidate.latest_interview_time?.slice(0, 5) || ''}` : null,
                    latestInterviewStatus: candidate.latest_interview_status,
                    applicationResume: candidate.application_resume_url ? {
                        url: candidate.application_resume_url,
                        name: candidate.application_resume_name
                    } : null
                }));

                // 更新主要数据
                setJobs(filteredJobs);
                setCandidates(filteredCandidates);

                // 重点：更新对话列表时，保留已有的消息记录，避免刷新导致消息区域闪烁或变白
                setConversations(prevConversations => {
                    return realConversations.map((newConv: any) => {
                        const existingConv = prevConversations.find(c => c.id === newConv.id);
                        return {
                            ...newConv,
                            messages: existingConv ? (existingConv.messages || []) : []
                        };
                    });
                });


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
    }, [currentUser.id, refreshTrigger]); // 依赖 refreshTrigger 来触发手动刷新



    // 定时刷新对话列表，确保消息实时更新
    // Socket.IO Integration
    useEffect(() => {
        if (currentUser?.id) {
            const socket = socketService.connect(currentUser.id);

            socketService.onNewMessage((message: any) => {
                console.log('Received new message via socket:', message);

                setConversations(prevConversations => {
                    const conversationExists = prevConversations.some(c => c.id.toString() === message.conversation_id.toString());

                    if (conversationExists) {
                        return prevConversations.map(conv => {
                            if (conv.id.toString() === message.conversation_id.toString()) {
                                const currentActiveId = activeConversationIdRef.current;
                                const isCurrentConversation = currentActiveId && currentActiveId.toString() === message.conversation_id.toString();

                                // Deduplication: Check if message ID triggers a duplicate
                                const existingMessages = conv.messages || [];
                                // 1. Check by ID (string comparison for safety)
                                if (existingMessages.some((m: any) => m.id?.toString() === message.id?.toString())) {
                                    return conv;
                                }
                                // 2. Check by content + time proximity (fuzzy match for optimistic updates)
                                // If the message is from ME (current user) and we have a very recent message with same text, ignore it.
                                const isFromMe = message.sender_id.toString() === currentUser.id.toString();
                                if (isFromMe) {
                                    // Find if we have a recent message (last 2 seconds) with same text
                                    // (Assuming optimistic update adds it to the end)
                                    const lastMsg = existingMessages[existingMessages.length - 1];
                                    if (lastMsg &&
                                        lastMsg.text === message.text &&
                                        (Date.now() - new Date(lastMsg.time).getTime() < 5000)) {
                                        // Update the optimistic message with real ID/Data instead of adding new one
                                        const updatedMessages = [...existingMessages];
                                        updatedMessages[updatedMessages.length - 1] = {
                                            ...message,
                                            sender_name: message.sender_name || '对方', // Ensure consistency
                                            sender_avatar: message.sender_avatar || ''
                                        };
                                        return {
                                            ...conv,
                                            messages: updatedMessages,
                                            lastMessage: message.type === 'text' ? message.text : '[图片]',
                                            lastTime: message.time
                                        };
                                    }
                                }

                                return {
                                    ...conv,
                                    lastMessage: message.type === 'text' ? message.text : '[图片]',
                                    lastTime: message.time || new Date().toISOString(),
                                    updated_at: message.time || new Date().toISOString(),
                                    total_messages: (conv.total_messages || 0) + 1,
                                    recruiterUnread: isCurrentConversation ? 0 : (conv.recruiterUnread || 0) + 1, // Recruiter unread logic
                                    unreadCount: isCurrentConversation ? 0 : (conv.unreadCount || 0) + 1, // Fallback
                                    messages: [...existingMessages, {
                                        ...message,
                                        sender_name: message.sender_name || '对方',
                                        sender_avatar: message.sender_avatar || ''
                                    }]
                                };
                            }
                            return conv;
                        });
                    } else {
                        // New conversation? Fetch everything
                        console.log('New conversation detected, refreshing lists...');

                        // 1. Refresh Candidates to show new applicant
                        recruiterAPI.getCandidates(currentUser.id).then(res => {
                            if ((res as any).status === 'success') {
                                const candidatesData = res.data || [];
                                const filteredCandidates = candidatesData.map((candidate: any) => ({
                                    id: candidate.application_id || candidate.id,
                                    candidateId: candidate.id,
                                    userId: candidate.user_id,
                                    candidateName: candidate.name || '未知候选人',
                                    jobId: candidate.job_id,
                                    jobTitle: candidate.job_title || '未知职位',
                                    companyName: profile.company?.name || 'My Company',
                                    stage: candidate.stage || 'New',
                                    appliedDate: candidate.applied_date ? new Date(candidate.applied_date).toLocaleDateString() : '刚刚',
                                    matchScore: Math.floor(Math.random() * 30) + 70,
                                    skills: candidate.skills || [],
                                    experience: candidate.years_of_experience ? `${candidate.years_of_experience}年` : '经验不限',
                                    education: candidate.education || '学历不限',
                                    school: candidate.school || '',
                                    currentPosition: candidate.current_position || '',
                                    avatar: candidate.avatar,
                                    latestInterviewTime: candidate.latest_interview_date ? `${new Date(candidate.latest_interview_date).toLocaleDateString()} ${candidate.latest_interview_time?.slice(0, 5) || ''}` : null,
                                    latestInterviewStatus: candidate.latest_interview_status,
                                    applicationResume: candidate.application_resume_url ? {
                                        url: candidate.application_resume_url,
                                        name: candidate.application_resume_name
                                    } : null
                                }));
                                setCandidates(filteredCandidates);
                            }
                        }).catch(err => console.error('Failed to refresh candidates:', err));

                        // 2. Refresh Conversations to show new chat
                        messageAPI.getConversations(currentUser.id, 'recruiter').then(res => {
                            if ((res as any).status === 'success') {
                                const realConversations = res.data || [];
                                setConversations(prevDeps => {
                                    return realConversations.map((newConv: any) => {
                                        const existingConv = prevDeps.find(c => c.id === newConv.id);
                                        return {
                                            ...newConv,
                                            messages: existingConv ? (existingConv.messages || []) : []
                                        };
                                    });
                                });
                            }
                        }).catch(err => console.error('Failed to refresh conversations:', err));

                        return prevConversations;
                    }
                });
            });

            const handleMessageUpdated = (updatedMessage: any) => {
                console.log('Received message update (Recruiter):', updatedMessage);
                setConversations(prevConversations => {
                    return prevConversations.map(conv => {
                        if (conv.id.toString() === updatedMessage.conversation_id.toString()) {
                            return {
                                ...conv,
                                messages: (conv.messages || []).map(m =>
                                    m.id?.toString() === updatedMessage.id?.toString() ? { ...m, ...updatedMessage } : m
                                )
                            };
                        }
                        return conv;
                    });
                });
            };

            socketService.onMessageUpdated(handleMessageUpdated);

            const handleConversationUpdated = (updatedConversation: any) => {
                if (!updatedConversation?.id) return;
                setConversations(prevConversations => {
                    return prevConversations.map(conv => {
                        if (conv.id.toString() !== updatedConversation.id.toString()) return conv;

                        const candidateUnread = updatedConversation.candidate_unread ?? updatedConversation.candidateUnread;
                        const recruiterUnread = updatedConversation.recruiter_unread ?? updatedConversation.recruiterUnread;
                        const updatedAt = updatedConversation.updated_at ?? updatedConversation.updatedAt;

                        return {
                            ...conv,
                            candidateUnread: candidateUnread ?? conv.candidateUnread,
                            recruiterUnread: recruiterUnread ?? conv.recruiterUnread,
                            unreadCount: recruiterUnread ?? conv.unreadCount,
                            updated_at: updatedAt ?? conv.updated_at
                        };
                    });
                });
            };

            socketService.onConversationUpdated(handleConversationUpdated);
        }

        return () => {
            socketService.disconnect();
            socketService.offNewMessage();
            socketService.offMessageUpdated();
            socketService.offConversationUpdated();
        };
    }, [currentUser.id]);

    // Join conversation room
    useEffect(() => {
        if (activeConversationId) {
            const prevJoinedId = joinedConversationIdRef.current;
            if (prevJoinedId && prevJoinedId.toString() !== activeConversationId.toString()) {
                socketService.leaveConversation(prevJoinedId);
            }
            socketService.joinConversation(activeConversationId);
            joinedConversationIdRef.current = activeConversationId;
        }
    }, [activeConversationId]);

    // Fallback Polling (5 mins)
    useEffect(() => {
        const refreshInterval = setInterval(async () => {
            try {
                if (document.visibilityState === 'visible') {
                    const conversationsResponse = await messageAPI.getConversations(currentUser.id, 'recruiter');
                    const realConversations = conversationsResponse.data || [];

                    setConversations(prevConversations => {
                        if (realConversations.length !== prevConversations.length) {
                            return realConversations.map((newConv: any) => {
                                const exist = prevConversations.find(p => p.id === newConv.id);
                                return exist ? { ...newConv, messages: exist.messages } : newConv;
                            });
                        }

                        let hasChanges = false;
                        const updatedConversations = prevConversations.map(prevConv => {
                            const newConv = realConversations.find((c: any) => c.id === prevConv.id);
                            if (newConv && newConv.updated_at !== prevConv.updated_at) {
                                hasChanges = true;
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
        }, 300000); // 5分钟

        return () => clearInterval(refreshInterval);
    }, [currentUser.id]);



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
                        if (conv.id.toString() === activeConversationId.toString()) {
                            // Merge and deduplicate
                            const existing = conv.messages || [];
                            const newMessages = offset === 0 ? sortedMessages : sortedMessages;

                            // Create a map by ID for deduplication
                            const mergedMap = new Map();

                            if (offset > 0) {
                                // If loading more (history), new messages come FIRST (chronologically earlier but in list view they affect top)
                                // Actually sortedMessages are older messages. existing are newer.
                                // We want to combine [sortedMessages (older), existing (newer)].
                                // But handle overlap.
                                newMessages.forEach((m: any) => mergedMap.set(m.id.toString(), m));
                                existing.forEach((m: any) => mergedMap.set(m.id.toString(), m));
                            } else {
                                // If offset 0 (refresh/initial), we prefer backend results, but might want to keep some local state?
                                // Actually offset 0 means "latest messages", so it should mostly replace.
                                // But if we have *more* messages locally than returned (unlikely unless pagination limit < local count),
                                // safe bet is to just use new messages OR merge carefully.
                                // Simpler approach for now: Replace with backend source of truth for offset 0, 
                                // BUT ensuring we don't lose anything if backend only returns 20 and we had 25.
                                // Actually, standard behavior is reset on offset 0.
                                newMessages.forEach((m: any) => mergedMap.set(m.id.toString(), m));
                            }

                            // Convert back to array and sort
                            const finalMessages = Array.from(mergedMap.values()).sort((a: any, b: any) =>
                                new Date(a.time).getTime() - new Date(b.time).getTime()
                            );

                            return {
                                ...conv,
                                messages: finalMessages,
                                total_messages: total // 更新总消息数
                            };
                        }
                        return conv;
                    }));
                }
            } catch (error) {
                console.error('获取对话消息失败:', error);
            } finally {
                setMessagesLoading(false);
            }
        };


        fetchConversationMessages();
    }, [activeConversationId]); // 只依赖activeConversationId，避免重复加载

    // 自动选择第一个对话（仅在初始加载时）
    useEffect(() => {
        if (conversations.length > 0 && !activeConversationId) {
            // 延迟选择第一个对话，确保UI已渲染
            const timer = setTimeout(() => {
                setActiveConversationId(conversations[0].id.toString());
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [conversations.length]); // 只在对话数量变化时检查

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
                        conv.id.toString() === conversationId.toString()
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
    // Post Job Modal State (newJob form)
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
    // Edit Job Modal State

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
        const description = await generateJobDescription(newJob.title, newJob.skills.join(','));
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
                    ...newJobFromDB,
                    id: newJobFromDB.id,
                    title: newJobFromDB.title,
                    department: newJobFromDB.department || '',
                    location: newJobFromDB.location,
                    salary: newJobFromDB.salary || '面议',
                    description: newJobFromDB.description || '',
                    type: newJobFromDB.type || '全职',
                    posterId: newJobFromDB.recruiter_id,
                    recruiter_id: newJobFromDB.recruiter_id,
                    recruiter_name: currentUser.name,
                    recruiter_avatar: processAvatarUrl(currentUser.avatar),
                    recruiter_position: profile.position || '未知职位',
                    applicants: newJobFromDB.applications_count || 0,
                    status: newJobFromDB.status === 'active' || newJobFromDB.status === 'Active' ? 'active' : 'closed',
                    postedDate: new Date(newJobFromDB.publish_date || newJobFromDB.created_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }),
                    required_skills: newJobFromDB.required_skills || [],
                    preferred_skills: newJobFromDB.preferred_skills || [],
                    benefits: newJobFromDB.benefits || [],
                    experience: newJobFromDB.experience,
                    degree: newJobFromDB.degree,
                    work_mode: newJobFromDB.work_mode,
                    job_level: newJobFromDB.job_level,
                    hiring_count: newJobFromDB.hiring_count,
                    urgency: newJobFromDB.urgency,
                    company: newJobFromDB.company || profile.company.name || '未设置公司',
                    company_name: newJobFromDB.company || profile.company.name || '未设置公司',
                    expire_date: newJobFromDB.expire_date,
                    updated_at: newJobFromDB.updated_at || newJobFromDB.created_at || new Date().toISOString(),
                    is_own_job: true
                };

                // 立即更新jobs状态
                setJobs(prevJobs => [mappedNewJob, ...prevJobs]);

                // 关闭模态框
                setIsPostModalOpen(false);

                // 重置表单
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

                // 显示成功提示
                message.success(`职位"${mappedNewJob.title}"发布成功！`);

                // Update cache to prevent UI flashing when refresh triggers
                setCache(prev => ({
                    ...prev,
                    jobs: [mappedNewJob, ...(prev.jobs || [])],
                    lastUpdated: Date.now()
                }));

                // Trigger unified data refresh to ensure consistency
                setRefreshTrigger(prev => prev + 1);
            } else {
                // API返回失败
                message.error('发布职位失败：' + ((response as any).message || '未知错误'));
            }
        } catch (error) {
            console.error('发布职位失败:', error);
            message.error('发布职位失败，请稍后重试');
        }
    };

    // 编辑职位处理函数
    const handleEditJob = (job: JobPosting) => {
        console.log('编辑职位数据:', job); // 调试日志

        // 安全地处理JSONB数组字段 - 有多少个值就显示多少个输入框
        const parseJsonbArray = (field: any, fieldName: string): string[] => {
            console.log(`解析${fieldName}:`, field, 'type:', typeof field);

            // 如果字段为空，返回空数组（不显示任何输入框）
            if (!field || field === null || field === undefined) {
                console.log(`${fieldName}为空，返回[]`);
                return [];
            }

            // 如果是数组，直接返回（不添加空字符串）
            if (Array.isArray(field)) {
                const result = field.filter(Boolean); // 过滤掉空值
                console.log(`${fieldName}是数组，返回:`, result);
                return result;
            }

            // 如果是字符串，尝试解析
            if (typeof field === 'string') {
                try {
                    const parsed = JSON.parse(field);
                    if (Array.isArray(parsed)) {
                        const result = parsed.filter(Boolean); // 过滤掉空值
                        console.log(`${fieldName}是JSON字符串，解析后返回:`, result);
                        return result;
                    }
                } catch {
                    // Fallback for comma-separated string
                    const items = field.split(',').map(s => s.trim()).filter(Boolean);
                    console.log(`${fieldName}是逗号分隔字符串，返回:`, items);
                    return items;
                }
            }

            console.log(`${fieldName}无法解析，返回[]`);
            return [];
        };

        setEditingJob(job);
        const parsedNewJob = {
            title: job.title || '',
            location: job.location || '深圳',
            salary: job.salary || '',
            description: job.description || '',
            skills: parseJsonbArray(job.required_skills, '所需技能'),
            preferredSkills: parseJsonbArray(job.preferred_skills, '优先技能'),
            experience: job.experience || '1-3年',
            degree: job.degree || '本科',
            type: job.type || '全职',
            workMode: job.work_mode || '现场',
            jobLevel: job.job_level || '初级',
            hiringCount: job.hiring_count || 1,
            urgency: job.urgency || '普通',
            department: job.department || '',
            benefits: parseJsonbArray(job.benefits, '福利待遇'),
            expireDate: job.expire_date ? (() => {
                const d = new Date(job.expire_date);
                if (isNaN(d.getTime())) return '';
                return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            })() : ''
        };

        console.log('设置newJob为:', parsedNewJob);
        setNewJob(parsedNewJob);
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
                status: editingJob.status === 'active' ? 'active' : 'closed' // 转换为数据库期望的格式
            };

            console.log('更新职位数据:', jobData); // 调试日志

            // 调用API更新职位
            const response = await jobAPI.updateJob(editingJob.id, jobData);

            // 如果API调用成功，更新本地状态
            if ((response as any).status === 'success') {
                const updatedJob = response.data;
                // 映射更新后的职位数据，确保格式一致
                const mappedUpdatedJob = {
                    ...editingJob,
                    ...updatedJob,
                    id: updatedJob.id,
                    title: updatedJob.title,
                    company: updatedJob.company || editingJob.company,
                    company_name: updatedJob.company || editingJob.company,
                    location: updatedJob.location,
                    salary: updatedJob.salary,
                    description: updatedJob.description,
                    experience: updatedJob.experience || '1-3年',
                    degree: updatedJob.degree || '本科',
                    type: updatedJob.type || '全职',
                    work_mode: updatedJob.work_mode || '现场',
                    job_level: updatedJob.job_level || '初级',
                    hiring_count: updatedJob.hiring_count || 1,
                    urgency: updatedJob.urgency || '普通',
                    department: updatedJob.department || '',
                    required_skills: updatedJob.required_skills || [],
                    preferred_skills: updatedJob.preferred_skills || [],
                    benefits: updatedJob.benefits || [],
                    expire_date: updatedJob.expire_date,
                    status: updatedJob.status === 'active' || updatedJob.status === 'Active' ? 'active' : 'closed',
                    updated_at: updatedJob.updated_at || new Date().toISOString(), // 使用数据库返回的updated_at字段
                    is_own_job: editingJob.is_own_job !== undefined ? editingJob.is_own_job : true
                };
                setJobs(prevJobs => prevJobs.map(job => job.id.toString() === editingJob.id.toString() ? mappedUpdatedJob : job));
                setIsEditModalOpen(false);
                setEditingJob(null);
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
                // 显示成功提示
                message.success(`职位"${updatedJob.title}"更新成功！`);

                // 重新获取职位列表以确保数据同步
                setTimeout(async () => {
                    try {
                        const jobsResponse = await recruiterAPI.getJobs(currentUser.id);
                        const jobsData = jobsResponse.data || [];
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
                            recruiter_avatar: processAvatarUrl(job.recruiter_avatar),
                            recruiter_position: job.recruiter_position || '未知职位',
                            applicants: job.applicants || job.applications_count || 0,
                            status: job.status === 'active' || job.status === 'Active' ? 'active' : 'closed',
                            postedDate: new Date(job.publish_date || job.created_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }),
                            required_skills: job.required_skills || [],
                            preferred_skills: job.preferred_skills || [],
                            benefits: job.benefits || [],
                            experience: job.experience || '',
                            degree: job.degree || '',
                            work_mode: job.work_mode || '现场',
                            job_level: job.job_level || '初级',
                            hiring_count: job.hiring_count || 1,
                            urgency: job.urgency || '普通',
                            expire_date: job.expire_date,
                            updated_at: job.updated_at || job.created_at,
                            is_own_job: job.is_own_job || false
                        }));
                        setJobs(filteredJobs);
                    } catch (error) {
                        console.error('刷新职位列表失败:', error);
                    }
                }, 500);
            } else {
                // API返回失败
                message.error('更新职位失败：' + ((response as any).message || '未知错误'));
            }
        } catch (error) {
            console.error('更新职位失败:', error);
            message.error('更新职位失败，请稍后重试');
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



    // 查看职位处理函数
    const handleViewJob = (jobId: number | string) => {
        setViewingJobId(jobId);
        navigate(`/recruiter/jobs/${jobId}`);
    };

    const handleSendMessage = async (text: string, type: any = 'text', quotedMessage?: { id: string | number | null, text: string, senderName: string | null, type?: string }) => {
        if (!activeConversationId) return;
        // 对于exchange_request类型的消息，允许text为空
        if (!text && type !== 'exchange_request') return;

        try {
            // 获取当前对话
            const activeConv = conversations.find(conv => conv.id.toString() === activeConversationId.toString());
            if (!activeConv) return;

            // 发送消息到后端
            // 确保receiverId是users表中的id，而不是candidates表中的id
            // 优先使用 candidateUserId 或 recruiterUserId
            const receiverId = activeConv.candidateUserId || activeConv.candidate_user_id || activeConv.candidateId || activeConv.candidate_id;
            if (!receiverId) {
                console.error('无法获取接收者ID');
                return;
            }

            // 构建quoted_message对象
            const quoted_message = quotedMessage && quotedMessage.id ? {
                id: quotedMessage.id,
                text: quotedMessage.text,
                sender_name: quotedMessage.senderName,
                type: quotedMessage.type || 'text'
            } : undefined;

            const response = await messageAPI.sendMessage({
                conversationId: activeConversationId,
                senderId: currentUser.id,
                receiverId,
                text,
                type,
                quoted_message
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
                    status: 'sent',
                    quoted_message
                };

                // 如果对话有messages数组，直接添加新消息
                if (activeConv.messages) {
                    setConversations(prev => prev.map(conv => {
                        if (conv.id.toString() === activeConversationId.toString()) {
                            // Deduplication: Check if message (from socket) already exists
                            const msgExists = conv.messages.some((m: any) => m.id.toString() === newMessage.id.toString());
                            if (msgExists) {
                                return conv;
                            }
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
                if (conv.id.toString() === conversationId.toString()) {
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
            // 优化：改为"隐藏"而非"删除"，以避免用户回复后收不到消息的问题
            await messageAPI.updateConversationStatus(conversationId, {
                role: 'recruiter',
                action: 'hide'
            });

            // 乐观更新：从列表中移除
            setConversations(prev => prev.filter(conv => conv.id.toString() !== conversationId.toString()));

            // 如果隐藏的是当前选中的对话，清除选中状态
            if (activeConversationId === conversationId) {
                setActiveConversationId(null);
            }
            // message.success('会话已隐藏');
        } catch (error) {
            console.error('隐藏对话失败:', error);
        }
    };

    const handlePinConversation = async (conversationId: string, isPinned: boolean) => {
        try {
            await messageAPI.updateConversationStatus(conversationId, {
                role: 'recruiter',
                action: isPinned ? 'unpin' : 'pin'
            });

            setConversations(prev => {
                const updated = prev.map(conv => {
                    if (conv.id.toString() === conversationId.toString()) {
                        return { ...conv, recruiterPinned: !isPinned };
                    }
                    return conv;
                });

                // Re-sort: Pinned first, then time
                return updated.sort((a: any, b: any) => {
                    if (a.recruiterPinned !== b.recruiterPinned) {
                        return a.recruiterPinned ? -1 : 1;
                    }
                    const timeA = new Date(a.updatedAt || a.updated_at).getTime();
                    const timeB = new Date(b.updatedAt || b.updated_at).getTime();
                    return timeB - timeA;
                });
            });
        } catch (error) {
            console.error('置顶操作失败:', error);
        }
    };

    const handleHideConversation = async (conversationId: string) => {
        try {
            await messageAPI.updateConversationStatus(conversationId, {
                role: 'recruiter',
                action: 'hide'
            });

            // Optimistic removal
            setConversations(prev => prev.filter(conv => conv.id.toString() !== conversationId.toString()));

            if (activeConversationId === conversationId) {
                setActiveConversationId(null);
            }
        } catch (error) {
            console.error('隐藏会话失败:', error);
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
                currentUserId={currentUser.id}
                currentUser={{
                    name: currentUser.name,
                    position: profile.position
                }}
                companyAddress={profile.company.address}
                jobs={jobs}
                onEditJob={handleEditJob}
                onViewCandidate={(candidate) => {
                    setSelectedCandidate(candidate);
                    setIsDetailModalOpen(true);
                }}
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
        <ThemeProvider>
            <I18nProvider>
                <RecruiterLayout onLogout={onLogout} onSwitchRole={onSwitchRole} currentUser={profile}>
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
                                        interviews={interviews}
                                        unreadMessageCount={conversations.reduce((sum, conv) => sum + (conv.recruiterUnread || conv.unreadCount || 0), 0)}
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
                                        onLogout={onLogout}
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
                                    <CandidatesView
                                        candidates={candidates}
                                        currentUserId={currentUser.id}
                                        onRefresh={handleRefresh}
                                        onSendMessage={async (candidate) => {
                                            try {
                                                if (!candidate.userId) {
                                                    message.error('无法发起对话：缺少候选人用户ID');
                                                    return;
                                                }

                                                // 1. Check if conversation already exists with this candidate (by UserID)
                                                // 1. Check if conversation already exists with this candidate
                                                // We need to match existing conversation's candidateId (Candidate Table ID) with the candidate's ID
                                                const existingConv = conversations.find(c =>
                                                    c.candidateId && c.candidateId.toString() === candidate.candidateId.toString()
                                                );

                                                if (existingConv) {
                                                    // Conversation exists, select it
                                                    setActiveConversationId(existingConv.id);
                                                    // Navigate to messages
                                                    navigate('/recruiter/messages/' + existingConv.id);
                                                } else {
                                                    // 2. Create new conversation
                                                    message.loading({ content: '正在创建对话...', key: 'createConv' });

                                                    // Need to call API to create conversation
                                                    // We'll use a simple initial message or just create
                                                    const res = await messageAPI.createConversationAndSendMessage({
                                                        jobId: candidate.jobId,
                                                        candidateId: candidate.userId, // Backend expects User ID for candidate creation lookup
                                                        recruiterId: currentUser.id,
                                                        message: `您好，我对您申请的${candidate.jobTitle}职位很感兴趣。`
                                                    });

                                                    if ((res as any).status === 'success') {
                                                        message.success({ content: '对话创建成功', key: 'createConv' });
                                                        // Refresh conversations
                                                        const convRes = await messageAPI.getConversations(currentUser.id, 'recruiter');
                                                        if ((convRes as any).status === 'success') {
                                                            setConversations(convRes.data);
                                                            // Find the new conversation
                                                            // Either from response or by filtering new list
                                                            // The response usually contains the created conversation
                                                            const newConvId = (res as any).data.conversation_id || (res as any).data.id;
                                                            if (newConvId) {
                                                                setActiveConversationId(newConvId);
                                                                navigate('/recruiter/messages/' + newConvId);
                                                            }
                                                        }
                                                    } else {
                                                        message.error({ content: '创建对话失败', key: 'createConv' });
                                                    }
                                                }
                                            } catch (err) {
                                                console.error('发送消息失败:', err);
                                                message.error('操作失败，请重试');
                                            }
                                        }}
                                        onViewDetails={(candidate) => {
                                            setSelectedCandidate(candidate);
                                            setIsDetailModalOpen(true);
                                        }}
                                    />
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
                                        currentUser={{ ...currentUser, ...profile }}
                                        isMessagesLoading={messagesLoading}
                                        onPinConversation={handlePinConversation}
                                        onHideConversation={handleHideConversation}
                                        currentUserId={Number(currentUser?.id || 0)}
                                        companyAddress={profile.company.address}
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
                                        currentUser={{ ...currentUser, ...profile }}
                                        isMessagesLoading={messagesLoading}
                                        onPinConversation={handlePinConversation}
                                        onHideConversation={handleHideConversation}
                                        currentUserId={Number(currentUser?.id || 0)}
                                        companyAddress={profile.company.address}
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
                            {/* Catch-all route to prevent blank screen */}
                            <Route path="*" element={<Navigate to="/recruiter/dashboard" replace />} />
                            <Route
                                path="/certification"
                                element={
                                    <CertificationScreen
                                        currentUser={currentUser}
                                        onCertificationSubmitted={() => {
                                            // Refresh profile/status logic could go here
                                            fetchRecruiterProfile();
                                        }}
                                    />
                                }
                            />
                        </Routes>
                    )}

                    {/* Post Job Modal */}
                    {(isPostModalOpen || isEditModalOpen) && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700">
                                <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 sticky top-0 z-10">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{isEditModalOpen ? '编辑职位' : '发布新职位'}</h2>

                                    </div>
                                    <button
                                        onClick={() => {
                                            if (isEditModalOpen) {
                                                setIsEditModalOpen(false);
                                                setEditingJob(null);
                                            } else {
                                                setIsPostModalOpen(false);
                                            }
                                            setNewJob({ title: '', location: '深圳', salary: '', description: '', skills: [''], preferredSkills: [''], experience: '1-3年', degree: '本科', type: '全职', workMode: '现场', jobLevel: '初级', hiringCount: 1, urgency: '普通', department: '', benefits: [''], expireDate: '' });
                                        }}
                                        className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        <XCircle className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="p-6 space-y-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <div className="flex justify-between items-center mb-1.5">
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">职位名称</label>
                                                <button
                                                    onClick={handleGenerateFullJob}
                                                    disabled={isGeneratingFullJob}
                                                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium flex items-center gap-1 shadow-sm shadow-blue-500/20"
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
                                                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white dark:bg-slate-700 dark:text-slate-100 placeholder-slate-400"
                                                placeholder="例如：前端开发工程师"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">工作地点</label>
                                            <input
                                                type="text"
                                                value={newJob.location}
                                                onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                                                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white dark:bg-slate-700 dark:text-slate-100 placeholder-slate-400"
                                                placeholder="例如：深圳"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">薪资范围</label>
                                            <input
                                                type="text"
                                                value={newJob.salary}
                                                onChange={(e) => setNewJob({ ...newJob, salary: e.target.value })}
                                                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white dark:bg-slate-700 dark:text-slate-100 placeholder-slate-400"
                                                placeholder="例如：15-25K"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">所需技能</label>
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
                                                            className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white dark:bg-slate-700 dark:text-slate-100 placeholder-slate-400"
                                                            placeholder="例如：React"
                                                        />
                                                        {newJob.skills.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const updatedSkills = newJob.skills.filter((_, i) => i !== index);
                                                                    setNewJob({ ...newJob, skills: updatedSkills });
                                                                }}
                                                                className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
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
                                                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors dark:text-blue-400 dark:hover:text-blue-300"
                                                >
                                                    <PlusCircle className="w-4 h-4" />
                                                    添加技能
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">优先技能</label>
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
                                                            className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white dark:bg-slate-700 dark:text-slate-100 placeholder-slate-400"
                                                            placeholder="例如：Next.js"
                                                        />
                                                        {newJob.preferredSkills.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const updatedSkills = newJob.preferredSkills.filter((_, i) => i !== index);
                                                                    setNewJob({ ...newJob, preferredSkills: updatedSkills });
                                                                }}
                                                                className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
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
                                                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors dark:text-blue-400 dark:hover:text-blue-300"
                                                >
                                                    <PlusCircle className="w-4 h-4" />
                                                    添加优先技能
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">部门</label>
                                            <input
                                                type="text"
                                                value={newJob.department}
                                                onChange={(e) => setNewJob({ ...newJob, department: e.target.value })}
                                                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white dark:bg-slate-700 dark:text-slate-100 placeholder-slate-400"
                                                placeholder="例如：技术部"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">招聘人数</label>
                                            <input
                                                type="number"
                                                value={newJob.hiringCount}
                                                onChange={(e) => setNewJob({ ...newJob, hiringCount: parseInt(e.target.value) || 1 })}
                                                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white dark:bg-slate-700 dark:text-slate-100 placeholder-slate-400"
                                                placeholder="例如：1"
                                                min="1"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">经验要求</label>
                                            <select
                                                value={newJob.experience}
                                                onChange={(e) => setNewJob({ ...newJob, experience: e.target.value })}
                                                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white dark:bg-slate-700 dark:text-slate-100"
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
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">过期日期</label>
                                            <input
                                                type="date"
                                                value={newJob.expireDate}
                                                onChange={(e) => setNewJob({ ...newJob, expireDate: e.target.value })}
                                                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white dark:bg-slate-700 dark:text-slate-100 [color-scheme:light] dark:[color-scheme:dark]"
                                                lang="zh-CN"
                                                title="选择过期日期"
                                                placeholder="YYYY-MM-DD"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">学历要求</label>
                                            <select
                                                value={newJob.degree}
                                                onChange={(e) => setNewJob({ ...newJob, degree: e.target.value })}
                                                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white dark:bg-slate-700 dark:text-slate-100"
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
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">职位类型</label>
                                            <select
                                                value={newJob.type}
                                                onChange={(e) => setNewJob({ ...newJob, type: e.target.value })}
                                                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white dark:bg-slate-700 dark:text-slate-100"
                                            >
                                                <option value="全职">全职</option>
                                                <option value="兼职">兼职</option>
                                                <option value="实习">实习</option>
                                                <option value="临时工">临时工</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">工作模式</label>
                                            <select
                                                value={newJob.workMode}
                                                onChange={(e) => setNewJob({ ...newJob, workMode: e.target.value })}
                                                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white dark:bg-slate-700 dark:text-slate-100"
                                            >
                                                <option value="现场">现场</option>
                                                <option value="远程">远程</option>
                                                <option value="混合">混合</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">职位级别</label>
                                            <select
                                                value={newJob.jobLevel}
                                                onChange={(e) => setNewJob({ ...newJob, jobLevel: e.target.value })}
                                                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white dark:bg-slate-700 dark:text-slate-100"
                                            >
                                                <option value="初级">初级</option>
                                                <option value="中级">中级</option>
                                                <option value="高级">高级</option>
                                                <option value="资深">资深</option>
                                                <option value="管理">管理</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">紧急程度</label>
                                            <select
                                                value={newJob.urgency}
                                                onChange={(e) => setNewJob({ ...newJob, urgency: e.target.value })}
                                                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white dark:bg-slate-700 dark:text-slate-100"
                                            >
                                                <option value="普通">普通</option>
                                                <option value="紧急">紧急</option>
                                                <option value="非常紧急">非常紧急</option>
                                            </select>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">公司福利</label>
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
                                                            className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white dark:bg-slate-700 dark:text-slate-100 placeholder-slate-400"
                                                            placeholder="例如：五险一金"
                                                        />
                                                        {newJob.benefits.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const updatedBenefits = newJob.benefits.filter((_, i) => i !== index);
                                                                    setNewJob({ ...newJob, benefits: updatedBenefits });
                                                                }}
                                                                className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
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
                                                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors dark:text-blue-400 dark:hover:text-blue-300"
                                                >
                                                    <PlusCircle className="w-4 h-4" />
                                                    添加公司福利
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">职位描述</label>
                                            <button
                                                onClick={handleGenerateJD}
                                                disabled={isGeneratingJD || !newJob.title || !newJob.skills}
                                                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isGeneratingJD ? '生成中...' : 'AI生成'}
                                            </button>
                                        </div>
                                        <textarea
                                            value={newJob.description}
                                            onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all min-h-[200px] resize-vertical bg-white dark:bg-slate-700 dark:text-slate-100 placeholder-slate-400"
                                            placeholder="详细描述职位职责、任职要求、公司福利等"
                                        />
                                    </div>

                                    {/* 编辑模式下显示状态切换 */}
                                    {isEditModalOpen && editingJob && (
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">职位状态</label>
                                            <select
                                                value={editingJob.status}
                                                onChange={(e) => setEditingJob({ ...editingJob, status: e.target.value as 'active' | 'closed' })}
                                                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white dark:bg-slate-700 dark:text-slate-100"
                                            >
                                                <option value="active">发布中</option>
                                                <option value="closed">已关闭</option>
                                            </select>
                                        </div>
                                    )}
                                </div>

                                <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-slate-800 z-10">
                                    <button
                                        onClick={() => {
                                            if (isEditModalOpen) {
                                                setIsEditModalOpen(false);
                                                setEditingJob(null);
                                            } else {
                                                setIsPostModalOpen(false);
                                            }
                                            setNewJob({
                                                title: '',
                                                location: '深圳',
                                                salary: '',
                                                description: '',
                                                skills: [''],
                                                preferredSkills: [''],
                                                benefits: [''],
                                                expireDate: '',
                                                experience: '1-3年',
                                                degree: '本科',
                                                type: '全职',
                                                workMode: '现场',
                                                jobLevel: '初级',
                                                hiringCount: 1,
                                                urgency: '普通',
                                                department: ''
                                            });
                                        }}
                                        className="px-5 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors font-medium bg-white dark:bg-slate-800"
                                    >
                                        取消
                                    </button>
                                    <button
                                        onClick={isEditModalOpen ? handleUpdateJob : handlePostJob}
                                        disabled={!newJob.title || !newJob.description}
                                        className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isEditModalOpen ? '更新职位' : '发布职位'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Candidate Detail Modal */}
                    <CandidateDetailModal
                        isOpen={isDetailModalOpen}
                        onClose={() => {
                            setIsDetailModalOpen(false);
                            setSelectedCandidate(null);
                        }}
                        candidate={selectedCandidate}
                    />
                </RecruiterLayout>
            </I18nProvider>
        </ThemeProvider>
    );
};
