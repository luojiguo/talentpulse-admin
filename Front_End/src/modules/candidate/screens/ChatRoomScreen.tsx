import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MessageSquare, Phone, MoreVertical, Send as SendIcon, Plus, Image as ImageIcon, Camera, MapPin, Trash2, ArrowLeft } from 'lucide-react';
import { Conversation, JobPosting, Message } from '@/types/types';
import { formatDateTime, formatTime } from '@/utils/dateUtils';
import { processAvatarUrl } from '@/components/AvatarUploadComponent';

interface ChatRoomScreenProps {
    conversations: Conversation[];
    jobs: JobPosting[];
    activeConversationId: string | null;
    setActiveConversationId: (id: string) => void;
    onSendMessage: (text: string, type?: string) => void;
    onDeleteMessage: (conversationId: string, messageId: number | string) => void;
    currentUser: any;
}

const ChatRoomScreen: React.FC<ChatRoomScreenProps> = ({ 
    conversations, 
    jobs, 
    activeConversationId,
    setActiveConversationId,
    onSendMessage, 
    onDeleteMessage,
    currentUser
}) => {
    const navigate = useNavigate();
    const { conversationId } = useParams<{ conversationId: string }>();
    const chatEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const [input, setInput] = useState('');
    const [showExtrasMenu, setShowExtrasMenu] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    
    // Context Menu State
    const [contextMenu, setContextMenu] = useState<{ 
        visible: boolean, 
        x: number, 
        y: number, 
        msgId: number | string | null,
        isCurrentUser: boolean
    }>({
        visible: false, 
        x: 0, 
        y: 0, 
        msgId: null,
        isCurrentUser: false
    });

    // 获取当前对话
    const convId = conversationId || activeConversationId || '';
    const activeConv = conversations.find((c: Conversation) => c.id === convId);
    const activeJob = activeConv ? jobs.find((j: JobPosting) => j.id === activeConv.jobId) : null;

    // 添加加载状态，等待数据加载完成
    useEffect(() => {
        // 如果已经有对话数据，直接设置为加载完成
        if (conversations.length > 0) {
            setIsLoading(false);
        } else {
            // 否则等待1秒后再检查
            const timer = setTimeout(() => {
                setIsLoading(false);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [conversations.length]);

    // 如果没有找到对话，返回到消息列表 - 优化逻辑，确保在数据完全加载后再判断
    useEffect(() => {
        // 只有当convId存在且activeConv不存在时才导航回消息列表
        // 避免在数据还未加载完成时就导航
        if (!isLoading && convId && conversations.length > 0 && !activeConv) {
            // 显示友好提示后再跳转
            setTimeout(() => {
                navigate('/messages');
            }, 500);
        }
    }, [isLoading, convId, activeConv, navigate, conversations.length]);

    // 确保当conversationId变化时，更新activeConversationId
    useEffect(() => {
        if (conversationId && conversationId !== activeConversationId) {
            setActiveConversationId(conversationId);
        }
    }, [conversationId, activeConversationId, setActiveConversationId]);

    // Track the last message count to determine if we should scroll
    const [lastMessageCount, setLastMessageCount] = useState(0);
    // Track the last active conversation to detect conversation changes
    const [lastActiveConversationId, setLastActiveConversationId] = useState<string | null>(null);
    
    // Smooth scroll - only when new messages are added, not when deleted
    useEffect(() => { 
        if (activeConv && activeConv.messages) {
            // Always scroll to bottom when:
            // 1. We just switched conversations (activeConversationId changed)
            // 2. New messages were added (not deleted)
            // 3. Extra menu was shown (like sending media)
            // 4. It's the first time viewing this conversation
            const messageCount = activeConv.messages.length;
            const conversationChanged = convId !== lastActiveConversationId;
            const shouldScroll = conversationChanged || 
                               messageCount > lastMessageCount || 
                               showExtrasMenu;
            
            if (shouldScroll) {
                setTimeout(() => {
                    chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); 
                }, 100);
            }
            
            // Update tracking state for next comparison
            setLastMessageCount(messageCount);
            setLastActiveConversationId(convId);
        } 
    }, [activeConv?.messages?.length, convId, showExtrasMenu, activeConv, lastActiveConversationId]);

    // Close Context Menu on click elsewhere
    useEffect(() => {
        const handleClick = () => setContextMenu({ ...contextMenu, visible: false });
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, [contextMenu]);

    // Handle scroll event to load more messages when reaching top
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop } = e.currentTarget;
        // When scrollTop is 0, we're at the top of the container
        if (scrollTop === 0 && !isLoadingMore) {
            // Load more messages logic will be implemented here
            // For now, we'll just prevent default behavior
            setIsLoadingMore(true);
            // Simulate loading delay
            setTimeout(() => {
                setIsLoadingMore(false);
            }, 1000);
        }
    };

    const handleSend = (text?: string, type = 'text') => {
        const msgText = text || input;
        if (!msgText.trim() && type === 'text') return;
        onSendMessage(msgText, type);
        setInput('');
        setShowExtrasMenu(false);
    };

    const handleContextMenu = (e: React.MouseEvent, msgId: number | string, isCurrentUser: boolean) => {
        e.preventDefault(); // Prevent default browser context menu
        setContextMenu({
            visible: true,
            x: e.pageX,
            y: e.pageY,
            msgId: msgId,
            isCurrentUser: isCurrentUser
        });
    };

    // 如果没有找到对话，显示提示
    if (!activeConv) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex items-center mb-6">
                    <button 
                        onClick={() => navigate('/messages')} 
                        className="flex items-center text-gray-600 hover:text-indigo-600 mb-4"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        <span>返回消息列表</span>
                    </button>
                </div>
                
                {isLoading ? (
                    // 加载状态
                    <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
                        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                        </div>
                        <p className="text-gray-500 font-medium">加载聊天记录中...</p>
                    </div>
                ) : (
                    // 未找到对话状态
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <MessageSquare className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-medium">未找到该对话</p>
                        <button 
                            onClick={() => navigate('/messages')} 
                            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            返回消息列表
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-120px)] flex flex-col bg-slate-50">
            {/* Chat Container */}
            <div className="flex-1 bg-white flex flex-col overflow-hidden">
                {/* Header - Fixed at top for mobile */}
                <div className="sticky top-0 z-30 bg-white border-b border-gray-100 flex items-center justify-between p-4 shadow-sm">
                    <button 
                        onClick={() => navigate('/messages')} 
                        className="flex items-center text-gray-600 hover:text-indigo-600"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    
                    <div className="flex-1 flex items-center justify-center mx-4">
                        <h1 className="text-lg font-bold text-gray-900 truncate">{activeConv.recruiter_name || '招聘者'}</h1>
                    </div>
                    
                    <div className="flex gap-2">
                        <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition"><Phone className="w-5 h-5"/></button>
                        <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition"><MoreVertical className="w-5 h-5"/></button>
                    </div>
                </div>
                {/* Messages List */}
                <div 
                    ref={chatContainerRef}
                    onScroll={handleScroll}
                    className="flex-1 bg-slate-100 p-4 overflow-y-auto custom-scrollbar relative"
                >
                    {isLoadingMore && (
                        <div className="text-center py-3 text-gray-500 text-xs">
                            加载更多消息...
                        </div>
                    )}
                    <div className="space-y-4">
                        {activeConv.messages?.map((msg: Message, index: number) => {
                            // 获取消息发送者的头像
                            const senderAvatar = msg.sender_avatar || '';
                            const isCurrentUser = msg.sender_id === currentUser?.id;
                            
                            // 检查是否需要显示日期分隔线
                            const prevMsg = activeConv.messages[index - 1];
                            const showDateDivider = index === 0 || 
                                (prevMsg && 
                                 new Date(msg.time).toDateString() !== new Date(prevMsg.time).toDateString());
                            
                            return (
                            <>
                                {/* Date Divider */}
                                {showDateDivider && (
                                    <div className="flex justify-center my-4">
                                        <span className="px-3 py-1 bg-gray-200/80 text-xs text-gray-500 rounded-full">
                                            {formatDateTime(msg.time, 'date')}
                                        </span>
                                    </div>
                                )}
                                
                                <div key={msg.id || index} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} ${msg.type === 'system' ? 'justify-center !my-4' : ''} items-end gap-2`}>
                                    {msg.type === 'system' ? (
                                        <span className="text-xs text-gray-500 bg-gray-200/80 px-3 py-1 rounded-full">{msg.text}</span>
                                    ) : (
                                        <> {/* 非当前用户消息显示头像 */}
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
                                                        {msg.sender_name?.charAt(0) || '招'}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                        <div 
                                            onContextMenu={(e) => handleContextMenu(e, msg.id, isCurrentUser)}
                                            className={`max-w-[75%] p-3.5 rounded-lg text-sm leading-relaxed cursor-pointer transition-all hover:opacity-95 ${isCurrentUser ? 'bg-green-500 text-white rounded-bl-lg' : 'bg-white text-gray-800 rounded-br-lg'}`}
                                        >
                                            <p className="whitespace-pre-wrap mb-1">{msg.text}</p>
                                            <div className="flex items-center justify-end gap-1">
                                                <span className={`text-[10px] ${isCurrentUser ? 'text-green-200' : 'text-gray-400'}`}>
                                                    {formatTime(msg.time)}
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
                                                {currentUser?.avatar && currentUser.avatar.trim() !== '' ? (
                                                    <img src={processAvatarUrl(currentUser.avatar)} alt="头像" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="w-full h-full flex items-center justify-center text-sm font-bold">
                                                        {currentUser?.name?.charAt(0) || '我'}
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

                {/* Context Menu */}
                {contextMenu.visible && (
                    <div 
                        className="fixed z-50 bg-white shadow-xl rounded-lg border border-gray-100 py-1 w-32 animate-in fade-in zoom-in-95 duration-100"
                        style={{ top: contextMenu.y, left: contextMenu.x }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {contextMenu.isCurrentUser && (
                            <button 
                                onClick={() => { 
                                    onDeleteMessage(convId, contextMenu.msgId); 
                                    setContextMenu({...contextMenu, visible: false}); 
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" /> 删除消息
                            </button>
                        )}
                        {!contextMenu.isCurrentUser && (
                            <button 
                                onClick={() => { setContextMenu({...contextMenu, visible: false}); }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2"
                            >
                                无法删除他人消息
                            </button>
                        )}
                    </div>
                )}

                {/* Input Area */}
                <div className="shrink-0 bg-white border-t border-gray-100 z-20">
                    {/* Text Input */}
                    <div className="p-3 flex items-center gap-2">
                        <button 
                            onClick={() => setShowExtrasMenu(!showExtrasMenu)} 
                            className={`p-2.5 rounded-full transition-colors ${showExtrasMenu ? 'bg-gray-200 text-gray-800' : 'text-gray-500 hover:bg-gray-100'}`}
                        >
                            <Plus className={`w-5 h-5 transition-transform duration-200 ${showExtrasMenu ? 'rotate-45' : ''}`} />
                        </button>
                        
                        {/* Quick Actions */}
                        <div className="hidden md:flex space-x-2">
                            <button onClick={() => handleSend("已向您发送了我的在线简历附件。", 'system')} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 text-xs rounded-full hover:bg-indigo-100 transition whitespace-nowrap">发送简历</button>
                            <button onClick={() => {
                                if (currentUser?.wechat) {
                                    handleSend(`我的微信号是: ${currentUser.wechat}，期待进一步沟通。`, 'text');
                                } else {
                                    if (window.confirm('您尚未添加微信号，请先到个人中心添加微信')) {
                                        navigate('/profile');
                                    }
                                }
                            }} className="px-3 py-1.5 bg-emerald-50 text-emerald-600 text-xs rounded-full hover:bg-emerald-100 transition whitespace-nowrap">交换微信</button>
                            <button onClick={() => handleSend("方便电话沟通吗？", 'text')} className="px-3 py-1.5 bg-blue-50 text-blue-600 text-xs rounded-full hover:bg-blue-100 transition whitespace-nowrap">约电话</button>
                        </div>
                        
                        <div className="flex-grow relative">
                            <textarea 
                                className="w-full p-3 bg-gray-100 border-0 rounded-full resize-none text-sm focus:ring-2 focus:ring-green-500 focus:bg-white transition-all max-h-32" 
                                rows={1} 
                                value={input} 
                                onChange={(e) => setInput(e.target.value)} 
                                onKeyDown={(e) => {if(e.key === 'Enter' && !e.shiftKey) {e.preventDefault(); handleSend();}}} 
                                placeholder="输入消息..." 
                            />
                        </div>
                        
                        <button 
                            onClick={() => handleSend()} 
                            disabled={!input.trim()}
                            className={`p-2.5 rounded-full transition ${input.trim() ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                        >
                            <SendIcon className="w-5 h-5"/>
                        </button>
                    </div>

                    {/* Extras Menu */}
                    {showExtrasMenu && (
                        <div className="p-4 border-t border-gray-100 grid grid-cols-4 gap-4 animate-in slide-in-from-bottom-4 duration-200 bg-white">
                            {
                                [
                                    {icon: ImageIcon, label: '图片', action: () => handleSend('[图片]', 'image')},
                                    {icon: Camera, label: '拍摄', action: () => {}},
                                    {icon: MapPin, label: '位置', action: () => handleSend('广东省深圳市...', 'location')},
                                ].map((item, i) => (
                                    <button key={i} onClick={item.action} className="flex flex-col items-center gap-2 p-2 hover:bg-gray-50 rounded-xl transition">
                                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
                                            <item.icon className="w-6 h-6"/>
                                        </div>
                                        <span className="text-xs text-gray-500">{item.label}</span>
                                    </button>
                                ))
                            }
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatRoomScreen;