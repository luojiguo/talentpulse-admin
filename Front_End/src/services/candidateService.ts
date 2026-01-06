import request from '@/utils/request';

/**
 * 求职者相关API
 */
export const candidateAPI = {
  // 获取所有求职者
  getAllCandidates: () => request.get('/candidates'),

  // 获取求职者详情
  getCandidateProfile: (userId: string | number) => request.get(`/candidates/${userId}`),

  // 更新/创建求职者详情
  updateCandidateProfile: (userId: string | number, data: any) => {
    return request.post(`/candidates/${userId}`, data);
  },

  // 获取求职者的申请记录
  getCandidateApplications: (candidateId: string | number) => {
    return request.get(`/applications/candidate/${candidateId}`);
  },

  // 获取求职者的收藏职位
  getCandidateSavedJobs: (userId: string | number) => {
    return request.get(`/candidates/${userId}/saved-jobs`);
  },

  // 保存职位到收藏
  saveJob: (userId: string | number, jobId: string | number) => {
    return request.post(`/candidates/${userId}/saved-jobs`, { jobId });
  },

  // 从收藏中移除职位
  removeSavedJob: (userId: string | number, jobId: string | number) => {
    return request.delete(`/candidates/${userId}/saved-jobs/${jobId}`);
  },

  // 获取求职者的收藏公司
  getCandidateSavedCompanies: (userId: string | number) => {
    return request.get(`/candidates/${userId}/saved-companies`);
  },

  // 保存公司到收藏
  saveCompany: (userId: string | number, companyId: string | number) => {
    return request.post(`/candidates/${userId}/saved-companies`, { companyId });
  },

  // 从收藏中移除公司
  removeSavedCompany: (userId: string | number, companyId: string | number) => {
    return request.delete(`/candidates/${userId}/saved-companies/${companyId}`);
  },

  // 提交职位申请
  applyForJob: (candidateIdOrUserId: string | number, jobId: string | number, applicationData: any = {}) => {
    const userId = applicationData.userId || candidateIdOrUserId;
    const candidateId = applicationData.userId ? undefined : candidateIdOrUserId;

    return request.post('/applications', {
      userId,
      candidateId,
      jobId,
      resumeId: applicationData.resumeId,
      coverLetter: applicationData.coverLetter,
      applicationMethod: applicationData.applicationMethod
    });
  },

  // ==========================================
  // Work Experience
  // ==========================================
  getWorkExperiences: (userId: string | number) => request.get(`/candidates/${userId}/work-experiences`),
  addWorkExperience: (userId: string | number, data: any) => request.post(`/candidates/${userId}/work-experiences`, data),
  updateWorkExperience: (userId: string | number, id: string | number, data: any) => request.put(`/candidates/${userId}/work-experiences/${id}`, data),
  deleteWorkExperience: (userId: string | number, id: string | number) => request.delete(`/candidates/${userId}/work-experiences/${id}`),

  // ==========================================
  // Project Experience
  // ==========================================
  getProjectExperiences: (userId: string | number) => request.get(`/candidates/${userId}/project-experiences`),
  addProjectExperience: (userId: string | number, data: any) => request.post(`/candidates/${userId}/project-experiences`, data),
  updateProjectExperience: (userId: string | number, id: string | number, data: any) => request.put(`/candidates/${userId}/project-experiences/${id}`, data),
  deleteProjectExperience: (userId: string | number, id: string | number) => request.delete(`/candidates/${userId}/project-experiences/${id}`),

  // ==========================================
  // Education Experience
  // ==========================================
  getEducationExperiences: (userId: string | number) => request.get(`/candidates/${userId}/education-experiences`),
  addEducationExperience: (userId: string | number, data: any) => request.post(`/candidates/${userId}/education-experiences`, data),
  updateEducationExperience: (userId: string | number, id: string | number, data: any) => request.put(`/candidates/${userId}/education-experiences/${id}`, data),
  deleteEducationExperience: (userId: string | number, id: string | number) => request.delete(`/candidates/${userId}/education-experiences/${id}`),

  // ==========================================
  // Expected Positions
  // ==========================================
  getExpectedPositions: (userId: string | number) => request.get(`/candidates/${userId}/expected-positions`),
  addExpectedPosition: (userId: string | number, data: any) => request.post(`/candidates/${userId}/expected-positions`, data),
  updateExpectedPosition: (userId: string | number, id: string | number, data: any) => request.put(`/candidates/${userId}/expected-positions/${id}`, data),
  deleteExpectedPosition: (userId: string | number, id: string | number) => request.delete(`/candidates/${userId}/expected-positions/${id}`),
};


