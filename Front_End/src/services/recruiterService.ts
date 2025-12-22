import request from '@/utils/request';

/**
 * 招聘者相关API
 */
export const recruiterAPI = {
  // 获取招聘者相关的职位列表
  getJobs: (recruiterId: string | number) => {
    return request.get('/api/recruiter/jobs', { params: { recruiterId } });
  },

  // 获取招聘者关联的候选人列表
  getCandidates: (recruiterId: string | number) => {
    return request.get('/api/recruiter/candidates', { params: { recruiterId } });
  },

  // 更新职位状态
  updateJobStatus: (jobId: string | number, status: string) => {
    return request.patch(`/api/jobs/${jobId}/status`, { status });
  },
};
