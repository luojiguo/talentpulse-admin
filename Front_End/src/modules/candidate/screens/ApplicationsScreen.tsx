import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, Briefcase, Building, CheckCircle, XCircle, Clock, FileText, MapPin, Sparkles } from 'lucide-react';
import { applicationAPI } from '@/services/apiService';

interface Application {
  id: number;
  candidateId: number;
  jobId: number;
  status: 'New' | 'Screening' | 'Interview' | 'Offer' | 'Rejected' | 'Hired';
  matchScore: number;
  appliedDate: string;
  jobTitle?: string;
  companyName?: string;
  location?: string;
  salary?: string;
}

interface ApplicationsScreenProps {
  currentUser: any;
}

const ApplicationsScreen: React.FC<ApplicationsScreenProps> = ({ currentUser }) => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const fetchApplications = async () => {
      if (!currentUser?.id) return;

      try {
        setLoading(true);
        const response = await applicationAPI.getCandidateApplications(currentUser.id);
        if ((response as any).status === 'success') {
          setApplications(response.data || []);
        }
      } catch (error) {
        console.error('获取申请记录失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [currentUser?.id]);

  const filteredApplications = useMemo(() => {
    return applications.filter(app => {
      const matchesSearch = searchTerm === '' ||
        app.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.companyName?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || app.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [applications, searchTerm, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Screening': return 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400';
      case 'Interview': return 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'Offer': return 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'Hired': return 'bg-brand-600 text-white shadow-md shadow-brand-500/30';
      case 'Rejected': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
      default: return 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'New': '新申请',
      'Screening': '筛选中',
      'Interview': '面试中',
      'Offer': '已发Offer',
      'Hired': '已入职',
      'Rejected': '已拒绝'
    };
    return statusMap[status] || status;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in duration-700">
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">我的申请</h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">跟踪您的求职旅程，见证每一次成长</p>
        </div>
        <div className="flex items-center gap-4 bg-brand-50/50 dark:bg-brand-900/20 px-6 py-3 rounded-2xl border border-brand-100 dark:border-brand-800">
          <div className="text-center">
            <div className="text-2xl font-black text-brand-600 dark:text-brand-400">{applications.length}</div>
            <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">总投递</div>
          </div>
          <div className="w-px h-8 bg-brand-200 dark:bg-brand-800"></div>
          <div className="text-center">
            <div className="text-2xl font-black text-amber-500">{applications.filter(a => a.status === 'Interview').length}</div>
            <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">面试中</div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden transition-all duration-300">
        <div className="p-6 border-b border-slate-50 dark:border-slate-700 flex gap-4 justify-between items-center flex-wrap bg-white dark:bg-slate-800">
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
              <option value="New">新申请</option>
              <option value="Screening">筛选中</option>
              <option value="Interview">面试中</option>
              <option value="Offer">已发Offer</option>
              <option value="Hired">已入职</option>
              <option value="Rejected">已拒绝</option>
            </select>
          </div>
        </div>

        <div className="overflow-hidden">
          {loading ? (
            <div className="p-24 text-center">
              <div className="inline-block w-12 h-12 border-[5px] border-brand-100 border-t-brand-500 rounded-full animate-spin"></div>
              <p className="mt-6 text-slate-500 dark:text-slate-400 font-bold text-lg">正在加载申请记录...</p>
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="p-24 text-center animate-in fade-in duration-500">
              <div className="w-24 h-24 bg-slate-50 dark:bg-slate-900 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-inner">
                <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-xl font-black">
                {applications.length === 0 ? '开启您的第一份职位申请吧' : '换个关键词试试看？'}
              </p>
              <p className="text-slate-400 mt-2">没有任何匹配的记录</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
              {filteredApplications.map(application => (
                <div
                  key={application.id}
                  className="p-8 hover:bg-brand-50/20 dark:hover:bg-brand-900/5 transition-all duration-500 cursor-pointer group relative overflow-hidden"
                  onClick={() => navigate(`/job/${application.jobId}`)}
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-brand-400 scale-y-0 group-hover:scale-y-100 transition-transform duration-500 origin-top"></div>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-4 mb-4">
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors tracking-tight">
                          {application.jobTitle || '未知职位'}
                        </h3>
                        <span className={`px-4 py-1 text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm ${getStatusColor(application.status)}`}>
                          {getStatusText(application.status)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-y-3 gap-x-8 text-sm font-bold text-slate-500 dark:text-slate-400 mb-5">
                        <div className="flex items-center gap-2 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">
                          <Building className="w-4.5 h-4.5 text-brand-400" />
                          {application.companyName || '未知公司'}
                        </div>
                        {application.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4.5 h-4.5 text-brand-400" />
                            {application.location}
                          </div>
                        )}
                        {application.salary && (
                          <div className="text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30 px-3 py-1 rounded-lg">
                            {application.salary}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-xs font-medium text-slate-400 dark:text-slate-500">
                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
                          <Calendar className="w-4 h-4 text-slate-300" />
                          <span className="opacity-80">申请于:</span>
                          <span className="text-slate-600 dark:text-slate-300 font-bold">{new Date(application.appliedDate).toLocaleDateString('zh-CN')}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-brand-50 dark:bg-brand-900/30 px-3 py-1.5 rounded-xl border border-brand-100/50 dark:border-brand-800/50">
                          <Sparkles className="w-4 h-4 text-brand-400" />
                          <span className="text-brand-600/70 dark:text-brand-400/70">智能匹配度:</span>
                          <span className="text-brand-600 dark:text-brand-400 font-black">{application.matchScore}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/job/${application.jobId}`);
                        }}
                        className="w-full md:w-auto px-8 py-3.5 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl hover:border-brand-400 hover:text-brand-600 dark:hover:text-brand-400 hover:shadow-lg hover:shadow-brand-100 dark:hover:shadow-none transition-all text-sm font-black active:scale-95"
                      >
                        职位详情
                      </button>
                    </div>
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

export default ApplicationsScreen;

