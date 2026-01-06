import React, { useState, useEffect, useMemo } from 'react';
import { Search, Calendar, Clock, MapPin, User, FileText, CheckCircle, XCircle, AlertCircle, Plus, X } from 'lucide-react';
import { message as antMessage } from 'antd';
import { interviewAPI } from '@/services/apiService';

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
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      console.log('[InterviewsView] Fetching interviews for currentUserId:', currentUserId);
      const response = await interviewAPI.getAllInterviews();
      console.log('[InterviewsView] API response:', response);

      if ((response as any).status === 'success') {
        const allInterviews = response.data || [];
        console.log('[InterviewsView] Total interviews from API:', allInterviews.length);
        console.log('[InterviewsView] Sample interview:', allInterviews[0]);

        // 临时显示所有面试（不过滤 interviewer_id）
        // TODO: 需要更新数据库中的 interviewer_id 为当前用户ID
        console.log('[InterviewsView] 显示所有面试（已移除 interviewer_id 过滤）');
        setInterviews(allInterviews);

        /* 原来的过滤逻辑（已注释）
        const recruiterInterviews = allInterviews.filter(
          (interview: Interview) => {
            console.log(`[InterviewsView] Checking interview ${interview.id}: interviewerId=${interview.interviewerId}, currentUserId=${currentUserId}`);
            return interview.interviewerId === currentUserId;
          }
        );
        console.log('[InterviewsView] Filtered interviews for current recruiter:', recruiterInterviews.length);
        setInterviews(recruiterInterviews);
        */
      }
    } catch (error) {
      console.error('[InterviewsView] 获取面试数据失败:', error);
    } finally {
      setLoading(false);
    }
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
      case 'scheduled': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      case 'accepted': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return '已安排';
      case 'completed': return '已完成';
      case 'cancelled': return '已取消';
      case 'accepted': return '已接受';
      case 'rejected': return '已拒绝';
      default: return status;
    }
  };

  const getResultColor = (result?: string) => {
    switch (result) {
      case '通过': return 'bg-green-100 text-green-700';
      case '未通过': return 'bg-red-100 text-red-700';
      case '待定': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">面试管理</h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200 flex gap-4 justify-between items-center flex-wrap">
          <div className="flex gap-2 items-center w-full md:w-auto">
            <Search className="text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="搜索候选人、职位..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-transparent focus:outline-none text-sm w-full md:w-64"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">全部状态</option>
              <option value="scheduled">已安排</option>
              <option value="completed">已完成</option>
              <option value="cancelled">已取消</option>
              <option value="accepted">已接受</option>
              <option value="rejected">已拒绝</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">候选人</th>
                <th className="px-6 py-3 text-left">职位</th>
                <th className="px-6 py-3 text-left">面试日期</th>
                <th className="px-6 py-3 text-left">开始时间</th>
                <th className="px-6 py-3 text-left">结束时间</th>
                <th className="px-6 py-3 text-left">地点</th>
                <th className="px-6 py-3 text-left">面试类型</th>
                <th className="px-6 py-3 text-left">轮次</th>
                <th className="px-6 py-3 text-left">状态</th>
                <th className="px-6 py-3 text-left">结果</th>
                <th className="px-6 py-3 text-left">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                    加载中...
                  </td>
                </tr>
              ) : filteredInterviews.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-8 text-center text-gray-500">
                    没有找到匹配的面试
                  </td>
                </tr>
              ) : (
                filteredInterviews.map(interview => (
                  <tr key={interview.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {interview.candidateName || '未知'}
                    </td>
                    <td className="px-6 py-4">{interview.jobTitle || '未知'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {new Date(interview.interviewDate).toLocaleDateString('zh-CN')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        {interview.interviewTime}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        {interview.interviewTimeEnd || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="truncate max-w-[150px]">{interview.location || '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">{interview.interviewType}</td>
                    <td className="px-6 py-4">第 {interview.interviewRound} 轮</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(interview.status)}`}>
                        {getStatusText(interview.status)}
                      </span>
                      {interview.status === 'scheduled' && interview.invitationSentAt && (
                        <div className="text-xs text-gray-500 mt-1">
                          已发送: {new Date(interview.invitationSentAt).toLocaleString('zh-CN')}
                        </div>
                      )}
                      {(interview.status === 'accepted' || interview.status === 'rejected') && interview.candidateResponseAt && (
                        <div className="text-xs text-gray-500 mt-1">
                          已{interview.status === 'accepted' ? '接受' : '拒绝'}: {new Date(interview.candidateResponseAt).toLocaleString('zh-CN')}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {interview.interviewResult ? (
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getResultColor(interview.interviewResult)}`}>
                          {interview.interviewResult}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">
                        查看详情
                      </button>
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

export default InterviewsView;

