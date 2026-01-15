import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Calendar, Clock, MapPin, User, FileText, CheckCircle, XCircle, AlertCircle, Download, Settings, Check } from 'lucide-react';
import { TRANSLATIONS } from '@/constants/constants';
import { interviewAPI } from '@/services/apiService';
import { Language } from '@/types/types';
import Pagination from '@/components/Pagination';
import { exportToCSV } from '../helpers';

interface Interview {
  id: number;
  applicationId: number;
  interviewDate: string;
  interviewTime: string;
  interviewTimeEnd?: string;
  location: string;
  interviewerId: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'accepted' | 'rejected' | 'pending';
  notes?: string;
  interviewRound: number;
  interviewType: '电话' | '视频' | '现场';
  interviewTopic?: string;
  interviewDuration: number;
  interviewerName?: string;
  interviewerPosition?: string;
  interviewResult?: '通过' | '未通过' | '待定';
  interviewFeedback?: string;
  candidateName?: string;
  candidateAvatar?: string;
  candidateEmail?: string;
  candidatePhone?: string;
  jobTitle?: string;
  jobLocation?: string;
  jobSalary?: string;
  companyName?: string;
  companyLogo?: string;
}

const InterviewsView: React.FC<{ lang: Language }> = ({ lang }) => {
  const t = TRANSLATIONS[lang];
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Column visibility state
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const [visibleColumns, setVisibleColumns] = useState({
    candidate: true,
    job: true,
    company: true,
    date: true,
    time: true,
    endTime: true,
    type: false,
    round: true,
    status: true,
    result: true,
    email: false,
    phone: false,
    interviewer: false,
    location: true,
    notes: false,
    feedback: false
  });

  // Click outside handler for column settings popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowColumnSettings(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        setLoading(true);
        const response = await interviewAPI.getAllInterviews();
        if ((response as any).status === 'success') {
          setInterviews(response.data || []);
        }
      } catch (error) {
        console.error('获取面试数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInterviews();
  }, []);

  const filteredInterviews = useMemo(() => {
    return interviews.filter(interview => {
      const matchesSearch = searchTerm === '' ||
        interview.candidateName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        interview.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        interview.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        interview.interviewerName?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || interview.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [interviews, searchTerm, statusFilter]);

  // 计算分页数据
  const paginatedInterviews = useMemo(() => {
    setTotalItems(filteredInterviews.length);
    const startIndex = (currentPage - 1) * pageSize;
    return filteredInterviews.slice(startIndex, startIndex + pageSize);
  }, [filteredInterviews, currentPage, pageSize]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300';
      case 'accepted': return 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300';
      case 'completed': return 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300';
      case 'cancelled': return 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300';
      case 'rejected': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300';
      case 'pending': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return '已安排';
      case 'accepted': return '已接受';
      case 'completed': return '已完成';
      case 'cancelled': return '已取消';
      case 'rejected': return '已拒绝';
      case 'pending': return '待确认';
      default: return status;
    }
  };

  const getResultColor = (result?: string) => {
    switch (result) {
      case '通过': return 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300';
      case '未通过': return 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300';
      case '待定': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300';
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
              placeholder="搜索候选人、职位、面试官..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-transparent focus:outline-none text-sm w-full md:w-64 text-slate-900 dark:text-white"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全部状态</option>
              <option value="scheduled">已安排</option>
              <option value="pending">待确认</option>
              <option value="accepted">已接受</option>
              <option value="completed">已完成</option>
              <option value="cancelled">已取消</option>
              <option value="rejected">已拒绝</option>
            </select>

            <div className="relative" ref={settingsRef}>
              <button
                onClick={() => setShowColumnSettings(!showColumnSettings)}
                className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                title="列设置"
              >
                <Settings size={20} />
              </button>

              {showColumnSettings && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 p-4">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <Settings size={16} />
                    显示/隐藏列
                  </h4>
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-2 text-xs">
                    {Object.entries(visibleColumns).map(([key, isVisible]) => (
                      <button
                        key={key}
                        onClick={() => setVisibleColumns(prev => ({ ...prev, [key]: !isVisible }))}
                        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group text-slate-900 dark:text-white"
                      >
                        <span className="capitalize">{
                          key === 'candidate' ? '候选人' :
                            key === 'job' ? '职位' :
                              key === 'company' ? '公司' :
                                key === 'date' ? '面试日期' :
                                  key === 'time' ? '开始时间' :
                                    key === 'endTime' ? '结束时间' :
                                      key === 'type' ? '面试类型' :
                                        key === 'round' ? '轮次' :
                                          key === 'status' ? '状态' :
                                            key === 'result' ? '结果' :
                                              key === 'email' ? '邮箱' :
                                                key === 'phone' ? '电话' :
                                                  key === 'interviewer' ? '面试官' :
                                                    key === 'location' ? '面试地点' :
                                                      key === 'notes' ? '备注' :
                                                        key === 'feedback' ? '反馈' : key
                        }</span>
                        {isVisible && <Check size={14} className="text-indigo-500" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => exportToCSV(filteredInterviews, 'interviews')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white text-sm font-medium rounded-lg hover:bg-slate-900 transition-all"
              disabled={loading}
              title="导出数据"
            >
              <Download size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
              <tr>
                {visibleColumns.candidate && <th className="px-6 py-3 text-left">候选人</th>}
                {visibleColumns.job && <th className="px-6 py-3 text-left">职位</th>}
                {visibleColumns.company && <th className="px-6 py-3 text-left">公司</th>}
                {visibleColumns.email && <th className="px-6 py-3 text-left">邮箱</th>}
                {visibleColumns.phone && <th className="px-6 py-3 text-left">电话</th>}
                {visibleColumns.date && <th className="px-6 py-3 text-left">面试日期</th>}
                {visibleColumns.time && <th className="px-6 py-3 text-left">开始时间</th>}
                {visibleColumns.endTime && <th className="px-6 py-3 text-left">结束时间</th>}
                {visibleColumns.type && <th className="px-6 py-3 text-left">类型</th>}
                {visibleColumns.round && <th className="px-6 py-3 text-left">轮次</th>}
                {visibleColumns.interviewer && <th className="px-6 py-3 text-left">面试官</th>}
                {visibleColumns.location && <th className="px-6 py-3 text-left">地点</th>}
                {visibleColumns.status && <th className="px-6 py-3 text-left">状态</th>}
                {visibleColumns.result && <th className="px-6 py-3 text-left">结果</th>}
                {visibleColumns.notes && <th className="px-6 py-3 text-left">备注</th>}
                {visibleColumns.feedback && <th className="px-6 py-3 text-left">反馈</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={Object.values(visibleColumns).filter(Boolean).length} className="px-6 py-8 text-center text-slate-500">
                    加载中...
                  </td>
                </tr>
              ) : filteredInterviews.length === 0 ? (
                <tr>
                  <td colSpan={Object.values(visibleColumns).filter(Boolean).length} className="px-6 py-8 text-center text-slate-500">
                    没有找到匹配的面试
                  </td>
                </tr>
              ) : (
                paginatedInterviews.map(interview => (
                  <tr key={interview.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600/50">
                    {visibleColumns.candidate && (
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                        <div className="flex items-center gap-3">
                          <div className="relative h-8 w-8 flex-shrink-0">
                            {/* Base Layer: Initials */}
                            <div className="h-full w-full rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold border-2 border-white dark:border-slate-800 shadow-sm text-xs">
                              {interview.candidateName?.charAt(0) || '?'}
                            </div>

                            {/* Top Layer: Image */}
                            {interview.candidateAvatar && (
                              <img
                                src={interview.candidateAvatar.startsWith('http') ? interview.candidateAvatar : `http://localhost:8001${interview.candidateAvatar}`}
                                alt={interview.candidateName}
                                className="absolute inset-0 h-full w-full rounded-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            )}
                          </div>
                          <span>{interview.candidateName || '未知'}</span>
                        </div>
                      </td>
                    )}
                    {visibleColumns.job && <td className="px-6 py-4 text-xs text-slate-900 dark:text-white">{interview.jobTitle || '未知'}</td>}
                    {visibleColumns.company && (
                      <td className="px-6 py-4 text-xs">
                        <div className="flex items-center gap-3">
                          <div className="relative h-8 w-8 flex-shrink-0">
                            {/* Base Layer: Initials */}
                            <div className="h-full w-full rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold border border-white dark:border-slate-800 shadow-sm text-[10px]">
                              {interview.companyName?.charAt(0) || '?'}
                            </div>

                            {/* Top Layer: Image */}
                            {interview.companyLogo && (
                              <img
                                src={interview.companyLogo.startsWith('http') ? interview.companyLogo : `http://localhost:8001${interview.companyLogo}`}
                                alt={interview.companyName}
                                className="absolute inset-0 h-full w-full rounded object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            )}
                          </div>
                          <span className="text-slate-900 dark:text-white">{interview.companyName || '未知'}</span>
                        </div>
                      </td>
                    )}
                    {visibleColumns.email && <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">{interview.candidateEmail || '-'}</td>}
                    {visibleColumns.phone && <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">{interview.candidatePhone || '-'}</td>}
                    {visibleColumns.date && (
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-xs text-slate-900 dark:text-white">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(interview.interviewDate).toLocaleDateString('zh-CN')}
                        </div>
                      </td>
                    )}
                    {visibleColumns.time && (
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-xs text-slate-900 dark:text-white">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {interview.interviewTime}
                        </div>
                      </td>
                    )}
                    {visibleColumns.endTime && (
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                          <Clock className="w-3.5 h-3.5 text-slate-300" />
                          {interview.interviewTimeEnd || '-'}
                        </div>
                      </td>
                    )}
                    {visibleColumns.type && <td className="px-6 py-4 text-xs text-slate-900 dark:text-white">{interview.interviewType}</td>}
                    {visibleColumns.round && <td className="px-6 py-4 text-xs text-slate-900 dark:text-white">第 {interview.interviewRound} 轮</td>}
                    {visibleColumns.interviewer && (
                      <td className="px-6 py-4 text-xs">
                        <div className="flex flex-col text-slate-900 dark:text-white">
                          <span>{interview.interviewerName || '-'}</span>
                          <span className="text-slate-400 dark:text-slate-500 scale-90 origin-left">{interview.interviewerPosition}</span>
                        </div>
                      </td>
                    )}
                    {visibleColumns.location && <td className="px-6 py-4 text-xs text-slate-900 dark:text-white max-w-[120px] truncate" title={interview.location}>{interview.location || '-'}</td>}
                    {visibleColumns.status && (
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full whitespace-nowrap ${getStatusColor(interview.status)}`}>
                          {getStatusText(interview.status)}
                        </span>
                      </td>
                    )}
                    {visibleColumns.result && (
                      <td className="px-6 py-4">
                        {interview.interviewResult ? (
                          <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full whitespace-nowrap ${getResultColor(interview.interviewResult)}`}>
                            {interview.interviewResult}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>
                    )}
                    {visibleColumns.notes && <td className="px-6 py-4 text-xs text-slate-900 dark:text-white max-w-[150px] truncate" title={interview.notes}>{interview.notes || '-'}</td>}
                    {visibleColumns.feedback && <td className="px-6 py-4 text-xs text-slate-900 dark:text-white max-w-[150px] truncate" title={interview.interviewFeedback}>{interview.interviewFeedback || '-'}</td>}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 分页组件 */}
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
      </div>
    </div>
  );
};

export default InterviewsView;

