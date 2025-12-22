import React, { useState, useEffect, useMemo } from 'react';
import { Search, Calendar, AlertCircle, CheckCircle, XCircle, Info, Filter } from 'lucide-react';
import { TRANSLATIONS } from '@/constants/constants';
import { Language } from '@/types/types';

interface SystemLog {
  id: number;
  userId?: number;
  action: string;
  description?: string;
  ipAddress?: string;
  logType?: 'login' | 'logout' | 'create' | 'update' | 'delete' | 'error' | 'warning' | 'info';
  resourceType?: string;
  resourceId?: number;
  requestMethod?: string;
  requestUrl?: string;
  responseStatus?: number;
  responseTime?: number;
  errorCode?: string;
  errorMessage?: string;
  userAgent?: string;
  deviceType?: 'desktop' | 'mobile' | 'tablet';
  browser?: string;
  os?: string;
  country?: string;
  region?: string;
  city?: string;
  createdAt: string;
}

const SystemLogsView: React.FC<{ lang: Language }> = ({ lang }) => {
  const t = TRANSLATIONS[lang];
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [logTypeFilter, setLogTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        // TODO: 创建system logs API endpoint
        // const response = await systemLogsAPI.getAllLogs();
        // if (response.status === 'success') {
        //   setLogs(response.data || []);
        // }
        // 临时使用空数组
        setLogs([]);
      } catch (error) {
        console.error('获取系统日志失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = searchTerm === '' || 
        log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.userId?.toString().includes(searchTerm);
      
      const matchesType = logTypeFilter === 'all' || log.logType === logTypeFilter;
      
      // 日期筛选
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const logDate = new Date(log.createdAt);
        const now = new Date();
        const daysAgo = parseInt(dateFilter);
        const filterDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        matchesDate = logDate >= filterDate;
      }
      
      return matchesSearch && matchesType && matchesDate;
    });
  }, [logs, searchTerm, logTypeFilter, dateFilter]);

  const getLogTypeColor = (logType?: string) => {
    switch(logType) {
      case 'error': return 'bg-red-100 text-red-700';
      case 'warning': return 'bg-yellow-100 text-yellow-700';
      case 'info': return 'bg-blue-100 text-blue-700';
      case 'login': return 'bg-green-100 text-green-700';
      case 'logout': return 'bg-gray-100 text-gray-700';
      case 'create': return 'bg-emerald-100 text-emerald-700';
      case 'update': return 'bg-blue-100 text-blue-700';
      case 'delete': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getLogTypeIcon = (logType?: string) => {
    switch(logType) {
      case 'error': return <XCircle className="w-4 h-4" />;
      case 'warning': return <AlertCircle className="w-4 h-4" />;
      case 'info': return <Info className="w-4 h-4" />;
      case 'login': return <CheckCircle className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  const getLogTypeText = (logType?: string) => {
    switch(logType) {
      case 'error': return '错误';
      case 'warning': return '警告';
      case 'info': return '信息';
      case 'login': return '登录';
      case 'logout': return '登出';
      case 'create': return '创建';
      case 'update': return '更新';
      case 'delete': return '删除';
      default: return logType || '未知';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">系统日志</h1>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex gap-4 justify-between items-center flex-wrap">
          <div className="flex gap-2 items-center w-full md:w-auto">
            <Search className="text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="搜索操作、描述、用户ID..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              className="bg-transparent focus:outline-none text-sm w-full md:w-64"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={logTypeFilter}
              onChange={e => setLogTypeFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全部类型</option>
              <option value="login">登录</option>
              <option value="logout">登出</option>
              <option value="create">创建</option>
              <option value="update">更新</option>
              <option value="delete">删除</option>
              <option value="error">错误</option>
              <option value="warning">警告</option>
              <option value="info">信息</option>
            </select>
            <select
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全部时间</option>
              <option value="1">最近1天</option>
              <option value="7">最近7天</option>
              <option value="30">最近30天</option>
              <option value="90">最近90天</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
              <tr>
                <th className="px-6 py-3 text-left">时间</th>
                <th className="px-6 py-3 text-left">类型</th>
                <th className="px-6 py-3 text-left">操作</th>
                <th className="px-6 py-3 text-left">描述</th>
                <th className="px-6 py-3 text-left">用户ID</th>
                <th className="px-6 py-3 text-left">IP地址</th>
                <th className="px-6 py-3 text-left">状态码</th>
                <th className="px-6 py-3 text-left">响应时间</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                    加载中...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                    {logs.length === 0 ? '暂无系统日志' : '没有找到匹配的日志'}
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {new Date(log.createdAt).toLocaleString('zh-CN')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full flex items-center gap-1 w-fit ${getLogTypeColor(log.logType)}`}>
                        {getLogTypeIcon(log.logType)}
                        {getLogTypeText(log.logType)}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                      {log.action}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {log.description || '-'}
                    </td>
                    <td className="px-6 py-4">
                      {log.userId || '-'}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {log.ipAddress || '-'}
                    </td>
                    <td className="px-6 py-4">
                      {log.responseStatus ? (
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                          log.responseStatus >= 200 && log.responseStatus < 300 
                            ? 'bg-green-100 text-green-700' 
                            : log.responseStatus >= 400 
                            ? 'bg-red-100 text-red-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {log.responseStatus}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {log.responseTime ? `${log.responseTime}ms` : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SystemLogsView;

