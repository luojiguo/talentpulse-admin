import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { TRANSLATIONS } from '@/constants/constants';
import { generateDashboardInsight } from '@/services/aiService';
import { userAPI, jobAPI, companyAPI, analyticsAPI, applicationAPI, activityAPI } from '@/services/apiService';
import { InsightStatus, StatMetric, Language, UserRole, ApplicationTrendData } from '@/types/types';
import { useApi } from '@/hooks/useApi';

// Components
import Header from './components/Header';
import InsightPanel from './components/InsightPanel';

// Views
import DashboardHome from './views/DashboardHome';
import SystemUsersView from './views/SystemUsersView';
import CompaniesView from './views/CompaniesView';
import CandidatesView from './views/CandidatesView';
import JobsView from './views/JobsView';
import ApplicationsView from './views/ApplicationsView';
import ApplicationDetailView from './views/ApplicationDetailView';
import InterviewsView from './views/InterviewsView';
import OnboardingsView from './views/OnboardingsView';
import SystemLogsView from './views/SystemLogsView';
import AnalyticsView from './views/AnalyticsView';
import SettingsView from './views/SettingsView';
import CertificationReviewScreen from './views/CertificationReviewScreen';

interface AdminAppProps {
  currentUser: any;
  onLogout: () => void;
}

