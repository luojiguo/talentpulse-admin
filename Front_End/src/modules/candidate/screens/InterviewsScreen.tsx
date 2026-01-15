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
      if (!currentUser?.id) return;

      try {
        setLoading(true);
        const response = await interviewAPI.getAllInterviews({
          userId: currentUser.id,
          role: 'candidate'
        });
        if ((response as any).status === 'success') {
          setInterviews(response.data || []);
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
      case 'scheduled': return 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400 border border-brand-200 dark:border-brand-800';
      case 'completed': return 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400';
      case 'cancelled': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
      case 'accepted': return 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400';
      case 'rejected': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
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
      case '通过': return 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400 border border-brand-200 dark:border-brand-800';
      case '未通过': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
      case '待定': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in duration-700">
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">我的面试</h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">展现真实的自己，迎接每一个职场机遇</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setStatusFilter('all')}
            className={`flex items-center gap-4 px-6 py-3 rounded-2xl transition-all cursor-pointer ${statusFilter === 'all'
              ? 'bg-brand-100 shadow-lg shadow-brand-200 dark:shadow-none scale-105 border-2 border-brand-300'
              : 'bg-brand-50/50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800 hover:bg-brand-100 dark:hover:bg-brand-900/30'
              }`}
          >
            <div className="text-center">
              <div className="text-2xl font-black" style={{ color: '#007AFF' }}>{interviews.length}</div>
              <div className={`text-[10px] font-black uppercase tracking-widest ${statusFilter === 'all' ? 'text-brand-600 dark:text-brand-500' : 'text-slate-600 dark:text-slate-400'
                }`}>总面试</div>
            </div>
          </button>
          <button
            onClick={() => setStatusFilter('scheduled')}
            className={`flex items-center gap-4 px-6 py-3 rounded-2xl transition-all cursor-pointer ${statusFilter === 'scheduled'
              ? 'bg-brand-100 shadow-lg shadow-brand-200 dark:shadow-none scale-105 border-2 border-brand-300'
              : 'bg-brand-50/50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800 hover:bg-brand-100 dark:hover:bg-brand-900/30'
              }`}
          >
            <div className="text-center">
              <div className="text-2xl font-black" style={{ color: '#007AFF' }}>{interviews.filter(i => i.status === 'scheduled').length}</div>
              <div className={`text-[10px] font-black uppercase tracking-widest ${statusFilter === 'scheduled' ? 'text-brand-600 dark:text-brand-500' : 'text-slate-600 dark:text-slate-400'
                }`}>待进行</div>
            </div>
          </button>
        </div>
      </div>

      <div className="bg-brand-50/30 dark:bg-slate-800 rounded-[32px] shadow-sm border border-brand-100 dark:border-slate-700 overflow-hidden transition-all duration-300">
        <div className="p-6 border-b border-brand-100 dark:border-slate-700 flex gap-4 justify-between items-center flex-wrap bg-brand-50/20 dark:bg-slate-800">
          <div className="flex gap-4 items-center w-full md:w-auto">
            <div className="relative w-full md:w-80 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-brand-500 transition-colors" />
              <input
                type="text"
                placeholder="搜索职位或公司..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-6 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl text-base font-medium focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-400 transition-all dark:text-white placeholder:text-slate-400"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-6 py-3.5 border border-slate-100 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-900 text-sm font-bold text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-400 transition-all cursor-pointer appearance-none min-w-[140px]"
            >
              <option value="all">全部状态</option>
              <option value="scheduled">已安排</option>
              <option value="completed">已完成</option>
              <option value="cancelled">已取消</option>
            </select>
          </div>
        </div>

        <div className="overflow-hidden">
          {loading ? (
            <div className="p-24 text-center">
              <div className="inline-block w-12 h-12 border-[5px] border-brand-100 border-t-brand-500 rounded-full animate-spin"></div>
              <p className="mt-6 text-slate-500 dark:text-slate-400 font-bold text-lg">正在加载面试安排...</p>
            </div>
          ) : filteredInterviews.length === 0 ? (
            <div className="p-24 text-center animate-in fade-in duration-500">
              <div className="w-24 h-24 bg-slate-50 dark:bg-slate-900 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-inner">
                <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-xl font-black">
                {interviews.length === 0 ? '暂无面试安排' : '换个关键词试试看？'}
              </p>
              <p className="text-slate-400 mt-2">没有任何匹配的记录</p>
            </div>
          ) : (
            <div className="space-y-4 p-4">
              {filteredInterviews.map(interview => (
                <div key={interview.id} className="p-8 hover:bg-brand-100/40 dark:hover:bg-brand-900/10 transition-all duration-500 group relative overflow-hidden bg-brand-50/20 dark:bg-slate-800/50 rounded-3xl border-2 border-brand-100 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-brand-200 dark:hover:border-brand-900">
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-brand-400 scale-y-0 group-hover:scale-y-100 transition-transform duration-500 origin-top rounded-l-3xl"></div>
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-4 mb-4">
                        <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 transition-colors tracking-tight">
                          {interview.jobTitle || '未知职位'}
                        </h3>
                        <span className={`px-4 py-1 text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm ${getStatusColor(interview.status)}`}>
                          {getStatusText(interview.status)}
                        </span>
                        {interview.interviewResult && (
                          <span className={`px-4 py-1 text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm ${getResultColor(interview.interviewResult)}`}>
                            {interview.interviewResult}
                          </span>
                        )}
                      </div>

                      <div className="text-sm font-bold text-slate-600 dark:text-slate-400 space-y-4">
                        {interview.companyName && (
                          <div className="flex items-center gap-2">
                            <Building2 className="w-5 h-5" style={{ color: '#007AFF' }} />
                            <span className="text-base font-bold text-slate-900 dark:text-slate-100" style={{ color: statusFilter === 'all' || statusFilter === 'scheduled' ? '#007AFF' : undefined }}>{interview.companyName}</span>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                          <div className="flex items-center gap-2 bg-brand-50 dark:bg-slate-900/50 px-3 py-1.5 rounded-xl border border-brand-100 dark:border-slate-800">
                            <Calendar className="w-4 h-4 text-brand-500 dark:text-brand-400" />
                            <span className="text-slate-700 dark:text-slate-300">{new Date(interview.interviewDate).toLocaleDateString('zh-CN')}</span>
                          </div>
                          <div className="flex items-center gap-2 bg-brand-50 dark:bg-slate-900/50 px-3 py-1.5 rounded-xl border border-brand-100 dark:border-slate-800">
                            <Clock className="w-4 h-4 text-brand-500 dark:text-brand-400" />
                            <span className="text-slate-700 dark:text-slate-300">{interview.interviewTime}</span>
                          </div>
                          <div className="flex items-center gap-2 bg-brand-50 dark:bg-slate-900/50 px-3 py-1.5 rounded-xl border border-brand-100 dark:border-slate-800">
                            <div className="text-brand-500 dark:text-brand-400">{getTypeIcon(interview.interviewType)}</div>
                            <span className="text-slate-700 dark:text-slate-300">{interview.interviewType}面试</span>
                          </div>
                          <div className="px-3 py-1.5 bg-brand-50 dark:bg-brand-900/30 rounded-xl text-xs font-black text-brand-600 dark:text-brand-400 border border-brand-100 dark:border-brand-800/50">
                            第 {interview.interviewRound} 轮
                          </div>
                        </div>

                        {interview.location && (
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 bg-brand-50/50 dark:bg-slate-900/30 p-3 rounded-2xl border border-brand-100/50 dark:border-slate-800/50">
                            <MapPin className="w-4.5 h-4.5 text-brand-400" />
                            <span className="font-medium">{interview.location}</span>
                          </div>
                        )}
                      </div>

                      {interview.interviewerName && (
                        <div className="mt-6 p-4 bg-brand-50/50 dark:bg-slate-900 rounded-2xl border border-brand-100 dark:border-slate-800 flex items-center gap-4">
                          <div className="w-10 h-10 bg-brand-50 dark:bg-brand-900/30 rounded-full flex items-center justify-center text-brand-500 font-black">
                            {interview.interviewerName.charAt(0)}
                          </div>
                          <div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest mb-0.5">面试官</div>
                            <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                              {interview.interviewerName}
                              {interview.interviewerPosition && <span className="text-slate-500 dark:text-slate-400 font-medium ml-2">· {interview.interviewerPosition}</span>}
                            </div>
                          </div>
                        </div>
                      )}

                      {interview.interviewFeedback && (
                        <div className="mt-6 p-6 bg-brand-50/30 dark:bg-slate-900/50 rounded-2xl border border-brand-100/50 dark:border-slate-700/50">
                          <div className="flex items-center gap-2 mb-3">
                            <AlertCircle className="w-4 h-4 text-brand-400" />
                            <span className="text-xs font-black text-brand-600 dark:text-brand-400 uppercase tracking-widest">面试反馈</span>
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed font-medium">{interview.interviewFeedback}</div>
                        </div>
                      )}
                    </div>

                    {interview.status === 'scheduled' && (
                      <div className="shrink-0 flex md:flex-col gap-3">
                        <button
                          onClick={() => handleInterviewStatusChange(interview.id, 'accepted')}
                          className="flex-1 px-8 py-3.5 text-white rounded-2xl hover:scale-105 hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 text-sm font-black shadow-lg shadow-brand-200 dark:shadow-none active:scale-95"
                          style={{ backgroundColor: '#007AFF' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0051D5'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#007AFF'}
                        >
                          <CheckCircle className="w-4.5 h-4.5" />
                          接受面试
                        </button>
                        <button
                          onClick={() => handleInterviewStatusChange(interview.id, 'rejected')}
                          className="flex-1 px-8 py-3.5 bg-white dark:bg-slate-900 border-2 border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 rounded-2xl hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all flex items-center justify-center gap-2 text-sm font-black active:scale-95"
                        >
                          <XCircle className="w-4.5 h-4.5" />
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

