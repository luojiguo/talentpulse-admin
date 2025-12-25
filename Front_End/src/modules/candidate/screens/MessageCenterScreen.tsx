import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Search, MessageSquare, Phone, MoreVertical, Send as SendIcon, Plus, Image as ImageIcon, Camera, MapPin, Trash2, ArrowLeft, ChevronDown, Copy, Reply } from 'lucide-react';
import { Conversation, JobPosting, Message, MergedConversation } from '@/types/types';
import { formatDateTime } from '@/utils/dateUtils';
import { useDeviceType } from '@/hooks/useMediaQuery';
import { processAvatarUrl } from '@/components/AvatarUploadComponent';
import {
    getMessageContainerHeight,
    getMessageContainerPadding,
    getChatWindowClasses,
    getMessageListClasses,
    getChatWindowWidth
} from '@/utils/layoutUtils';

interface MessageCenterScreenProps {
    conversations: Conversation[];
    jobs: JobPosting[];
    activeConversationId: string | null;
    onSelectConversation: (id: string) => void;
    onSendMessage: (text: string, type?: string) => void;
    onUploadImage?: (conversationId: string | number, file: File) => void;
    onDeleteMessage: (conversationId: string, messageId: number | string) => void;
    onDeleteConversation: (conversationId: string) => void;
    onLoadMoreMessages?: (conversationId: string, currentCount: number) => Promise<boolean>;
    searchText: string;
    setSearchText: (text: string) => void;
    filterUnread: boolean;
    setFilterUnread: (filter: boolean) => void;
    currentUser: any;
    conversationError?: string | null;
}

