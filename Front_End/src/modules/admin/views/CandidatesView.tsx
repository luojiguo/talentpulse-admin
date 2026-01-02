import React, { useState, useEffect, useMemo } from 'react';
import { Search, Download, Filter } from 'lucide-react';
import { TRANSLATIONS } from '@/constants/constants';
import { candidateAPI } from '@/services/apiService';
import { Candidate, Language } from '@/types/types';
import Pagination from '@/components/Pagination';
import { exportToCSV } from '../helpers';

const CandidatesView: React.FC<{ lang: Language }> = ({ lang }) => {
    const t = TRANSLATIONS[lang].candidates;
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // 筛选状态
    const [filterExperience, setFilterExperience] = useState('全部');
    const [filterJobStatus, setFilterJobStatus] = useState('全部');
    const [filterSalaryNegotiable, setFilterSalaryNegotiable] = useState('全部');
    const [filterAvailability, setFilterAvailability] = useState('全部');
    
    // 分页状态
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    
    // 筛选选项
    const experienceOptions = ['全部', '应届', '1-3年', '3-5年', '5-10年', '10年以上'];
    const jobStatusOptions = ['全部', 'active', 'inactive', 'hired'];
    const salaryNegotiableOptions = ['全部', '是', '否'];
    const availabilityOptions = ['全部', 'available', 'unavailable'];
    
    // 从API获取候选人数据
    React.useEffect(() => {
        const fetchCandidates = async () => {
            try {
                setLoading(true);
                const response = await candidateAPI.getAllCandidates();
                
                // 将数据库返回的候选人数据转换为前端所需的格式
                if (!response.data || !Array.isArray(response.data)) {
                    setCandidates([]);
                    return;
                }
                
                const formattedCandidates: any[] = response.data.map((candidate: any, index: number) => ({
                    id: candidate.id?.toString() || `temp-${index}`,
                    name: candidate.name || '未知姓名',
                    role: candidate.desired_position || '',
                    experience: candidate.work_experience_years ? `${candidate.work_experience_years}年` : '无经验',
                    status: candidate.availability_status || 'Available',
                    location: candidate.address || '',
                    skills: Array.isArray(candidate.skills) ? candidate.skills : [],
                    avatar: candidate.avatar || '',
                    // 筛选相关字段
                    work_experience_years: candidate.work_experience_years || 0,
                    job_status: candidate.job_status || 'active',
                    salary_negotiable: candidate.salary_negotiable || false,
                    availability_status: candidate.availability_status || 'available'
                }));
                
                setCandidates(formattedCandidates);
            } catch (error) {
                setCandidates([]);
            } finally {
                setLoading(false);
            }
        };
        
        fetchCandidates();
    }, []);
    
    // 筛选候选人数据
    const filteredCandidates = useMemo(() => {
        return candidates.filter(candidate => {
            // 搜索筛选
            const matchesSearch = searchTerm === '' || 
                candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                candidate.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
                candidate.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
            
            // 工作经验筛选
            const matchesExperience = filterExperience === '全部' || 
                (filterExperience === '应届' && candidate.work_experience_years === 0) ||
                (filterExperience === '1-3年' && candidate.work_experience_years >= 1 && candidate.work_experience_years < 3) ||
                (filterExperience === '3-5年' && candidate.work_experience_years >= 3 && candidate.work_experience_years < 5) ||
                (filterExperience === '5-10年' && candidate.work_experience_years >= 5 && candidate.work_experience_years < 10) ||
                (filterExperience === '10年以上' && candidate.work_experience_years >= 10);
            
            // 求职状态筛选
            const matchesJobStatus = filterJobStatus === '全部' || candidate.job_status === filterJobStatus;
            
            // 薪资是否可谈筛选
            const matchesSalaryNegotiable = filterSalaryNegotiable === '全部' || 
                (filterSalaryNegotiable === '是' && candidate.salary_negotiable) ||
                (filterSalaryNegotiable === '否' && !candidate.salary_negotiable);
            
            // 可用状态筛选
            const matchesAvailability = filterAvailability === '全部' || candidate.availability_status === filterAvailability;
            
            return matchesSearch && matchesExperience && matchesJobStatus && matchesSalaryNegotiable && matchesAvailability;
        });
    }, [candidates, searchTerm, filterExperience, filterJobStatus, filterSalaryNegotiable, filterAvailability]);
    
    // 计算分页数据
    const paginatedCandidates = useMemo(() => {
        setTotalItems(filteredCandidates.length);
        const startIndex = (currentPage - 1) * pageSize;
        return filteredCandidates.slice(startIndex, startIndex + pageSize);
    }, [filteredCandidates, currentPage, pageSize]);
    
    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                    {/* 搜索和导出 */}
                    <div className="flex flex-wrap gap-4 justify-between items-center mb-4">
                        <div className="flex gap-2 items-center w-full md:w-auto">
                            <Search className="text-slate-400 w-5 h-5" />
                            <input 
                                type="text" 
                                placeholder="搜索候选人姓名、职位或技能..." 
                                value={searchTerm} 
                                onChange={e => setSearchTerm(e.target.value)} 
                                className="bg-transparent focus:outline-none text-sm w-full md:w-64"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="text-slate-400 hover:text-slate-600 transition-colors"
                                    title="清除搜索"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => exportToCSV(filteredCandidates, 'candidates')}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white text-sm font-medium rounded-lg hover:bg-slate-900 transition-all"
                                disabled={loading}
                            >
                                <Download size={16}/> 导出
                            </button>
                        </div>
                    </div>
                    
                    {/* 筛选条件 */}
                    <div className="flex flex-wrap gap-4 items-center">
                        {/* 工作经验 */}
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">工作经验:</label>
                            <select 
                                value={filterExperience}
                                onChange={e => setFilterExperience(e.target.value)}
                                className="text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                            >
                                {experienceOptions.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        </div>
                        
                        {/* 求职状态 */}
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">求职状态:</label>
                            <select 
                                value={filterJobStatus}
                                onChange={e => setFilterJobStatus(e.target.value)}
                                className="text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                            >
                                {jobStatusOptions.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        </div>
                        
                        {/* 薪资是否可谈 */}
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">薪资可谈:</label>
                            <select 
                                value={filterSalaryNegotiable}
                                onChange={e => setFilterSalaryNegotiable(e.target.value)}
                                className="text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                            >
                                {salaryNegotiableOptions.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        </div>
                        
                        {/* 可用状态 */}
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">可用状态:</label>
                            <select 
                                value={filterAvailability}
                                onChange={e => setFilterAvailability(e.target.value)}
                                className="text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                            >
                                {availabilityOptions.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        </div>
                        
                        {/* 清除筛选 */}
                        <button
                            onClick={() => {
                                setFilterExperience('全部');
                                setFilterJobStatus('全部');
                                setFilterSalaryNegotiable('全部');
                                setFilterAvailability('全部');
                            }}
                            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                        >
                            清除筛选
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
                            <tr>
                                <th className="px-6 py-3 text-left">{t.name}</th>
                                <th className="px-6 py-3 text-left">{t.role}</th>
                                <th className="px-6 py-3 text-left">{t.exp}</th>
                                <th className="px-6 py-3 text-left">{t.status}</th>
                                <th className="px-6 py-3 text-left">{t.skills}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                        加载中...
                                    </td>
                                </tr>
                            ) : filteredCandidates.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                        没有找到匹配的候选人
                                    </td>
                                </tr>
                            ) : (
                                paginatedCandidates.map(c => (
                                    <tr key={c.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600/50">
                                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{c.name}</td>
                                        <td className="px-6 py-4">{c.role}</td>
                                        <td className="px-6 py-4">{c.experience}</td>
                                        <td className="px-6 py-4">{c.status}</td>
                                        <td className="px-6 py-4 max-w-xs truncate">{c.skills.join(', ')}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                
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
            </div>
        </div>
    );
};

export default CandidatesView;