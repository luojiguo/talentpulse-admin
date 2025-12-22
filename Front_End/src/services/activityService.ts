import request from '@/utils/request';
import { ApiResponse } from '@/utils/request';

/**
 * 最近动态/活动相关API
 */
export const activityAPI = {
  // 获取最近动态列表
  getRecentActivity: (): Promise<any> => {
    return request.get('/api/activities');
  },
  // 获取系统日志列表
  getSystemLogs: (params?: {
    limit?: number;
    offset?: number;
    logType?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<any> => {
    return request.get('/api/activities/logs', { params });
  },
};
