import React, { useState, useEffect, useMemo } from 'react';
import { JobPosting } from '@/types/types';
import { jobAPI } from '@/services/apiService';
import JobCard from '../components/JobCard';

interface JobListScreenProps {
  jobs?: JobPosting[];
  loadingJobs?: boolean;
  jobsError?: string | null;
  currentUser: { id: number | string; name: string; email: string; avatar?: string };
  onChat: (jobId: string | number, recruiterId: string | number) => void;
}

const JobListScreen: React.FC<JobListScreenProps> = ({ jobs: propsJobs, loadingJobs: propsLoadingJobs, jobsError: propsJobsError, currentUser, onChat }) => {
  // State for jobs
  // 如果父组件传递了jobs数据，使用父组件的数据，否则自己获取
  const [localJobs, setLocalJobs] = useState<JobPosting[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(!propsJobs);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [debouncedSearchText, setDebouncedSearchText] = useState('');


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
  }, [propsJobs, propsLoadingJobs, propsJobsError]); // 注意：不要把 loadingJobs 放入依赖，否则会死循环

  // Debounce search text
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchText]);

  // Fetch filtered jobs from backend when search text changes
  useEffect(() => {
    if (propsJobs) {
      return; // 如果父组件传递了数据，使用父组件的数据
    }

    if (!debouncedSearchText.trim()) {
      // 没有搜索条件，获取所有职位
      return;
    }

    let isMounted = true;

    const fetchSearchedJobs = async () => {
      setLoadingJobs(true);
      setJobsError(null);

      try {
        const response = await jobAPI.getAllJobs();

        if (isMounted && response && (response as any).status === 'success' && Array.isArray(response.data)) {
          // 后端目前不支持搜索关键词，所以我们仍然在前端过滤
          const allJobs = formatJobData(response.data);
          const filtered = allJobs.filter(job => {
            const title = String(job.title || '').toLowerCase();
            const company = String(job.company || '').toLowerCase();
            const location = String(job.location || '').toLowerCase();
            const description = String(job.description || '').toLowerCase();
            const lowerSearch = debouncedSearchText.toLowerCase().trim();

            return title.includes(lowerSearch) ||
              company.includes(lowerSearch) ||
              location.includes(lowerSearch) ||
              description.includes(lowerSearch);
          });
          setLocalJobs(filtered);
        } else if (isMounted) {
          setJobsError('职位数据格式不正确');
        }
      } catch (error: any) {
        if (isMounted) {
          setJobsError(error.message || '搜索职位数据失败');
          console.error('搜索职位失败:', error);
        }
      } finally {
        if (isMounted) setLoadingJobs(false);
      }
    };

    fetchSearchedJobs();

    return () => { isMounted = false; };
  }, [debouncedSearchText, propsJobs]);

  // 搜索过滤逻辑
  const filteredJobs = useMemo(() => {
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
                {searchText ? `未找到与 "${searchText}" 相关的职位` : '暂无职位发布'}
              </p>
              {searchText && (
                <button
                  onClick={() => setSearchText('')}
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