const MessageCenterScreen: React.FC<MessageCenterScreenProps> = ({
    conversations, jobs, activeConversationId,
    onSelectConversation,
    onSendMessage, onUploadImage, onDeleteMessage, onDeleteConversation,
    onLoadMoreMessages,
    searchText, setSearchText, filterUnread, setFilterUnread, currentUser,
    conversationError
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

    // 使用精确的设备类型判断
    const { isMobile, isTablet, isDesktop } = useDeviceType();

    // Sync URL param with active ID or handle selection
    useEffect(() => {
        const syncConversation = async () => {
            if (paramConversationId && paramConversationId !== activeConversationId) {
                // 标记正在切换对话，避免 UI 闪烁
                setIsInitialLoading(true);

                try {
                    // 调用父组件的选择函数（异步获取详情）
                    await onSelectConversation(paramConversationId);
                } catch (error) {
                    console.error('Failed to sync conversation:', error);
                } finally {
                    // 增加极短延迟确保渲染同步，解决视觉突跳
                    requestAnimationFrame(() => {
                        setIsInitialLoading(false);
                    });
                }
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

    // 点击外部关闭右键菜单
    useEffect(() => {
        const handleClickOutside = () => {
            if (contextMenu.visible) {
                setContextMenu(prev => ({ ...prev, visible: false }));
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
            const recruiterId = conv.recruiterUserId || conv.recruiter_id || conv.recruiterId || conv.RecruiterId;
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

    const activeConv = React.useMemo(() =>
        conversations.find((c: Conversation) => c.id.toString() === activeConversationId?.toString()),
        [conversations, activeConversationId]);

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

    // 处理文件选择（图片上传）
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && activeConversationId && onUploadImage) {
            onUploadImage(activeConversationId, file);
            // 清空 input 以便下次选择同一文件
            e.target.value = '';
        }
    };

    // 发送消息
    const handleSend = (text?: string, type?: string) => {
        const messageText = text || input.trim();
        if (messageText) {
            // 如果有回复，将回复信息添加到消息前面
            let finalMessage = messageText;
            if (replyingTo && !text) {
                const replyPreview = replyingTo.text?.slice(0, 30) + (replyingTo.text && replyingTo.text.length > 30 ? '...' : '');
                finalMessage = `↩️ 回复 ${replyingTo.senderName}: "${replyPreview}"\n\n${messageText}`;
            }
            onSendMessage(finalMessage, type);
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
                    <div className="p-4 border-b border-gray-100 bg-gray-50 shrink-0">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">消息列表</h2>
                        <div className="relative mb-3">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="搜索联系人..."
                                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
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
                                        className={`p-4 border-b border-gray-50 cursor-pointer transition-colors hover:bg-gray-50 
                                            ${isActive && !isMobile ? 'bg-indigo-50/60 border-l-4 border-l-indigo-600' : 'border-l-4 border-l-transparent'}`}
                                    >
                                        <div className="flex justify-between mb-1">
                                            <div className="flex items-center gap-2">
                                                <div className="w-10 h-10 rounded-full bg-indigo-100 overflow-hidden flex items-center justify-center shrink-0">
                                                    {recruiterAvatar && (recruiterAvatar.startsWith('http') || recruiterAvatar.startsWith('/')) ? (
                                                        <img src={processAvatarUrl(recruiterAvatar)} alt={recruiterName} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="font-bold text-indigo-600">{recruiterName.charAt(0)}</span>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className={`font-bold text-sm truncate ${isActive && !isMobile ? 'text-indigo-900' : 'text-gray-900'}`}>{recruiterName}</h4>
                                                    <p className="text-xs text-gray-500 truncate">{displayJobTitle} • {conv.company_name || '未知公司'}</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="text-xs text-gray-400">{formatDateTime(conv.lastTime).split(' ')[0]}</span>
                                                {conv.unreadCount > 0 && (
                                                    <span className="text-xs bg-indigo-600 text-white px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
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
                                        <p className="text-xs text-gray-500 truncate mt-2 pl-12">{conv.lastMessage}</p>
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

                {/* --- Chat Window (Right) --- */}
                <div className={`${chatClasses} ${chatWidth}`}>
                    {activeConv ? (
                        <>
                            {/* Header */}
                            <div className="p-4 border-b bg-white flex justify-between items-center shadow-sm z-10 shrink-0">
                                <div className="flex items-center gap-3">
                                    {isMobile && (
                                        <button
                                            onClick={() => navigate('/messages')}
                                            className="p-1 -ml-2 mr-1 text-gray-600 hover:text-indigo-600 transition-colors"
                                            aria-label="返回消息列表"
                                        >
                                            <ArrowLeft className="w-6 h-6" />
                                        </button>
                                    )}
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 overflow-hidden flex items-center justify-center border border-indigo-200">
                                        {activeConv.recruiter_avatar && (activeConv.recruiter_avatar.startsWith('http') || activeConv.recruiter_avatar.startsWith('/')) ? (
                                            <img src={activeConv.recruiter_avatar} alt="avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-lg font-bold">{activeConv.recruiter_name?.charAt(0) || 'H'}</span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h2 className="text-base font-bold text-gray-900">{activeConv.recruiter_name || '招聘者'}</h2>
                                        {mergedConvForActive && mergedConvForActive.allJobs && mergedConvForActive.allJobs.length > 1 ? (
                                            <div className="relative">
                                                <button
                                                    onClick={() => setShowJobSelector(!showJobSelector)}
                                                    className="text-xs text-gray-500 hover:text-indigo-600 flex items-center gap-1 max-w-[200px] truncate"
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
                                                                    className={`w-full text-left px-3 py-2 text-xs hover:bg-indigo-50 transition-colors ${isCurrentJob ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-gray-700'
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
                                <div className="flex gap-2">
                                    <button className="p-2 text-gray-400 hover:text-indigo-600 bg-gray-50 rounded-full"><Phone className="w-4 h-4" /></button>
                                    <button className="p-2 text-gray-400 hover:text-indigo-600 bg-gray-50 rounded-full"><MoreVertical className="w-4 h-4" /></button>
                                </div>
                            </div>

                            {/* Messages */}
                            <div
                                ref={chatContainerRef}
                                onScroll={handleScroll}
                                className="flex-1 bg-slate-50 p-4 overflow-y-auto custom-scrollbar relative"
                                onClick={() => {
                                    if (showExtrasMenu) setShowExtrasMenu(false);
                                    if (showJobSelector) setShowJobSelector(false);
                                }}
                            >
                                {isInitialLoading ? (
                                    <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-20">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                                            <p className="text-xs text-gray-500 font-medium">加载中...</p>
                                        </div>
                                    </div>
                                ) : null}
                                {/* 加载更多指示器 */}
                                {isLoadingMore && (
                                    <div className="flex justify-center py-2">
                                        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                )}
                                {/* 消息列表 */}
                                <div className="space-y-4">
                                    {!isInitialLoading && activeConv.messages && activeConv.messages.length === 0 && (
                                        <div className="text-center py-10 text-gray-400 text-xs">
                                            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                            <p>暂无消息记录，开始聊天吧</p>
                                        </div>
                                    )}
                                    {activeConv.messages?.map((msg: Message, i: number) => {
                                        const isMe = Number(msg.sender_id) === Number(currentUser?.id);
                                        const isSystem = msg.type === 'system';

                                        if (isSystem) return (
                                            <div key={i} className="flex justify-center my-4">
                                                <span className="text-xs bg-gray-200 text-gray-500 px-3 py-1 rounded-full">{msg.text}</span>
                                            </div>
                                        );

                                        return (
                                            <div key={i} className={`flex gap-2 items-end ${isMe ? 'justify-end' : 'justify-start'} group`}>
                                                {!isMe && (
                                                    <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
                                                        {msg.sender_avatar && msg.sender_avatar !== '' ? <img src={processAvatarUrl(msg.sender_avatar)} className="w-full h-full object-cover" /> : <span className="flex items-center justify-center h-full text-xs">{msg.sender_name?.[0]}</span>}
                                                    </div>
                                                )}
                                                <div
                                                    className={`max-w-[70%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm cursor-pointer select-text
                                                    ${isMe ? 'bg-indigo-600 text-white rounded-bl-lg' : 'bg-white text-gray-800 rounded-br-lg'}
                                                    hover:shadow-md transition-shadow
                                                `}
                                                    onContextMenu={(e) => handleContextMenu(e, msg, isMe)}
                                                >
                                                    {msg.type === 'image' && msg.file_url ? (
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
                                                    ) : (
                                                        // 检测是否为回复消息
                                                        msg.text?.startsWith('↩️ 回复') ? (
                                                            <div className="space-y-2">
                                                                {/* 回复引用部分 */}
                                                                <div className={`
                                                                    px-2.5 py-1.5 rounded-lg text-xs border-l-2
                                                                    ${isMe
                                                                        ? 'bg-indigo-500/30 border-indigo-300/50 text-indigo-100'
                                                                        : 'bg-gray-100 border-gray-300 text-gray-500'
                                                                    }
                                                                `}>
                                                                    <div className="flex items-center gap-1 mb-0.5">
                                                                        <Reply className="w-3 h-3 opacity-70" />
                                                                        <span className="font-medium opacity-80">
                                                                            {msg.text.split('\n')[0].replace('↩️ ', '')}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                {/* 实际回复内容 */}
                                                                <p className="whitespace-pre-wrap">{msg.text.split('\n\n').slice(1).join('\n\n')}</p>
                                                            </div>
                                                        ) : (
                                                            <p className="whitespace-pre-wrap">{msg.text}</p>
                                                        )
                                                    )}
                                                    <span className={`text-[10px] block text-right mt-1 opacity-70`}>{formatDateTime(msg.time)}</span>
                                                </div>
                                                {isMe && (
                                                    <div className="w-8 h-8 rounded-full bg-indigo-100 overflow-hidden">
                                                        {currentUser?.avatar && currentUser.avatar.trim() !== '' ? <img src={processAvatarUrl(currentUser.avatar)} className="w-full h-full object-cover" /> : <span className="flex items-center justify-center h-full text-xs font-bold text-indigo-600">{currentUser?.name?.[0]}</span>}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* 回到最新消息按钮 */}
                                {showScrollToNew && (
                                    <button
                                        onClick={() => scrollToLatest(true)}
                                        className="absolute bottom-4 right-4 p-2 bg-white text-indigo-600 rounded-full shadow-lg border border-gray-100 hover:bg-gray-50 transition-all"
                                        aria-label="回到最新消息"
                                    >
                                        <ChevronDown className="w-5 h-5" />
                                    </button>
                                )}
                            </div>

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
                                    {contextMenu.isMe && (
                                        <button
                                            onClick={handleDeleteMessage}
                                            className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            <span>删除</span>
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Input Area */}
                            <div className="shrink-0 bg-white border-t border-gray-100 z-20 pb-safe">
                                {/* 回复预览卡片 */}
                                {replyingTo && (
                                    <div className="px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100 animate-in slide-in-from-bottom-2 duration-200">
                                        <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0 w-1 h-full min-h-[40px] bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <Reply className="w-3.5 h-3.5 text-indigo-500" />
                                                    <span className="text-xs font-semibold text-indigo-600">
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
                                {/* Quick Actions */}
                                <div className="px-4 py-2 bg-gray-50/50 flex space-x-2 overflow-x-auto border-b border-gray-100 no-scrollbar">
                                    <button onClick={() => handleSend("已发送在线简历。", 'system')} className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs rounded-full whitespace-nowrap">发送简历</button>
                                    <button onClick={() => handleSend(`我的微信号是: ${currentUser?.wechat || '未设置'}`, 'text')} className="px-3 py-1 bg-emerald-50 text-emerald-600 text-xs rounded-full whitespace-nowrap">交换微信</button>
                                    <button onClick={() => handleSend("方便电话沟通吗？", 'text')} className="px-3 py-1 bg-blue-50 text-blue-600 text-xs rounded-full whitespace-nowrap">约电话</button>
                                </div>

                                <div className="p-3 flex items-end gap-2">
                                    <button onClick={() => setShowExtrasMenu(!showExtrasMenu)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full">
                                        <Plus className={`w-6 h-6 transition-transform ${showExtrasMenu ? 'rotate-45' : ''}`} />
                                    </button>
                                    <textarea
                                        className="flex-grow p-2.5 bg-gray-50 border-gray-200 rounded-xl resize-none text-sm focus:ring-2 focus:ring-indigo-500 max-h-32"
                                        rows={1}
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                                        placeholder="输入消息..."
                                    />
                                    <button
                                        onClick={() => handleSend()}
                                        disabled={!input.trim()}
                                        className={`p-2.5 rounded-xl transition ${input.trim() ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-200 text-gray-400'}`}
                                    >
                                        <SendIcon className="w-5 h-5" />
                                    </button>
                                </div>
                                {showExtrasMenu && (
                                    <div className="p-4 grid grid-cols-4 gap-4 animate-in slide-in-from-bottom-2">
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
                                            { icon: MapPin, label: '位置', action: () => handleSend('广东省深圳市...', 'location') }
                                        ].map((item, i) => (
                                            <button key={i} className="flex flex-col items-center gap-2" onClick={item.action}>
                                                <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-600">
                                                    <item.icon className="w-6 h-6" />
                                                </div>
                                                <span className="text-xs text-gray-500">{item.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
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
        </div>
    );
};

export default MessageCenterScreen;