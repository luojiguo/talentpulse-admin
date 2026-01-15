import React, { useState, useMemo, useRef, useEffect } from 'react';
import { MessageSquare, User, Mic2, Send as SendIcon, Trash2, MoreVertical, Edit2, Sparkles, Brain, Target, Rocket } from 'lucide-react';
import { aiSessionAPI } from '@/services/apiService';
import { chatWithCandidateAI } from '@/services/aiService';

// Types for AI Chat persistence
interface AIChatSession {
    id: string;
    title: string;
    timestamp: number;
    messages: { role: string, text: string }[];
}

const AIChatScreen = ({ userProfile, userResume, currentUser }: any) => {
    // Session State
    const [sessions, setSessions] = useState<AIChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isSessionsLoading, setIsSessionsLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [input, setInput] = useState('');

    // Menu and Rename State
    const [openMenuSessionId, setOpenMenuSessionId] = useState<string | null>(null);
    const [isRenaming, setIsRenaming] = useState<string | null>(null);
    const [renameInput, setRenameInput] = useState('');

    // Initialize/Load Sessions from Backend API
    useEffect(() => {
        const loadSessions = async () => {
            if (!currentUser?.id) return;

            try {
                setIsSessionsLoading(true);
                const response = await aiSessionAPI.getUserAISessions(currentUser.id);

                // 处理响应格式：可能是 { status: 'success', data: [...] } 或直接是数组
                const sessionsData = response?.data || response;

                if (sessionsData && Array.isArray(sessionsData)) {
                    const formattedSessions: AIChatSession[] = sessionsData.map((session: any) => ({
                        id: session.id?.toString() || String(session.id),
                        title: session.title || '新对话',
                        timestamp: new Date(session.updated_at || session.updatedAt || Date.now()).getTime(),
                        messages: (typeof session.messages === 'string' ? JSON.parse(session.messages) : session.messages) || []
                    }));
                    setSessions(formattedSessions);

                    if (formattedSessions.length > 0) {
                        // 如果有历史回复，默认不选中第一个，除非用户点击
                        // 这里按照用户需求“默认0条”，如果想看到会话列表但没选中任何一个，就设为null
                        setCurrentSessionId(null);
                    }
                }
            } catch (error) {
                console.error("Failed to load AI sessions:", error);
            } finally {
                setIsSessionsLoading(false);
            }
        };

        loadSessions();
    }, [currentUser]);

    const startNewChat = async () => {
        if (!currentUser?.id) return;

        try {
            const initialMsg = { role: 'ai', content: `你好，${userProfile?.name || '用户'}！我是您的AI求职助手。` };

            const response = await aiSessionAPI.createAISession({
                userId: currentUser.id,
                title: '新对话',
                sessionType: 'general',
                messages: [initialMsg]
            });

            // 处理响应格式：可能是 { status: 'success', data: {...} } 或直接是对象
            const sessionData = response?.data || response;

            if (sessionData && sessionData.id) {
                const newSession: AIChatSession = {
                    id: sessionData.id?.toString() || String(sessionData.id),
                    title: sessionData.title || '新对话',
                    timestamp: new Date(sessionData.updated_at || sessionData.updatedAt || Date.now()).getTime(),
                    messages: (typeof sessionData.messages === 'string' ? JSON.parse(sessionData.messages) : sessionData.messages) || [initialMsg]
                };

                setSessions(prev => [newSession, ...prev]);
                setCurrentSessionId(newSession.id);
            } else {
                console.error("Invalid response format:", response);
            }
        } catch (error) {
            console.error("Failed to create new AI session:", error);
        }
    };

    const currentSession = useMemo(() =>
        sessions.find(s => s.id === currentSessionId) || { id: '', title: '', timestamp: 0, messages: [] }
        , [sessions, currentSessionId]);

    // 生成会话标题的函数
    const generateSessionTitle = (prompt: string): string => {
        // 移除常见的问候语和开场白
        const cleanedPrompt = prompt.replace(/^(你好|您好|请问|我想|我要|能不能|能不能够|可以|帮我|请|麻烦|关于|对于|如何|怎样|怎么|什么|哪里|何时|为什么|)\s*/i, '');

        // 提取关键词，限制长度
        const maxLength = 20;
        if (cleanedPrompt.length <= maxLength) {
            return cleanedPrompt;
        }

        // 按标点符号分割，取前半部分
        const punctuationRegex = /[，。！？；：,.;:!?]/;
        const parts = cleanedPrompt.split(punctuationRegex);
        if (parts[0].length <= maxLength) {
            return parts[0];
        }

        // 直接截取并添加省略号
        return cleanedPrompt.substring(0, maxLength - 1) + '…';
    };

    const callGeminiAPI = async (prompt: string) => {
        if (!prompt.trim() || !currentSessionId || !currentUser?.id) return;

        const newUserMsg = { role: 'user', text: prompt };

        // 生成新标题（如果当前是默认标题）
        let newTitle = '新对话';
        if ('title' in currentSession) {
            newTitle = currentSession.title;
        }
        if (newTitle === '新对话') {
            newTitle = generateSessionTitle(prompt);
        }

        // Optimistic UI Update
        const updatedSession: AIChatSession = {
            ...currentSession as AIChatSession,
            id: currentSessionId,
            title: newTitle,
            messages: [...currentSession.messages, newUserMsg],
            timestamp: (currentSession as AIChatSession).timestamp || Date.now()
        };

        setSessions(prev => prev.map(s => s.id === currentSessionId ? updatedSession : s));
        setInput('');
        setIsLoading(true);

        try {
            // Prepare user context for AI service, with safe defaults for undefined values
            const userContext = `用户个人信息：${userProfile.name || '未知'}, 所在城市: ${userProfile.city || '未知'}, 期望薪资: ${userProfile.expectedSalary || '未知'}, 状态: ${userProfile.jobStatus || '未知'}. 核心技能: ${(userResume?.skills || []).join(', ') || '未知'}.`;

            // Call actual AI service
            const aiResponseText = await chatWithCandidateAI(prompt, userContext);

            // Create AI response object
            const aiResponse = {
                role: 'ai',
                text: aiResponseText
            };

            // Update session with AI response
            const finalSession = {
                ...updatedSession,
                messages: [...updatedSession.messages, aiResponse]
            };

            // Update the session in the database with the new title and messages
            await aiSessionAPI.updateAISession(currentSessionId, finalSession.messages, finalSession.title);

            // Update state with final session
            const completeFinalSession: AIChatSession = {
                ...finalSession,
                id: currentSessionId,
                timestamp: finalSession.timestamp || Date.now()
            };
            setSessions(prev => prev.map(s => s.id === currentSessionId ? completeFinalSession : s));
        } catch (error) {
            console.error("Failed to get AI response:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Track the last message count to determine if we should scroll
    const [lastMessageCount, setLastMessageCount] = useState(0);

    // Scroll to bottom when messages change
    useEffect(() => {
        // Only scroll to bottom if new messages were added (not deleted)
        // or we're loading (indicating a new message is being generated)
        const messageCount = currentSession.messages.length;
        const shouldScroll = messageCount > lastMessageCount || isLoading;

        if (shouldScroll) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }

        // Update last message count for next comparison
        setLastMessageCount(messageCount);
    }, [currentSession.messages, isLoading]);

    // Delete a chat session
    const deleteSession = async (sessionId: string) => {
        if (!currentUser?.id) return;

        try {
            await aiSessionAPI.deleteAISession(sessionId);

            // Update state to remove the deleted session
            const updatedSessions = sessions.filter(session => session.id !== sessionId);
            setSessions(updatedSessions);

            // If the deleted session was the current one, switch to another session or start a new one
            if (currentSessionId === sessionId) {
                if (updatedSessions.length > 0) {
                    setCurrentSessionId(updatedSessions[0].id);
                } else {
                    startNewChat();
                }
            }

            // Close the menu after deletion
            setOpenMenuSessionId(null);
        } catch (error) {
            console.error("Failed to delete AI session:", error);
        }
    };

    // Toggle the menu for a session
    const toggleMenu = (sessionId: string) => {
        setOpenMenuSessionId(openMenuSessionId === sessionId ? null : sessionId);
    };

    // Start renaming a session
    const startRename = (sessionId: string) => {
        const session = sessions.find(s => s.id === sessionId);
        if (session) {
            setRenameInput(session.title);
            setIsRenaming(sessionId);
            setOpenMenuSessionId(null); // Close the menu
        }
    };

    // Cancel renaming
    const cancelRename = () => {
        setIsRenaming(null);
        setRenameInput('');
    };

    // Save the new name
    const saveRename = async () => {
        if (!isRenaming || !renameInput.trim() || !currentUser?.id) {
            cancelRename();
            return;
        }

        try {
            // Update the session title in the database
            const updatedSession = sessions.find(s => s.id === isRenaming);
            if (updatedSession) {
                const finalSession = {
                    ...updatedSession,
                    title: renameInput.trim()
                };

                // Update state optimistically
                setSessions(prev => prev.map(s => s.id === isRenaming ? finalSession : s));

                // Call API to update the session
                await aiSessionAPI.updateAISession(isRenaming, finalSession.messages);
            }

            // Close the rename input
            cancelRename();
        } catch (error) {
            console.error("Failed to rename AI session:", error);
            cancelRename();
        }
    };

    return (
        <div className="max-w-7xl mx-auto h-[calc(100vh-80px)] flex flex-col py-6 px-4 animate-in fade-in duration-700">
            <div className="flex-1 bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl shadow-brand-100/20 dark:shadow-none border border-white/20 dark:border-slate-800 overflow-hidden flex transition-all duration-500">
                {/* Sidebar */}
                {isSidebarOpen && (
                    <div className="w-80 border-r border-brand-50 dark:border-slate-800 flex flex-col bg-blue-50/50 dark:bg-slate-900/40 backdrop-blur-xl">
                        <div className="p-8 border-b border-brand-50 dark:border-slate-800">
                            <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                                <div className="w-12 h-12 bg-brand-500 rounded-2xl flex items-center justify-center shadow-xl shadow-brand-200 dark:shadow-none transform hover:rotate-12 transition-transform duration-500" style={{ backgroundColor: '#007AFF' }}>
                                    <Sparkles className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <div className="text-xs font-black text-brand-500 uppercase tracking-widest mb-0.5">TalentPulse</div>
                                    AI 助手
                                </div>
                            </h2>
                        </div>

                        <div className="p-6">
                            <button
                                onClick={startNewChat}
                                className="w-full py-4 bg-brand-500 text-white font-black rounded-2xl hover:bg-brand-600 hover:shadow-xl hover:shadow-brand-200 dark:hover:shadow-none transition-all duration-300 flex items-center justify-center gap-3 active:scale-[0.98] group"
                                style={{ backgroundColor: '#007AFF' }}
                            >
                                <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center group-hover:rotate-90 transition-transform duration-500">
                                    <MessageSquare className="w-4 h-4" />
                                </div>
                                开启新对话
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3 custom-scrollbar">
                            {isSessionsLoading ? (
                                <div className="text-center py-20 text-slate-400">
                                    <div className="inline-block w-8 h-8 border-4 border-brand-100 border-t-brand-500 rounded-full animate-spin mb-4"></div>
                                    <p className="text-sm font-bold tracking-wide">加载对话中...</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {sessions.length === 0 ? (
                                        <div className="text-center py-20 px-6">
                                            <div className="w-16 h-16 bg-brand-50 dark:bg-slate-800/50 rounded-[24px] flex items-center justify-center mx-auto mb-4 border border-brand-100 dark:border-slate-700">
                                                <Brain className="w-8 h-8 text-brand-300" />
                                            </div>
                                            <p className="text-sm text-slate-400 font-bold">准备好开始了吗？</p>
                                        </div>
                                    ) : (
                                        sessions.map(session => (
                                            <div
                                                key={session.id}
                                                className={`group p-4 rounded-2xl cursor-pointer transition-all duration-500 relative overflow-hidden ${currentSessionId === session.id
                                                    ? 'bg-white dark:bg-slate-800 shadow-xl shadow-brand-100/50 dark:shadow-none border border-brand-100 dark:border-slate-700'
                                                    : 'hover:bg-white/80 dark:hover:bg-slate-800/80 hover:shadow-lg hover:shadow-brand-50/50 dark:hover:shadow-none border border-transparent hover:border-brand-50 dark:hover:border-slate-700'}`}
                                            >
                                                {currentSessionId === session.id && (
                                                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-brand-500"></div>
                                                )}

                                                {isRenaming === session.id ? (
                                                    // Rename Input
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="text"
                                                            value={renameInput}
                                                            onChange={(e) => setRenameInput(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    saveRename();
                                                                } else if (e.key === 'Escape') {
                                                                    cancelRename();
                                                                }
                                                            }}
                                                            className="flex-1 px-4 py-2 text-sm bg-white dark:bg-slate-900 border-2 border-brand-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-brand-400 transition-all font-bold"
                                                            autoFocus
                                                        />
                                                    </div>
                                                ) : (
                                                    // Session Info with Menu Button
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div onClick={() => setCurrentSessionId(session.id)} className="flex-1 min-w-0">
                                                            <h3 className={`font-black text-sm truncate transition-colors ${currentSessionId === session.id ? 'text-brand-600 dark:text-brand-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                                                {session.title}
                                                            </h3>
                                                            <div className="flex items-center gap-2 mt-1.5">
                                                                <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-wider">
                                                                    <Target className="w-3 h-3" />
                                                                    {new Date(session.timestamp).toLocaleDateString()}
                                                                </div>
                                                                {session.messages.length > 0 && (
                                                                    <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700"></span>
                                                                )}
                                                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-black">
                                                                    {session.messages.length} 条消息
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleMenu(session.id);
                                                                }}
                                                                className={`p-2 rounded-xl transition-all ${openMenuSessionId === session.id ? 'bg-brand-100 text-brand-600' : 'text-slate-300 hover:text-brand-500 hover:bg-brand-50 opacity-0 group-hover:opacity-100'}`}
                                                            >
                                                                <MoreVertical className="w-4 h-4" />
                                                            </button>

                                                            {/* Dropdown Menu */}
                                                            {openMenuSessionId === session.id && (
                                                                <div className="absolute right-2 top-14 w-40 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-brand-50 dark:border-slate-700 z-50 py-1.5 overflow-hidden animate-in fade-in zoom-in duration-300 backdrop-blur-xl">
                                                                    <button
                                                                        onClick={() => startRename(session.id)}
                                                                        className="w-full text-left px-4 py-3 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-brand-50 dark:hover:bg-slate-700/50 flex items-center gap-3 transition-colors"
                                                                    >
                                                                        <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center">
                                                                            <Edit2 className="w-4 h-4 text-brand-500" />
                                                                        </div>
                                                                        <span>重命名</span>
                                                                    </button>
                                                                    <button
                                                                        onClick={() => deleteSession(session.id)}
                                                                        className="w-full text-left px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-colors"
                                                                    >
                                                                        <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
                                                                            <Trash2 className="w-4 h-4 text-red-500" />
                                                                        </div>
                                                                        <span>删除对话</span>
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 relative">
                    {!currentSessionId ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-1000">
                            <div className="relative mb-12">
                                <div className="absolute inset-0 bg-brand-200 dark:bg-brand-500/20 blur-[100px] rounded-full opacity-50 animate-pulse"></div>
                                <div className="relative w-40 h-40 bg-gradient-to-br from-brand-400 to-brand-600 rounded-[48px] flex items-center justify-center shadow-2xl shadow-brand-200 dark:shadow-none transform hover:scale-105 transition-transform duration-700 group">
                                    <Sparkles className="w-20 h-20 text-white group-hover:rotate-12 transition-transform duration-500" />
                                </div>
                            </div>
                            <h2 className="text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">
                                开启您的<span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-brand-400">智能职场</span>之旅
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 max-w-lg text-xl font-medium leading-relaxed mb-12">
                                我可以帮您修改简历、模拟面试、分析岗位匹配度，或者仅仅是聊聊职业规划。
                            </p>
                            <div className="grid grid-cols-2 gap-6 w-full max-w-2xl">
                                {[
                                    { icon: Rocket, label: '修改简历建议', color: 'text-brand-600', bg: 'bg-brand-50 dark:bg-brand-900/20' },
                                    { icon: Target, label: '面试问题模拟', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                                    { icon: Brain, label: '职业生涯规划', color: 'text-sky-600', bg: 'bg-sky-50 dark:bg-sky-900/20' },
                                    { icon: Target, label: '薪资谈判策略', color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' }
                                ].map((item, i) => (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            startNewChat();
                                            setTimeout(() => setInput(`我想咨询关于“${item.label}”的问题`), 500);
                                        }}
                                        className="p-6 rounded-[24px] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-brand-200 dark:hover:border-brand-500/50 hover:shadow-xl hover:shadow-brand-50 dark:hover:shadow-none transition-all duration-300 text-left group active:scale-[0.98]"
                                    >
                                        <div className={`w-12 h-12 ${item.bg} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                            <item.icon className={`w-6 h-6 ${item.color}`} />
                                        </div>
                                        <div className="font-black text-slate-800 dark:text-white text-lg">{item.label}</div>
                                        <div className="text-sm text-slate-400 mt-1 font-medium">点击快速开始对话</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Chat Header */}
                            <div className="px-8 py-6 border-b border-brand-50 dark:border-slate-800 flex items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-brand-50 dark:bg-brand-900/30 rounded-2xl flex items-center justify-center border border-brand-100 dark:border-slate-800">
                                        <Sparkles className="w-6 h-6 text-brand-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-800 dark:text-white text-lg tracking-tight">
                                            {currentSession.title}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" style={{ backgroundColor: '#22c55e' }}></div>
                                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">AI 助手在线</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-slate-50/30 dark:bg-slate-900/20">
                                {currentSession.messages.map((msg: any, idx: number) => (
                                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-4 duration-500`}>
                                        <div className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                            <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-lg ${msg.role === 'user'
                                                ? 'bg-slate-800 dark:bg-slate-700 text-white'
                                                : 'bg-white dark:bg-slate-800 border border-brand-100 dark:border-slate-700 text-brand-500'
                                                }`}>
                                                {msg.role === 'user' ? <User className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                                            </div>
                                            <div className={`p-5 rounded-[24px] shadow-sm ${msg.role === 'user'
                                                ? 'bg-brand-500 text-white rounded-tr-none font-medium'
                                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-brand-50 dark:border-slate-700 rounded-tl-none font-medium leading-relaxed'
                                                }`}>
                                                {msg.text || msg.content}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="flex justify-start animate-in fade-in duration-300">
                                        <div className="flex gap-4 max-w-[85%]">
                                            <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 border border-brand-100 dark:border-slate-700 flex items-center justify-center shadow-lg">
                                                <div className="w-5 h-5 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin"></div>
                                            </div>
                                            <div className="bg-white dark:bg-slate-800 p-5 rounded-[24px] rounded-tl-none border border-brand-50 dark:border-slate-700 shadow-sm flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce"></span>
                                                <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                                <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className="p-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-brand-50 dark:border-slate-800">
                                <div className="max-w-4xl mx-auto relative group">
                                    <div className="absolute inset-0 bg-brand-400/10 blur-xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity duration-500"></div>
                                    <div className="relative flex items-end gap-4 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-[32px] border-2 border-transparent focus-within:border-brand-300 dark:focus-within:border-brand-500/50 transition-all duration-500">
                                        <button className="p-4 text-slate-400 hover:text-brand-500 hover:bg-white dark:hover:bg-slate-700 rounded-2xl transition-all active:scale-90">
                                            <Mic2 className="w-6 h-6" />
                                        </button>
                                        <textarea
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    callGeminiAPI(input);
                                                }
                                            }}
                                            placeholder="问问 AI：如何提升我的简历竞争力？"
                                            className="flex-1 bg-transparent border-none focus:ring-0 text-slate-700 dark:text-white placeholder:text-slate-400 py-4 resize-none min-h-[56px] max-h-[200px] font-medium"
                                            rows={1}
                                        />
                                        <button
                                            onClick={() => callGeminiAPI(input)}
                                            disabled={!input.trim() || isLoading}
                                            className={`p-4 rounded-[20px] transition-all duration-500 active:scale-90 ${input.trim() && !isLoading
                                                ? 'bg-brand-500 text-white shadow-xl shadow-brand-200 dark:shadow-none hover:bg-brand-600'
                                                : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                                                }`}
                                            style={{ backgroundColor: input.trim() && !isLoading ? '#007AFF' : undefined }}
                                        >
                                            <SendIcon className="w-6 h-6" />
                                        </button>
                                    </div>
                                    <p className="mt-3 text-center text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                        AI 可能会产生错误信息，请核实重要内容
                                    </p>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AIChatScreen;