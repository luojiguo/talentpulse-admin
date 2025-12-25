import request from '@/utils/request';
import { SystemUser as User } from '@/types/types';

/**
 * 用户相关API
 */
export const userAPI = {
  // 获取所有用户
  getAllUsers: () => request.get('/api/users') as Promise<any>,

  // 获取单个用户
  getUserById: (id: string | number) => request.get(`/api/users/${id}`) as Promise<any>,

  // 登录
  login: (credentials: { identifier: string; password: string; userType: string }) => {
    return request.post('/api/users/login', credentials) as Promise<any>;
  },

  // 注册
  register: (userData: any) => {
    return request.post('/api/users/register', userData) as Promise<any>;
  },

  // 切换角色
  switchRole: (data: { userId: number; newRole: string; companyName?: string }) => {
    return request.post('/api/users/switch-role', data) as Promise<any>;
  },

  // 上传用户头像
  uploadAvatar: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);

    return request.post(`/api/users/${id}/avatar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }) as Promise<any>;
  },

  // 更新用户信息
  updateUser: (id: string, userData: any) => {
    return request.put(`/api/users/${id}`, userData) as Promise<any>;
  },

  // 获取性别选项配置
  getGenderOptions: () => request.get('/api/users/config/genders') as Promise<any>,
  
  // 发送验证码
  sendVerificationCode: (identifier: string) => {
    return request.post('/api/users/send-verification-code', { identifier }) as Promise<any>;
  },
  
  // 验证验证码
  verifyCode: (identifier: string, code: string) => {
    return request.post('/api/users/verify-code', { identifier, code }) as Promise<any>;
  },
  
  // 重置密码
  resetPassword: (resetToken: string, newPassword: string) => {
    return request.post('/api/users/reset-password', { resetToken, newPassword }) as Promise<any>;
  },
  
  // 发送邮箱绑定验证码
  sendEmailBindCode: (email: string) => {
    return request.post('/api/users/send-email-bind-code', { email }) as Promise<any>;
  },
  
  // 绑定邮箱
  bindEmail: (email: string, code: string) => {
    return request.post('/api/users/bind-email', { email, code }) as Promise<any>;
  },

  // 注销账号
  deleteAccount: (id: string | number) => {
    return request.delete(`/api/users/${id}/delete-account`) as Promise<any>;
  },
};
