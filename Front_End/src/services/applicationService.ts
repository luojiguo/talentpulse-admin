import request from '@/utils/request';

/**
 * 申请相关API
 */
export const applicationAPI = {
  // 获取申请详情
  getApplicationById: (id: string | number) => request.get(`/applications/${id}`),

  // 更新申请状态
  updateApplicationStatus: (id: string | number, status: string, notes?: string) => {
    return request.patch(`/applications/${id}/status`, { status, notes });
  },

  // 获取职位的申请列表
  getJobApplications: (jobId: string | number) => {
    return request.get(`/applications/job/${jobId}`);
  },

  // Get candidate's applications
  getCandidateApplications: (candidateId: string | number) => {
    return request.get(`/applications/candidate/${candidateId}`);
  },

  // Get all applications (Admin)
  getAllApplications: () => {
    return request.get('/applications');
  },
};
