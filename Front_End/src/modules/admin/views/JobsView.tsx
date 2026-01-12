import React, { useState, useEffect, useMemo } from 'react';
import { Search, Download, Filter } from 'lucide-react';
import { TRANSLATIONS } from '@/constants/constants';
import { jobAPI } from '@/services/apiService';
import { JobPosting, Language } from '@/types/types';
import Pagination from '@/components/Pagination';
import { exportToCSV } from '../helpers';

const JobsView: React.FC<{ lang: Language }> = ({ lang }) => {
    const t = TRANSLATIONS[lang].jobs;
    const [jobs, setJobs] = useState<JobPosting[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // 分页状态
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    // 从API获取职位数据
    const [error, setError] = useState<Error | null>(null);

    const fetchJobs = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await jobAPI.getAllJobs();
            // 将数据库返回的职位数据转换为前端所需的格式
            const formattedJobs: JobPosting[] = response.data.map((job: any) => ({
                id: job.id,
                title: job.title,
                company: job.company_name || job.company_id, // 使用公司名称，如果没有则使用公司ID
                company_logo: job.company_logo,
                department: job.department || '',
                location: job.location,
                salary: job.salary || '',
                description: job.description || '',
                type: job.type,
                experience: job.experience || '',
                degree: job.degree || '',
                posterId: job.recruiter_id || 0,
                // 修复：尝试多种可能的字段名获取申请人数
                applicants: job.applications_count || job.applicant_count || job.applications || job.applicant || 0,
                status: job.status,
                postedDate: new Date(job.publish_date).toLocaleDateString()
            }));
            setJobs(formattedJobs);
        } catch (error) {
            console.error('获取职位数据失败:', error);
            setError(error instanceof Error ? error : new Error('获取职位数据失败'));
        } finally {
            setLoading(false);
        }
    };

    // 处理搜索
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    React.useEffect(() => {
        fetchJobs();
    }, []);

    // 筛选职位数据
    const filteredJobs = useMemo(() => {
        return jobs.filter(job =>
        (searchTerm === '' ||
            job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (job.type && job.type.toLowerCase().includes(searchTerm.toLowerCase())))
        );
    }, [jobs, searchTerm]);

    // 计算分页数据
    const paginatedJobs = useMemo(() => {
        setTotalItems(filteredJobs.length);
        const startIndex = (currentPage - 1) * pageSize;
        return filteredJobs.slice(startIndex, startIndex + pageSize);
    }, [filteredJobs, currentPage, pageSize]);

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex gap-4 justify-between items-center">
                    <div className="flex gap-2 items-center w-full md:w-auto">
                        <Search className="text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="搜索职位标题、公司或地点..."
                            value={searchTerm}
                            onChange={handleSearch}
                            className="bg-transparent focus:outline-none text-sm w-full md:w-64"
                            disabled={loading} // 加载时禁用搜索
                        />
                    </div>
                    <div className="flex gap-2">
                        {error && (
                            <button
                                onClick={fetchJobs}
                                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-md flex items-center gap-2"
                            >
                                重试
                            </button>
                        )}
                    </div>
                </div>

                {loading && (
                    <div className="p-8 flex justify-center items-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                    </div>
                )}

                {error && (
                    <div className="p-8 text-center bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200">
                        <h3 className="text-lg font-medium mb-2">错误</h3>
                        <p className="mb-4">{error.message}</p>
                        <button
                            onClick={fetchJobs}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md"
                        >
                            重试
                        </button>
                    </div>
                )}

                {!loading && !error && (
                    <>
                        <table className="w-full text-sm">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
                                <tr>
                                    <th className="px-6 py-3 text-left">{t.position}</th>
                                    <th className="px-6 py-3 text-left">{t.company}</th>
                                    <th className="px-6 py-3 text-left">{t.dept}</th>
                                    <th className="px-6 py-3 text-left">{t.location}</th>
                                    <th className="px-6 py-3 text-left">{t.salary}</th>
                                    <th className="px-6 py-3 text-left">{t.applicants}</th>
                                    <th className="px-6 py-3 text-left">{t.status}</th>
                                    <th className="px-6 py-3 text-left">{t.date}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredJobs.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                                            没有找到匹配的职位
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedJobs.map(job => (
                                        <tr key={job.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600/50">
                                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{job.title}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative h-8 w-8 flex-shrink-0">
                                                        {/* Base Layer: Initials */}
                                                        <div className="h-full w-full rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold border border-white dark:border-slate-800 shadow-sm text-xs">
                                                            {job.company?.toString().charAt(0) || '?'}
                                                        </div>

                                                        {/* Top Layer: Image */}
                                                        {job.company_logo && (
                                                            <img
                                                                src={job.company_logo.startsWith('http') ? job.company_logo : `http://localhost:3001${job.company_logo}`}
                                                                alt={job.company?.toString()}
                                                                className="absolute inset-0 h-full w-full rounded object-cover"
                                                                onError={(e) => {
                                                                    e.currentTarget.style.display = 'none';
                                                                }}
                                                            />
                                                        )}
                                                    </div>
                                                    <span>{job.company}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500">{job.department || '-'}</td>
                                            <td className="px-6 py-4 text-slate-500">{job.location}</td>
                                            <td className="px-6 py-4 text-slate-600 font-medium">{job.salary}</td>
                                            <td className="px-6 py-4">
                                                <span className="bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full text-xs font-bold">
                                                    {job.applicants}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${job.status === 'active' || job.status === 'Active' ? 'bg-green-100 text-green-700' :
                                                    job.status === 'closed' || job.status === 'Closed' ? 'bg-red-100 text-red-700' :
                                                        'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {job.status === 'active' || job.status === 'Active' ? '招聘中' :
                                                        job.status === 'closed' || job.status === 'Closed' ? '已关闭' :
                                                            job.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-400">{job.postedDate}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>

                        {/* 分页组件 */}
                        <div className="px-6 py-2 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
                            <Pagination
                                currentPage={currentPage}
                                pageSize={pageSize}
                                totalItems={totalItems}
                                onPageChange={(page) => setCurrentPage(page)}
                                onPageSizeChange={(size) => {
                                    setPageSize(size);
                                    setCurrentPage(1); // 重置到第一页
                                }}
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default JobsView;