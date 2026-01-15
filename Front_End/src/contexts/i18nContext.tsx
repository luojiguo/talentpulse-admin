import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// 语言类型
export type Language = 'zh' | 'en';

// 翻译资源类型
export interface Translations {
    // 通用
    common: {
        save: string;
        cancel: string;
        confirm: string;
        delete: string;
        edit: string;
        add: string;
        search: string;
        filter: string;
        refresh: string;
        loading: string;
        noData: string;
        success: string;
        error: string;
        warning: string;
        managementCenter: string;
    };

    // 导航
    nav: {
        dashboard: string;
        jobs: string;
        candidates: string;
        interviews: string;
        onboardings: string;
        messages: string;
        profile: string;
        settings: string;
        logout: string;
        switchToCandidate: string;
    };

    // 设置
    settings: {
        title: string;
        theme: string;
        themeLight: string;
        themeDark: string;
        language: string;
        languageChinese: string;
        languageEnglish: string;
    };

    // 用户信息
    user: {
        role: string;
        recruiter: string;
        candidate: string;
    };

    // 招聘者专用术语
    recruiter: {
        dashboard: string;
        totalCandidates: string;
        activeJobs: string;
        pendingInterviews: string;
        pendingMessages: string;
        recentActivities: string;
        viewAll: string;
        createJob: string;
        viewDetails: string;
        editJob: string;
        deleteJob: string;
        sendMessage: string;
        scheduleInterview: string;
        viewResume: string;
        downloadResume: string;
        jobTitle: string;
        jobDescription: string;
        requirements: string;
        benefits: string;
        salary: string;
        location: string;
        jobType: string;
        experience: string;
        education: string;
        skills: string;
        applicationDeadline: string;
        publishedDate: string;
        status: string;
        applicants: string;
        interviewDate: string;
        interviewTime: string;
        interviewLocation: string;
        interviewer: string;
        interviewResult: string;
        feedback: string;
        notes: string;
        companyInfo: string;
        companyName: string;
        companyDescription: string;
        companyWebsite: string;
        companySize: string;
        industry: string;
        currentDate: string;
        aiCopilot: string;
        smartAnalysis: string;
        generating: string;
        unreadMessages: string;
        certificationTitle: string;
        certificationDesc: string;
        verifyNow: string;
        collapseAnalysis: string;
        expandAnalysis: string;
        analysisPoint: string;
        searchPlaceholder: string;
        interviewTitle: string;
        interviewSubtitle: string;
        onboardTitle: string;
        onboardSubtitle: string;
        scheduleOnboarding: string;
        jobsTitle: string;
        myJobs: string;
        allJobs: string;
        colleagueJobs: string;
        searchJobsPlaceholder: string;
        anyStatus: string;
        activeStatus: string;
        closedStatus: string;
        filterConditions: string;
        certHeader: string;
        certPassed: string;
        certReviewing: string;
        certReverify: string;
        companyFullName: string;
        industryField: string;
        companySizeField: string;
        companyWebsiteField: string;
        officeAddress: string;
        companyIntro: string;
        uploadLicense: string;
        submitAudit: string;
        interviewDetailTitle: string;
        closeWindow: string;
        basicInfo: string;
        interviewerDetail: string;
        timeline: string;
        invitationSentAt: string;
        candidateResponseAt: string;
        interviewerNotes: string;
        interviewResultSet: string;
        internalFeedback: string;
        finalResult: string;
        passed: string;
        rejected: string;
        pending: string;
        statusScheduled: string;
        statusCompleted: string;
        statusCancelled: string;
        statusAccepted: string;
        statusRejected: string;
        recruiting: string;
        closed: string;
        applicantsUnit: string;
        interviewRoundPrefix: string;
        interviewRoundSuffix: string;
        notEvaluated: string;
        allStatus: string;
        talentPool: string;
        talentPoolTotal: string;
        talentPoolUnit: string;
        statusNew: string;
        statusInterview: string;
        statusOffer: string;
        statusOnboarding: string;
        appliedAt: string;
        actions: string;
        interview: string;
        searchCandidatesPlaceholder: string;
        multiFilters: string;
        clear: string;
        resumeInfo: string;
        matching: string;
        lookingForOpportunity: string;
        fresher: string;
        tbd: string;
        onboard: string;
        messageCandidate: string;
        noCandidatesData: string;
        candidatesDataHint: string;
        onboardingCheckinTime: string;
        officialSalaryPrefix: string;
        noContact: string;
        editDetails: string;
        allPhases: string;
        noOnboardingRecords: string;
        sent: string;
        evaluate: string;
        showDetails: string;
        interviewResultSetSuccess: string;
        feedbackTemplatePassed: string;
        feedbackTemplateRejected: string;
        feedbackTemplatePending: string;
    };

    // 求职者专属术语
    candidate: {
        nav: {
            home: string;
            jobs: string;
            saved: string;
            interviews: string;
            messages: string;
            mockInterview: string;
            aiAssistant: string;
        };
        dropdown: {
            profile: string;
            applications: string;
            verification: string;
            switchToRecruiter: string;
            logout: string;
        };
        footer: {
            copyright: string;
        };
    };
}

// 中文翻译
const zhTranslations: Translations = {
    common: {
        save: '保存',
        cancel: '取消',
        confirm: '确认',
        delete: '删除',
        edit: '编辑',
        add: '添加',
        search: '搜索',
        filter: '筛选',
        refresh: '刷新',
        loading: '加载中...',
        noData: '暂无数据',
        success: '成功',
        error: '错误',
        warning: '警告',
        managementCenter: '管理中心',
    },
    nav: {
        dashboard: '仪表盘',
        jobs: '职位管理',
        candidates: '候选人',
        interviews: '面试管理',
        onboardings: '入职管理',
        messages: '消息',
        profile: '个人中心',
        settings: '设置',
        logout: '退出登录',
        switchToCandidate: '切换为求职者',
    },
    settings: {
        title: '设置',
        theme: '主题',
        themeLight: '浅色',
        themeDark: '深色',
        language: '语言',
        languageChinese: '简体中文',
        languageEnglish: 'English',
    },
    user: {
        role: '角色',
        recruiter: '招聘者',
        candidate: '求职者',
    },
    recruiter: {
        dashboard: '仪表盘',
        totalCandidates: '总候选人',
        activeJobs: '活跃职位',
        pendingInterviews: '待处理面试',
        pendingMessages: '待处理消息',
        recentActivities: '最近活动',
        viewAll: '查看全部',
        createJob: '创建职位',
        viewDetails: '查看详情',
        editJob: '编辑职位',
        deleteJob: '删除职位',
        sendMessage: '发送消息',
        scheduleInterview: '安排面试',
        viewResume: '查看简历',
        downloadResume: '下载简历',
        jobTitle: '职位名称',
        jobDescription: '职位描述',
        requirements: '任职要求',
        benefits: '福利待遇',
        salary: '薪资范围',
        location: '工作地点',
        jobType: '职位类型',
        experience: '工作经验',
        education: '学历要求',
        skills: '技能要求',
        applicationDeadline: '申请截止日期',
        publishedDate: '发布日期',
        status: '状态',
        applicants: '申请人数',
        interviewDate: '面试日期',
        interviewTime: '面试时间',
        interviewLocation: '面试地点',
        interviewer: '面试官',
        interviewResult: '面试结果',
        feedback: '反馈',
        notes: '备注',
        companyInfo: '公司信息',
        companyName: '公司名称',
        companyDescription: '公司简介',
        companyWebsite: '公司网站',
        companySize: '公司规模',
        industry: '所属行业',
        currentDate: '当前日期',
        aiCopilot: 'AI 智能领航',
        smartAnalysis: '生成智能分析',
        generating: '分析中...',
        unreadMessages: '未读消息',
        certificationTitle: '您的企业尚未认证',
        certificationDesc: '完成企业认证后，您将获得发布职位权限、查看候选人完整信息以及 AI 智能招聘建议。',
        verifyNow: '立即认证',
        searchPlaceholder: '搜索...',
        interviewTitle: '日程与面试',
        interviewSubtitle: '掌控每一个面试细节，打造极致候选人体验',
        onboardTitle: '入职中心',
        onboardSubtitle: '贴心关怀每一位新伙伴，开启非凡职业旅程',
        scheduleOnboarding: '安排新员工入职',
        jobsTitle: '职位管理',
        myJobs: '我发布的',
        allJobs: '公司全部',
        colleagueJobs: '同事发布的',
        searchJobsPlaceholder: '搜索职位、大类或工作地点...',
        anyStatus: '任意发布状态',
        activeStatus: '正在热推中',
        closedStatus: '已停止招聘',
        filterConditions: '条件筛选',
        certHeader: '企业实名认证',
        certPassed: '企业身份认证已通过',
        certReviewing: '认证资料审核中',
        certReverify: '认证其他企业身份',
        companyFullName: '企业全称',
        industryField: '行业领域',
        companySizeField: '人员规模',
        companyWebsiteField: '官方网站',
        officeAddress: '办公地址',
        companyIntro: '企业简介',
        uploadLicense: '营业执照扫描件',
        submitAudit: '提交官方审核',
        interviewDetailTitle: '面试详情记录',
        closeWindow: '关闭窗口',
        basicInfo: '基本信息',
        interviewerDetail: '面试官详情',
        timeline: '时间线',
        invitationSentAt: '邀请发送时间',
        candidateResponseAt: '候选人反馈时间',
        interviewerNotes: '面试备注',
        interviewResultSet: '判定面试结果',
        internalFeedback: '内部反馈',
        finalResult: '最终结果',
        passed: '通过',
        rejected: '未通过',
        pending: '待定',
        statusScheduled: '已安排',
        statusCompleted: '已完成',
        statusCancelled: '已取消',
        statusAccepted: '已接受',
        statusRejected: '已拒绝',
        recruiting: '招募中',
        closed: '已关闭',
        applicantsUnit: '人申请',
        interviewRoundPrefix: '第 ',
        interviewRoundSuffix: ' 轮',
        notEvaluated: '尚未评估',
        allStatus: '全部状态',
        talentPool: '人才库',
        talentPoolTotal: '人才库共 ',
        talentPoolUnit: ' 位',
        statusNew: '新申请',
        statusInterview: '面试中',
        statusOffer: '已录用',
        statusOnboarding: '入职中',
        appliedAt: '投递时间',
        actions: '管理操作',
        interview: '面试',
        searchCandidatesPlaceholder: '搜索姓名、申请职位、关键字...',
        multiFilters: '多维筛选',
        clear: '清空',
        resumeInfo: '履历摘要',
        matching: '系统匹配度',
        lookingForOpportunity: '正在寻找机会',
        fresher: '应届生',
        tbd: '待定',
        onboard: '入职',
        messageCandidate: '私信',
        noCandidatesData: '暂无候选人数据',
        candidatesDataHint: '当候选人申请您的职位时，这里将显示相关信息',
        onboardingCheckinTime: '签到时间',
        officialSalaryPrefix: '正式薪资: ',
        noContact: '暂无联系人',
        editDetails: '详情 / 编辑',
        allPhases: '全部阶段',
        noOnboardingRecords: '暂无入职安排记录',
        sent: '已发',
        evaluate: '评估',
        showDetails: '详情',
        interviewResultSetSuccess: '面试结果设置成功',
        feedbackTemplatePassed: '面试表现优秀，符合岗位要求，建议录用。',
        feedbackTemplateRejected: '技能与岗位要求暂不匹配，建议纳入人才库。',
        feedbackTemplatePending: '部分能力需进一步评估，建议进行下一轮面试或对比其他候选人。',
        collapseAnalysis: '点击收起 AI 分析详情',
        expandAnalysis: '展开查看 AI 智能洞察',
        analysisPoint: '分析要点',
    },
    candidate: {
        nav: {
            home: '首页',
            jobs: '岗位列表',
            saved: '我的收藏',
            interviews: '我的面试',
            messages: '消息',
            mockInterview: '模拟面试',
            aiAssistant: 'AI助手',
        },
        dropdown: {
            profile: '个人中心',
            applications: '我的申请',
            verification: '企业认证',
            switchToRecruiter: '切换为招聘者',
            logout: '退出登录',
        },
        footer: {
            copyright: '© 2024 TalentPulse 智能招聘平台. 保留所有权利。',
        },
    },
};

