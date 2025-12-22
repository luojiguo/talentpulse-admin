import React, { useState, useEffect, useMemo } from 'react';
import { Search } from 'lucide-react';
import { TRANSLATIONS } from '@/constants/constants';
import { jobAPI } from '@/services/apiService';
import { JobPosting, Language } from '@/types/types';

const JobsView: React.FC<{ lang: Language }> = ({ lang }) => {
    const t = TRANSLATIONS[lang].jobs;
    const [jobs, setJobs] = useState<JobPosting[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

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
                department: job.department || '',
                location: job.location,
                salary: job.salary || '',
                description: job.description || '',
                type: job.type,
                experience: job.experience || '',
                degree: job.degree || '',
                posterId: job.recruiter_id || 0,
                applicants: job.applications_count || 0,
                status: job.status === 'active' ? 'Active' : 'Closed',
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

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t.title}</h1>
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
                    <table className="w-full text-sm">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
                            <tr>
                                <th className="px-6 py-3 text-left">{t.position}</th>
                                <th className="px-6 py-3 text-left">{t.company}</th>
                                <th className="px-6 py-3 text-left">{t.applicants}</th>
                                <th className="px-6 py-3 text-left">{t.status}</th>
                                <th className="px-6 py-3 text-left">{t.date}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredJobs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                        没有找到匹配的职位
                                    </td>
                                </tr>
                            ) : (
                                filteredJobs.map(job => (
                                    <tr key={job.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600/50">
                                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{job.title}</td>
                                        <td className="px-6 py-4">{job.company}</td>
                                        <td className="px-6 py-4">{job.applicants}</td>
                                        <td className="px-6 py-4">{job.status}</td>
                                        <td className="px-6 py-4">{job.postedDate}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default JobsView;