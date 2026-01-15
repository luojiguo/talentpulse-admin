import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { Sparkles, Layout, Settings, X, BarChart3, Users, Briefcase, TrendingUp, AlertCircle } from 'lucide-react';
import { TRANSLATIONS } from '@/constants/constants';
import { generateAnalyticsInsight } from '@/services/aiService';
import { analyticsAPI } from '@/services/apiService';
import { InsightStatus, Language } from '@/types/types';
import { Button, Drawer, Switch, Empty } from 'antd';

// Widget Definition Interface
interface WidgetConfig {
  id: string;
  type: 'kpi' | 'chart';
  title: string;
  visible: boolean;
  colSpan: 1 | 2; // 1 = half width, 2 = full width
  component?: React.ReactNode;
  kpiData?: { label: string; value: string | number; icon: React.ReactNode; color: string };
  chartOption?: any;
  height?: number;
}

const AnalyticsView: React.FC<{ lang: Language, theme: 'light' | 'dark' }> = ({ lang, theme }) => {
  const t = TRANSLATIONS[lang].analytics;
  const aiT = TRANSLATIONS[lang].dashboard;
  const common = TRANSLATIONS[lang].common;

  // --- State ---
  const [loading, setLoading] = useState<boolean>(true);
  const [editMode, setEditMode] = useState<boolean>(false);

  // Data States
  const [funnelData, setFunnelData] = useState<any[]>([]);
  const [sourceQualityData, setSourceQualityData] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [competitionData, setCompetitionData] = useState<any[]>([]);
  const [topCompaniesData, setTopCompaniesData] = useState<any[]>([]);

  // AI Insights
  const [aiStatus, setAiStatus] = useState<InsightStatus>(InsightStatus.IDLE);
  const [aiText, setAiText] = useState<string>('');
  const [aiCollapsed, setAiCollapsed] = useState(false);
  // --- Data Fetching ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [dashboardRes, funnelRes, sourceRes, competitionRes, topCompaniesRes] = await Promise.all([
          analyticsAPI.getDashboardData(),
          analyticsAPI.getFunnelData(),
          analyticsAPI.getSourceQuality(),
          analyticsAPI.getJobCompetition(),
          analyticsAPI.getTopCompanies()
        ]);

        if (dashboardRes.data) {
          setStats(dashboardRes.data || {});
        }
        setFunnelData(funnelRes.data || []);
        setSourceQualityData(sourceRes.data || []);
        setCompetitionData(competitionRes.data || []);
        setTopCompaniesData(topCompaniesRes.data || []);
      } catch (error) {
        console.error("Failed to fetch analytics data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- AI Analysis ---
  const handleAnalyze = async () => {
    setAiStatus(InsightStatus.LOADING);
    // 传入更完整的数据供AI分析
    const result = await generateAnalyticsInsight(
      funnelData,
      stats.trends || [],
      sourceQualityData,
      lang,
      {
        stats: stats.stats,
        competitionData,
        topCompaniesData,
        categories: stats.categories
      }
    );
    if (result) {
      // 去除Markdown格式符号,只保留纯文本
      const cleanText = result
        .replace(/#{1,6}\s/g, '') // 去除标题符号 # ## ###
        .replace(/\*\*(.+?)\*\*/g, '$1') // 去除粗体 **text**
        .replace(/\*(.+?)\*/g, '$1') // 去除斜体 *text*
        .replace(/`(.+?)`/g, '$1') // 去除代码符号 `code`
        .replace(/^\s*[-*+]\s/gm, '• ') // 将列表符号统一为 •
        .replace(/^\s*\d+\.\s/gm, (match) => match.replace(/\d+\./, (num) => `${num.replace('.', '.')}`)) // 保留数字列表
        .trim();

      setAiText(cleanText);
      setAiStatus(InsightStatus.SUCCESS);
    } else {
      setAiStatus(InsightStatus.ERROR);
    }
  };

  // --- ECharts Options Configuration ---
  const axisColor = theme === 'dark' ? '#94a3b8' : '#64748b';
  const gridColor = theme === 'dark' ? 'rgba(148, 163, 184, 0.1)' : 'rgba(203, 213, 225, 0.4)';
  const primary = theme === 'dark' ? '#6366f1' : '#4f46e5';
  const accent = theme === 'dark' ? '#10b981' : '#059669';

  // Funnel Chart
  const funnelOption = {
    color: ['#4f46e5', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'],
    tooltip: { trigger: 'item', formatter: '{b} : {c}' },
    series: [
      {
        name: 'Funnel',
        type: 'funnel',
        left: '10%',
        top: 20,
        bottom: 20,
        width: '80%',
        min: 0,
        max: Math.max(...funnelData.map(d => d.value) || [100]),
        minSize: '0%',
        maxSize: '100%',
        sort: 'descending',
        gap: 5,
        label: { show: true, position: 'inside', formatter: '{b}: {c}', fontWeight: 'bold' },
        itemStyle: { borderColor: theme === 'dark' ? '#1e293b' : '#fff', borderWidth: 2, borderRadius: 8 },
        data: funnelData
      }
    ]
  };

  // Source Quality Chart
  const sourceOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
    legend: { textStyle: { color: axisColor }, top: 10 },
    xAxis: { type: 'category', data: sourceQualityData.map(d => d.name), axisPointer: { type: 'shadow' }, axisLine: { lineStyle: { color: axisColor } } },
    yAxis: [
      { type: 'value', name: t.hiresCount, axisLine: { lineStyle: { color: axisColor } }, splitLine: { lineStyle: { color: gridColor } } },
      { type: 'value', name: 'Score', min: 0, max: 100, axisLine: { lineStyle: { color: axisColor } }, splitLine: { show: false } }
    ],
    series: [
      { name: t.hiresCount, type: 'bar', barWidth: '30%', data: sourceQualityData.map(d => d.hires), itemStyle: { color: primary, borderRadius: [4, 4, 0, 0] } },
      { name: 'Quality Score', type: 'line', yAxisIndex: 1, data: sourceQualityData.map(d => d.quality), itemStyle: { color: accent }, smooth: true, lineStyle: { width: 3 } }
    ]
  };


  // Competition Options
  const competitionOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '15%', right: '8%', bottom: '3%', containLabel: true },
    xAxis: { type: 'value', axisLine: { lineStyle: { color: axisColor } }, splitLine: { lineStyle: { color: gridColor } } },
    yAxis: {
      type: 'category',
      data: competitionData.map(d => d.job_type || 'Unknown'),
      axisLine: { lineStyle: { color: axisColor } }
    },
    series: [{
      name: t.avgApplicants,
      type: 'bar',
      barWidth: '40%',
      data: competitionData.map(d => parseFloat(d.avg_applicants) || 0),
      itemStyle: { color: primary, borderRadius: [0, 4, 4, 0] },
      label: { show: true, position: 'right', formatter: `{c}${t.person}`, color: axisColor, fontWeight: 'bold' }
    }]
  };

  // Top Companies Options
  const topCompaniesOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: topCompaniesData.map(d => d.company_name),
      axisLabel: { rotate: 30, color: axisColor, fontSize: 10 },
      axisLine: { lineStyle: { color: axisColor } }
    },
    yAxis: { type: 'value', axisLine: { lineStyle: { color: axisColor } }, splitLine: { lineStyle: { color: gridColor } } },
    series: [{
      name: t.hiresCount,
      type: 'bar',
      barWidth: '35%',
      data: topCompaniesData.map(d => parseInt(d.hires) || 0),
      itemStyle: {
        color: theme === 'dark' ? '#10b981' : '#059669',
        borderRadius: [4, 4, 0, 0]
      },
      label: { show: true, position: 'top', color: axisColor, fontWeight: 'bold' }
    }]
  };

  // Category Pie
  const categoryOption = {
    tooltip: { trigger: 'item' },
    legend: { bottom: '0%', left: 'center', textStyle: { color: axisColor }, itemWidth: 10, itemHeight: 10 },
    series: [
      {
        name: t.jobCategory,
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['50%', '40%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: theme === 'dark' ? '#1e293b' : '#fff', borderWidth: 2 },
        label: { show: false, position: 'center' },
        emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold', color: axisColor } },
        labelLine: { show: false },
        data: (stats.categories || []).map((c: any) => ({ value: c.value, name: c.name, itemStyle: { color: c.color } }))
      }
    ]
  };

  // Trend Chart
  const trendOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: [t.visitors, t.registrants], textStyle: { color: axisColor }, top: 10 },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: (stats.trends || []).map((t: any) => t.month), axisLine: { lineStyle: { color: axisColor } } },
    yAxis: { type: 'value', axisLine: { lineStyle: { color: axisColor } }, splitLine: { lineStyle: { color: gridColor } } },
    series: [
      { name: t.visitors, type: 'line', stack: 'Total', smooth: true, areaStyle: { opacity: 0.1 }, emphasis: { focus: 'series' }, data: (stats.trends || []).map((t: any) => t.visitors), itemStyle: { color: primary } },
      { name: t.registrants, type: 'line', stack: 'Total', smooth: true, areaStyle: { opacity: 0.1 }, emphasis: { focus: 'series' }, data: (stats.trends || []).map((t: any) => t.registrations), itemStyle: { color: accent } }
    ]
  };

  // --- Widgets Configuration System ---
  const [widgets, setWidgets] = useState<WidgetConfig[]>([
    { id: 'kpi_users', type: 'kpi', title: t.totalUsers, visible: true, colSpan: 1, kpiData: { label: t.totalUsers, value: 0, icon: <Users size={20} />, color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' } },
    { id: 'kpi_jobs', type: 'kpi', title: t.activeJobs, visible: true, colSpan: 1, kpiData: { label: t.activeJobs, value: 0, icon: <Briefcase size={20} />, color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' } },
    { id: 'kpi_apps', type: 'kpi', title: t.applications, visible: true, colSpan: 1, kpiData: { label: t.applications, value: 0, icon: <BarChart3 size={20} />, color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' } },
    { id: 'kpi_hires', type: 'kpi', title: t.hires, visible: true, colSpan: 1, kpiData: { label: t.hires, value: 0, icon: <TrendingUp size={20} />, color: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' } },
    { id: 'chart_trend', type: 'chart', title: t.userTrend, visible: true, colSpan: 2, chartOption: trendOption, height: 350 },
    { id: 'chart_category', type: 'chart', title: t.jobCategory, visible: true, colSpan: 1, chartOption: categoryOption, height: 350 },
    { id: 'chart_funnel', type: 'chart', title: t.funnel, visible: true, colSpan: 1, chartOption: funnelOption, height: 350 },
    { id: 'chart_competition', type: 'chart', title: t.jobCompetition, visible: true, colSpan: 1, chartOption: competitionOption, height: 350 },
    { id: 'chart_top_companies', type: 'chart', title: t.topHiring, visible: true, colSpan: 1, chartOption: topCompaniesOption, height: 350 },
    { id: 'chart_source', type: 'chart', title: t.source, visible: true, colSpan: 2, chartOption: sourceOption, height: 400 },
  ]);

  // Sync data to widgets
  useEffect(() => {
    const s = stats.stats || {};
    setWidgets(prev => prev.map(w => {
      if (w.id === 'kpi_users') return { ...w, kpiData: { ...w.kpiData!, value: s.totalUsers || 0 } };
      if (w.id === 'kpi_jobs') return { ...w, kpiData: { ...w.kpiData!, value: s.activeJobs || 0 } };
      if (w.id === 'kpi_apps') return { ...w, kpiData: { ...w.kpiData!, value: s.applications || 0 } };
      if (w.id === 'kpi_hires') return { ...w, kpiData: { ...w.kpiData!, value: s.hired || 0 } };
      if (w.id === 'chart_funnel') return { ...w, chartOption: funnelOption };
      if (w.id === 'chart_source') return { ...w, chartOption: sourceOption };
      if (w.id === 'chart_category') return { ...w, chartOption: categoryOption };
      if (w.id === 'chart_trend') return { ...w, chartOption: trendOption };
      if (w.id === 'chart_competition') return { ...w, chartOption: competitionOption };
      if (w.id === 'chart_top_companies') return { ...w, chartOption: topCompaniesOption };
      return w;
    }));
  }, [stats, funnelData, sourceQualityData, competitionData, topCompaniesData, theme]);

  const toggleWidget = (id: string, checked: boolean) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, visible: checked } : w));
  };

  return (
    <div className="space-y-6 relative pb-20">
      {/* Header / Toolbar */}
      <div className="flex flex-wrap justify-between items-center bg-white/80 dark:bg-slate-800/80 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 backdrop-blur-md">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-lg shadow-indigo-500/20">
              <Layout className="w-5 h-5" />
            </div>
            {t.title}
            {loading && <span className="text-[10px] font-black text-indigo-500 animate-pulse ml-2 uppercase tracking-widest">{common.loading}</span>}
          </h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleAnalyze}
            disabled={aiStatus === InsightStatus.LOADING || loading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-sm font-black rounded-xl border border-indigo-100 dark:border-indigo-800/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            <Sparkles size={16} /> {t.aiInsight}
          </button>
          <button
            onClick={() => setEditMode(!editMode)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-black rounded-xl transition-all shadow-sm active:scale-95 ${editMode ? 'bg-rose-600 text-white shadow-rose-500/20' : 'bg-slate-800 dark:bg-slate-700 text-white shadow-slate-500/10'}`}
          >
            {editMode ? <X size={16} /> : <Settings size={16} />}
            {editMode ? t.finishEdit : t.customLayout}
          </button>
        </div>
      </div>

      {/* AI Insight Box */}
      {aiStatus !== InsightStatus.IDLE && (
        <div className={`p-6 rounded-2xl border-2 shadow-xl animate-in fade-in slide-in-from-top-4 duration-500 ${aiStatus === InsightStatus.ERROR ? 'bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-900/30' : 'bg-indigo-50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-900/30'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${aiStatus === InsightStatus.ERROR ? 'bg-rose-600' : 'bg-indigo-600'} text-white`}>
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className={`font-black uppercase tracking-widest ${aiStatus === InsightStatus.ERROR ? 'text-rose-800 dark:text-rose-400' : 'text-indigo-900 dark:text-indigo-400'}`}>{aiT.ai_title}</h3>
            </div>
            <button
              onClick={() => setAiCollapsed(!aiCollapsed)}
              className="p-2 rounded-lg hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors"
            >
              {aiCollapsed ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={aiStatus === InsightStatus.ERROR ? 'text-rose-600' : 'text-indigo-600'}>
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={aiStatus === InsightStatus.ERROR ? 'text-rose-600' : 'text-indigo-600'}>
                  <polyline points="18 15 12 9 6 15"></polyline>
                </svg>
              )}
            </button>
          </div>
          {!aiCollapsed && (
            <div className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-line font-medium italic pl-11">
              {aiStatus === InsightStatus.LOADING && <span className="animate-pulse">{t.thinking}</span>}
              {aiStatus === InsightStatus.ERROR && <div className="flex items-center gap-2 text-rose-600 font-bold"><AlertCircle size={16} /> {t.failed}</div>}
              {aiStatus === InsightStatus.SUCCESS && aiText}
            </div>
          )}
        </div>
      )}

      {/* Config Drawer for Edit Mode */}
      <Drawer title={<span className="font-black uppercase tracking-widest">{t.customLayout}</span>} onClose={() => setEditMode(false)} open={editMode} size="default" className="dark:bg-slate-900">
        <div className="space-y-6">
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wide">{t.selectingWidget}</p>
          <div className="space-y-2">
            {widgets.map(w => (
              <div key={w.id} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 transition-all hover:border-indigo-200 group">
                <span className="font-bold text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 transition-colors uppercase text-xs tracking-wide">{w.title}</span>
                <Switch checked={w.visible} onChange={(c) => toggleWidget(w.id, c)} className="bg-slate-200 dark:bg-slate-700" />
              </div>
            ))}
          </div>
        </div>
      </Drawer>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {widgets.filter(w => w.type === 'kpi' && w.visible).map(widget => (
          <div key={widget.id} className="relative group overflow-hidden bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
            <div className="absolute top-0 right-0 p-8 rotate-12 translate-x-4 -translate-y-4 opacity-10 group-hover:scale-125 transition-transform">
              {widget.kpiData?.icon}
            </div>
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-widest">{widget.kpiData?.label}</p>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{widget.kpiData?.value}</h3>
              </div>
              <div className={`p-3 rounded-xl shadow-inner ${widget.kpiData?.color}`}>
                {widget.kpiData?.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {widgets.filter(w => w.type === 'chart' && w.visible).map(widget => (
          <div
            key={widget.id}
            className={`bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 transition-all duration-300 shadow-indigo-500/5 hover:shadow-indigo-500/10 ${widget.colSpan === 2 ? 'lg:col-span-2' : ''}`}
          >
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest text-xs flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></div>
                {widget.title}
              </h3>
              <button className="text-slate-300 hover:text-indigo-600 transition-colors p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"><Settings size={14} /></button>
            </div>
            {widget.chartOption ? (
              <ReactECharts option={widget.chartOption} style={{ height: widget.height || 300 }} showLoading={loading} />
            ) : (
              <div className="h-[300px] flex items-center justify-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-100 dark:border-slate-800">
                <div className="flex flex-col items-center gap-2 opacity-30">
                  <AlertCircle size={32} className="text-slate-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{t.noMatch}</span>
                </div>
              </div>
            )}
          </div>
        ))}

        {widgets.filter(w => w.visible).length === 0 && (
          <div className="col-span-full py-20 text-center">
            <Empty description={<span className="font-black text-slate-400 uppercase tracking-widest text-xs">No widgets active in layout</span>} />
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsView;