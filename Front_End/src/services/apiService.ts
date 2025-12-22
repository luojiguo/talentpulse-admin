/**
 * API服务层总出口
 * 将各个模块的API统一导出，方便组件调用
 */
import axios from 'axios';
import { message } from 'antd';

// 创建 axios 实例
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const { response } = error;

    // 网络错误或无响应
    if (!response) {
      message.error('网络连接失败，请检查网络设置');
      return Promise.reject(error);
    }

    // 处理常见错误状态码
    const errorMessage = response.data?.message || '请求失败';

    switch (response.status) {
      case 401:
        // 未授权，清除 token 并跳转登录 (如果不在登录页)
        message.error('登录失效，请重新登录');
        localStorage.removeItem('token');
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        break;
      case 403:
        message.error('没有权限执行此操作');
        break;
      case 404:
        // 404错误通常由具体业务处理，这里只做通用提示或忽略
        // message.error('请求的资源不存在'); 
        break;
      case 500:
        message.error('服务器内部错误，请稍后重试');
        break;
      default:
        // 只有当有明确的错误信息时才提示，避免干扰
        if (errorMessage) {
          message.error(errorMessage);
        }
    }

    return Promise.reject(error);
  }
);

// 导出基础 axios 实例供特殊需求使用
export { api };

// 统一导出各个服务的 API 对象
export * from './userService';
export * from './jobService';
export * from './companyService';
export * from './candidateService';
export * from './messageService';
export * from './applicationService';
export * from './resumeService';
export * from './aiService';
export * from './recruiterService';
export * from './interviewService';
export * from './analyticsService';
export * from './activityService';
export * from './aiSessionService';

// 为了向后兼容，同时导出命名对象
import { userAPI } from './userService';
import { jobAPI } from './jobService';
import { companyAPI } from './companyService';
import { candidateAPI } from './candidateService';
import { messageAPI } from './messageService';
import { applicationAPI } from './applicationService';
import { resumeAPI } from './resumeService';
import { recruiterAPI } from './recruiterService';
import { interviewAPI } from './interviewService';
import { analyticsAPI } from './analyticsService';
import { activityAPI } from './activityService';
import { aiSessionAPI } from './aiSessionService';

export {
  userAPI,
  jobAPI,
  companyAPI,
  candidateAPI,
  messageAPI,
  applicationAPI,
  resumeAPI,
  recruiterAPI,
  interviewAPI,
  analyticsAPI,
  activityAPI,
  aiSessionAPI
};
