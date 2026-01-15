import React, { useState, useEffect } from 'react';
import { Badge, Popover, List, Typography, Button, Empty, Avatar, Tag } from 'antd';
import { Bell, Check, Trash2, Info, AlertTriangle, PenTool } from 'lucide-react';
import { api, notificationAPI } from '@/services/apiService';
import { socketService } from '@/services/socketService';

const { Text, Title, Paragraph } = Typography;

interface Notification {
    id: number;
    title: string;
    content: string;
    type: 'announcement' | 'maintenance' | 'alert';
    created_at: string;
    is_read: boolean;
}

export interface NotificationBellProps {
    role?: 'candidate' | 'recruiter' | 'admin';
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ role }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const params = role ? { role } : {};
            const res = await notificationAPI.getNotifications(params);
            if (res.data.status === 'success') {
                setNotifications(res.data.data);
                setUnreadCount(res.data.unread_count || 0);
                window.dispatchEvent(new CustomEvent('notificationCountUpdated', {
                    detail: { count: res.data.unread_count || 0 }
                }));
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();

        // Socket.IO Listener
        // Socket.IO Listener
        const handleNewNotification = (data: any) => {
            // Optimistically add to list and increment count
            setNotifications(prev => [{
                id: data.id,
                title: data.title,
                content: '新通知', // Content might not be fully carried in payload depending on impl, better fetch detail or adjust payload
                type: data.type,
                created_at: new Date().toISOString(),
                is_read: false
            } as Notification, ...prev]);
            setUnreadCount(prev => prev + 1);

            // Refresh to be sure
            fetchNotifications();
        };

        socketService.onSystemNotification(handleNewNotification);

        return () => {
            socketService.offSystemNotification(handleNewNotification);
        };
    }, []);

    const handleMarkAsRead = async (id: number) => {
        try {
            await api.post(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark read:', error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await api.post('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all read:', error);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'alert': return <AlertTriangle className="text-red-500 w-5 h-5" />;
            case 'maintenance': return <PenTool className="text-orange-500 w-5 h-5" />; // wrench alternative
            default: return <Info className="text-blue-500 w-5 h-5" />;
        }
    };

    const content = (
        <div className="w-80 max-h-[500px] overflow-y-auto flex flex-col">
            <div className="flex justify-between items-center px-4 py-3 border-b sticky top-0 bg-white z-10">
                <span className="font-bold text-base">通知中心</span>
                {unreadCount > 0 && (
                    <Button type="link" size="small" onClick={handleMarkAllRead} className="p-0 text-xs">
                        全部已读
                    </Button>
                )}
            </div>

            {loading && notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-400">加载中...</div>
            ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-400 flex flex-col items-center">
                    <Bell className="w-8 h-8 opacity-20 mb-2" />
                    暂无通知
                </div>
            ) : (
                <List
                    dataSource={notifications}
                    renderItem={(item) => (
                        <List.Item
                            className={`px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer border-b last:border-0 ${!item.is_read ? 'bg-blue-50' : ''}`}
                            onClick={() => !item.is_read && handleMarkAsRead(item.id)}
                        >
                            <div className="flex gap-3 w-full">
                                <div className="mt-1 flex-shrink-0">
                                    {getIcon(item.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <Text strong={!item.is_read} className="truncate pr-2 text-sm">{item.title}</Text>
                                        {!item.is_read && <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />}
                                    </div>
                                    <Paragraph className="text-xs text-slate-500 mb-1" ellipsis={{ rows: 2 }}>{item.content}</Paragraph>
                                    <Text type="secondary" className="text-[10px]">{new Date(item.created_at).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' })}</Text>
                                </div>
                            </div>
                        </List.Item>
                    )}
                />
            )}
        </div>
    );

    return (
        <Popover
            content={content}
            title={null}
            trigger="click"
            placement="bottomRight"
            overlayClassName="p-0"
            open={open}
            onOpenChange={setOpen}
        >
            <div className="relative cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </div>
        </Popover>
    );
};
