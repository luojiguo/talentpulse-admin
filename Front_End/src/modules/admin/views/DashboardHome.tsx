import React, { useState, useEffect } from 'react';

import {
  User, Building2, Briefcase, FileText, Calendar,
  UserPlus, MessageSquare, Clock, Activity, CheckCircle, AlertCircle
} from 'lucide-react';
import { StatMetric, Language, ApplicationTrendData } from '@/types/types';
import StatCard from '../components/StatCard';
import { formatDateTime } from '@/utils/dateUtils';
import Pagination from '@/components/Pagination';


const DashboardHome: React.FC<{ lang: Language, t: any, stats: StatMetric[], trends: any[], categories: any[], activity: any[], loading: boolean }> = ({ lang, t, stats, activity, loading }) => {
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);



  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-lg text-slate-600 dark:text-slate-400">{t.dashboard.loading}</p>
        </div>
      </div>
    );
  }

  // 计算分页后的活动数据
  const paginatedActivity = activity.slice((currentPage - 1) * pageSize, currentPage * pageSize);







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
          <p className="text-xs text-slate-400 dark:text-slate-500">{new Date().toLocaleString(lang === 'zh' ? 'zh-CN' : 'en-US')}</p>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={stat.id} className="group relative overflow-hidden">
            <StatCard
              metric={stat}
              className="transform transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
            />
          </div>
        ))}
      </div>





      {/* 最近活动 */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow duration-300">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-slate-800 dark:text-white text-lg">{t.dashboard.activity}</h3>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {activity.length > 0 && `${t.dashboard.showing} ${(currentPage - 1) * pageSize + 1} - ${Math.min(currentPage * pageSize, activity.length)} ${t.dashboard.to} ${activity.length} ${t.dashboard.records}`}
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
                          {t.dashboard.important}
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
              <p className="text-lg">{t.dashboard.no_activity}</p>
              <p className="text-sm mt-2">{t.dashboard.activity_desc}</p>
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
