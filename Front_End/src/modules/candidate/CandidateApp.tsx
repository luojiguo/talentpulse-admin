import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { Modal, App } from 'antd';
import { SystemUser as User, JobPosting, UserProfile as Profile, Company, Conversation, Message } from '@/types/types';
import { userAPI, jobAPI, companyAPI, messageAPI, candidateAPI } from '@/services/apiService';
import { useApi } from '@/hooks/useApi';
import { socketService } from '@/services/socketService';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { I18nProvider } from '@/contexts/i18nContext';

// Import Candidate screens
import HomeScreen from './screens/HomeScreen';
import JobDetailScreen from './screens/JobDetailScreen';
import JobListScreen from './screens/JobListScreen';
import MessageCenterScreen from './screens/MessageCenterScreen';
import MockInterviewScreen from './screens/MockInterviewScreen';
import AIChatScreen from './screens/AIChatScreen';
import ProfileScreen from './screens/ProfileScreen';
import ApplicationsScreen from './screens/ApplicationsScreen';
import InterviewsScreen from './screens/InterviewsScreen';
import SavedItemsScreen from './screens/SavedItemsScreen';
import CompanyDetailScreen from './screens/CompanyDetailScreen';

import EnterpriseVerificationScreen from './screens/EnterpriseVerificationScreen';

import CandidateLayout from './components/CandidateLayout';
import LoginModal from '../../components/auth/LoginModal';
import LoadingSpinner from '@/components/LoadingSpinner';

interface CandidateAppProps {
  currentUser: User | null;
  onLogout: () => void;
  onSwitchRole: (newRole: string) => void;
  onUpdateUser: (user: User) => void;
  onLogin: (user: User) => void;
}

// Internal Guard Component
const RequireLogin = ({ children, currentUser }: { children: React.ReactNode, currentUser: User | null }) => {
  if (!currentUser || currentUser.id === 0) {
    // Prevent redirect loop if already on login (handled by App.tsx generally, but good for safety)
    return <Navigate to="/login" replace />;
  }
  return children;
};

