import request from '@/utils/request';

/**
 * 面试相关API
 */
export const interviewAPI = {
  // 获取所有面试
  getAllInterviews: () => {
    return request.get('/interviews');
  },

  // 获取单个面试
  getInterviewById: (id: string | number) => {
    return request.get(`/interviews/${id}`);
  },

  // 根据申请ID获取面试
  getInterviewsByApplicationId: (applicationId: string | number) => {
    return request.get(`/interviews/application/${applicationId}`);
  },

  // 创建面试
  createInterview: (data: any) => {
    return request.post('/interviews', data);
  },

  // 更新面试
  updateInterview: (id: string | number, data: any) => {
    return request.patch(`/interviews/${id}`, data);
  },

  // 更新面试状态
  updateInterviewStatus: (id: string | number, status: string) => {
    return request.patch(`/interviews/${id}/status`, { status });
  },

  // 删除面试
  deleteInterview: (id: string | number) => {
    return request.delete(`/interviews/${id}`);
  },
};
