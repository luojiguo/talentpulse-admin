import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useParams, Outlet } from 'react-router-dom';
import { Modal, message } from 'antd';
import { SystemUser as User, JobPosting, UserProfile as Profile, Company, Conversation, Message } from '@/types/types';
import { userAPI, jobAPI, companyAPI, messageAPI, candidateAPI, applicationAPI } from '@/services/apiService';
import { useApi } from '@/hooks/useApi';

// Import Candidate screens
import HomeScreen from './screens/HomeScreen';
import JobDetailScreen from './screens/JobDetailScreen';
import MessageCenterScreen from './screens/MessageCenterScreen';
import MockInterviewScreen from './screens/MockInterviewScreen';
import AIChatScreen from './screens/AIChatScreen';
import ProfileScreen from './screens/ProfileScreen';
import ResumeEditorScreen from './screens/ResumeEditorScreen';
import ApplicationsScreen from './screens/ApplicationsScreen';
import InterviewsScreen from './screens/InterviewsScreen';
import SavedItemsScreen from './screens/SavedItemsScreen';

import EnterpriseVerificationScreen from './screens/EnterpriseVerificationScreen';

import CandidateLayout from './components/CandidateLayout';
import LoadingSpinner from '@/components/LoadingSpinner';

interface CandidateAppProps {
  currentUser: User;
  onLogout: () => void;
  onSwitchRole: (newRole: string) => void;
}

