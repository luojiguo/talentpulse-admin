import { api } from './apiService';

export const notificationAPI = {
    // Get user notifications
    getNotifications: (params?: any) => api.get('/notifications', { params }),

    // Mark single notification as read
    markAsRead: (id: string | number) => api.post(`/notifications/${id}/read`),

    // Mark all notifications as read
    markAllAsRead: () => api.post('/notifications/read-all'),

    // Admin: Create notification
    createNotification: (data: any) => api.post('/notifications/admin', data),

    // Admin: Get all notifications
    getAdminNotifications: () => api.get('/notifications/admin'),

    // Admin: Update notification
    updateNotification: (id: string | number, data: any) => api.put(`/notifications/admin/${id}`, data),

    // Admin: Delete notification
    deleteNotification: (id: string | number) => api.delete(`/notifications/admin/${id}`)
};
