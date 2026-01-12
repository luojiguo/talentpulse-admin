import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import {
  User, Building2, Briefcase, FileText, Calendar,
  UserPlus, MessageSquare, Clock, Activity, CheckCircle, AlertCircle
} from 'lucide-react';
import { StatMetric, Language, ApplicationTrendData } from '@/types/types';
import StatCard from '../components/StatCard';
import { formatDateTime } from '@/utils/dateUtils';
import Pagination from '@/components/Pagination';
import { analyticsAPI } from '@/services/apiService';

const DashboardHome: React.FC<{ lang: Language, t: any, stats: StatMetric[], trends: any[], categories: any[], activity: any[], loading: boolean }> = ({ lang, t, stats, trends, categories, activity, loading }) => {
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 趋势图数据状态
  const [activePeriod, setActivePeriod] = useState<'day' | 'week' | 'month'>('month');
  const [periodCount, setPeriodCount] = useState<number>(6);
  const [visitorTrends, setVisitorTrends] = useState<any[]>(trends);
  const [trendsLoading, setTrendsLoading] = useState(false);

  // 初始化trends数据
  useEffect(() => {
    if (trends && trends.length > 0) {
      setVisitorTrends(trends);
    }
  }, [trends]);

  // 监听维度或数量变化，自动获取数据
  useEffect(() => {
    const fetchData = async () => {
      setTrendsLoading(true);
      try {
        const response = await analyticsAPI.getVisitorTrends(activePeriod, periodCount);
        if (response && response.data && response.data.data) {
          setVisitorTrends(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch visitor trends:', error);
      } finally {
        setTrendsLoading(false);
      }
    };

    // 避免首次渲染重复请求(如果props已有数据)，但为了简单起见，切换时总是请求
    // 实际项目中可以加个标记判断是否是首次
    fetchData();
  }, [activePeriod, periodCount]);

  const handlePeriodChange = (period: 'day' | 'week' | 'month') => {
    if (period === activePeriod) return;
    setActivePeriod(period);
    // 重置默认数量
    setPeriodCount(period === 'day' ? 1 : period === 'week' ? 1 : 6);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-lg text-slate-600 dark:text-slate-400">正在加载仪表盘数据...</p>
        </div>
      </div>
    );
  }

  // 计算分页后的活动数据
  const paginatedActivity = activity.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // 计算统计卡片的颜色主题
  const cardColors = [
    'bg-gradient-to-br from-blue-500 to-blue-600',
    'bg-gradient-to-br from-purple-500 to-purple-600',
    'bg-gradient-to-br from-pink-500 to-pink-600',
    'bg-gradient-to-br from-green-500 to-green-600',
    'bg-gradient-to-br from-amber-500 to-amber-600',
    'bg-gradient-to-br from-cyan-500 to-cyan-600',
    'bg-gradient-to-br from-indigo-500 to-indigo-600',
    'bg-gradient-to-br from-rose-500 to-rose-600'
  ];

  // 2. 职位分类分布数据 - 使用真实数据或默认数据
  const jobCategories = categories && categories.length > 0 ? categories : [
    { name: '暂无数据', value: 1, color: '#e2e8f0' }
  ];



  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t.dashboard.title}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{t.dashboard.subtitle}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500 dark:text-slate-400">{t.dashboard.last_updated}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">{new Date().toLocaleString()}</p>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={stat.id} className="group relative overflow-hidden">
            <StatCard
              metric={stat}
              className={`transform transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${cardColors[index % cardColors.length]}`}
            />
            <div className="absolute -bottom-1 left-0 w-full h-1 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
          </div>
        ))}
      </div>

      {/* 图表区域 - 第一行 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 趋势图 - 访问量与注册量 */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow duration-300 relative group">
          {trendsLoading && (
            <div className="absolute inset-0 bg-white/60 dark:bg-slate-800/60 z-10 flex items-center justify-center rounded-xl backdrop-blur-[2px] transition-all duration-300">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="mt-2 text-sm text-slate-500 font-medium">加载数据...</div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-xl">访问量与注册量趋势</h3>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm text-slate-500">最近</span>
                  <input
                    type="number"
                    min="1"
                    max={activePeriod === 'day' ? 30 : 12}
                    value={periodCount}
                    onChange={(e) => setPeriodCount(Math.max(1, Math.min(activePeriod === 'day' ? 30 : 12, parseInt(e.target.value) || 1)))}
                    className="w-16 px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded bg-transparent focus:outline-none focus:border-blue-500 text-center dark:text-slate-300"
                  />
                  <span className="text-sm text-slate-500">
                    {activePeriod === 'day' ? '天 (按小时)' : activePeriod === 'week' ? '周 (按天)' : '个月 (按天)'}
                  </span>
                </div>
              </div>

              <div className="flex bg-slate-100 dark:bg-slate-700/50 p-1 rounded-xl self-start sm:self-auto">
                {(['day', 'week', 'month'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => handlePeriodChange(period)}
                    className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all duration-300 ${activePeriod === period
                      ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm transform scale-105'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-600/50'
                      }`}
                  >
                    {period === 'day' ? '日' : period === 'week' ? '周' : '月'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ width: '100%', height: 350 }}>
            {visitorTrends && visitorTrends.length > 0 ? (
              <ResponsiveContainer>
                <LineChart data={visitorTrends} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(203, 213, 225, 0.3)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                    interval="preserveStartEnd"
                    padding={{ left: 20, right: 20 }}
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fill: '#3b82f6', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    dx={-10}
                    label={{ value: '访问量', angle: -90, position: 'insideLeft', fill: '#3b82f6', style: { textAnchor: 'middle' } }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fill: '#10b981', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    dx={10}
                    label={{ value: '注册量', angle: 90, position: 'insideRight', fill: '#10b981', style: { textAnchor: 'middle' } }}
                  />
                  <Tooltip
                    cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '3 3' }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white dark:bg-slate-800 p-4 border border-slate-100 dark:border-slate-700 rounded-xl shadow-xl backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95">
                            <p className="font-bold text-slate-700 dark:text-slate-200 mb-3 border-b border-slate-100 dark:border-slate-700 pb-2">
                              {label}
                            </p>
                            <div className="space-y-3">
                              {payload.map((entry: any, index: number) => (
                                <div key={index} className="flex items-center justify-between gap-6 min-w-[140px]">
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-2 h-8 rounded-sm"
                                      style={{ backgroundColor: entry.color }}
                                    ></div>
                                    <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">{entry.name}</span>
                                  </div>
                                  <span className="font-bold text-lg" style={{ color: entry.color }}>
                                    {entry.value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="visitors"
                    name="访问量"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 7, strokeWidth: 0 }}
                    animationDuration={1500}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="registrations"
                    name="注册量"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 7, strokeWidth: 0 }}
                    animationDuration={1500}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="plainline"
                    iconSize={20}
                    formatter={(value) => <span className="text-sm font-bold text-slate-600 dark:text-slate-300 ml-2">{value}</span>}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                暂无趋势数据
              </div>
            )}
          </div>
        </div>

        {/* 分类分布 - 职位分类分布 */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 dark:text-white text-lg">职位分类分布</h3>
            <div className="text-sm text-slate-500 dark:text-slate-400">职位数量占比</div>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            {jobCategories.length > 0 && jobCategories[0].name !== '暂无数据' ? (
              <PieChart>
                <Pie
                  data={jobCategories}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  innerRadius={60}
                  paddingAngle={2}
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {jobCategories.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke="white"
                      strokeWidth={2}
                      className="hover:opacity-90 transition-opacity duration-300"
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [`${value} 个职位`, '数量']}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend
                  iconType="circle"
                  layout="vertical"
                  align="center"
                  verticalAlign="bottom"
                  wrapperStyle={{ paddingTop: 20 }}
                  formatter={(value) => <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{value}</span>}
                />
              </PieChart>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <div className="text-4xl mb-2">📊</div>
                <p>暂无职位分布数据</p>
              </div>
            )}
          </ResponsiveContainer>
        </div>
      </div>



      {/* 最近活动 */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow duration-300">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-slate-800 dark:text-white text-lg">{t.dashboard.activity}</h3>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {activity.length > 0 && `显示 ${(currentPage - 1) * pageSize + 1} - ${Math.min(currentPage * pageSize, activity.length)} 共 ${activity.length} 条动态`}
          </div>
        </div>
        <div className="space-y-4">
          {paginatedActivity.length > 0 ? (
            paginatedActivity.map((item: any, index: number) => {
              // Helper to get icon based on type
              const getActivityIcon = (type: string) => {
                switch (type) {
                  case 'user': return <User size={18} />;
                  case 'company': return <Building2 size={18} />;
                  case 'job': return <Briefcase size={18} />;
                  case 'application': return <FileText size={18} />;
                  case 'interview': return <Calendar size={18} />;
                  case 'onboarding': return <UserPlus size={18} />;
                  case 'message': return <MessageSquare size={18} />;
                  default: return <Activity size={18} />;
                }
              };

              return (
                <div
                  key={item.id || index}
                  className={`flex items-start gap-4 p-4 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all duration-300 border-l-4 ${item.priority >= 3 ? 'border-purple-500 bg-purple-50/30' :
                    item.status === 'success' ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-900/10' :
                      item.status === 'warning' ? 'border-amber-500 bg-amber-50/30 dark:bg-amber-900/10' :
                        'border-blue-500 bg-blue-50/30 dark:bg-blue-900/10'
                    }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${item.priority >= 3 ? 'bg-purple-100 text-purple-600' :
                    item.status === 'success' ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300' :
                      item.status === 'warning' ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-300' :
                        'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300'
                    }`}>
                    {getActivityIcon(item.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{item.user}</span>
                      <span className="text-slate-500 dark:text-slate-400">{item.action}</span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">{item.target}</span>
                      {item.priority >= 3 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200 ml-auto sm:ml-2">
                          重要
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <Clock size={12} />
                      {formatDateTime(item.timestamp)}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              <div className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600">📋</div>
              <p className="text-lg">暂无最近动态</p>
              <p className="text-sm mt-2">系统活动将在此处显示</p>
            </div>
          )}
        </div>

        {/* 分页组件 */}
        {activity.length > 0 && (
          <div className="mt-6 flex justify-end">
            <Pagination
              currentPage={currentPage}
              pageSize={pageSize}
              totalItems={activity.length}
              onPageChange={(page) => setCurrentPage(page)}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
            />
          </div>
        )}
      </div>
    </div >
  );
};

export default DashboardHome;
