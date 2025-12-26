import request from '@/utils/request';

/**
 * 简历相关API
 */
export const resumeAPI = {
  // 获取用户的简历列表
  getUserResumes: (userId: string | number) => request.get(`/resumes/user/${userId}`),

  // 获取单个简历详情
  getResumeById: (id: string | number) => request.get(`/resumes/${id}`),

  // 上传简历文件
  uploadResume: (userId: string | number, file: File) => {
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('user_id', userId.toString());

    return request.post('/resumes/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // 更新简历解析数据
  updateResume: (id: string | number, data: any) => {
    return request.put(`/resumes/${id}`, data);
  },

  // 删除简历
  deleteResume: (id: string | number) => {
    return request.delete(`/resumes/${id}`);
  },

  // 解析简历 (调用AI解析)
  parseResume: (id: string | number) => {
    return request.post(`/resumes/${id}/parse`);
  },

  // 保存在线编辑的简历
  saveResume: (userId: string | number, resumeId: string | number | null, resumeData: any) => {
    return request.post('/resumes/save', {
      userId,
      resumeId,
      resume_data: resumeData
    });
  }
};
