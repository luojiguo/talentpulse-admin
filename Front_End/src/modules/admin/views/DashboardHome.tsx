import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, BarChart, Bar, LineChart, Line
} from 'recharts';
import { StatMetric, Language, ApplicationTrendData } from '@/types/types';
import StatCard from '../components/StatCard';

const DashboardHome: React.FC<{lang: Language, t: any, stats: StatMetric[], trends: ApplicationTrendData[], categories: any[], activity: any[], loading: boolean}> = ({ lang, t, stats, trends, categories, activity, loading }) => {
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
              {/* 趋势图 */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-800 dark:text-white text-lg">{t.dashboard.trends}</h3>
                  <div className="text-sm text-slate-500 dark:text-slate-400">最近6个月</div>
                </div>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={trends}>
                    <defs>
                      <linearGradient id="colorApplications" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorInterviews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(203, 213, 225, 0.2)" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: '#64748b', fontSize: 12 }} 
                      axisLine={{ stroke: '#e2e8f0' }} 
                      tickLine={{ stroke: '#e2e8f0' }}
                    />
                    <YAxis 
                      tick={{ fill: '#64748b', fontSize: 12 }} 
                      axisLine={{ stroke: '#e2e8f0' }} 
                      tickLine={{ stroke: '#e2e8f0' }}
                      grid={{ stroke: '#f1f5f9' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e2e8f0', 
                        borderRadius: '0.5rem',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      formatter={(value: any) => [`${value}`, '']}
                      labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="applications" 
                      stroke="#3b82f6" 
                      fillOpacity={1} 
                      fill="url(#colorApplications)" 
                      strokeWidth={3}
                      activeDot={{ r: 8, strokeWidth: 2 }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="interviews" 
                      stroke="#8b5cf6" 
                      fillOpacity={1} 
                      fill="url(#colorInterviews)" 
                      strokeWidth={3}
                      activeDot={{ r: 8, strokeWidth: 2 }}
                    />
                    <Legend 
                      iconType="line" 
                      layout="horizontal" 
                      verticalAlign="top" 
                      align="right"
                      wrapperStyle={{ paddingBottom: 10 }}
                      formatter={(value) => <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{value}</span>}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* 分类分布 */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-800 dark:text-white text-lg">{t.dashboard.category}</h3>
                  <div className="text-sm text-slate-500 dark:text-slate-400">职位分类占比</div>
                </div>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie 
                      data={categories} 
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
                      {categories.map((entry, index) => (
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
                </ResponsiveContainer>
              </div>
            </div>

            {/* 图表区域 - 第二行 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 柱状图 - 申请与面试对比 */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-800 dark:text-white text-lg">{t.dashboard.application_vs_interview}</h3>
                  <div className="text-sm text-slate-500 dark:text-slate-400">月度对比</div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(203, 213, 225, 0.2)" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: '#64748b', fontSize: 12 }} 
                      axisLine={{ stroke: '#e2e8f0' }} 
                    />
                    <YAxis 
                      tick={{ fill: '#64748b', fontSize: 12 }} 
                      axisLine={{ stroke: '#e2e8f0' }} 
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e2e8f0', 
                        borderRadius: '0.5rem',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Legend 
                      iconType="rect" 
                      layout="horizontal" 
                      verticalAlign="top" 
                      align="right"
                      wrapperStyle={{ paddingBottom: 10 }}
                      formatter={(value) => <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{value}</span>}
                    />
                    <Bar dataKey="applications" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="interviews" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              {/* 折线图 - 增长率 */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-800 dark:text-white text-lg">{t.dashboard.growth_rate}</h3>
                  <div className="text-sm text-slate-500 dark:text-slate-400">月度增长率</div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(203, 213, 225, 0.2)" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: '#64748b', fontSize: 12 }} 
                      axisLine={{ stroke: '#e2e8f0' }} 
                    />
                    <YAxis 
                      tick={{ fill: '#64748b', fontSize: 12 }} 
                      axisLine={{ stroke: '#e2e8f0' }} 
                      unit="%"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e2e8f0', 
                        borderRadius: '0.5rem',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      formatter={(value: any) => [`${value}%`, '增长率']}
                    />
                    <Legend 
                      iconType="line" 
                      layout="horizontal" 
                      verticalAlign="top" 
                      align="right"
                      wrapperStyle={{ paddingBottom: 10 }}
                      formatter={(value) => <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{value}</span>}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="applications" 
                      stroke="#3b82f6" 
                      strokeWidth={3} 
                      activeDot={{ r: 8 }}
                      dot={{ r: 6, strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 最近活动 */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-800 dark:text-white text-lg">{t.dashboard.activity}</h3>
                <div className="text-sm text-slate-500 dark:text-slate-400">最近10条动态</div>
              </div>
              <div className="space-y-4">
                  {activity.length > 0 ? (
                    activity.map((item, index) => (
                      <div 
                        key={item.id} 
                        className={`flex items-start gap-4 p-4 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all duration-300 border-l-4 ${item.status === 'success' ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-900/10' : item.status === 'warning' ? 'border-amber-500 bg-amber-50/30 dark:bg-amber-900/10' : 'border-blue-500 bg-blue-50/30 dark:bg-blue-900/10'}`}
                      >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${item.status === 'success' ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300' : item.status === 'warning' ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-300' : 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300'}`}>
                              {item.user && item.user.length > 0 ? item.user.charAt(0) : 'U'}
                          </div>
                          <div className="flex-1">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                                <span className="font-semibold text-slate-800 dark:text-slate-200">{item.user}</span>
                                <span className="text-slate-500 dark:text-slate-400">{item.action}</span>
                                <span className="font-semibold text-blue-600 dark:text-blue-400">{item.target}</span>
                              </div>
                              <div className="text-xs text-slate-400 dark:text-slate-500">{item.timestamp}</div>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-medium ${item.status === 'success' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300' : item.status === 'warning' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'}`}>
                              {item.status === 'success' ? '成功' : item.status === 'warning' ? '警告' : '信息'}
                          </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                      <div className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600">📋</div>
                      <p className="text-lg">暂无最近动态</p>
                      <p className="text-sm mt-2">系统活动将在此处显示</p>
                    </div>
                  )}
              </div>
            </div>
        </div>
    );
};

export default DashboardHome;