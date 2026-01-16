import request from '@/utils/request';
import { SystemUser as User } from '@/types/types';

/**
 * 用户相关API
 */
export const userAPI = {
  // 获取所有用户
  getAllUsers: () => request.get('/users') as Promise<any>,

  // 获取单个用户
  getUserById: (id: string | number) => request.get(`/users/${id}`) as Promise<any>,

  // 登录
  login: (credentials: { identifier: string; password: string; userType: string }) => {
    return request.post('/users/login', credentials) as Promise<any>;
  },

  // 注册
  register: (userData: any) => {
    return request.post('/users/register', userData) as Promise<any>;
  },

  // 切换角色
  switchRole: (data: { userId: number; newRole: string; companyName?: string }) => {
    return request.post('/users/switch-role', data) as Promise<any>;
  },

  // 上传用户头像
  uploadAvatar: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);

    return request.post(`/users/${id}/avatar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }) as Promise<any>;
  },

  // 更新用户信息
  updateUser: (id: string, userData: any) => {
    return request.put(`/users/${id}`, userData) as Promise<any>;
  },

  // 获取性别选项配置
  getGenderOptions: () => request.get('/users/config/genders') as Promise<any>,

  // 发送验证码（用于修改密码 - 已登录）
  sendVerificationCode: () => {
    return request.post('/users/send-auth-verification-code', {}) as Promise<any>;
  },

  // 发送验证码（用于找回密码/未登录）
  // 注意：需要区分 authenticated 和 unauthenticated 的调用
  // 可以重载或者使用不同方法名。由于ForgotPasswordForm调用的是 userAPI.sendVerificationCode(identifier)，
  // 我们需要支持带参数的调用作为未登录版本。
  sendVerificationCodeForReset: (identifier: string) => {
    return request.post('/users/send-verification-code', { identifier }) as Promise<any>;
  },

  // 验证验证码
  verifyCode: (identifier: string, code: string) => {
    return request.post('/users/verify-code', { identifier, code }) as Promise<any>;
  },

  // 重置密码
  resetPassword: (resetToken: string, newPassword: string) => {
    return request.post('/users/reset-password', { resetToken, newPassword }) as Promise<any>;
  },

  // 绑定邮箱
  bindEmail: (email: string, code: string) => {
    return request.post('/users/bind-email', { email, code }) as Promise<any>;
  },

  // 发送邮箱绑定验证码
  sendEmailBindCode: (email: string) => {
    return request.post('/users/send-email-bind-code', { email }) as Promise<any>;
  },

  // 管理员更新用户状态（管理员）
  updateUserStatus: (id: string | number, status: 'active' | 'inactive' | 'suspended') => {
    return request.patch(`/users/${id}/status`, { status }) as Promise<any>;
  },

  // 管理员重置用户密码
  adminResetPassword: (id: string | number) => {
    return request.put(`/users/${id}/reset-password`) as Promise<any>;
  },

  // 修改密码
  updatePassword: async (data: any) => {
    const response = await request.post('/users/update-password', data);
    return response.data;
  },

  // 注销账号
  deleteAccount: (id: string | number) => {
    return request.delete(`/users/${id}/delete-account`) as Promise<any>;
  },
};
