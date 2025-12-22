import request from '@/utils/request';
import { SystemUser as User } from '@/types/types';

/**
 * 用户相关API
 */
export const userAPI = {
  // 获取所有用户
  getAllUsers: () => request.get('/users'),

  // 获取单个用户
  getUserById: (id: string | number) => request.get(`/users/${id}`),

  // 登录
  login: (credentials: { identifier: string; password: string; userType: string }) => {
    // 确保请求路径正确匹配后端路由
    return request.post('/users/login', credentials);
  },

  // 注册
  register: (userData: any) => {
    return request.post('/users/register', userData);
  },

  // 切换角色
  switchRole: (data: { userId: number; newRole: string; companyName?: string }) => {
    return request.post('/users/switch-role', data);
  },

  // 上传用户头像
  uploadAvatar: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);

    return request.post(`/users/${id}/avatar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // 更新用户信息
  updateUser: (id: string, userData: any) => {
    return request.put(`/users/${id}`, userData);
  },

  // 获取性别选项配置
  getGenderOptions: () => request.get('/users/config/genders'),
};
