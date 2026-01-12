

import { StatMetric, ApplicationTrendData, JobCategoryData, RecentActivity, Candidate, JobPosting, Language, Recruiter, Company, Conversation, UserProfile, Resume, PipelineCandidate, SystemUser, Application } from "../types/types";

// Translation Dictionary
export const TRANSLATIONS = {
  zh: {
    nav: {
      dashboard: '仪表盘',
      users: '用户管理',
      companies: '企业管理',
      candidates: '候选人库',
      jobs: '职位库',
      applications: '申请流程',
      analytics: '数据分析',
      settings: '系统设置',
      signout: '退出登录'
    },
    dashboard: {
      title: '数据概览',
      subtitle: '欢迎回来，管理员。今日数据实时监控。',
      search: '搜索候选人、职位或公司...',
      trends: '招聘趋势 (近7天)',
      category: '职位分布',
      activity: '最近动态',
      ai_btn: 'AI 智能分析',
      ai_analyzing: '分析中...',
      ai_title: 'AI 招聘决策简报',
      ai_loading: 'AI 正在分析系统数据...',
      ai_error: '服务暂时不可用，请稍后重试。',
      error: '错误',
      total_users: '总用户数',
      hr_users: '招聘方用户',
      candidates: '候选人用户',
      companies: '入驻企业数',
      jobs: '发布职位数',
      active_jobs: '活跃职位数',
      applications: '职位申请数',
      hired: '成功录用数',
      application_vs_interview: '申请与面试对比',
      growth_rate: '月度增长率',
      last_updated: '数据更新时间'
    },
    roles: {
      admin: '管理员',
      recruiter: '招聘方',
      candidate: '候选人',
      super_user: '超级用户',
      hiring_manager: '招聘经理'
    },
    users: {
      title: '系统用户管理',
      name: '用户姓名',
      role: '角色权限',
      status: '账户状态',
      lastLogin: '最后登录',
      action: '操作',
      createdAt: '注册时间',
    },
    companies: {
      title: '入驻企业库',
      name: '企业名称',
      industry: '行业',
      size: '人员规模',
      status: '认证状态',
      action: '管理',
      location: '所在地',
      jobs: '在招职位',
    },
    candidates: {
      title: '候选人库',
      name: '姓名',
      role: '期望职位',
      exp: '经验',
      status: '状态',
      skills: '技能标签',
      action: '操作'
    },
    jobs: {
      title: '平台职位库',
      position: '职位名称',
      company: '所属公司',
      dept: '部门',
      type: '性质',
      applicants: '申请人数',
      location: '地点',
      salary: '薪资',
      status: '状态',
      date: '发布日期'
    },
    applications: {
      title: '全局申请流程监控',
      candidate: '候选人',
      job: '申请职位',
      company: '公司',
      stage: '当前阶段',
      date: '申请日期',
      updated: '最后更新'
    },
    analytics: {
      title: '平台数据分析',
      funnel: '招聘漏斗转化率',
      timeToHire: '平均招聘周期 (天)',
      source: '候选人来源渠道质量'
    },
    settings: {
      title: '系统设置',
      language: '语言偏好',
      theme: '界面主题',
      notifications: '通知设置',
      save: '保存更改'
    }
  },
  en: {
    nav: {
      dashboard: 'Dashboard',
      users: 'System Users',
      companies: 'Companies',
      candidates: 'Candidates',
      jobs: 'Jobs',
      applications: 'Applications',
      analytics: 'Analytics',
      settings: 'Settings',
      signout: 'Sign Out'
    },
    dashboard: {
      title: 'Dashboard Overview',
      subtitle: "Welcome back, Admin. Here's what's happening today.",
      search: 'Search candidates, jobs, or companies...',
      trends: 'Application Trends (Last 7 Days)',
      category: 'Jobs by Category',
      activity: 'Recent Activity',
      ai_btn: 'AI Insights',
      ai_analyzing: 'Analyzing...',
      ai_title: 'Executive AI Summary',
      ai_loading: 'AI is analyzing system data...',
      ai_error: 'Service unavailable, please try again later.',
      error: 'Error',
      total_users: 'Total Users',
      hr_users: 'Recruiter Users',
      candidates: 'Candidate Users',
      companies: 'Registered Companies',
      jobs: 'Posted Jobs',
      active_jobs: 'Active Jobs',
      applications: 'Job Applications',
      hired: 'Successful Hires',
      application_vs_interview: 'Applications vs Interviews',
      growth_rate: 'Monthly Growth Rate',
      last_updated: 'Last Updated'
    },
    roles: {
      admin: 'Administrator',
      recruiter: 'Recruiter',
      candidate: 'Candidate',
      super_user: 'Super User',
      hiring_manager: 'Hiring Manager'
    },
    users: {
      title: 'System Users',
      name: 'User Name',
      role: 'Role',
      status: 'Status',
      lastLogin: 'Last Login',
      action: 'Action',
      createdAt: 'Created At',
    },
    companies: {
      title: 'Registered Companies',
      name: 'Company Name',
      industry: 'Industry',
      size: 'Size',
      status: 'Status',
      action: 'Manage',
      location: 'Location',
      jobs: 'Active Jobs',
    },
    candidates: {
      title: 'Candidate Database',
      name: 'Name',
      role: 'Target Role',
      exp: 'Experience',
      status: 'Status',
      skills: 'Skills',
      action: 'Action'
    },
    jobs: {
      title: 'Platform Job Database',
      position: 'Position',
      company: 'Company',
      dept: 'Department',
      type: 'Type',
      applicants: 'Applicants',
      location: 'Location',
      salary: 'Salary',
      status: 'Status',
      date: 'Posted Date'
    },
    applications: {
      title: 'Global Application Flow Monitoring',
      candidate: 'Candidate',
      job: 'Applied Job',
      company: 'Company',
      stage: 'Current Stage',
      date: 'Applied Date',
      updated: 'Last Updated'
    },
    analytics: {
      title: 'Platform Analytics',
      funnel: 'Recruitment Funnel Conversion',
      timeToHire: 'Average Time to Hire (Days)',
      source: 'Candidate Source Quality'
    },
    settings: {
      title: 'System Settings',
      language: 'Language Preference',
      theme: 'Interface Theme',
      notifications: 'Notifications',
      save: 'Save Changes'
    }
  }
};

