import request from '@/utils/request';
import { JobPosting } from '@/types/types';

/**
 * 职位相关API
 */
export const jobAPI = {
  // 获取所有职位
  getAllJobs: (params?: { page?: number; limit?: number; recruiterId?: string | number, companyId?: string | number, location?: string, experience?: string, degree?: string, type?: string, work_mode?: string }) => request.get('/jobs', { params: { ...params, limit: params?.limit || 1000 }, timeout: 60000 }),

  // 获取智能推荐的职位（基于用户信息）
  getRecommendedJobs: (userId: string | number, triggerAI: boolean = false) => {
    return request.get(`/jobs/recommended/${userId}`, {
      params: { triggerAI },
      timeout: 60000
    });
  },

  // Check AI recommendation status
  getRecommendedJobsStatus: (userId: string | number) => {
    return request.get(`/jobs/recommended/${userId}/status`);
  },

  // 获取单个职位
  getJobById: (id: string | number) => request.get(`/jobs/${id}`),

  // 创建新职位
  createJob: (jobData: any) => {
    return request.post('/jobs', jobData);
  },

  // 更新职位
  updateJob: (id: string | number, jobData: any) => {
    return request.put(`/jobs/${id}`, jobData);
  },

  // 删除职位
  deleteJob: (id: string | number) => {
    return request.delete(`/jobs/${id}`);
  },
  
  // 根据公司ID获取职位
  getJobsByCompanyId: (companyId: string | number) => {
    return request.get('/jobs', { params: { companyId }, timeout: 60000 });
  },
};
