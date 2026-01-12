import request from '@/utils/request';

/**
 * 数据分析相关API
 */
export const analyticsAPI = {
  // 获取仪表盘统计数据
  getDashboardData: () => {
    return request.get('/analytics/dashboard');
  },

  // 获取访问量趋势数据 (支持自定义维度和范围)
  getVisitorTrends: (dimension: 'day' | 'week' | 'month' = 'month', count: number = 1) => {
    return request.get('/analytics/visitor-trends', {
      params: { dimension, count }
    });
  },

  // 获取招聘漏斗数据
  getFunnelData: () => {
    return request.get('/analytics/funnel');
  },

  // 获取平均招聘周期数据
  getTimeToHireData: () => {
    return request.get('/analytics/time-to-hire');
  },
  getTimeToHire: () => {
    return request.get('/analytics/time-to-hire');
  },

  // 获取候选人来源质量数据
  getSourceQualityData: () => {
    return request.get('/analytics/source-quality');
  },
  getSourceQuality: () => {
    return request.get('/analytics/source-quality');
  },
};
