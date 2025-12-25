import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, Clock, MapPin, Phone, Video, Building2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { interviewAPI } from '@/services/apiService';

interface Interview {
  id: number;
  applicationId: number;
  interviewDate: string;
  interviewTime: string;
  location: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'accepted' | 'rejected';
  interviewRound: number;
  interviewType: '电话' | '视频' | '现场';
  interviewTopic?: string;
  interviewDuration: number;
  interviewerName?: string;
  interviewerPosition?: string;
  interviewResult?: '通过' | '未通过' | '待定';
  interviewFeedback?: string;
  jobTitle?: string;
  companyName?: string;
}

interface InterviewsScreenProps {
  currentUser: any;
}

const InterviewsScreen: React.FC<InterviewsScreenProps> = ({ currentUser }) => {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        setLoading(true);
        const response = await interviewAPI.getAllInterviews();
        if ((response as any).status === 'success') {
          // 只显示当前用户的面试（通过applicationId关联）
          const userInterviews = (response.data || []).filter((interview: Interview) => {
            // TODO: 需要根据applicationId关联到candidateId来过滤
            // 暂时显示所有面试，后续需要优化
            return true;
          });
          setInterviews(userInterviews);
        }
      } catch (error) {
        console.error('获取面试安排失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInterviews();
  }, [currentUser?.id]);

  const filteredInterviews = useMemo(() => {
    return interviews.filter(interview => {
      const matchesSearch = searchTerm === '' ||
        interview.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        interview.companyName?.toLowerCase().includes(searchTerm.toLowerCase());

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

  const handleInterviewStatusChange = async (interviewId: number, newStatus: 'accepted' | 'rejected') => {
    try {
      const response = await interviewAPI.updateInterviewStatus(interviewId, newStatus);
      if ((response as any).status === 'success') {
        setInterviews(prev => 
          prev.map(interview => 
            interview.id === interviewId ? { ...interview, status: newStatus } : interview
          )
        );
      }
    } catch (error) {
      console.error('更新面试状态失败:', error);
      // 可以添加错误提示
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case '电话': return <Phone className="w-4 h-4" />;
      case '视频': return <Video className="w-4 h-4" />;
      case '现场': return <Building2 className="w-4 h-4" />;
      default: return <Phone className="w-4 h-4" />;
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">我的面试</h1>
        <p className="text-gray-600">查看您的面试安排和结果</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex gap-4 justify-between items-center flex-wrap">
          <div className="flex gap-2 items-center w-full md:w-auto">
            <Search className="text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="搜索职位、公司..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-transparent focus:outline-none text-sm w-full md:w-64 border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">全部状态</option>
              <option value="scheduled">已安排</option>
              <option value="completed">已完成</option>
              <option value="cancelled">已取消</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">加载中...</div>
          ) : filteredInterviews.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {interviews.length === 0 ? '您还没有面试安排' : '没有找到匹配的面试'}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredInterviews.map(interview => (
                <div key={interview.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{interview.jobTitle || '未知职位'}</h3>
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(interview.status)}`}>
                          {getStatusText(interview.status)}
                        </span>
                        {interview.interviewResult && (
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getResultColor(interview.interviewResult)}`}>
                            {interview.interviewResult}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mb-3">
                        {interview.companyName && (
                          <div className="mb-1">{interview.companyName}</div>
                        )}
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(interview.interviewDate).toLocaleDateString('zh-CN')}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {interview.interviewTime}
                          </div>
                          <div className="flex items-center gap-1">
                            {getTypeIcon(interview.interviewType)}
                            {interview.interviewType}
                          </div>
                          <div className="text-gray-500">第 {interview.interviewRound} 轮</div>
                        </div>
                        {interview.location && (
                          <div className="flex items-center gap-1 mt-2">
                            <MapPin className="w-4 h-4" />
                            {interview.location}
                          </div>
                        )}
                      </div>
                      {interview.interviewerName && (
                        <div className="text-sm text-gray-600 mb-2">
                          面试官: {interview.interviewerName}
                          {interview.interviewerPosition && ` (${interview.interviewerPosition})`}
                        </div>
                      )}
                      {interview.interviewFeedback && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm font-medium text-gray-700 mb-1">面试反馈:</div>
                          <div className="text-sm text-gray-600 whitespace-pre-wrap">{interview.interviewFeedback}</div>
                        </div>
                      )}
                    </div>
                    {interview.status === 'scheduled' && (
                      <div className="mt-4 flex gap-3">
                        <button
                          onClick={() => handleInterviewStatusChange(interview.id, 'accepted')}
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                        >
                          <CheckCircle className="w-4 h-4" />
                          接受面试
                        </button>
                        <button
                          onClick={() => handleInterviewStatusChange(interview.id, 'rejected')}
                          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                        >
                          <XCircle className="w-4 h-4" />
                          拒绝面试
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InterviewsScreen;