// 英文翻译
const enTranslations: Translations = {
    common: {
        save: 'Save',
        cancel: 'Cancel',
        confirm: 'Confirm',
        delete: 'Delete',
        edit: 'Edit',
        add: 'Add',
        search: 'Search',
        filter: 'Filter',
        refresh: 'Refresh',
        loading: 'Loading...',
        noData: 'No Data',
        success: 'Success',
        error: 'Error',
        warning: 'Warning',
        managementCenter: 'Management',
    },
    nav: {
        dashboard: 'Dashboard',
        jobs: 'Jobs',
        candidates: 'Candidates',
        interviews: 'Interviews',
        onboardings: 'Onboardings',
        messages: 'Messages',
        profile: 'Profile',
        settings: 'Settings',
        logout: 'Logout',
        switchToCandidate: 'Switch to Candidate',
    },
    settings: {
        title: 'Settings',
        theme: 'Theme',
        themeLight: 'Light',
        themeDark: 'Dark',
        language: 'Language',
        languageChinese: '简体中文',
        languageEnglish: 'English',
    },
    user: {
        role: 'Role',
        recruiter: 'Recruiter',
        candidate: 'Candidate',
    },
    recruiter: {
        dashboard: 'Dashboard',
        totalCandidates: 'Total Candidates',
        activeJobs: 'Active Jobs',
        pendingInterviews: 'Pending Interviews',
        pendingMessages: 'Pending Messages',
        recentActivities: 'Recent Activities',
        viewAll: 'View All',
        createJob: 'Create Job',
        viewDetails: 'View Details',
        editJob: 'Edit Job',
        deleteJob: 'Delete Job',
        sendMessage: 'Send Message',
        scheduleInterview: 'Schedule Interview',
        viewResume: 'View Resume',
        downloadResume: 'Download Resume',
        jobTitle: 'Job Title',
        jobDescription: 'Job Description',
        requirements: 'Requirements',
        benefits: 'Benefits',
        salary: 'Salary Range',
        location: 'Location',
        jobType: 'Job Type',
        experience: 'Experience',
        education: 'Education',
        skills: 'Skills',
        applicationDeadline: 'Application Deadline',
        publishedDate: 'Published Date',
        status: 'Status',
        applicants: 'Applicants',
        interviewDate: 'Interview Date',
        interviewTime: 'Interview Time',
        interviewLocation: 'Interview Location',
        interviewer: 'Interviewer',
        interviewResult: 'Interview Result',
        feedback: 'Feedback',
        notes: 'Notes',
        companyInfo: 'Company Info',
        companyName: 'Company Name',
        companyDescription: 'Company Description',
        companyWebsite: 'Company Website',
        companySize: 'Company Size',
        industry: 'Industry',
        currentDate: 'Date',
        aiCopilot: 'AI Copilot',
        smartAnalysis: 'Generate Report',
        generating: 'Analyzing...',
        unreadMessages: 'Unread',
        certificationTitle: 'Company Not Verified',
        certificationDesc: 'Verify your company to post jobs, view full candidate profiles, and get AI insights.',
        verifyNow: 'Verify Now',
        collapseAnalysis: 'Collapse Analysis',
        expandAnalysis: 'Expand Insights',
        analysisPoint: 'KEY POINT',
        searchPlaceholder: 'Search...',
        interviewTitle: 'Interviews & Schedule',
        interviewSubtitle: 'Master every detail to create a premium candidate experience',
        onboardTitle: 'Onboarding Center',
        onboardSubtitle: 'Welcoming new partners with care to start an amazing journey',
        scheduleOnboarding: 'Schedule Onboarding',
        jobsTitle: 'Jobs Management',
        myJobs: 'Posted by Me',
        allJobs: 'All Company',
        colleagueJobs: 'By Colleagues',
        searchJobsPlaceholder: 'Search positions, categories...',
        anyStatus: 'Any Status',
        activeStatus: 'Recruiting',
        closedStatus: 'Closed',
        filterConditions: 'Filters',
        certHeader: 'Enterprise Identity Verification',
        certPassed: 'Verification Passed',
        certReviewing: 'Under Review',
        certReverify: 'Verify Other Identity',
        companyFullName: 'Company Name',
        industryField: 'Industry',
        companySizeField: 'Company Size',
        companyWebsiteField: 'Official Website',
        officeAddress: 'Office Address',
        companyIntro: 'Company Introduction',
        uploadLicense: 'Business License',
        submitAudit: 'Submit to Official Audit',
        interviewDetailTitle: 'Interview Record',
        closeWindow: 'Close',
        basicInfo: 'Basic Information',
        interviewerDetail: 'Interviewer Detail',
        timeline: 'Timeline',
        invitationSentAt: 'Invite Sent At',
        candidateResponseAt: 'Response At',
        interviewerNotes: 'Interviewer Notes',
        interviewResultSet: 'Set Interview Result',
        internalFeedback: 'Internal Feedback',
        finalResult: 'Final Result',
        passed: 'Passed',
        rejected: 'Rejected',
        pending: 'Pending',
        statusScheduled: 'Scheduled',
        statusCompleted: 'Completed',
        statusCancelled: 'Cancelled',
        statusAccepted: 'Accepted',
        statusRejected: 'Rejected',
        recruiting: 'Recruiting',
        closed: 'Closed',
        applicantsUnit: 'Applicants',
        interviewRoundPrefix: 'Round ',
        interviewRoundSuffix: '',
        notEvaluated: 'Pending Eval',
        allStatus: 'All Status',
        talentPool: 'Talent Pool',
        talentPoolTotal: 'Total ',
        talentPoolUnit: ' Candidates',
        statusNew: 'New',
        statusInterview: 'Interviewing',
        statusOffer: 'Offer',
        statusOnboarding: 'Onboarding',
        appliedAt: 'Applied At',
        actions: 'Actions',
        interview: 'Interview',
        searchCandidatesPlaceholder: 'Search name, job, keywords...',
        multiFilters: 'Filters',
        clear: 'Clear',
        resumeInfo: 'Resume Info',
        matching: 'Match',
        lookingForOpportunity: 'Open to work',
        fresher: 'Gradiuate',
        tbd: 'TBD',
        onboard: 'Onboard',
        messageCandidate: 'Message',
        noCandidatesData: 'No Candidates',
        candidatesDataHint: 'Candidate info will appear here once they apply.',
        onboardingCheckinTime: 'Check-in',
        officialSalaryPrefix: 'Salary: ',
        noContact: 'No Contact',
        editDetails: 'Details / Edit',
        allPhases: 'All Phases',
        noOnboardingRecords: 'No records found',
        sent: 'Sent',
        evaluate: 'Evaluate',
        showDetails: 'Details',
        interviewResultSetSuccess: 'Interview result set successfully',
        feedbackTemplatePassed: 'Excellent performance, fits job requirements, suggest hiring.',
        feedbackTemplateRejected: 'Skills don\'t match job requirements, suggest adding to talent pool.',
        feedbackTemplatePending: 'Some abilities need further evaluation, suggest next round or comparison.',
    },
    candidate: {
        nav: {
            home: 'Home',
            jobs: 'Jobs',
            saved: 'Saved Items',
            interviews: 'Interviews',
            messages: 'Messages',
            mockInterview: 'Mock Interview',
            aiAssistant: 'AI Assistant',
        },
        dropdown: {
            profile: 'Profile',
            applications: 'Applications',
            verification: 'Verification',
            switchToRecruiter: 'Switch to Recruiter',
            logout: 'Logout',
        },
        footer: {
            copyright: '© 2024 TalentPulse Intelligent Recruitment Platform. All rights reserved.',
        },
    },
};

