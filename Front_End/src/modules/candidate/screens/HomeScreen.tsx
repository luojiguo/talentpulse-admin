import React, { useState, useEffect, useMemo } from 'react';
import { JobPosting, Company } from '@/types/types';
import { jobAPI, companyAPI } from '@/services/apiService';
import { Search, ChevronUp, ChevronDown } from 'lucide-react';
import CompanyCard from '../components/CompanyCard';
import JobCard from '../components/JobCard';
import CityPickerModal from '../components/CityPickerModal';

interface HomeScreenProps {
  jobs?: JobPosting[];
  loadingJobs?: boolean;
  jobsError?: string | null;
  followedCompanies: (string | number)[];
  setFollowedCompanies: React.Dispatch<React.SetStateAction<(string | number)[]>>;
  currentUser: { id: number | string; name: string; email: string; avatar?: string };
  onChat: (jobId: string | number, recruiterId: string | number) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ jobs: propsJobs, loadingJobs: propsLoadingJobs, jobsError: propsJobsError, followedCompanies, setFollowedCompanies, currentUser, onChat }) => {
  // State for jobs and companies
  // 如果父组件传递了jobs数据，使用父组件的数据，否则自己获取
  const [localJobs, setLocalJobs] = useState<JobPosting[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [allCompanies, setAllCompanies] = useState<Company[]>([]); // 存储所有公司
  const [matchedCompanies, setMatchedCompanies] = useState<Company[]>([]); // 存储匹配的公司
  const [loadingJobs, setLoadingJobs] = useState(!propsJobs);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [companiesError, setCompaniesError] = useState<string | null>(null);
  
  // 使用父组件传递的jobs数据，如果没有则使用本地数据
  const jobs = propsJobs || localJobs;
  const [combinedSearchQuery, setCombinedSearchQuery] = useState('');
  const [showAllCompanies, setShowAllCompanies] = useState(false);
  const [isCityPickerOpen, setIsCityPickerOpen] = useState(false);
  const [filterLocation, setFilterLocation] = useState('全部');
  const [filterExperience, setFilterExperience] = useState('全部');
  const [filterDegree, setFilterDegree] = useState('全部');
  const [filterJobType, setFilterJobType] = useState('全部');
  const [visibleJobsCount, setVisibleJobsCount] = useState(10);

  // Filter options
  const experiences = ['全部', '应届', '1-3年', '3-5年', '5-10年', '10年以上'];
  const degrees = ['全部', '高中/中专', '大专', '本科', '硕士', '博士'];
  const jobTypes = ['全部', '全职', '兼职', '实习', '远程'];

  // Toggle follow company
  const toggleFollowCompany = async (companyId: string | number) => {
    try {
      if (followedCompanies.includes(companyId)) {
        // Unfollow company
        await companyAPI.unfollowCompany(companyId, currentUser.id);
        setFollowedCompanies(prev => prev.filter(id => id !== companyId));
      } else {
        // Follow company
        await companyAPI.followCompany(companyId, currentUser.id);
        setFollowedCompanies(prev => [...prev, companyId]);
      }
    } catch (error) {
      console.error('Follow/unfollow company error:', error);
    }
  };

  // Filtered jobs based on search and filters
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const matchesSearch = !combinedSearchQuery || 
        (job.title && job.title.toLowerCase().includes(combinedSearchQuery.toLowerCase())) ||
        (job.company_name && job.company_name.toLowerCase().includes(combinedSearchQuery.toLowerCase())) ||
        (job.description && job.description.toLowerCase().includes(combinedSearchQuery.toLowerCase()));
      
      const matchesLocation = filterLocation === '全部' || job.location === filterLocation;
      const matchesExperience = filterExperience === '全部' || job.experience === filterExperience;
      const matchesDegree = filterDegree === '全部' || job.degree === filterDegree;
      const matchesJobType = filterJobType === '全部' || job.type === filterJobType;
      
      return matchesSearch && matchesLocation && matchesExperience && matchesDegree && matchesJobType;
    });
  }, [jobs, combinedSearchQuery, filterLocation, filterExperience, filterDegree, filterJobType]);

  // 只有在没有从父组件传递jobs数据时才获取 - 优化：并行加载
  useEffect(() => {
    // 如果父组件已经提供了jobs数据，不需要自己获取
    if (propsJobs) {
      setLoadingJobs(propsLoadingJobs || false);
      setJobsError(propsJobsError || null);
      return;
    }
    
    let isMounted = true;
    
    const fetchJobs = async () => {
      try {
        // 不立即设置loading，先检查是否有缓存数据
        setJobsError(null);
        
        // 使用智能推荐API，根据用户信息匹配职位
        const response = currentUser?.id 
          ? await jobAPI.getRecommendedJobs(currentUser.id)
          : await jobAPI.getAllJobs();
        
        if (!isMounted) return;
        
        if (response && response.status === 'success' && Array.isArray(response.data)) {
          const formattedJobs: JobPosting[] = response.data.map((job: any) => ({
            id: job.id,
            title: job.title,
            company: job.company_name || job.company_id || '未知公司',
            company_name: job.company_name,
            department: job.department || '',
            location: job.location || '未知地点',
            salary: job.salary || '面议',
            description: job.description || '',
            type: job.type || '全职',
            experience: job.experience || '不限',
            degree: job.degree || '不限',
            posterId: job.recruiter_id || 0,
            applicants: job.applications_count || 0,
            status: job.status === 'active' ? 'Active' : 'Closed',
            postedDate: job.publish_date ? new Date(job.publish_date).toLocaleDateString() : new Date().toLocaleDateString(),
            recruiter_name: job.recruiter_name,
            recruiter_position: job.recruiter_position,
            recruiter_id: job.recruiter_id,
            recruiter_avatar: job.recruiter_avatar
          }));
          setLocalJobs(formattedJobs);
        } else {
          setLocalJobs([]);
          setJobsError('职位数据格式不正确');
        }
      } catch (error: any) {
        if (isMounted) {
          // 只有在没有本地数据时才设置错误
          if (localJobs.length === 0) {
            setLocalJobs([]);
            setJobsError(error.message || '加载职位数据失败');
          }
          console.error('获取职位数据失败:', error);
        }
      } finally {
        if (isMounted) {
          setLoadingJobs(false);
        }
      }
    };

    // 只有在没有本地数据时才显示loading
    if (localJobs.length === 0) {
      setLoadingJobs(true);
    }
    fetchJobs();
    
    return () => {
      isMounted = false;
    };
  }, [propsJobs, propsLoadingJobs, propsJobsError, currentUser?.id]);

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
        if (recommendedResponse && recommendedResponse.status === 'success' && Array.isArray(recommendedResponse.data)) {
          const formattedMatched = formatCompanies(recommendedResponse.data);
          setMatchedCompanies(formattedMatched);
          // 默认显示匹配的公司
          setCompanies(formattedMatched);
        }
        
        // 处理所有公司
        if (allCompaniesResponse && allCompaniesResponse.status === 'success' && Array.isArray(allCompaniesResponse.data)) {
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
      {/* Filter Section - Now at the top of job list */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Keyword Search */}
          <div className="md:col-span-12 lg:col-span-4">
               <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  placeholder="搜索职位、公司或技能..."
                  value={combinedSearchQuery}
                  onChange={(e) => setCombinedSearchQuery(e.target.value)}
                />
               </div>
          </div>
          
          {/* Filters */}
          <div className="md:col-span-12 lg:col-span-8">
            <div className="flex flex-wrap gap-3 items-center">
              {/* City Select */}
              <button 
                onClick={() => setIsCityPickerOpen(true)} 
                className="flex items-center px-3 py-2.5 rounded-lg bg-white border border-gray-300 text-gray-700 hover:border-indigo-500 hover:text-indigo-600 transition-all font-medium text-sm shadow-sm flex-shrink-0 min-w-[80px]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5 text-indigo-500"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                {filterLocation === '鍏ㄩ儴' ? '城市' : filterLocation}
              </button>
              
              {/* Experience Select */}
              <select 
                value={filterExperience} 
                onChange={(e) => setFilterExperience(e.target.value)}
                className="px-3 py-2.5 rounded-lg bg-white border border-gray-300 text-gray-700 hover:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium text-sm shadow-sm flex-shrink-0 min-w-[100px]"
              >
                {experiences.map(exp => (
                                <option key={exp} value={exp}>{exp === '鍏ㄩ儴' ? '经验' : exp}</option>
                            ))}
              </select>
              
              {/* Degree Select */}
              <select 
                value={filterDegree} 
                onChange={(e) => setFilterDegree(e.target.value)}
                className="px-3 py-2.5 rounded-lg bg-white border border-gray-300 text-gray-700 hover:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium text-sm shadow-sm flex-shrink-0 min-w-[100px]"
              >
                {degrees.map(deg => (
                                <option key={deg} value={deg}>{deg === '鍏ㄩ儴' ? '学历' : deg}</option>
                            ))}
              </select>
              
              {/* Job Type Select */}
              <select 
                value={filterJobType} 
                onChange={(e) => setFilterJobType(e.target.value)}
                className="px-3 py-2.5 rounded-lg bg-white border border-gray-300 text-gray-700 hover:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium text-sm shadow-sm flex-shrink-0 min-w-[120px]"
              >
                {jobTypes.map(type => (
                                <option key={type} value={type}>{type === '全部' ? '职位类型' : type}</option>
                            ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-12">
        <div className="flex justify-between items-end mb-6">
          <h3 className="text-xl font-bold text-slate-900">热门公司</h3>
          {shouldShowMoreButton && (
            <button 
              onClick={handleShowAllCompanies}
              className="text-sm text-indigo-600 font-medium hover:underline flex items-center"
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
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-500">加载公司数据中...</p>
            </div>
          </div>
        ) : companiesError ? (
          <div className="text-center py-12 bg-red-50 rounded-2xl border border-red-200">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-red-600 font-medium">加载公司数据失败: {companiesError}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              重新加载
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
            {displayedCompanies.map(company => (
              <CompanyCard key={company.id} company={company} isFollowed={followedCompanies.includes(company.id)} onToggleFollow={toggleFollowCompany} />
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="mb-6">
          <h3 className="text-xl font-bold text-slate-900">最新职位</h3>
        </div>
        <div className="space-y-4">
          {loadingJobs ? (
            <div className="text-center py-12">
              <div className="inline-block animate-pulse">
                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500">加载职位数据中...</p>
              </div>
            </div>
          ) : jobsError ? (
            <div className="text-center py-12 bg-red-50 rounded-2xl border border-red-200">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-red-600 font-medium">加载职位数据失败: {jobsError}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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
                <div className="text-center py-4">
                  <div className="inline-block animate-pulse">
                    <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">没有找到符合条件的职位</p>
              <button onClick={() => {setCombinedSearchQuery(''); setFilterLocation('全部'); setFilterExperience('全部'); setFilterDegree('全部'); setFilterJobType('全部');}} className="mt-4 text-indigo-600 font-bold hover:underline">清除筛选条件</button>
            </div>
          )}
        </div>
      </div>
      <CityPickerModal isOpen={isCityPickerOpen} onClose={() => setIsCityPickerOpen(false)} currentCity={filterLocation} onSelectCity={setFilterLocation} />
    </div>
  );
};

export default HomeScreen;