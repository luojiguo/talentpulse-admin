import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { JobPosting, Company, SystemUser } from '@/types/types';
import { jobAPI, companyAPI, userAPI } from '@/services/apiService';
import { Search, ChevronUp, ChevronDown, MapPin, Briefcase, Filter, CheckCircle, XCircle, AlertCircle, Edit3 } from 'lucide-react';
import { Modal, Input, Select, message } from 'antd';
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
  currentUser: { id: number | string; name: string; email: string; avatar?: string };
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
  const [combinedSearchQuery, setCombinedSearchQuery] = useState('');
  const [showAllCompanies, setShowAllCompanies] = useState(false);
  const [isCityPickerOpen, setIsCityPickerOpen] = useState(false);
  const [filterLocation, setFilterLocation] = useState('全部');
  const [filterExperience, setFilterExperience] = useState('全部');
  const [filterDegree, setFilterDegree] = useState('全部');
  const [filterJobType, setFilterJobType] = useState('全部');
  const [visibleJobsCount, setVisibleJobsCount] = useState(10);

  // State for editing user profile
  const [editingField, setEditingField] = useState<'preferredLocations' | 'jobStatus' | 'expectedSalary' | 'desiredPosition' | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [salaryMin, setSalaryMin] = useState<number | undefined>(undefined);
  const [salaryMax, setSalaryMax] = useState<number | undefined>(undefined);
  const [savingProfile, setSavingProfile] = useState(false);

  // 使用固定的筛选选项，确保选项完整且一致
  // 同时从数据库中获取实际存在的值，用于验证和显示
  const filterOptions = useMemo(() => {
    // 从jobs数据中提取实际存在的值（用于验证数据一致性）
    const existingExperiences = new Set<string>();
    const existingDegrees = new Set<string>();
    const existingJobTypes = new Set<string>();

    jobs.forEach(job => {
      if (job.experience && job.experience.trim()) {
        existingExperiences.add(job.experience);
      }
      if (job.degree && job.degree.trim()) {
        existingDegrees.add(job.degree);
      }
      if (job.type && job.type.trim()) {
        existingJobTypes.add(job.type);
      }
      if (job.work_mode && job.work_mode.trim() === '远程') {
        existingJobTypes.add('远程');
      }
    });

    // 使用固定的选项列表，确保选项完整
    // 如果数据库中有不在固定列表中的值，也会包含进来（向后兼容）
    const experiences = [...EXPERIENCE_OPTIONS];
    const degrees = [...DEGREE_OPTIONS];
    const jobTypes = [...JOB_TYPE_OPTIONS];

    // 添加数据库中存在的但不在固定列表中的值（向后兼容）
    existingExperiences.forEach(exp => {
      if (!experiences.includes(exp)) {
        experiences.push(exp);
      }
    });

    existingDegrees.forEach(deg => {
      if (!degrees.includes(deg)) {
        degrees.push(deg);
      }
    });

    existingJobTypes.forEach(type => {
      if (!jobTypes.includes(type)) {
        jobTypes.push(type);
      }
    });

    return {
      experiences,
      degrees,
      jobTypes
    };
  }, [jobs]);

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

  const [isAIPending, setIsAIPending] = useState(false);
  const [aiJobsError, setAIJobsError] = useState<string | null>(null);

  // Filtered jobs based on search and filters (多条件AND筛选)
  const filteredJobs = useMemo(() => {
    if (!jobs || jobs.length === 0) return [];

    const filtered = jobs.filter(job => {
      // 1. 搜索关键词匹配（OR逻辑：匹配标题、公司名或描述）
      const matchesSearch = !combinedSearchQuery ||
        (job.title && job.title.toLowerCase().includes(combinedSearchQuery.toLowerCase())) ||
        (job.company_name && job.company_name.toLowerCase().includes(combinedSearchQuery.toLowerCase())) ||
        (job.description && job.description.toLowerCase().includes(combinedSearchQuery.toLowerCase()));

      // 2. 城市筛选（精确匹配）
      const matchesLocation = filterLocation === '全部' ||
        (job.location && job.location === filterLocation);

      // 3. 经验筛选
      // - 如果筛选条件是"全部"，显示所有职位
      // - 如果筛选条件是具体值：
      //   * 如果职位经验是 undefined/null/空/"不限"，表示接受任何经验，应该匹配
      //   * 否则精确匹配
      const matchesExperience = filterExperience === '全部'
        ? true
        : (() => {
          // 处理 undefined、null、空字符串的情况
          if (job.experience === undefined || job.experience === null) {
            return true; // undefined/null 表示接受任何经验
          }
          if (typeof job.experience === 'string' && job.experience.trim() === '') {
            return true; // 空字符串表示接受任何经验
          }
          if (job.experience === '不限') {
            return true; // "不限"表示接受任何经验
          }
          return job.experience === filterExperience; // 精确匹配
        })();

      // 4. 学历筛选
      // - 如果筛选条件是"全部"，显示所有职位
      // - 如果筛选条件是具体值：
      //   * 如果职位学历是 undefined/null/空/"不限"，表示接受任何学历，应该匹配
      //   * 否则精确匹配
      const matchesDegree = filterDegree === '全部'
        ? true
        : (() => {
          // 处理 undefined、null、空字符串的情况
          if (job.degree === undefined || job.degree === null) {
            return true; // undefined/null 表示接受任何学历
          }
          if (typeof job.degree === 'string' && job.degree.trim() === '') {
            return true; // 空字符串表示接受任何学历
          }
          if (job.degree === '不限') {
            return true; // "不限"表示接受任何学历
          }
          return job.degree === filterDegree; // 精确匹配
        })();

      // 5. 职位类型筛选
      // - 如果选择"全部"，显示所有职位
      // - 如果选择"远程"，匹配 type 为"远程"或 work_mode 为"远程"的职位
      // - 否则精确匹配 job.type
      // - 如果 job.type 是 undefined/null，视为匹配所有类型
      const matchesJobType = filterJobType === '全部'
        ? true
        : filterJobType === '远程'
          ? (job.type === '远程' || job.work_mode === '远程')
          : (() => {
            // 处理 undefined/null 的情况
            if (job.type === undefined || job.type === null) {
              return true; // undefined/null 表示接受任何类型
            }
            return job.type === filterJobType; // 精确匹配
          })();

      // 所有筛选条件必须同时满足（AND逻辑）
      return matchesSearch && matchesLocation && matchesExperience && matchesDegree && matchesJobType;
    });

    // 调试信息（仅在开发环境）
    if (process.env.NODE_ENV === 'development') {
      console.log('筛选结果:', {
        总职位数: jobs.length,
        筛选后数量: filtered.length,
        筛选条件: {
          城市: filterLocation,
          经验: filterExperience,
          学历: filterDegree,
          职位类型: filterJobType,
          搜索关键词: combinedSearchQuery || '无'
        }
      });
    }

    return filtered;
  }, [jobs, combinedSearchQuery, filterLocation, filterExperience, filterDegree, filterJobType]);

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

        console.log('API响应:', response);

        if (isMounted && response && (response as any).status === 'success' && Array.isArray(response.data)) {
          console.log('原始API数据:', response.data.slice(0, 5));
          const formattedJobs = formatJobData(response.data);
          console.log('格式化后的数据:', formattedJobs.slice(0, 5));
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

  // Fetch jobs from backend based on filter conditions
  useEffect(() => {
    if (propsJobs) {
      return; // 如果父组件传递了数据，使用父组件的数据
    }

    // 检查是否有筛选条件
    const hasFilters = filterLocation !== '全部' ||
      filterExperience !== '全部' ||
      filterDegree !== '全部' ||
      filterJobType !== '全部';

    if (!hasFilters) {
      // 没有筛选条件，使用初始数据
      setUseFilteredData(false);
      return;
    }

    let isMounted = true;

    const fetchFilteredJobs = async () => {
      setLoadingJobs(true);
      setJobsError(null);

      try {
        // 构建筛选参数
        const params: any = {
          limit: 1000
        };

        // 城市筛选
        if (filterLocation !== '全部') {
          params.location = filterLocation;
        }

        // 经验筛选 - 排除"不限"选项
        if (filterExperience !== '全部' && filterExperience !== '不限') {
          params.experience = filterExperience;
        }

        // 学历筛选 - 排除"不限"选项
        if (filterDegree !== '全部' && filterDegree !== '不限') {
          params.degree = filterDegree;
        }

        // 职位类型筛选 - 处理"远程"和其他类型
        if (filterJobType !== '全部') {
          if (filterJobType === '远程') {
            // 远程工作可以同时设置type和work_mode，或者只设置work_mode
            params.work_mode = '远程';
            // 也可以设置type为远程，但后端主要用work_mode筛选
            // params.type = '远程';
          } else {
            // 其他职位类型
            params.type = filterJobType;
          }
        }

        const response = await jobAPI.getAllJobs(params);

        if (isMounted && response && (response as any).status === 'success' && Array.isArray(response.data)) {
          const formattedJobs = formatJobData(response.data);
          setLocalJobs(formattedJobs);
          setUseFilteredData(true);
        } else if (isMounted) {
          setJobsError('职位数据格式不正确');
        }
      } catch (error: any) {
        if (isMounted) {
          setJobsError(error.message || '加载筛选职位失败');
          console.error('获取筛选职位失败:', error);
        }
      } finally {
        if (isMounted) setLoadingJobs(false);
      }
    };

    fetchFilteredJobs();

    return () => { isMounted = false; };
  }, [filterLocation, filterExperience, filterDegree, filterJobType, propsJobs]);

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


  // Optimize salary options generation
  const salaryOptions = useMemo(() => {
    const options = [];
    // 1k - 30k: 1k steps
    for (let i = 1; i <= 30; i++) {
      options.push({ value: i * 1000, label: `${i}k` });
    }
    // 31k - 100k: 1k steps
    for (let i = 31; i <= 100; i++) {
      options.push({ value: i * 1000, label: `${i}k` });
    }
    // 105k - 200k: 5k steps
    for (let i = 105; i <= 200; i += 5) {
      options.push({ value: i * 1000, label: `${i}k` });
    }
    // 210k - 500k: 10k steps
    for (let i = 210; i <= 500; i += 10) {
      options.push({ value: i * 1000, label: `${i}k` });
    }
    return options;
  }, []);

  const handleEditClick = (field: 'preferredLocations' | 'desiredPosition' | 'expectedSalary' | 'jobStatus', currentValue: string, minSal?: number, maxSal?: number) => {
    setEditingField(field);
    // If editing preferredLocations, use preferredLocations if available
    if (field === 'preferredLocations') {
      setEditValue(userProfile?.preferredLocations || '');
    } else {
      setEditValue(currentValue);
    }
    if (field === 'expectedSalary') {
      setSalaryMin(minSal);
      setSalaryMax(maxSal);
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUser?.id || !editingField) return;

    setSavingProfile(true);
    try {
      const updateData: Partial<SystemUser> & {
        expectedSalaryMin?: number;
        expectedSalaryMax?: number;
        preferredLocations?: string;
      } = {};
      if (editingField === 'preferredLocations') {
        updateData.preferredLocations = editValue;
      } else if (editingField === 'desiredPosition') {
        updateData.desiredPosition = editValue;
      } else if (editingField === 'expectedSalary') {
        // Construct salary string and min/max
        if (salaryMin !== undefined && salaryMax !== undefined) {
          updateData.expectedSalaryMin = salaryMin;
          updateData.expectedSalaryMax = salaryMax;
        }
      }

      const response = await userAPI.updateUser(String(currentUser.id), updateData);

      if (response.status === 'success') {
        message.success('个人信息更新成功！');
        if (onRefreshProfile) {
          onRefreshProfile(); // Refresh parent component's userProfile state
        }
        setEditingField(null);
        setEditValue('');
        setSalaryMin(undefined);
        setSalaryMax(undefined);
      } else {
        message.error(response.message || '更新失败，请重试。');
      }
    } catch (error) {
      console.error('Failed to update user profile:', error);
      message.error('更新失败，请检查网络或稍后重试。');
    } finally {
      setSavingProfile(false);
    }
  };

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
                <span className="flex-1 text-left">{filterLocation === '全部' ? '城市' : filterLocation}</span>
                <ChevronDown className="w-4 h-4 text-gray-400 ml-1" />
              </button>

              {/* Experience Select */}
              <div className="relative">
                <select
                  value={filterExperience}
                  onChange={(e) => setFilterExperience(e.target.value)}
                  className="px-3 py-2.5 pr-8 rounded-lg bg-white border border-gray-300 text-gray-700 hover:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium text-sm shadow-sm flex-shrink-0 min-w-[100px] appearance-none cursor-pointer"
                >
                  {filterOptions.experiences.map(exp => (
                    <option key={exp} value={exp}>{exp}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              {/* Degree Select */}
              <div className="relative">
                <select
                  value={filterDegree}
                  onChange={(e) => setFilterDegree(e.target.value)}
                  className="px-3 py-2.5 pr-8 rounded-lg bg-white border border-gray-300 text-gray-700 hover:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium text-sm shadow-sm flex-shrink-0 min-w-[100px] appearance-none cursor-pointer"
                >
                  {filterOptions.degrees.map(deg => (
                    <option key={deg} value={deg}>{deg}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              {/* Job Type Select */}
              <div className="relative">
                <select
                  value={filterJobType}
                  onChange={(e) => setFilterJobType(e.target.value)}
                  className="px-3 py-2.5 pr-8 rounded-lg bg-white border border-gray-300 text-gray-700 hover:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium text-sm shadow-sm flex-shrink-0 min-w-[120px] appearance-none cursor-pointer"
                >
                  {filterOptions.jobTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              {/* Clear Filters Button */}
              <button
                onClick={() => {
                  setCombinedSearchQuery('');
                  setFilterLocation('全部');
                  setFilterExperience('全部');
                  setFilterDegree('全部');
                  setFilterJobType('全部');
                }}
                className="px-3 py-2.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300 transition-all font-medium text-sm shadow-sm flex-shrink-0 min-w-[100px]"
              >
                清除筛选
              </button>
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
            <p className="text-red-600 font-medium">加载公司数据失败: {typeof companiesError === 'string' ? companiesError : '未知错误'}</p>
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
            <h3 className="text-2xl font-bold text-slate-800">最新职位</h3>
            {isAIPending && (
              <div className="flex items-center gap-2 text-sm text-indigo-500 bg-indigo-50 px-2 py-1 rounded-full">
                <div className="w-3 h-3 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                <span>AI 智能推荐中...</span>
              </div>
            )}
            {aiJobsError && (
              <div className="text-sm text-red-500">{aiJobsError}</div>
            )}
          </div>

          {/* Dynamic Recommendation Info - Replacing the count */}
          {userProfile && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-indigo-600 font-bold text-xs border border-indigo-200 overflow-hidden">
                  <UserAvatar
                    src={userProfile.avatar}
                    name={userProfile.name}
                    size={24}
                    className="w-full h-full"
                    alt="User"
                  />
                </div>
                <span className="text-sm font-bold text-slate-700">根据求职期望匹配：</span>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-900 font-medium">
                      {userProfile?.preferredLocations || '地点未填'}
                    </span>
                    <button
                      onClick={() => handleEditClick('preferredLocations', userProfile?.preferredLocations || '')}
                      className="text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <Edit3 size={14} />
                    </button>
                  </div>
                  <span className="text-indigo-200">|</span>
                  <span
                    onClick={() => handleEditClick('desiredPosition', userProfile.desiredPosition || '')}
                    className="bg-white px-1.5 py-0.5 rounded border border-indigo-100 text-indigo-600 cursor-pointer hover:bg-indigo-50 transition-colors hover:underline"
                    title="点击修改期望岗位"
                  >
                    {userProfile.desiredPosition || '岗位未填'}
                  </span>
                  <span className="text-indigo-200">|</span>
                  <span
                    onClick={() => handleEditClick('expectedSalary', '', userProfile.expectedSalaryMin, userProfile.expectedSalaryMax)}
                    className="bg-white px-1.5 py-0.5 rounded border border-indigo-100 text-indigo-600 cursor-pointer hover:bg-indigo-50 transition-colors hover:underline"
                    title="点击修改期望薪资"
                  >
                    {(() => {
                      if (userProfile.expectedSalaryMin !== undefined && userProfile.expectedSalaryMax !== undefined && userProfile.expectedSalaryMin !== null && userProfile.expectedSalaryMax !== null) {
                        const min = userProfile.expectedSalaryMin >= 1000 ? `${Math.round(userProfile.expectedSalaryMin / 1000)}k` : userProfile.expectedSalaryMin;
                        const max = userProfile.expectedSalaryMax >= 1000 ? `${Math.round(userProfile.expectedSalaryMax / 1000)}k` : userProfile.expectedSalaryMax;
                        return `${min}-${max}`;
                      }
                      return '薪资未填';
                    })()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Edit Profile Modal */}
        <Modal
          title={`修改${editingField === 'preferredLocations' ? '期望地点' :
            editingField === 'desiredPosition' ? '期望岗位' :
              editingField === 'expectedSalary' ? '期望薪资' : ''
            } `}
          open={!!editingField}
          onOk={handleSaveProfile}
          onCancel={() => {
            setEditingField(null);
            setEditValue('');
          }}
          okText="保存"
          cancelText="取消"
          confirmLoading={savingProfile}
        >
          {editingField === 'expectedSalary' ? (
            <div className="flex items-center gap-2">
              <Select
                placeholder="最低薪资"
                value={salaryMin}
                onChange={val => {
                  setSalaryMin(val);
                  // Reset max if it becomes invalid (< min)
                  if (salaryMax && val && salaryMax <= val) {
                    setSalaryMax(undefined);
                  }
                }}
                options={salaryOptions}
                style={{ width: '100%' }}
                showSearch
                optionFilterProp="label"
              />
              <span className="text-gray-400">至</span>
              <Select
                placeholder="最高薪资"
                value={salaryMax}
                onChange={val => setSalaryMax(val)}
                options={salaryOptions.filter(opt => !salaryMin || opt.value > salaryMin)}
                style={{ width: '100%' }}
                showSearch
                optionFilterProp="label"
                disabled={!salaryMin}
              />
            </div>
          ) : (
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder={
                editingField === 'preferredLocations' ? "请输入期望地点，如：北京,上海" :
                  editingField === 'desiredPosition' ? "请输入期望岗位，如：前端开发" :
                    "请输入内容"
              }
            />
          )}
        </Modal>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
              <button onClick={() => { setCombinedSearchQuery(''); setFilterLocation('全部'); setFilterExperience('全部'); setFilterDegree('全部'); setFilterJobType('全部'); }} className="mt-4 text-indigo-600 font-bold hover:underline">清除筛选条件</button>
            </div>
          )}
        </div>
      </div>
      <CityPickerModal isOpen={isCityPickerOpen} onClose={() => setIsCityPickerOpen(false)} currentCity={filterLocation} onSelectCity={setFilterLocation} />
    </div>
  );
};

export default HomeScreen;