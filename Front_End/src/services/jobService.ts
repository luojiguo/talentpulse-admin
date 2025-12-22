import request from '@/utils/request';
import { JobPosting } from '@/types/types';

/**
 * 职位相关API
 */
export const jobAPI = {
  // 获取所有职位
  getAllJobs: () => request.get('/jobs', { timeout: 60000 }),

  // 获取智能推荐的职位（基于用户信息）
  getRecommendedJobs: (userId: string | number) => {
    return request.get(`/jobs/recommended/${userId}`, { timeout: 60000 });
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
};
