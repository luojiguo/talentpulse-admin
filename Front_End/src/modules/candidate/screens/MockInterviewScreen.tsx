import React, { useState, useRef, useEffect } from 'react';
import { Mic2, User, Send as SendIcon } from 'lucide-react';
import { generateInterviewFeedback } from '@/services/aiService';

const MockInterviewScreen = () => {
    const [targetRole, setTargetRole] = useState('');
    const [isStarted, setIsStarted] = useState(false);
    const [messages, setMessages] = useState<{role: string, text: string}[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const handleStart = async () => {
        if (!targetRole.trim()) return;
        setIsStarted(true);
        setIsLoading(true);
        const initialPrompt = `Start a mock interview for a ${targetRole} position. Ask the first question.`;
        const response = await generateInterviewFeedback(targetRole, []);
        setMessages([{ role: 'ai', text: response }]);
        setIsLoading(false);
    };

    const handleSend = async () => {
        if (!input.trim()) return;
        const newHistory = [...messages, { role: 'user', text: input }];
        setMessages(newHistory);
        setInput('');
        setIsLoading(true);
        
        const response = await generateInterviewFeedback(targetRole, newHistory);
        setMessages(prev => [...prev, { role: 'ai', text: response }]);
        setIsLoading(false);
    };

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    if (!isStarted) {
        return (
            <div className="max-w-2xl mx-auto py-16 px-4 text-center">
                <div className="bg-white p-8 rounded-2xl shadow-xl border border-indigo-100">
                    <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Mic2 className="w-10 h-10 text-indigo-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">AI 模拟面试官</h2>
                    <p className="text-gray-500 mb-8">输入你想应聘的职位，AI 将为你进行一对一的模拟面试，提供实时反馈和改进建议。</p>
                    <input 
                        className="w-full p-4 border border-gray-300 rounded-xl text-lg mb-6 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center"
                        placeholder="例如：前端工程师、产品经理、销售代表"
                        value={targetRole}
                        onChange={(e) => setTargetRole(e.target.value)}
                    />
                    <button 
                        onClick={handleStart}
                        disabled={!targetRole.trim()}
                        className="w-full py-4 bg-indigo-600 text-white text-lg font-bold rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                        开始面试
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto h-[calc(100vh-80px)] flex flex-col py-6 px-4">
            <div className="flex justify-between items-center mb-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div>
                    <h2 className="text-lg font-bold text-gray-900">正在面试: {targetRole}</h2>
                    <p className="text-xs text-gray-500">AI 面试官正在提问</p>
                </div>
                <button onClick={() => setIsStarted(false)} className="text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm font-medium transition">结束面试</button>
            </div>

            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] p-5 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-gray-50 text-gray-800 border border-gray-100 rounded-tl-none'}`}>
                                <div className="flex items-center gap-2 mb-2 opacity-70 text-xs font-bold uppercase tracking-wider">
                                    {msg.role === 'user' ? <User size={12}/> : <Mic2 size={12}/>}
                                    {msg.role === 'user' ? '候选人 (你)' : 'AI 面试官'}
                                </div>
                                <div className="whitespace-pre-line">{msg.text}</div>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-center gap-2 text-gray-400 p-4">
                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"/>
                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-75"/>
                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150"/>
                            <span className="text-sm">面试官正在评估你的回答...</span>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                    <div className="flex gap-3">
                        <textarea 
                            className="flex-1 p-4 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none shadow-sm bg-white"
                            rows={2}
                            placeholder="输入你的回答..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {if(e.key === 'Enter' && !e.shiftKey) {e.preventDefault(); handleSend();}}}
                        />
                        <button 
                            onClick={handleSend}
                            disabled={isLoading || !input.trim()}
                            className="px-6 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-sm disabled:bg-gray-300 disabled:cursor-not-allowed flex flex-col items-center justify-center"
                        >
                            <SendIcon size={20} />
                            <span className="text-xs mt-1">发送</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MockInterviewScreen;