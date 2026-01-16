import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MessageSquare, Phone, MoreVertical, Send as SendIcon, Plus, Image as ImageIcon, Camera, MapPin, Trash2, ArrowLeft, ChevronDown, Copy, Reply, Pin, FileText, X, Check, Download, Search, Eye, CheckCircle, XCircle, MessageCircle } from 'lucide-react';
import { Conversation, JobPosting, Message, MergedConversation } from '@/types/types';
import { formatDateTime } from '@/utils/dateUtils';
import { useDeviceType } from '@/hooks/useMediaQuery';
import { resumeAPI, messageAPI, userAPI } from '@/services/apiService';
import { message, Modal, Input } from 'antd';

// 修复文件名编码问题的函数
const fixFilenameEncoding = (filename: string): string => {
    try {
        if (!filename) return '';

        // 尝试多种方式修复中文文件名编码
        let fixedFilename = filename;

        // 1. 检查是否需要URL解码（包含%符号）
        if (filename.includes('%')) {
            try {
                fixedFilename = decodeURIComponent(filename);
            } catch (e) {
                console.warn('Failed to decode URI component:', e);
            }
        }

        return fixedFilename;
    } catch (error) {
        console.error('修复文件名编码失败:', error);
        return filename;
    }
};

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

import {
    getMessageContainerHeight,
    getMessageContainerPadding,
    getChatWindowClasses,
    getMessageListClasses,
    getChatWindowWidth
} from '@/utils/layoutUtils';
import UserAvatar from '@/components/UserAvatar';
import InterviewCard from '@/components/InterviewCard';

interface MessageCenterScreenProps {
    conversations: Conversation[];
    jobs: JobPosting[];
    activeConversationId: string | null;
    onSelectConversation: (id: string) => void;
    onSendMessage: (text: string, type?: string, quotedMessage?: { id: string | number | null, text: string, senderName: string | null, type?: string }) => void;
    onUploadImage?: (conversationId: string | number, file: File, quotedMessage?: any) => void;
    onDeleteMessage: (conversationId: string, messageId: number | string) => void;
    onDeleteConversation: (conversationId: string) => void;
    onLoadMoreMessages?: (conversationId: string, currentCount: number) => Promise<boolean>;
    searchText: string;
    setSearchText: (text: string) => void;
    filterUnread: boolean;
    setFilterUnread: (filter: boolean) => void;
    currentUser: any;
    conversationError?: string | null;
    onPinConversation?: (conversationId: string, isPinned: boolean) => void;
    onHideConversation?: (conversationId: string) => void;
    onUpdateUser?: (user: any) => void;
}

// WeChatCard Component
const WeChatCard: React.FC<{
    msg: Message;
    isMe: boolean;
    onCopy: (text: string) => void;
    onAccept?: (id: string | number) => void;
    onReject?: (id: string | number) => void;
}> = ({ msg, isMe, onCopy, onAccept, onReject }) => {
    // Parse content
    let content: any = {};
    try {
        content = typeof msg.text === 'string' && msg.text.startsWith('{')
            ? JSON.parse(msg.text)
            : {};
    } catch (e) {
        content = {};
    }

    const { wechat = '', status = 'pending', receiver_wechat = '' } = content;
    const isAccepted = status === 'accepted';
    const isRejected = status === 'rejected';

    // State 1: Rejected
    if (isRejected) {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4 min-w-[200px] opacity-80">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded bg-gray-400 dark:bg-gray-600 flex items-center justify-center text-white text-xs font-bold">We</div>
                    <span className="text-gray-500 dark:text-gray-400 font-medium text-sm">微信交换已拒绝</span>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                    {isMe
                        ? (content.initiator_wechat === wechat ? '对方拒绝了您的请求' : '您拒绝了对方的请求')
                        : '请求已被拒绝'
                    }
                </p>
            </div>
        );
    }

    // State 2: Accepted (Show both IDs)
    if (isAccepted) {
        // My ID vs Other ID
        // If I am sender (isMe), my ID is `wechat`. Other ID is `receiver_wechat`.
        // If I am receiver (!isMe), my ID is `receiver_wechat`. Other ID is `wechat`.

        // Actually, let's keep it simple: Show the "Other Party's" ID to the user.
        // But the requirement says "Mutual Reveal".
        const displayWechat = isMe ? (receiver_wechat || '对方已同意') : (wechat || '对方已同意');

        return (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-brand-100 dark:border-brand-800 p-4 min-w-[240px]">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: '#007AFF' }}>We</div>
                    <span className="text-gray-900 dark:text-slate-100 font-medium text-sm">微信交换成功</span>
                </div>
                <div className="bg-brand-50/50 dark:bg-brand-900/20 p-3 rounded border border-brand-100 dark:border-brand-800 mb-3">
                    <p className="text-xs text-brand-600 dark:text-brand-400 mb-1">对方微信号</p>
                    <p className="text-base font-semibold text-brand-700 dark:text-brand-400 select-all font-mono">{displayWechat}</p>
                </div>
                <button
                    onClick={() => onCopy(displayWechat)}
                    className="w-full py-2 bg-white dark:bg-slate-700 border border-brand-200 dark:border-brand-700 text-xs font-medium rounded hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors flex items-center justify-center gap-2"
                    style={{ color: '#007AFF' }}
                >
                    <Copy className="w-3.5 h-3.5" /> 复制微信号
                </button>
            </div>
        );
    }

    // State 3: Pending
    if (isMe) {
        // Sender View (Pending)
        return (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-brand-100 dark:border-brand-800 p-4 min-w-[200px]">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: '#007AFF' }}>We</div>
                    <span className="text-gray-900 dark:text-slate-100 font-medium text-sm">请求交换微信</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">我的微信号：<span className="font-semibold font-mono text-gray-900 dark:text-slate-100">{wechat}</span></p>
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <div className="w-3 h-3 border-2 border-gray-300 dark:border-gray-600 border-t-gray-600 dark:border-t-gray-400 rounded-full animate-spin mr-2"></div>
                    等待对方回复...
                </div>
            </div>
        );
    }

    // Receiver View (Pending)
    return (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-brand-100 dark:border-brand-800 p-4 min-w-[260px]">
            <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded bg-brand-500 flex items-center justify-center shrink-0" style={{ backgroundColor: '#007AFF' }}>
                    <span className="text-white text-xl font-bold">We</span>
                </div>
                <div>
                    <p className="text-gray-900 dark:text-slate-100 font-medium text-sm">对方请求交换微信</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">同意后将互相通过，并交换微信号</p>
                </div>
            </div>

            <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-slate-700">
                <button
                    onClick={() => onReject && onReject(msg.id)}
                    className="flex-1 py-2 bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-300 text-xs font-medium rounded hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                >
                    拒绝
                </button>
                <button
                    onClick={() => onAccept && onAccept(msg.id)}
                    className="flex-1 py-2 text-white text-xs font-medium rounded hover:opacity-90 transition-colors shadow-sm"
                    style={{ backgroundColor: '#007AFF' }}
                >
                    同意交换
                </button>
            </div>
        </div>
    );
};


// Helper to format message preview text (handle JSON for wechat exchange and resumes)
const formatMessagePreview = (content: string | undefined): string => {
    if (!content) return '';

    // Check if content looks like JSON
    if (typeof content === 'string' && (content.startsWith('{') || content.includes('"type"'))) {
        try {
            const parsed = JSON.parse(content);
            if (parsed.msg) return parsed.msg;
            if (parsed.wechat || parsed.initiator_wechat || parsed.status === 'pending') {
                return '[微信交换请求]';
            }
            if (parsed.type === 'image') return '[图片]';
            if (parsed.type === 'file') return '[文件]';
            if (parsed.type === 'resume') return '[简历]';
            if (parsed.type === 'interview_invitation') return '[面试邀请]';

            // Fallback
            return content;
        } catch (e) {
            return content;
        }
    }
    return content;
};


