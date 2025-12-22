import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MessageSquare, Trash2 } from 'lucide-react';
import { Conversation } from '@/types/types';
import { formatDateTime } from '@/utils/dateUtils';

interface MessageListScreenProps {
    conversations: Conversation[];
    searchText: string;
    setSearchText: (text: string) => void;
    onDeleteConversation: (conversationId: string) => void;
    currentUser: any;
}

const MessageListScreen: React.FC<MessageListScreenProps> = ({ 
    conversations, 
    searchText, 
    setSearchText, 
    onDeleteConversation,
    currentUser
}) => {
    const navigate = useNavigate();

    // 只根据搜索文本过滤对话，不进行去重，确保所有对话都显示
    const filteredConversations = conversations
        .filter((conv: any) => {
            const recruiterName = conv.recruiter_name || '招聘者';
            const matchesSearch = searchText === '' || recruiterName.includes(searchText);
            return matchesSearch;
        })
        .sort((a: any, b: any) => {
            // 按更新时间排序，兼容多种命名格式
            const aTime = new Date(a.updatedAt || a.updated_at || a.updatedat).getTime();
            const bTime = new Date(b.updatedAt || b.updated_at || b.updatedat).getTime();
            return bTime - aTime;
        });

    return (
        <div className="min-h-[calc(100vh-120px)] bg-slate-50 flex flex-col">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-white shadow-sm p-4">
                <h1 className="text-xl font-bold text-gray-900 mb-4">消息中心</h1>
                
                {/* Search Bar - Optimized for mobile */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input 
                        type="text" 
                        placeholder="搜索联系人..." 
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-full text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all"
                        value={searchText} 
                        onChange={(e) => setSearchText(e.target.value)} 
                    />
                </div>
            </div>

            {/* Message List */}
            <div className="bg-white mt-2 flex-1 overflow-y-auto">
                {filteredConversations.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                        {filteredConversations.map((conv: Conversation) => {
                            // 直接从对话数据中获取招聘者信息
                            const recruiterName = conv.recruiter_name || '招聘者';
                            const recruiterAvatar = conv.recruiter_avatar || '招';
                            
                            // 处理删除对话
                            const handleDelete = (e: React.MouseEvent) => {
                                e.stopPropagation(); // 阻止事件冒泡，避免触发选择对话
                                // 优化删除提示，明确是软删除
                                if (window.confirm(`确定要删除与${recruiterName}的聊天记录吗？\n\n此操作是软删除，数据会保留在数据库中，但您将无法在消息列表中看到此对话。`)) {
                                    onDeleteConversation(conv.id);
                                }
                            };
                            
                            return (
                                <div 
                                    key={conv.id} 
                                    onClick={() => navigate(`/messages/${conv.id}`)}
                                    className="p-4 cursor-pointer transition-colors active:bg-gray-100"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        {/* Avatar and Info */}
                                        <div className="flex-1 flex items-start gap-3">
                                            {/* Avatar */}
                                            <div className="w-12 h-12 rounded-full bg-indigo-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                                                {recruiterAvatar && (recruiterAvatar.startsWith('http') || recruiterAvatar.startsWith('/avatars/')) ? (
                                                    <img src={recruiterAvatar} alt={recruiterName} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-base font-bold text-indigo-600">{recruiterName.charAt(0) || '招'}</span>
                                                )}
                                            </div>
                                            
                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-baseline justify-between">
                                                    <h4 className="font-semibold text-base text-gray-900 truncate">{recruiterName}</h4>
                                                    <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">{formatDateTime(conv.lastTime)}</span>
                                                </div>
                                                <p className="text-sm text-gray-500 truncate mt-0.5">{conv.company_name || '未知公司'}</p>
                                                <p className="text-sm text-gray-600 truncate mt-1">{conv.lastMessage || '暂无消息'}</p>
                                            </div>
                                        </div>
                                        
                                        {/* Delete Button - Larger touch area */}
                                        <button 
                                            onClick={handleDelete} 
                                            className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors flex-shrink-0"
                                            title="删除聊天"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                        <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
                            <MessageSquare className="w-10 h-10 text-indigo-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">暂无消息</h3>
                        <p className="text-gray-500 max-w-xs">
                            您还没有与任何招聘者进行过沟通，当您开始与招聘者交流时，这里会显示您的对话记录。
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessageListScreen;