import React, { useState, useEffect, useMemo } from 'react';
import { Bell, Plus, Trash2, Send, CheckCircle, Clock, Search, X, Loader2, Filter, AlertTriangle, Info } from 'lucide-react';
import { api } from '@/services/apiService';
import { message } from 'antd';
import Pagination from '@/components/Pagination';

interface Notification {
    id: number;
    title: string;
    content: string;
    target_audience: 'all' | 'candidate' | 'recruiter';
    type: 'announcement' | 'maintenance' | 'alert';
    is_published: boolean;
    read_count: number;
    published_at: string;
    created_at: string;
}

const NotificationsView: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        target_audience: 'all',
        type: 'announcement'
    });

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    // Fetch notifications
    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const response = await api.get('/notifications/admin');
            if (response.data.status === 'success') {
                setNotifications(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
            message.error('无法加载通知列表');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    // Submit new notification
    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                is_published: true // Default to immediate publish for now
            };

            await api.post('/notifications/admin', payload);
            message.success('通知发布成功，所有目标用户将收到提醒');
            setIsModalVisible(false);
            setFormData({
                title: '',
                content: '',
                target_audience: 'all',
                type: 'announcement'
            });
            fetchNotifications();
        } catch (error) {
            console.error('Failed to create notification:', error);
            message.error('发布失败');
        } finally {
            setSubmitting(false);
        }
    };

    // Delete notification
    const handleDelete = async (id: number) => {
        if (!window.confirm('确定要删除这条通知吗？')) return;
        try {
            await api.delete(`/notifications/admin/${id}`);
            message.success('通知已删除');
            fetchNotifications();
        } catch (error) {
            console.error('Failed to delete notification:', error);
            message.error('删除失败');
        }
    };

    // Filter and Pagination
    const filteredNotifications = useMemo(() => {
        return notifications.filter(notif => {
            const matchesSearch = searchTerm === '' ||
                notif.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                notif.content.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesType = filterType === 'all' || notif.type === filterType;
            return matchesSearch && matchesType;
        });
    }, [notifications, searchTerm, filterType]);

    const paginatedNotifications = useMemo(() => {
        setTotalItems(filteredNotifications.length);
        const startIndex = (currentPage - 1) * pageSize;
        return filteredNotifications.slice(startIndex, startIndex + pageSize);
    }, [filteredNotifications, currentPage, pageSize]);

    // Helpers
    const getAudienceLabel = (audience: string) => {
        const map: any = { all: '全员', candidate: '求职者', recruiter: '招聘者' };
        return map[audience] || audience;
    };

    const getAudienceColor = (audience: string) => {
        switch (audience) {
            case 'all': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300';
            case 'candidate': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300';
            case 'recruiter': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300';
            default: return 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300';
        }
    };

    const getTypeLabel = (type: string) => {
        const map: any = { announcement: '公告', maintenance: '维护', alert: '警告' };
        return map[type] || type;
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'alert': return 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300';
            case 'maintenance': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300';
            default: return 'bg-slate-100 text-slate-700 dark:bg-slate-700/50 dark:text-white';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'alert': return <AlertTriangle size={14} />;
            case 'maintenance': return <Clock size={14} />;
            default: return <Info size={14} />;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Bell className="w-6 h-6 text-purple-600" />
                        系统通知管理
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">向全站用户或特定群体发送重要公告与消息</p>
                </div>
                <button
                    onClick={() => setIsModalVisible(true)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    发布新通知
                </button>
            </div>

            {/* Filter Bar */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 flex flex-col md:flex-row justify-between gap-4">
                <div className="flex gap-2 items-center w-full md:w-auto">
                    <Search className="text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="搜索通知标题或内容..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="bg-transparent focus:outline-none text-sm w-full md:w-64 text-slate-900 dark:text-white placeholder:text-slate-400"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="bg-transparent text-sm text-slate-700 dark:text-slate-200 focus:outline-none border-none py-1"
                    >
                        <option value="all" className="dark:bg-slate-800">所有类型</option>
                        <option value="announcement" className="dark:bg-slate-800">公告</option>
                        <option value="maintenance" className="dark:bg-slate-800">维护</option>
                        <option value="alert" className="dark:bg-slate-800">警告</option>
                    </select>
                </div>
            </div>

            {/* Table Area */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
                            <tr>
                                <th className="px-6 py-3 text-left">标题</th>
                                <th className="px-6 py-3 text-left">受众</th>
                                <th className="px-6 py-3 text-left">类型</th>
                                <th className="px-6 py-3 text-left">已读人数</th>
                                <th className="px-6 py-3 text-left">状态</th>
                                <th className="px-6 py-3 text-left">发布时间</th>
                                <th className="px-6 py-3 text-left">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex justify-center items-center gap-2">
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            加载中...
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredNotifications.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                        没有找到匹配的通知
                                    </td>
                                </tr>
                            ) : (
                                paginatedNotifications.map(notification => (
                                    <tr key={notification.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900 dark:text-white max-w-[200px] truncate" title={notification.title}>{notification.title}</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 max-w-[200px] truncate mt-1" title={notification.content}>{notification.content}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getAudienceColor(notification.target_audience)}`}>
                                                {getAudienceLabel(notification.target_audience)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded text-xs font-semibold flex items-center gap-1 w-fit ${getTypeColor(notification.type)}`}>
                                                {getTypeIcon(notification.type)}
                                                {getTypeLabel(notification.type)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400 text-xs font-medium">
                                                {notification.is_published ? notification.read_count : '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {notification.is_published ? (
                                                <span className="flex items-center gap-1 text-green-600 dark:text-green-400 text-xs font-medium">
                                                    <CheckCircle size={14} /> 已发布
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 text-xs font-medium">
                                                    <Clock size={14} /> 草稿
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                            {new Date(notification.published_at).toLocaleString('zh-CN')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleDelete(notification.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                title="删除"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-2 border-t border-slate-200 dark:border-slate-700">
                    <Pagination
                        currentPage={currentPage}
                        pageSize={pageSize}
                        totalItems={totalItems}
                        onPageChange={(page) => setCurrentPage(page)}
                        onPageSizeChange={(size) => {
                            setPageSize(size);
                            setCurrentPage(1);
                        }}
                    />
                </div>
            </div>

            {/* Create Modal */}
            {isModalVisible && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setIsModalVisible(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Send className="w-5 h-5 text-purple-600" />
                                发布新通知
                            </h2>
                            <button onClick={() => setIsModalVisible(false)} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-500">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">通知标题</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="例如：系统维护通知"
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">发送对象</label>
                                    <select
                                        value={formData.target_audience}
                                        onChange={e => setFormData({ ...formData, target_audience: e.target.value as any })}
                                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                                    >
                                        <option value="all">🔁 全员</option>
                                        <option value="candidate">👨‍🎓 仅求职者</option>
                                        <option value="recruiter">🏢 仅招聘者</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">通知类型</label>
                                    <select
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                                    >
                                        <option value="announcement">📢 普通公告</option>
                                        <option value="maintenance">🔧 系统维护</option>
                                        <option value="alert">⚠️ 紧急警告</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">详细内容</label>
                                <textarea
                                    required
                                    rows={5}
                                    value={formData.content}
                                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                                    placeholder="在此输入通知详情..."
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all resize-none"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalVisible(false)}
                                    className="px-6 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium"
                                >
                                    取消
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-6 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium shadow-lg shadow-purple-500/30 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            发布中...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            立即发布
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationsView;
