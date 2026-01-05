import request from '@/utils/request';

/**
 * 消息相关API
 */
export const messageAPI = {
  // 获取对话列表
  getConversations: (userId: string | number, role?: 'recruiter' | 'candidate') => {
    const params = role ? { role } : {};
    return request.get(`/messages/conversations/${userId}`, { params });
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
    return request.get(`/messages/conversation/${conversationId}`, { params });
  },

  // 发送消息
  sendMessage: (data: { conversationId: string | number, senderId: string | number, receiverId?: string | number, text: string, type?: string, quoted_message?: { id: string | number, text: string, sender_name: string, type?: string } }) => {
    return request.post('/messages', data);
  },

  // 创建对话并发送第一条消息
  createConversationAndSendMessage: (data: { jobId: string | number, candidateId: string | number, recruiterId: string | number, message: string }) => {
    return request.post('/messages/conversations', data);
  },

  // 标记消息为已读
  markAsRead: (conversationId: string | number, userId: string | number) => {
    return request.put(`/messages/read/${conversationId}/${userId}`);
  },

  // 批量标记消息为已读 (兼容旧代码命名)
  markMessagesAsRead: (conversationId: string | number, userId: string | number) => {
    return request.put(`/messages/read/${conversationId}/${userId}`);
  },

  // 上传聊天图片
  uploadChatImage: (conversationId: string | number, senderId: string | number, receiverId: string | number, file: File, quotedMessage?: any) => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('senderId', senderId.toString());
    formData.append('receiverId', receiverId.toString());
    if (quotedMessage) formData.append('quoted_message', JSON.stringify(quotedMessage));

    return request.post(`/messages/upload-image/${conversationId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // 上传简历文件
  uploadResumeFile: (conversationId: string | number, senderId: string | number, receiverId: string | number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('senderId', senderId.toString());
    formData.append('receiverId', receiverId.toString());
    formData.append('fileType', 'resume');

    return request.post(`/messages/upload-file/${conversationId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // 通用文件上传
  uploadFile: (conversationId: string | number, senderId: string | number, receiverId: string | number, file: File, fileType?: string, quotedMessage?: any) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('senderId', senderId.toString());
    formData.append('receiverId', receiverId.toString());
    if (fileType) formData.append('fileType', fileType);
    if (quotedMessage) formData.append('quoted_message', JSON.stringify(quotedMessage));

    return request.post(`/messages/upload-file/${conversationId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // 删除/隐藏消息
  deleteMessage: (messageId: string | number, data: { deletedBy: string | number }) => {
    return request.delete(`/messages/messages/${messageId}`, { data });
  },

  // 删除对话（软删除）
  deleteConversation: (conversationId: string | number, data?: { deletedBy: string | number }) => {
    return request.delete(`/messages/conversation/${conversationId}`, { data });
  },

  // 更新对话状态（置顶/隐藏）
  updateConversationStatus: (conversationId: string | number, data: { role: 'recruiter' | 'candidate', action: 'pin' | 'unpin' | 'hide' | 'unhide' }) => {
    return request.patch(`/messages/conversations/${conversationId}/status`, data);
  },

  // Update WeChat exchange status
  updateExchangeStatus: (messageId: string | number, action: 'accept' | 'reject', userId: string | number, extraData?: any) => {
    return request.put(`/messages/exchange/${messageId}`, { action, userId, ...extraData });
  },
};
