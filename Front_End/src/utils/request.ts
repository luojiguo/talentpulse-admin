import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// 定义接口响应格式
// 定义接口响应格式
// code: 业务状态码 (200表示成功)
// message: 响应消息或错误描述
// data: 响应数据载荷
// success: 业务操作是否成功
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  success: boolean;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// 创建axios实例
const service: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 在发送请求之前做些什么
    // 从本地存储获取 token 并添加到请求头
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: any) => {
    // 对请求错误做些什么
    // console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    // 对响应数据做点什么
    // 这里可以根据后端返回的状态码进行统一处理
    // 后端实际返回格式：{ status: 'success', data: ... } 或 { status: 'error', message: ... }

    // 如果是二进制响应（如Blob），直接返回原始响应，不进行处理
    if (response.config.responseType === 'blob' || response.config.responseType === 'arraybuffer') {
      return response;
    }

    const res = response.data;

    // 转换为前端期望的ApiResponse格式
    return {
      code: res.status === 'success' ? 200 : 500,
      message: res.message || (res.status === 'success' ? 'success' : 'error'),
      data: res.data,
      success: res.status === 'success',
      // 保留原始后端返回的所有字段
      ...res
    };
  },
  (error: any) => {
    // 对响应错误做点什么
    // console.error('响应错误:', error);

    if (error.response) {
      // 确保错误响应中的数据格式一致，保留errorCode等字段
      const errorData = error.response.data;
      // 扩展error对象，确保errorCode和message字段被正确传递
      error.response.data = {
        ...errorData,
        // 确保success字段为false
        success: false
      };

      const { status } = error.response;

      switch (status) {
        case 401:
          // 未授权，登录页的401错误由登录组件自己处理
          if (!window.location.pathname.includes('/login')) {
            // console.warn('未授权，请重新登录');
            // 清除可能导致问题的本地存储数据
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
          }
          break;
        case 403:
          // console.warn('拒绝访问');
          break;
        case 404:
          // console.warn('请求的资源不存在');
          break;
        case 500:
          // console.error('服务器内部错误');
          break;
        default:
        // console.error(`请求失败: ${status}`);
      }
    } else if (error.request) {
      // 请求已发出，但没有收到响应
      // console.error('网络连接异常，请检查网络');
    } else {
      // 在设置请求时发生错误
      // console.error('请求配置错误', error.message);
    }

    return Promise.reject(error);
  }
);

export default service;