// --- Admin Dashboard Mocks ---

export const getMockStats = (lang: Language): StatMetric[] => [
  {
    id: '1',
    label: lang === 'zh' ? '今日平台浏览量' : 'Daily Platform Visits',
    value: '89,432',
    change: 5.2,
    trend: 'up',
    icon: 'eye'
  },
  {
    id: '2',
    label: lang === 'zh' ? '最热浏览公司' : 'Most Viewed Company',
    value: '科技之星 (1,204 views)',
    change: 18.5,
    trend: 'up',
    icon: 'flame'
  },
  {
    id: '3',
    label: lang === 'zh' ? '最热浏览岗位' : 'Most Viewed Job',
    value: '高级前端 (2,481 views)',
    change: 28,
    trend: 'up',
    icon: 'zap'
  },
  {
    id: '4',
    label: lang === 'zh' ? '入驻企业总数' : 'Total Companies',
    value: '1,250',
    change: 1.2,
    trend: 'up',
    icon: 'building'
  },
];

export const getMockTrends = (lang: Language): ApplicationTrendData[] => {
  const days = lang === 'zh'
    ? ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return [
    { name: days[0], applications: 2400, interviews: 400, hires: 24 },
    { name: days[1], applications: 3500, interviews: 550, hires: 35 },
    { name: days[2], applications: 4100, interviews: 600, hires: 42 },
    { name: days[3], applications: 3800, interviews: 480, hires: 38 },
    { name: days[4], applications: 2900, interviews: 390, hires: 29 },
    { name: days[5], applications: 1200, interviews: 150, hires: 10 },
    { name: days[6], applications: 1500, interviews: 180, hires: 12 },
  ];
};

export const getMockCategories = (lang: Language): JobCategoryData[] => [
  { name: lang === 'zh' ? '工程研发' : 'Engineering', value: 45, color: '#3b82f6' },
  { name: lang === 'zh' ? '产品设计' : 'Design', value: 25, color: '#8b5cf6' },
  { name: lang === 'zh' ? '市场营销' : 'Marketing', value: 15, color: '#f59e0b' },
  { name: lang === 'zh' ? '销售商务' : 'Sales', value: 10, color: '#10b981' },
  { name: lang === 'zh' ? '其他职能' : 'Other', value: 5, color: '#64748b' },
];

