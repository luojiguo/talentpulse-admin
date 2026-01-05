import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MessageSquare, Phone, MoreVertical, Send as SendIcon, Plus, Image as ImageIcon, Camera, MapPin, Trash2, ArrowLeft, FileText, X, Check, Download, Eye } from 'lucide-react';
import { Conversation, JobPosting, Message } from '@/types/types';
import { formatDateTime, formatTime } from '@/utils/dateUtils';
import { processAvatarUrl } from '@/components/AvatarUploadComponent';
import { resumeAPI, messageAPI, api } from '@/services/apiService';
import { message } from 'antd';

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

interface ChatRoomScreenProps {
    conversations: Conversation[];
    jobs: JobPosting[];
    activeConversationId: string | null;
    setActiveConversationId: (id: string) => void;
    onSendMessage: (text: string, type?: string, quotedMessage?: { id: string | number | null, text: string, senderName: string | null, type?: string }) => void;
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

    // Resume selection modal state
    const [showResumeModal, setShowResumeModal] = useState(false);
    const [userResumes, setUserResumes] = useState<any[]>([]);
    const [selectedResume, setSelectedResume] = useState<any | null>(null);
    const [isLoadingResumes, setIsLoadingResumes] = useState(false);

    // WeChat exchange state
    const [showWechatModal, setShowWechatModal] = useState(false);
    const [wechatInput, setWechatInput] = useState(currentUser?.wechat || '');
    const [isSendingRequest, setIsSendingRequest] = useState(false);
    const [exchangeRequestSent, setExchangeRequestSent] = useState(false);

