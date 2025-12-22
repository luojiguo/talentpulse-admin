import request from '@/utils/request';

/**
 * 简历相关API
 */
export const resumeAPI = {
  // 获取用户的简历列表
  getUserResumes: (userId: string | number) => request.get(`/api/resumes/user/${userId}`),

  // 获取单个简历详情
  getResumeById: (id: string | number) => request.get(`/api/resumes/${id}`),

  // 上传简历文件
  uploadResume: (userId: string | number, file: File) => {
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('user_id', userId.toString());

    return request.post('/api/resumes/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // 更新简历解析数据
  updateResume: (id: string | number, data: any) => {
    return request.put(`/api/resumes/${id}`, data);
  },

  // 删除简历
  deleteResume: (id: string | number) => {
    return request.delete(`/api/resumes/${id}`);
  },

  // 解析简历 (调用AI解析)
  parseResume: (id: string | number) => {
    return request.post(`/api/resumes/${id}/parse`);
  },

  // 保存在线编辑的简历
  saveResume: (userId: string | number, resumeId: string | number | null, resumeData: any) => {
    return request.post('/api/resumes/save', {
      userId,
      resumeId,
      resume_data: resumeData
    });
  }
};
