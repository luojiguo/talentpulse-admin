import React, { useState, useEffect, useMemo } from 'react';
import { Search, Download, Filter, AlertCircle, RefreshCw } from 'lucide-react';
import { TRANSLATIONS } from '@/constants/constants';
import { jobAPI } from '@/services/apiService';
import { JobPosting, Language } from '@/types/types';
import Pagination from '@/components/Pagination';
import { exportToCSV } from '../helpers';

const JobsView: React.FC<{ lang: Language }> = ({ lang }) => {
    const t = TRANSLATIONS[lang].jobs;
    const common = TRANSLATIONS[lang].common;
    const [jobs, setJobs] = useState<JobPosting[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState<Error | null>(null);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    const fetchJobs = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await jobAPI.getAllJobs();
            const formattedJobs: JobPosting[] = response.data.map((job: any) => ({
                id: job.id,
                title: job.title,
                company: job.company_name || job.company_id,
                company_logo: job.company_logo,
                department: job.department || '',
                location: job.location,
                salary: job.salary || '',
                description: job.description || '',
                type: job.type,
                experience: job.experience || '',
                degree: job.degree || '',
                posterId: job.recruiter_id || 0,
                applicants: job.applications_count || job.applicant_count || job.applications || job.applicant || 0,
                status: job.status,
                postedDate: new Date(job.publish_date).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US')
            }));
            setJobs(formattedJobs);
        } catch (error) {
            console.error('Failed to fetch jobs:', error);
            setError(error instanceof Error ? error : new Error(t.fetchFailed));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();
    }, []);

    // Filtering logic
    const filteredJobs = useMemo(() => {
        return jobs.filter(job =>
        (searchTerm === '' ||
            job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (job.type && job.type.toLowerCase().includes(searchTerm.toLowerCase())))
        );
    }, [jobs, searchTerm]);

    // Pagination
    const paginatedJobs = useMemo(() => {
        setTotalItems(filteredJobs.length);
        const startIndex = (currentPage - 1) * pageSize;
        return filteredJobs.slice(startIndex, startIndex + pageSize);
    }, [filteredJobs, currentPage, pageSize]);

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-all duration-300">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-wrap gap-4 justify-between items-center bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
                    <div className="flex gap-2 items-center w-full md:w-auto bg-slate-50 dark:bg-slate-900/50 px-3 py-2 rounded-lg border border-slate-100 dark:border-slate-700 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
                        <Search className="text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder={t.searchPlaceholder}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-transparent focus:outline-none text-sm w-full md:w-64 dark:text-white placeholder-slate-400 font-medium"
                            disabled={loading}
                        />
                    </div>
                    <div className="flex gap-2 items-center">
                        {error && (
                            <button
                                onClick={fetchJobs}
                                className="px-4 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-sm font-bold rounded-lg border border-amber-200 dark:border-amber-800/50 hover:bg-amber-200 dark:hover:bg-amber-900/50 flex items-center gap-2 transition-all active:scale-95"
                            >
                                <RefreshCw size={16} /> {common.retry}
                            </button>
                        )}
                        <button
                            onClick={() => exportToCSV(filteredJobs, 'jobs')}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-700 dark:bg-slate-600 text-white text-sm font-medium rounded-lg hover:bg-slate-900 dark:hover:bg-slate-500 transition-all shadow-sm"
                            disabled={loading}
                        >
                            <Download size={16} /> {common.export}
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-20 flex flex-col justify-center items-center gap-4">
                            <div className="relative">
                                <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-500/20 border-t-indigo-600 shadow-xl"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="h-2 w-2 bg-indigo-600 rounded-full animate-pulse"></div>
                                </div>
                            </div>
                            <span className="text-slate-500 dark:text-slate-400 font-bold tracking-widest uppercase text-xs">{common.loading}</span>
                        </div>
                    ) : error ? (
                        <div className="p-20 text-center bg-slate-50 dark:bg-slate-900/20 m-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-full w-fit mx-auto mb-4 border border-amber-100 dark:border-amber-800">
                                <AlertCircle size={40} className="text-amber-600 dark:text-amber-400" />
                            </div>
                            <h3 className="text-lg font-black text-slate-800 dark:text-slate-200 mb-2">{lang === 'zh' ? '加载异常' : 'Load Error'}</h3>
                            <p className="text-slate-500 dark:text-slate-400 mb-6 font-medium max-w-md mx-auto">{error.message}</p>
                            <button
                                onClick={fetchJobs}
                                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                            >
                                {common.retry}
                            </button>
                        </div>
                    ) : (
                        <>
                            <table className="w-full text-sm">
                                <thead className="text-[11px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest bg-slate-50/50 dark:bg-slate-700/30 border-b border-slate-100 dark:border-slate-700">
                                    <tr>
                                        <th className="px-6 py-4 text-left">{t.position}</th>
                                        <th className="px-6 py-4 text-left">{t.company}</th>
                                        <th className="px-6 py-4 text-left">{t.dept}</th>
                                        <th className="px-6 py-4 text-left">{t.location}</th>
                                        <th className="px-6 py-4 text-left">{t.salary}</th>
                                        <th className="px-6 py-4 text-left">{t.applicants}</th>
                                        <th className="px-6 py-4 text-left">{t.status}</th>
                                        <th className="px-6 py-4 text-left">{t.date}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                    {filteredJobs.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-20 text-center text-slate-400">
                                                <div className="flex flex-col items-center gap-3">
                                                    <Search size={48} className="text-slate-100 dark:text-slate-800" />
                                                    <p className="font-bold tracking-wide">{t.noMatch}</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedJobs.map(job => (
                                            <tr key={job.id} className="group border-b dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                                <td className="px-6 py-5 font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{job.title}</td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative h-9 w-9 flex-shrink-0">
                                                            <div className="h-full w-full rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black border border-indigo-100 dark:border-indigo-800 shadow-sm text-sm uppercase">
                                                                {job.company?.toString().charAt(0) || '?'}
                                                            </div>
                                                            {job.company_logo && (
                                                                <img
                                                                    src={job.company_logo.startsWith('http') ? job.company_logo : `http://localhost:8001${job.company_logo}`}
                                                                    alt={job.company?.toString()}
                                                                    className="absolute inset-0 h-full w-full rounded-lg object-cover border border-slate-100 dark:border-slate-800"
                                                                    onError={(e) => {
                                                                        e.currentTarget.style.display = 'none';
                                                                    }}
                                                                />
                                                            )}
                                                        </div>
                                                        <span className="font-semibold text-slate-700 dark:text-slate-300">{job.company}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-slate-500 dark:text-slate-400 italic text-xs font-medium">{job.department || '-'}</td>
                                                <td className="px-6 py-5 text-slate-600 dark:text-slate-400 text-xs font-bold">{job.location}</td>
                                                <td className="px-6 py-5 text-indigo-600 dark:text-indigo-400 font-black text-sm">{job.salary}</td>
                                                <td className="px-6 py-5">
                                                    <span className="bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full text-[10px] font-black border border-indigo-100 dark:border-indigo-800/50 shadow-sm">
                                                        {job.applicants}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm ${job.status?.toLowerCase() === 'active' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/50' :
                                                        job.status?.toLowerCase() === 'closed' ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700' :
                                                            'bg-slate-50 text-slate-500 dark:bg-slate-900/40 dark:text-slate-500 border-slate-100 dark:border-slate-800'
                                                        }`}>
                                                        {job.status?.toLowerCase() === 'active' ? t.activeStatus :
                                                            job.status?.toLowerCase() === 'closed' ? t.closedStatus :
                                                                job.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-slate-400 dark:text-slate-500 text-xs font-medium font-mono">{job.postedDate}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>

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
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default JobsView;