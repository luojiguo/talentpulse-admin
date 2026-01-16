import React, { useState, useEffect, useMemo } from 'react';
import { JobPosting } from '@/types/types';
import { jobAPI } from '@/services/apiService';
import JobCard from '../components/JobCard';
import { Search, ChevronDown, MapPin, Briefcase, Filter, GraduationCap } from 'lucide-react';
import { Select } from 'antd';
import CityPickerModal from '../components/CityPickerModal';
import { EXPERIENCE_OPTIONS, DEGREE_OPTIONS, JOB_TYPE_OPTIONS } from '@/constants/constants';

interface JobListScreenProps {
  jobs?: JobPosting[];
  loadingJobs?: boolean;
  jobsError?: string | null;
  currentUser: { id: number | string; name: string; email: string; avatar?: string } | null;
  onChat: (jobId: string | number, recruiterId: string | number) => void;
}

const JobListScreen: React.FC<JobListScreenProps> = ({ jobs: propsJobs, loadingJobs: propsLoadingJobs, jobsError: propsJobsError, currentUser, onChat }) => {
  // State for jobs
  // 如果父组件传递了jobs数据，使用父组件的数据，否则自己获取
  const [localJobs, setLocalJobs] = useState<JobPosting[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(!propsJobs);
  const [jobsError, setJobsError] = useState<string | null>(null);

  // Complex Filter States
  const [combinedSearchQuery, setCombinedSearchQuery] = useState('');
  const [isCityPickerOpen, setIsCityPickerOpen] = useState(false);
  const [filterLocation, setFilterLocation] = useState('全部');
  const [filterExperience, setFilterExperience] = useState('全部');
  const [filterDegree, setFilterDegree] = useState('全部');
  const [filterJobType, setFilterJobType] = useState('全部');


  // 使用父组件传递的jobs数据，如果没有则使用本地数据
  const jobs = propsJobs || localJobs;

  const formatJobData = (data: any[]): JobPosting[] => {
    return data.map((job: any) => ({
      id: job.id,
      title: job.title,
      company: String(job.company_name || job.company_id || '未知公司'),
      company_name: job.company_name,
      department: job.department || '',
      location: job.location || '未知地点',
      salary: job.salary || '面议',
      description: job.description || '',
      type: job.type || '全职',
      work_mode: job.work_mode || '',
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
  };

  // Fetch all jobs if not provided by parent
  useEffect(() => {
    if (propsJobs) {
      setLoadingJobs(propsLoadingJobs || false);
      setJobsError(propsJobsError || null);
      return;
    }

    let isMounted = true;

    const fetchJobs = async () => {
      setLoadingJobs(true);
      setJobsError(null);

      try {
        const response = await jobAPI.getAllJobs();

        if (isMounted && response && (response as any).status === 'success' && Array.isArray(response.data)) {
          const newJobs = formatJobData(response.data);
          setLocalJobs(newJobs);
        } else if (isMounted) {
          setJobsError('职位数据格式不正确');
        }
      } catch (error: any) {
        if (isMounted) {
          setJobsError(error.message || '加载职位数据失败');
          console.error('获取所有职位失败:', error);
        }
      } finally {
        if (isMounted) setLoadingJobs(false);
      }
    };

    fetchJobs();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propsJobs, propsLoadingJobs, propsJobsError]);


  // 使用固定的筛选选项，确保选项完整且一致
  const filterOptions = useMemo(() => {
    const existingExperiences = new Set<string>();
    const existingDegrees = new Set<string>();
    const existingJobTypes = new Set<string>();

    jobs.forEach(job => {
      if (job.experience && job.experience.trim()) existingExperiences.add(job.experience);
      if (job.degree && job.degree.trim()) existingDegrees.add(job.degree);
      if (job.type && job.type.trim()) existingJobTypes.add(job.type);
      if (job.work_mode && job.work_mode.trim() === '远程') existingJobTypes.add('远程');
    });

    const experiences = [...EXPERIENCE_OPTIONS];
    const degrees = [...DEGREE_OPTIONS];
    const jobTypes = [...JOB_TYPE_OPTIONS];

    existingExperiences.forEach(exp => !experiences.includes(exp) && experiences.push(exp));
    existingDegrees.forEach(deg => !degrees.includes(deg) && degrees.push(deg));
    existingJobTypes.forEach(type => !jobTypes.includes(type) && jobTypes.push(type));

    return { experiences, degrees, jobTypes };
  }, [jobs]);


  // Filtered jobs based on search and filters (多条件AND筛选)
  const filteredJobs = useMemo(() => {
    if (!jobs || jobs.length === 0) return [];

    return jobs.filter(job => {
      // 1. 搜索关键词匹配
      const matchesSearch = !combinedSearchQuery ||
        (job.title && job.title.toLowerCase().includes(combinedSearchQuery.toLowerCase())) ||
        (job.company_name && job.company_name.toLowerCase().includes(combinedSearchQuery.toLowerCase())) ||
        (job.description && job.description.toLowerCase().includes(combinedSearchQuery.toLowerCase())) ||
        (job.company && String(job.company).toLowerCase().includes(combinedSearchQuery.toLowerCase()));

      // 2. 城市筛选
      const matchesLocation = filterLocation === '全部' || (job.location && job.location === filterLocation);

      // 3. 经验筛选
      const matchesExperience = filterExperience === '全部'
        ? true
        : (() => {
          if (job.experience === undefined || job.experience === null) return true;
          if (typeof job.experience === 'string' && job.experience.trim() === '') return true;
          if (job.experience === '不限') return true;
          return job.experience === filterExperience;
        })();

      // 4. 学历筛选
      const matchesDegree = filterDegree === '全部'
        ? true
        : (() => {
          if (job.degree === undefined || job.degree === null) return true;
          if (typeof job.degree === 'string' && job.degree.trim() === '') return true;
          if (job.degree === '不限') return true;
          return job.degree === filterDegree;
        })();

      // 5. 职位类型筛选
      const matchesJobType = filterJobType === '全部'
        ? true
        : filterJobType === '远程'
          ? (job.type === '远程' || job.work_mode === '远程')
          : (() => {
            if (job.type === undefined || job.type === null) return true;
            return job.type === filterJobType;
          })();

      return matchesSearch && matchesLocation && matchesExperience && matchesDegree && matchesJobType;
    });
  }, [jobs, combinedSearchQuery, filterLocation, filterExperience, filterDegree, filterJobType]);


  const [columns, setColumns] = useState<JobPosting[][]>([]);

  // Calculate columns for Masonry layout
  useEffect(() => {
    const calculateColumns = () => {
      const width = window.innerWidth;
      let colCount = 1;
      if (width >= 1280) colCount = 4; // Extra large screens
      else if (width >= 1024) colCount = 3; // Desktop
      else if (width >= 768) colCount = 2; // Tablet

      // Initialize columns
      const newCols: JobPosting[][] = Array.from({ length: colCount }, () => []);

      // Distribute jobs
      filteredJobs.forEach((job, index) => {
        newCols[index % colCount].push(job);
      });

      setColumns(newCols);
    };

    calculateColumns();
    window.addEventListener('resize', calculateColumns);
    return () => window.removeEventListener('resize', calculateColumns);
  }, [filteredJobs]);


  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h3 className="text-2xl font-bold text-slate-900">所有岗位</h3>
      </div>

      {/* Complex Filter Section */}
      <div className="bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl p-4 sm:p-5 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-800 mb-8 transition-colors duration-300 sticky top-20 z-30">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Keyword Search */}
          <div className="md:col-span-12 lg:col-span-4">
            <div className="relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 w-5 h-5 transition-colors duration-300" />
              <input
                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 transition-all duration-300"
                placeholder="搜索职位、公司或技能..."
                value={combinedSearchQuery}
                onChange={(e) => setCombinedSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Filters */}
          <div className="md:col-span-12 lg:col-span-8">
            <div className="flex flex-wrap gap-2.5 items-center">
              {/* City Select */}
              <button
                onClick={() => setIsCityPickerOpen(true)}
                className="flex items-center px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-white dark:hover:bg-slate-800 active:scale-95 transition-all duration-300 font-medium text-sm shadow-sm flex-shrink-0 min-w-[100px] justify-between group"
              >
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-slate-400 group-hover:text-brand-500 transition-colors" />
                  <span className="truncate max-w-[80px]">{filterLocation === '全部' ? '城市' : filterLocation}</span>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-brand-500 ml-2 transition-colors" />
              </button>

              {/* Experience Select */}
              <div className="relative flex-shrink-0 min-w-[110px]">
                <select
                  className="appearance-none w-full pl-10 pr-8 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-700 dark:text-slate-300 font-medium text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer"
                  value={filterExperience}
                  onChange={(e) => setFilterExperience(e.target.value)}
                >
                  {filterOptions.experiences.map(exp => (
                    <option key={exp} value={exp}>{exp === '全部' ? '经验' : exp}</option>
                  ))}
                </select>
                <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>

              {/* Degree Select */}
              <div className="relative flex-shrink-0 min-w-[110px]">
                <select
                  className="appearance-none w-full pl-10 pr-8 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-700 dark:text-slate-300 font-medium text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer"
                  value={filterDegree}
                  onChange={(e) => setFilterDegree(e.target.value)}
                >
                  {filterOptions.degrees.map(deg => (
                    <option key={deg} value={deg}>{deg === '全部' ? '学历' : deg}</option>
                  ))}
                </select>
                <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>

              {/* Job Type Select */}
              <div className="relative flex-shrink-0 min-w-[110px]">
                <select
                  className="appearance-none w-full pl-10 pr-8 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-700 dark:text-slate-300 font-medium text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer"
                  value={filterJobType}
                  onChange={(e) => setFilterJobType(e.target.value)}
                >
                  {filterOptions.jobTypes.map(type => (
                    <option key={type} value={type}>{type === '全部' ? '类型' : type}</option>
                  ))}
                </select>
                <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>

              {/* Reset Filter Button */}
              {(filterLocation !== '全部' || filterExperience !== '全部' || filterDegree !== '全部' || filterJobType !== '全部') && (
                <button
                  onClick={() => {
                    setFilterLocation('全部');
                    setFilterExperience('全部');
                    setFilterDegree('全部');
                    setFilterJobType('全部');
                    setCombinedSearchQuery('');
                  }}
                  className="ml-auto flex items-center px-4 py-2.5 text-sm font-medium text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors"
                >
                  <Filter className="w-4 h-4 mr-1.5" />
                  重置
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* City Picker Modal */}
      <CityPickerModal
        isOpen={isCityPickerOpen}
        onClose={() => setIsCityPickerOpen(false)}
        onSelectCity={(city) => {
          setFilterLocation(city);
          setIsCityPickerOpen(false);
        }}
        currentCity={filterLocation === '全部' ? '' : filterLocation}
      />

      <div>

        <div className="space-y-4">
          {loadingJobs ? (
            <div className="text-center py-12">
              <div className="inline-block animate-pulse">
                <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-4"></div>
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
              <p className="text-red-600 font-medium">加载职位数据失败: {typeof jobsError === 'string' ? jobsError : '未知错误'}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                重新加载
              </button>
            </div>
          ) : filteredJobs.length > 0 ? (
            <div className="flex gap-4 items-start">
              {columns.map((col, index) => (
                <div key={index} className="flex-1 space-y-4">
                  {col.map(job => (
                    <JobCard key={job.id} job={job} onChat={onChat} />
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">
                {combinedSearchQuery ? `未找到与 "${combinedSearchQuery}" 相关的职位` : '暂无职位发布'}
              </p>
              {combinedSearchQuery && (
                <button
                  onClick={() => setCombinedSearchQuery('')}
                  className="mt-4 text-brand-600 hover:text-brand-700 font-medium transition-colors"
                >
                  清空搜索条件
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobListScreen;