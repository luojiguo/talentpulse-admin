import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// 定义接口响应格式
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
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: any) => {
    // 对请求错误做些什么
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    // 对响应数据做点什么
    // 这里可以根据后端返回的状态码进行统一处理
    // 假设后端直接返回数据，或者返回 { data: ..., code: ..., message: ... }
    
    // 如果后端返回的是标准格式
    const res = response.data;
    
    // 注意：这里需要根据实际后端返回格式进行调整
    // 如果后端直接返回数据对象，而不是包装在 { code: 200, data: ... } 中
    // 那么直接返回 res
    
    return res;
  },
  (error: any) => {
    // 对响应错误做点什么
    console.error('Response Error:', error);
    
    if (error.response) {
      const { status } = error.response;
      
      switch (status) {
        case 401:
          // 未授权，跳转到登录页
          console.warn('未授权，请重新登录');
          // 可以触发事件或直接跳转
          // window.location.href = '/login';
          break;
        case 403:
          console.warn('拒绝访问');
          break;
        case 404:
          console.warn('请求的资源不存在');
          break;
        case 500:
          console.error('服务器内部错误');
          break;
        default:
          console.error(`请求失败: ${status}`);
      }
    } else if (error.request) {
        // 请求已发出，但没有收到响应
        console.error('网络连接异常，请检查网络');
    } else {
        // 在设置请求时发生错误
        console.error('请求配置错误', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default service;