const CandidateApp: React.FC<CandidateAppProps> = ({ currentUser, onLogout, onSwitchRole, onUpdateUser, onLogin }) => {
  // NOTE: 使用 App.useApp() 获取 message 和 modal 实例以支持动态主题
  const { message, modal } = App.useApp();
  const [activeTab, setActiveTab] = useState('home');
  // Add setCurrentUser functionality by keeping local state that syncs with props
  const [localCurrentUser, setLocalCurrentUser] = useState<User | null>(currentUser);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const navigate = useNavigate();

  // Candidate Screen Props Management
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const activeConversationIdRef = React.useRef<string | null>(null);
  const joinedConversationIdRef = React.useRef<string | null>(null);

  // Sync ref with state
  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [collectedJobs, setCollectedJobs] = useState<JobPosting[]>([]);
  const [followedCompanies, setFollowedCompanies] = useState<(string | number)[]>([]);
  const [searchText, setSearchText] = useState('');
  const [filterUnread, setFilterUnread] = useState(false);
  const [userResume, setUserResume] = useState({});

  // 记录已发送过立即沟通消息的招聘者ID，用于防止重复发送
  const [sentRecruiterIds, setSentRecruiterIds] = useState<Set<string | number>>(new Set());

  // 消息相关状态
  const [conversationError, setConversationError] = useState<string | null>(null);

  // Sync with external currentUser prop changes
  useEffect(() => {
    setLocalCurrentUser(currentUser);
  }, [currentUser]);

  // 监听头像更新事件
  useEffect(() => {
    const handleAvatarUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ avatar: string }>;
      if (customEvent.detail && customEvent.detail.avatar) {
        setLocalCurrentUser(prev => ({
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
  // 优化：并行获取所有初始数据，减少加载时间
  // 使用 useApi Hook 获取智能推荐的职位数据（并行加载）
  // Handle Login Modal
  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);

  // Define onLoginClick wrapper safely (can be passed to children)
  const handleLoginClick = () => {
    openLoginModal();
  };

  // Fetch Recommended Jobs with Guard
  const {
    data: jobsData,
    loading: loadingJobs,
    error: jobsError
  } = useApi<{ status: string; data: JobPosting[] }>(
    () => localCurrentUser?.id ? jobAPI.getRecommendedJobs(localCurrentUser.id) as any : Promise.resolve({ data: [] }),
    [localCurrentUser?.id],
    { autoFetch: !!localCurrentUser?.id, cache: true } // 启用缓存，仅当ID存在时请求
  );
  // Fix: Pass undefined instead of [] when data is not ready or empty, so HomeScreen can use its own fetch logic
  const jobs = (jobsData?.data && jobsData.data.length > 0) ? jobsData.data : undefined;

  // 使用 useApi Hook 获取用户资料（并行加载）
  const {
    data: userProfileData,
    loading: loadingProfile,
    refetch: refetchProfile
  } = useApi<{ status: string; data: Profile }>(
    () => localCurrentUser?.id ? userAPI.getUserById(localCurrentUser.id) as any : Promise.resolve({ data: {} }),
    [localCurrentUser?.id, localCurrentUser?.avatar],
    { autoFetch: !!localCurrentUser?.id, cache: false } // 禁用缓存，确保获取最新数据
  );

  // 使用 useApi Hook 获取关注的公司（并行加载）
  const {
    data: followedCompaniesData,
    loading: loadingFollowedCompanies
  } = useApi<{ status: string; data: Company[] }>(
    () => localCurrentUser?.id ? companyAPI.getFollowedCompanies(localCurrentUser.id) as any : Promise.resolve({ data: [] }),
    [localCurrentUser?.id],
    { autoFetch: !!localCurrentUser?.id, cache: true } // 启用缓存
  );

  useEffect(() => {
    if (followedCompaniesData?.status === 'success') {
      const followedCompanyIds = followedCompaniesData.data.map(company => company.id) || [];
      setFollowedCompanies(followedCompanyIds);
    }
  }, [followedCompaniesData]);

  // Local setCurrentUser function that updates local state and ensures id is always a number
  const handleSetCurrentUser = (userOrUpdater: User | ((prevUser: User) => User)) => {
    if (!localCurrentUser) return; // Guard against updates when no user

    // Determine the new user object based on the current localCurrentUser state
    const newUser = typeof userOrUpdater === 'function'
      // @ts-ignore - complex union type issue, runtime safe due to guard above
      ? userOrUpdater(localCurrentUser)
      : userOrUpdater;

    const updatedUser = {
      ...newUser,
      id: typeof newUser.id === 'string' ? parseInt(newUser.id, 10) : newUser.id
    };

    // Update local state
    setLocalCurrentUser(updatedUser);

    // Update global state
    if (onUpdateUser) {
      onUpdateUser(updatedUser);
    }
  };


  // --- 所有回调函数均放在此处定义，确保初始化顺序 ---

  // 获取用户对话列表
  const fetchConversations = useCallback(async () => {
    if (!localCurrentUser?.id) return;

    // Check for token to avoid 401
    const token = localStorage.getItem('token');
    if (!token) return;

    setConversationError(null);

    try {
      // 直接调用 API，API 服务层已经处理了超时（60秒）
      const response = await messageAPI.getConversations(localCurrentUser.id, 'candidate');

      if ((response as any).status === 'success') {
        const newData = response.data || [];

        setConversations(prevConversations => {
          // 创建一个 Map 方便查找现有消息
          const existingMessagesMap = new Map();
          prevConversations.forEach(c => {
            if (c.id != null && c.messages) {
              existingMessagesMap.set(c.id.toString(), c.messages);
            }
          });

          // 处理新数据，合并现有消息
          // 后端已过滤，直接使用候选人的对话
          const candidateConversations = newData;

          // 如果没有新对话，直接返回旧的
          if (candidateConversations.length === 0 && prevConversations.length === 0) return [];

          const mergedConversations = candidateConversations.map((conv: any) => {
            const convIdStr = conv.id.toString();
            return {
              ...conv,
              lastTime: conv.lastTime || conv.last_time || conv.updated_at || new Date().toISOString(),
              lastMessage: conv.lastMessage || conv.last_message || '暂无消息',
              messages: existingMessagesMap.get(convIdStr) || (conv.messages || [])
            };
          });

          // 如果当前活跃的对话不在列表里（比如刚创建还没同步到后端列表），则保留它
          if (activeConversationId) {
            const isActiveInNewData = newData.some((c: any) => c.id.toString() === activeConversationId.toString());
            if (!isActiveInNewData) {
              const activeConv = prevConversations.find(c => c.id.toString() === activeConversationId.toString());
              if (activeConv) {
                return [activeConv, ...mergedConversations];
              }
            }
          }

          return mergedConversations;
        });
      }
    } catch (error: any) {
      console.error('获取对话列表失败:', error);
      if (error.message === '请求超时') {
        setConversationError('获取对话列表超时，请稍后重试');
      } else {
        setConversationError('获取对话列表失败，请稍后重试');
      }
    }
  }, [localCurrentUser?.id, activeConversationId]); // 添加 activeConversationId 依赖以防丢失当前对话

  // Socket.IO Integration
  useEffect(() => {
    if (localCurrentUser?.id) {
      // Connect to socket
      const socket = socketService.connect(localCurrentUser.id);

      // Listen for new messages
      socketService.onNewMessage((message: any) => {
        console.log('Received new message via socket:', message);

        setConversations(prevConversations => {
          // Check if conversation exists
          const conversationExists = prevConversations.some(c => c.id.toString() === message.conversation_id.toString());

          if (conversationExists) {
            return prevConversations.map(conv => {
              if (conv.id.toString() === message.conversation_id.toString()) {
                const currentActiveId = activeConversationIdRef.current;
                const isCurrentConversation = currentActiveId && currentActiveId.toString() === message.conversation_id.toString();

                const existingMessages = conv.messages || [];
                // Avoid duplicates by ID (string comparison)
                if (existingMessages.some(m => m.id?.toString() === message.id?.toString())) {
                  // If it exists, it might be an update (like exchange accepted)
                  return {
                    ...conv,
                    messages: existingMessages.map(m => m.id?.toString() === message.id?.toString() ? { ...m, ...message } : m)
                  };
                }

                // Fuzzy Match Deduplication for Optimistic Updates
                const isFromMe = message.sender_id.toString() === localCurrentUser.id.toString();
                if (isFromMe) {
                  const lastMsg = existingMessages[existingMessages.length - 1];
                  if (lastMsg &&
                    lastMsg.text === message.text &&
                    (Date.now() - new Date(lastMsg.time).getTime() < 5000)) {
                    // Update optimistic message with real data
                    const updatedMessages = [...existingMessages];
                    updatedMessages[updatedMessages.length - 1] = {
                      ...message,
                      sender_name: message.sender_name || '我',
                      sender_avatar: message.sender_avatar || ''
                    };
                    return {
                      ...conv,
                      messages: updatedMessages,
                      lastMessage: message.type === 'image' ? '[图片]' : (message.type === 'file' ? '[文件]' : message.text),
                      lastTime: message.time
                    };
                  }
                }


                return {
                  ...conv,
                  lastMessage: message.type === 'image' ? '[图片]' : (message.type === 'file' ? '[文件]' : message.text),
                  lastTime: message.time || new Date().toISOString(),
                  updated_at: message.time || new Date().toISOString(),
                  totalMessages: (conv.totalMessages || 0) + 1,

                  // 实时同步招聘者头像和姓名到列表
                  recruiter_name: !isFromMe ? (message.sender_name || conv.recruiter_name) : conv.recruiter_name,
                  recruiter_avatar: !isFromMe ? (message.sender_avatar || conv.recruiter_avatar) : conv.recruiter_avatar,

                  candidateUnread: isCurrentConversation ? 0 : (conv.candidateUnread || 0) + 1, // Candidate unread logic
                  unreadCount: isCurrentConversation ? 0 : (conv.unreadCount || 0) + 1, // Fallback
                  messages: [...existingMessages, {
                    ...message,
                    sender_name: message.sender_name || (isFromMe ? '我' : '对方'),
                    sender_avatar: message.sender_avatar || ''
                  }]
                };
              }
              return conv;
            });
          } else {
            // New conversation? Fetch everything
            // For now, simpler to just fetch all conversations again to ensure sync
            fetchConversations();
            return prevConversations;
          }
        });
      });

      const handleMessageUpdated = (updatedMessage: any) => {
        console.log('Received message update:', updatedMessage);
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
              recruiterUnread: recruiterUnread ?? (conv as any).recruiterUnread,
              unreadCount: candidateUnread ?? conv.unreadCount,
              updated_at: updatedAt ?? (conv as any).updated_at,
              updatedAt: updatedAt ?? (conv as any).updatedAt
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
  }, [localCurrentUser?.id]); // Only depend on User ID

  // Handle joining conversation rooms when active conversation changes
  useEffect(() => {
    if (activeConversationId) {
      const prevJoinedId = joinedConversationIdRef.current;
      if (prevJoinedId && prevJoinedId.toString() !== activeConversationId.toString()) {
        socketService.leaveConversation(prevJoinedId);
      }
      socketService.joinConversation(activeConversationId);
      joinedConversationIdRef.current = activeConversationId;

      // Mark as read when entering room (handled by API call in handleSelectConversation, but good to keep in mind)
    }
  }, [activeConversationId]);

  // 保留一个长轮询作为备份，但延长间隔到5分钟，主要依靠Socket
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchConversations();
      }
    }, 300000); // 5分钟刷新一次作为兜底

    return () => clearInterval(refreshInterval);
  }, [fetchConversations]);

  // 修改setActiveConversationId的调用方式，添加获取详细消息的逻辑
  const handleSelectConversation = useCallback(async (conversationId: string | number, limit = 15, offset = 0) => {
    try {
      const idToSet = typeof conversationId === 'string' ? parseInt(conversationId, 10) : conversationId;
      setActiveConversationId(idToSet.toString());

      // 标记消息为已读 - 先调用，减少等待时间
      const markFunc = (messageAPI as any).markMessagesAsRead || messageAPI.markAsRead;
      if (markFunc) {
        await markFunc(idToSet, localCurrentUser.id);
      }

      // 获取对话的详细消息，默认获取最新的15条，减少首屏渲染压力
      const response = await (messageAPI as any).getConversationDetail(idToSet, limit, offset, 'desc');
      if ((response as any).status === 'success') {
        let messages: any[] = [];
        let conversation: any = null;
        let total: number = 0;

        // 处理不同的后端响应结构
        if (Array.isArray(response.data)) {
          // 后端直接返回消息数组
          messages = response.data;
        } else if (response.data.messages) {
          // 后端返回包含messages字段的对象
          messages = response.data.messages;
          conversation = response.data.conversation;
          total = response.data.total || messages.length;
        } else if (response.data.data && response.data.data.messages) {
          // 后端返回包含data.messages字段的对象
          messages = response.data.data.messages;
          conversation = response.data.data.conversation;
          total = response.data.data.total || messages.length;
        } else {
          // 其他情况，尝试将整个响应数据作为消息数组
          messages = response.data || [];
        }

        // 更新对话列表中的消息，并进行去重和排序
        setConversations(prevConversations => {
          const existingIndex = prevConversations.findIndex(c => c.id.toString() === idToSet.toString());

          if (existingIndex > -1) {
            // 对话已存在，更新
            return prevConversations.map((conv, index) => {
              if (index === existingIndex) {
                // 合并新旧消息并去重
                const existingMessages = conv.messages || [];
                const newMessages = messages || [];

                // 使用 Map 进行去重，以 ID 为键
                const messageMap = new Map();
                [...existingMessages, ...newMessages].forEach(msg => {
                  if (msg && msg.id) {
                    messageMap.set(msg.id.toString(), msg);
                  }
                });

                const mergedMessages = Array.from(messageMap.values());

                // 将消息按时间升序排序（最早在上，最新在下）
                const sortedMessages = mergedMessages.sort((a, b) =>
                  new Date(a.time).getTime() - new Date(b.time).getTime()
                );

                return {
                  ...conv,
                  messages: sortedMessages,
                  total_messages: total,
                  lastMessage: conversation?.last_message || conversation?.lastMessage || conv.lastMessage,
                  lastTime: conversation?.last_time || conversation?.lastTime || conv.lastTime,
                  unreadCount: 0,
                  candidateUnread: 0
                };
              }
              return conv;
            });
          } else if (conversation) {
            // 对话不存在但API返回了详情，添加到列表
            // 构造新的Conversation对象
            const newConv: Conversation = {
              ...conversation,
              id: idToSet,
              messages: messages,
              total_messages: total,
              unreadCount: 0,
              candidateUnread: 0,
              lastMessage: conversation.last_message || conversation.lastMessage || '',
              lastTime: conversation.last_time || conversation.lastTime || new Date().toISOString(),
              // 确保包含必要字段，如果API返回不全可能需要fallback
              candidate_id: conversation.candidate_id || localCurrentUser.id,
              recruiter_id: conversation.recruiter_id,
              jobId: conversation.job_id || conversation.jobId,
              recruiter_name: conversation.recruiter_name || '招聘者',
              recruiter_avatar: conversation.recruiter_avatar || '',
              candidate_name: conversation.candidate_name || localCurrentUser.name,
              candidate_avatar: conversation.candidate_avatar || localCurrentUser.avatar,
              job_title: conversation.job_title || '职位',
              company_name: conversation.company_name || '公司'
            };
            return [newConv, ...prevConversations];
          } else {
            // 无法更新也无法添加
            return prevConversations;
          }
        });
      }
    } catch (error) {
      console.error('获取对话详情失败:', error);
      // 不影响用户体验，仅记录错误
    }
  }, [localCurrentUser?.id]);

  // 加载更多历史消息
  const handleLoadMoreMessages = useCallback(async (conversationId: string | number, currentMessageCount: number) => {
    try {
      const idToFetch = conversationId.toString();
      // 获取更早的消息 (offset = 当前已加载的消息数)
      const response = await (messageAPI as any).getConversationDetail(idToFetch, 20, currentMessageCount, 'desc');

      if ((response as any).status === 'success') {
        let messages: any[] = [];

        // 处理不同的后端响应结构
        if (Array.isArray(response.data)) {
          // 后端直接返回消息数组
          messages = response.data;
        } else if (response.data.messages) {
          // 后端返回包含messages字段的对象
          messages = response.data.messages;
        } else if (response.data.data && response.data.data.messages) {
          // 后端返回包含data.messages字段的对象
          messages = response.data.data.messages;
        } else {
          // 其他情况，尝试将整个响应数据作为消息数组
          messages = response.data || [];
        }

        if (!messages || messages.length === 0) return false;

        // 将更早的消息添加到现有消息列表，并进行去重和排序
        setConversations(prevConversations =>
          prevConversations.map(conv => {
            if (conv.id.toString() === idToFetch) {
              const existingMessages = conv.messages || [];
              const newMessages = messages || [];

              const messageMap = new Map();
              [...existingMessages, ...newMessages].forEach(msg => {
                if (msg && msg.id) {
                  messageMap.set(msg.id.toString(), msg);
                }
              });

              const mergedMessages = Array.from(messageMap.values());
              // 升序排序（最早在上）
              const finalSortedMessages = mergedMessages.sort((a, b) =>
                new Date(a.time).getTime() - new Date(b.time).getTime()
              );

              return {
                ...conv,
                messages: finalSortedMessages
              };
            }
            return conv;
          })
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error('加载更多消息失败:', error);
      return false;
    }
  }, []);

  // Handle Send Message
  const handleSendMessage = useCallback(async (text: string, type: any = 'text', quotedMessage?: { id: string | number | null, text: string, senderName: string | null, type?: string }) => {
    if (!activeConversationId) return;
    // 对于exchange_request类型的消息，允许text为空
    if (!text && type !== 'exchange_request') return;

    try {
      // 找到当前对话
      const conversation = conversations.find(c => c.id.toString() === activeConversationId.toString());
      if (!conversation) {
        console.warn('本地未找到当前对话信息，尝试直接发送...');
        // 不拦截，继续尝试发送，依赖后端处理接收者
      }

      // 构建quoted_message对象
      const quoted_message = quotedMessage && quotedMessage.id ? {
        id: quotedMessage.id,
        text: quotedMessage.text,
        sender_name: quotedMessage.senderName,
        type: quotedMessage.type || 'text'
      } : undefined;

      console.log('准备发送消息:', {
        conversationId: activeConversationId,
        senderId: localCurrentUser?.id,
        receiverId: undefined,
        text,
        type,
        quoted_message
      });

      // 优化：发送消息的同时本地更新，提升响应速度
      const response = await messageAPI.sendMessage({
        conversationId: activeConversationId,
        senderId: localCurrentUser.id,
        receiverId: undefined, // 后端会自动根据conversationId查找接收者
        text,
        type,
        quoted_message
      });

      console.log('发送消息响应:', response);

      // 检查响应是否成功（支持多种响应格式）
      // 用户日志显示的响应格式: {code: 200, message: '消息发送成功', data: {…}, success: true, status: 'success'}
      // 注意：axios响应可能被拦截器处理过，直接返回了data部分
      const responseData = response as any;
      const isSuccess = responseData.status === 'success' || responseData.success === true || responseData.code === 200;

      if (isSuccess) {
        // 更新本地对话列表
        // 如果之前没找到 conversation (activeConversationId存在但列表里没有)，则需要立即刷新列表
        if (!conversation) {
          console.log('本地无对话信息，发送成功后立即刷新详情');
          handleSelectConversation(activeConversationId);
          fetchConversations();
          return;
        }

        const updatedConversations: Conversation[] = conversations.map((c: Conversation) => {
          if (c.id.toString() === activeConversationId.toString()) {
            // 创建新消息对象，确保符合Message接口
            const newMessage: Message = {
              id: responseData.data?.id || Date.now(),
              text,
              type: type as any,
              role: 'user',
              time: new Date().toISOString(),
              sender_id: localCurrentUser.id,
              receiver_id: conversation.recruiterUserId || conversation.recruiterId,
              sender_name: localCurrentUser.name || '我',
              sender_avatar: localCurrentUser.avatar,
              status: 'sent',
              quoted_message: quoted_message as any
            };

            // Deduplication: Check if message (from socket) already exists
            const msgExists = (c.messages || []).some(m => m.id.toString() === newMessage.id.toString());
            if (msgExists) {
              return c;
            }

            // 更新messages数组，确保类型安全
            const updatedMessages: Message[] = [...(c.messages || []), newMessage];

            // 创建完整的Conversation对象
            return {
              ...c,
              lastMessage: text,
              lastTime: new Date().toISOString(),
              totalMessages: (c.totalMessages || 0) + 1,
              recruiterUnread: (c.recruiterUnread || 0) + 1,
              updatedAt: new Date().toISOString(),
              messages: updatedMessages
            };
          }
          return c;
        });

        setConversations(updatedConversations);

        // 发送消息后重新获取对话列表，确保HR信息实时更新
        setTimeout(() => {
          fetchConversations();
        }, 1000); // 延迟1秒，确保后端数据已更新
      } else {
        console.error('发送消息失败: 响应状态错误', response);
        message.error('发送消息失败: ' + (responseData.message || '未知错误'));
      }
    } catch (error: any) {
      console.error('发送消息失败:', error);
      console.error('错误详情:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config
      });
      message.error('发送消息失败: ' + (error.response?.data?.message || error.message || '网络错误'));
    }
  }, [activeConversationId, conversations, localCurrentUser, fetchConversations]);

  // Handle Delete Message
  const handleDeleteMessage = useCallback(async (conversationId: string | number, messageId: number | string) => {
    try {
      // 调用后端API删除消息，传入deletedBy参数
      const response = await messageAPI.deleteMessage(messageId, { deletedBy: localCurrentUser.id });

      if ((response as any).status === 'success') {
        // 更新本地对话列表，从消息列表中移除删除的消息
        setConversations(prevConversations =>
          prevConversations.map(conv => {
            if (conv.id.toString() === conversationId.toString()) {
              const newMessages = (conv.messages || []).filter(m => m.id.toString() !== messageId.toString());
              // 如果删除了最后一条消息，更新lastMessage
              const lastMsg = newMessages.length > 0 ? newMessages[newMessages.length - 1] : null;

              return {
                ...conv,
                messages: newMessages,
                lastMessage: lastMsg ? (lastMsg.type === 'text' ? lastMsg.text : `[${lastMsg.type}]`) : (conv.lastMessage || '')
              };
            }
            return conv;
          })
        );

        // 显示删除成功提示
        message.success('消息已删除');

        // 关键修复：删除消息后重新获取对话列表，确保“最后一条消息”同步更新
        setTimeout(() => {
          fetchConversations();
        }, 500);
      }
    } catch (error) {
      console.error('删除消息失败:', error);
      message.error('删除消息失败，请稍后重试');
    }
  }, [localCurrentUser?.id, fetchConversations]);

  // Handle Delete Conversation -> Changed to Hide
  const handleDeleteConversation = useCallback(async (conversationId: string | number) => {
    try {
      // 优化：改为"隐藏"而非"删除"
      await messageAPI.updateConversationStatus(conversationId, {
        role: 'candidate',
        action: 'hide'
      });

      // 从本地状态中删除 (隐藏)
      setConversations(prevConversations =>
        prevConversations.filter(conv => conv.id.toString() !== conversationId.toString())
      );

      // 如果隐藏的是当前活跃的对话，重置活跃对话ID
      if (activeConversationId?.toString() === conversationId.toString()) {
        setActiveConversationId(null);
      }

      message.success('对话已移除');
    } catch (error) {
      console.error('移除对话失败:', error);
      message.error('操作失败，请重试');
    }
  }, [activeConversationId]);

  const handlePinConversation = async (conversationId: string, isPinned: boolean) => {
    try {
      await messageAPI.updateConversationStatus(conversationId, {
        role: 'candidate',
        action: isPinned ? 'unpin' : 'pin'
      });

      setConversations(prev => {
        const updated = prev.map(conv => {
          if (conv.id.toString() === conversationId.toString()) {
            return { ...conv, candidatePinned: !isPinned };
          }
          return conv;
        });

        // Re-sort: Pinned first, then time
        return updated.sort((a: any, b: any) => {
          if (a.candidatePinned !== b.candidatePinned) {
            return a.candidatePinned ? -1 : 1;
          }
          const timeA = new Date(a.updatedAt || a.updated_at || a.lastTime).getTime();
          const timeB = new Date(b.updatedAt || b.updated_at || b.lastTime).getTime();
          return timeB - timeA;
        });
      });
    } catch (error) {
      console.error('置顶操作失败:', error);
      message.error('操作失败，请重试');
    }
  };

  const handleHideConversation = async (conversationId: string) => {
    try {
      await messageAPI.updateConversationStatus(conversationId, {
        role: 'candidate',
        action: 'hide'
      });

      // Optimistic removal
      setConversations(prev => prev.filter(conv => conv.id.toString() !== conversationId.toString()));

      if (activeConversationId?.toString() === conversationId.toString()) {
        setActiveConversationId(null);
      }
      message.success('会话已隐藏');
    } catch (error) {
      console.error('隐藏会话失败:', error);
      message.error('隐藏失败，请重试');
    }
  };

  // Handle Upload Image Message

  // Handle Upload Image Message
  const handleUploadImage = useCallback(async (conversationId: string | number, file: File, quotedMessage?: any) => {
    try {
      // 找到当前对话
      const conversation = conversations.find(c => c.id.toString() === conversationId.toString());
      if (!conversation) return;

      const receiverId = conversation.recruiterUserId || conversation.recruiterId;

      const response = await messageAPI.uploadChatImage(
        conversationId,
        localCurrentUser.id,
        receiverId,
        file,
        quotedMessage
      );

      if ((response as any).status === 'success') {
        // 更新本地对话列表
        const updatedConversations = conversations.map(c => {
          if (c.id.toString() === conversationId.toString()) {
            const newMessage = {
              ...response.data,
              role: 'user' as const, // 明确指定role类型为'user'
              sender_name: localCurrentUser.name || '我',
              sender_avatar: localCurrentUser.avatar
            };

            return {
              ...c,
              lastMessage: '[图片]',
              lastTime: new Date().toISOString(),
              totalMessages: (c.totalMessages || 0) + 1,
              recruiterUnread: (c.recruiterUnread || 0) + 1,
              updated_at: new Date().toISOString(),
              messages: [...(c.messages || []), newMessage]
            };
          }
          return c;
        });

        setConversations(updatedConversations);

        // 刷新列表
        setTimeout(() => {
          fetchConversations();
        }, 1000);
      }
    } catch (error: any) {
      console.error('上传图片失败:', error);
      message.error(error.message || '上传图片失败，请稍后重试');
    }
  }, [conversations, localCurrentUser, fetchConversations]);

  // 优化：延迟获取对话列表，避免阻塞初始渲染
  useEffect(() => {
    // 延迟100ms获取，让页面先渲染
    const timer = setTimeout(() => {
      fetchConversations();
    }, 100);

    return () => clearTimeout(timer);
  }, [localCurrentUser?.id]);

  // 实时更新对话列表，每60秒刷新一次（只在有对话时刷新）
  useEffect(() => {
    // 即使 conversations 为空也应该尝试获取，因为可能有新对话
    const interval = setInterval(() => {
      fetchConversations();
    }, 60000); // 60秒刷新一次

    return () => clearInterval(interval); // 清理定时器
  }, [fetchConversations]);

  // 监听刷新对话事件（当发送简历等操作后触发）
  useEffect(() => {
    const handleRefreshConversation = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.conversationId) {
        handleSelectConversation(customEvent.detail.conversationId);
      }
    };

    window.addEventListener('refreshConversation', handleRefreshConversation);
    return () => {
      window.removeEventListener('refreshConversation', handleRefreshConversation);
    };
  }, [handleSelectConversation]);


  // 处理用户资料数据
  const userProfile: Profile = (localCurrentUser && userProfileData?.status === 'success') ? {
    id: localCurrentUser.id,
    name: userProfileData.data.name || localCurrentUser.name,
    phone: userProfileData.data.phone || '',
    email: userProfileData.data.email || localCurrentUser.email,
    city: userProfileData.data.city || '',
    preferredLocations: userProfileData.data.preferredLocations || '',
    expectedSalary: userProfileData.data.expectedSalary || '',
    expectedSalaryMin: userProfileData.data.expectedSalaryMin,
    expectedSalaryMax: userProfileData.data.expectedSalaryMax,
    desiredPosition: userProfileData.data.desired_position || userProfileData.data.desiredPosition || '',
    jobStatus: userProfileData.data.jobStatus || '',
    bio: userProfileData.data.bio || '',
    experience: userProfileData.data.experience || '',
    avatar: userProfileData.data.avatar || localCurrentUser.avatar,
    wechat: userProfileData.data.wechat || localCurrentUser.wechat || ''
  } : (localCurrentUser ? {
    id: localCurrentUser.id,
    name: localCurrentUser.name,
    phone: '',
    email: localCurrentUser.email,
    city: '',
    preferredLocations: '',
    expectedSalary: '',
    expectedSalaryMin: undefined,
    expectedSalaryMax: undefined,
    desiredPosition: '',
    jobStatus: '',
    bio: '',
    experience: '',
    avatar: localCurrentUser.avatar,
    wechat: localCurrentUser.wechat || ''
  } : {
    // Guest Profile
    id: 0,
    name: '游客',
    phone: '',
    email: '',
    city: '',
    preferredLocations: '',
    expectedSalary: '',
    avatar: '',
    wechat: '',
    jobStatus: '',
    bio: '',
    experience: ''
  });

  // 更新localCurrentUser，确保包含wechat信息
  useEffect(() => {
    if (localCurrentUser && userProfile.wechat && !localCurrentUser.wechat) {
      setLocalCurrentUser(prev => ({
        ...prev!,
        wechat: userProfile.wechat
      }));
    }
  }, [userProfile.wechat, localCurrentUser?.wechat]);

  // Handle Chat Redirect - 立即沟通功能
  const handleChatRedirect = async (jobId: string | number, recruiterId: string | number) => {
    // Guest check
    if (!localCurrentUser) {
      message.warning('请先登录后进行沟通');
      openLoginModal();
      return;
    }

    // 检查是否已经发送过消息给该招聘者，如果是则提示用户
    if (sentRecruiterIds.has(recruiterId)) {
      message.info('您已经发送过消息给该招聘者，短时间内只能发送一次默认消息');
      return;
    }

    // Find the job title and recruiter info
    const job = jobs.find(j => j.id.toString() === jobId.toString());
    const jobTitle = job?.title || '该职位';
    const companyName = job?.company_name || '该公司';

    // 获取招聘者详细信息，直接从job对象中获取，实现双向绑定
    const recruiterName = job?.recruiter_name || '招聘者';
    const recruiterAvatar = job?.recruiter_avatar || '';
    const recruiterPosition = job?.recruiter_position || 'HR';

    // Create default message with format: 打招呼+介绍自己+应聘的岗位
    const defaultMessage = `您好！我是${userProfile.name || localCurrentUser.name}，我想应聘${jobTitle}职位，想了解更多相关信息。`;

    try {
      // 1. 创建申请记录（立即沟通也是一种申请方式）
      // 后端会自动处理user_id到candidate_id的转换
      try {
        await candidateAPI.applyForJob(localCurrentUser.id, jobId, {
          coverLetter: `通过"立即沟通"功能申请该职位`,
          applicationMethod: 'chat' // 标记申请方式为"立即沟通"
        });
      } catch (applicationError: any) {
        // 如果已经申请过，这是正常情况，继续执行
        // 后端现在会返回现有申请而不是报错，所以这里只记录警告
        console.warn('创建申请记录时出现错误（可能已存在）:', applicationError);
      }

      // 3. 调用后端API创建对话并发送消息
      const response = await messageAPI.createConversationAndSendMessage({
        jobId,
        candidateId: localCurrentUser.id,
        recruiterId,
        message: defaultMessage,
        senderId: localCurrentUser.id // 明确指定发送者 ID 为当前候选人
      });

      if ((response as any).status === 'success') {
        let { conversationId, message: sentMessage } = response.data;
        // 确保sentMessage包含role字段
        sentMessage = {
          ...sentMessage,
          role: 'user' as const
        };

        // 创建新的对话对象，包含完整的招聘者信息，实现双向绑定
        const newConversation = {
          id: conversationId,
          jobId,
          candidateId: localCurrentUser.id,
          recruiterId,
          recruiterUserId: recruiterId, // 添加必填属性
          lastMessage: defaultMessage,
          lastTime: new Date().toISOString(),
          unreadCount: 0,
          isActive: true,
          totalMessages: 1,
          candidateUnread: 0,
          recruiterUnread: 1,
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          job_title: jobTitle,
          company_name: companyName,
          candidate_name: localCurrentUser.name || '我', // 添加必填属性
          candidate_avatar: localCurrentUser.avatar || '', // 添加必填属性
          recruiter_name: recruiterName, // 直接从job对象获取，实现双向绑定
          recruiter_avatar: recruiterAvatar, // 直接从job对象获取，实现双向绑定
          recruiter_position: recruiterPosition, // 直接从job对象获取，实现双向绑定
          messages: [sentMessage] // 使用返回的消息对象，避免额外API调用
        };

        // 更新本地对话列表，添加新创建的对话
        setConversations(prevConversations => {
          // 检查对话是否已存在
          const existingConversationIndex = prevConversations.findIndex(conv => conv.id.toString() === conversationId.toString());
          if (existingConversationIndex >= 0) {
            // 如果对话已存在，更新它
            const updatedConversations = [...prevConversations];
            updatedConversations[existingConversationIndex] = {
              ...updatedConversations[existingConversationIndex],
              lastMessage: defaultMessage,
              lastTime: new Date().toISOString(),
              totalMessages: updatedConversations[existingConversationIndex].totalMessages + 1,
              recruiterUnread: updatedConversations[existingConversationIndex].recruiterUnread + 1,
              updatedAt: new Date().toISOString(),
              recruiter_name: recruiterName, // 更新招聘者信息，实现双向绑定
              recruiter_avatar: recruiterAvatar, // 更新招聘者信息，实现双向绑定
              messages: [...(updatedConversations[existingConversationIndex].messages || []), sentMessage]
            };
            return updatedConversations;
          } else {
            // 如果对话不存在，添加它
            return [newConversation, ...prevConversations];
          }
        });

        // 设置新创建的对话为活跃对话
        setActiveConversationId(conversationId);

        // 更新已发送招聘者ID集合，防止重复发送
        setSentRecruiterIds(prev => new Set(prev).add(recruiterId));

        // 立即重新获取对话列表，确保与后端数据同步
        setTimeout(async () => {
          await fetchConversations();
        }, 1000);

        // 显示确认框，询问是否跳转到消息列表
        modal.confirm({
          title: '消息发送成功',
          content: '是否跳转到消息列表？',
          okText: '是',
          cancelText: '否',
          centered: true,
          onOk() {
            // 用户点击"是"，跳转到消息列表，直接携带当前HR的沟通信息
            navigate('/messages');
          },
          onCancel() {
            // 用户点击"否"，留在当前页面
            message.info('已留在当前页面');
          }
        });
      }
    } catch (error) {
      console.error('立即沟通失败:', error);
      message.error('立即沟通失败，请稍后重试');
      // 即使API调用失败，也可以让用户选择是否跳转到消息页面
      modal.confirm({
        title: '消息发送失败',
        content: '是否跳转到消息列表？',
        okText: '是',
        cancelText: '否',
        centered: true,
        onOk() {
          // 用户点击"是"，跳转到消息列表
          navigate('/messages');
        },
        onCancel() {
          // 用户点击"否"，留在当前页面
          message.info('已留在当前页面');
        }
      });
    }
  };

  // -----------------------------------------------------------

  // 显示全局loading状态
  const isInitialLoading = loadingJobs || loadingProfile || loadingFollowedCompanies;

  return (
    <ThemeProvider>
      <I18nProvider>
        {isInitialLoading && (
          <LoadingSpinner fullScreen text="加载中..." />
        )}
        <Routes>
          <Route path="/" element={<CandidateLayout currentUser={localCurrentUser} onLogout={onLogout} onSwitchRole={onSwitchRole} onOpenLogin={handleLoginClick}><HomeScreen jobs={jobs} loadingJobs={loadingJobs} jobsError={typeof jobsError === 'string' ? jobsError : null} followedCompanies={followedCompanies} setFollowedCompanies={setFollowedCompanies} currentUser={localCurrentUser} userProfile={userProfile} onRefreshProfile={refetchProfile} onChat={handleChatRedirect} /></CandidateLayout>} />
          <Route path="/job" element={<CandidateLayout currentUser={localCurrentUser} onLogout={onLogout} onSwitchRole={onSwitchRole} onOpenLogin={handleLoginClick}><JobListScreen jobs={jobs} loadingJobs={loadingJobs} jobsError={typeof jobsError === 'string' ? jobsError : null} currentUser={localCurrentUser} onChat={handleChatRedirect} /></CandidateLayout>} />
          <Route path="/job/:id" element={<CandidateLayout currentUser={localCurrentUser} onLogout={onLogout} onSwitchRole={onSwitchRole} onOpenLogin={handleLoginClick}><JobDetailScreen jobs={jobs} onBack={() => window.history.back()} collectedJobs={collectedJobs} setCollectedJobs={setCollectedJobs} onChat={handleChatRedirect} currentUser={localCurrentUser} onOpenLogin={handleLoginClick} /></CandidateLayout>} />
          <Route path="/company/:id" element={<CandidateLayout currentUser={localCurrentUser} onLogout={onLogout} onSwitchRole={onSwitchRole} onOpenLogin={handleLoginClick}><CompanyDetailScreen /></CandidateLayout>} />

          {/* Message Center Routes */}
          {/* Message Center Routes - Unified Responsive Route */}
          <Route path="/messages" element={
            <RequireLogin currentUser={localCurrentUser}>
              <CandidateLayout currentUser={localCurrentUser} onLogout={onLogout} onSwitchRole={onSwitchRole} onOpenLogin={handleLoginClick}>
                <MessageCenterScreen
                  conversations={conversations}
                  jobs={jobs}
                  activeConversationId={activeConversationId}
                  onSelectConversation={handleSelectConversation}
                  onSendMessage={handleSendMessage}
                  onUploadImage={handleUploadImage}
                  onDeleteMessage={handleDeleteMessage}
                  onDeleteConversation={handleDeleteConversation}
                  onLoadMoreMessages={handleLoadMoreMessages}
                  searchText={searchText}
                  setSearchText={setSearchText}
                  filterUnread={filterUnread}
                  setFilterUnread={setFilterUnread}
                  currentUser={localCurrentUser!}
                  conversationError={conversationError}
                  onPinConversation={handlePinConversation}
                  onHideConversation={handleHideConversation}
                />
              </CandidateLayout>
            </RequireLogin>
          }
          />
          <Route path="/messages/:conversationId" element={
            <RequireLogin currentUser={localCurrentUser}>
              <CandidateLayout currentUser={localCurrentUser} onLogout={onLogout} onSwitchRole={onSwitchRole} onOpenLogin={handleLoginClick}>
                <MessageCenterScreen
                  conversations={conversations}
                  jobs={jobs}
                  activeConversationId={activeConversationId}
                  onSelectConversation={handleSelectConversation}
                  onSendMessage={handleSendMessage}
                  onUploadImage={handleUploadImage}
                  onDeleteMessage={handleDeleteMessage}
                  onDeleteConversation={handleDeleteConversation}
                  onLoadMoreMessages={handleLoadMoreMessages}
                  searchText={searchText}
                  setSearchText={setSearchText}
                  filterUnread={filterUnread}
                  setFilterUnread={setFilterUnread}
                  currentUser={localCurrentUser!}
                  conversationError={conversationError}
                  onPinConversation={handlePinConversation}
                  onHideConversation={handleHideConversation}
                />
              </CandidateLayout>
            </RequireLogin>
          } />

          {/* Other Protected Routes */}
          <Route path="/mock-interview" element={
            <RequireLogin currentUser={localCurrentUser}>
              <CandidateLayout currentUser={localCurrentUser} onLogout={onLogout} onSwitchRole={onSwitchRole}>
                <MockInterviewScreen />
              </CandidateLayout>
            </RequireLogin>
          } />

          <Route path="/ai-chat" element={
            <RequireLogin currentUser={localCurrentUser}>
              <CandidateLayout currentUser={localCurrentUser} onLogout={onLogout} onSwitchRole={onSwitchRole}>
                <AIChatScreen userProfile={userProfile} userResume={userResume} currentUser={localCurrentUser!} />
              </CandidateLayout>
            </RequireLogin>
          } />

          <Route path="/applications" element={
            <RequireLogin currentUser={localCurrentUser}>
              <CandidateLayout currentUser={localCurrentUser} onLogout={onLogout} onSwitchRole={onSwitchRole}>
                <ApplicationsScreen currentUser={localCurrentUser!} />
              </CandidateLayout>
            </RequireLogin>
          } />

          <Route path="/saved" element={
            <RequireLogin currentUser={localCurrentUser}>
              <CandidateLayout currentUser={localCurrentUser} onLogout={onLogout} onSwitchRole={onSwitchRole}>
                <SavedItemsScreen currentUser={localCurrentUser!} />
              </CandidateLayout>
            </RequireLogin>
          } />

          <Route path="/interviews" element={
            <RequireLogin currentUser={localCurrentUser}>
              <CandidateLayout currentUser={localCurrentUser} onLogout={onLogout} onSwitchRole={onSwitchRole}>
                <InterviewsScreen currentUser={localCurrentUser!} />
              </CandidateLayout>
            </RequireLogin>
          } />

          <Route path="/enterprise-verification" element={
            <RequireLogin currentUser={localCurrentUser}>
              <CandidateLayout currentUser={localCurrentUser} onLogout={onLogout} onSwitchRole={onSwitchRole}>
                <EnterpriseVerificationScreen currentUser={localCurrentUser!} profile={userProfile} onSwitchRole={onSwitchRole} />
              </CandidateLayout>
            </RequireLogin>
          } />
          <Route path="/profile" element={
            <RequireLogin currentUser={localCurrentUser}>
              <CandidateLayout currentUser={localCurrentUser} onLogout={onLogout} onSwitchRole={onSwitchRole}>
                <ProfileScreen currentUser={localCurrentUser!} onUpdateUser={handleSetCurrentUser} />
              </CandidateLayout>
            </RequireLogin>
          } />

          {/* Catch-all route to prevent blank screen on unknown paths (like /login when already logged in) */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={closeLoginModal}
          onLoginSuccess={onLogin}
        />
      </I18nProvider>
    </ThemeProvider>
  );
};

export default CandidateApp;
