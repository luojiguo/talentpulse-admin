/**
 * API服务层总出口
 * 将各个模块的API统一导出，方便组件调用
 */
import axios from 'axios';
import { message } from 'antd';

// 创建 axios 实例
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000, // 延长超时时间到15秒
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

// 添加重试机制的响应拦截器
const maxRetries = 2; // 最大重试次数
const retryDelay = 1000; // 初始重试延迟时间（毫秒）

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const { config, response } = error;

    // 如果配置不存在或没有重试次数，则直接返回错误
    if (!config || typeof config.retry === 'undefined') {
      config.retry = 0;
    }

    // 检查是否需要重试
    const shouldRetry = (
      config.retry < maxRetries &&
      (
        // 网络错误
        !response ||
        // 服务器错误
        response.status >= 500 ||
        // 请求超时
        error.code === 'ECONNABORTED' ||
        // 网络连接错误
        error.code === 'ERR_NETWORK'
      )
    );

    if (shouldRetry) {
      // 增加重试次数
      config.retry += 1;

      // 计算重试延迟（指数退避）
      const delay = Math.pow(2, config.retry) * retryDelay + Math.random() * 500;

      console.log(`请求失败，${delay}ms后重试 (${config.retry}/${maxRetries})`, error.message);

      // 延迟后重试请求
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(api(config));
        }, delay);
      });
    }

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
        // 登录页的401错误由登录组件自己处理，不显示通用提示
        if (!window.location.pathname.includes('/login')) {
          message.error('登录失效，请重新登录');
          localStorage.removeItem('token');
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
      case 503:
        message.error('服务器暂时不可用，请稍后重试');
        break;
      case 504:
        message.error('请求超时，请稍后重试');
        break;
      default:
        // 只有当有明确的错误信息时才提示，避免干扰
        // 登录页的错误由登录组件自己处理
        if (errorMessage && !window.location.pathname.includes('/login')) {
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
// export * from './aiService'; // AI功能已移除
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

// Config Service
// Config Service
const configAPI = {
  getDictionaries: () => api.get('/config/dictionaries').then(res => res.data),
};

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
  aiSessionAPI,
  configAPI
};

