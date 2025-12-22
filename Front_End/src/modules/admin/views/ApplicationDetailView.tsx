import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Briefcase, Building, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import { applicationAPI, interviewAPI } from '@/services/apiService';

interface ApplicationDetail {
  id: number;
  candidateId: number;
  jobId: number;
  status: string;
  matchScore: number;
  appliedDate: string;
  resumeId?: number;
  coverLetter?: string;
  matchDetails?: any;
  statusHistory?: any[];
  interviewCount: number;
  offerSalary?: string;
  offerBenefits?: string[];
  rejectionReason?: string;
  candidateName?: string;
  jobTitle?: string;
  companyName?: string;
}

interface Interview {
  id: number;
  interviewDate: string;
  interviewTime: string;
  location: string;
  status: string;
  interviewRound: number;
  interviewType: string;
  interviewResult?: string;
  interviewFeedback?: string;
}

const ApplicationDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplicationDetail = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        // TODO: 创建获取申请详情的API
        // const response = await applicationAPI.getApplicationById(id);
        // if (response.status === 'success') {
        //   setApplication(response.data);
        // }
        
        // 获取该申请的面试记录
        const interviewsResponse = await interviewAPI.getInterviewsByApplicationId(id);
        if (interviewsResponse.status === 'success') {
          setInterviews(interviewsResponse.data || []);
        }
      } catch (error) {
        console.error('获取申请详情失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchApplicationDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">加载中...</div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="text-slate-500 mb-4">申请不存在</div>
        <button
          onClick={() => navigate('/admin/applications')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          返回申请列表
        </button>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'New': return 'bg-blue-100 text-blue-700';
      case 'Screening': return 'bg-indigo-100 text-indigo-700';
      case 'Interview': return 'bg-amber-100 text-amber-700';
      case 'Offer': return 'bg-purple-100 text-purple-700';
      case 'Hired': return 'bg-green-100 text-green-700';
      case 'Rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/applications')}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">申请详情</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 主要信息 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 基本信息 */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">基本信息</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-slate-400" />
                <div>
                  <div className="text-sm text-slate-500">候选人</div>
                  <div className="font-medium text-slate-900 dark:text-white">{application.candidateName || '未知'}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Briefcase className="w-5 h-5 text-slate-400" />
                <div>
                  <div className="text-sm text-slate-500">职位</div>
                  <div className="font-medium text-slate-900 dark:text-white">{application.jobTitle || '未知'}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Building className="w-5 h-5 text-slate-400" />
                <div>
                  <div className="text-sm text-slate-500">公司</div>
                  <div className="font-medium text-slate-900 dark:text-white">{application.companyName || '未知'}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-slate-400" />
                <div>
                  <div className="text-sm text-slate-500">申请日期</div>
                  <div className="font-medium text-slate-900 dark:text-white">
                    {new Date(application.appliedDate).toLocaleDateString('zh-CN')}
                  </div>
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-500 mb-1">申请状态</div>
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(application.status)}`}>
                  {application.status}
                </span>
              </div>
              <div>
                <div className="text-sm text-slate-500 mb-1">匹配度</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${application.matchScore}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">{application.matchScore}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* 求职信 */}
          {application.coverLetter && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                求职信
              </h2>
              <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{application.coverLetter}</p>
            </div>
          )}

          {/* 面试记录 */}
          {interviews.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">面试记录</h2>
              <div className="space-y-4">
                {interviews.map(interview => (
                  <div key={interview.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">
                          第 {interview.interviewRound} 轮面试
                        </div>
                        <div className="text-sm text-slate-500">
                          {new Date(interview.interviewDate).toLocaleDateString('zh-CN')} {interview.interviewTime}
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        interview.status === 'completed' ? 'bg-green-100 text-green-700' :
                        interview.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {interview.status === 'completed' ? '已完成' :
                         interview.status === 'scheduled' ? '已安排' : '已取消'}
                      </span>
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                      类型: {interview.interviewType} | 地点: {interview.location}
                    </div>
                    {interview.interviewResult && (
                      <div className="mt-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          interview.interviewResult === '通过' ? 'bg-green-100 text-green-700' :
                          interview.interviewResult === '未通过' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {interview.interviewResult}
                        </span>
                      </div>
                    )}
                    {interview.interviewFeedback && (
                      <div className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                        <div className="font-medium mb-1">反馈:</div>
                        <p className="whitespace-pre-wrap">{interview.interviewFeedback}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 侧边栏信息 */}
        <div className="space-y-6">
          {/* 状态历史 */}
          {application.statusHistory && application.statusHistory.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">状态历史</h3>
              <div className="space-y-3">
                {application.statusHistory.map((history, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-2 h-2 rounded-full ${
                        index === 0 ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
                      }`} />
                      {index < application.statusHistory!.length - 1 && (
                        <div className="w-0.5 h-8 bg-slate-300 dark:bg-slate-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-slate-900 dark:text-white">{history.status}</div>
                      <div className="text-xs text-slate-500">
                        {new Date(history.timestamp).toLocaleString('zh-CN')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Offer信息 */}
          {application.status === 'Offer' && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Offer信息</h3>
              {application.offerSalary && (
                <div className="mb-2">
                  <div className="text-sm text-slate-500">薪资</div>
                  <div className="font-medium text-slate-900 dark:text-white">{application.offerSalary}</div>
                </div>
              )}
              {application.offerBenefits && application.offerBenefits.length > 0 && (
                <div>
                  <div className="text-sm text-slate-500 mb-1">福利</div>
                  <div className="flex flex-wrap gap-2">
                    {application.offerBenefits.map((benefit, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                        {benefit}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 拒绝原因 */}
          {application.status === 'Rejected' && application.rejectionReason && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">拒绝原因</h3>
              <p className="text-slate-700 dark:text-slate-300">{application.rejectionReason}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetailView;