export const getMockActivity = (lang: Language): RecentActivity[] => [
  { id: '101', user: 'Sarah Chen', action: lang === 'zh' ? '申请职位' : 'Applied for', target: 'Senior React Dev', timestamp: '2 mins ago', status: 'success' },
  { id: '102', user: 'Mike Ross', action: lang === 'zh' ? '更新简历' : 'Updated Resume', target: 'Profile', timestamp: '15 mins ago', status: 'neutral' },
  { id: '103', user: 'Apex Solutions', action: lang === 'zh' ? '发布新职位' : 'Posted new job', target: 'Backend Engineer', timestamp: '1 hour ago', status: 'success' },
  { id: '104', user: 'System Alert', action: lang === 'zh' ? '验证失败' : 'Verification Failed', target: 'User ID #9921', timestamp: '2 hours ago', status: 'warning' },
  { id: '105', user: 'Emily Blunt', action: lang === 'zh' ? '接受Offer' : 'Accepted Offer', target: 'Design Studio', timestamp: '3 hours ago', status: 'success' },
];

// --- Mock System Users (Expanded) ---
export const MOCK_SYSTEM_USERS: SystemUser[] = [
  { id: 'u001', name: 'Admin User', email: 'admin@talentpulse.com', role: 'admin', status: 'Active', lastLogin: 'Just now', createdAt: '2023-01-01' },
  { id: 'u002', name: '李丽 (HRD)', email: 'lili@techstar.com', role: 'recruiter', status: 'Active', lastLogin: '2 hours ago', createdAt: '2023-02-15' },
  { id: 'u003', name: '王小明', email: 'xiaoming@example.com', role: 'candidate', status: 'Active', lastLogin: '10 mins ago', createdAt: '2023-03-10' },
  { id: 'u004', name: '张强', email: 'zhang@datamagic.com', role: 'recruiter', status: 'Active', lastLogin: '1 day ago', createdAt: '2023-04-20' },
  { id: 'u005', name: 'Inactive User', email: 'test@example.com', role: 'candidate', status: 'Inactive', lastLogin: '30 days ago', createdAt: '2023-05-01' },
  { id: 'u006', name: 'Banned Account', email: 'spam@bot.com', role: 'candidate', status: 'Suspended', lastLogin: '2 months ago', createdAt: '2023-06-12' },
  { id: 'u007', name: '王佳', email: 'wangjia@design.com', role: 'recruiter', status: 'Active', lastLogin: '5 hours ago', createdAt: '2023-07-18' },
  { id: 'u008', name: 'John Doe', email: 'john.d@gmail.com', role: 'candidate', status: 'Active', lastLogin: '3 days ago', createdAt: '2023-08-22' },
];

