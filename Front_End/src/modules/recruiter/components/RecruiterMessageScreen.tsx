import React, { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    MessageSquare, Phone, MoreVertical, Send, Plus as PlusIcon, Image as ImageIcon,
    Camera, Mic, Trash2, MapPin, ArrowLeft
} from 'lucide-react';
import { Modal } from 'antd';
import { formatDateTime } from '@/utils/dateUtils';
import { useDeviceType } from '@/hooks/useMediaQuery';
import {
    getMessageContainerHeight,
    getMessageContainerPadding,
    getChatWindowClasses,
    getMessageListClasses,
    getChatWindowWidth
} from '@/utils/layoutUtils';
import { processAvatarUrl } from '@/components/AvatarUploadComponent';

interface RecruiterMessageScreenProps {
    conversations: any[];
    candidates: any[];
    jobs: any[];
    activeConversationId: string | null;
    onSelectConversation: (id: string) => void;
    onSendMessage: (text: string, type: string) => void;
    onDeleteMessage: (conversationId: string, messageId: number | string) => void;
    onDeleteConversation: (conversationId: string) => void;
    onLoadMoreMessages?: (conversationId: string, currentCount: number) => Promise<boolean>;
    currentUser: any;
}

const RecruiterMessageScreen: React.FC<RecruiterMessageScreenProps> = ({
    conversations, candidates, jobs, activeConversationId, onSelectConversation,
    onSendMessage, onDeleteMessage, onDeleteConversation,
    onLoadMoreMessages,
    currentUser
}) => {
    const navigate = useNavigate();
    const { conversationId: paramConversationId } = useParams<{ conversationId: string }>();
    const chatEndRef = useRef<HTMLDivElement>(null);
    const [input, setInput] = useState('');
    const [showExtrasMenu, setShowExtrasMenu] = useState(false);
    const [searchText, setSearchText] = useState('');

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
    const [contextMenu, setContextMenu] = useState<{ visible: boolean, x: number, y: number, msgId: number | string | null }>({
        visible: false, x: 0, y: 0, msgId: null
    });

    const activeConv = conversations.find((c: any) => c.id === activeConversationId);

    const activeJob = activeConv ? jobs.find((j: any) => j.id === activeConv.jobId || j.id === activeConv.job_id) : null;

    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);

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
        const handleClick = () => setContextMenu(prev => ({ ...prev, visible: false }));
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, []);

    const handleSend = useCallback((text?: string, type = 'text') => {
        const msgText = text || input;
        if (!msgText.trim() && type === 'text') return;
        onSendMessage(msgText, type);
        setInput('');
        setShowExtrasMenu(false);
    }, [input, onSendMessage, setShowExtrasMenu]);

    const handleContextMenu = useCallback((e: React.MouseEvent, msgId: number | string) => {
        e.preventDefault();
        setContextMenu({ visible: true, x: e.pageX, y: e.pageY, msgId: msgId });
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
        Modal.confirm({
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

    return (
        <div className={`max-w-7xl mx-auto ${containerPadding} ${containerHeight}`}>
            <div className={`flex ${isMobile ? 'flex-col' : isTablet ? 'flex-row' : 'flex-row'} gap-4 md:gap-6 h-full ${isMobile ? 'bg-white' : ''}`}>
                {/* Sidebar List (Left) - 联系人列表 */}
                <div className={`${listClasses} ${isMobile ? 'h-1/2' : ''} border-r border-gray-200 bg-white`}>
                    <div className="p-5 border-b border-gray-100 bg-gray-50 shrink-0">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">候选人消息</h2>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="搜索候选人姓名..."
                                className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
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
                            const candidateAvatar = conv.candidate_avatar || '候';

                            return (
                                <div
                                    key={conv.id}
                                    onClick={() => handleConversationClick(conv)}
                                    className={`relative group p-4 border-b border-gray-50 cursor-pointer transition-colors hover:bg-emerald-50 ${isActive ? 'bg-emerald-50 border-l-4 border-l-emerald-600' : 'border-l-4 border-l-transparent'}`}
                                >
                                    <div className="flex justify-between mb-1.5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden border border-slate-200 flex-shrink-0">
                                                {candidateAvatar && candidateAvatar !== '' ? (
                                                    <img
                                                        src={processAvatarUrl(candidateAvatar)}
                                                        alt={candidateName}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="w-full h-full flex items-center justify-center text-sm font-bold">{candidateName.charAt(0)}</span>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h4 className={`font-bold text-sm truncate ${isActive ? 'text-emerald-900' : 'text-gray-900'}`}>{candidateName}</h4>
                                                <p className="text-xs text-gray-500 truncate max-w-[140px]">{job?.title || conv.job_title || '意向职位'}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-xs text-gray-400 whitespace-nowrap">{formatDateTime(conv.lastTime || conv.updated_at || conv.updatedAt)}</span>
                                            {conv.unreadCount > 0 && (
                                                <span className="mt-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-emerald-500 rounded-full">
                                                    {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <p className={`text-xs truncate pl-15 ${isActive ? 'text-emerald-700 font-medium' : 'text-gray-500'}`}>{conv.lastMessage || conv.last_message || ''}</p>

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
                <div className={`${chatClasses} ${chatWidth} bg-white flex flex-col`}>
                    {activeConv ? (
                        <>
                            <div className="p-4 border-b bg-white flex justify-between items-center shadow-sm z-10 shrink-0">
                                <div className="flex items-center gap-3">
                                    {isMobile && (
                                        <button
                                            onClick={() => navigate('/recruiter/messages')}
                                            className="p-1 -ml-2 mr-1 text-gray-600 hover:text-emerald-600 transition-colors"
                                            aria-label="返回消息列表"
                                        >
                                            <ArrowLeft className="w-6 h-6" />
                                        </button>
                                    )}
                                    <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden border border-slate-200 flex-shrink-0">
                                        {/* 直接从对话数据中获取候选人头像 */}
                                        {activeConv.candidate_avatar && activeConv.candidate_avatar !== '' ? (
                                            <img
                                                src={processAvatarUrl(activeConv.candidate_avatar)}
                                                alt={activeConv.candidate_name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span className="w-full h-full flex items-center justify-center text-xs font-bold">{activeConv.candidate_name?.charAt(0) || '候'}</span>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h2 className="text-lg font-bold text-gray-900 truncate">{activeConv.candidate_name || '候选人'}</h2>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                                            <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-600">{activeConv.candidate_experience || '经验未知'}</span>
                                            <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-600">{activeConv.candidate_location || '地点未知'}</span>
                                            <span>• 申请职位: <span className="text-emerald-600 font-medium truncate max-w-[100px] inline-block align-bottom">{activeJob?.title || activeConv.job_title || '职位已失效'}</span></span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition"><Phone className="w-5 h-5" /></button>
                                    <button className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition"><MoreVertical className="w-5 h-5" /></button>
                                </div>
                            </div>

                            <div
                                className="flex-1 bg-slate-100 p-4 overflow-y-auto custom-scrollbar relative"
                                onScroll={handleScroll}
                            >
                                <div className="space-y-4 max-w-4xl mx-auto">
                                    {isLoadingMore && (
                                        <div className="flex justify-center py-2">
                                            <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                    {activeConv.messages && activeConv.messages.map((msg: any, index: number) => {
                                        // 获取消息发送者的头像
                                        const senderAvatar = msg.sender_avatar || '';
                                        // 根据sender_id判断是否为当前用户发送的消息
                                        // CRITICAL FIX: Must compare msg.sender_id (User ID) with currentUser.id (User ID), NOT recruiterId (Recruiter Table ID)
                                        const isCurrentUser = Number(msg.sender_id) === Number(currentUser.id);

                                        // 检查是否需要显示日期分隔线
                                        const prevMsg = activeConv.messages[index - 1];
                                        const showDateDivider = index === 0 ||
                                            (prevMsg &&
                                                new Date(msg.time || msg.created_at || msg.createdAt).toDateString() !== new Date(prevMsg.time || prevMsg.created_at || prevMsg.createdAt).toDateString());

                                        return (
                                            <>
                                                {/* Date Divider */}
                                                {showDateDivider && (
                                                    <div className="flex justify-center my-4">
                                                        <span className="px-3 py-1 bg-gray-200/80 text-xs text-gray-500 rounded-full">
                                                            {formatDateTime(msg.time || msg.created_at || msg.createdAt, 'date')}
                                                        </span>
                                                    </div>
                                                )}

                                                <div key={msg.id || index} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} ${msg.type === 'system' ? 'justify-center !my-4' : ''} items-end gap-2`}>
                                                    {msg.type === 'system' ? (
                                                        <span className="text-xs text-gray-500 bg-gray-200/80 px-3 py-1 rounded-full">{msg.text}</span>
                                                    ) : (
                                                        <>
                                                            {/* 非当前用户消息显示头像 */}
                                                            {!isCurrentUser && (
                                                                <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                                                                    {senderAvatar && senderAvatar !== '' ? (
                                                                        <img
                                                                            src={processAvatarUrl(senderAvatar)}
                                                                            alt="头像"
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                    ) : (
                                                                        <span className="w-full h-full flex items-center justify-center text-sm font-bold">
                                                                            {msg.sender_name?.charAt(0) || '候'}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                            <div
                                                                onContextMenu={(e) => handleContextMenu(e, msg.id)}
                                                                className={`max-w-[75%] p-3.5 rounded-lg text-sm leading-relaxed cursor-pointer transition-all hover:opacity-95 ${isCurrentUser ? 'bg-emerald-500 text-white rounded-bl-lg' : 'bg-white text-gray-800 rounded-br-lg'}`}
                                                            >
                                                                <p className="whitespace-pre-wrap mb-1">{msg.text}</p>
                                                                <div className="flex items-center justify-end gap-1">
                                                                    <span className={`text-[10px] ${isCurrentUser ? 'text-green-200' : 'text-gray-400'}`}>
                                                                        {formatDateTime(msg.time || msg.created_at || msg.createdAt, '')}
                                                                    </span>
                                                                    {isCurrentUser && (
                                                                        <span className="text-[10px] text-green-200">
                                                                            ✓✓
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {/* 当前用户消息显示头像 */}
                                                            {isCurrentUser && (
                                                                <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                                                                    {/* 使用招聘者的头像 */}
                                                                    {activeConv.recruiter_avatar && (activeConv.recruiter_avatar.startsWith('http') || activeConv.recruiter_avatar.startsWith('/avatars/')) ? (
                                                                        <img src={activeConv.recruiter_avatar} alt="头像" className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <span className="w-full h-full flex items-center justify-center text-sm font-bold">
                                                                            {activeConv.recruiter_name?.charAt(0) || '招'}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}

                                                        </>
                                                    )}
                                                </div>
                                            </>
                                        );
                                    })}
                                    <div ref={chatEndRef} />
                                </div>
                            </div>

                            {contextMenu.visible && (
                                <div
                                    className="fixed z-50 bg-white shadow-xl rounded-lg border border-gray-100 py-1 w-32 animate-in fade-in zoom-in-95 duration-100"
                                    style={{ top: contextMenu.y, left: contextMenu.x }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <button
                                        onClick={() => { onDeleteMessage(activeConversationId!, contextMenu.msgId!); setContextMenu({ ...contextMenu, visible: false }); }}
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" /> 删除消息
                                    </button>
                                </div>
                            )}

                            <div className="shrink-0 bg-white border-t border-gray-100 z-20">
                                {/* Text Input */}
                                <div className="p-3 flex items-center gap-2">
                                    <button
                                        onClick={() => setShowExtrasMenu(!showExtrasMenu)}
                                        className={`p-2.5 rounded-full transition-colors ${showExtrasMenu ? 'bg-gray-200 text-gray-800' : 'text-gray-500 hover:bg-gray-100'}`}
                                    >
                                        <PlusIcon className={`w-5 h-5 transition-transform duration-200 ${showExtrasMenu ? 'rotate-45' : ''}`} />
                                    </button>

                                    {/* Quick Actions */}
                                    <div className="hidden md:flex space-x-2">
                                        <button onClick={() => handleSend("您好，对您的经历很感兴趣，能否发一份最新的附件简历？", 'text')} className="px-3 py-1.5 bg-emerald-50 text-emerald-600 text-xs rounded-full hover:bg-emerald-100 transition whitespace-nowrap border border-emerald-200">索取简历</button>
                                        <button onClick={() => handleSend("您好，为了方便后续沟通，方便加一下微信吗？", 'text')} className="px-3 py-1.5 bg-emerald-50 text-emerald-600 text-xs rounded-full hover:bg-emerald-100 transition whitespace-nowrap border border-emerald-200">索取微信</button>
                                        <button onClick={() => handleSend("您好，已收到您的简历，想约您进行面试。", 'text')} className="px-3 py-1.5 bg-emerald-50 text-emerald-600 text-xs rounded-full hover:bg-emerald-100 transition whitespace-nowrap border border-emerald-200">邀请面试</button>
                                        <button onClick={() => handleSend("请问您最快什么时候可以到岗？", 'text')} className="px-3 py-1.5 bg-blue-50 text-blue-600 text-xs rounded-full hover:bg-blue-100 transition whitespace-nowrap border border-blue-200">询问到岗时间</button>
                                        <button onClick={() => handleSend("能否提供一下您的作品集？", 'text')} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 text-xs rounded-full hover:bg-indigo-100 transition whitespace-nowrap border border-indigo-200">索要作品集</button>
                                    </div>

                                    <div className="flex-grow relative">
                                        <textarea
                                            className="w-full p-3 bg-gray-100 border-0 rounded-full resize-none text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all max-h-32"
                                            rows={1}
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                                            placeholder="输入回复..."
                                        />
                                    </div>

                                    <button
                                        onClick={() => handleSend()}
                                        disabled={!input.trim()}
                                        className={`p-2.5 rounded-full transition ${input.trim() ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                                    >
                                        <Send className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Extras Menu */}
                                {showExtrasMenu && (
                                    <div className="p-4 border-t border-gray-100 grid grid-cols-4 gap-4 animate-in slide-in-from-bottom-4 duration-200 bg-white">
                                        {[
                                            { icon: ImageIcon, label: '图片', action: () => handleSend('[图片]', 'image') },
                                            { icon: Camera, label: '拍摄', action: () => { } },
                                            { icon: MapPin, label: '公司位置', action: () => handleSend('公司地址：科技园...', 'location') },
                                            { icon: Mic, label: '语音', action: () => { } }
                                        ].map((item, i) => (
                                            <button key={i} onClick={item.action} className="flex flex-col items-center gap-2 p-2 hover:bg-gray-50 rounded-xl transition">
                                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
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
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
                                <MessageSquare className="w-8 h-8 text-gray-300" />
                            </div>
                            <p className="font-medium">选择左侧候选人开始沟通</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// 使用React.memo包装组件，减少不必要的重新渲染
export default memo(RecruiterMessageScreen, (prevProps, nextProps) => {
    // 只比较关键属性，避免深层比较
    return (
        prevProps.activeConversationId === nextProps.activeConversationId &&
        prevProps.conversations.length === nextProps.conversations.length &&
        prevProps.conversations.every((conv: any, index: number) => {
            const nextConv = nextProps.conversations[index];
            return (
                conv.id === nextConv.id &&
                conv.updated_at === nextConv.updated_at &&
                conv.last_message === nextConv.last_message
            );
        }) &&
        prevProps.currentUser.id === nextProps.currentUser.id
    );
});