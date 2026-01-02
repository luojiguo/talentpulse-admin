import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Star as StarFilled, ArrowLeft, Building2, Briefcase, Mail, Phone, Globe } from 'lucide-react';
import { companyAPI, candidateAPI, jobAPI } from '@/services/apiService';
import { JobPosting } from '@/types/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import { message } from 'antd';

const CompanyDetailScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [company, setCompany] = useState<any>(null);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [jobsByRecruiter, setJobsByRecruiter] = useState<Record<string | number, JobPosting[]>>({});
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | number | null>(null);

  useEffect(() => {
    let userId: string | number | null = null;
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        userId = user.id;
        setCurrentUserId(userId);
      } catch (e) {
        console.error('解析用户信息失败:', e);
      }
    }
    
    const fetchCompanyDetails = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const companyResponse = await companyAPI.getCompanyById(id);
        setCompany(companyResponse.data);
        
        const jobsResponse = await jobAPI.getJobsByCompanyId(id);
        setJobs(jobsResponse.data);
        
        const groupedJobs = jobsResponse.data.reduce((acc: Record<string | number, JobPosting[]>, job: JobPosting) => {
          const recruiterId = job.recruiter_id || job.posterId;
          if (recruiterId) {
            if (!acc[recruiterId]) {
              acc[recruiterId] = [];
            }
            acc[recruiterId].push(job);
          }
          return acc;
        }, {});
        setJobsByRecruiter(groupedJobs);
        
        if (userId) {
          checkSavedStatus(userId);
        }
      } catch (err) {
        setError('获取公司详情失败');
        console.error('获取公司详情失败:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyDetails();
  }, [id]);
  
  // 当currentUserId变化时，重新检查收藏状态
  useEffect(() => {
    if (currentUserId && company) {
      checkSavedStatus(currentUserId);
    }
  }, [currentUserId, company]);

  const checkSavedStatus = async (userId: string | number) => {
    if (!company) return;
    try {
      const response = await candidateAPI.getCandidateSavedCompanies(userId);
      const savedCompanies = response.data || [];
      const isCompanySaved = savedCompanies.some((savedCompany: any) => savedCompany.id === company.id);
      setIsSaved(isCompanySaved);
    } catch (error) {
      console.error('检查收藏状态失败:', error);
    }
  };

  const handleToggleSave = async () => {
    if (!id || !currentUserId) {
      message.error('请先登录');
      return;
    }
    
    try {
      if (isSaved) {
        await candidateAPI.removeSavedCompany(currentUserId, id);
        setIsSaved(false);
        message.success('已取消收藏');
      } else {
        await candidateAPI.saveCompany(currentUserId, id);
        setIsSaved(true);
        message.success('收藏成功');
      }
    } catch (err: any) {
      console.error('收藏/取消收藏公司失败:', err);
      message.error(err.response?.data?.message || '操作失败，请稍后重试');
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="加载公司详情中..." />;
  }

  if (error || !company) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{error || '公司不存在'}</h2>
          <button 
            onClick={handleBack}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <button 
        onClick={handleBack}
        className="inline-flex items-center px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        返回
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
        <div className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-6">
            <div className="w-24 h-24 bg-gray-50 rounded-2xl flex items-center justify-center text-4xl shadow-inner overflow-hidden">
              {company.logo && (company.logo.startsWith('http') || company.logo.startsWith('/')) ? (
                <img 
                  src={company.logo} 
                  alt={company.name} 
                  className="w-full h-full object-contain p-3"
                />
              ) : (
                <Building2 className="w-12 h-12 text-gray-400" />
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">{company.name}</h1>
                  <p className="text-sm text-gray-500 mb-2">{company.industry} · {company.size} · {company.address || '未填写地址'}</p>
                </div>
                
                <button 
                  onClick={handleToggleSave}
                  className={`inline-flex items-center px-4 py-2 rounded-lg transition-all ${isSaved ? 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg'}`}
                >
                  {isSaved ? (
                    <StarFilled className="w-4 h-4 mr-2 fill-current transition-all duration-300 scale-110" />
                  ) : (
                    <Star className="w-4 h-4 mr-2 transition-all duration-300" />
                  )}
                  {isSaved ? '已收藏' : '收藏'}
                </button>
              </div>
              
              <div className="flex flex-wrap gap-3 mt-3">
                {company.company_website && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Globe className="w-4 h-4 mr-1.5" />
                    <a href={company.company_website} target="_blank" rel="noopener noreferrer" className="hover:underline">{company.company_website}</a>
                  </div>
                )}
                {company.company_email && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="w-4 h-4 mr-1.5" />
                    <a href={`mailto:${company.company_email}`} className="hover:underline">{company.company_email}</a>
                  </div>
                )}
                {company.company_phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="w-4 h-4 mr-1.5" />
                    <span>{company.company_phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {company.description && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">公司简介</h2>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{company.description}</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Briefcase className="w-5 h-5 mr-2" />
            最新职位 ({company.job_count || 0})
          </h2>
          
          {jobs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">该公司暂无职位发布</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(jobsByRecruiter).map(([recruiterId, jobsList]) => (
                <div key={recruiterId}>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {jobsList[0].recruiter_name !== undefined && jobsList[0].recruiter_name !== null ? jobsList[0].recruiter_name : `HR ${recruiterId}`}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(jobsList as JobPosting[]).map((job: JobPosting) => (
                      <div key={job.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <h4 className="font-semibold text-gray-900 mb-2">
                          {job.title !== undefined && job.title !== null ? job.title : '未知职位'}
                        </h4>
                        <p className="text-sm text-gray-500 mb-3">
                          {job.company_name !== undefined && job.company_name !== null ? job.company_name : '未知公司'} · 
                          {job.location !== undefined && job.location !== null ? job.location : '未知地点'} · 
                          {job.salary !== undefined && job.salary !== null ? job.salary : '面议'}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                            {job.experience !== undefined && job.experience !== null ? job.experience : '经验不限'}
                          </span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                            {job.degree !== undefined && job.degree !== null ? job.degree : '学历不限'}
                          </span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                            {job.type !== undefined && job.type !== null ? job.type : '全职'}
                          </span>
                          {job.work_mode !== undefined && job.work_mode !== null && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">{job.work_mode}</span>
                          )}
                        </div>
                        <button 
                          className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                          onClick={() => navigate(`/job/${job.id}`)}
                        >
                          查看详情
                        </button>
                      </div>
                    ))}
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

export default CompanyDetailScreen;