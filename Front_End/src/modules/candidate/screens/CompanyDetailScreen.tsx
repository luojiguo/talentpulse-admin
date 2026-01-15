import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Star as StarFilled, ArrowLeft, Building2, Briefcase, Mail, Phone, Globe, MapPin, ChevronRight } from 'lucide-react';
import { processAvatarUrl } from '@/components/AvatarUploadComponent';
import { companyAPI, candidateAPI, jobAPI } from '@/services/apiService';
import { JobPosting } from '@/types/types';
import { message, Tooltip } from 'antd';
import UserAvatar from '@/components/UserAvatar';

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
        console.error('解析用户信息失败:', e);
        setCurrentUserId(null);
      }
    } else {
      setCurrentUserId(null);
    }

    const fetchCompanyDetails = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError('');

        const companyResponse = await companyAPI.getCompanyById(id) as any;
        if (companyResponse?.success && companyResponse?.data) {
          setCompany(companyResponse.data);
        } else {
          throw new Error(companyResponse?.message || '获取公司详情失败');
        }

        const jobsResponse = await jobAPI.getJobsByCompanyId(id) as any;
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

  useEffect(() => {
    if (currentUserId && company) {
      checkSavedStatus(currentUserId);
    }
  }, [currentUserId, company]);

  const checkSavedStatus = async (userId: string | number) => {
    if (!company || !company.id) return;
    try {
      const response = await candidateAPI.getCandidateSavedCompanies(userId) as any;
      if (response?.success) {
        const savedCompanies = Array.isArray(response?.data) ? response.data : [];
        const isCompanySaved = savedCompanies.some((savedCompany: any) => {
          return savedCompany && savedCompany.id && savedCompany.id === company.id;
        });
        setIsSaved(isCompanySaved);
      } else {
        throw new Error(response?.message || '获取收藏状态失败');
      }
    } catch (error) {
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
        response = await candidateAPI.removeSavedCompany(currentUserId, id) as any;
        if (response?.success) {
          setIsSaved(false);
          message.success('已取消收藏');
        } else {
          throw new Error(response?.message || '取消收藏失败');
        }
      } else {
        response = await candidateAPI.saveCompany(currentUserId, id) as any;
        if (response?.success) {
          setIsSaved(true);
          message.success('收藏成功');
        } else {
          throw new Error(response?.message || '收藏失败');
        }
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || '操作失败，请稍后重试';
      message.error(errorMsg);
      setTimeout(() => {
        checkSavedStatus(currentUserId);
      }, 500);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-slate-950">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-brand-100 dark:border-slate-800 border-t-brand-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 bg-brand-500 rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-bold tracking-wider animate-pulse text-sm">正在加载公司详情...</p>
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="flex h-screen items-center justify-center flex-col bg-white dark:bg-slate-950 px-4">
        <div className="w-24 h-24 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center mb-8 relative">
          <div className="absolute inset-0 bg-rose-100 dark:bg-rose-900/30 rounded-full animate-ping opacity-20"></div>
          <span className="text-5xl relative z-10">⚠️</span>
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-3">{error || '公司信息暂不可用'}</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-10 text-center max-w-md leading-relaxed">抱歉，我们找不到您要查看的公司信息，您可以尝试搜索其他优质企业。</p>
        <button
          onClick={handleBack}
          className="px-10 py-4 bg-brand-500 text-white font-black rounded-2xl hover:bg-brand-600 transition-all shadow-xl shadow-brand-500/20 active:scale-95 flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" /> 返回上一页
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-50/30 dark:bg-slate-950 min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-10">
          <button
            onClick={handleBack}
            className="flex items-center text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-all font-black group active:scale-95 bg-white dark:bg-slate-900 px-6 py-3 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800"
          >
            <ArrowLeft className="w-5 h-5 mr-1.5 group-hover:-translate-x-1 transition-transform" /> 返回公司列表
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-200/60 dark:border-slate-800 mb-10 overflow-hidden">
          <div className="p-8 md:p-12 bg-gradient-to-br from-white via-white to-brand-50/20 dark:from-slate-900 dark:to-brand-950/10">
            <div className="flex flex-col md:flex-row items-start gap-10 mb-12">
              <div className="w-32 h-32 bg-white dark:bg-slate-950 rounded-[2rem] flex items-center justify-center text-4xl shadow-xl shadow-slate-100 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden shrink-0 group hover:scale-105 transition-transform duration-500 transition-colors">
                {company?.logo && company.logo !== 'C' ? (
                  <img
                    src={processAvatarUrl(company.logo)}
                    alt={company.name || '公司logo'}
                    className="w-full h-full object-contain p-3"
                  />
                ) : (
                  <Building2 className="w-16 h-16 text-slate-200 dark:text-slate-700 group-hover:text-brand-200 transition-colors" />
                )}
              </div>

              <div className="flex-1 w-full">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                  <div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tight leading-tight">{company.name || '未知公司'}</h1>
                    <div className="flex flex-wrap items-center gap-3 text-slate-500 dark:text-slate-400 font-semibold">
                      {[
                        { icon: <Briefcase className="w-4 h-4" />, text: company.industry },
                        { icon: <Building2 className="w-4 h-4" />, text: company.size },
                        { icon: <MapPin className="w-4 h-4" />, text: company.address || '未填写地址' },
                      ].map((item, idx) => (
                        <span key={idx} className="flex items-center px-4 py-2.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-200/60 dark:border-slate-700 shadow-sm text-sm">
                          <span className="text-brand-500 mr-2">{item.icon}</span>
                          {item.text || '未知'}
                        </span>
                      ))}
                    </div>
                  </div>

                  <Tooltip title={isSaved ? "取消收藏" : "收藏该企业"} placement="top">
                    <button
                      onClick={handleToggleSave}
                      className={`inline-flex items-center px-8 py-4 rounded-2xl font-black transition-all active:scale-90 text-base shadow-lg ${isSaved
                        ? 'bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-900/30 shadow-rose-100/50 dark:shadow-none'
                        : 'bg-brand-500 text-white hover:bg-brand-600 shadow-brand-500/20 dark:shadow-none'
                        }`}
                      style={{
                        backgroundColor: isSaved ? '#fff1f2' : '#007AFF',
                        color: isSaved ? '#e11d48' : '#ffffff',
                        borderColor: isSaved ? '#ffe4e6' : 'transparent',
                        boxShadow: isSaved ? 'none' : '0 10px 15px -3px rgba(0, 122, 255, 0.3)'
                      }}
                    >
                      {isSaved ? (
                        <StarFilled className="w-5 h-5 mr-2.5 fill-current transition-all duration-300" />
                      ) : (
                        <Star className="w-5 h-5 mr-2.5 transition-all duration-300" />
                      )}
                      {isSaved ? '已收藏公司' : '收藏公司'}
                    </button>
                  </Tooltip>
                </div>

                <div className="flex flex-wrap gap-4 mt-10">
                  {company.company_website && typeof company.company_website === 'string' && (company.company_website.startsWith('http') || company.company_website.startsWith('https')) && (
                    <div className="flex items-center text-sm text-slate-600 dark:text-slate-400 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm px-4 py-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-700 shadow-sm group hover:border-brand-300 dark:hover:border-brand-800 transition-all">
                      <Globe className="w-4.5 h-4.5 mr-2.5 text-brand-500" />
                      <a href={company.company_website} target="_blank" rel="noopener noreferrer" className="font-bold hover:text-brand-600 dark:hover:text-brand-400 transition-colors">{company.company_website}</a>
                    </div>
                  )}
                  {company.company_email && typeof company.company_email === 'string' && /^[^@]+@[^@]+[^@]+$/.test(company.company_email) && (
                    <div className="flex items-center text-sm text-slate-600 dark:text-slate-400 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm px-4 py-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-700 shadow-sm group hover:border-brand-300 dark:hover:border-brand-800 transition-all">
                      <Mail className="w-4.5 h-4.5 mr-2.5 text-brand-500" />
                      <a href={`mailto:${company.company_email}`} className="font-bold hover:text-brand-600 dark:hover:text-brand-400 transition-colors">{company.company_email}</a>
                    </div>
                  )}
                  {company.company_phone && typeof company.company_phone === 'string' && company.company_phone.trim() !== '' && (
                    <div className="flex items-center text-sm text-slate-600 dark:text-slate-400 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm px-4 py-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-700 shadow-sm group hover:border-brand-300 dark:hover:border-brand-800 transition-all">
                      <Phone className="w-4.5 h-4.5 mr-2.5 text-brand-500" />
                      <span className="font-bold">{company.company_phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {company.description && (
              <div className="pt-12 border-t border-slate-100 dark:border-slate-800 relative">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 flex items-center">
                  <div className="w-1.5 h-6 bg-brand-500 mr-4 rounded-full"></div>
                  公司简介
                </h2>
                <div className="bg-white dark:bg-slate-800/30 p-8 md:p-10 rounded-[2rem] border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-brand-50/50 dark:bg-brand-900/10 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-brand-200/30 transition-colors duration-700"></div>
                  <p className="text-slate-600 dark:text-slate-400 leading-loose whitespace-pre-line text-lg font-medium relative z-10">{company.description}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-200/60 dark:border-slate-800 mb-12 overflow-hidden">
          <div className="p-8 md:p-12">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-10 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-2.5 h-8 bg-gradient-to-b from-brand-400 to-brand-600 mr-5 rounded-full shadow-lg shadow-brand-200 dark:shadow-none"></div>
                在招职位
                <span className="ml-5 text-[10px] font-black text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30 px-4 py-1.5 rounded-full uppercase tracking-widest border border-brand-100 dark:border-brand-900/50">
                  {company.job_count || jobs.length || 0} 个职位
                </span>
              </div>
            </h2>

            {jobs.length === 0 ? (
              <div className="text-center py-24 bg-brand-50/10 dark:bg-slate-800/30 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-400">
                <div className="w-16 h-16 bg-white dark:bg-slate-950 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
                  <Briefcase className="w-8 h-8 opacity-20 text-brand-500" />
                </div>
                <p className="font-black text-lg text-slate-500">该公司暂无职位发布</p>
              </div>
            ) : (
              <div className="space-y-16">
                {Object.entries(jobsByRecruiter || {}).map(([recruiterId, jobsList]) => {
                  const validJobsList = Array.isArray(jobsList) ? jobsList : [];
                  if (validJobsList.length === 0) return null;
                  const recruiterName = validJobsList[0]?.recruiter_name || `HR ${recruiterId}`;

                  return (
                    <div key={recruiterId} className="relative">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="w-1.5 h-6 bg-brand-500/50 rounded-full"></div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                          {recruiterName} <span className="text-slate-400 dark:text-slate-500 ml-1 font-bold text-base">发布的职位</span>
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {validJobsList.map((job: JobPosting) => {
                          if (!job) return null;
                          const jobId = job.id || `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

                          return (
                            <div
                              key={jobId}
                              className="group bg-white dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 rounded-[2rem] p-8 hover:shadow-2xl hover:shadow-brand-100/30 dark:hover:shadow-none hover:border-brand-300 dark:hover:border-brand-800 transition-all duration-500 cursor-pointer relative overflow-hidden active:scale-[0.98]"
                              onClick={() => job.id && navigate(`/job/${job.id}`)}
                            >
                              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-400 to-brand-100 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                              <div className="flex justify-between items-start mb-4">
                                <h4 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors duration-300">
                                  {job.title || '未知职位'}
                                </h4>
                                <span
                                  className="text-2xl font-black tabular-nums tracking-tight"
                                  style={{ color: '#007AFF' }}
                                >
                                  {job.salary || '面议'}
                                </span>
                              </div>

                              <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 mb-6 font-bold">
                                <MapPin className="w-4.5 h-4.5 mr-2 text-brand-400/60" />
                                {job.location || '未知地点'}
                              </div>

                              <div className="flex flex-wrap gap-2.5 mb-8">
                                {[
                                  job.experience || '经验不限',
                                  job.degree || '学历不限',
                                  job.type || '全职',
                                  job.work_mode
                                ].filter(Boolean).map((tag, i) => (
                                  <span key={i} className="px-4 py-1.5 bg-brand-50/50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-xl text-[10px] font-black uppercase tracking-wider border border-brand-100/50 dark:border-brand-900/30 group-hover:bg-brand-50 dark:group-hover:bg-brand-500/20 transition-colors">
                                    {tag}
                                  </span>
                                ))}
                              </div>

                              <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                  <UserAvatar src={job.recruiter_avatar} name={job.recruiter_name} size={32} className="border-2 border-white dark:border-slate-700 shadow-sm" />
                                  <div className="flex flex-col">
                                    <span className="text-sm font-black text-slate-900 dark:text-white">{job.recruiter_name}</span>
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{job.recruiter_position || 'HR'}</span>
                                  </div>
                                </div>
                                <div className="flex items-center text-brand-500 font-black text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                  查看详情 <ChevronRight className="w-4 h-4 ml-1" />
                                </div>
                              </div>
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
    </div>
  );
};

export default CompanyDetailScreen;