export const MOCK_CANDIDATES: Candidate[] = [
  { id: 'c1', name: '张伟 (Zhang Wei)', role: 'Frontend Developer', experience: '5 Years', status: 'Interviewing', location: 'Beijing', skills: ['React', 'TypeScript', 'Node.js'], avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix' },
  { id: 'c2', name: '李娜 (Li Na)', role: 'Product Designer', experience: '3 Years', status: 'Available', location: 'Shanghai', skills: ['Figma', 'UI/UX', 'Sketch'], avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka' },
  { id: 'c3', name: '王强 (Wang Qiang)', role: 'Backend Engineer', experience: '8 Years', status: 'Hired', location: 'Shenzhen', skills: ['Go', 'Docker', 'K8s'], avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob' },
  { id: 'c4', name: 'Lucy Liu', role: 'Marketing Manager', experience: '6 Years', status: 'Available', location: 'Chengdu', skills: ['SEO', 'Content', 'Analytics'], avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kitty' },
  { id: 'c5', name: '陈敏 (Chen Min)', role: 'Data Scientist', experience: '4 Years', status: 'Interviewing', location: 'Hangzhou', skills: ['Python', 'PyTorch', 'SQL'], avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Milo' },
];

export const MOCK_PIPELINE: PipelineCandidate[] = [
  { ...MOCK_CANDIDATES[0], appliedDate: '2023-10-24', appliedJobId: 101, matchScore: 92, stage: 'Interview', interviewDate: '2023-11-01', interviewTime: '14:00', interviewLocation: '深圳科技园A座' },
  { ...MOCK_CANDIDATES[1], appliedDate: '2023-10-25', appliedJobId: 103, matchScore: 78, stage: 'New' },
  { ...MOCK_CANDIDATES[4], appliedDate: '2023-10-26', appliedJobId: 102, matchScore: 85, stage: 'Screening' },
  { ...MOCK_CANDIDATES[2], appliedDate: '2023-10-20', appliedJobId: 105, matchScore: 95, stage: 'Hired', onboardingDate: '2023-11-15', onboardingStatus: 'Scheduled' },
  { ...MOCK_CANDIDATES[3], appliedDate: '2023-10-18', appliedJobId: 106, matchScore: 88, stage: 'Interview', interviewDate: '2023-11-02', interviewTime: '10:00', interviewLocation: '北京朝阳区' },
  { id: 'c6', name: '陈强', role: '后端工程师', experience: '6 Years', status: 'Hired', location: '上海', skills: ['Java', 'Spring', 'MySQL'], avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ChenQiang', appliedDate: '2023-10-15', appliedJobId: 104, matchScore: 90, stage: 'Hired', onboardingDate: '2023-11-10', onboardingStatus: 'Completed' },
];


// --- Shared / Candidate App Mocks ---

export const MOCK_RECRUITERS: Recruiter[] = [
  { id: 501, name: "李丽 (HRD)", company: "科技之星有限公司", role: "HR总监", avatar: "👩‍💼" },
  { id: 502, name: "张强 (部门经理)", company: "数据魔方公司", role: "数据部门经理", avatar: "👨‍💼" },
  { id: 503, name: "王佳 (产品总监)", company: "设计工坊", role: "产品总监", avatar: "👩‍🎨" },
  { id: 504, name: "赵敏 (运营)", company: "活力传播", role: "运营专员", avatar: "👩‍💻" },
];

export const MOCK_COMPANIES: Company[] = [
  { id: 201, name: "科技之星有限公司", industry: "互联网/软件", size: "1000-5000人", logo: "🌟", status: 'Verified', location: '深圳', hrCount: 12, jobCount: 25, createdAt: '2023-01-15' },
  { id: 202, name: "数据魔方公司", industry: "数据服务/咨询", size: "500-1000人", logo: "📊", status: 'Verified', location: '北京', hrCount: 8, jobCount: 10, createdAt: '2023-02-20' },
  { id: 203, name: "设计工坊", industry: "创意设计", size: "100-500人", logo: "🎨", status: 'Pending', location: '上海', hrCount: 3, jobCount: 5, createdAt: '2023-08-10' },
  { id: 204, name: "活力传播", industry: "媒体/公关", size: "50-100人", logo: "📢", status: 'Verified', location: '广州', hrCount: 2, jobCount: 3, createdAt: '2023-03-05' },
  { id: 205, name: "未来制造", industry: "智能硬件", size: "5000+人", logo: "🤖", status: 'Rejected', location: '杭州', hrCount: 0, jobCount: 0, createdAt: '2023-09-01' },
];

export const MOCK_JOBS: JobPosting[] = [
  { id: 101, title: "高级前端开发工程师", company: "科技之星有限公司", department: "研发部", location: "深圳", salary: "25K-40K", description: "1. 负责公司核心产品的Web前端架构设计与开发...\n(略)", type: "全职", experience: "5年以上", degree: "本科", posterId: 501, applicants: 45, status: 'Active', postedDate: '2023-10-24' },
  { id: 102, title: "数据分析师 (初级)", company: "数据魔方公司", department: "数据部", location: "北京", salary: "10K-15K", description: "1. 负责业务数据的日常监控和报表制作...\n(略)", type: "全职", experience: "1-3年", degree: "本科", posterId: 502, applicants: 28, status: 'Active', postedDate: '2023-10-22' },
  { id: 103, title: "用户体验设计师", company: "设计工坊", department: "设计部", location: "上海", salary: "18K-30K", description: "1. 负责产品的全链路设计工作...\n(略)", type: "全职", experience: "3-5年", degree: "本科", posterId: 503, applicants: 120, status: 'Closed', postedDate: '2023-09-15' },
  { id: 104, title: "市场运营实习生", company: "活力传播", department: "运营部", location: "广州", salary: "3K-5K", description: "1. 协助运营团队进行线上线下活动...\n(略)", type: "实习", experience: "不限", degree: "大专", posterId: 504, applicants: 12, status: 'Draft', postedDate: '-' },
  { id: 105, title: "Java后端工程师", company: "科技之星有限公司", department: "研发部", location: "深圳", salary: "20K-35K", description: "1. 负责后端服务接口的设计...\n(略)", type: "全职", experience: "3-5年", degree: "本科", posterId: 501, applicants: 8, status: 'Active', postedDate: '2023-10-25' },
  { id: 106, title: "高级产品经理", company: "数据魔方公司", department: "产品部", location: "北京", salary: "30K-50K", description: "1. 负责公司核心产品线的规划...\n(略)", type: "全职", experience: "5年以上", degree: "硕士", posterId: 502, applicants: 15, status: 'Active', postedDate: '2023-10-26' },
  { id: 107, title: "测试工程师", company: "设计工坊", department: "质量部", location: "成都", salary: "12K-20K", description: "1. 负责Web端和移动端产品...\n(略)", type: "全职", experience: "3-5年", degree: "本科", posterId: 503, applicants: 5, status: 'Active', postedDate: '2023-10-27' },
  // 添加兼职和实习职位
  { id: 108, title: "内容编辑兼职", company: "活力传播", department: "内容部", location: "远程", salary: "8K-12K/月", description: "1. 负责公众号内容的编辑和发布...\n(略)", type: "兼职", experience: "1年以上", degree: "大专", posterId: 504, applicants: 20, status: 'Active', postedDate: '2023-10-20' },
  { id: 109, title: "UI设计实习生", company: "设计工坊", department: "设计部", location: "上海", salary: "4K-6K", description: "1. 协助设计师完成UI设计工作...\n(略)", type: "实习", experience: "不限", degree: "大专", posterId: 503, applicants: 35, status: 'Active', postedDate: '2023-10-18' },
  { id: 110, title: "软件测试兼职", company: "科技之星有限公司", department: "质量部", location: "深圳", salary: "15K-20K/月", description: "1. 负责软件产品的测试工作...\n(略)", type: "兼职", experience: "3年以上", degree: "本科", posterId: 501, applicants: 12, status: 'Active', postedDate: '2023-10-15' },
  // 添加更多职位数据，使总数达到20条
  { id: 111, title: "iOS移动开发工程师", company: "科技之星有限公司", department: "研发部", location: "杭州", salary: "20K-35K", description: "1. 负责iOS应用的开发和维护...\n(略)", type: "全职", experience: "3-5年", degree: "本科", posterId: 501, applicants: 25, status: 'Active', postedDate: '2023-10-28' },
  { id: 112, title: "Android移动开发工程师", company: "数据魔方公司", department: "研发部", location: "武汉", salary: "18K-30K", description: "1. 负责Android应用的开发和维护...\n(略)", type: "全职", experience: "3-5年", degree: "本科", posterId: 502, applicants: 18, status: 'Active', postedDate: '2023-10-29' },
  { id: 113, title: "前端开发实习生", company: "设计工坊", department: "研发部", location: "广州", salary: "3K-5K", description: "1. 协助前端团队进行开发工作...\n(略)", type: "实习", experience: "不限", degree: "大专", posterId: 503, applicants: 45, status: 'Active', postedDate: '2023-10-30' },
  { id: 114, title: "后端开发实习生", company: "活力传播", department: "研发部", location: "西安", salary: "3K-5K", description: "1. 协助后端团队进行开发工作...\n(略)", type: "实习", experience: "不限", degree: "大专", posterId: 504, applicants: 32, status: 'Active', postedDate: '2023-10-31' },
  { id: 115, title: "产品运营专员", company: "科技之星有限公司", department: "运营部", location: "深圳", salary: "12K-20K", description: "1. 负责产品的运营和推广...\n(略)", type: "全职", experience: "1-3年", degree: "本科", posterId: 501, applicants: 28, status: 'Active', postedDate: '2023-11-01' },
  { id: 116, title: "销售经理", company: "数据魔方公司", department: "销售部", location: "北京", salary: "15K-30K", description: "1. 负责公司产品的销售和客户开发...\n(略)", type: "全职", experience: "3-5年", degree: "大专", posterId: 502, applicants: 15, status: 'Active', postedDate: '2023-11-02' },
  { id: 117, title: "人力资源专员", company: "设计工坊", department: "人事部", location: "上海", salary: "10K-18K", description: "1. 负责公司的人力资源管理工作...\n(略)", type: "全职", experience: "1-3年", degree: "本科", posterId: 503, applicants: 22, status: 'Active', postedDate: '2023-11-03' },
  { id: 118, title: "财务分析师", company: "活力传播", department: "财务部", location: "广州", salary: "12K-25K", description: "1. 负责公司的财务分析和报表制作...\n(略)", type: "全职", experience: "3-5年", degree: "本科", posterId: 504, applicants: 10, status: 'Active', postedDate: '2023-11-04' },
  { id: 119, title: "运维工程师", company: "科技之星有限公司", department: "运维部", location: "深圳", salary: "15K-28K", description: "1. 负责公司服务器的运维和管理...\n(略)", type: "全职", experience: "3-5年", degree: "本科", posterId: 501, applicants: 18, status: 'Active', postedDate: '2023-11-05' },
  { id: 120, title: "数据科学家", company: "数据魔方公司", department: "数据部", location: "北京", salary: "30K-50K", description: "1. 负责公司数据的分析和建模...\n(略)", type: "全职", experience: "5年以上", degree: "硕士", posterId: 502, applicants: 8, status: 'Active', postedDate: '2023-11-06' },
];

// --- NEW: Mock Applications for Admin View ---
export const MOCK_APPLICATIONS: Application[] = [
  { id: 'app001', candidateId: 'c1', jobId: 101, companyId: 201, stage: 'Interview', appliedDate: '2023-10-24', updatedDate: '2023-10-28' },
  { id: 'app002', candidateId: 'c2', jobId: 103, companyId: 203, stage: 'Applied', appliedDate: '2023-10-25', updatedDate: '2023-10-25' },
  { id: 'app003', candidateId: 'c5', jobId: 102, companyId: 202, stage: 'Screening', appliedDate: '2023-10-26', updatedDate: '2023-10-27' },
  { id: 'app004', candidateId: 'c4', jobId: 106, companyId: 202, stage: 'Offer', appliedDate: '2023-10-20', updatedDate: '2023-10-28' },
  { id: 'app005', candidateId: 'c3', jobId: 105, companyId: 201, stage: 'Hired', appliedDate: '2023-09-01', updatedDate: '2023-09-15' },
  { id: 'app006', candidateId: 'c1', jobId: 107, companyId: 203, stage: 'Rejected', appliedDate: '2023-10-15', updatedDate: '2023-10-18' },
];


export const DEFAULT_PROFILE: UserProfile = {
  id: "u003",
  name: "王小明",
  phone: "138****8888",
  email: "xiaoming@example.com",
  city: "深圳",
  expectedSalary: "20K-30K",
  jobStatus: "在职-考虑机会",
  bio: "专注于前端技术栈，追求用户体验极致。",
  experience: "5年"
};

export const DEFAULT_RESUME: Resume = {
  education: [{ school: "南方科技大学", major: "计算机科学", degree: "本科", years: "2016-2020" }],
  workExperience: [{ company: "创新科技公司", position: "前端工程师", years: "2020-至今", description: "负责公司核心产品的开发和维护。" }],
  skills: ["React", "Vue", "TypeScript", "Node.js", "Tailwind CSS"]
};

export const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv_1',
    jobId: 101,
    candidateId: 1,
    recruiterId: 501,
    lastMessage: "您好，我对这个高级前端的职位很感兴趣，请问还在招吗？",
    lastTime: "10:30",
    unreadCount: 0,
    isActive: true,
    totalMessages: 1,
    candidateUnread: 0,
    recruiterUnread: 0,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [
      { id: 1, role: 'user', type: 'text', text: "您好，我对这个高级前端的职位很感兴趣，请问还在招吗？", time: "10:30" }
    ],
    job_title: "高级前端工程师",
    company_name: "创新科技有限公司",
    candidate_name: "张三",
    candidate_avatar: "/avatars/zhangsan_zhangsan_1764566450159.jpg",
    recruiter_name: "李四",
    recruiter_avatar: "/avatars/yuji_yuji_1764584177288.jpg",
    recruiterUserId: 501 // Added mock recruiterUserId
  },
  {
    id: 'conv_2',
    jobId: 103,
    candidateId: 2,
    recruiterId: 503,
    lastMessage: "收到您的简历了，我们觉得您的作品集很棒！方便明天下午2点电话沟通吗？",
    lastTime: "昨天",
    unreadCount: 1, // 未读消息
    isActive: true,
    totalMessages: 3,
    candidateUnread: 1,
    recruiterUnread: 0,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [
      { id: 1, role: 'user', type: 'system', text: "已向对方发送了在线简历", time: "昨天 08:59" },
      { id: 2, role: 'user', type: 'text', text: "已投递简历，期待您的回复。", time: "昨天 09:00" },
      { id: 3, role: 'ai', type: 'text', text: "收到您的简历了，我们觉得您的作品集很棒！方便明天下午2点电话沟通吗？", time: "昨天 14:00" }
    ],
    job_title: "产品经理",
    company_name: "科技有限公司",
    candidate_name: "王五",
    candidate_avatar: "/avatars/qiuzhizhe1_candidate1_1764255327939.jpg",
    recruiter_name: "赵六",
    recruiter_avatar: "/avatars/aixi_aixi_1764568922299.jpg",
    recruiterUserId: 503 // Added mock recruiterUserId
  }
];

export const DEFAULT_RECRUITER_PROFILE = {
  name: "李丽",
  role: "HR 总监",
  email: "lili@techstar.com",
  phone: "13900139000",
  avatar: "李",
  company: {
    name: "科技之星有限公司",
    industry: "互联网 / 软件开发",
    size: "1000-5000人",
    address: "深圳市南山区科技园",
    logo: "🌟",
    description: "科技之星是一家专注于前沿科技研发的创新型企业，致力于为全球用户提供优质的互联网服务。"
  }
};

// --- Data for Analytics View ---
export const ANALYTICS_FUNNEL_DATA = [
  { name: '访问', value: 12000, fill: '#8884d8' },
  { name: '注册', value: 9800, fill: '#83a6ed' },
  { name: '申请', value: 5200, fill: '#8dd1e1' },
  { name: '面试', value: 1200, fill: '#82ca9d' },
  { name: '录用', value: 350, fill: '#a4de6c' },
];

export const ANALYTICS_TIME_TO_HIRE = [
  { name: '五月', days: 35 },
  { name: '六月', days: 32 },
  { name: '七月', days: 41 },
  { name: '八月', days: 38 },
  { name: '九月', days: 33 },
  { name: '十月', days: 28 },
];

export const ANALYTICS_SOURCE_QUALITY = [
  { name: '直接访问', hires: 40, quality: 85 },
  { name: '内推', hires: 80, quality: 95 },
  { name: 'LinkedIn', hires: 60, quality: 80 },
  { name: '招聘网站', hires: 55, quality: 75 },
];

// --- 筛选选项常量 ---
// 工作经验选项（按逻辑顺序排列）
export const EXPERIENCE_OPTIONS = [
  '全部',
  '不限',
  '应届生',
  '1年以下',
  '1-3年',
  '3-5年',
  '5-10年',
  '10年以上'
];

// 学历选项（按逻辑顺序排列）
export const DEGREE_OPTIONS = [
  '全部',
  '不限',
  '高中',
  '大专',
  '本科',
  '硕士',
  '博士'
];

// 职位类型选项（包括工作类型和工作模式）
export const JOB_TYPE_OPTIONS = [
  '全部',
  '全职',
  '兼职',
  '实习',
  '远程'
];
