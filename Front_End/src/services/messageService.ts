import request from '@/utils/request';

/**
 * 消息相关API
 */
export const messageAPI = {
  // 获取对话列表
  getConversations: (userId: string | number) => {
    return request.get(`/messages/conversations/${userId}`);
  },

  // 获取对话详情
  getConversationMessages: (conversationId: string | number) => {
    return request.get(`/messages/conversations/${conversationId}/messages`);
  },

  // 获取对话详情 (兼容旧代码命名)
  getConversationDetail: (conversationId: string | number, limit?: number, offset?: number, sort?: string) => {
    const params: any = {};
    if (limit) params.limit = limit;
    if (offset) params.offset = offset;
    if (sort) params.sort = sort;
    return request.get(`/messages/conversations/${conversationId}/messages`, { params });
  },

  // 发送消息
  sendMessage: (data: { conversationId: string | number, senderId: string | number, receiverId?: string | number, text: string, type?: string }) => {
    return request.post('/messages', data);
  },

  // 创建对话并发送第一条消息
  createConversationAndSendMessage: (data: { jobId: string | number, candidateId: string | number, recruiterId: string | number, message: string }) => {
    return request.post('/messages/conversations/create', data);
  },

  // 标记消息为已读
  markAsRead: (conversationId: string | number, userId: string | number) => {
    return request.post(`/messages/conversations/${conversationId}/read`, { userId });
  },

  // 批量标记消息为已读 (兼容旧代码命名)
  markMessagesAsRead: (conversationId: string | number, userId: string | number) => {
    return request.post(`/messages/conversations/${conversationId}/read`, { userId });
  },

  // 上传聊天图片
  uploadChatImage: (conversationId: string | number, senderId: string | number, receiverId: string | number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('conversationId', conversationId.toString());
    formData.append('senderId', senderId.toString());
    formData.append('receiverId', receiverId.toString());
    formData.append('type', 'image');

    return request.post('/messages/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // 删除/隐藏消息
  deleteMessage: (messageId: string | number, data: { deletedBy: string | number }) => {
    return request.delete(`/messages/${messageId}`, { data });
  },
  
  // 删除对话（软删除）
  deleteConversation: (conversationId: string | number) => {
    return request.delete(`/messages/conversations/${conversationId}`);
  },
};
