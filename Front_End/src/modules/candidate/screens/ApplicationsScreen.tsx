import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, Briefcase, Building, CheckCircle, XCircle, Clock, FileText } from 'lucide-react';
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
      case 'New': return 'bg-blue-100 text-blue-700';
      case 'Screening': return 'bg-indigo-100 text-indigo-700';
      case 'Interview': return 'bg-amber-100 text-amber-700';
      case 'Offer': return 'bg-purple-100 text-purple-700';
      case 'Hired': return 'bg-green-100 text-green-700';
      case 'Rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">我的申请</h1>
        <p className="text-gray-600">查看您投递的所有职位申请记录</p>
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
              <option value="New">新申请</option>
              <option value="Screening">筛选中</option>
              <option value="Interview">面试中</option>
              <option value="Offer">已发Offer</option>
              <option value="Hired">已入职</option>
              <option value="Rejected">已拒绝</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">加载中...</div>
          ) : filteredApplications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {applications.length === 0 ? '您还没有投递任何职位' : '没有找到匹配的申请'}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredApplications.map(application => (
                <div
                  key={application.id}
                  className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/job/${application.jobId}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{application.jobTitle || '未知职位'}</h3>
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(application.status)}`}>
                          {getStatusText(application.status)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center gap-1">
                          <Building className="w-4 h-4" />
                          {application.companyName || '未知公司'}
                        </div>
                        {application.location && (
                          <div className="flex items-center gap-1">
                            <Briefcase className="w-4 h-4" />
                            {application.location}
                          </div>
                        )}
                        {application.salary && (
                          <div className="text-indigo-600 font-medium">{application.salary}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          申请时间: {new Date(application.appliedDate).toLocaleDateString('zh-CN')}
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          匹配度: {application.matchScore}%
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/job/${application.jobId}`);
                      }}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                    >
                      查看详情
                    </button>
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

