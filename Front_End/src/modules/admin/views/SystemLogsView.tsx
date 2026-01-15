import React, { useState, useEffect } from 'react';
import { Search, Calendar, AlertCircle, CheckCircle, XCircle, Info, Filter, Download, X } from 'lucide-react';
import { TRANSLATIONS } from '@/constants/constants';
import { Language } from '@/types/types';
import { activityAPI } from '@/services/activityService';
import Pagination from '@/components/Pagination';
import { exportToCSV } from '../helpers';

interface SystemLog {
  id: number;
  userId?: number;
  userName?: string;
  userEmail?: string;
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
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [logTypeFilter, setLogTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState({
    time: true,
    type: true,
    action: true,
    description: true,
    user: true,
    ip: true,
    status: true,
    responseTime: true,
    control: true
  });
  const [showColumnModal, setShowColumnModal] = useState(false);

  // 详情弹窗状态
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);

  // 搜索防抖
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // 搜索时重置到第一页
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        setError(null);

        let startDate: string | undefined;
        let endDate: string | undefined;

        if (dateFilter !== 'all') {
          const now = new Date();
          const daysAgo = parseInt(dateFilter);
          const filterDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
          startDate = filterDate.toISOString();
          endDate = now.toISOString();
        }

        const response = await activityAPI.getSystemLogs({
          limit: pageSize,
          offset: (currentPage - 1) * pageSize,
          logType: logTypeFilter === 'all' ? undefined : logTypeFilter,
          startDate,
          endDate,
          search: debouncedSearch || undefined
        });

        if (response.status === 'success') {
          const mappedLogs = response.data.map((log: any) => ({
            id: log.id,
            userId: log.user_id,
            userName: log.user_name, // Map user_name
            userEmail: log.user_email, // Map user_email
            action: log.action,
            description: log.description,
            ipAddress: log.ip_address,
            createdAt: log.created_at,
            logType: log.log_type,
            resourceType: log.resource_type,
            resourceId: log.resource_id,
            requestMethod: log.request_method,
            requestUrl: log.request_url,
            responseStatus: log.response_status,
            responseTime: log.response_time,
            errorCode: log.error_code,
            errorMessage: log.error_message,
            userAgent: log.user_agent,
            deviceType: log.device_type,
            browser: log.browser,
            os: log.os,
            country: log.country,
            region: log.region,
            city: log.city
          }));
          setLogs(mappedLogs);
          setTotalItems(response.total || 0);
        }
      } catch (error) {
        console.error('获取系统日志失败:', error);
        setError(error instanceof Error ? error.message : t.logs.no_logs);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [currentPage, pageSize, logTypeFilter, dateFilter, debouncedSearch, lang]);

  const getLogTypeColor = (logType?: string) => {
    switch (logType) {
      case 'error': return 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300';
      case 'warning': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300';
      case 'info': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300';
      case 'login': return 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300';
      case 'logout': return 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300';
      case 'create': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300';
      case 'update': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300';
      case 'delete': return 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  const getLogTypeIcon = (logType?: string) => {
    switch (logType) {
      case 'error': return <XCircle className="w-4 h-4" />;
      case 'warning': return <AlertCircle className="w-4 h-4" />;
      case 'info': return <Info className="w-4 h-4" />;
      case 'login': return <CheckCircle className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  const getLogTypeText = (logType?: string) => {
    switch (logType) {
      case 'error': return t.logs.error;
      case 'warning': return t.logs.warning;
      case 'info': return t.logs.info;
      case 'login': return t.logs.login;
      case 'logout': return t.logs.logout;
      case 'create': return t.logs.create;
      case 'update': return t.logs.update;
      case 'delete': return t.logs.delete;
      default: return logType || t.logs.unknown;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex gap-4 justify-between items-center flex-wrap">
          <div className="flex gap-2 items-center w-full md:w-auto">
            <Search className="text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder={t.logs.search_placeholder}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-transparent focus:outline-none text-sm w-full md:w-64 dark:text-white"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={logTypeFilter}
              onChange={e => setLogTypeFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            >
              <option value="all">{t.common.all + t.logs.type}</option>
              <option value="login">{t.logs.login}</option>
              <option value="logout">{t.logs.logout}</option>
              <option value="create">{t.logs.create}</option>
              <option value="update">{t.logs.update}</option>
              <option value="delete">{t.logs.delete}</option>
              <option value="error">{t.logs.error}</option>
              <option value="warning">{t.logs.warning}</option>
              <option value="info">{t.logs.info}</option>
            </select>
            <select
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            >
              <option value="all">{t.common.all + t.logs.time}</option>
              <option value="1">{t.logs.prev_day}</option>
              <option value="7">{t.logs.prev_7}</option>
              <option value="30">{t.logs.prev_30}</option>
              <option value="90">{t.logs.prev_90}</option>
            </select>
            <button
              onClick={() => exportToCSV(logs, 'system_logs')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white text-sm font-medium rounded-lg hover:bg-slate-900 transition-all"
              disabled={loading}
            >
              <Download size={16} /> {t.common.export}
            </button>
          </div>
        </div>
        <div className="flex gap-2 p-4 pt-0">
          <button
            onClick={() => setShowColumnModal(true)}
            className="bg-slate-100 dark:bg-slate-700 border-none rounded-lg text-sm px-4 py-2 focus:ring-2 focus:ring-blue-500 flex items-center gap-2 dark:text-slate-300"
          >
            <Filter size={16} className="text-slate-500" />
            <span>{t.users.columnSettings}</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
            <tr>
              {visibleColumns.time && <th className="px-6 py-3 text-left whitespace-nowrap">{t.logs.time}</th>}
              {visibleColumns.type && <th className="px-6 py-3 text-left whitespace-nowrap">{t.logs.type}</th>}
              {visibleColumns.action && <th className="px-6 py-3 text-left">{t.common.action}</th>}
              {visibleColumns.description && <th className="px-6 py-3 text-left">{t.logs.description}</th>}
              {visibleColumns.user && <th className="px-6 py-3 text-left whitespace-nowrap">{t.logs.user}</th>}
              {visibleColumns.ip && <th className="px-6 py-3 text-left whitespace-nowrap">{t.logs.ip}</th>}
              {visibleColumns.status && <th className="px-6 py-3 text-left whitespace-nowrap">{t.logs.status_code}</th>}
              {visibleColumns.responseTime && <th className="px-6 py-3 text-left whitespace-nowrap">{t.logs.response_time}</th>}
              {visibleColumns.control && <th className="px-6 py-3 text-left whitespace-nowrap">{t.common.action}</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={Object.values(visibleColumns).filter(Boolean).length} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                  {t.common.loading}
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={Object.values(visibleColumns).filter(Boolean).length} className="px-6 py-8 text-center text-red-500">
                  <div className="flex flex-col items-center gap-2">
                    <AlertCircle className="w-8 h-8 text-red-400" />
                    <p>{t.common.no_data}: {error}</p>
                    <button
                      onClick={() => {
                        setLoading(true);
                        setCurrentPage(1);
                        setDebouncedSearch(searchTerm + ' ');
                        setTimeout(() => setDebouncedSearch(searchTerm), 10);
                      }}
                      className="mt-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium transition-colors"
                    >
                      {t.common.retry}
                    </button>
                  </div>
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={Object.values(visibleColumns).filter(Boolean).length} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                  {searchTerm || logTypeFilter !== 'all' || dateFilter !== 'all' ? t.logs.no_match : t.logs.no_logs}
                </td>
              </tr>
            ) : (
              logs.map(log => (
                <tr
                  key={log.id}
                  className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600/50 cursor-pointer"
                  onClick={() => setSelectedLog(log)}
                >
                  {visibleColumns.time && <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      {new Date(log.createdAt).toLocaleString(lang === 'zh' ? 'zh-CN' : 'en-US')}
                    </div>
                  </td>}
                  {visibleColumns.type && <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full flex items-center gap-1 w-fit ${getLogTypeColor(log.logType)}`}>
                      {getLogTypeIcon(log.logType)}
                      {getLogTypeText(log.logType)}
                    </span>
                  </td>}
                  {visibleColumns.action && <td className="px-6 py-4 font-medium text-slate-900 dark:text-white max-w-[200px] truncate" title={log.action}>
                    {log.action}
                  </td>}
                  {visibleColumns.description && <td className="px-6 py-4 text-slate-600 dark:text-slate-400 max-w-[300px] truncate" title={log.description || ''}>
                    {log.description || '-'}
                  </td>}
                  {visibleColumns.user && <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-900 dark:text-white">{log.userName || log.userId || '-'}</span>
                      {log.userEmail && <span className="text-xs text-slate-400">{log.userEmail}</span>}
                    </div>
                  </td>}
                  {visibleColumns.ip && <td className="px-6 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {log.ipAddress || '-'}
                  </td>}
                  {visibleColumns.status && <td className="px-6 py-4 whitespace-nowrap">
                    {log.responseStatus ? (
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${log.responseStatus >= 200 && log.responseStatus < 300 ? 'bg-green-100 text-green-700' : log.responseStatus >= 400 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {log.responseStatus}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">-</span>
                    )}
                  </td>}
                  {visibleColumns.responseTime && <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                    {log.responseTime ? `${log.responseTime}ms` : '-'}
                  </td>}
                  {visibleColumns.control && <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      className="text-blue-600 dark:text-blue-400 hover:underline text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLog(log);
                      }}
                    >
                      {t.common.details}
                    </button>
                  </td>}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-2 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
        <Pagination
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={(page) => setCurrentPage(page)}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1); // 重置到第一页
          }}
        />
      </div>

      {/* Column Settings Modal */}
      {showColumnModal && (
        <div className="fixed inset-0 bg-black/30 z-[70]" onClick={() => setShowColumnModal(false)}>
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b pb-4 dark:border-slate-700 mb-4">
              <h2 className="text-xl font-bold dark:text-white">{t.users.columnSettings}</h2>
              <button onClick={() => setShowColumnModal(false)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              {[
                { key: 'time', label: t.logs.time },
                { key: 'type', label: t.logs.type },
                { key: 'action', label: t.common.action },
                { key: 'description', label: t.logs.description },
                { key: 'user', label: t.logs.user },
                { key: 'ip', label: t.logs.ip },
                { key: 'status', label: t.logs.status_code },
                { key: 'responseTime', label: t.logs.response_time },
                { key: 'control', label: t.common.action },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
                  <input
                    type="checkbox"
                    checked={visibleColumns[key as keyof typeof visibleColumns]}
                    onChange={(e) => setVisibleColumns(prev => ({ ...prev, [key]: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-slate-800 dark:bg-slate-700 dark:border-slate-600"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <button
                onClick={() => setShowColumnModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t.common.confirm}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 日志详情弹窗 */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={() => setSelectedLog(null)}>
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${getLogTypeColor(selectedLog.logType)}`}>
                  {getLogTypeIcon(selectedLog.logType)}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">{t.logs.details_title}</h3>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">{selectedLog.logType} | ID: {selectedLog.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* 核心信息 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <p className="text-xs text-slate-400">{t.logs.time}</p>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{new Date(selectedLog.createdAt).toLocaleString(lang === 'zh' ? 'zh-CN' : 'en-US')}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-400">{t.logs.user} ID / IP</p>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {selectedLog.userName ? `${selectedLog.userName} (ID: ${selectedLog.userId})` : (selectedLog.userId || 'System')} | {selectedLog.ipAddress || 'Unknown'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-400">{t.logs.status_code}</p>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-md ${selectedLog.responseStatus && selectedLog.responseStatus < 300 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {selectedLog.responseStatus || '-'}
                    </span>
                    <span className="text-xs text-slate-500">{selectedLog.responseTime ? `${selectedLog.responseTime}ms` : ''}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-400">{t.logs.location}</p>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {[selectedLog.country, selectedLog.region, selectedLog.city].filter(Boolean).join(' - ') || 'Local/Intranet'}
                  </p>
                </div>
              </div>

              {/* 文本内容 */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                    <Info size={14} className="text-blue-500" /> {t.common.action}
                  </label>
                  <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 p-4 rounded-xl text-slate-800 dark:text-slate-200 font-medium">
                    {selectedLog.action}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                    <Filter size={14} className="text-emerald-500" /> {t.logs.description}
                  </label>
                  <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-4 rounded-xl text-slate-700 dark:text-slate-400 text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedLog.description || t.common.no_data}
                  </div>
                </div>
              </div>

              {/* 技术元数据 */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase">{t.logs.tech_meta}</label>
                <div className="text-[11px] font-mono bg-slate-900 border border-slate-800 text-slate-300 p-4 rounded-xl overflow-x-auto space-y-1">
                  <p><span className="text-blue-400">{t.logs.request}:</span> {selectedLog.requestMethod} {selectedLog.requestUrl}</p>
                  <p><span className="text-purple-400">{t.logs.resource}:</span> {selectedLog.resourceType} (ID: {selectedLog.resourceId || 'N/A'})</p>
                  <p><span className="text-emerald-400">UA:</span> {selectedLog.userAgent}</p>
                  <p><span className="text-yellow-400">{t.logs.device}:</span> {selectedLog.os} / {selectedLog.browser} ({selectedLog.deviceType})</p>
                  {selectedLog.errorCode && (
                    <p className="text-red-400 pt-1 border-t border-slate-800 mt-1">
                      Error: {selectedLog.errorCode} - {selectedLog.errorMessage}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-right">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-6 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-600 transition-all shadow-sm"
              >
                {t.common.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemLogsView;
