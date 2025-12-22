import React, { useState, useEffect, useMemo } from 'react';
import { Search, Calendar, Clock, MapPin, User, FileText, CheckCircle, XCircle, AlertCircle, Plus } from 'lucide-react';
import { interviewAPI } from '@/services/apiService';

interface Interview {
  id: number;
  applicationId: number;
  interviewDate: string;
  interviewTime: string;
  location: string;
  interviewerId: number;
  status: 'scheduled' | 'completed' | 'cancelled';
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
}

interface InterviewsViewProps {
  currentUserId: number;
}

const InterviewsView: React.FC<InterviewsViewProps> = ({ currentUserId }) => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        setLoading(true);
        const response = await interviewAPI.getAllInterviews();
        if (response.status === 'success') {
          // 只显示当前招聘者的面试
          const recruiterInterviews = (response.data || []).filter(
            (interview: Interview) => interview.interviewerId === currentUserId
          );
          setInterviews(recruiterInterviews);
        }
      } catch (error) {
        console.error('获取面试数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInterviews();
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
    switch(status) {
      case 'scheduled': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch(status) {
      case 'scheduled': return '已安排';
      case 'completed': return '已完成';
      case 'cancelled': return '已取消';
      default: return status;
    }
  };

  const getResultColor = (result?: string) => {
    switch(result) {
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
        <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          安排面试
        </button>
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
                <th className="px-6 py-3 text-left">面试时间</th>
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
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    加载中...
                  </td>
                </tr>
              ) : filteredInterviews.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
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
                    <td className="px-6 py-4">{interview.interviewType}</td>
                    <td className="px-6 py-4">第 {interview.interviewRound} 轮</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(interview.status)}`}>
                        {getStatusText(interview.status)}
                      </span>
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

