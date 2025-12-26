import request from '@/utils/request';

/**
 * AI会话相关API
 */
export const aiSessionAPI = {
  // 获取用户的所有AI会话
  getUserAISessions: (userId: string | number) => {
    return request.get(`/ai-sessions/user/${userId}`);
  },

  // 获取单个AI会话
  getAISession: (sessionId: string | number) => {
    return request.get(`/ai-sessions/${sessionId}`);
  },

  // 创建新的AI会话
  createAISession: (data: { userId: string | number; title: string; sessionType: string; messages: any[] }) => {
    return request.post('/ai-sessions', data);
  },

  // 更新AI会话
  updateAISession: (sessionId: string | number, messages: any[], title?: string) => {
    return request.put(`/ai-sessions/${sessionId}`, { messages, title });
  },

  // 删除AI会话
  deleteAISession: (sessionId: string | number) => {
    return request.delete(`/ai-sessions/${sessionId}`);
  },

  // 批量删除AI会话
  deleteAISessions: (sessionIds: (string | number)[]) => {
    return request.delete('/ai-sessions', { data: { sessionIds } });
  }
};