// 国际化上下文接口
interface I18nContextType {
    language: Language;
    t: Translations;
    setLanguage: (lang: Language) => void;
    toggleLanguage: () => void;
}

// 创建上下文
const I18nContext = createContext<I18nContextType | undefined>(undefined);

// Provider组件
interface I18nProviderProps {
    children: ReactNode;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
    // 从localStorage读取保存的语言,默认为中文
    const [language, setLanguageState] = useState<Language>(() => {
        // 尝试获取新键名，如果不存在则尝试旧键名（平滑迁移）
        const savedLang = localStorage.getItem('talentpulse-language') || localStorage.getItem('recruiter-language');
        return (savedLang as Language) || 'zh';
    });

    // 根据语言选择翻译
    const t = language === 'zh' ? zhTranslations : enTranslations;

    // 设置语言
    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
    };

    // 切换语言
    const toggleLanguage = () => {
        setLanguageState(prev => prev === 'zh' ? 'en' : 'zh');
    };

    // 持久化语言到localStorage
    useEffect(() => {
        localStorage.setItem('talentpulse-language', language);

        // 更新document的lang属性
        document.documentElement.setAttribute('lang', language === 'zh' ? 'zh-CN' : 'en');
    }, [language]);

    const value: I18nContextType = {
        language,
        t,
        setLanguage,
        toggleLanguage,
    };

    return (
        <I18nContext.Provider value={value}>
            {children}
        </I18nContext.Provider>
    );
};

// 自定义Hook
export const useI18n = (): I18nContextType => {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useI18n必须在I18nProvider内部使用');
    }
    return context;
};