export const AdminApp: React.FC<AdminAppProps> = ({ currentUser, onLogout }) => {
  const userRole = currentUser.role;
  const location = useLocation();
  const [lang, setLang] = useState<Language>('zh');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const t = TRANSLATIONS[lang];

  // AI Insight State
  const [insightStatus, setInsightStatus] = useState<InsightStatus>(InsightStatus.IDLE);
  const [insightText, setInsightText] = useState<string | null>(null);

  // Real data state
  const [stats, setStats] = useState<StatMetric[]>([]);
  const [trends, setTrends] = useState<ApplicationTrendData[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Get current view from URL
  const getCurrentView = () => {
    const path = location.pathname;
    // 精确匹配或作为前缀匹配（处理子路径，如 /admin/jobs/:id）
    if (path === '/admin/dashboard' || path === '/admin/' || path === '/admin' || path.startsWith('/admin/dashboard/')) return 'dashboard';
    if (path === '/admin/users' || path.startsWith('/admin/users/')) return 'users';
    if (path === '/admin/companies' || path.startsWith('/admin/companies/')) return 'companies';
    if (path === '/admin/candidates' || path.startsWith('/admin/candidates/')) return 'candidates';
    if (path === '/admin/jobs' || path.startsWith('/admin/jobs/')) return 'jobs';
    if (path === '/admin/applications' || path.startsWith('/admin/applications/')) return 'applications';
    if (path === '/admin/interviews' || path.startsWith('/admin/interviews/')) return 'interviews';
    if (path === '/admin/onboardings' || path.startsWith('/admin/onboardings/')) return 'onboardings';
    if (path === '/admin/logs' || path.startsWith('/admin/logs/')) return 'logs';
    if (path === '/admin/analytics' || path.startsWith('/admin/analytics/')) return 'analytics';
    if (path === '/admin/certifications' || path.startsWith('/admin/certifications/')) return 'certifications';
    if (path === '/admin/settings' || path.startsWith('/admin/settings/')) return 'settings';
    return 'dashboard';
  };

  const currentView = getCurrentView();

  // Fetch real data from API - 优化：使用useApi Hook，启用缓存和并行加载
  const { data: dashboardData, loading: dashboardLoading } = useApi<{ status: string; data: any }>(
    () => analyticsAPI.getDashboardData() as any,
    [lang],
    { autoFetch: true, cache: true, cacheTTL: 2 * 60 * 1000 } // 启用缓存，2分钟有效期
  );

  // 处理仪表盘数据
  useEffect(() => {
    if ((dashboardData as any)?.status === 'success' && dashboardData.data) {
      const data = dashboardData.data;

      // Set stats data from API response
      setStats([
        { id: '1', icon: 'users', label: t.dashboard.total_users, value: data.stats.totalUsers, change: 12, trend: 'up' },
        { id: '2', icon: 'shield', label: t.dashboard.hr_users, value: data.stats.hrUsers, change: 8, trend: 'up' },
        { id: '3', icon: 'user-check', label: t.dashboard.candidates, value: data.stats.candidates, change: 15, trend: 'up' },
        { id: '4', icon: 'building', label: t.dashboard.companies, value: data.stats.companies, change: 5, trend: 'up' },
        { id: '5', icon: 'briefcase', label: t.dashboard.jobs, value: data.stats.jobs, change: 18, trend: 'up' },
        { id: '6', icon: 'check-circle', label: t.dashboard.active_jobs, value: data.stats.activeJobs, change: 10, trend: 'up' },
        { id: '7', icon: 'file-text', label: t.dashboard.applications, value: data.stats.applications, change: 22, trend: 'up' },
        { id: '8', icon: 'zap', label: t.dashboard.hired, value: data.stats.hired, change: 14, trend: 'up' },
      ]);

      // Set other data from API response
      setTrends(data.trends || []);
      // 将categories数据用于职位分类分布图表
      setCategories(data.categories || []);
      setActivity(data.activity || []);
      setLoading(false);
    } else if (dashboardData === null && !dashboardLoading) {
      // 初始化默认数据，避免页面空白
      setStats([
        { id: '1', icon: 'users', label: t.dashboard.total_users, value: 0, change: 0, trend: 'up' },
        { id: '2', icon: 'shield', label: t.dashboard.hr_users, value: 0, change: 0, trend: 'up' },
        { id: '3', icon: 'user-check', label: t.dashboard.candidates, value: 0, change: 0, trend: 'up' },
        { id: '4', icon: 'building', label: t.dashboard.companies, value: 0, change: 0, trend: 'up' },
        { id: '5', icon: 'briefcase', label: t.dashboard.jobs, value: 0, change: 0, trend: 'up' },
        { id: '6', icon: 'check-circle', label: t.dashboard.active_jobs, value: 0, change: 0, trend: 'up' },
        { id: '7', icon: 'file-text', label: t.dashboard.applications, value: 0, change: 0, trend: 'up' },
        { id: '8', icon: 'zap', label: t.dashboard.hired, value: 0, change: 0, trend: 'up' },
      ]);
      setTrends([]);
      setCategories([]);
      setActivity([]);
    }

    // 只有在没有缓存数据时才显示loading
    setLoading(dashboardLoading && !dashboardData);
  }, [dashboardData, dashboardLoading, t]);

  // Handle AI Insight Generation
  const handleGenerateInsight = async () => {
    try {
      setInsightStatus(InsightStatus.LOADING);
      const insight = await generateDashboardInsight(stats, trends, activity, lang);
      setInsightText(insight);
      setInsightStatus(InsightStatus.SUCCESS);
    } catch (error) {
      setInsightStatus(InsightStatus.ERROR);
    }
  };

  return (
    <div className={`flex h-screen ${theme === 'dark' ? 'dark' : ''} overflow-hidden`}>
      {/* 左侧固定侧边栏 */}
      <Sidebar
        currentView={currentView}
        onViewChange={() => { }}
        lang={lang}
        onLogout={onLogout}
        isMobileOpen={sidebarOpen}
        onMobileToggle={() => setSidebarOpen(!sidebarOpen)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* 右侧主内容区 - 包含导航栏和内容 */}
      <div className="flex-1 flex flex-col h-full">
        {/* 移动端菜单按钮 */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-slate-900 text-white rounded-lg shadow-lg hover:bg-slate-800 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* 导航栏 */}
        <Header
          onGenerateInsight={handleGenerateInsight}
          insightStatus={insightStatus}
          lang={lang}
          t={t}
          currentUser={currentUser}
          onLogout={onLogout}
        />

        {/* 内容区 - 自适应高度，不超出侧边栏 */}
        <main className="flex-1 bg-slate-100 dark:bg-slate-900 p-2 md:p-4 lg:p-6 overflow-auto">
          <InsightPanel status={insightStatus} text={insightText} onClose={() => setInsightStatus(InsightStatus.IDLE)} t={t} />
          <Routes>
            <Route
              path="/dashboard"
              element={<DashboardHome lang={lang} t={t} stats={stats} trends={trends} categories={categories} activity={activity} loading={loading} />}
            />
            <Route path="/users" element={<SystemUsersView lang={lang} />} />
            <Route path="/companies" element={<CompaniesView lang={lang} />} />
            <Route path="/candidates" element={<CandidatesView lang={lang} />} />
            <Route path="/jobs" element={<JobsView lang={lang} />} />
            <Route path="/applications" element={<ApplicationsView lang={lang} />} />
            <Route path="/applications/:id" element={<ApplicationDetailView />} />
            <Route path="/interviews" element={<InterviewsView lang={lang} />} />
            <Route path="/onboardings" element={<OnboardingsView lang={lang} />} />
            <Route path="/logs" element={<SystemLogsView lang={lang} />} />
            <Route path="/analytics" element={<AnalyticsView lang={lang} theme={theme} />} />
            <Route
              path="/settings"
              element={<SettingsView lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} />}
            />
            <Route path="/certifications" element={<CertificationReviewScreen />} />
            {/* 默认重定向到dashboard */}
            <Route path="/*" element={<DashboardHome lang={lang} t={t} stats={stats} trends={trends} categories={categories} activity={activity} loading={loading} />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};
