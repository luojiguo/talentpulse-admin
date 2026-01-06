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
    const storedUser = localStorage.getItem('currentUser');
    let userId: string | number | null = null;
    
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        userId = user.id;
        setCurrentUserId(userId);
      } catch (e) {
        // 解析用户信息失败，使用默认值
        console.error('解析用户信息失败:', e);
        setCurrentUserId(null);
      }
    } else {
      // 未找到用户信息，使用默认值
      setCurrentUserId(null);
    }
    
    const fetchCompanyDetails = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError('');
        
        const companyResponse = await companyAPI.getCompanyById(id);
        // 请求工具已经处理了响应，直接访问 data 字段
        if (companyResponse?.success && companyResponse?.data) {
          setCompany(companyResponse.data);
        } else {
          throw new Error(companyResponse?.message || '获取公司详情失败');
        }
        
        const jobsResponse = await jobAPI.getJobsByCompanyId(id);
        // 请求工具已经处理了响应，直接访问 data 字段
        if (jobsResponse?.success) {
          const jobsData = Array.isArray(jobsResponse?.data) ? jobsResponse.data : [];
          setJobs(jobsData);
          
          const groupedJobs = jobsData.reduce((acc: Record<string | number, JobPosting[]>, job: JobPosting) => {
            if (!job) return acc;
            
            const recruiterId = job.recruiter_id || job.posterId || 'unknown';
            if (!acc[recruiterId]) {
              acc[recruiterId] = [];
            }
            acc[recruiterId].push(job);
            return acc;
          }, {});
          setJobsByRecruiter(groupedJobs);
        } else {
          setJobs([]);
          setJobsByRecruiter({});
        }
        
        // 只有当userId有效时才检查收藏状态
        if (userId) {
          checkSavedStatus(userId);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : '获取公司详情失败';
        setError(errorMsg);
        setCompany(null);
        setJobs([]);
        setJobsByRecruiter({});
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
    if (!company || !company.id) return;
    try {
      const response = await candidateAPI.getCandidateSavedCompanies(userId);
      // 请求工具已经处理了响应，直接访问 data 字段
      if (response?.success) {
        const savedCompanies = Array.isArray(response?.data) ? response.data : [];
        const isCompanySaved = savedCompanies.some((savedCompany: any) => {
          // 确保savedCompany和company都有id属性
          return savedCompany && savedCompany.id && savedCompany.id === company.id;
        });
        setIsSaved(isCompanySaved);
      } else {
        throw new Error(response?.message || '获取收藏状态失败');
      }
    } catch (error) {
      // 检查收藏状态失败，使用默认值
      // 出错时默认设置为未收藏
      console.error('获取收藏状态失败:', error);
      setIsSaved(false);
    }
  };

  const handleToggleSave = async () => {
    if (!id || !currentUserId) {
      message.error('请先登录');
      return;
    }
    
    try {
      let response;
      
      if (isSaved) {
        response = await candidateAPI.removeSavedCompany(currentUserId, id);
        if (response?.success) {
          setIsSaved(false);
          message.success('已取消收藏');
        } else {
          throw new Error(response?.message || '取消收藏失败');
        }
      } else {
        response = await candidateAPI.saveCompany(currentUserId, id);
        if (response?.success) {
          setIsSaved(true);
          message.success('收藏成功');
        } else {
          throw new Error(response?.message || '收藏失败');
        }
      }
    } catch (err: any) {
      // 更加友好的错误提示
      const errorMsg = err.response?.data?.message || err.message || '操作失败，请稍后重试';
      message.error(errorMsg);
      // 确保UI状态与实际状态一致
      // 可以考虑重新检查收藏状态
      setTimeout(() => {
        checkSavedStatus(currentUserId);
      }, 500);
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
              {company?.logo && typeof company.logo === 'string' && (company.logo.startsWith('http') || company.logo.startsWith('/')) ? (
                <img 
                  src={company.logo} 
                  alt={company.name || '公司logo'} 
                  className="w-full h-full object-contain p-3"
                  onError={(e) => {
                    // 图片加载失败时显示默认图标
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      const icon = document.createElement('div');
                      icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>';
                      parent.appendChild(icon);
                    }
                  }}
                />
              ) : (
                <Building2 className="w-12 h-12 text-gray-400" />
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">{company.name || '未知公司'}</h1>
                  <p className="text-sm text-gray-500 mb-2">
                    {company.industry || '未知行业'} · 
                    {company.size || '未知规模'} · 
                    {company.address || '未填写地址'}
                  </p>
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
                {/* 公司网站 - 确保是有效的URL */}
                {company.company_website && typeof company.company_website === 'string' && (company.company_website.startsWith('http') || company.company_website.startsWith('https')) && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Globe className="w-4 h-4 mr-1.5" />
                    <a href={company.company_website} target="_blank" rel="noopener noreferrer" className="hover:underline">{company.company_website}</a>
                  </div>
                )}
                {/* 公司邮箱 - 确保是有效的邮箱地址 */}
                {company.company_email && typeof company.company_email === 'string' && /^[^@]+@[^@]+[^@]+$/.test(company.company_email) && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="w-4 h-4 mr-1.5" />
                    <a href={`mailto:${company.company_email}`} className="hover:underline">{company.company_email}</a>
                  </div>
                )}
                {/* 公司电话 - 确保是非空字符串 */}
                {company.company_phone && typeof company.company_phone === 'string' && company.company_phone.trim() !== '' && (
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
              {Object.entries(jobsByRecruiter || {}).map(([recruiterId, jobsList]) => {
                // 确保jobsList是数组
                const validJobsList = Array.isArray(jobsList) ? jobsList : [];
                if (validJobsList.length === 0) return null;
                
                // 安全获取招聘者名称
                const recruiterName = validJobsList[0]?.recruiter_name || `HR ${recruiterId}`;
                
                return (
                  <div key={recruiterId}>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      {recruiterName}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {validJobsList.map((job: JobPosting) => {
                        if (!job) return null;
                        
                        // 确保job有id
                        const jobId = job.id || `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                        
                        return (
                          <div key={jobId} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <h4 className="font-semibold text-gray-900 mb-2">
                              {job.title || '未知职位'}
                            </h4>
                            <p className="text-sm text-gray-500 mb-3">
                              {job.company_name || '未知公司'} · 
                              {job.location || '未知地点'} · 
                              {job.salary || '面议'}
                            </p>
                            <div className="flex flex-wrap gap-2 mb-3">
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                                {job.experience || '经验不限'}
                              </span>
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                                {job.degree || '学历不限'}
                              </span>
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                                {job.type || '全职'}
                              </span>
                              {job.work_mode && typeof job.work_mode === 'string' && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">{job.work_mode}</span>
                              )}
                            </div>
                            <button 
                              className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                              onClick={() => job.id && navigate(`/job/${job.id}`)}
                            >
                              查看详情
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyDetailScreen;