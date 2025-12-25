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

  // 使用父组件传递的jobs数据，如果没有则使用本地数据
  const jobs = propsJobs || localJobs;

  const formatJobData = (data: any[]): JobPosting[] => {
    return data.map((job: any) => ({
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

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div>
        <div className="mb-6 flex items-center gap-4">
          <h3 className="text-xl font-bold text-slate-900">所有岗位</h3>
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
              <p className="text-red-600 font-medium">加载职位数据失败: {typeof jobsError === 'string' ? jobsError : '未知错误'}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                重新加载
              </button>
            </div>
          ) : jobs.length > 0 ? (
            <>
              {/* Show jobs with infinite scroll */}
              {jobs.map(job => (
                <JobCard key={job.id} job={job} onChat={onChat} />
              ))}

            </>
          ) : (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">暂无职位发布</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobListScreen;