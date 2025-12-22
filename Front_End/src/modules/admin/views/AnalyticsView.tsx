import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { Sparkles } from 'lucide-react';
import { TRANSLATIONS } from '@/constants/constants';
import { generateAnalyticsInsight } from '@/services/aiService';
import { analyticsAPI } from '@/services/apiService';
import { InsightStatus, Language } from '@/types/types';

const AnalyticsView: React.FC<{ lang: Language, theme: 'light' | 'dark' }> = ({ lang, theme }) => {
    const t = TRANSLATIONS[lang].analytics;
    const aiT = TRANSLATIONS[lang].dashboard;
    const [aiStatus, setAiStatus] = useState<InsightStatus>(InsightStatus.IDLE);
    const [aiText, setAiText] = useState<string | null>(null);
    
    // 状态管理：从API获取的真实数据
    const [funnelData, setFunnelData] = useState<any[]>([]);
    const [timeToHireData, setTimeToHireData] = useState<any[]>([]);
    const [sourceQualityData, setSourceQualityData] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    // 从API获取数据分析数据
    useEffect(() => {
        const fetchAnalyticsData = async () => {
            setLoading(true);
            try {
                const [funnelResult, timeToHireResult, sourceQualityResult] = await Promise.all([
                    analyticsAPI.getFunnelData(),
                    analyticsAPI.getTimeToHire(),
                    analyticsAPI.getSourceQuality()
                ]);
                
                setFunnelData(funnelResult.data || []);
                setTimeToHireData(timeToHireResult.data || []);
                setSourceQualityData(sourceQualityResult.data || []);
            } catch (error) {
                console.error('获取数据分析数据失败:', error);
            } finally {
                setLoading(false);
            }
        };
        
        fetchAnalyticsData();
    }, []);

    const handleAnalyze = async () => {
        setAiStatus(InsightStatus.LOADING);
        const result = await generateAnalyticsInsight(funnelData, timeToHireData, sourceQualityData, lang);
        if (result) {
            setAiText(result);
            setAiStatus(InsightStatus.SUCCESS);
        } else {
            setAiStatus(InsightStatus.ERROR);
        }
    };

    const axisColor = theme === 'dark' ? '#cbd5e1' : '#64748b';
    const gridColor = theme === 'dark' ? 'rgba(148, 163, 184, 0.25)' : 'rgba(203, 213, 225, 0.6)';
    const primary = theme === 'dark' ? '#8b5cf6' : '#3b82f6';
    const accent = theme === 'dark' ? '#22d3ee' : '#10b981';

    const categories = funnelData.map(d => d.name);
    const values = funnelData.map(d => d.value);
    const drops = values.map((v, idx) => idx === 0 ? 0 : (values[idx - 1] - v));
    const funnelOption = {
      grid: { left: '8%', right: '4%', bottom: '12%', containLabel: true },
      tooltip: { trigger: 'axis' },
      legend: { top: 0, textStyle: { color: axisColor } },
      xAxis: {
        type: 'category',
        axisLabel: { color: axisColor },
        axisLine: { lineStyle: { color: gridColor } },
        data: categories
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: axisColor },
        splitLine: { lineStyle: { color: gridColor } }
      },
      series: [
        { name: '到达人数', type: 'line', stack: 'total', smooth: true, symbol: 'circle', itemStyle: { color: primary }, areaStyle: { color: primary, opacity: 0.15 }, lineStyle: { width: 3 }, data: values },
        { name: '流失人数', type: 'line', stack: 'total', smooth: true, symbol: 'none', itemStyle: { color: accent }, areaStyle: { color: accent, opacity: 0.12 }, lineStyle: { width: 2, type: 'dashed' }, data: drops }
      ]
    };

    const timeOption = {
      grid: { left: '8%', right: '4%', bottom: '12%', containLabel: true },
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        axisLabel: { color: axisColor },
        axisLine: { lineStyle: { color: gridColor } },
        data: timeToHireData.map(d => d.name)
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: axisColor },
        splitLine: { lineStyle: { color: gridColor } }
      },
      series: [{
        name: 'Days',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        itemStyle: { color: primary },
        areaStyle: { color: primary, opacity: 0.15 },
        lineStyle: { width: 3 },
        data: timeToHireData.map(d => d.days)
      }]
    };

    const sourceOption = {
      grid: { left: '8%', right: '4%', bottom: '12%', containLabel: true },
      tooltip: { trigger: 'axis' },
      legend: { top: 0, textStyle: { color: axisColor } },
      xAxis: {
        type: 'category',
        axisLabel: { color: axisColor },
        axisLine: { lineStyle: { color: gridColor } },
        data: sourceQualityData.map(d => d.name)
      },
      yAxis: [
        { type: 'value', axisLabel: { color: axisColor }, splitLine: { lineStyle: { color: gridColor } } },
        { type: 'value', axisLabel: { color: axisColor }, splitLine: { show: false } }
      ],
      series: [
        { name: 'Hires', type: 'bar', data: sourceQualityData.map(d => d.hires), itemStyle: { color: primary }, barWidth: 28 },
        { name: 'Quality', type: 'line', yAxisIndex: 1, data: sourceQualityData.map(d => d.quality), itemStyle: { color: accent }, lineStyle: { width: 3 }, smooth: true }
      ]
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t.title}</h1>
              <button 
                onClick={handleAnalyze}
                disabled={aiStatus === InsightStatus.LOADING}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {aiStatus === InsightStatus.LOADING ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Sparkles size={16} />
                )}
                <span>{aiStatus === InsightStatus.LOADING ? aiT.ai_analyzing : aiT.ai_btn}</span>
              </button>
            </div>

            {aiStatus !== InsightStatus.IDLE && (
              <div className={`p-6 rounded-xl border ${aiStatus === InsightStatus.ERROR ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-500/30' : 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-500/30'}`}>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className={`w-5 h-5 ${aiStatus === InsightStatus.ERROR ? 'text-rose-600' : 'text-indigo-600'}`} />
                  <h3 className={`font-semibold ${aiStatus === InsightStatus.ERROR ? 'text-rose-800 dark:text-rose-200' : 'text-indigo-900 dark:text-indigo-200'}`}>{aiT.ai_title}</h3>
                </div>
                <div className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                  {aiStatus === InsightStatus.LOADING && (lang === 'zh' ? 'AI 正在分析平台数据...' : 'AI is analyzing analytics data...')}
                  {aiStatus === InsightStatus.ERROR && (lang === 'zh' ? '服务暂时不可用，请稍后重试。' : 'Service unavailable, please try again later.')}
                  {aiStatus === InsightStatus.SUCCESS && aiText}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="font-bold text-slate-800 dark:text-white mb-4">{t.funnel}</h3>
                    <ReactECharts option={funnelOption} style={{ height: 300 }}></ReactECharts>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="font-bold text-slate-800 dark:text-white mb-4">{t.timeToHire}</h3>
                    <ReactECharts option={timeOption} style={{ height: 300 }}></ReactECharts>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                 <h3 className="font-bold text-slate-800 dark:text-white mb-4">{t.source}</h3>
                 <ReactECharts option={sourceOption} style={{ height: 300 }}></ReactECharts>
            </div>
        </div>
    );
};

export default AnalyticsView;