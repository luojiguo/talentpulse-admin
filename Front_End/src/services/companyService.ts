import request from '@/utils/request';

/**
 * 公司相关API
 */
export const companyAPI = {
  // 获取智能推荐的公司（基于用户期望职位）
  getRecommendedCompanies: (userId: string | number) => {
    return request.get(`/api/companies/recommended/${userId}`, { timeout: 60000 }) as Promise<any>;
  },

  // 获取所有公司，支持筛选
  getAllCompanies: (filters?: { search?: string, industry?: string, status?: string, size?: string }) => {
    return request.get('/api/companies', { params: filters, timeout: 60000 }) as Promise<any>;
  },

  // 获取单个公司
  getCompanyById: (id: string | number) => request.get(`/api/companies/${id}`) as Promise<any>,

  // 通过用户ID获取公司
  getCompanyByUserId: (userId: string | number) => {
    return request.get(`/api/companies/user/${userId}`) as Promise<any>;
  },

  // 验证公司
  verifyCompany: (companyId: string | number, verificationData: any) => {
    return request.post(`/api/companies/${companyId}/verify`, verificationData) as Promise<any>;
  },

  // 获取用户关注的所有公司
  getFollowedCompanies: (userId: string | number) => {
    return request.get(`/api/companies/followed`, { params: { user_id: userId } }) as Promise<any>;
  },

  // 关注公司
  followCompany: (companyId: string | number, userId: string | number, options?: { signal?: AbortSignal }) => {
    return request.post(`/api/companies/${companyId}/follow`, { user_id: userId }, { signal: options?.signal }) as Promise<any>;
  },

  // 取消关注公司
  unfollowCompany: (companyId: string | number, userId: string | number, options?: { signal?: AbortSignal }) => {
    return request.delete(`/api/companies/${companyId}/follow`, { params: { user_id: userId }, signal: options?.signal }) as Promise<any>;
  },

  // 检查用户是否关注了公司
  checkFollowStatus: (companyId: string | number, userId: string | number) => {
    return request.get(`/api/companies/${companyId}/follow/status`, { params: { user_id: userId } }) as Promise<any>;
  },
};
