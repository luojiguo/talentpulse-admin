import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { JobPosting, Company, SystemUser } from '@/types/types';
import { jobAPI, companyAPI, userAPI } from '@/services/apiService';
import { Search, ChevronUp, ChevronDown, MapPin, Briefcase, Filter, CheckCircle, XCircle, AlertCircle, GraduationCap } from 'lucide-react';

import CompanyCard from '../components/CompanyCard';
import JobCard from '../components/JobCard';
import UserAvatar from '@/components/UserAvatar';
import CityPickerModal from '../components/CityPickerModal';
import { EXPERIENCE_OPTIONS, DEGREE_OPTIONS, JOB_TYPE_OPTIONS } from '@/constants/constants';
import { socketService } from '@/services/socketService';
import { SERVER_EVENTS } from '@/constants/socketEvents';

interface HomeScreenProps {
  jobs?: JobPosting[];
  loadingJobs?: boolean;
  jobsError?: string | null;
  followedCompanies: (string | number)[];
  setFollowedCompanies: React.Dispatch<React.SetStateAction<(string | number)[]>>;
  currentUser: { id: number | string; name: string; email: string; avatar?: string } | null;
  userProfile?: {
    city?: string;
    jobStatus?: string;
    expectedSalary?: string;
    expectedSalaryMin?: number;
    expectedSalaryMax?: number;
    avatar?: string;
    name?: string;
    desiredPosition?: string;
    preferredLocations?: string;
  };
  onRefreshProfile?: () => void;
  onChat: (jobId: string | number, recruiterId: string | number) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ jobs: propsJobs, loadingJobs: propsLoadingJobs, jobsError: propsJobsError, followedCompanies, setFollowedCompanies, currentUser, userProfile, onRefreshProfile, onChat }) => {
  // State for jobs and companies
  // 如果父组件传递了jobs数据，使用父组件的数据，否则自己获取
  const [localJobs, setLocalJobs] = useState<JobPosting[]>([]);
  const [useFilteredData, setUseFilteredData] = useState(false); // 标记是否使用筛选后的数据
  const [companies, setCompanies] = useState<Company[]>([]);
  const [allCompanies, setAllCompanies] = useState<Company[]>([]); // 存储所有公司
  const [matchedCompanies, setMatchedCompanies] = useState<Company[]>([]); // 存储匹配的公司
  const [loadingJobs, setLoadingJobs] = useState(!propsJobs);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [companiesError, setCompaniesError] = useState<string | null>(null);

  // 使用父组件传递的jobs数据，如果没有则使用本地数据
  const jobs = propsJobs || localJobs;
  const [searchText, setSearchText] = useState('');
  const [showAllCompanies, setShowAllCompanies] = useState(false);
  const [visibleJobsCount, setVisibleJobsCount] = useState(10);


  const [isAIPending, setIsAIPending] = useState(false);
  const [aiJobsError, setAIJobsError] = useState<string | null>(null);

  // Simple search filtering
  const filteredJobs = useMemo(() => {
    if (!jobs || jobs.length === 0) return [];
    if (!searchText.trim()) return jobs;

    const lowerSearch = searchText.toLowerCase().trim();
    return jobs.filter(job => {
      const title = String(job.title || '').toLowerCase();
      const company = String(job.company || '').toLowerCase();
      const location = String(job.location || '').toLowerCase();
      const description = String(job.description || '').toLowerCase();

      return title.includes(lowerSearch) ||
        company.includes(lowerSearch) ||
        location.includes(lowerSearch) ||
        description.includes(lowerSearch);
    });
  }, [jobs, searchText]);

  // Initial job fetch and triggers AI recommendation
  useEffect(() => {
    if (propsJobs) {
      setLoadingJobs(propsLoadingJobs || false);
      setJobsError(propsJobsError || null);
      return;
    }

    let isMounted = true;

    const fetchInitialJobs = async () => {
      if (localJobs.length === 0) setLoadingJobs(true);
      setJobsError(null);
      setAIJobsError(null);

      try {
        const response = currentUser?.id
          ? await jobAPI.getRecommendedJobs(currentUser.id, true) // Pass true to trigger AI
          : await jobAPI.getAllJobs();



        if (isMounted && response && (response as any).status === 'success' && Array.isArray(response.data)) {
          const formattedJobs = formatJobData(response.data);
          setLocalJobs(formattedJobs);
          // If a user is logged in, start polling for AI results
          if (currentUser?.id) {
            setIsAIPending(true);
          }
        } else if (isMounted) {
          setJobsError('职位数据格式不正确');
        }
      } catch (error: any) {
        if (isMounted) {
          setJobsError(error.message || '加载职位数据失败');
          console.error('获取初始职位失败:', error);
        }
      } finally {
        if (isMounted) setLoadingJobs(false);
      }
    };

    fetchInitialJobs();

    return () => { isMounted = false; };
  }, [propsJobs, propsLoadingJobs, propsJobsError, currentUser?.id]);

  // No backend filtering effect needed for simple search
  // useEffect logic removed


  // Poll for AI recommendations
  useEffect(() => {
    if (!isAIPending || !currentUser?.id) return;
    // ... existing AI polling logic ...
    // Note: This block is inside the replacement to maintain context, but the key change is adding the socket listener below

    let isMounted = true;
    const intervalId = setInterval(async () => {
      try {
        const res = await jobAPI.getRecommendedJobsStatus(currentUser.id);
        if (isMounted) {
          if ((res as any).status === 'completed') {
            setIsAIPending(false);
            setAIJobsError(null);
            console.log('AI recommendations loaded:', res.data);
            const aiJobs = formatJobData(res.data);
            setLocalJobs(prevJobs => {
              const jobMap = new Map();
              [...aiJobs, ...prevJobs].forEach(job => jobMap.set(job.id, job));
              return Array.from(jobMap.values());
            });
            clearInterval(intervalId);
          } else if ((res as any).status === 'failed') {
            setIsAIPending(false);
            setAIJobsError('AI推荐失败，请稍后重试。');
            clearInterval(intervalId);
          }
        }
      } catch (error) {
        if (isMounted) {
          setIsAIPending(false);
          setAIJobsError('获取AI推荐状态失败。');
          clearInterval(intervalId);
        }
      }
    }, 3000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [isAIPending, currentUser?.id]);

  // Listen for real-time job updates
  useEffect(() => {
    // Connect socket if not connected (idempotent)
    if (currentUser?.id) {
      socketService.connect(currentUser.id);
    }

    const socket = socketService.getSocket();

    if (socket) {
      const handleNewJob = (newJobData: any) => {
        console.log('收到新职位推送:', newJobData);

        // Format the new job data
        const formattedNewJobs = formatJobData([newJobData]);
        if (formattedNewJobs.length > 0) {
          const newJob = formattedNewJobs[0];

          // Update local jobs state
          setLocalJobs(prevJobs => {
            // Check if job already exists
            if (prevJobs.some(job => job.id === newJob.id)) {
              return prevJobs;
            }

            // Add new job to the top
            return [newJob, ...prevJobs];
          });
        }
      };

      socket.on(SERVER_EVENTS.JOB_POSTED, handleNewJob);

      const handleJobUpdate = (updatedJobData: any) => {
        console.log('收到职位更新推送:', updatedJobData);

        // Format the updated job data
        const formattedUpdatedJobs = formatJobData([updatedJobData]);
        if (formattedUpdatedJobs.length > 0) {
          const updatedJob = formattedUpdatedJobs[0];

          // Update local jobs state
          setLocalJobs(prevJobs => {
            return prevJobs.map(job =>
              job.id === updatedJob.id ? updatedJob : job
            );
          });
        }
      };

      socket.on(SERVER_EVENTS.JOB_UPDATED, handleJobUpdate);

      return () => {
        socket.off(SERVER_EVENTS.JOB_POSTED, handleNewJob);
        socket.off(SERVER_EVENTS.JOB_UPDATED, handleJobUpdate);
      };
    }
  }, [currentUser?.id]);

  const formatJobData = (data: any[]): JobPosting[] => {
    if (!data || !Array.isArray(data)) {
      console.warn('formatJobData: 数据格式不正确', data);
      return [];
    }

    return data.map((job: any) => {
      // 打印单个职位数据，查看具体字段
      console.log('单个职位原始数据:', job);

      // 直接使用数据库值，如果是 undefined 或 null 才使用默认值
      // 确保处理所有可能的字段名差异
      const title = job.title !== undefined && job.title !== null ? job.title : '未知职位';

      // 处理公司名称，可能来自job.company_name或job.company
      const companyName = job.company_name !== undefined && job.company_name !== null ? job.company_name :
        job.company !== undefined && job.company !== null ? job.company : '未知公司';

      const department = job.department !== undefined && job.department !== null ? job.department : '';
      const location = job.location !== undefined && job.location !== null ? job.location : '未知地点';
      const salary = job.salary !== undefined && job.salary !== null ? job.salary : '面议';
      const description = job.description !== undefined && job.description !== null ? job.description : '';
      const type = job.type !== undefined && job.type !== null ? job.type : '全职';
      const work_mode = job.work_mode !== undefined && job.work_mode !== null ? job.work_mode : undefined;
      const job_level = job.job_level !== undefined && job.job_level !== null ? job.job_level : '初级';
      const hiring_count = job.hiring_count !== undefined && job.hiring_count !== null ? job.hiring_count : 1;
      const urgency = job.urgency !== undefined && job.urgency !== null ? job.urgency : '普通';
      const views_count = job.views_count !== undefined && job.views_count !== null ? job.views_count : 0;
      const match_rate = job.match_rate !== undefined && job.match_rate !== null ? job.match_rate : 0;

      // 对于经验和学历，保持 trim 处理，但只有在字段不是 undefined 或 null 时才 trim
      const experience = job.experience !== undefined && job.experience !== null
        ? (typeof job.experience === 'string' ? job.experience.trim() : job.experience)
        : '经验不限';

      const degree = job.degree !== undefined && job.degree !== null
        ? (typeof job.degree === 'string' ? job.degree.trim() : job.degree)
        : '学历不限';

      const recruiter_name = job.recruiter_name !== undefined && job.recruiter_name !== null ? job.recruiter_name : '招聘负责人';
      const recruiter_position = job.recruiter_position !== undefined && job.recruiter_position !== null ? job.recruiter_position : '招聘专员';
      const recruiter_id = job.recruiter_id !== undefined && job.recruiter_id !== null ? job.recruiter_id : job.posterId !== undefined && job.posterId !== null ? job.posterId : 0;

      const applicants = job.applications_count !== undefined && job.applications_count !== null ? job.applications_count :
        job.applicants !== undefined && job.applicants !== null ? job.applicants : 0;

      const status = (job.status === 'active' || job.status === 'Active') ? 'Active' as const :
        (job.status === 'draft' || job.status === 'Draft') ? 'Draft' as const :
          (job.status === 'closed' || job.status === 'Closed') ? 'Closed' as const :
            'Active' as const;

      const postedDate = job.publish_date ? new Date(job.publish_date).toLocaleDateString() : new Date().toLocaleDateString();

      const formatted = {
        id: job.id,
        title: title,
        company: companyName,
        company_name: companyName,
        company_id: job.company_id,
        department: department,
        location: location,
        salary: salary,
        description: description,
        type: type,
        work_mode: work_mode,
        experience: experience,
        degree: degree,
        posterId: recruiter_id,
        applicants: applicants,
        status: status,
        postedDate: postedDate,
        recruiter_name: recruiter_name,
        recruiter_position: recruiter_position,
        recruiter_id: recruiter_id,
        recruiter_avatar: job.recruiter_avatar,
        // 新增jobs表字段
        job_level: job_level,
        hiring_count: hiring_count,
        urgency: urgency,
        views_count: views_count,
        match_rate: match_rate,
        // 公司相关字段（如果后端返回）
        company_industry: job.company_industry,
        company_size: job.company_size,
        company_address: job.company_address,
        company_logo: job.company_logo,
        company_website: job.company_website
      };

      console.log('单个职位格式化后:', formatted);
      return formatted;
    });
  };

  // Modify companies data loading logic - 根据用户期望职位智能推荐公司
  useEffect(() => {
    let isMounted = true;

    const fetchCompanies = async () => {
      try {
        setCompaniesError(null);
        setLoadingCompanies(true);

        // 并行获取推荐公司和所有公司，提高加载速度
        const promises = [];

        if (currentUser?.id) {
          promises.push(
            companyAPI.getRecommendedCompanies(currentUser.id)
              .catch(error => {
                console.warn('获取推荐公司失败，使用所有公司:', error);
                return null;
              })
          );
        }

        // 获取所有公司作为备用
        promises.push(companyAPI.getAllCompanies());

        // 并行执行所有请求
        const [recommendedResponse, allCompaniesResponse] = await Promise.all(promises);

        if (!isMounted) return;

        // 格式化所有公司数据
        const formatCompanies = (data: any[]): Company[] => {
          return data.map((company: any) => ({
            id: company.id,
            name: company.name || '未知公司',
            industry: company.industry || '未知行业',
            size: company.size || '未知规模',
            logo: company.logo || '🏢',
            status: company.is_verified ? 'Verified' : company.status === 'active' ? 'Pending' : 'Rejected',
            location: company.address || '未知地点',
            hrCount: 0,
            jobCount: company.job_count || 0,
            createdAt: company.created_at ? new Date(company.created_at).toLocaleDateString() : new Date().toLocaleDateString()
          }));
        };

        // 处理推荐的公司
        if (recommendedResponse && (recommendedResponse as any).status === 'success' && Array.isArray(recommendedResponse.data)) {
          const formattedMatched = formatCompanies(recommendedResponse.data);
          setMatchedCompanies(formattedMatched);
          // 默认显示匹配的公司
          setCompanies(formattedMatched);
        }

        // 处理所有公司
        if (allCompaniesResponse && (allCompaniesResponse as any).status === 'success' && Array.isArray(allCompaniesResponse.data)) {
          const formattedAll = formatCompanies(allCompaniesResponse.data);
          setAllCompanies(formattedAll);
          // 如果没有匹配的公司，显示所有公司
          if (!recommendedResponse || !recommendedResponse.data || recommendedResponse.data.length === 0) {
            setCompanies(formattedAll);
          }
        }
      } catch (error: any) {
        if (isMounted) {
          setCompanies([]);
          setCompaniesError(error.message || '加载公司数据失败');
          console.error('获取公司数据失败:', error);
        }
      } finally {
        if (isMounted) {
          setLoadingCompanies(false);
        }
      }
    };

    fetchCompanies();

    return () => {
      isMounted = false;
    };
  }, [currentUser?.id]);

  // 计算要显示的公司列表
  const displayedCompanies = useMemo(() => {
    if (showAllCompanies) {
      // 点击"查看更多"后：
      // 1. 如果匹配的公司数量 > 4，显示所有匹配的公司
      // 2. 如果匹配的公司数量 <= 4，显示所有公司（包括不匹配的）
      if (matchedCompanies.length > 4) {
        return matchedCompanies;
      } else {
        // 匹配的公司不够，显示所有公司（包括不匹配的）
        return allCompanies;
      }
    } else {
      // 默认只显示匹配的公司（前4个）
      return matchedCompanies.length > 0 ? matchedCompanies.slice(0, 4) : allCompanies.slice(0, 4);
    }
  }, [matchedCompanies, allCompanies, showAllCompanies]);

  // 判断是否显示"查看更多"按钮
  // 只有在有匹配的公司且数量>4，或者有更多公司（包括不匹配的）时才显示
  const shouldShowMoreButton = matchedCompanies.length > 4 || (matchedCompanies.length > 0 && allCompanies.length > matchedCompanies.length);

  // 处理"查看更多"按钮点击
  const handleShowAllCompanies = () => {
    setShowAllCompanies(!showAllCompanies);
  };

  // Infinite scroll for jobs
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100 && visibleJobsCount < filteredJobs.length) {
        setVisibleJobsCount(prev => Math.min(prev + 10, filteredJobs.length));
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [visibleJobsCount, filteredJobs.length]);




  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Simple Search Section - Now at Home */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h3 className="text-2xl font-bold text-slate-900">推荐职位</h3>
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent sm:text-sm transition-all shadow-sm"
            placeholder="搜索职位、公司、地点或描述..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          {searchText && (
            <button
              onClick={() => setSearchText('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              title="清除搜索"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="mb-12">
        <div className="flex justify-between items-end mb-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">热门公司</h3>
          {shouldShowMoreButton && (
            <button
              onClick={handleShowAllCompanies}
              className="text-sm text-brand-600 dark:text-brand-400 font-medium hover:underline flex items-center transition-colors duration-300"
            >
              {showAllCompanies ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" />
                  收起
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" />
                  查看更多
                </>
              )}
            </button>
          )}
        </div>
        {loadingCompanies ? (
          <div className="text-center py-12">
            <div className="inline-block animate-pulse">
              <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-500">加载公司数据中...</p>
            </div>
          </div>
        ) : companiesError ? (
          <div className="text-center py-12 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800/50">
            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-red-600 dark:text-red-400 font-medium">加载公司数据失败: {typeof companiesError === 'string' ? companiesError : '未知错误'}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              重新加载
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap justify-start gap-3">
            {displayedCompanies.map(company => (
              <CompanyCard key={company.id} company={company} />
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="mb-4 flex items-end justify-between border-b border-transparent pb-2">
          <div className="flex items-center gap-4">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">最新职位</h3>
            {isAIPending && (
              <div className="flex items-center gap-2 text-sm text-brand-600 bg-brand-50 dark:bg-brand-900/20 px-3 py-1 rounded-full animate-fade-in">
                <div className="w-3 h-3 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
                <span>AI 智能推荐中...</span>
              </div>
            )}
            {aiJobsError && (
              <div className="text-sm text-red-500">{aiJobsError}</div>
            )}
          </div>

          {/* Dynamic Recommendation Info - Replacing the count */}
          {/* User profile matching section removed */}
        </div>

        {/* Edit Profile Modal */}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loadingJobs ? (
            <div className="col-span-full text-center py-20">
              <div className="inline-block">
                <div className="w-12 h-12 border-4 border-brand-100 border-t-brand-500 rounded-full animate-spin mb-4 mx-auto"></div>
                <p className="text-slate-500 font-medium">为你寻找最适合的职位...</p>
              </div>
            </div>
          ) : jobsError ? (
            <div className="col-span-full text-center py-12 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-200 dark:border-red-800/30">
              <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-red-600 dark:text-red-400 font-medium">加载职位数据失败: {typeof jobsError === 'string' ? jobsError : '未知错误'}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-100"
              >
                重新加载
              </button>
            </div>
          ) : filteredJobs.length > 0 ? (
            <>
              {/* Show jobs with infinite scroll */}
              {filteredJobs.slice(0, visibleJobsCount).map(job => (
                <JobCard key={job.id} job={job} onChat={onChat} />
              ))}
              {/* Loading indicator when more jobs are available */}
              {visibleJobsCount < filteredJobs.length && (
                <div className="col-span-full text-center py-8">
                  <button
                    onClick={() => setVisibleJobsCount(prev => prev + 9)}
                    className="px-8 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:text-brand-600 hover:border-brand-200 transition-all font-medium"
                  >
                    加载更多职位
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="col-span-full text-center py-24 bg-white dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
              <div className="mx-auto w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                <Search className="w-10 h-10 text-slate-300" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-lg mb-2">没有找到符合条件的职位</p>
              <p className="text-slate-400 dark:text-slate-500 text-sm mb-6">尝试更换搜索词</p>
              <button
                onClick={() => {
                  setSearchText('');
                }}
                className="px-6 py-2.5 bg-brand-500 text-white rounded-xl font-bold hover:bg-brand-600 transition-all shadow-lg shadow-brand-100 dark:shadow-none"
              >
                清除搜索
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default HomeScreen;