    // Context Menu State
    const [contextMenu, setContextMenu] = useState<{
        visible: boolean,
        x: number,
        y: number,
        msgId: number | string | null,
        isCurrentUser: boolean,
        messageText: string,
        senderName: string,
        type?: string
    }>({
        visible: false,
        x: 0,
        y: 0,
        msgId: null,
        isCurrentUser: false,
        messageText: '',
        senderName: ''
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

    // Reply state
    const [replyingTo, setReplyingTo] = useState<{ id: string | number | null, text: string, senderName: string | null, type?: string }>({
        id: null, text: '', senderName: null, type: 'text'
    });

    const handleSend = (text?: string, type = 'text') => {
        const msgText = text || input;
        if (!msgText.trim() && type === 'text') return;
        
        // 发送消息时传递quotedMessage
        onSendMessage(msgText, type, replyingTo);
        
        // 发送后清除回复状态
        if (replyingTo.id) {
            setReplyingTo({ id: null, text: '', senderName: null, type: 'text' });
        }
        
        setInput('');
        setShowExtrasMenu(false);
    };

    const handleContextMenu = (e: React.MouseEvent, msgId: number | string, isCurrentUser: boolean, messageText: string, senderName: string, type?: string) => {
        e.preventDefault(); // Prevent default browser context menu
        setContextMenu({
            visible: true,
            x: e.pageX,
            y: e.pageY,
            msgId: msgId,
            isCurrentUser: isCurrentUser,
            messageText: messageText,
            senderName: senderName,
            type: type
        });
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

    // WeChat Exchange Functions - 重新构建逻辑
    const handleWechatExchange = () => {
        // 场景1: 检查用户是否已设置微信号
        if (!currentUser?.wechat || currentUser.wechat.trim() === '') {
            setWechatInput('');
            setShowWechatModal(true);
        } else {
            // 场景2: 已设置微信号，直接发送请求
            handleSendWechatRequest();
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
                // 保存成功后，自动发送请求
                await handleSendWechatRequest();
            } else {
                message.error('微信号更新失败');
            }
        } catch (error) {
            console.error('更新微信号失败:', error);
            message.error('更新微信号失败，请稍后重试');
        }
    };

    const handleSendWechatRequest = async () => {
        if (!convId || !currentUser) return;

        setIsSendingRequest(true);
        try {
            const conversation = conversations.find((c: Conversation) => c.id.toString() === convId.toString());
            if (!conversation) {
                message.error('找不到当前对话');
                return;
            }

            const receiverId = conversation.recruiterUserId || conversation.recruiterId;

            await onSendMessage('', 'exchange_request');
            setExchangeRequestSent(true);
            message.success('微信交换请求已发送');
        } catch (error) {
            console.error('发送微信交换请求失败:', error);
            message.error('发送请求失败，请稍后重试');
        } finally {
            setIsSendingRequest(false);
        }
    };

    const handleAcceptWechatExchange = async (messageId: number | string) => {
        try {
            // Call API to accept wechat exchange request
            await messageAPI.sendMessage({
                conversationId: convId,
                senderId: currentUser?.id || '',
                text: '',
                type: 'exchange_request',
            });
            message.success('已同意微信交换');
            // Refresh conversation to get updated messages
            window.dispatchEvent(new CustomEvent('refreshConversation', { detail: { conversationId: convId } }));
        } catch (error) {
            console.error('同意微信交换失败:', error);
            message.error('操作失败，请稍后重试');
        }
    };

    const handleRejectWechatExchange = async (messageId: number | string) => {
        try {
            // Call API to reject wechat exchange request
            await messageAPI.sendMessage({
                conversationId: convId,
                senderId: currentUser?.id || '',
                text: '',
                type: 'exchange_request',
            });
            message.success('已拒绝微信交换');
            // Refresh conversation to get updated messages
            window.dispatchEvent(new CustomEvent('refreshConversation', { detail: { conversationId: convId } }));
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

    // Handle send resume button click
    const handleSendResumeClick = () => {
        setSelectedResume(null);
        loadUserResumes();
        setShowResumeModal(true);
    };

    // Send selected resume file
    const handleConfirmSendResume = async () => {
        if (!selectedResume || !convId || !currentUser) {
            message.error('请选择一份简历');
            return;
        }

        try {
            const conversation = conversations.find((c: Conversation) => c.id.toString() === convId.toString());
            if (!conversation) {
                message.error('找不到当前对话');
                return;
            }

            const receiverId = conversation.recruiterUserId || conversation.recruiterId;

            // Step 1: Download the resume file from server (with auth header)
            const hideLoading = message.loading('正在准备简历文件...', 0);
            
            // Get auth token
            const token = localStorage.getItem('token');
            
            // Get the resume file with auth
            const resumeResponse = await fetch(`/api/resumes/file/${selectedResume.id}`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            
            if (!resumeResponse.ok) {
                hideLoading();
                throw new Error(`下载简历文件失败: ${resumeResponse.status}`);
            }
            
            // Convert to blob and then to File object
            const blob = await resumeResponse.blob();
            
            // Use the original filename from selectedResume (already correct in Chinese)
            // Avoid encoding issues from Content-Disposition header parsing
            let filename = selectedResume.resume_file_name || selectedResume.original_name || selectedResume.file_name || `简历_${selectedResume.id}`;
            
            // Fix filename encoding if needed
            filename = fixFilenameEncoding(filename);
            
            const file = new File([blob], filename, { type: blob.type || 'application/octet-stream' });
            console.log('简历文件准备完成:', { filename, size: file.size });

            // Step 2: Upload the file to chat
            const response = await messageAPI.uploadResumeFile(
                convId,
                currentUser.id,
                receiverId,
                file
            );

            hideLoading();
            
            if (response.data && (response.data.status === 'success' || response.data.success)) {
                message.success('简历发送成功');
                setShowResumeModal(false);

                // Notify parent to refresh messages
                if (convId) {
                    setTimeout(() => {
                        window.dispatchEvent(new CustomEvent('refreshConversation', { detail: { conversationId: convId } }));
                    }, 500);
                }
            } else {
                message.error(response.data?.message || '发送失败，请稍后重试');
            }
        } catch (error: any) {
            console.error('发送简历失败:', error);
            message.error(error.message || '发送简历失败，请稍后重试');
        }
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
                            onContextMenu={(e) => handleContextMenu(e, msg.id, isCurrentUser, msg.text, msg.sender_name, msg.type)}
                            className={`max-w-[75%] p-3.5 rounded-lg text-sm leading-relaxed cursor-pointer transition-all hover:opacity-95 ${isCurrentUser ? 'bg-green-500 text-white rounded-bl-lg' : 'bg-white text-gray-800 rounded-br-lg'}`}
                        >
                                            {/* 文本消息 - 支持现代化引用式回复 */}
                                            {msg.type === 'text' && (
                                                <div className="space-y-2">
                                                    {/* 引用消息部分 - 微信风格引用样式 */}
                                                    {msg.quoted_message ? (
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
                                                    ) : msg.text?.startsWith('回复 ') ? (
                                                        // 兼容旧格式的回复消息
                                                        <div className="mb-2 text-sm">
                                                            <span className="font-medium text-gray-600">
                                                                {msg.text.split('\n')[0].replace('回复 ', '').split(':')[0]}:
                                                            </span>
                                                            <span className="text-gray-500 ml-1">
                                                                {msg.text.split('\n')[0].split(':')[1] || msg.text.split('\n')[1]}
                                                            </span>
                                                        </div>
                                                    ) : null}
                                                    {/* 实际消息内容 */}
                                                    <p className="whitespace-pre-wrap mb-1">{msg.text.split('\n\n').slice(-1)[0]}</p>
                                                </div>
                                            )}
                                            
                                            {/* WeChat Exchange Request */}
                                            {msg.type === 'exchange_request' && (
                                                <div className="wechat-exchange-card p-3 rounded-lg bg-white/80">
                                                    {msg.status === 'pending' ? (
                                                        <>
                                                            <p className="text-sm mb-3">{isCurrentUser ? '您已发送微信交换请求，等待对方回应' : '对方想与您交换微信号'}</p>
                                                            {!isCurrentUser && (
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        onClick={() => handleAcceptWechatExchange(msg.id)}
                                                                        className="flex-1 px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-md hover:bg-indigo-700 transition-colors"
                                                                    >
                                                                        同意交换
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleRejectWechatExchange(msg.id)}
                                                                        className="flex-1 px-3 py-1.5 bg-gray-200 text-gray-700 text-xs rounded-md hover:bg-gray-300 transition-colors"
                                                                    >
                                                                        拒绝
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </>
                                                    ) : msg.status === 'accepted' ? (
                                                        <div className="space-y-2">
                                                            <p className="text-sm text-gray-600">微信交换已完成</p>
                                                            <div className="flex items-center justify-between p-2 bg-gray-100 rounded-md">
                                                                <span className="text-sm font-medium">{isCurrentUser ? '对方微信号' : '我的微信号'}</span>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm font-mono">{isCurrentUser ? (msg.sender_wechat || '未获取') : (msg.receiver_wechat || currentUser?.wechat)}</span>
                                                                    <button
                                                                        onClick={() => copyWechatToClipboard(isCurrentUser ? (msg.sender_wechat || '') : (msg.receiver_wechat || currentUser?.wechat || ''))}
                                                                        className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors"
                                                                        title="复制微信号"
                                                                    >
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-2M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                                                        </svg>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : msg.status === 'rejected' ? (
                                                        <p className="text-sm text-gray-600">{isCurrentUser ? '对方已拒绝微信交换请求' : '您已拒绝微信交换请求'}</p>
                                                    ) : (
                                                        <p className="text-sm text-gray-600">微信交换请求</p>
                                                    )}
                                                </div>
                                            )}
                                            
                                            {/* 文件消息 - 包括简历 */}
                                            {(msg.type === 'file' || (msg.text && (msg.text.includes('[简历]') || msg.text.includes('[文件]')))) && msg.file_url && (
                                                <div className="mb-1">
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
                                                    {/* 文件图标和信息 */}
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <FileText className={`w-5 h-5 ${isCurrentUser ? 'text-green-200' : 'text-gray-400'}`} />
                                                        <div>
                                                            <p className="font-medium">{msg.file_name || msg.text.replace('[简历] ', '').replace('[文件] ', '')}</p>
                                                            {msg.file_size && (
                                                                <p className={`text-xs ${isCurrentUser ? 'text-green-200' : 'text-gray-500'}`}>
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
                                                            className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${isCurrentUser ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-blue-100 hover:bg-blue-200 text-blue-800'}`}
                                                        >
                                                            <Eye className="w-3.5 h-3.5" />
                                                            查看
                                                        </button>
                                                        {/* 下载按钮 */}
                                                        <a 
                                                            href={msg.file_url} 
                                                            download={msg.file_name}
                                                            className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${isCurrentUser ? 'bg-green-700 hover:bg-green-800 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
                                                        >
                                                            <Download className="w-3.5 h-3.5" />
                                                            下载
                                                        </a>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {/* 图片消息 */}
                                            {msg.type === 'image' && msg.file_url && (
                                                <div className="mb-1">
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
                                                    <img 
                                                        src={msg.file_url} 
                                                        alt={msg.file_name || '图片'} 
                                                        className="max-w-full rounded-md mb-2 cursor-pointer hover:opacity-90 transition-opacity"
                                                        onClick={() => window.open(msg.file_url, '_blank')}
                                                    />
                                                    <a 
                                                        href={msg.file_url} 
                                                        download={msg.file_name}
                                                        className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${isCurrentUser ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-blue-100 hover:bg-blue-200 text-blue-800'}`}
                                                    >
                                                        <Download className="w-3.5 h-3.5" />
                                                        下载图片
                                                    </a>
                                                </div>
                                            )}
                                            
                                            {/* 消息时间和状态 */}
                                            <div className="flex items-center justify-end gap-1 mt-2">
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
                        <button 
                            onClick={() => { 
                                setReplyingTo({
                                    id: contextMenu.msgId,
                                    text: contextMenu.messageText,
                                    senderName: contextMenu.senderName,
                                    type: contextMenu.type
                                });
                                setContextMenu({...contextMenu, visible: false});
                                // 聚焦到输入框
                                const textarea = document.querySelector('textarea');
                                textarea?.focus();
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" /> 回复消息
                        </button>
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
                    </div>
                )}

                {/* Input Area */}
                <div className="shrink-0 bg-white border-t border-gray-100 z-20">
                    {/* Reply Indicator */}
                    {replyingTo.id && (
                        <div className="px-4 py-2 bg-blue-50 border-b border-blue-100">
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
                            <button onClick={handleSendResumeClick} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 text-xs rounded-full hover:bg-indigo-100 transition whitespace-nowrap">发送简历</button>
                            <button 
                                onClick={handleWechatExchange}
                                className={`px-3 py-1.5 text-xs rounded-full transition whitespace-nowrap ${exchangeRequestSent ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                                disabled={exchangeRequestSent}
                            >
                                {exchangeRequestSent ? '请求已发送' : '交换微信'}
                            </button>
                            <button onClick={() => handleSend("方便电话沟通吗？", 'text')} className="px-3 py-1.5 bg-blue-50 text-blue-600 text-xs rounded-full hover:bg-blue-100 transition whitespace-nowrap">约电话</button>
                        </div>
                        
                        <div className="flex-grow relative">
                            <textarea 
                                className={`w-full p-3 resize-none text-sm focus:ring-2 focus:ring-green-500 transition-all max-h-32 ${replyingTo.id ? 'border-2 border-blue-400 bg-white rounded-xl' : 'bg-gray-100 border-0 rounded-full focus:bg-white'}`} 
                                rows={1} 
                                value={input} 
                                onChange={(e) => setInput(e.target.value)} 
                                onKeyDown={(e) => {if(e.key === 'Enter' && !e.shiftKey) {e.preventDefault(); handleSend();}}} 
                                placeholder={replyingTo.id ? `回复 ${replyingTo.senderName || '对方'}...` : "输入消息..."} 
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

                {/* Resume Selection Modal */}
                {showResumeModal && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden animate-in zoom-in-95 duration-200">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-indigo-600" />
                                    <h3 className="font-semibold text-gray-900">选择要发送的简历</h3>
                                </div>
                                <button
                                    onClick={() => setShowResumeModal(false)}
                                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="p-4 overflow-y-auto max-h-[60vh]">
                                {isLoadingResumes ? (
                                    <div className="flex flex-col items-center justify-center py-8">
                                        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
                                        <p className="text-sm text-gray-500">加载中...</p>
                                    </div>
                                ) : userResumes.length === 0 ? (
                                    <div className="text-center py-8">
                                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500 text-sm mb-3">您还没有上传任何简历</p>
                                        <button
                                            onClick={() => {
                                                setShowResumeModal(false);
                                                navigate('/resume-editor');
                                            }}
                                            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
                                        >
                                            去上传简历
                                        </button>
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
                                                        className={`w-full p-4 rounded-xl border-2 transition-all text-left ${isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                                                    >
                                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'}`}>
                                                                {isSelected && <Check className="w-4 h-4 text-white" />}
                                                            </div>
                                                            <div className="text-indigo-600 flex-shrink-0">
                                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1-3a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                                                </svg>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-gray-900 truncate">{filename}</p>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <span className="text-xs text-gray-500">
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
                            <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                                <button
                                    onClick={handleConfirmSendResume}
                                    disabled={!selectedResume}
                                    className={`w-full py-2.5 rounded-xl font-medium transition-all ${selectedResume ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                                >
                                    {selectedResume ? `发送简历` : '请选择一份简历'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* WeChat Update Modal */}
                {showWechatModal && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                    <h3 className="font-semibold text-gray-900">完善您的微信号</h3>
                                </div>
                                <button
                                    onClick={() => setShowWechatModal(false)}
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
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowWechatModal(false)}
                                        className="flex-1 py-2.5 px-4 rounded-xl font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                                    >
                                        取消
                                    </button>
                                    <button
                                        onClick={handleUpdateWechat}
                                        disabled={!wechatInput.trim()}
                                        className={`flex-1 py-2.5 px-4 rounded-xl font-medium transition-all ${wechatInput.trim() ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                                    >
                                        保存并继续
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatRoomScreen;