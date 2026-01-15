import React, { useState, useEffect, useMemo } from 'react';
import { Search, Calendar, Clock, MapPin, User, FileText, CheckCircle, XCircle, AlertCircle, Plus, X } from 'lucide-react';
import { message as antMessage } from 'antd';
import { interviewAPI } from '@/services/apiService';
import InterviewDetailModal from '../components/InterviewDetailModal';
import SetInterviewResultModal from '../components/SetInterviewResultModal';
import { useI18n } from '@/contexts/i18nContext';

interface Interview {
  id: number;
  applicationId: number;
  interviewDate: string;
  interviewTime: string;
  interviewTimeEnd?: string; // 面试结束时间
  location: string;
  interviewerId: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'accepted' | 'rejected';
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
  jobTitle?: string;
  companyName?: string;
  candidateAvatar?: string;
  // 新增字段
  invitationMessage?: string;
  invitationSentAt?: string;
  invitationExpiresAt?: string;
  candidateResponseAt?: string;
  timeZone?: string;
  candidateId?: number;
  jobId?: number;
}

interface InterviewsViewProps {
  currentUserId: number;
}

const InterviewsView: React.FC<InterviewsViewProps> = ({ currentUserId }) => {
  const { language, t } = useI18n();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal State
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Result Modal State
  const [selectedResultInterview, setSelectedResultInterview] = useState<Interview | null>(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      console.log('[InterviewsView] Fetching interviews for currentUserId:', currentUserId);
      const response = await interviewAPI.getAllInterviews({
        userId: currentUserId,
        role: 'recruiter'
      });
      console.log('[InterviewsView] API response:', response);

      if ((response as any).status === 'success') {
        const recruiterInterviews = response.data || [];
        console.log('[InterviewsView] Filtered interviews for recruiter:', recruiterInterviews.length);
        setInterviews(recruiterInterviews);
      }
    } catch (error) {
      console.error('[InterviewsView] 获取面试数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (interview: Interview) => {
    setSelectedInterview(interview);
    setIsDetailModalOpen(true);
  };

  const handleSetResult = (interview: Interview) => {
    setSelectedResultInterview(interview);
    setIsResultModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsDetailModalOpen(false);
    setSelectedInterview(null);
  };

  useEffect(() => {
    fetchInterviews();

    // 每30秒自动刷新一次，检查状态更新
    const interval = setInterval(() => {
      console.log('[InterviewsView] Auto-refreshing interviews...');
      fetchInterviews();
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [currentUserId]);

  const filteredInterviews = useMemo(() => {
    return interviews.filter(interview => {
      const matchesSearch = searchTerm === '' ||
        interview.candidateName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        interview.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || interview.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [interviews, searchTerm, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'completed': return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
      case 'cancelled': return 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300';
      case 'accepted': return 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'rejected': return 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200';
      default: return 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return t.recruiter.statusScheduled;
      case 'completed': return t.recruiter.statusCompleted;
      case 'cancelled': return t.recruiter.statusCancelled;
      case 'accepted': return t.recruiter.statusAccepted;
      case 'rejected': return t.recruiter.statusRejected;
      default: return status;
    }
  };

  const getResultColor = (result?: string) => {
    switch (result) {
      case '通过': return 'bg-green-500 text-white shadow-sm';
      case '未通过': return 'bg-rose-500 text-white shadow-sm';
      case '待定': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
      default: return 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500';
    }
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{t.recruiter.interviewTitle}</h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">{t.recruiter.interviewSubtitle}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-700/50 flex flex-col lg:flex-row gap-5 justify-between items-center">
          <div className="flex gap-3 items-center w-full lg:w-1/2 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder={t.recruiter.searchPlaceholder}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium text-slate-700 dark:text-slate-200"
            />
          </div>
          <div className="flex gap-3 w-full lg:w-auto">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="flex-1 lg:flex-none px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all cursor-pointer"
            >
              <option value="all">{t.recruiter.allStatus}</option>
              <option value="scheduled">🕙 {t.recruiter.statusScheduled}</option>
              <option value="accepted">✅ {t.recruiter.statusAccepted}</option>
              <option value="completed">🏆 {t.recruiter.statusCompleted}</option>
              <option value="cancelled">❌ {t.recruiter.statusCancelled}</option>
              <option value="rejected">🚫 {t.recruiter.statusRejected}</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700/50">
                <th className="px-6 py-4 text-left font-black text-slate-400 dark:text-slate-500 text-xs uppercase tracking-widest">候选人详情</th>
                <th className="px-6 py-4 text-left font-black text-slate-400 dark:text-slate-500 text-xs uppercase tracking-widest">申请岗位</th>
                <th className="px-6 py-4 text-left font-black text-slate-400 dark:text-slate-500 text-xs uppercase tracking-widest">面试日期</th>
                <th className="px-6 py-4 text-left font-black text-slate-400 dark:text-slate-500 text-xs uppercase tracking-widest hidden sm:table-cell">起止时间</th>
                <th className="px-6 py-4 text-left font-black text-slate-400 dark:text-slate-500 text-xs uppercase tracking-widest hidden md:table-cell">面试形式</th>
                <th className="px-6 py-4 text-left font-black text-slate-400 dark:text-slate-500 text-xs uppercase tracking-widest">当前状态</th>
                <th className="px-6 py-4 text-left font-black text-slate-400 dark:text-slate-500 text-xs uppercase tracking-widest">面试结果</th>
                <th className="px-6 py-4 text-right font-black text-slate-400 dark:text-slate-500 text-xs uppercase tracking-widest">管理操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                    {t.common.loading}
                  </td>
                </tr>
              ) : filteredInterviews.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-8 text-center text-gray-500">
                    {t.common.noData}
                  </td>
                </tr>
              ) : (
                filteredInterviews.map(interview => (
                  <tr key={interview.id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-all duration-300">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden shadow-sm transition-transform group-hover:scale-105">
                          {interview.candidateAvatar ? (
                            <img src={interview.candidateAvatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black">
                              {interview.candidateName ? interview.candidateName.charAt(0).toUpperCase() : '?'}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100">{interview.candidateName || '未知'}</div>
                          <div className="text-[10px] text-slate-400 font-bold mt-0.5">ID: {interview.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">{interview.jobTitle || '未知'}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center mt-1">
                        <MapPin className="w-3 h-3 mr-1" />
                        {interview.location || '在线面试'}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 font-black text-slate-700 dark:text-slate-300 text-sm">
                          <Calendar className="w-4 h-4 text-blue-500" />
                          {new Date(interview.interviewDate).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', weekday: 'short' })}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 hidden sm:table-cell">
                      <div className="flex items-center gap-2 font-bold text-slate-600 dark:text-slate-400 text-sm">
                        <Clock className="w-4 h-4 text-slate-400" />
                        {interview.interviewTime?.slice(0, 5)} - {interview.interviewTimeEnd?.slice(0, 5) || '???'}
                      </div>
                    </td>
                    <td className="px-6 py-5 hidden md:table-cell">
                      <div className="flex flex-col gap-1">
                        <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-black rounded-lg inline-block w-fit">
                          {interview.interviewType || (language === 'zh' ? '未知形式' : 'Unknown')}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold px-1.5">{t.recruiter.interviewRoundPrefix}{interview.interviewRound}{t.recruiter.interviewRoundSuffix}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className={`px-3 py-1 text-[10px] font-black rounded-full w-fit uppercase tracking-wider ${getStatusColor(interview.status)}`}>
                          {getStatusText(interview.status)}
                        </span>
                        {interview.status === 'scheduled' && interview.invitationSentAt && (
                          <div className="text-[10px] text-slate-400 mt-1.5 font-bold">
                            {new Date(interview.invitationSentAt).toLocaleTimeString(language === 'zh' ? 'zh-CN' : 'en-US', { hour: '2-digit', minute: '2-digit' })} {t.recruiter.sent}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {interview.interviewResult ? (
                        <span className={`px-3 py-1 text-[10px] font-black rounded-full w-fit uppercase tracking-wider ${getResultColor(interview.interviewResult)}`}>
                          {interview.interviewResult}
                        </span>
                      ) : (
                        <span className="text-slate-300 italic text-[10px] font-bold">{t.recruiter.notEvaluated}</span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 text-xs font-bold">
                        <button
                          onClick={() => handleViewDetails(interview)}
                          className="px-3 py-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all active:scale-90"
                        >
                          {t.recruiter.showDetails}
                        </button>
                        <button
                          onClick={() => handleSetResult(interview)}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-200 dark:shadow-blue-900/20"
                        >
                          {t.recruiter.evaluate}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <InterviewDetailModal
        open={isDetailModalOpen}
        onCancel={handleCloseModal}
        interview={selectedInterview}
      />

      <SetInterviewResultModal
        open={isResultModalOpen}
        onCancel={() => {
          setIsResultModalOpen(false);
          setSelectedResultInterview(null);
        }}
        onSuccess={() => {
          setIsResultModalOpen(false);
          setSelectedResultInterview(null);
          fetchInterviews(); // Refresh list to show new result
        }}
        interviewId={selectedResultInterview?.id || null}
        initialValues={selectedResultInterview ? {
          interviewResult: selectedResultInterview.interviewResult,
          interviewFeedback: selectedResultInterview.interviewFeedback
        } : undefined}
      />
    </div>
  );
};

export default InterviewsView;

