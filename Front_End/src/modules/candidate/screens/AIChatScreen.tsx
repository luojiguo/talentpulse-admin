import React, { useState, useMemo, useRef, useEffect } from 'react';
import { MessageSquare, User, Mic2, Send as SendIcon, Trash2, MoreVertical, Edit2 } from 'lucide-react';
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
                        setCurrentSessionId(formattedSessions[0].id);
                    } else {
                        startNewChat();
                    }
                } else {
                    startNewChat();
                }
            } catch (error) {
                console.error("Failed to load AI sessions:", error);
                startNewChat();
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
        sessions.find(s => s.id === currentSessionId) || { messages: [] }
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
        <div className="max-w-7xl mx-auto h-[calc(100vh-80px)] flex flex-col py-6 px-4">
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex">
                {/* Sidebar */}
                {isSidebarOpen && (
                    <div className="w-64 border-r border-gray-100 flex flex-col bg-gray-50">
                        <div className="p-4 border-b">
                            <h2 className="text-lg font-bold text-gray-900">AI 求职助手</h2>
                        </div>
                        
                        <div className="p-4">
                            <button 
                                onClick={startNewChat}
                                className="w-full py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition shadow-sm flex items-center justify-center gap-2"
                            >
                                <MessageSquare className="w-4 h-4" />
                                新对话
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-2">
                            {isSessionsLoading ? (
                                <div className="text-center py-8 text-gray-500">
                                    <div className="inline-block w-4 h-4 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-2"></div>
                                    <p className="text-sm">加载对话...</p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {sessions.map(session => (
                                        <div 
                                            key={session.id}
                                            className={`p-3 rounded-lg cursor-pointer transition-colors ${currentSessionId === session.id ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : 'hover:bg-gray-100'}`}
                                        >
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
                                                        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                        autoFocus
                                                    />
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={saveRename}
                                                            className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-md"
                                                            title="保存"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={cancelRename}
                                                            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-md"
                                                            title="取消"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                // Session Info with Menu Button
                                                <div className="flex items-center justify-between">
                                                    <div onClick={() => setCurrentSessionId(session.id)} className="flex-1 min-w-0">
                                                        <h3 className="font-medium text-sm text-gray-900 truncate whitespace-nowrap">{session.title}</h3>
                                                        <p className="text-xs text-gray-500 mt-1 truncate whitespace-nowrap">
                                                            {new Date(session.timestamp).toLocaleString()}
                                                        </p>
                                                    </div>
                                                    <div className="relative">
                                                        {/* More Options Button */}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleMenu(session.id);
                                                            }}
                                                            className="ml-2 p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded-md hover:bg-gray-100"
                                                            title="更多选项"
                                                        >
                                                            <MoreVertical className="w-4 h-4" />
                                                        </button>
                                                        
                                                        {/* Dropdown Menu */}
                                                        {openMenuSessionId === session.id && (
                                                            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10 py-1.5">
                                                                {/* Rename Option */}
                                                                <button
                                                                    onClick={() => startRename(session.id)}
                                                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                                                >
                                                                    <Edit2 className="w-4 h-4 text-gray-500" />
                                                                    <span>重命名</span>
                                                                </button>
                                                                
                                                                {/* Delete Option */}
                                                                <button
                                                                    onClick={() => deleteSession(session.id)}
                                                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                    <span>删除</span>
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
                
                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col">
                    {/* Chat Header */}
                    <div className="p-4 border-b flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-gray-900">AI 求职助手</h3>
                            <p className="text-xs text-gray-500">智能简历优化、面试准备、职业规划</p>
                        </div>
                        <button 
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 rounded-lg hover:bg-gray-100 transition"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                {isSidebarOpen ? (
                                    <path d="M18 6L6 18M6 6l12 12" />
                                ) : (
                                    <path d="M3 12h18M12 3v18" />
                                )}
                            </svg>
                        </button>
                    </div>
                    
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {currentSession.messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-gray-50 text-gray-800 border border-gray-100 rounded-tl-none'}`}>
                                    <p>{msg.text || msg.content}</p>
                                </div>
                            </div>
                        ))}
                        
                        {isLoading && (
                            <div className="flex items-center gap-2 text-gray-400 p-4">
                                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"/>
                                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-75"/>
                                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150"/>
                                <span className="text-sm">AI正在思考...</span>
                            </div>
                        )}
                        
                        <div ref={messagesEndRef} />
                    </div>
                    
                    {/* Input Area */}
                    <div className="p-4 border-t">
                        <div className="flex gap-3">
                            <textarea 
                                className="flex-1 p-3 border border-gray-200 rounded-xl resize-none text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none shadow-sm"
                                rows={1}
                                placeholder="输入你的问题..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        callGeminiAPI(input);
                                    }
                                }}
                            />
                            <button 
                                onClick={() => callGeminiAPI(input)}
                                disabled={!input.trim() || isLoading}
                                className={`px-5 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-sm disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center`}
                            >
                                <SendIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIChatScreen;