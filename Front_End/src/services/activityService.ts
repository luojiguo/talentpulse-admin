import request from '@/utils/request';

/**
 * 最近动态/活动相关API
 */
export const activityAPI = {
  // 获取最近动态列表
  getRecentActivity: () => {
    return request.get('/activities');
  },
};