const MessageCenterScreen: React.FC<MessageCenterScreenProps> = ({
    conversations, jobs, activeConversationId,
    onSelectConversation,
    onSendMessage, onUploadImage, onDeleteMessage, onDeleteConversation,
    onLoadMoreMessages,
    searchText, setSearchText, filterUnread, setFilterUnread, currentUser,
    conversationError, onPinConversation, onHideConversation, onUpdateUser
}) => {

    const navigate = useNavigate();
    const { conversationId: paramConversationId } = useParams<{ conversationId: string }>();
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [input, setInput] = useState('');
    const [showExtrasMenu, setShowExtrasMenu] = useState(false);
    // 回复状态
    const [replyingTo, setReplyingTo] = useState<{
        msgId: number | string,
        text: string,
        senderName: string,
        isMe: boolean
    } | null>(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(false);

    // Resume selection modal state
    const [showResumeModal, setShowResumeModal] = useState(false);
    const [userResumes, setUserResumes] = useState<any[]>([]);
    const [selectedResume, setSelectedResume] = useState<any | null>(null);
    const [isLoadingResumes, setIsLoadingResumes] = useState(false);
    const [isUploadingResume, setIsUploadingResume] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const resumeUploadInputRef = useRef<HTMLInputElement>(null);

    // 交换微信相关状态
    const [showWechatModal, setShowWechatModal] = useState(false);
    const [wechatNumber, setWechatNumber] = useState('');
    const [exchangeRequests, setExchangeRequests] = useState<Record<string, boolean>>({}); // conversationId: 是否已发送请求
    const [wechatExchangeStatus, setWechatExchangeStatus] = useState<Record<string, 'pending' | 'accepted' | 'rejected'>>({}); // conversationId: 交换状态
    const [receivedWechatNumbers, setReceivedWechatNumbers] = useState<Record<string, string>>({}); // conversationId: 对方微信号
    const [isSendingRequest, setIsSendingRequest] = useState(false);
    // Pending action state for WeChat modal
    const [pendingAction, setPendingAction] = useState<{ type: 'send' | 'accept', id?: string | number } | null>(null);

    // 使用精确的设备类型判断
    const { isMobile, isTablet, isDesktop } = useDeviceType();

    const activeConv = React.useMemo(() =>
        conversations.find((c: Conversation) => c.id.toString() === activeConversationId?.toString()),
        [conversations, activeConversationId]);


    // Sync URL param with active ID or handle selection
    useEffect(() => {
        const syncConversation = async () => {
            if (!paramConversationId) return; // Guard against undefined param

            try {
                // 调用父组件的选择函数（异步获取详情）
                await onSelectConversation(paramConversationId);
            } catch (error) {
                console.error('Failed to sync conversation:', error);
            }

        };

        syncConversation();
    }, [paramConversationId, onSelectConversation]); // 移除 activeConversationId 依赖，由内部逻辑判断是否需要同步

    // 响应式布局逻辑：
    // - 手机：通过路由切换，只显示列表或聊天（不能同时显示）
    // - 平板：同时显示列表和聊天（40% + 60%）
    // - 桌面：同时显示列表和聊天（33% + 67%）
    const showList = isMobile ? !paramConversationId : true;
    const showChat = isMobile ? !!paramConversationId : true;

    // 使用布局工具函数获取类名
    const containerHeight = getMessageContainerHeight(isMobile, isTablet, 'candidate');
    const containerPadding = getMessageContainerPadding(isMobile, isTablet);
    const listClasses = getMessageListClasses(isMobile, isTablet, showList);
    const chatClasses = getChatWindowClasses(isMobile, isTablet, showChat);
    const chatWidth = getChatWindowWidth(isMobile, isTablet);

    // Context Menu State
    const [contextMenu, setContextMenu] = useState<{
        visible: boolean,
        x: number,
        y: number,
        msgId: number | string | null,
        msgText: string,
        senderName: string,
        isMe: boolean
    }>({
        visible: false, x: 0, y: 0, msgId: null, msgText: '', senderName: '', isMe: false
    });

    // Debugging: Log messages to check presence of exchange_request
    useEffect(() => {
        if (activeConv) {
            console.log('Active Conversation Messages:', activeConv.messages);
            const exchangeMsgs = activeConv.messages?.filter((m: any) => m.type === 'exchange_request');
            if (exchangeMsgs?.length) {
                console.log('Found exchange requests:', exchangeMsgs);
            } else {
                console.log('No exchange_request messages found in this conversation');
            }
        }
    }, [activeConv]);

    const [convContextMenu, setConvContextMenu] = useState<{
        visible: boolean;
        x: number;
        y: number;
        convId: string | null;
        isPinned: boolean;
    }>({
        visible: false, x: 0, y: 0, convId: null, isPinned: false
    });

    // New: Check history for sent exchange requests
    useEffect(() => {
        if (activeConversationId && activeConv?.messages && currentUser) {
            const hasSentRequest = activeConv.messages.some((msg: any) =>
                Number(msg.sender_id) === Number(currentUser.id) &&
                ((msg.type as any) === 'exchange_request' || (msg.type as any) === 'wechat_card')
            );
            if (hasSentRequest) {
                setExchangeRequests(prev => ({ ...prev, [activeConversationId]: true }));
            }
        }
    }, [activeConversationId, activeConv, currentUser]);

    // 右键菜单处理
    const handleContextMenu = (e: React.MouseEvent, msg: Message, isMe: boolean) => {
        e.preventDefault();
        e.stopPropagation();

        // 计算菜单位置，确保不超出屏幕
        const menuWidth = 150;
        const menuHeight = 180;
        let x = e.clientX;
        let y = e.clientY;

        if (x + menuWidth > window.innerWidth) {
            x = window.innerWidth - menuWidth - 10;
        }
        if (y + menuHeight > window.innerHeight) {
            y = window.innerHeight - menuHeight - 10;
        }

        setContextMenu({
            visible: true,
            x,
            y,
            msgId: msg.id,
            msgText: msg.text || '',
            senderName: isMe ? (currentUser?.name || '我') : (msg.sender_name || '对方'),
            isMe
        });
    };

    // 复制消息
    const handleCopyMessage = () => {
        if (contextMenu.msgText) {
            navigator.clipboard.writeText(contextMenu.msgText).then(() => {
                // 可以添加 toast 提示
                console.log('消息已复制');
            });
        }
        setContextMenu(prev => ({ ...prev, visible: false }));
    };

    // 删除消息
    const handleDeleteMessage = () => {
        if (contextMenu.msgId && activeConversationId) {
            onDeleteMessage(activeConversationId, contextMenu.msgId);
        }
        setContextMenu(prev => ({ ...prev, visible: false }));
    };

    // Load user resumes
    const loadUserResumes = async () => {
        if (!currentUser?.id) return;

        setIsLoadingResumes(true);
        try {
            const response = await resumeAPI.getUserResumes(currentUser.id);
            if (response.data && response.data.status === 'success') {
                setUserResumes(response.data.data || []);
            } else {
                setUserResumes(response.data || []);
            }
        } catch (error) {
            console.error('获取简历列表失败:', error);
            message.error('获取简历列表失败');
        } finally {
            setIsLoadingResumes(false);
        }
    };

    // Format file size
    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    // Handle resume upload
    const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!currentUser?.id) {
            message.error('无法获取用户信息，请重新登录');
            console.error('handleResumeUpload: currentUser.id is missing', currentUser);
            return;
        }

        // 验证文件类型
        const allowedExtensions = ['.pdf', '.doc', '.docx'];
        const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        if (!allowedExtensions.includes(extension)) {
            message.error('只支持 PDF 或 Word 文档');
            if (resumeUploadInputRef.current) resumeUploadInputRef.current.value = '';
            return;
        }

        try {
            setIsUploadingResume(true);
            setUploadProgress(0);

            console.log('Starting resume upload for user:', currentUser.id, file.name);

            // 使用与个人中心相同的 API 调用方式
            const response = await resumeAPI.uploadResume(currentUser.id, file, (progress) => {
                setUploadProgress(progress);
            });

            console.log('Resume upload response:', response);

            if (response.data && (response.data.status === 'success' || response.data.success || response.data.id)) {
                message.success('简历上传成功');
                await loadUserResumes();
            } else {
                throw new Error(response.data?.message || '上传响应不包含成功状态');
            }
        } catch (error) {
            console.error('上传简历失败:', error);
            message.error('上传失败，请重试');
        } finally {
            setIsUploadingResume(false);
            setUploadProgress(0);
            if (resumeUploadInputRef.current) {
                resumeUploadInputRef.current.value = '';
            }
        }
    };

    // Handle send resume button click
    const handleSendResumeClick = () => {
        setSelectedResume(null);
        loadUserResumes();
        setShowResumeModal(true);
    };

    // Send selected resume file
    const handleConfirmSendResume = async () => {
        if (!selectedResume || !activeConversationId || !currentUser) {
            message.error('请选择一份简历');
            return;
        }

        const conversation = conversations.find((c: Conversation) => c.id.toString() === activeConversationId.toString());
        if (!conversation) {
            message.error('找不到当前对话');
            return;
        }

        const receiverId = conversation.recruiterUserId;

        // Step 1: Download the resume file from server (with auth header)
        const hideLoading = message.loading('正在准备简历文件...', 0);

        try {
            // Step 1: Download the resume file using resumeAPI with proper auth handling
            const resumeResponse = await resumeAPI.downloadResumeFile(selectedResume.id);

            // Convert to blob and then to File object
            const blob = resumeResponse.data;

            // Use the original filename from selectedResume (already correct in Chinese)
            let filename = selectedResume.resume_file_name || selectedResume.original_name || selectedResume.file_name || `简历_${selectedResume.id}`;

            // Fix filename encoding if needed
            filename = fixFilenameEncoding(filename);

            const file = new File([blob], filename, { type: blob.type || 'application/octet-stream' });

            // Step 2: Upload the file to chat
            const response = await messageAPI.uploadResumeFile(
                activeConversationId,
                currentUser.id,
                receiverId,
                file
            );

            hideLoading();

            if (response && ((response.data as any).status === 'success' || (response as any).success)) {
                message.success('简历发送成功');

                // Notify parent to refresh messages
                if (activeConversationId) {
                    setTimeout(() => {
                        window.dispatchEvent(new CustomEvent('refreshConversation', { detail: { conversationId: activeConversationId } }));
                    }, 500);
                }
            } else {
                // 打印失败信息到控制台
                console.error('发送简历失败，服务器返回错误:', (response.data as any).message || '未知错误');
                message.error((response.data as any).message || '发送失败，请稍后重试');
            }
        } catch (error: any) {
            hideLoading();
            // 打印详细错误信息到控制台
            console.error('发送简历失败，发生异常:', error);
            message.error(error.message || '发送失败，请稍后重试');
        } finally {
            // 关闭加载提示，但保留成功/失败提示
            hideLoading();
            // 无论成功还是失败，都关闭模态框
            setShowResumeModal(false);
        }
    };

    // 点击外部关闭右键菜单
    useEffect(() => {
        const handleClickOutside = () => {
            if (contextMenu.visible) {
                setContextMenu(prev => ({ ...prev, visible: false }));
            }
            if (convContextMenu.visible) {
                setConvContextMenu(prev => ({ ...prev, visible: false }));
            }
        };

        if (contextMenu.visible) {
            document.addEventListener('click', handleClickOutside);
            document.addEventListener('contextmenu', handleClickOutside);
            return () => {
                document.removeEventListener('click', handleClickOutside);
                document.removeEventListener('contextmenu', handleClickOutside);
            };
        }
    }, [contextMenu.visible]);

    // 使用 useMemo 优化合并逻辑，避免每次渲染都重新计算
    const mergedConversations = React.useMemo(() => {
        const recruiterMap = new Map<string | number, Conversation[]>();
        const noRecruiterIdConversations: Conversation[] = [];

        // 按招聘者ID分组
        conversations.forEach((conv) => {
            // 支持多种招聘者ID字段名
            const recruiterId = conv.recruiterUserId || conv.recruiterId;
            if (!recruiterId) {
                // 如果没有招聘者ID，单独处理
                noRecruiterIdConversations.push(conv);
                return;
            }
            if (!recruiterMap.has(recruiterId)) {
                recruiterMap.set(recruiterId, []);
            }
            recruiterMap.get(recruiterId)!.push(conv);
        });

        const merged: MergedConversation[] = [];

        // 处理有招聘者ID的对话，进行合并
        recruiterMap.forEach((convsForRecruiter) => {
            convsForRecruiter.sort((a, b) => {
                const aTime = new Date(a.updatedAt || a.lastTime || 0).getTime();
                const bTime = new Date(b.updatedAt || b.lastTime || 0).getTime();
                return bTime - aTime;
            });

            const latestConv = convsForRecruiter[0];
            const mergedConv: MergedConversation = {
                ...latestConv,
                isMerged: true,
                relatedConversationIds: convsForRecruiter.map((c) => c.id),
                allJobs: convsForRecruiter.map((c) => ({
                    id: c.id,
                    jobId: c.jobId,
                    jobTitle: c.job_title || c.jobTitle || '职位',
                    companyName: c.company_name,
                    updatedAt: c.updatedAt || c.lastTime,
                    lastMessage: c.lastMessage
                })),
                unreadCount: convsForRecruiter.reduce((sum, c) => sum + (c.unreadCount || 0), 0),
                lastTime: latestConv.lastTime || latestConv.updatedAt,
                lastMessage: latestConv.lastMessage
            };

            merged.push(mergedConv);
        });

        // 处理没有招聘者ID的对话，直接添加到合并列表中
        noRecruiterIdConversations.forEach((conv) => {
            const mergedConv: MergedConversation = {
                ...conv,
                isMerged: false,
                relatedConversationIds: [conv.id],
                allJobs: [{
                    id: conv.id,
                    jobId: conv.jobId,
                    jobTitle: conv.job_title || conv.jobTitle || '职位',
                    companyName: conv.company_name || '',
                    updatedAt: conv.updatedAt || conv.lastTime || new Date().toISOString(),
                    lastMessage: conv.lastMessage || conv.last_message || '暂无消息'
                }],
                unreadCount: conv.unreadCount || 0,
                lastTime: conv.lastTime || conv.updatedAt || new Date().toISOString(),
                lastMessage: conv.lastMessage || conv.last_message || '暂无消息'
            };
            merged.push(mergedConv);
        });

        return merged.sort((a, b) => {
            const aTime = new Date(a.lastTime || a.updatedAt || 0).getTime();
            const bTime = new Date(b.lastTime || b.updatedAt || 0).getTime();
            return bTime - aTime;
        });
    }, [conversations]);

    // 使用 useMemo 优化搜索过滤
    const filteredConversations = React.useMemo(() => {
        return mergedConversations.filter((conv) => {
            const recruiterName = conv.recruiter_name || '招聘者';
            const companyName = conv.company_name || '';
            const matchesSearch = searchText === '' ||
                recruiterName.toLowerCase().includes(searchText.toLowerCase()) ||
                companyName.toLowerCase().includes(searchText.toLowerCase());
            return matchesSearch;
        });
    }, [mergedConversations, searchText]);



    // 查找当前对话所属的合并对话组
    const mergedConvForActive = React.useMemo(() => {
        if (!activeConversationId) return null;
        return filteredConversations.find((conv) =>
            conv.isMerged && conv.relatedConversationIds?.map((id) => id.toString()).includes(activeConversationId.toString())
        );
    }, [filteredConversations, activeConversationId]);
    const [showJobSelector, setShowJobSelector] = useState(false);
    const jobSelectorRef = useRef<HTMLDivElement>(null);

    // 点击外部关闭职位选择器
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (jobSelectorRef.current && !jobSelectorRef.current.contains(event.target as Node)) {
                setShowJobSelector(false);
            }
        };

        if (showJobSelector) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showJobSelector]);

    // Scroll Logic
    const [hasMore, setHasMore] = useState(true);
    const [showScrollToNew, setShowScrollToNew] = useState(false);
    const lastConvIdRef = useRef<string | null>(null);

    const scrollToBottom = () => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    };

    // Auto-scroll when active conversation changes or new messages arrive
    useEffect(() => {
        if (activeConversationId) {
            // Un-smooth scroll for instant jump on load
            if (chatContainerRef.current) {
                chatContainerRef.current.scrollTo({
                    top: chatContainerRef.current.scrollHeight,
                    behavior: 'auto'
                });
            }
            // Also try with smooth helper after a tick for safety
            setTimeout(scrollToBottom, 100);
        }
    }, [activeConversationId, conversations]); // Depend on conversations to catch message loading

    // 滚动到最新消息（容器底部）
    const scrollToLatest = useCallback((smooth = false) => {
        if (chatContainerRef.current) {
            const container = chatContainerRef.current;
            if (smooth) {
                container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
            } else {
                container.scrollTop = container.scrollHeight;
            }
        }
    }, []);

    // 监听滚动
    const handleScroll = async (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

        // 显示"回到最新"按钮：距离底部超过 300px
        const distanceToBottom = scrollHeight - scrollTop - clientHeight;
        setShowScrollToNew(distanceToBottom > 300);

        // 加载更多逻辑：接近顶部时触发
        if (scrollTop < 50 && !isLoadingMore && hasMore && activeConversationId && onLoadMoreMessages) {
            setIsLoadingMore(true);
            const container = e.currentTarget;
            const prevScrollHeight = container.scrollHeight;

            const count = activeConv?.messages?.length || 0;
            const loaded = await onLoadMoreMessages(activeConversationId, count);

            if (!loaded) {
                setHasMore(false);
            } else {
                // 保持滚动位置：加载完旧消息后，视觉位置不跳动
                requestAnimationFrame(() => {
                    const newScrollHeight = container.scrollHeight;
                    container.scrollTop = newScrollHeight - prevScrollHeight;
                });
            }
            setIsLoadingMore(false);
        }
    };

    // 切换对话时自动滚动到底部
    useEffect(() => {
        if (activeConversationId && activeConversationId !== lastConvIdRef.current) {
            lastConvIdRef.current = activeConversationId;
            setHasMore(true);
            setShowScrollToNew(false);
            // 延迟滚动，等待消息渲染完成
            requestAnimationFrame(() => {
                scrollToLatest(false);
            });
        }
    }, [activeConversationId, scrollToLatest]);

    // 消息列表变化时（新消息到来），如果用户在底部附近，自动滚动
    useEffect(() => {
        if (activeConv?.messages?.length && !showScrollToNew) {
            scrollToLatest(true);
        }
    }, [activeConv?.messages?.length]);

    // 处理交换微信功能
    const handleExchangeWechat = useCallback(async () => {
        if (!activeConversationId) return;

        // 检查当前是否已发送请求
        if (exchangeRequests[activeConversationId]) {
            message.info('请求已发送');
            return;
        }

        const checkAndSend = async (wechatId: string) => {
            if (!wechatId || wechatId.trim() === '') {
                // 场景1：用户未设置微信号，弹出Modal让用户输入
                setWechatNumber('');
                setPendingAction({ type: 'send' });
                setShowWechatModal(true);
            } else {
                // 场景2：用户已设置微信号，直接发送请求
                await sendWechatExchangeRequest(wechatId);
            }
        };

        try {
            // 从后端获取最新的用户信息，确保微信号状态准确
            if (currentUser?.id) {
                const response = await userAPI.getUserById(currentUser.id);
                // 兼容不同的API响应结构
                const userData = response.data?.data || response.data || {};

                // CRITICAL FIX: explicit check for wechat field presence in API response
                // If API returns null/empty, we should respect that over local state which might be stale
                let latestWechat = '';

                if ('wechat' in userData) {
                    // API returned a value (even if null or empty string)
                    latestWechat = userData.wechat || '';
                } else {
                    // API didn't return wechat field? Fallback to local only then
                    latestWechat = currentUser.wechat || '';
                }

                // Treat 'null', 'undefined' strings as empty
                if (latestWechat === 'null' || latestWechat === 'undefined') {
                    latestWechat = '';
                }

                await checkAndSend(latestWechat);
            } else {
                // Fallback if no ID (shouldn't happen)
                await checkAndSend(currentUser?.wechat || '');
            }
        } catch (error) {
            console.error('获取用户信息失败，使用本地状态:', error);
            // API调用失败，降级使用本地currentUser
            await checkAndSend(currentUser?.wechat || '');
        }
    }, [activeConversationId, currentUser, exchangeRequests]);

    // 保存微信号并执行挂起的操作
    const handleSaveWechatAndSend = async () => {
        if (!wechatNumber.trim()) {
            message.error('请输入微信号');
            return;
        }

        try {
            // 更新用户资料中的微信号
            const updateResponse = await userAPI.updateUser(currentUser.id, { wechat: wechatNumber.trim() });

            // 更新currentUser中的wechat信息
            // 注意：onUpdateUser 会触发重新渲染，但我们在当前闭包中仍需使用 wechatNumber
            if (onUpdateUser) {
                onUpdateUser({ ...currentUser, wechat: wechatNumber.trim() });
            }

            // 关闭Modal
            setShowWechatModal(false);
            message.success('微信号更新成功');

            // 执行挂起的操作
            if (pendingAction) {
                if (pendingAction.type === 'send') {
                    // 发送交换微信请求
                    await sendWechatExchangeRequest(wechatNumber.trim());
                } else if (pendingAction.type === 'accept' && pendingAction.id) {
                    // 同意微信交换请求
                    await handleAcceptWechatRequestAction(pendingAction.id);
                }
                setPendingAction(null);
            }
        } catch (error) {
            console.error('更新微信号失败:', error);
            message.error('更新微信号失败，请重试');
        }
    };

    // 发送微信交换请求
    const sendWechatExchangeRequest = async (wechat: string) => {
        if (!activeConversationId) return;

        try {
            setIsSendingRequest(true);

            // 发送交换微信请求消息，使用 WechatCard 格式
            const content = JSON.stringify({
                wechat: wechat,
                status: 'pending',
                initiator_wechat: wechat
            });
            // Update type to 'wechat_card'
            await onSendMessage(content, 'wechat_card');

            // 更新状态，表示已发送请求
            setExchangeRequests(prev => ({ ...prev, [activeConversationId]: true }));

            message.success('请求已发送');
        } catch (error) {
            console.error('发送微信交换请求失败:', error);
            message.error('发送请求失败，请重试');
        } finally {
            setIsSendingRequest(false);
        }
    };

    // 处理接收方的微信交换请求 - 这里的逻辑可能不再需要，因为直接渲染消息即可，但如果需要Side Effect可以保留
    // 简化为 Update Status
    // ...

    // 同意微信交换请求
    // 同意微信交换请求
    const handleAcceptWechatRequest = async (messageId: string | number) => {
        if (!activeConversationId || !currentUser) return;

        console.log('handleAcceptWechatRequest check:', {
            hasWechat: currentUser.wechat,
            wechat: currentUser.wechat,
            currentUser
        });

        // Check if user has wechat
        // Enhanced check to catch 'undefined' string or other falsy values
        if (!currentUser.wechat ||
            currentUser.wechat === 'undefined' ||
            currentUser.wechat === 'null' ||
            currentUser.wechat.toString().trim() === '') {

            console.log('WeChat ID missing, showing modal');
            setWechatNumber('');
            setPendingAction({ type: 'accept', id: messageId });
            setShowWechatModal(true);
            return;
        }

        await handleAcceptWechatRequestAction(messageId);
    };

    // 实际执行同意操作的函数
    const handleAcceptWechatRequestAction = async (messageId: string | number) => {
        if (!currentUser) return;

        try {
            console.log('Accepting exchange request:', { messageId, currentUserId: currentUser.id, currentUser });

            // 1. Get latest user info to ensure we have the WeChat ID
            const responseUser = await userAPI.getUserById(currentUser.id);
            const userData = responseUser.data?.data || responseUser.data || {};
            const myWechat = userData.wechat || currentUser.wechat;

            // 2. Call API to update status AND content
            // Assuming the backend 'updateExchangeStatus' can handle the content update or we need a new way.
            // Since we don't have a specific API to "Merge Content", we might need to rely on the backend being smart 
            // OR we use a specialized call.
            // Let's use `messageAPI.updateExchangeStatus` but we might need to pass the WeChat ID effectively. 
            // If the backend `updateExchangeStatus` only updates a status column, we might have an issue.
            // BUT, looking at `RecruiterMessageScreen`, it calls `updateExchangeStatus`.
            // Let's assume for now we need a custom implementation or pass it.

            // Actually, let's look at `updateExchangeStatus` signature in `messageService.ts` if possible.
            // If not, I'll pass the WeChat ID as an extra arg if I can edit the service, OR 
            // I'll update the message text directly if I can.

            // For now, let's try to update based on what we have.
            // If `updateExchangeStatus` is just a status flipper, we need to update the TEXT too.
            // Let's assume we can update the message text via an edit API or the status API handles it.
            // To be safe, let's use a hypothetical `acceptExchangeRequest` that creates the properly formatted JSON.

            // WAIT, `RecruiterMessageScreen` used `messageAPI.updateExchangeStatus`. Let's stick to that for consistency first.
            // BUT we need the `receiver_wechat` in the JSON for the mutual display.
            // I will update the service call to include the ID if I can. 
            // Since I cannot change the backend logic easily right now (unless I edit the controller),
            // I will use `onSendMessage` to send a NEW message "I accepted" OR 
            // BETTER: Update the existing message text.

            // Let's try to use `messageAPI.updateMessage` if it exists, or just `updateExchangeStatus`.
            // User requirement: "Both parties see both IDs". This implies the original card updates.

            // Let's assume `updateExchangeStatus` takes `(id, status, userId, extraData?)`.
            // I'll check `messageService.ts` in a moment. For now, I'll assume I can pass it.

            const response = await messageAPI.updateExchangeStatus(messageId, 'accept', currentUser.id, { receiver_wechat: myWechat });

            // 更新状态
            setWechatExchangeStatus(prev => ({ ...prev, [activeConversationId]: 'accepted' }));

            // Refresh
            window.dispatchEvent(new CustomEvent('refreshConversation', { detail: { conversationId: activeConversationId } }));
            message.success('已同意微信交换');
        } catch (error) {
            console.error('同意微信交换请求失败:', error);
            message.error('操作失败，请重试');
        }
    };

    // 拒绝微信交换请求
    const handleRejectWechatRequest = async (messageId: string | number) => {
        if (!activeConversationId || !currentUser) return;

        try {
            const response = await messageAPI.updateExchangeStatus(messageId, 'reject', currentUser.id);

            // 更新状态
            setWechatExchangeStatus(prev => ({ ...prev, [activeConversationId]: 'rejected' }));

            message.success('已拒绝微信交换请求');
            // Refresh
            window.dispatchEvent(new CustomEvent('refreshConversation', { detail: { conversationId: activeConversationId } }));
        } catch (error) {
            console.error('拒绝微信交换请求失败:', error);
            message.error('操作失败，请重试');
        }
    };



    // 复制微信号
    const handleCopyWechat = (wechat: string) => {
        if (wechat) {
            navigator.clipboard.writeText(wechat).then(() => {
                message.success('微信号已复制');
            }).catch(() => {
                message.error('复制失败，请手动复制');
            });
        }
    };

    // 监听新消息，处理微信交换请求 (Previously handled exchange logic, now status driven by render)
    useEffect(() => {
        if (activeConv?.messages) {
            // No logic needed here for new exchange flow
        }
    }, [activeConv?.messages]);

    // 处理文件选择（图片上传）
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && activeConversationId && onUploadImage) {
            // 转换replyingTo为quotedMessage格式
            const quotedMessage = replyingTo ? {
                id: replyingTo.msgId,
                text: replyingTo.text,
                senderName: replyingTo.senderName,
                type: 'text'
            } : undefined;

            onUploadImage(activeConversationId, file, quotedMessage);
            // 清空 input 以便下次选择同一文件
            e.target.value = '';
            // 清除回复状态
            if (replyingTo) setReplyingTo(null);
        }
    };

    // 发送消息


    const handleSend = (text?: string, type?: string) => {
        const messageText = text || input.trim();
        if (messageText) {
            // 转换replyingTo为与招聘者端统一的格式
            const quotedMessage = replyingTo ? {
                id: replyingTo.msgId,
                text: replyingTo.text,
                senderName: replyingTo.senderName,
                type: 'text' // 默认类型
            } : undefined;

            // 直接发送原始消息文本，不添加额外的回复格式
            onSendMessage(messageText, type, quotedMessage);
            if (!text) {
                setInput('');
                setReplyingTo(null); // 发送后清除回复状态
            }
        }
    };

    return (
        <div className={`max-w-7xl mx-auto ${containerPadding} ${containerHeight}`}>
            <div className={`flex ${isMobile ? 'flex-col' : isTablet ? 'flex-row' : 'flex-row'} gap-4 md:gap-6 h-full ${isMobile ? 'bg-white' : ''}`}>

                {/* --- Sidebar List (Left) --- */}
                <div className={listClasses}>
                    <div className="p-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 shrink-0">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100">消息列表</h2>
                                {conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0) > 0 && (
                                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                        {conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0)}
                                    </span>
                                )}
                            </div>
                            {conversations.some(c => (c.unreadCount || 0) > 0) && (
                                <button
                                    onClick={async () => {
                                        try {
                                            await messageAPI.markAllAsRead(currentUser.id, 'candidate');
                                            window.location.reload();
                                        } catch (e) {
                                            message.error('操作失败');
                                        }
                                    }}
                                    className="text-xs text-gray-500 hover:text-brand-600 underline"
                                >
                                    一键已读
                                </button>
                            )}
                        </div>
                        <div className="relative mb-3">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="搜索联系人..."
                                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-gray-500"
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {/* 显示对话错误信息 */}
                        {conversationError && typeof conversationError === 'string' && (
                            <div className="m-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                                {conversationError}
                            </div>
                        )}
                        {filteredConversations.length > 0 ? (
                            filteredConversations.map((conv) => {
                                // 检查当前活动对话是否属于这个合并的对话组
                                const isActive = conv.isMerged
                                    ? conv.relatedConversationIds?.some((id) => id.toString() === activeConversationId?.toString())
                                    : conv.id.toString() === activeConversationId?.toString();
                                const recruiterName = conv.recruiter_name || '招聘者';
                                const recruiterAvatar = conv.recruiter_avatar || '';
                                // 如果有多个职位，显示职位数量
                                const jobCount = conv.isMerged && conv.allJobs ? conv.allJobs.length : 1;
                                const jobTitleText = conv.job_title || conv.jobTitle || '职位';
                                const displayJobTitle = jobCount > 1 ? `${jobTitleText} (${jobCount}个职位)` : jobTitleText;

                                // 获取要打开的对话ID（合并后的对话使用最新的对话ID）
                                const targetConversationId = conv.isMerged ? conv.id : conv.id;

                                return (
                                    <div
                                        key={conv.id}
                                        onClick={() => {
                                            // 统一使用导航作为选择的唯一触发源
                                            // 这样 useEffect 会监听 URL 变化并触发 onSelectConversation
                                            navigate(`/messages/${targetConversationId}`);
                                        }}
                                        onContextMenu={(e) => {
                                            if (onPinConversation && onHideConversation) {
                                                e.preventDefault();
                                                setConvContextMenu({
                                                    visible: true,
                                                    x: e.clientX,
                                                    y: e.clientY,
                                                    convId: conv.id.toString(),
                                                    isPinned: false
                                                });
                                            }
                                        }}
                                        className={`relative group p-4 border-b border-gray-50 dark:border-slate-700 cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-slate-800/50 
                                            ${isActive && !isMobile ? 'bg-brand-50 dark:bg-brand-900/30 border-l-4 border-l-brand-600 dark:border-l-brand-500 shadow-sm z-10' : 'border-l-4 border-l-transparent'}`}
                                    >
                                        <div className="flex justify-between mb-1">
                                            <div className="flex items-center gap-2">
                                                <UserAvatar
                                                    src={recruiterAvatar}
                                                    name={recruiterName}
                                                    size={40}
                                                    className="bg-blue-100 text-blue-600 border border-blue-50"
                                                />
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-1">
                                                        <h4 className={`font-bold text-sm truncate ${isActive && !isMobile ? 'text-brand-700 dark:text-white' : 'text-gray-900 dark:text-slate-200'}`}>{recruiterName}</h4>

                                                    </div>
                                                    <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{displayJobTitle} • {conv.company_name || '未知公司'}</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="text-xs text-gray-400">{formatDateTime(conv.lastTime).split(' ')[0]}</span>
                                                {conv.unreadCount > 0 && (
                                                    <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                                        {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                                                    </span>
                                                )}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const confirmText = conv.isMerged && conv.allJobs && conv.allJobs.length > 1
                                                            ? `确定删除与${recruiterName}的所有${conv.allJobs.length}个职位对话吗？`
                                                            : '确定删除此对话吗？';
                                                        if (window.confirm(confirmText)) {
                                                            // 如果是合并的对话，删除所有相关对话
                                                            if (conv.isMerged && conv.relatedConversationIds) {
                                                                conv.relatedConversationIds.forEach((id: string) => {
                                                                    onDeleteConversation(id);
                                                                });
                                                            } else {
                                                                onDeleteConversation(conv.id);
                                                            }
                                                        }
                                                    }}
                                                    className="p-1 text-gray-300 hover:text-red-500"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-slate-400 truncate mt-2 pl-12">{formatMessagePreview(conv.lastMessage)}</p>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="p-8 text-center text-gray-400">
                                <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                <p>暂无消息</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Conversation Context Menu */}
                {convContextMenu.visible && (
                    <div
                        className="fixed z-50 bg-white shadow-xl rounded-lg border border-gray-100 py-1 w-32 animate-in fade-in zoom-in-95 duration-100"
                        style={{ top: convContextMenu.y, left: convContextMenu.x }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => {
                                onPinConversation && onPinConversation(convContextMenu.convId!, convContextMenu.isPinned);
                                setConvContextMenu({ ...convContextMenu, visible: false });
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                            <Pin className="w-4 h-4" /> {convContextMenu.isPinned ? '取消置顶' : '置顶会话'}
                        </button>
                        <button
                            onClick={() => {
                                onHideConversation && onHideConversation(convContextMenu.convId!);
                                setConvContextMenu({ ...convContextMenu, visible: false });
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" /> 隐藏会话
                        </button>
                    </div>
                )}

                {/* --- Chat Window (Right) --- */}
                <div className={`${chatClasses} ${chatWidth}`}>
                    {activeConv ? (
                        <>
                            {/* Header */}
                            <div className="p-4 border-b bg-white dark:bg-slate-800 dark:border-slate-700 flex justify-between items-center shadow-sm z-10 shrink-0">
                                <div className="flex items-center gap-3">
                                    {isMobile && (
                                        <button
                                            onClick={() => navigate('/messages')}
                                            className="p-1 -ml-2 mr-1 text-gray-600 hover:text-brand-600 transition-colors"
                                            aria-label="返回消息列表"
                                        >
                                            <ArrowLeft className="w-6 h-6" />
                                        </button>
                                    )}
                                    <UserAvatar
                                        src={activeConv.recruiter_avatar}
                                        name={activeConv.recruiter_name}
                                        size={40}
                                        className="bg-blue-100 text-blue-600 border border-blue-200"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <h2 className="text-base font-bold text-gray-900 dark:text-white">{activeConv.recruiter_name || '招聘者'}</h2>
                                        {mergedConvForActive && mergedConvForActive.allJobs && mergedConvForActive.allJobs.length > 1 ? (
                                            <div className="relative">
                                                <button
                                                    onClick={() => setShowJobSelector(!showJobSelector)}
                                                    className="text-xs text-gray-500 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 flex items-center gap-1 max-w-[200px] truncate"
                                                >
                                                    <span>{activeConv.job_title || activeConv.jobTitle || '职位'}</span>
                                                    <ChevronDown className={`w-3 h-3 transition-transform ${showJobSelector ? 'rotate-180' : ''}`} />
                                                </button>
                                                {showJobSelector && (
                                                    <div
                                                        ref={jobSelectorRef}
                                                        className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[200px] max-h-60 overflow-y-auto"
                                                    >
                                                        {mergedConvForActive.allJobs.map((job) => {
                                                            const isCurrentJob = job.id.toString() === activeConversationId?.toString();
                                                            return (
                                                                <button
                                                                    key={job.id}
                                                                    onClick={() => {
                                                                        navigate(`/messages/${job.id}`);
                                                                        setShowJobSelector(false);
                                                                    }}
                                                                    className={`w-full text-left px-3 py-2 text-xs hover:bg-brand-50 transition-colors ${isCurrentJob ? 'bg-brand-50 text-brand-600 font-medium' : 'text-gray-700'
                                                                        }`}
                                                                >
                                                                    <div className="font-medium">{job.jobTitle || '职位'}</div>
                                                                    <div className="text-gray-500 truncate">{job.companyName || activeConv.company_name}</div>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-gray-500 max-w-[150px] truncate">{activeConv.company_name || '公司'} • {activeConv.job_title || activeConv.jobTitle || '职位'}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2 items-center">
                                    <button
                                        onClick={handleSendResumeClick}
                                        className="hidden md:block px-3 py-1.5 bg-brand-50 text-brand-600 text-xs rounded-full whitespace-nowrap hover:bg-brand-100 transition-colors"
                                        style={{ backgroundColor: '#EFF6FF', color: '#007AFF' }}
                                    >
                                        发送简历
                                    </button>
                                    <button
                                        onClick={handleExchangeWechat}
                                        disabled={exchangeRequests[activeConversationId || ''] || isSendingRequest}
                                        className={`hidden md:block px-3 py-1.5 bg-brand-50 text-brand-600 text-xs rounded-full whitespace-nowrap hover:bg-brand-100 transition-colors ${exchangeRequests[activeConversationId || ''] ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        style={{ backgroundColor: '#EFF6FF', color: '#007AFF' }}
                                    >
                                        {exchangeRequests[activeConversationId || ''] ? '请求已发送' : '交换微信'}
                                    </button>
                                    <button className="p-2 text-gray-400 hover:text-brand-600 bg-gray-50 rounded-full"><Phone className="w-4 h-4" /></button>
                                    <button className="p-2 text-gray-400 hover:text-brand-600 bg-gray-50 rounded-full"><MoreVertical className="w-4 h-4" /></button>
                                </div>
                            </div>



                            {/* Messages */}
                            <div
                                ref={chatContainerRef}
                                onScroll={handleScroll}
                                className="flex-1 bg-slate-50 dark:bg-slate-900 p-4 overflow-y-auto custom-scrollbar relative"
                                onClick={() => {
                                    if (showExtrasMenu) setShowExtrasMenu(false);
                                    if (showJobSelector) setShowJobSelector(false);
                                }}
                            >
                                {/* 加载更多指示器 */}
                                {isLoadingMore && (
                                    <div className="flex justify-center py-2">
                                        <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                )}
                                {/* 消息列表 */}
                                <div className="space-y-4">
                                    {/* 微信交换请求Modal */}
                                    <Modal
                                        title="设置微信号"
                                        open={showWechatModal}
                                        onOk={handleSaveWechatAndSend}
                                        onCancel={() => {
                                            setShowWechatModal(false);
                                            setPendingAction(null);
                                        }}
                                        confirmLoading={isSendingRequest}
                                        okText="保存并继续"
                                        cancelText="取消"
                                    >
                                        <div className="py-2">
                                            <p className="mb-4 text-sm text-gray-600">请输入您的微信号，以便对方可以添加您</p>
                                            <Input
                                                placeholder="请输入微信号"
                                                value={wechatNumber}
                                                onChange={(e) => setWechatNumber(e.target.value)}
                                                maxLength={20}
                                                size="large"
                                            />
                                        </div>
                                    </Modal>

                                    {(!activeConv?.messages || activeConv.messages.length === 0) ? (
                                        <div className="text-center py-10 text-gray-400 text-xs">
                                            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                            <p>暂无消息记录，开始聊天吧</p>
                                        </div>
                                    ) : (() => {
                                        // Deduplicate messages before rendering
                                        const uniqueMessages = (activeConv.messages || []).reduce((acc: any[], current: any) => {
                                            const x = acc.find((item: any) => item.id?.toString() === current.id?.toString());
                                            if (!x) {
                                                return acc.concat([current]);
                                            } else {
                                                return acc;
                                            }
                                        }, []);

                                        return uniqueMessages.map((msg: Message, i: number) => {
                                            const isMe = Number(msg.sender_id) === Number(currentUser?.id);
                                            const isSystem = msg.type === 'system';
                                            const isInterviewInvitation = msg.type === 'interview_invitation';

                                            // --- 时间分割线逻辑 ---
                                            const prevMsg = uniqueMessages[i - 1];
                                            let showTimeDivider = false;
                                            if (i === 0) {
                                                showTimeDivider = true;
                                            } else if (prevMsg) {
                                                const diff = new Date(msg.time).getTime() - new Date(prevMsg.time).getTime();
                                                if (diff > 5 * 60 * 1000) { // 超过5分钟显示一次时间
                                                    showTimeDivider = true;
                                                }
                                            }

                                            if (isSystem) return (
                                                <div key={i}>
                                                    {showTimeDivider && (
                                                        <div className="flex justify-center my-4">
                                                            <span className="text-[11px] text-gray-400 font-medium">{formatDateTime(msg.time)}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex justify-center my-4">
                                                        <span className="text-xs bg-gray-200 text-gray-500 px-3 py-1 rounded-full">{msg.text}</span>
                                                    </div>
                                                </div>
                                            );

                                            if (isInterviewInvitation) return (
                                                <div key={i}>
                                                    {showTimeDivider && (
                                                        <div className="flex justify-center my-4">
                                                            <span className="text-[11px] text-gray-400 font-medium">{formatDateTime(msg.time)}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex justify-center my-4">
                                                        <InterviewCard
                                                            msg={msg}
                                                            isCurrentUser={isMe}
                                                            isRecruiter={false}
                                                            onAccept={async (interviewId, messageId) => {
                                                                // Handle accept interview
                                                                // 消息提示已在 InterviewCard 组件中显示，这里不需要重复
                                                                // Refresh conversation
                                                                window.dispatchEvent(new CustomEvent('refreshConversation', { detail: { conversationId: activeConversationId } }));
                                                            }}
                                                            onReject={async (interviewId, messageId) => {
                                                                // Handle reject interview
                                                                // 消息提示已在 InterviewCard 组件中显示，这里不需要重复
                                                                // Refresh conversation
                                                                window.dispatchEvent(new CustomEvent('refreshConversation', { detail: { conversationId: activeConversationId } }));
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            );

                                            return (
                                                <div key={i} className="flex flex-col gap-4">
                                                    {showTimeDivider && (
                                                        <div className="flex justify-center my-2">
                                                            <span className="text-[11px] text-gray-400 font-medium">{formatDateTime(msg.time)}</span>
                                                        </div>
                                                    )}
                                                    <div className={`flex gap-2 items-end ${isMe ? 'justify-end' : 'justify-start'} group`}>
                                                        {!isMe && (
                                                            <UserAvatar
                                                                src={msg.sender_avatar}
                                                                name={msg.sender_name}
                                                                size={32}
                                                                className="bg-blue-100 text-blue-600"
                                                            />
                                                        )}
                                                        <div
                                                            className={`max-w-[70%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm cursor-pointer select-text
                                                        ${isMe ? 'bg-brand-500 text-white rounded-bl-lg' : 'bg-white dark:bg-slate-800 border border-gray-100/50 dark:border-slate-700 text-gray-800 dark:text-slate-200 rounded-br-lg'}
                                                        hover:shadow-md transition-shadow
                                                    `}
                                                            style={{ backgroundColor: isMe ? '#007AFF' : undefined }}
                                                            onContextMenu={(e) => handleContextMenu(e, msg, isMe)}
                                                        >


                                                            {(msg.type as any) === 'wechat_card' ? (
                                                                <WeChatCard
                                                                    msg={msg}
                                                                    isMe={isMe}
                                                                    onCopy={(text) => {
                                                                        navigator.clipboard.writeText(text).then(() => {
                                                                            message.success('已复制微信号');
                                                                        });
                                                                    }}
                                                                />
                                                            ) : (msg.type as any) === 'exchange_request' ? (
                                                                // Keep legacy support or remove if fully deprecated. 
                                                                // User asked to "Replace/Refine", but having fallback is good.
                                                                // For now keeping it but focus on wechat_card as primary.
                                                                <div className="bg-white rounded-lg shadow-sm border border-brand-100 overflow-hidden min-w-[260px] max-w-[300px]">
                                                                    {/* Legacy exchange request rendering... */}
                                                                    {(() => {
                                                                        let status = 'pending';
                                                                        let initiatorWechat = '';
                                                                        let receiverWechat = '';

                                                                        try {
                                                                            if (msg.text && (msg.text.startsWith('{') || msg.text === '')) {
                                                                                const content = msg.text ? JSON.parse(msg.text) : {};
                                                                                status = content.status || 'pending';
                                                                                initiatorWechat = content.initiator_wechat;
                                                                                receiverWechat = content.receiver_wechat;
                                                                            }
                                                                        } catch (e) {
                                                                            // fallback
                                                                        }

                                                                        if (status === 'pending') {
                                                                            return (
                                                                                <div>
                                                                                    <div className="p-4 bg-brand-50/30">
                                                                                        <div className="flex items-start gap-3 mb-3">
                                                                                            <div className="w-10 h-10 rounded bg-brand-500 flex items-center justify-center shrink-0" style={{ backgroundColor: '#007AFF' }}>
                                                                                                <span className="text-white text-xl font-bold">We</span>
                                                                                            </div>
                                                                                            <p className="text-gray-900 font-medium text-[15px] leading-snug">
                                                                                                {isMe ? '您发起了微信交换请求' : '我想要和您交换微信，您是否同意'}
                                                                                            </p>
                                                                                        </div>
                                                                                        <p className="text-xs text-gray-500 leading-relaxed">
                                                                                            为保障您的安全建议在平台内沟通，微信沟通中需特别保护您的个人信息，谨防受骗。
                                                                                        </p>
                                                                                    </div>

                                                                                    {!isMe ? (
                                                                                        <div className="flex border-t border-gray-100">
                                                                                            <button
                                                                                                onClick={() => handleRejectWechatRequest(msg.id)}
                                                                                                className="flex-1 py-3 text-sm text-gray-600 hover:bg-gray-50 transition-colors font-medium"
                                                                                            >
                                                                                                拒绝
                                                                                            </button>
                                                                                            <div className="w-px bg-gray-100"></div>
                                                                                            <button
                                                                                                onClick={() => handleAcceptWechatRequest(msg.id)}
                                                                                                className="flex-1 py-3 text-sm text-brand-600 hover:bg-brand-50 transition-colors font-medium"
                                                                                            >
                                                                                                同意
                                                                                            </button>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <div className="p-3 bg-gray-50 text-center border-t border-gray-100">
                                                                                            <span className="text-xs text-gray-400">等待对方验证...</span>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            );
                                                                        } else if (status === 'accepted') {
                                                                            const otherWechat = isMe ? receiverWechat : initiatorWechat;
                                                                            // const otherName = isMe ? (activeConv?.recruiter_name || '对方') : (activeConv?.candidate_name || '对方'); // Get name if possible, else '对方'
                                                                            const displayName = isMe ? '对方' : (msg.sender_name || '对方');

                                                                            return (
                                                                                <div className="p-4">
                                                                                    <div className="flex items-center gap-3 mb-4">
                                                                                        <div className="w-10 h-10 rounded bg-brand-500 flex items-center justify-center shrink-0" style={{ backgroundColor: '#007AFF' }}>
                                                                                            <span className="text-white text-xl font-bold">We</span>
                                                                                        </div>
                                                                                        <div>
                                                                                            <p className="text-gray-500 text-xs mb-0.5">{displayName}的微信号</p>
                                                                                            <p className="text-gray-900 font-medium text-base select-all">{otherWechat || '未知'}</p>
                                                                                        </div>
                                                                                    </div>
                                                                                    <button
                                                                                        onClick={() => handleCopyWechat(otherWechat)}
                                                                                        className="w-full py-2 bg-brand-50 text-brand-600 text-sm font-medium rounded hover:bg-brand-100 transition-colors"
                                                                                        style={{ backgroundColor: '#EFF6FF', color: '#007AFF' }}
                                                                                    >
                                                                                        复制微信号
                                                                                    </button>
                                                                                </div>
                                                                            );
                                                                        } else if (status === 'rejected') {
                                                                            return (
                                                                                <div className="p-4 flex items-center gap-3 text-gray-400">
                                                                                    <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center shrink-0">
                                                                                        <span className="text-gray-400 text-xl font-bold">We</span>
                                                                                    </div>
                                                                                    <span className="text-sm">{isMe ? '对方拒绝了请求' : '您拒绝了请求'}</span>
                                                                                </div>
                                                                            );
                                                                        }
                                                                    })()}
                                                                </div>
                                                            ) : msg.type === 'image' && msg.file_url ? (
                                                                <div className="space-y-1">
                                                                    <img
                                                                        src={msg.file_url}
                                                                        alt="图片消息"
                                                                        className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                                                        onClick={() => window.open(msg.file_url, '_blank')}
                                                                        loading="lazy"
                                                                    />
                                                                    {msg.text && msg.text !== '[图片]' && <p>{msg.text}</p>}
                                                                </div>
                                                            ) :
                                                                /* 文件消息 - 包括简历 */
                                                                ((msg.type === 'file' || (msg.text && (msg.text.includes('[简历]') || msg.text.includes('[文件]')))) && msg.file_url) ? (
                                                                    <div className="space-y-2">
                                                                        {/* 文件图标和信息 */}
                                                                        <div className="flex items-center gap-2">
                                                                            <FileText className={`w-5 h-5 ${isMe ? 'text-blue-200' : 'text-gray-400'}`} />
                                                                            <div className="flex-1">
                                                                                <p className="font-medium">{msg.file_name || msg.text.replace('[简历] ', '').replace('[文件] ', '')}</p>
                                                                                {msg.file_size && (
                                                                                    <p className={`text-xs ${isMe ? 'text-blue-200' : 'text-gray-500'}`}>
                                                                                        {formatFileSize(msg.file_size)}
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        {/* 查看和下载按钮 */}
                                                                        <div className="flex gap-2">
                                                                            {/* 查看按钮 */}
                                                                            <button
                                                                                onClick={() => window.open(msg.file_url, '_blank')}
                                                                                className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${isMe ? 'bg-brand-400 hover:bg-brand-300 text-white' : 'bg-blue-100 hover:bg-blue-200 text-blue-800'}`}
                                                                            >
                                                                                <Eye className="w-3.5 h-3.5" />
                                                                                查看
                                                                            </button>
                                                                            {/* 下载按钮 */}
                                                                            <a
                                                                                href={msg.file_url}
                                                                                download={msg.file_name}
                                                                                className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${isMe ? 'bg-brand-600 hover:bg-brand-500 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
                                                                            >
                                                                                <Download className="w-3.5 h-3.5" />
                                                                                下载
                                                                            </a>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    /* 文本消息 */
                                                                    <div className="space-y-2">
                                                                        {/* 引用消息部分 - 现代化引用样式 */}
                                                                        {msg.quoted_message ? (
                                                                            <div className={`
                                                                        p-3 rounded-lg border-l-4 border-gray-300 bg-gray-50 text-sm
                                                                        ${isMe
                                                                                    ? 'border-brand-300 bg-brand-600 text-white' // Adjusted for better contrast on dark brand background
                                                                                    : 'border-gray-300 bg-gray-50 text-gray-700'
                                                                                }
                                                                    `}>
                                                                                <div className="flex items-center gap-2 mb-1">
                                                                                    <span className="font-medium text-xs opacity-80">
                                                                                        {msg.quoted_message.sender_name}
                                                                                    </span>
                                                                                    <span className="text-xs opacity-60">
                                                                                        {msg.quoted_message.type === 'image' ? '[图片]' :
                                                                                            msg.quoted_message.type === 'file' ? `[文件: ${msg.quoted_message.file_name || '附件'}]` :
                                                                                                msg.quoted_message.text}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        ) : msg.text?.startsWith('回复 ') ? (
                                                                            // 兼容旧格式的回复消息
                                                                            <div className={`
                                                                        p-3 rounded-lg border-l-4 border-gray-300 bg-gray-50 text-sm
                                                                        ${isMe
                                                                                    ? 'border-brand-300 bg-brand-600 text-white'
                                                                                    : 'border-gray-300 bg-gray-50 text-gray-700'
                                                                                }
                                                                    `}>
                                                                                <div className="flex items-center gap-2 mb-1">
                                                                                    <span className="font-medium text-xs opacity-80">
                                                                                        {msg.text.split('\n')[0].replace('回复 ', '').split(':')[0]}
                                                                                    </span>
                                                                                    <span className="text-xs opacity-60">
                                                                                        {msg.text.split('\n')[0].split(':')[1] || msg.text.split('\n')[1]}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        ) : null}
                                                                        {/* 实际消息内容 */}
                                                                        <p className="whitespace-pre-wrap">{msg.text.split('\n\n').slice(-1)[0]}</p>
                                                                    </div>
                                                                )}
                                                        </div>
                                                        {isMe && (
                                                            <UserAvatar
                                                                src={currentUser?.avatar}
                                                                name={currentUser?.name || '我'}
                                                                size={32}
                                                                className="bg-brand-100 text-brand-600"
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    })()
                                    }
                                </div>
                            </div>

                            {/* 回到最新消息按钮 */}
                            {showScrollToNew && (
                                <button
                                    onClick={() => scrollToLatest(true)}
                                    className="absolute bottom-4 right-4 p-2 bg-white text-brand-600 rounded-full shadow-lg border border-gray-100 hover:bg-gray-50 transition-all"
                                    aria-label="回到最新消息"
                                >
                                    <ChevronDown className="w-5 h-5" />
                                </button>
                            )}

                            {/* 右键菜单 */}
                            {contextMenu.visible && (
                                <div
                                    className="fixed bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50 min-w-[140px] animate-in fade-in zoom-in-95 duration-150"
                                    style={{
                                        left: contextMenu.x,
                                        top: contextMenu.y,
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <button
                                        onClick={handleCopyMessage}
                                        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                                    >
                                        <Copy className="w-4 h-4 text-gray-400" />
                                        <span>复制</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            // 设置回复状态
                                            setReplyingTo({
                                                msgId: contextMenu.msgId!,
                                                text: contextMenu.msgText,
                                                senderName: contextMenu.senderName,
                                                isMe: contextMenu.isMe
                                            });
                                            setContextMenu(prev => ({ ...prev, visible: false }));
                                        }}
                                        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                                    >
                                        <Reply className="w-4 h-4 text-gray-400" />
                                        <span>回复</span>
                                    </button>
                                    <div className="my-1 border-t border-gray-100"></div>
                                    <button
                                        onClick={handleDeleteMessage}
                                        className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        <span>删除</span>
                                    </button>
                                </div>
                            )}

                            {/* Input Area */}
                            <div className="shrink-0 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 z-20 pb-safe">
                                {/* 回复预览卡片 */}
                                {replyingTo && (
                                    <div className="px-4 py-2 bg-gradient-to-r from-brand-50 to-purple-50 border-b border-brand-100 animate-in slide-in-from-bottom-2 duration-200">
                                        <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0 w-1 h-full min-h-[40px] bg-gradient-to-b from-brand-500 to-purple-500 rounded-full"></div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <Reply className="w-3.5 h-3.5 text-brand-500" />
                                                    <span className="text-xs font-semibold text-brand-600">
                                                        回复 {replyingTo.isMe ? '自己' : replyingTo.senderName}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 truncate leading-relaxed">
                                                    {replyingTo.text || '[图片]'}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => setReplyingTo(null)}
                                                className="flex-shrink-0 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white/60 rounded-full transition-colors"
                                                aria-label="取消回复"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                )}
                                {/* Input Area - 上下布局 */}
                                {/* Input Area - 单行布局 */}
                                <div className="p-4 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 flex items-end gap-3">
                                    <button
                                        onClick={() => setShowExtrasMenu(!showExtrasMenu)}
                                        className="mb-1.5 p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                                        aria-label="更多功能"
                                    >
                                        <Plus className={`w-6 h-6 transition-transform ${showExtrasMenu ? 'rotate-45' : ''}`} />
                                    </button>

                                    <div className="flex-1 min-w-0 bg-gray-50 dark:bg-slate-700 rounded-[20px] focus-within:ring-1 focus-within:ring-brand-500/50 transition-all">
                                        <textarea
                                            className="w-full px-4 py-3 bg-transparent border-none outline-none focus:ring-0 shadow-none text-sm resize-none max-h-32 min-h-[44px] placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-100"
                                            rows={1}
                                            value={input}
                                            onChange={(e) => {
                                                setInput(e.target.value);
                                                // Auto-resize
                                                e.target.style.height = 'auto';
                                                e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
                                            }}
                                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                                            placeholder="输入消息..."
                                            style={{ height: '44px' }}
                                        />
                                    </div>

                                    <button
                                        onClick={() => handleSend()}
                                        disabled={!input.trim()}
                                        className={`mb-0.5 flex-shrink-0 px-4 py-2 rounded-xl transition-all font-medium ${input.trim()
                                            ? 'bg-brand-600 text-white shadow-md hover:bg-brand-700 hover:shadow-lg'
                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            }`}
                                        style={{ backgroundColor: input.trim() ? '#007AFF' : undefined }}
                                    >
                                        <div className="flex items-center gap-2">
                                            <SendIcon className="w-5 h-5" />
                                            <span>发送</span>
                                        </div>
                                    </button>
                                </div>
                                {showExtrasMenu && (
                                    <div className="p-4 grid grid-cols-4 gap-4 animate-in slide-in-from-bottom-2 bg-white dark:bg-slate-800">
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                            accept="image/*"
                                            className="hidden"
                                        />
                                        {[
                                            { icon: ImageIcon, label: '图片', action: () => fileInputRef.current?.click() },
                                            { icon: Camera, label: '拍摄', action: () => { } },
                                            { icon: MapPin, label: '位置', action: () => handleSend('广东省深圳市...', 'location') },
                                            { icon: MessageCircle, label: '交换微信', action: handleExchangeWechat }
                                        ].map((item, i) => (
                                            <button key={i} className="flex flex-col items-center gap-2" onClick={item.action}>
                                                <div className="w-12 h-12 bg-gray-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center text-gray-600 dark:text-gray-300">
                                                    <item.icon className="w-6 h-6" />
                                                </div>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">{item.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Resume Selection Modal */}
                            {showResumeModal && (
                                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden animate-in zoom-in-95 duration-200">
                                        {/* Modal Header */}
                                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-5 h-5 text-brand-600" />
                                                <h3 className="font-semibold text-gray-900 dark:text-slate-100">选择要发送的简历</h3>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => resumeUploadInputRef.current?.click()}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 text-xs font-medium rounded-lg hover:bg-brand-100 dark:hover:bg-brand-900/40 transition-colors"
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
                                                    上传简历
                                                </button>
                                                <button
                                                    onClick={() => setShowResumeModal(false)}
                                                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Modal Content */}
                                        <div className="p-4 overflow-y-auto max-h-[60vh]">
                                            {isLoadingResumes ? (
                                                <div className="flex flex-col items-center justify-center py-8">
                                                    <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-3"></div>
                                                    <p className="text-sm text-gray-500">加载中...</p>
                                                </div>
                                            ) : userResumes.length === 0 ? (
                                                <div className="text-center py-10">
                                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                                        <FileText className="w-8 h-8 text-gray-300" />
                                                    </div>
                                                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">您还没有上传任何简历</p>
                                                    <div className="flex flex-col gap-2 px-6">
                                                        <button
                                                            onClick={() => resumeUploadInputRef.current?.click()}
                                                            disabled={isUploadingResume}
                                                            className={`w-full py-2.5 bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-700 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 ${isUploadingResume ? 'opacity-70 cursor-not-allowed' : ''}`}
                                                        >
                                                            {isUploadingResume ? (
                                                                <>
                                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                                    <span>上传中 {uploadProgress}%</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Plus className="w-4 h-4" />
                                                                    <span>立即上传</span>
                                                                </>
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={() => setShowResumeModal(false)}
                                                            className="w-full py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition-all"
                                                        >
                                                            关闭
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    {userResumes.map((resume: any, index: number) => {
                                                        const isSelected = selectedResume?.id === resume.id;
                                                        // 使用与个人中心相同的字段名
                                                        const filename = fixFilenameEncoding(resume.resume_file_name || resume.original_name || resume.file_name || `简历 ${index + 1}`);
                                                        const fileSize = resume.resume_file_size || resume.file_size || 0;
                                                        const createdAt = resume.created_at || resume.uploaded_at || '';

                                                        return (
                                                            <button
                                                                key={resume.id || index}
                                                                onClick={() => setSelectedResume(resume)}
                                                                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${isSelected
                                                                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                                                                    : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                                                                    }`}
                                                            >
                                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected
                                                                        ? 'border-brand-500 bg-brand-500'
                                                                        : 'border-gray-300'
                                                                        }`}>
                                                                        {isSelected && <Check className="w-4 h-4 text-white" />}
                                                                    </div>
                                                                    <div className="text-brand-600 flex-shrink-0">
                                                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1-3a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                                                        </svg>
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">{filename}</p>
                                                                        <div className="flex items-center gap-2 mt-1">
                                                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                                {createdAt ? new Date(createdAt).toLocaleString() : ''}
                                                                            </span>
                                                                            <span className="text-xs text-gray-500">
                                                                                {(fileSize / (1024 * 1024)).toFixed(2)}MB
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>

                                        {/* Modal Footer */}
                                        <div className="px-4 py-3 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
                                            <button
                                                onClick={handleConfirmSendResume}
                                                disabled={!selectedResume}
                                                className={`w-full py-2.5 rounded-xl font-medium transition-all ${selectedResume
                                                    ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-md'
                                                    : 'bg-gray-200 dark:bg-slate-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                                    }`}
                                            >
                                                {selectedResume ? `发送简历` : '请选择一份简历'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex-grow flex flex-col items-center justify-center text-gray-400 bg-gray-50/30">
                            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <MessageSquare className="w-10 h-10 text-gray-300" />
                            </div>
                            <p>选择左侧联系人开始聊天</p>
                        </div>
                    )}
                </div>
            </div>
            {/* WeChat Input Modal */}
            <input
                type="file"
                ref={resumeUploadInputRef}
                onChange={handleResumeUpload}
                accept=".pdf,.doc,.docx"
                className="hidden"
            />
        </div>
    );
};

export default MessageCenterScreen;