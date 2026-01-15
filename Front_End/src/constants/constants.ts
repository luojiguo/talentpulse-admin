
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
      certifications: '企业认证审核',
      interviews: '面试管理',
      onboardings: '入职管理',
      logs: '系统日志',
      notifications: '系统通知',
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
      last_updated: '数据更新时间',
      loading: '正在加载仪表盘数据...',
      showing: '显示',
      to: '至',
      total: '共',
      records: '条动态',
      no_activity: '暂无最近动态',
      activity_desc: '系统活动将在此处显示',
      important: '重要'
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
      search: '按姓名或邮箱搜索...',
      export: '导出',
      columnSettings: '列设置',
      allRoles: '所有角色',
      verified: '已验证',
      unverified: '未验证',
      notSet: '未设置',
      loading: '加载中...',
      noUsers: '没有找到匹配的用户',
      userDetails: '用户详情',
      basicInfo: '基本信息',
      personalInfo: '个人信息',
      professionalInfo: '职业信息',
      contactInfo: '联系与社交信息',
      systemInfo: '系统信息',
      accountManage: '账号管理',
      resetPassword: '重置密码',
      resetConfirm: '确定要将该用户的密码重置为 123456 吗？',
      banUser: '封禁用户',
      banConfirm: '确定要封禁该用户吗？封禁后用户将无法登录。',
      unbanUser: '解封账号',
      save: '保存',
      cancel: '取消',
      copyName: '姓名已复制',
      copyEmail: '邮箱已复制',
      activeStatus: '正常',
      suspendedStatus: '已封禁',
      inactiveStatus: '未激活',
      email: '邮箱',
      phone: '手机号',
      gender: '性别',
      password: '密码',
      userType: '用户类型',
      education: '学历',
      workExperience: '工作经验',
      desiredPosition: '期望职位',
      emailVerified: '邮箱验证',
      phoneVerified: '手机验证'
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
      hrCount: 'HR人数',
      createdAt: '创建时间',
      social_credit_code: '统一社会信用代码',
      verified: '已验证',
      pending: '待审核',
      rejected: '已拒绝',
      audit: '企业审核',
      pass: '通过审核',
      reject: '拒绝申请',
      viewDetails: '查看详情',
      copySuccessName: '企业名称已复制',
      copySuccessLocation: '所在地已复制',
      copySuccessEmail: '邮箱已复制到剪贴板',
      noDetails: '未找到企业详情'
    },
    candidates: {
      title: '候选人库',
      name: '姓名',
      role: '期望职位',
      exp: '经验',
      status: '状态',
      skills: '技能标签',
      action: '操作',
      associated: '关联公司 / 职位',
      internship: '实习经历',
      education: '学历',
      city: '城市',
      expectedSalary: '期望薪资',
      jobType: '期望性质',
      workMode: '工作方式',
      industry: '期望行业',
      locationPref: '期望城市',
      bio: '个人简介',
      appCount: '投递数',
      resetFilters: '清除筛选',
      email: '邮箱',
      phone: '手机号',
      details: '详情',
      noMatch: '没有找到匹配的候选人',
      exp_years: '年经验',
      exp_and_projects: '工作与项目经历',
      no_bio: '暂无个人简介',
      contact_admin_only: '联系方式 (管理员可见)',
      workExperience: '工作经历',
      noWorkExperience: '暂无工作经历',
      projectExperience: '项目经历',
      noProjectExperience: '暂无项目经历',
      view_project_link: '查看项目链接',
      until_now: '至今',
      job_status: {
        active: '在职-考虑机会',
        inactive: '暂无求职意向',
        hired: '已入职'
      },
      availability: {
        available: '随时入职',
        unavailable: '暂不考虑',
        watching: '观望中',
        active: '活跃',
        inactive: '不活跃',
        open: '开放'
      }
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
      date: '发布日期',
      searchPlaceholder: '搜索职位标题、公司或地点...',
      noMatch: '没有找到匹配的职位',
      fetchFailed: '获取职位数据失败',
      activeStatus: '招聘中',
      closedStatus: '已关闭'
    },
    applications: {
      title: '全局申请流程监控',
      candidate: '候选人',
      job: '申请职位',
      company: '公司',
      stage: '当前阶段',
      date: '申请日期',
      updated: '最后更新',
      searchPlaceholder: '搜索候选人、职位、公司或阶段...',
      noMatch: '没有找到匹配的申请',
      columnSettings: '显示/隐藏列',
      score: '匹配度',
      interviewCount: '面试次数',
      email: '邮箱',
      phone: '电话',
      location: '地点',
      salary: '薪资',
      stages: {
        new: '新申请',
        pending: '待处理',
        applied: '已申请',
        screening: '筛选中',
        interview: '面试中',
        offer: '已发Offer',
        hired: '已录用',
        rejected: '已拒绝'
      }
    },
    analytics: {
      title: '数据分析大屏',
      funnel: '招聘漏斗转化率',
      timeToHire: '平均招聘周期 (天)',
      source: '候选人来源渠道质量',
      activeHeatmap: '活跃度热力图',
      jobCompetition: '职位竞争度分析',
      topHiring: 'Top招聘公司排行',
      userTrend: '用户增长趋势',
      jobCategory: '职位分布情况',
      aiInsight: 'AI 智能洞察',
      customLayout: '自定义布局',
      finishEdit: '结束编辑',
      selectingWidget: '选择需要显示在仪表盘上的数据模块。',
      loadingData: '正在加载分析数据...',
      totalUsers: '总用户数',
      activeJobs: '在招职位数',
      applications: '收到简历数',
      hires: '成功录用数',
      thinking: '分析中...',
      failed: '洞察生成失败',
      noMatch: '暂无匹配数据',
      avgApplicants: '平均申请人数',
      person: '人',
      hiresCount: '录用人数',
      weekDays: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
      hours: ['0时', '2时', '4时', '6时', '8时', '10时', '12时', '14时', '16时', '18时', '20时', '22时'],
      visitors: '访客数',
      registrants: '注册数'
    },
    settings: {
      title: '系统设置',
      language: '语言偏好',
      theme: '界面主题',
      notifications: '通知设置',
      save: '保存更改'
    },
    header: {
      notifications: '通知中心',
      you_have: '您有',
      messages: '条通知',
      no_notifications: '暂无通知',
      clear_all: '清空所有通知',
      profile: '个人中心'
    },
    common: {
      search: '搜索...',
      filter: '筛选',
      export: '导出',
      cancel: '取消',
      confirm: '确定',
      save: '保存',
      loading: '加载中...',
      no_data: '无数据',
      all: '全部',
      action: '操作',
      details: '详情',
      close: '关闭',
      retry: '重试',
      na: '暂无'
    },
    logs: {
      title: '系统日志',
      log_type: '日志类型',
      date_range: '时间范围',
      search_placeholder: '搜索操作、描述、用户...',
      time: '时间',
      type: '类型',
      description: '描述',
      user: '用户',
      ip: 'IP地址',
      status_code: '状态码',
      response_time: '响应时间',
      details_title: '日志详情',
      core_info: '核心信息',
      tech_meta: '技术元数据',
      browser: '浏览器',
      os: '操作系统',
      device: '设备单位',
      location: '地理位置',
      request: '请求',
      resource: '资源',
      login: '登录',
      logout: '登出',
      create: '创建',
      update: '更新',
      delete: '删除',
      error: '错误',
      warning: '警告',
      info: '信息',
      unknown: '未知',
      no_logs: '暂无系统日志',
      no_match: '没有找到匹配的日志',
      prev_day: '最近1天',
      prev_7: '最近7天',
      prev_30: '最近30天',
      prev_90: '最近90天'
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
      certifications: 'Certification Reviews',
      interviews: 'Interview Management',
      onboardings: 'Onboarding Management',
      logs: 'System Logs',
      notifications: 'System Notifications',
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
      application_vs_interview: 'Apps vs Interviews',
      growth_rate: 'Monthly Growth',
      last_updated: 'Last Updated',
      loading: 'Loading dashboard data...',
      showing: 'Showing',
      to: 'to',
      total: 'of',
      records: 'records',
      no_activity: 'No recent activity',
      activity_desc: 'System activity will appear here',
      important: 'Important'
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
      search: 'Search by name or email...',
      export: 'Export',
      columnSettings: 'Columns',
      allRoles: 'All Roles',
      verified: 'Verified',
      unverified: 'Unverified',
      notSet: 'Not Set',
      loading: 'Loading...',
      noUsers: 'No users found',
      userDetails: 'User Details',
      basicInfo: 'Basic Information',
      personalInfo: 'Personal Information',
      professionalInfo: 'Professional Information',
      contactInfo: 'Contact & Social',
      systemInfo: 'System Information',
      accountManage: 'Account Management',
      resetPassword: 'Reset Password',
      resetConfirm: 'Are you sure you want to reset the password to 123456?',
      banUser: 'Ban User',
      banConfirm: 'Are you sure you want to ban this user? They will not be able to log in.',
      unbanUser: 'Unban User',
      save: 'Save',
      cancel: 'Cancel',
      copyName: 'Name copied',
      copyEmail: 'Email copied',
      activeStatus: 'Active',
      suspendedStatus: 'Suspended',
      inactiveStatus: 'Inactive',
      email: 'Email',
      phone: 'Phone',
      gender: 'Gender',
      password: 'Password',
      userType: 'User Type',
      education: 'Education',
      workExperience: 'Work Experience',
      desiredPosition: 'Desired Position',
      emailVerified: 'Email Verified',
      phoneVerified: 'Phone Verified'
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
      hrCount: 'HR Count',
      createdAt: 'Created At',
      social_credit_code: 'Social Credit Code',
      verified: 'Verified',
      pending: 'Pending',
      rejected: 'Rejected',
      audit: 'Company Audit',
      pass: 'Approve',
      reject: 'Reject',
      viewDetails: 'View Details',
      copySuccessName: 'Company name copied',
      copySuccessLocation: 'Location copied',
      copySuccessEmail: 'Email copied to clipboard',
      noDetails: 'Company details not found'
    },
    candidates: {
      title: 'Candidate Database',
      name: 'Name',
      role: 'Target Role',
      exp: 'Experience',
      status: 'Status',
      skills: 'Skills',
      action: 'Action',
      associated: 'Associated Co./Role',
      internship: 'Internship',
      education: 'Education',
      city: 'City',
      expectedSalary: 'Expected Salary',
      jobType: 'Job Type',
      workMode: 'Work Mode',
      industry: 'Industry',
      locationPref: 'Location Pref.',
      bio: 'Bio',
      appCount: 'Apps',
      resetFilters: 'Reset Filters',
      email: 'Email',
      phone: 'Phone',
      details: 'Details',
      noMatch: 'No candidates found',
      exp_years: ' yrs exp',
      exp_and_projects: 'Experience & Projects',
      no_bio: 'No bio available',
      contact_admin_only: 'Contact (Admin Only)',
      workExperience: 'Work Experience',
      noWorkExperience: 'No work experience found',
      projectExperience: 'Project Experience',
      noProjectExperience: 'No project experience found',
      view_project_link: 'View Project Link',
      until_now: 'Present',
      job_status: {
        active: 'Employed - Considering',
        inactive: 'No Immediate Interest',
        hired: 'Hired'
      },
      availability: {
        available: 'Available Now',
        unavailable: 'Unavailable',
        watching: 'Watching',
        active: 'Active',
        inactive: 'Inactive',
        open: 'Open'
      }
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
      date: 'Posted Date',
      searchPlaceholder: 'Search job title, company or location...',
      noMatch: 'No matching jobs found',
      fetchFailed: 'Failed to fetch job data',
      activeStatus: 'Active',
      closedStatus: 'Closed'
    },
    applications: {
      title: 'Global Application Flow Monitoring',
      candidate: 'Candidate',
      job: 'Applied Job',
      company: 'Company',
      stage: 'Current Stage',
      date: 'Applied Date',
      updated: 'Last Updated',
      searchPlaceholder: 'Search candidate, job, company or stage...',
      noMatch: 'No matching applications found',
      columnSettings: 'Show/Hide Columns',
      score: 'Match Score',
      interviewCount: 'Interviews',
      email: 'Email',
      phone: 'Phone',
      location: 'Location',
      salary: 'Salary',
      stages: {
        new: 'New',
        pending: 'Pending',
        applied: 'Applied',
        screening: 'Screening',
        interview: 'Interviewing',
        offer: 'Offer Sent',
        hired: 'Hired',
        rejected: 'Rejected'
      }
    },
    analytics: {
      title: 'Analytics Dashboard',
      funnel: 'Recruitment Funnel',
      timeToHire: 'Avg. Time to Hire (Days)',
      source: 'Source Quality Analysis',
      activeHeatmap: 'Activity Heatmap',
      jobCompetition: 'Job Competition Analysis',
      topHiring: 'Top Hiring Companies',
      userTrend: 'User Growth Trend',
      jobCategory: 'Jobs by Category',
      aiInsight: 'AI Insight',
      customLayout: 'Custom Layout',
      finishEdit: 'Finish Editing',
      selectingWidget: 'Select the widgets you want to display on the dashboard.',
      loadingData: 'Loading analytics...',
      totalUsers: 'Total Users',
      activeJobs: 'Active Jobs',
      applications: 'Applications',
      hires: 'Successful Hires',
      thinking: 'Thinking...',
      failed: 'Analysis failed.',
      noMatch: 'No matching data',
      avgApplicants: 'Avg. Applicants',
      person: 'PPL',
      hiresCount: 'Hires',
      weekDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      hours: ['0h', '2h', '4h', '6h', '8h', '10h', '12h', '14h', '16h', '18h', '20h', '22h'],
      visitors: 'Visitors',
      registrants: 'Registrants'
    },
    settings: {
      title: 'Settings',
      language: 'Language',
      theme: 'Theme',
      notifications: 'Notifications',
      save: 'Save Changes'
    },
    header: {
      notifications: 'Notifications',
      you_have: 'You have',
      messages: 'notifications',
      no_notifications: 'No notifications',
      clear_all: 'Clear All',
      profile: 'Profile'
    },
    common: {
      search: 'Search...',
      filter: 'Filter',
      export: 'Export',
      cancel: 'Cancel',
      confirm: 'Confirm',
      save: 'Save',
      loading: 'Loading...',
      no_data: 'No Data',
      all: 'All',
      action: 'Action',
      details: 'Details',
      close: 'Close',
      retry: 'Retry',
      na: 'N/A'
    },
    logs: {
      title: 'System Logs',
      log_type: 'Log Type',
      date_range: 'Date Range',
      search_placeholder: 'Search actions, descriptions, users...',
      time: 'Time',
      type: 'Type',
      description: 'Description',
      user: 'User',
      ip: 'IP Address',
      status_code: 'Status Code',
      response_time: 'Response Time',
      details_title: 'Log Details',
      core_info: 'Core Information',
      tech_meta: 'Technical Metadata',
      browser: 'Browser',
      os: 'Operating System',
      device: 'Device',
      location: 'Location',
      request: 'Request',
      resource: 'Resource',
      login: 'Login',
      logout: 'Logout',
      create: 'Create',
      update: 'Update',
      delete: 'Delete',
      error: 'Error',
      warning: 'Warning',
      info: 'Info',
      unknown: 'Unknown',
      no_logs: 'No system logs',
      no_match: 'No matching logs found',
      prev_day: 'Last 24 Hours',
      prev_7: 'Last 7 Days',
      prev_30: 'Last 30 Days',
      prev_90: 'Last 90 Days'
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
  { id: 107, title: "测试工程师", company: "设计工坊", department: "质量部", location: "成都", salary: "12K-20K", description: "1. 负责Web端 and 移动端产品...\n(略)", type: "全职", experience: "3-5年", degree: "本科", posterId: 503, applicants: 5, status: 'Active', postedDate: '2023-10-27' },
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
    recruiterUserId: 501
  },
  {
    id: 'conv_2',
    jobId: 103,
    candidateId: 2,
    recruiterId: 503,
    lastMessage: "收到您的简历了，我们觉得您的作品集很棒！方便明天下午2点电话沟通吗？",
    lastTime: "昨天",
    unreadCount: 1,
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
    recruiterUserId: 503
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

// --- 行业与公司规模选项 ---
export const INDUSTRY_OPTIONS = [
  { value: '互联网/IT/电子/通信', label: '互联网/IT/电子/通信' },
  { value: '金融/银行/保险', label: '金融/银行/保险' },
  { value: '房地产/建筑', label: '房地产/建筑' },
  { value: '教育/培训/院校', label: '教育/培训/院校' },
  { value: '消费品/零售/批发', label: '消费品/零售/批发' },
  { value: '广告/传媒/文化', label: '广告/传媒/文化' },
  { value: '制药/医疗/生物', label: '制药/医疗/生物' },
  { value: '能源/矿产/环保', label: '能源/矿产/环保' },
  { value: '制造/加工/自动化', label: '制造/加工/自动化' },
  { value: '交通/物流/贸易', label: '交通/物流/贸易' },
  { value: '政府/非盈利机构', label: '政府/非盈利机构' },
  { value: '服务业', label: '服务业' },
  { value: '其他', label: '其他' }
];

export const COMPANY_SIZE_OPTIONS = [
  { value: '0-20', label: '0-20人' },
  { value: '20-99', label: '20-99人' },
  { value: '100-499', label: '100-499人' },
  { value: '500-999', label: '500-999人' },
  { value: '1000-9999', label: '1000-9999人' },
  { value: '10000+', label: '10000人以上' }
];