const CandidateApp: React.FC<CandidateAppProps> = ({ currentUser, onLogout, onSwitchRole }) => {
  // Add setCurrentUser functionality by keeping local state that syncs with props
  const [localCurrentUser, setLocalCurrentUser] = useState<User>(currentUser);
  const navigate = useNavigate();

  // Sync with external currentUser prop changes
  useEffect(() => {
    setLocalCurrentUser(currentUser);
  }, [currentUser]);

  // Local setCurrentUser function that updates local state and ensures id is always a number
  const handleSetCurrentUser = (userOrUpdater: User | ((prevUser: User) => User)) => {
    setLocalCurrentUser((prevUser) => {
      const newUser = typeof userOrUpdater === 'function'
        ? userOrUpdater(prevUser)
        : userOrUpdater;

      return {
        ...newUser,
        id: typeof newUser.id === 'string' ? parseInt(newUser.id, 10) : newUser.id
      };
    });
    // Trigger profile refetch to ensure data consistency
    setTimeout(() => refetchProfile(), 100);
  };
  // Dropdown menu state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Candidate Screen Props Management
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [collectedJobs, setCollectedJobs] = useState<JobPosting[]>([]);
  const [followedCompanies, setFollowedCompanies] = useState<(string | number)[]>([]);
  const [searchText, setSearchText] = useState('');
  const [filterUnread, setFilterUnread] = useState(false);
  const [userResume, setUserResume] = useState({});
  const [currentJob, setCurrentJob] = useState<JobPosting | null>(null);

  // 消息相关状态
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [conversationError, setConversationError] = useState<string | null>(null);

  // 优化：并行获取所有初始数据，减少加载时间
  // 使用 useApi Hook 获取智能推荐的职位数据（并行加载）
  const {
    data: jobsData,
    loading: loadingJobs,
    error: jobsError
  } = useApi<{ status: string; data: JobPosting[] }>(
    () => jobAPI.getRecommendedJobs(currentUser.id) as any,
    [currentUser.id],
    { autoFetch: true, cache: true } // 启用缓存
  );
  const jobs = jobsData?.data || [];

  // 使用 useApi Hook 获取用户资料（并行加载）
  const {
    data: userProfileData,
    loading: loadingProfile,
    error: profileError,
    refetch: refetchProfile
  } = useApi<{ status: string; data: Profile }>(
    () => userAPI.getUserById(currentUser.id) as any,
    [currentUser.id],
    { autoFetch: true, cache: true } // 启用缓存
  );

  // 使用 useApi Hook 获取关注的公司（并行加载）
  const {
    data: followedCompaniesData,
    loading: loadingFollowedCompanies,
    error: followedCompaniesError
  } = useApi<{ status: string; data: Company[] }>(
    () => companyAPI.getFollowedCompanies(currentUser.id) as any,
    [currentUser.id],
    { autoFetch: true, cache: true } // 启用缓存
  );

  useEffect(() => {
    if (followedCompaniesData?.status === 'success') {
      const followedCompanyIds = followedCompaniesData.data.map(company => company.id) || [];
      setFollowedCompanies(followedCompanyIds);
    }
  }, [followedCompaniesData]);

  // --- 所有回调函数均放在此处定义，确保初始化顺序 ---

  // 获取用户对话列表
  const fetchConversations = useCallback(async () => {
    if (!currentUser.id) return;

    setLoadingConversations(true);
    setConversationError(null);

    try {
      // 直接调用 API，API 服务层已经处理了超时（60秒）
      const response = await messageAPI.getConversations(currentUser.id);

      if ((response as any).success) {
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
          const mergedConversations = newData.map((conv: any) => {
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
    } finally {
      setLoadingConversations(false);
    }
  }, [currentUser.id, activeConversationId]); // 添加 activeConversationId 依赖以防丢失当前对话

  // 修改setActiveConversationId的调用方式，添加获取详细消息的逻辑
  const handleSelectConversation = useCallback(async (conversationId: string | number, limit = 15, offset = 0) => {
    try {
      const idToSet = typeof conversationId === 'string' ? parseInt(conversationId, 10) : conversationId;
      setActiveConversationId(idToSet.toString());

      // 标记消息为已读 - 先调用，减少等待时间
      const markFunc = (messageAPI as any).markMessagesAsRead || messageAPI.markAsRead;
      if (markFunc) {
        await markFunc(idToSet, currentUser.id);
      }

      // 获取对话的详细消息，默认获取最新的15条，减少首屏渲染压力
      const response = await (messageAPI as any).getConversationDetail(idToSet, limit, offset, 'desc');
      if ((response as any).success) {
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
        setConversations(prevConversations =>
          prevConversations.map(conv => {
            if (conv.id.toString() === idToSet.toString()) {
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
                // 如果后端返回了最新的对话信息，也可以在这里更新
                lastMessage: conversation?.last_message || conversation?.lastMessage || conv.lastMessage,
                lastTime: conversation?.last_time || conversation?.lastTime || conv.lastTime,
                // 标记消息为已读后，重置未读计数
                unreadCount: 0,
                candidateUnread: 0
              };
            }
            return conv;
          })
        );
      }
    } catch (error) {
      console.error('获取对话详情失败:', error);
      // 不影响用户体验，仅记录错误
    }
  }, [currentUser.id]);

  // 加载更多历史消息
  const handleLoadMoreMessages = useCallback(async (conversationId: string | number, currentMessageCount: number) => {
    try {
      const idToFetch = conversationId.toString();
      // 获取更早的消息 (offset = 当前已加载的消息数)
      const response = await (messageAPI as any).getConversationDetail(idToFetch, 20, currentMessageCount, 'desc');
      
      if ((response as any).success) {
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

        // 排序新获取的消息（升序，最早在上）
        const sortedNewMessages = messages.sort((a: any, b: any) =>
          new Date(a.time).getTime() - new Date(b.time).getTime()
        );

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
              const sortedMessages = mergedMessages.sort((a, b) =>
                new Date(a.time).getTime() - new Date(b.time).getTime()
              );

              return { 
                ...conv, 
                messages: sortedMessages
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
  const handleSendMessage = useCallback(async (text: string, type: any = 'text') => {
    if (!activeConversationId) return;

    try {
      // 找到当前对话
      const conversation = conversations.find(c => c.id.toString() === activeConversationId.toString());
      if (!conversation) return;

      // 优化：发送消息的同时本地更新，提升响应速度
      const response = await messageAPI.sendMessage({
        conversationId: activeConversationId,
        senderId: currentUser.id,
        receiverId: undefined, // 后端会自动根据conversationId查找接收者
        text,
        type
      } as any);

      if ((response as any).success) {
        // 更新本地对话列表
        const updatedConversations = conversations.map(c => {
          if (c.id.toString() === activeConversationId.toString()) {
            // 创建新消息对象
            const newMessage = {
              id: response.data.id || Date.now(),
              conversation_id: activeConversationId,
              sender_id: currentUser.id,
              receiver_id: conversation.recruiterUserId || conversation.recruiter_user_id || conversation.recruiterId || conversation.recruiter_id || conversation.RecruiterId,
              text,
              type,
              status: 'sent',
              time: new Date().toISOString(),
              created_at: new Date().toISOString(),
              sender_name: currentUser.name || '我',
              sender_avatar: currentUser.avatar
            };

            return {
              ...c,
              lastMessage: text,
              lastTime: new Date().toISOString(),
              total_messages: (c.total_messages || 0) + 1,
              recruiter_unread: (c.recruiter_unread || 0) + 1,
              updated_at: new Date().toISOString(),
              messages: [...(c.messages || []), newMessage]
            };
          }
          return c;
        });

        setConversations(updatedConversations);

        // 发送消息后重新获取对话列表，确保HR信息实时更新
        setTimeout(() => {
          fetchConversations();
        }, 1000); // 延迟1秒，确保后端数据已更新
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      alert('发送消息失败，请稍后重试');
    }
  }, [activeConversationId, conversations, currentUser, fetchConversations]);

  // Handle Delete Message
  const handleDeleteMessage = useCallback(async (conversationId: string | number, messageId: number | string) => {
    try {
      // 调用后端API删除消息，传入deletedBy参数
      const response = await messageAPI.deleteMessage(messageId, { deletedBy: currentUser.id });

      if ((response as any).success) {
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
        
        // 关键修复：删除消息后重新获取对话列表，确保“最后一条消息”同步更新
        setTimeout(() => {
          fetchConversations();
        }, 500);
      }
    } catch (error) {
      console.error('删除消息失败:', error);
      message.error('删除消息失败，请稍后重试');
    }
  }, [currentUser.id, fetchConversations]);

  // Handle Delete Conversation
  const handleDeleteConversation = useCallback(async (conversationId: string | number) => {
    try {
      // 调用后端API删除对话
      const response = await messageAPI.deleteConversation(conversationId);

      if ((response as any).success) {
        // 从本地状态中删除对话
        setConversations(prevConversations =>
          prevConversations.filter(conv => conv.id.toString() !== conversationId.toString())
        );

        // 如果删除的是当前活跃的对话，重置活跃对话ID
        if (activeConversationId?.toString() === conversationId.toString()) {
          setActiveConversationId(null);
        }

        // 显示删除成功提示
        alert('与该招聘者的聊天记录已成功删除，数据已软删除并保留在数据库中');
      }
    } catch (error) {
      console.error('删除对话失败:', error);
      alert('删除对话失败，请稍后重试');
    }
  }, [activeConversationId]);

  // Handle Upload Image Message
  const handleUploadImage = useCallback(async (conversationId: string | number, file: File) => {
    try {
      // 找到当前对话
      const conversation = conversations.find(c => c.id.toString() === conversationId.toString());
      if (!conversation) return;

      const receiverId = conversation.recruiterUserId || conversation.recruiter_user_id || conversation.recruiterId || conversation.recruiter_id || conversation.RecruiterId;
      
      const response = await messageAPI.uploadChatImage(
        conversationId,
        currentUser.id,
        receiverId,
        file
      );

      if ((response as any).success) {
        // 更新本地对话列表
        const updatedConversations = conversations.map(c => {
          if (c.id.toString() === conversationId.toString()) {
            const newMessage = {
              ...response.data,
              sender_name: currentUser.name || '我',
              sender_avatar: currentUser.avatar
            };

            return {
              ...c,
              lastMessage: '[图片]',
              lastTime: new Date().toISOString(),
              total_messages: (c.total_messages || 0) + 1,
              recruiter_unread: (c.recruiter_unread || 0) + 1,
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
  }, [conversations, currentUser, fetchConversations]);

  // 优化：延迟获取对话列表，避免阻塞初始渲染
  useEffect(() => {
    // 延迟100ms获取，让页面先渲染
    const timer = setTimeout(() => {
      fetchConversations();
    }, 100);

    return () => clearTimeout(timer);
  }, [currentUser.id]);

  // 实时更新对话列表，每60秒刷新一次（只在有对话时刷新）
  useEffect(() => {
    // 即使 conversations 为空也应该尝试获取，因为可能有新对话
    const interval = setInterval(() => {
      fetchConversations();
    }, 60000); // 60秒刷新一次

    return () => clearInterval(interval); // 清理定时器
  }, [fetchConversations]);

  // 监听对话变化，实现实时更新
  const handleConversationUpdate = (conversationId: string) => {
    // 当对话有新消息或更新时，重新获取对话列表
    fetchConversations();
  };

  // 处理用户资料数据
  const userProfile: Profile = userProfileData?.status === 'success' ? {
    id: currentUser.id,
    name: userProfileData.data.name || currentUser.name,
    phone: userProfileData.data.phone || '',
    email: userProfileData.data.email || currentUser.email,
    city: userProfileData.data.city || '',
    expectedSalary: userProfileData.data.expectedSalary || '',
    jobStatus: userProfileData.data.jobStatus || '',
    bio: userProfileData.data.bio || '',
    experience: userProfileData.data.experience || '',
    avatar: userProfileData.data.avatar || currentUser.avatar
  } : {
    id: currentUser.id,
    name: currentUser.name,
    phone: '',
    email: currentUser.email,
    city: '',
    expectedSalary: '',
    jobStatus: '',
    bio: '',
    experience: '',
    avatar: currentUser.avatar
  };

  // Handle Chat Redirect - 立即沟通功能
  const handleChatRedirect = async (jobId: string | number, recruiterId: string | number) => {
    // Find the job title and recruiter info
    const job = jobs.find(j => j.id.toString() === jobId.toString());
    const jobTitle = job?.title || '该职位';
    const companyName = job?.company_name || '该公司';

    // 获取招聘者详细信息，直接从job对象中获取，实现双向绑定
    const recruiterName = job?.recruiter_name || '招聘者';
    const recruiterAvatar = job?.recruiter_avatar || '';
    const recruiterPosition = job?.recruiter_position || 'HR';

    // Create default message with format: 打招呼+介绍自己+应聘的岗位
    const defaultMessage = `您好！我是${userProfile.name || currentUser.name}，我想应聘${jobTitle}职位，想了解更多相关信息。`;

    try {
      // 1. 创建申请记录（立即沟通也是一种申请方式）
      // 后端会自动处理user_id到candidate_id的转换
      try {
        await candidateAPI.applyForJob(currentUser.id, jobId, {
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
        candidateId: currentUser.id,
        recruiterId,
        message: defaultMessage
      });

      if ((response as any).success) {
        const { conversationId, message: sentMessage } = response.data;

        // 创建新的对话对象，包含完整的招聘者信息，实现双向绑定
        const newConversation = {
          id: conversationId,
          jobId,
          candidateId: currentUser.id,
          recruiterId,
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
              recruiter_position: recruiterPosition, // 更新招聘者信息，实现双向绑定
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

        // 立即重新获取对话列表，确保与后端数据同步
        setTimeout(async () => {
          await fetchConversations();
        }, 1000);

        // 显示确认框，询问是否跳转到消息列表
        Modal.confirm({
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
      Modal.confirm({
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
    <>
      {isInitialLoading && (
        <LoadingSpinner fullScreen text="加载中..." />
      )}
      <Routes>
      <Route path="/" element={<CandidateLayout currentUser={localCurrentUser} onLogout={onLogout} onSwitchRole={onSwitchRole}><HomeScreen jobs={jobs} loadingJobs={loadingJobs} jobsError={typeof jobsError === 'string' ? jobsError : null} followedCompanies={followedCompanies} setFollowedCompanies={setFollowedCompanies} currentUser={localCurrentUser} onChat={handleChatRedirect} /></CandidateLayout>} />
      <Route path="/job/:id" element={<CandidateLayout currentUser={localCurrentUser} onLogout={onLogout} onSwitchRole={onSwitchRole}><JobDetailScreen jobs={jobs} onBack={() => window.history.back()} collectedJobs={collectedJobs} setCollectedJobs={setCollectedJobs} onChat={handleChatRedirect} currentUser={localCurrentUser} /></CandidateLayout>} />

      {/* Message Center Routes */}
      {/* Message Center Routes - Unified Responsive Route */}
      <Route path="/messages" element={
        <CandidateLayout currentUser={localCurrentUser} onLogout={onLogout} onSwitchRole={onSwitchRole}>
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
            currentUser={localCurrentUser}
            conversationError={conversationError}
          />
        </CandidateLayout>
      }
      />
      <Route path="/messages/:conversationId" element={
        <CandidateLayout currentUser={localCurrentUser} onLogout={onLogout} onSwitchRole={onSwitchRole}>
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
            currentUser={localCurrentUser}
            conversationError={conversationError}
          />
        </CandidateLayout>
      }
      />

      <Route path="/mock-interview" element={<CandidateLayout currentUser={localCurrentUser} onLogout={onLogout} onSwitchRole={onSwitchRole}><MockInterviewScreen /></CandidateLayout>} />
      <Route path="/ai-chat" element={<CandidateLayout currentUser={localCurrentUser} onLogout={onLogout} onSwitchRole={onSwitchRole}><AIChatScreen userProfile={userProfile} userResume={userResume} currentUser={localCurrentUser} /></CandidateLayout>} />
      <Route path="/applications" element={<CandidateLayout currentUser={localCurrentUser} onLogout={onLogout} onSwitchRole={onSwitchRole}><ApplicationsScreen currentUser={localCurrentUser} /></CandidateLayout>} />
      <Route path="/saved" element={<CandidateLayout currentUser={localCurrentUser} onLogout={onLogout} onSwitchRole={onSwitchRole}><SavedItemsScreen currentUser={localCurrentUser} /></CandidateLayout>} />
      <Route path="/interviews" element={<CandidateLayout currentUser={localCurrentUser} onLogout={onLogout} onSwitchRole={onSwitchRole}><InterviewsScreen currentUser={localCurrentUser} /></CandidateLayout>} />
      <Route path="/enterprise-verification" element={<CandidateLayout currentUser={localCurrentUser} onLogout={onLogout} onSwitchRole={onSwitchRole}><EnterpriseVerificationScreen currentUser={localCurrentUser} profile={userProfile} onSwitchRole={onSwitchRole} /></CandidateLayout>} />
      <Route path="/profile" element={<CandidateLayout currentUser={localCurrentUser} onLogout={onLogout} onSwitchRole={onSwitchRole}><ProfileScreen currentUser={localCurrentUser} /></CandidateLayout>} />
      <Route path="/resume-editor" element={<CandidateLayout currentUser={localCurrentUser} onLogout={onLogout} onSwitchRole={onSwitchRole}><ResumeEditorScreen currentUser={localCurrentUser} /></CandidateLayout>} />
    </Routes>
    </>
  );
};

export default CandidateApp;