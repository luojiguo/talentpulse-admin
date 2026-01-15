import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Download, Filter, Settings, Check, X } from 'lucide-react';
import { TRANSLATIONS } from '@/constants/constants';
import { applicationAPI } from '@/services/apiService';
import { Application, Language } from '@/types/types';
import Pagination from '@/components/Pagination';
import { exportToCSV } from '../helpers';

const ApplicationsView: React.FC<{ lang: Language }> = ({ lang }) => {
    const t = TRANSLATIONS[lang].applications;
    const common = TRANSLATIONS[lang].common;
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    // Column visibility state
    const [showColumnSettings, setShowColumnSettings] = useState(false);
    const settingsRef = useRef<HTMLDivElement>(null);
    const [visibleColumns, setVisibleColumns] = useState({
        candidate: true,
        job: true,
        company: true,
        stage: true,
        score: true,
        interviews: false,
        email: false,
        phone: false,
        location: false,
        salary: false,
        date: true,
        updated: false
    });

    // Helper to translate stages
    const getStageText = (stage: string) => {
        const lowerStage = stage.toLowerCase();
        return (t.stages as any)[lowerStage] || stage;
    };

    // Stage colors
    const getStageColor = (stage: string) => {
        const lowerStage = stage.toLowerCase();
        switch (lowerStage) {
            case 'new':
            case 'pending':
                return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50';
            case 'applied':
                return 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300 border border-sky-200 dark:border-sky-800/50';
            case 'screening':
                return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50';
            case 'interview':
            case 'interviewing':
                return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50';
            case 'offer':
                return 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50';
            case 'hired':
                return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border border-green-200 dark:border-green-800/50';
            case 'rejected':
                return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-800/50';
            default:
                return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700';
        }
    };

    // Click outside handler for column settings
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
                setShowColumnSettings(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Fetch applications from API
    useEffect(() => {
        const fetchApplications = async () => {
            try {
                setLoading(true);
                const response = await applicationAPI.getAllApplications();
                setApplications((response as any).data || []);
            } catch (error) {
                console.error('Failed to fetch applications:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchApplications();
    }, []);

    // Filtering logic
    const filteredApplications = useMemo(() => {
        return applications.filter(app =>
        (searchTerm === '' ||
            app.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.stage.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [applications, searchTerm]);

    // Pagination
    const paginatedApplications = useMemo(() => {
        setTotalItems(filteredApplications.length);
        const startIndex = (currentPage - 1) * pageSize;
        return filteredApplications.slice(startIndex, startIndex + pageSize);
    }, [filteredApplications, currentPage, pageSize]);

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row gap-4 justify-between items-center bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
                    <div className="flex gap-2 items-center w-full md:w-auto bg-slate-50 dark:bg-slate-900/50 px-3 py-2 rounded-lg border border-slate-100 dark:border-slate-700 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                        <Search className="text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder={t.searchPlaceholder}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="bg-transparent focus:outline-none text-sm w-full md:w-64 dark:text-white"
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                                <X size={14} />
                            </button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <div className="relative" ref={settingsRef}>
                            <button
                                onClick={() => setShowColumnSettings(!showColumnSettings)}
                                className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-all shadow-sm"
                            >
                                <Settings size={18} /> {lang === 'zh' ? '列设置' : 'Columns'}
                            </button>

                            {showColumnSettings && (
                                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50 p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <h4 className="text-xs font-black text-slate-500 dark:text-slate-400 mb-3 border-b border-slate-50 dark:border-slate-700 pb-2 uppercase tracking-widest">
                                        {t.columnSettings}
                                    </h4>
                                    <div className="space-y-1 max-h-80 overflow-y-auto custom-scrollbar pr-1">
                                        {[
                                            { key: 'candidate', label: t.candidate },
                                            { key: 'job', label: t.job },
                                            { key: 'company', label: t.company },
                                            { key: 'stage', label: t.stage },
                                            { key: 'score', label: t.score },
                                            { key: 'interviews', label: t.interviewCount },
                                            { key: 'email', label: t.email },
                                            { key: 'phone', label: t.phone },
                                            { key: 'location', label: t.location },
                                            { key: 'salary', label: t.salary },
                                            { key: 'date', label: t.date },
                                            { key: 'updated', label: t.updated }
                                        ].map(({ key, label }) => (
                                            <button
                                                key={key}
                                                onClick={() => setVisibleColumns(prev => ({ ...prev, [key]: !prev[key as keyof typeof visibleColumns] }))}
                                                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group"
                                            >
                                                <span className="text-sm text-slate-600 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                                    {label}
                                                </span>
                                                {visibleColumns[key as keyof typeof visibleColumns] && <Check size={16} className="text-indigo-500" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => exportToCSV(filteredApplications, 'applications')}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-700 dark:bg-slate-600 text-white text-sm font-medium rounded-lg hover:bg-slate-900 dark:hover:bg-slate-500 transition-all shadow-sm"
                            title={common.export}
                        >
                            <Download size={18} /> {common.export}
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-[11px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest bg-slate-50/50 dark:bg-slate-700/30 border-b border-slate-100 dark:border-slate-700">
                            <tr>
                                {visibleColumns.candidate && <th className="px-6 py-4 text-left">{t.candidate}</th>}
                                {visibleColumns.job && <th className="px-6 py-4 text-left">{t.job}</th>}
                                {visibleColumns.company && <th className="px-6 py-4 text-left">{t.company}</th>}
                                {visibleColumns.stage && <th className="px-6 py-4 text-left">{t.stage}</th>}
                                {visibleColumns.score && <th className="px-6 py-4 text-center">{t.score}</th>}
                                {visibleColumns.interviews && <th className="px-6 py-4 text-left">{t.interviewCount}</th>}
                                {visibleColumns.email && <th className="px-6 py-4 text-left">{t.email}</th>}
                                {visibleColumns.phone && <th className="px-6 py-4 text-left">{t.phone}</th>}
                                {visibleColumns.location && <th className="px-6 py-4 text-left">{t.location}</th>}
                                {visibleColumns.salary && <th className="px-6 py-4 text-left">{t.salary}</th>}
                                {visibleColumns.date && <th className="px-6 py-4 text-left">{t.date}</th>}
                                {visibleColumns.updated && <th className="px-6 py-4 text-left">{t.updated}</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {loading ? (
                                <tr>
                                    <td colSpan={Object.values(visibleColumns).filter(Boolean).length} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin shadow-lg"></div>
                                            <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[10px]">{common.loading}</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredApplications.length === 0 ? (
                                <tr>
                                    <td colSpan={Object.values(visibleColumns).filter(Boolean).length} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3 bg-slate-50 dark:bg-slate-900/20 py-10 rounded-2xl mx-6 border-2 border-dashed border-slate-100 dark:border-slate-800">
                                            <Search size={40} className="text-slate-200 dark:text-slate-700" />
                                            <p className="text-slate-400 font-medium">{t.noMatch}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedApplications.map(app => (
                                    <tr key={app.id} className="group hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                        {visibleColumns.candidate && (
                                            <td className="px-6 py-4 font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative h-9 w-9 flex-shrink-0">
                                                        <div className="h-full w-full rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-black border-2 border-white dark:border-slate-800 shadow-sm text-xs">
                                                            {app.candidateName?.charAt(0)}
                                                        </div>
                                                        {app.candidateAvatar && (
                                                            <img
                                                                src={app.candidateAvatar.startsWith('http') ? app.candidateAvatar : `http://localhost:8001${app.candidateAvatar}`}
                                                                alt={app.candidateName}
                                                                className="absolute inset-0 h-full w-full rounded-full object-cover border-2 border-white dark:border-slate-800"
                                                                onError={(e) => {
                                                                    e.currentTarget.style.display = 'none';
                                                                }}
                                                            />
                                                        )}
                                                    </div>
                                                    <span className="truncate max-w-[120px]">{app.candidateName}</span>
                                                </div>
                                            </td>
                                        )}
                                        {visibleColumns.job && <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-medium">{app.jobTitle}</td>}
                                        {visibleColumns.company && (
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative h-9 w-9 flex-shrink-0">
                                                        <div className="h-full w-full rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black border border-white dark:border-slate-800 shadow-sm text-[10px] uppercase">
                                                            {app.companyName?.charAt(0) || '?'}
                                                        </div>
                                                        {app.companyLogo && (
                                                            <img
                                                                src={app.companyLogo.startsWith('http') ? app.companyLogo : `http://localhost:8001${app.companyLogo}`}
                                                                alt={app.companyName}
                                                                className="absolute inset-0 h-full w-full rounded-lg object-cover border border-white dark:border-slate-800"
                                                                onError={(e) => {
                                                                    e.currentTarget.style.display = 'none';
                                                                }}
                                                            />
                                                        )}
                                                    </div>
                                                    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[120px]">{app.companyName}</span>
                                                </div>
                                            </td>
                                        )}
                                        {visibleColumns.stage && (
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-full shadow-sm ${getStageColor(app.stage)}`}>
                                                    {getStageText(app.stage)}
                                                </span>
                                            </td>
                                        )}
                                        {visibleColumns.score && (
                                            <td className="px-6 py-4 text-center">
                                                {(() => {
                                                    const score = app.matchScore || (Math.floor((app.id % 30)) + 70);
                                                    return (
                                                        <div className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-black shadow-sm ${score >= 80 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50' :
                                                            score >= 60 ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50' :
                                                                'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                                                            }`}>
                                                            {score}%
                                                        </div>
                                                    );
                                                })()}
                                            </td>
                                        )}
                                        {visibleColumns.interviews && <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-bold">{app.interviewCount || 0}</td>}
                                        {visibleColumns.email && <td className="px-6 py-4 text-slate-400 font-medium font-mono text-xs truncate max-w-[150px]">{app.candidateEmail || '-'}</td>}
                                        {visibleColumns.phone && <td className="px-6 py-4 text-slate-400 font-medium font-mono text-xs">{app.candidatePhone || '-'}</td>}
                                        {visibleColumns.location && <td className="px-6 py-4 text-slate-500 italic text-xs truncate max-w-[120px]">{app.jobLocation || '-'}</td>}
                                        {visibleColumns.salary && <td className="px-6 py-4 text-indigo-600 dark:text-indigo-400 font-black text-xs">{app.jobSalary || '-'}</td>}
                                        {visibleColumns.date && <td className="px-6 py-4 text-slate-400 dark:text-slate-500 font-mono text-xs">{new Date(app.appliedDate).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US')}</td>}
                                        {visibleColumns.updated && <td className="px-6 py-4 text-slate-400 dark:text-slate-500 font-mono text-xs">{app.updatedDate ? new Date(app.updatedDate).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US') : '-'}</td>}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="px-6 py-4 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700">
                    <Pagination
                        currentPage={currentPage}
                        pageSize={pageSize}
                        totalItems={totalItems}
                        onPageChange={(page) => setCurrentPage(page)}
                        onPageSizeChange={(size) => {
                            setPageSize(size);
                            setCurrentPage(1);
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default ApplicationsView;