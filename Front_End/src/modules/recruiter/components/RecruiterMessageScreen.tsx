import React, { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    MessageSquare, Phone, MoreVertical, Send, Plus as PlusIcon, Image as ImageIcon,
    Camera, Mic, Trash2, MapPin, ArrowLeft, Pin, Calendar as CalendarIcon, XCircle, Copy, CheckCircle,
    Download, Eye, FileText, X, MessageCircle, User
} from 'lucide-react';
import { Modal, message, App } from 'antd';
import { formatDateTime } from '@/utils/dateUtils';
import { useDeviceType } from '@/hooks/useMediaQuery';
import {
    getMessageContainerHeight,
    getMessageContainerPadding,
    getChatWindowClasses,
    getMessageListClasses,
    getChatWindowWidth
} from '@/utils/layoutUtils';
import UserAvatar from '@/components/UserAvatar';
import { interviewAPI, applicationAPI, api } from '@/services/apiService';
import { messageAPI } from '@/services/messageService';
import InterviewCard from '@/components/InterviewCard';

const TIME_SLOTS = Array.from({ length: 13 }).map((_, i) => {
    const hour = 8 + i; // 8到20点
    const hourStr = hour.toString().padStart(2, '0');
    return [0, 15, 30, 45].map(minute => {
        const minuteStr = minute.toString().padStart(2, '0');
        return `${hourStr}:${minuteStr}`;
    });
}).flat();

interface RecruiterMessageScreenProps {
    conversations: any[];
    candidates: any[];
    jobs: any[];
    activeConversationId: string | null;
    onSelectConversation: (id: string) => void;
    onSendMessage: (text: string, type: string, quotedMessage?: { id: string | number | null, text: string, senderName: string | null, type?: string }) => void;
    onDeleteMessage: (conversationId: string, messageId: number | string) => void;
    onDeleteConversation: (conversationId: string) => void;
    onLoadMoreMessages?: (conversationId: string, currentCount: number) => Promise<boolean>;
    currentUser: any;
    isMessagesLoading?: boolean;
    onPinConversation?: (conversationId: string, isPinned: boolean) => void;
    onHideConversation?: (conversationId: string) => void;
    currentUserId: number;
    companyAddress?: string;
}

// WeChatCard Component for Recruiter
const WeChatCard: React.FC<{
    msg: any;
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
                    <div className="w-8 h-8 rounded bg-gray-400 dark:bg-slate-600 flex items-center justify-center text-white text-xs font-bold">We</div>
                    <span className="text-gray-500 dark:text-slate-400 font-medium text-sm">微信交换已拒绝</span>
                </div>
                <p className="text-xs text-gray-400 dark:text-slate-500">
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
        const displayWechat = isMe ? (receiver_wechat || '对方已同意') : (content.initiator_wechat || wechat || '对方已同意');

        return (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-blue-100 dark:border-blue-900/30 p-4 min-w-[240px]">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-blue-200 dark:shadow-none">We</div>
                    <span className="text-gray-900 dark:text-slate-200 font-bold text-sm">微信交换成功</span>
                </div>
                <div className="bg-blue-50/50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-900/30 mb-3">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-bold">对方微信号</p>
                    <p className="text-base font-black text-blue-700 dark:text-blue-400 select-all font-mono tracking-tight">{displayWechat}</p>
                </div>
                <button
                    onClick={() => onCopy(displayWechat)}
                    className="w-full py-2.5 bg-white dark:bg-slate-700 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all flex items-center justify-center gap-2 active:scale-95"
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
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-blue-100 dark:border-blue-900/30 p-4 min-w-[200px]">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-blue-200 dark:shadow-none">We</div>
                    <span className="text-gray-900 dark:text-slate-200 font-bold text-sm">微信交换请求</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">已发送请求，等待对方同意...</p>
                <div className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                    我的微信号: <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">{wechat}</span>
                </div>
            </div>
        );
    }

    // Receiver View (Pending)
    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-blue-100 dark:border-blue-900/30 p-4 min-w-[260px]">
            <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center shrink-0 shadow-lg shadow-blue-200 dark:shadow-none">
                    <span className="text-white text-xl font-black">We</span>
                </div>
                <div>
                    <p className="text-gray-900 dark:text-slate-200 font-bold text-sm">对方请求交换微信</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">同意后将互相通过，并交换微信号</p>
                </div>
            </div>

            <div className="flex gap-2 mt-3 pt-3 border-t border-slate-50 dark:border-slate-700">
                <button
                    onClick={() => onReject && onReject(msg.id)}
                    className="flex-1 py-2.5 bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-600 transition-all active:scale-95"
                >
                    拒绝
                </button>
                <button
                    onClick={() => onAccept && onAccept(msg.id)}
                    className="flex-1 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-200 dark:shadow-none active:scale-95"
                >
                    同意交换
                </button>
            </div>
        </div>
    );
};

// Helper to format message preview text (handle JSON for wechat exchange)
const formatMessagePreview = (content: string | null | undefined): string => {
    if (!content) return '';

    // Check if content looks like the JSON we use for exchange requests
    if (typeof content === 'string' && (content.startsWith('{') || content.includes('"wechat"'))) {
        try {
            const parsed = JSON.parse(content);
            // Handle exchange request
            if (parsed.msg) return parsed.msg;
            if (parsed.wechat || parsed.initiator_wechat || parsed.status === 'pending') {
                return '[微信交换请求]';
            }
            if (parsed.type === 'image') return '[图片]';
            if (parsed.type === 'file') return '[文件]';
            if (parsed.type === 'interview_invitation') return '[面试邀请]';

            // Fallback for other JSON
            return content;
        } catch (e) {
            // parsing failed, return original text
            return content;
        }
    }
    return content;
};

const RecruiterMessageScreen: React.FC<RecruiterMessageScreenProps> = ({
    conversations, candidates, jobs, activeConversationId, onSelectConversation,
    onSendMessage, onDeleteMessage, onDeleteConversation,
    onLoadMoreMessages,
    currentUser,
    isMessagesLoading = false,
    onPinConversation,
    onHideConversation,
    currentUserId,
    companyAddress
}) => {
    const navigate = useNavigate();
    const { conversationId: paramConversationId } = useParams<{ conversationId: string }>();
    const chatEndRef = useRef<HTMLDivElement>(null);
    const [input, setInput] = useState('');
    const { modal } = App.useApp();
    const [showExtrasMenu, setShowExtrasMenu] = useState(false);
    const [searchText, setSearchText] = useState('');

    // 面试邀请模态框状态
    const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
    // 面试表单状态
    const [interviewForm, setInterviewForm] = useState({
        applicationId: 0,
        interviewDate: '',
        interviewTime: '',
        interviewTimeEnd: '',
        interviewerName: '',
        interviewerPosition: '',
        notes: '',
        location: '',
        interviewPosition: ''
    });
    // 表单加载状态
    const [formLoading, setFormLoading] = useState(false);

    // 使用精确的设备类型判断
    const { isMobile, isTablet, isDesktop } = useDeviceType();

    // Sync URL param with active ID or handle selection
    useEffect(() => {
        if (paramConversationId && paramConversationId !== activeConversationId) {
            // 使用 setTimeout 避免在路由切换时立即触发，防止闪退
            const timer = setTimeout(() => {
                onSelectConversation(paramConversationId);
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [paramConversationId]); // 移除 activeConversationId 和 onSelectConversation 依赖，避免循环

    // 响应式布局逻辑：
    // - 手机：通过路由切换，只显示列表或聊天（不能同时显示）
    // - 平板：同时显示列表和聊天（40% + 60%）
    // - 桌面：同时显示列表和聊天（33% + 67%）
    const showList = isMobile ? !paramConversationId : true;
    const showChat = isMobile ? !!paramConversationId : true;

    // 使用布局工具函数获取类名
    const containerHeight = getMessageContainerHeight(isMobile, isTablet, 'recruiter');
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
        isCurrentUser: boolean,
        messageText: string,
        senderName: string,
        type: string
    }>({
        visible: false, x: 0, y: 0, msgId: null, isCurrentUser: false, messageText: '',
        senderName: '',
        type: 'text'
    });

    // Reply state
    const [replyingTo, setReplyingTo] = useState<{ id: string | number | null, text: string, senderName: string | null, type?: string }>({
        id: null, text: '', senderName: null, type: 'text'
    });

    // WeChat exchange state
    const [showWechatModal, setShowWechatModal] = useState(false);
    const [wechatInput, setWechatInput] = useState(currentUser?.wechat || '');
    const [isSendingRequest, setIsSendingRequest] = useState(false);
    const [exchangeRequestSent, setExchangeRequestSent] = useState(false);
    // Pending action state
    const [pendingAction, setPendingAction] = useState<{ type: 'send' | 'accept', id?: string | number } | null>(null);

    const [convContextMenu, setConvContextMenu] = useState<{ visible: boolean; x: number; y: number; convId: string | null; isPinned: boolean }>({
        visible: false, x: 0, y: 0, convId: null, isPinned: false
    });

    const activeConv = conversations.find((c: any) => c.id.toString() === activeConversationId?.toString());

    // Check history for existing exchange requests
    useEffect(() => {
        if (activeConv?.messages && currentUser) {
            const hasSentRequest = activeConv.messages.some((msg: any) =>
                Number(msg.sender_id) === Number(currentUser.id) &&
                msg.type === 'exchange_request'
            );
            if (hasSentRequest) {
                setExchangeRequestSent(true);
            } else {
                setExchangeRequestSent(false); // Reset if switching to another conv
            }
        }
    }, [activeConv, currentUser]);

    const activeJob = activeConv ? jobs.find((j: any) => j.id === activeConv.jobId || j.id === activeConv.job_id) : null;

    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    // 打开面试邀请模态框
    const openInterviewModal = () => {
        // 获取当前日期的第二天
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        // 从活跃对话中获取相关信息
        if (activeConv) {
            // 这里假设对话数据中包含以下字段，实际项目中可能需要调整
            const applicationId = activeConv.applicationId || activeConv.app_id || 0;

            setInterviewForm(prev => ({
                ...prev,
                applicationId,
                // 默认值设置
                interviewDate: tomorrowStr, // 默认为当前日期的第二天
                interviewTime: '12:00', // 默认开始时间 12:00
                interviewTimeEnd: '13:00', // 默认结束时间 13:00
                // 自动填充字段
                interviewerName: currentUser.name || '', // 面试官自动使用当前招聘者姓名
                interviewerPosition: currentUser.position || '', // 面试官职位自动使用当前招聘者职位
                location: companyAddress || '', // 自动填充面试地址
                interviewPosition: activeJob?.title || '' // 自动填充面试岗位
            }));
        }
        setIsInterviewModalOpen(true);
    };

    // 关闭面试邀请模态框
    const closeInterviewModal = () => {
        setIsInterviewModalOpen(false);
        // 重置表单
        setInterviewForm({
            applicationId: 0,
            interviewDate: '',
            interviewTime: '',
            interviewTimeEnd: '',
            interviewerName: '',
            interviewerPosition: '',
            notes: '',
            location: '',
            interviewPosition: ''
        });
    };

    // 处理表单字段变化
    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setInterviewForm(prev => {
            const newState = { ...prev, [name]: value };

            // 如果修改了开始时间，需要同步检查结束时间
            if (name === 'interviewTime') {
                const startTimeStr = value;
                const endTimeStr = prev.interviewTimeEnd;

                if (startTimeStr && endTimeStr) {
                    const [startH, startM] = startTimeStr.split(':').map(Number);
                    const [endH, endM] = endTimeStr.split(':').map(Number);
                    const startTotal = startH * 60 + startM;
                    const endTotal = endH * 60 + endM;

                    // 如果结束时间早于或等于新的开始时间，自动向后推迟1小时
                    if (endTotal <= startTotal) {
                        const newEndTotal = startTotal + 60;
                        const newEndH = Math.min(Math.floor(newEndTotal / 60), 23);
                        const newEndM = newEndTotal % 60;
                        newState.interviewTimeEnd = `${newEndH.toString().padStart(2, '0')}:${newEndM.toString().padStart(2, '0')}`;
                    }
                }
            }
            return newState;
        });
    };

    // 创建面试邀请
    const handleCreateInterview = async () => {
        try {
            setFormLoading(true);
            // 验证必填字段
            if (interviewForm.applicationId === 0 || !interviewForm.interviewDate || !interviewForm.interviewTime || !interviewForm.interviewTimeEnd) {
                message.error('请填写必填字段');
                return;
            }

            // 验证结束时间必须晚于开始时间
            const startTime = new Date(`2000-01-01T${interviewForm.interviewTime}`);
            const endTime = new Date(`2000-01-01T${interviewForm.interviewTimeEnd}`);
            if (endTime <= startTime) {
                message.error('面试结束时间必须晚于开始时间');
                return;
            }

            // 准备完整的面试数据，只包含数据库中存在的字段
            const interviewData = {
                applicationId: interviewForm.applicationId,
                interviewDate: interviewForm.interviewDate,
                interviewTime: interviewForm.interviewTime,
                interviewTimeEnd: interviewForm.interviewTimeEnd,
                interviewerId: currentUserId,
                status: 'scheduled', // 默认状态：已安排
                notes: interviewForm.notes,
                interviewRound: 1, // 默认第1轮
                interviewerName: interviewForm.interviewerName,
                interviewerPosition: interviewForm.interviewerPosition,
                interviewResult: null, // 默认为空，面试后填写
                interviewFeedback: null, // 默认为空，面试后填写
                location: interviewForm.location,
                interviewPosition: interviewForm.interviewPosition
            };

            const response = await interviewAPI.createInterview(interviewData);

            if ((response as any).status === 'success') {
                // 更新对应的申请状态为Interview，并增加面试次数
                await applicationAPI.updateApplicationStatus(
                    interviewForm.applicationId,
                    'Interview',
                    '已安排面试'
                );

                message.success('面试邀请创建成功');
                // 发送一条消息给候选人
                onSendMessage(`已向您发送面试邀请，请查收！`, 'text');
                // 通过Socket.IO发送面试邀请信息，让候选人实时收到
                onSendMessage(JSON.stringify({
                    type: 'interview_invitation',
                    interview: response.data,
                    message: `已向您发送面试邀请，请查收！`
                }), 'interview_invitation');
                closeInterviewModal();
            }
        } catch (error) {
            console.error('创建面试失败:', error);
            message.error('创建面试邀请失败，请重试');
        } finally {
            setFormLoading(false);
        }
    };

    // Handle scroll event to load more messages
    const handleScroll = useCallback(async (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop } = e.currentTarget;
        if (scrollTop === 0 && !isLoadingMore && hasMore && activeConversationId && onLoadMoreMessages) {
            setIsLoadingMore(true);
            const container = e.currentTarget;
            const prevScrollHeight = container.scrollHeight;

            const count = activeConv?.messages?.length || 0;
            const loaded = await onLoadMoreMessages(activeConversationId, count);

            if (!loaded) {
                setHasMore(false);
            } else {
                // 保持滚动位置
                setTimeout(() => {
                    const newScrollHeight = container.scrollHeight;
                    container.scrollTop = newScrollHeight - prevScrollHeight;
                }, 0);
            }
            setIsLoadingMore(false);
        }
    }, [isLoadingMore, hasMore, activeConversationId, onLoadMoreMessages, activeConv?.messages?.length]);

    // Track the last message count to determine if we should scroll
    const [lastMessageCount, setLastMessageCount] = useState(0);
    // Track the last active conversation to detect conversation changes
    const [lastActiveConversationId, setLastActiveConversationId] = useState<string | null>(null);

    useEffect(() => {
        if (activeConv) {
            const messageCount = activeConv.messages?.length || 0;
            const conversationChanged = activeConversationId !== lastActiveConversationId;

            if (conversationChanged) {
                setHasMore(true);
            }

            const shouldScroll = conversationChanged ||
                messageCount > lastMessageCount ||
                showExtrasMenu;

            if (shouldScroll) {
                // 使用requestAnimationFrame优化滚动
                requestAnimationFrame(() => {
                    chatEndRef.current?.scrollIntoView({
                        behavior: conversationChanged ? "auto" : "smooth"
                    });
                });
            }

            // Update tracking state for next comparison
            setLastMessageCount(messageCount);
            setLastActiveConversationId(activeConversationId);
        }
    }, [activeConv?.messages?.length, activeConversationId, showExtrasMenu, activeConv, lastActiveConversationId]);

    useEffect(() => {
        const handleClick = () => {
            setContextMenu(prev => ({ ...prev, visible: false }));
            setConvContextMenu(prev => ({ ...prev, visible: false }));
        };
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, []);

    const handleSend = useCallback((text?: string, type = 'text') => {
        let msgText = text || input;
        if (!msgText.trim() && type === 'text') return;

        // 直接发送消息，不修改content，让父组件处理quoted_message
        const finalText = msgText;

        // 发送消息时传递完整的回复信息，包括quoted_message
        onSendMessage(finalText, type, replyingTo);

        // 发送后清除回复状态
        if (replyingTo.id) {
            setReplyingTo({ id: null, text: '', senderName: null, type: 'text' });
        }

        setInput('');
        setShowExtrasMenu(false);
    }, [input, onSendMessage, setShowExtrasMenu, replyingTo]);

    const handleContextMenu = useCallback((e: React.MouseEvent, msgId: number | string, isCurrentUser: boolean, messageText: string, senderName?: string, type?: string) => {
        e.preventDefault();
        setContextMenu({
            visible: true,
            x: e.pageX,
            y: e.pageY,
            msgId: msgId,
            isCurrentUser: isCurrentUser,
            messageText: messageText,
            senderName: senderName || '',
            type: type || 'text'
        });
    }, []);

    // 使用useCallback优化对话项点击事件处理函数
    const handleConversationClick = useCallback((conv: any) => {
        // 手机端先切换路由，然后通过 useEffect 触发 onSelectConversation
        // 平板和桌面端直接调用 onSelectConversation
        if (isMobile) {
            navigate(`/recruiter/messages/${conv.id}`);
        } else {
            onSelectConversation(conv.id);
        }
    }, [isMobile, navigate, onSelectConversation]);

    // 使用useCallback优化删除对话事件处理函数
    const handleDeleteConversation = useCallback((e: React.MouseEvent, conv: any) => {
        e.stopPropagation(); // 阻止事件冒泡，避免触发选择对话

        // 使用Ant Design的Modal组件替代window.confirm
        modal.confirm({
            title: '确认删除聊天记录',
            content: (
                <div>
                    <p>确定要删除与{conv.candidate_name || '候选人'}的聊天记录吗？</p>
                    <p className="text-sm text-gray-500 mt-2">
                        此操作是软删除，数据会保留在数据库中，但您将无法在消息列表中看到此对话。
                    </p>
                </div>
            ),
            okText: '是',
            okType: 'danger',
            cancelText: '取消',
            centered: true,
            onOk() {
                onDeleteConversation(conv.id);
            },
            onCancel() {
                // 用户取消删除，无需操作
            }
        });
    }, [onDeleteConversation]);

    // WeChat Exchange Functions - 重新构建逻辑
    const handleWechatExchange = () => {
        // 场景1: 检查用户是否已设置微信号
        if (!currentUser?.wechat || currentUser.wechat.trim() === '') {
            setWechatInput('');
            setPendingAction({ type: 'send' });
            setShowWechatModal(true);
        } else {
            // 场景2: 已设置微信号，弹出确认框
            modal.confirm({
                title: '确定与对方交换微信吗？',
                icon: <MessageCircle className="text-blue-500" />,
                content: (
                    <div className="pt-2">
                        <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <span className="text-gray-500 text-xs">您的微信号:</span>
                            <div className="font-medium text-gray-800 mt-1 font-mono text-base">{currentUser.wechat}</div>
                        </div>
                        <p className="text-xs text-gray-400">
                            发送请求后需等待对方同意。同意后双方将可以看到彼此的微信号。
                        </p>
                    </div>
                ),
                okText: '确定发送',
                cancelText: '取消',
                okButtonProps: { className: 'bg-blue-500 hover:bg-blue-600' },
                centered: true,
                onOk: () => handleSendWechatRequest()
            });
        }
    };

    const handleUpdateWechat = async () => {
        if (!wechatInput.trim()) {
            message.error('请输入有效的微信号');
            return;
        }

        try {
            // 调用API更新微信号
            const response = await api.put(`/users/${currentUser.id}`, {
                wechat: wechatInput
            });

            if (response.data && (response.data.status === 'success' || response.data.success)) {
                message.success('微信号更新成功');
                setShowWechatModal(false);

                // 执行挂起的操作
                if (pendingAction) {
                    if (pendingAction.type === 'send') {
                        await handleSendWechatRequest();
                    } else if (pendingAction.type === 'accept' && pendingAction.id) {
                        await executeAcceptWechat(pendingAction.id);
                    }
                    setPendingAction(null);
                } else {
                    // Fallback to sending if no pending action (legacy behavior)
                    await handleSendWechatRequest();
                }
            } else {
                message.error('微信号更新失败');
            }
        } catch (error) {
            console.error('更新微信号失败:', error);
            message.error('更新微信号失败，请稍后重试');
        }
    };

    const handleSendWechatRequest = async () => {
        if (!activeConversationId || !currentUser) return;

        // Check for duplicates
        const hasPendingRequest = (activeConv?.messages || []).some((m: any) =>
            m.type === 'exchange_request' &&
            m.sender_id.toString() === currentUser.id.toString() &&
            (() => {
                try {
                    const content = m.text ? JSON.parse(m.text) : {};
                    return content.status === 'pending';
                } catch { return false; }
            })()
        );

        if (hasPendingRequest) {
            message.warning('您已发起过请求，请耐心等待对方回复');
            return;
        }

        setIsSendingRequest(true);
        try {
            // New logic: Send JSON content with status 'pending'
            const content = JSON.stringify({
                status: 'pending',
                msg: '请求交换微信',
                initiator_wechat: currentUser.wechat // Include wechat ID for consistency
            });
            await onSendMessage(content, 'exchange_request');
            setExchangeRequestSent(true);
            setShowExtrasMenu(false); // Close menu if open
            message.success('微信交换请求已发送');
        } catch (error) {
            console.error('发送微信交换请求失败:', error);
            message.error('发送请求失败，请稍后重试');
        } finally {
            setIsSendingRequest(false);
        }
    };

    const handleAcceptWechatExchange = async (messageId: number | string) => {
        // Check if user has wechat
        if (!currentUser?.wechat || currentUser.wechat.trim() === '') {
            setWechatInput('');
            setPendingAction({ type: 'accept', id: messageId });
            setShowWechatModal(true);
            return;
        }

        await executeAcceptWechat(messageId);
    };

    const executeAcceptWechat = async (messageId: number | string) => {
        try {
            // Call API to accept wechat exchange request (update status)
            await messageAPI.updateExchangeStatus(messageId, 'accept', currentUser.id);
            message.success('已同意微信交换');
            // Refresh conversation to get updated messages
            window.dispatchEvent(new CustomEvent('refreshConversation', { detail: { conversationId: activeConversationId } }));
        } catch (error) {
            console.error('同意微信交换失败:', error);
            message.error('操作失败，请稍后重试');
        }
    };

    const handleRejectWechatExchange = async (messageId: number | string) => {
        try {
            // Call API to reject wechat exchange request
            await messageAPI.updateExchangeStatus(messageId, 'reject', currentUser.id);
            message.success('已拒绝微信交换');
            // Refresh conversation to get updated messages
            window.dispatchEvent(new CustomEvent('refreshConversation', { detail: { conversationId: activeConversationId } }));
        } catch (error) {
            console.error('拒绝微信交换失败:', error);
            message.error('操作失败，请稍后重试');
        }
    };

    const copyWechatToClipboard = (wechat: string) => {
        navigator.clipboard.writeText(wechat)
            .then(() => {
                message.success('微信号已复制到剪贴板');
            })
            .catch(err => {
                console.error('复制失败:', err);
                message.error('复制失败，请手动复制');
            });
    };

    // 过滤对话：按候选人姓名或公司名称搜索，不进行去重，确保所有对话都显示
    // 使用useMemo缓存过滤和排序结果，只有当conversations或searchText变化时才重新计算
    const filteredConversations = useMemo(() => {
        // 转换为小写进行不区分大小写的搜索
        const searchLower = searchText.toLowerCase();

        return conversations
            .filter((conv: any) => {
                const candidateName = (conv.candidate_name || '候选人').toLowerCase();
                const companyName = (conv.company_name || '').toLowerCase();
                const matchesSearch = searchText === '' ||
                    candidateName.includes(searchLower) ||
                    companyName.includes(searchLower);
                return matchesSearch;
            })
            .sort((a: any, b: any) => {
                // 优先按置顶状态排序
                if (a.recruiterPinned !== b.recruiterPinned) {
                    return a.recruiterPinned ? -1 : 1;
                }

                // 按更新时间排序，兼容多种命名格式
                // 获取更新时间，支持多种字段名格式
                const getUpdateTime = (conv: any): number => {
                    const timeStr = conv.updatedAt || conv.updated_at || conv.lastTime || conv.last_time || conv.createdAt || conv.created_at;
                    if (!timeStr) return 0; // 如果没有时间字段，返回0（排到最后）

                    const time = new Date(timeStr).getTime();
                    // 如果日期无效，返回0
                    return isNaN(time) ? 0 : time;
                };

                const aTime = getUpdateTime(a);
                const bTime = getUpdateTime(b);

                // 降序排序（最新的在前）
                return bTime - aTime;
            });
    }, [conversations, searchText]);

    // Scroll selected conversation into view in sidebar
    useEffect(() => {
        if (activeConversationId && !isMobile) {
            // Slight delay to ensure rendering
            setTimeout(() => {
                const elm = document.getElementById(`conversation-${activeConversationId}`);
                if (elm) {
                    elm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            }, 100);
        }
    }, [activeConversationId, isMobile]);

    return (
        <div className={`max-w-7xl mx-auto ${containerPadding} ${containerHeight}`}>
            <div className={`flex ${isMobile ? 'flex-col' : isTablet ? 'flex-row' : 'flex-row'} gap-4 md:gap-6 h-full ${isMobile ? 'bg-white' : ''}`}>
                {/* Sidebar List (Left) - 联系人列表 */}
                <div className={`${listClasses} ${isMobile ? 'h-1/2' : ''} border-r border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900`}>
                    <div className="p-5 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 shrink-0">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100">候选人消息</h2>
                                {conversations.reduce((sum, conv) => sum + (conv.recruiterUnread || conv.unreadCount || 0), 0) > 0 && (
                                    <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                        {conversations.reduce((sum, conv) => sum + (conv.recruiterUnread || conv.unreadCount || 0), 0)}
                                    </span>
                                )}
                            </div>
                            {conversations.some(c => (c.recruiterUnread || c.unreadCount || 0) > 0) && (
                                <button
                                    onClick={async () => {
                                        try {
                                            await messageAPI.markAllAsRead(currentUser.id, 'recruiter');
                                            // 触发刷新
                                            window.location.reload();
                                        } catch (e) {
                                            message.error('操作失败');
                                        }
                                    }}
                                    className="text-xs text-gray-500 hover:text-blue-600 underline"
                                >
                                    一键已读
                                </button>
                            )}
                        </div>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="搜索候选人姓名..."
                                className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400"
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                            />
                            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {filteredConversations.length > 0 ? filteredConversations.map((conv: any) => {
                            const job = jobs.find((j: any) => j.id === conv.jobId);
                            const isActive = conv.id === activeConversationId;
                            // 直接从对话数据中获取候选人信息
                            const candidateName = conv.candidate_name || '候选人';
                            const candidateAvatar = conv.candidate_avatar || '';

                            const handleConvContextMenu = (e: React.MouseEvent, conv: any) => {
                                e.preventDefault();
                                setConvContextMenu({
                                    visible: true,
                                    x: e.clientX,
                                    y: e.clientY,
                                    convId: conv.id,
                                    isPinned: conv.recruiterPinned || false
                                });
                            };

                            return (
                                <div
                                    key={conv.id}
                                    id={`conversation-${conv.id}`}
                                    onClick={() => handleConversationClick(conv)}
                                    onContextMenu={(e) => handleConvContextMenu(e, conv)}
                                    className={`relative group p-4 border-b border-gray-50 dark:border-slate-800 cursor-pointer transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20 ${isActive ? 'bg-blue-50 dark:bg-blue-900/30 border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent'} ${conv.recruiterPinned ? 'bg-gray-50/50 dark:bg-slate-800/50' : ''}`}
                                >
                                    <div className="flex justify-between mb-1.5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                {candidateAvatar ? (
                                                    <img src={candidateAvatar} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-bold text-lg">
                                                        {candidateName ? candidateName.charAt(0).toUpperCase() : "?"}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-1">
                                                    <h4 className={`font-bold text-sm truncate ${isActive ? 'text-blue-900 dark:text-blue-400' : 'text-gray-900 dark:text-slate-200'}`}>{candidateName}</h4>
                                                    {conv.recruiterPinned && <Pin className="w-3 h-3 text-blue-500 fill-blue-500 transform rotate-45" />}
                                                </div>
                                                <p className="text-xs text-gray-500 truncate max-w-[140px]">{job?.title || conv.job_title || '意向职位'}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-xs text-gray-400 whitespace-nowrap">{formatDateTime(conv.lastTime || conv.updated_at || conv.updatedAt)}</span>
                                            {conv.unreadCount > 0 && (
                                                <span className="mt-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-blue-600 rounded-full">
                                                    {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <p className={`text-xs truncate pl-15 ${isActive ? 'text-blue-700 font-medium' : 'text-gray-500'}`}>{formatMessagePreview(conv.lastMessage || conv.last_message || '')}</p>

                                    {/* Delete Button - Shows on hover */}
                                    <button
                                        onClick={(e) => handleDeleteConversation(e, conv)}
                                        className="absolute right-2 bottom-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100"
                                        title="删除对话"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            );
                        }) : (
                            <div className="p-10 text-center text-gray-400 text-sm">暂无消息</div>
                        )}
                    </div>
                </div>

                {/* Chat Window (Right) - 聊天内容 */}
                <div className={`${chatClasses} ${chatWidth} bg-white dark:bg-slate-900 flex flex-col`}>
                    {activeConv ? (
                        <>
                            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center shadow-sm z-10 shrink-0">
                                <div className="flex items-center gap-3">
                                    {isMobile && (
                                        <button
                                            onClick={() => navigate('/recruiter/messages')}
                                            className="p-1 -ml-2 mr-1 text-gray-600 hover:text-blue-600 transition-colors"
                                            aria-label="返回消息列表"
                                        >
                                            <ArrowLeft className="w-6 h-6" />
                                        </button>
                                    )}
                                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                                        {activeConv.candidate_avatar ? (
                                            <img src={activeConv.candidate_avatar} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-bold">
                                                {activeConv.candidate_name ? activeConv.candidate_name.charAt(0).toUpperCase() : "?"}
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 truncate">{activeConv.candidate_name || '候选人'}</h2>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400 flex-wrap">
                                            <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-600">{activeConv.candidate_experience || '经验未知'}</span>
                                            <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-600">{activeConv.candidate_location || '地点未知'}</span>
                                            <span>• 申请职位: <span className="text-blue-600 font-medium truncate max-w-[100px] inline-block align-bottom">{activeJob?.title || activeConv.job_title || '职位已失效'}</span></span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 items-center">
                                    <button onClick={() => handleSend("您好，对您的经历很感兴趣，能否发一份最新的附件简历？", 'text')} className="hidden md:block px-3 py-1.5 bg-blue-50 text-blue-600 text-xs rounded-full hover:bg-blue-100 transition whitespace-nowrap border border-blue-200">
                                        索取简历
                                    </button>
                                    <button
                                        onClick={handleWechatExchange}
                                        className={`hidden md:block px-3 py-1.5 text-xs rounded-full transition whitespace-nowrap border ${exchangeRequestSent ? 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500 border-gray-200 dark:border-slate-700 cursor-not-allowed' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 border-blue-200 dark:border-blue-800'}`}
                                        disabled={exchangeRequestSent}
                                    >
                                        {exchangeRequestSent ? '请求已发送' : '交换微信'}
                                    </button>
                                    <button onClick={openInterviewModal} className="hidden md:block px-3 py-1.5 bg-blue-50 text-blue-600 text-xs rounded-full hover:bg-blue-100 transition whitespace-nowrap border border-blue-200">
                                        邀请面试
                                    </button>
                                    <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition"><Phone className="w-5 h-5" /></button>
                                    <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition"><MoreVertical className="w-5 h-5" /></button>
                                </div>
                            </div>



                            <div
                                className="flex-1 bg-slate-100 dark:bg-slate-950 p-4 overflow-y-auto custom-scrollbar relative"
                                onScroll={handleScroll}
                            >
                                <div className="space-y-4 max-w-4xl mx-auto">
                                    {isLoadingMore && (
                                        <div className="flex justify-center py-2">
                                            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                    {isMessagesLoading && (
                                        <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 backdrop-blur-[1px]">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                                <span className="text-xs text-emerald-600 font-medium">加载消息...</span>
                                            </div>
                                        </div>
                                    )}
                                    {(!activeConv?.messages || activeConv.messages.length === 0) ? (
                                        <div className="text-center py-10 text-gray-400 text-xs">
                                            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                            <p>暂无消息记录，开始聊天吧</p>
                                        </div>
                                    ) : (() => {
                                        // Deduplicate messages before rendering to prevent "duplicate key" errors
                                        const uniqueMessages = activeConv.messages.reduce((acc: any[], current: any) => {
                                            const x = acc.find((item: any) => item.id === current.id);
                                            if (!x) {
                                                return acc.concat([current]);
                                            } else {
                                                return acc;
                                            }
                                        }, []);

                                        return uniqueMessages.map((msg: any, index: number) => {
                                            // 获取消息发送者的头像
                                            const senderAvatar = msg.sender_avatar || '';
                                            // 根据sender_id判断是否为当前用户发送的消息
                                            const isCurrentUser = Number(msg.sender_id) === Number(currentUser.id);

                                            // --- 时间分割线逻辑 (微信风格) ---
                                            const prevMsg = uniqueMessages[index - 1]; // Use uniqueMessages for prevMsg
                                            let showTimeDivider = false;
                                            if (index === 0) {
                                                showTimeDivider = true;
                                            } else if (prevMsg) {
                                                const diff = new Date(msg.time || msg.created_at || msg.createdAt).getTime() - new Date(prevMsg.time || prevMsg.created_at || prevMsg.createdAt).getTime();
                                                if (diff > 5 * 60 * 1000) { // 超过5分钟显示一次时间
                                                    showTimeDivider = true;
                                                }
                                            }

                                            return (
                                                <React.Fragment key={msg.id || index}>
                                                    {/* WeChat-style Time Divider */}
                                                    {showTimeDivider && (
                                                        <div className="flex justify-center my-4">
                                                            <span className="px-3 py-1 bg-gray-200/50 dark:bg-slate-800/50 text-[10px] text-gray-500 dark:text-slate-400 rounded-full">
                                                                {formatDateTime(msg.time || msg.created_at || msg.createdAt)}
                                                            </span>
                                                        </div>
                                                    )}

                                                    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} ${msg.type === 'system' ? 'justify-center !my-4' : ''} items-end gap-2`}>
                                                        {msg.type === 'system' ? (
                                                            <span className="text-xs text-gray-500 bg-gray-200/80 px-3 py-1 rounded-full">{msg.text}</span>
                                                        ) : (msg.type === 'interview_invitation' || (msg.type === 'text' && msg.text?.includes('"type":"interview_invitation"'))) ? (
                                                            <InterviewCard
                                                                msg={msg}
                                                                isCurrentUser={isCurrentUser}
                                                                isRecruiter={true}
                                                            />
                                                        ) : (
                                                            <>
                                                                {!isCurrentUser && (
                                                                    <UserAvatar
                                                                        src={senderAvatar}
                                                                        name={msg.sender_name || '对方'}
                                                                        size={40}
                                                                        className="flex-shrink-0"
                                                                    />
                                                                )}
                                                                <div
                                                                    onContextMenu={(e) => handleContextMenu(e, msg.id, isCurrentUser, msg.text, msg.sender_name || '对方', msg.type)}
                                                                    className={`max-w-[75%] p-3.5 rounded-lg text-sm leading-relaxed cursor-pointer transition-all hover:opacity-95 shadow-sm ${isCurrentUser ? 'bg-blue-600 dark:bg-blue-600 text-white rounded-bl-lg' : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 rounded-br-lg'}`}
                                                                >


                                                                    {(msg.type === 'exchange_request' || msg.type === 'wechat_card') ? (
                                                                        <WeChatCard
                                                                            msg={msg}
                                                                            isMe={isCurrentUser}
                                                                            onCopy={copyWechatToClipboard}
                                                                            onAccept={handleAcceptWechatExchange}
                                                                            onReject={handleRejectWechatExchange}
                                                                        />
                                                                    ) : msg.type === 'file' ? (
                                                                        <div className="space-y-2">
                                                                            {/* 引用消息部分 - 微信风格引用样式 */}
                                                                            {msg.quoted_message && (
                                                                                <div className="mb-2 text-sm">
                                                                                    <span className="font-medium text-gray-600">
                                                                                        {msg.quoted_message.sender_name}:
                                                                                    </span>
                                                                                    <span className="text-gray-500 ml-1">
                                                                                        {msg.quoted_message.type === 'image' ? '[图片]' :
                                                                                            msg.quoted_message.type === 'file' ? `[文件: ${msg.quoted_message.file_name || '附件'}]` :
                                                                                                msg.quoted_message.text}
                                                                                    </span>
                                                                                </div>
                                                                            )}
                                                                            <p className="whitespace-pre-wrap">{msg.text}</p>
                                                                            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg flex items-center justify-between">
                                                                                <div className="flex items-center gap-3">
                                                                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                                                                        <Eye className="w-5 h-5" />
                                                                                    </div>
                                                                                    <div className="truncate">
                                                                                        <div className="font-medium text-sm truncate">{msg.file_name}</div>
                                                                                        <div className="text-xs text-gray-500">{msg.file_size}</div>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex gap-2">
                                                                                    <button
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            window.open(msg.file_url, '_blank');
                                                                                        }}
                                                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                                                                        title="查看文件"
                                                                                    >
                                                                                        <Eye className="w-4 h-4" />
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            const link = document.createElement('a');
                                                                                            link.href = msg.file_url;
                                                                                            link.download = msg.file_name;
                                                                                            document.body.appendChild(link);
                                                                                            link.click();
                                                                                            document.body.removeChild(link);
                                                                                        }}
                                                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                                                                        title="下载文件"
                                                                                    >
                                                                                        <Download className="w-4 h-4" />
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="space-y-2">
                                                                            {/* 引用消息部分 - 微信风格引用样式 */}
                                                                            {msg.quoted_message && (
                                                                                <div className="mb-2 text-sm">
                                                                                    <span className="font-medium text-gray-600">
                                                                                        {msg.quoted_message.sender_name}:
                                                                                    </span>
                                                                                    <span className="text-gray-500 ml-1">
                                                                                        {msg.quoted_message.type === 'image' ? '[图片]' :
                                                                                            msg.quoted_message.type === 'file' ? `[文件: ${msg.quoted_message.file_name || '附件'}]` :
                                                                                                msg.quoted_message.text}
                                                                                    </span>
                                                                                </div>
                                                                            )}
                                                                            {/* 不显示面试邀请的原始JSON文本 */}
                                                                            {msg.type !== 'interview_invitation' && (
                                                                                <p className="whitespace-pre-wrap">{msg.text}</p>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                {isCurrentUser && (
                                                                    <UserAvatar
                                                                        src={currentUser?.avatar}
                                                                        name={currentUser?.name || '我'}
                                                                        size={40}
                                                                        className="flex-shrink-0"
                                                                    />
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </React.Fragment>
                                            );
                                        })
                                    })()}
                                    <div ref={chatEndRef} />
                                </div>
                            </div>

                            {contextMenu.visible && (
                                <div
                                    className="fixed z-50 bg-white shadow-xl rounded-lg border border-gray-100 py-1 w-32 animate-in fade-in zoom-in-95 duration-100"
                                    style={{ top: contextMenu.y, left: contextMenu.x }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {/* 复制消息 */}
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(contextMenu.messageText);
                                            message.success('消息已复制');
                                            setContextMenu({ ...contextMenu, visible: false });
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-2M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                        </svg> 复制
                                    </button>

                                    {/* 回复消息 */}
                                    <button
                                        onClick={() => {
                                            setReplyingTo({
                                                id: contextMenu.msgId,
                                                text: contextMenu.messageText,
                                                senderName: contextMenu.senderName,
                                                type: contextMenu.type
                                            });
                                            setContextMenu({ ...contextMenu, visible: false });
                                            // 聚焦到输入框
                                            const textarea = document.querySelector('textarea');
                                            textarea?.focus();
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg> 回复
                                    </button>

                                    {/* 删除消息 */}
                                    <button
                                        onClick={() => {
                                            onDeleteMessage(activeConversationId!, contextMenu.msgId!);
                                            setContextMenu({ ...contextMenu, visible: false });
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" /> 删除消息
                                    </button>
                                </div>
                            )}

                            <div className="shrink-0 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 z-20">
                                {/* Input Area - 上下布局 */}
                                <div className="p-3 bg-white dark:bg-slate-900">
                                    {/* 回复信息 */}
                                    {replyingTo.id && (
                                        <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 mb-2 rounded-t-lg">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-medium text-blue-800">回复</span>
                                                    <span className="text-xs text-gray-600">{replyingTo.senderName || '对方'}</span>
                                                </div>
                                                <button
                                                    onClick={() => setReplyingTo({ id: null, text: '', senderName: null, type: 'text' })}
                                                    className="text-gray-500 hover:text-gray-700"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1 truncate">{replyingTo.text}</p>
                                        </div>
                                    )}

                                    <div className="flex items-end gap-3">
                                        <button
                                            onClick={() => setShowExtrasMenu(!showExtrasMenu)}
                                            className={`p-2.5 rounded-full transition-colors flex-shrink-0 ${showExtrasMenu ? 'bg-gray-200 text-gray-800' : 'text-gray-500 hover:bg-gray-100'}`}
                                            aria-label="更多功能"
                                        >
                                            <PlusIcon className={`w-5 h-5 transition-transform duration-200 ${showExtrasMenu ? 'rotate-45' : ''}`} />
                                        </button>

                                        <div className="flex-1 min-w-0 bg-gray-50 dark:bg-slate-800 rounded-[20px] focus-within:ring-1 focus-within:ring-blue-500/50 transition-all">
                                            <textarea
                                                className={`w-full px-4 py-3 bg-transparent border-none outline-none focus:ring-0 shadow-none text-sm resize-none max-h-32 min-h-[44px] dark:text-slate-100 placeholder-gray-400 ${replyingTo.id ? 'bg-white dark:bg-slate-800' : ''}`}
                                                rows={1}
                                                value={input}
                                                onChange={(e) => {
                                                    setInput(e.target.value);
                                                    // Auto-resize
                                                    e.target.style.height = 'auto';
                                                    e.target.style.height = `${e.target.scrollHeight}px`;
                                                }}
                                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                                                placeholder={replyingTo.id ? `回复 ${replyingTo.senderName || '对方'}...` : "输入消息..."}
                                            />
                                        </div>

                                        <button
                                            onClick={() => handleSend()}
                                            disabled={!input.trim()}
                                            className={`p-2.5 rounded-full transition flex-shrink-0 ${input.trim() ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md transform hover:-translate-y-0.5' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                                            style={{ backgroundColor: input.trim() ? '#2563EB' : undefined }}
                                        >
                                            <Send className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Extras Menu */}
                                {showExtrasMenu && (
                                    <div className="p-4 border-t border-gray-100 dark:border-slate-800 grid grid-cols-4 gap-4 animate-in slide-in-from-bottom-4 duration-200 bg-white dark:bg-slate-900">
                                        {
                                            [
                                                { icon: ImageIcon, label: '图片', action: () => handleSend('[图片]', 'image') },
                                                { icon: Camera, label: '拍摄', action: () => { } },
                                                { icon: MapPin, label: '公司位置', action: () => handleSend('公司地址：科技园...', 'location') },
                                                {
                                                    icon: FileText, label: '文件', action: () => {
                                                        const fileInput = document.createElement('input');
                                                        fileInput.type = 'file';
                                                        fileInput.accept = '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.txt';
                                                        fileInput.onchange = async (e) => {
                                                            const target = e.target as HTMLInputElement;
                                                            const file = target.files?.[0];
                                                            if (file && activeConv) {
                                                                try {
                                                                    const hideLoading = message.loading('正在上传文件...', 0);
                                                                    // 获取接收者ID
                                                                    const receiverId = activeConv.candidateUserId || activeConv.candidate_user_id || activeConv.candidate_userid || activeConv.candidateId || activeConv.candidate_id;
                                                                    // 调用文件上传API
                                                                    // 调用文件上传API
                                                                    const response = await messageAPI.uploadFile(
                                                                        activeConv.id,
                                                                        currentUser.id,
                                                                        receiverId,
                                                                        file,
                                                                        undefined,
                                                                        replyingTo
                                                                    );
                                                                    hideLoading();
                                                                    if (response.data && (response.data.status === 'success' || response.data.success)) {
                                                                        message.success('文件上传成功');
                                                                        // 消息已由后端创建并通过Socket推送，不再重复发送
                                                                        // onSendMessage(`[文件] ${file.name}`, 'file', replyingTo);
                                                                        // 清除回复状态
                                                                        setReplyingTo({ id: null, text: '', senderName: null, type: 'text' });
                                                                        // 刷新对话
                                                                        window.dispatchEvent(new CustomEvent('refreshConversation', { detail: { conversationId: activeConv.id } }));
                                                                    } else {
                                                                        message.error(response.data?.message || '文件上传失败');
                                                                    }
                                                                } catch (error) {
                                                                    message.error('文件上传失败，请重试');
                                                                    console.error('文件上传失败:', error);
                                                                }
                                                            }
                                                        };
                                                        fileInput.click();
                                                    }
                                                },
                                                { icon: Mic, label: '语音', action: () => { } },
                                                { icon: MessageCircle, label: '交换微信', action: handleWechatExchange }
                                            ].map((item, i) => (
                                                <button key={i} onClick={item.action} className="flex flex-col items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition">
                                                    <div className="w-12 h-12 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-gray-600 dark:text-slate-400">
                                                        <item.icon className="w-6 h-6" />
                                                    </div>
                                                    <span className="text-xs text-gray-500 dark:text-slate-400">{item.label}</span>
                                                </button>
                                            ))
                                        }
                                    </div>
                                )}

                                {/* WeChat Update Modal */}
                                {showWechatModal && (
                                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                                            {/* Modal Header */}
                                            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                                                <div className="flex items-center gap-2">
                                                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                    </svg>
                                                    <h3 className="font-semibold text-gray-900">完善您的微信号</h3>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setShowWechatModal(false);
                                                        setPendingAction(null);
                                                    }}
                                                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>

                                            {/* Modal Content */}
                                            <div className="p-6">
                                                <div className="space-y-4">
                                                    <div>
                                                        <p className="text-sm text-gray-600 mb-4">为了与对方交换微信，请先完善您的微信号信息。</p>
                                                        <div className="space-y-2">
                                                            <label htmlFor="wechat-input" className="block text-sm font-medium text-gray-700">
                                                                您的微信号
                                                            </label>
                                                            <input
                                                                type="text"
                                                                id="wechat-input"
                                                                value={wechatInput}
                                                                onChange={(e) => setWechatInput(e.target.value)}
                                                                placeholder="请输入您的微信号"
                                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Modal Footer */}
                                            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={() => {
                                                            setShowWechatModal(false);
                                                            setPendingAction(null);
                                                        }}
                                                        className="flex-1 py-2.5 px-4 rounded-xl font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                                                    >
                                                        取消
                                                    </button>
                                                    <button
                                                        onClick={handleUpdateWechat}
                                                        disabled={!wechatInput.trim()}
                                                        className={`flex-1 py-2.5 px-4 rounded-xl font-medium transition-all ${wechatInput.trim() ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                                                    >
                                                        保存并继续
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex-grow flex flex-col items-center justify-center text-gray-400 bg-gray-50/30">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
                                <MessageSquare className="w-8 h-8 text-gray-300" />
                            </div>
                            <p className="font-medium">选择左侧候选人开始沟通</p>
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

            {/* 面试邀请模态框 */}
            {isInterviewModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden transform transition-all duration-300 animate-in fade-in zoom-in-95"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-5 border-b flex justify-between items-center bg-blue-50/50">
                            <h3 className="text-xl font-bold text-gray-800 flex items-center">
                                <CalendarIcon className="w-5 h-5 mr-2 text-blue-600" />
                                安排面试邀请
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

                                    {/* 面试日期 */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">面试日期 *</label>
                                        <input
                                            type="date"
                                            name="interviewDate"
                                            value={interviewForm.interviewDate}
                                            onChange={handleFormChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        />
                                    </div>

                                    {/* 面试开始时间 */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">面试开始时间 *</label>
                                        <select
                                            name="interviewTime"
                                            value={interviewForm.interviewTime}
                                            onChange={handleFormChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        >
                                            <option value="">请选择时间</option>
                                            {TIME_SLOTS.map(timeValue => (
                                                <option key={timeValue} value={timeValue}>
                                                    {timeValue}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* 面试结束时间 */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">面试结束时间 *</label>
                                        <select
                                            name="interviewTimeEnd"
                                            value={interviewForm.interviewTimeEnd}
                                            onChange={handleFormChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        >
                                            <option value="">请选择时间</option>
                                            {TIME_SLOTS.filter(timeValue => {
                                                if (!interviewForm.interviewTime) return true;
                                                const [startH, startM] = interviewForm.interviewTime.split(':').map(Number);
                                                const [endH, endM] = timeValue.split(':').map(Number);
                                                return (endH * 60 + endM) > (startH * 60 + startM);
                                            }).map(timeValue => (
                                                <option key={timeValue} value={timeValue}>
                                                    {timeValue}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* 自动填充字段 - 只读显示 */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">面试官姓名</label>
                                        <input
                                            type="text"
                                            name="interviewerName"
                                            value={interviewForm.interviewerName}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
                                            disabled
                                        />
                                    </div>

                                    {interviewForm.interviewerPosition && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">面试官职位</label>
                                            <input
                                                type="text"
                                                name="interviewerPosition"
                                                value={interviewForm.interviewerPosition}
                                                className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
                                                disabled
                                            />
                                        </div>
                                    )}

                                    {/* 面试岗位 - 下拉选择 */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">面试岗位 *</label>
                                        <select
                                            name="interviewPosition"
                                            value={interviewForm.interviewPosition}
                                            onChange={handleFormChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        >
                                            {jobs.map(job => (
                                                <option key={job.id} value={job.title}>
                                                    {job.title}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* 面试地址 */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">面试地址</label>
                                        <input
                                            type="text"
                                            name="location"
                                            value={interviewForm.location}
                                            onChange={handleFormChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="请输入面试地址"
                                        />
                                    </div>

                                    {/* 面试备注 */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">面试备注</label>
                                        <textarea
                                            name="notes"
                                            value={interviewForm.notes}
                                            onChange={handleFormChange}
                                            rows={3}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="请输入面试备注（选填）"
                                        ></textarea>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t">
                                    <button
                                        type="button"
                                        onClick={closeInterviewModal}
                                        className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        取消
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleCreateInterview}
                                        disabled={formLoading}
                                        className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                                    >
                                        {formLoading ? (
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <CheckCircle className="w-4 h-4" />
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


// 使用React.memo包装组件，减少不必要的重新渲染
export default memo(RecruiterMessageScreen);
