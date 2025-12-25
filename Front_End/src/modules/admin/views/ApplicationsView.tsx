import React, { useState, useEffect, useMemo } from 'react';
import { Search, Download, Filter } from 'lucide-react';
import { TRANSLATIONS } from '@/constants/constants';
import { applicationAPI } from '@/services/apiService';
import { Application, Language } from '@/types/types';
import Pagination from '@/components/Pagination';
import { exportToCSV } from '../helpers';
const ApplicationsView: React.FC<{ lang: Language }> = ({ lang }) => {
    const t = TRANSLATIONS[lang].applications;
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // 分页状态
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    // 将英文阶段转换为中文
    const getStageText = (stage: string) => {
        switch (stage) {
            case 'Applied': return '已申请';
            case 'Screening': return '筛选中';
            case 'Interview': return '面试中';
            case 'Offer': return '已发Offer';
            case 'Hired': return '已录用';
            case 'Rejected': return '已拒绝';
            default: return stage;
        }
    };

    // 获取阶段颜色
    const getStageColor = (stage: string) => {
        switch (stage) {
            case 'Applied':
            case '已申请':
                return 'bg-blue-100 text-blue-700';
            case 'Screening':
            case '筛选中':
                return 'bg-indigo-100 text-indigo-700';
            case 'Interview':
            case '面试中':
                return 'bg-amber-100 text-amber-700';
            case 'Offer':
            case '已发Offer':
                return 'bg-purple-100 text-purple-700';
            case 'Hired':
            case '已录用':
                return 'bg-green-100 text-green-700';
            case 'Rejected':
            case '已拒绝':
                return 'bg-red-100 text-red-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    // 从API获取申请数据
    React.useEffect(() => {
        const fetchApplications = async () => {
            try {
                setLoading(true);
                const response = await applicationAPI.getAllApplications();
                setApplications((response as any).data || []);
            } catch (error) {
                console.error('获取申请数据失败:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchApplications();
    }, []);

    // 筛选申请数据
    const filteredApplications = useMemo(() => {
        return applications.filter(app =>
        (searchTerm === '' ||
            app.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.stage.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [applications, searchTerm]);
    
    // 计算分页数据
    const paginatedApplications = useMemo(() => {
        setTotalItems(filteredApplications.length);
        const startIndex = (currentPage - 1) * pageSize;
        return filteredApplications.slice(startIndex, startIndex + pageSize);
    }, [filteredApplications, currentPage, pageSize]);

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex gap-4 justify-between items-center">
                    <div className="flex gap-2 items-center w-full md:w-auto">
                        <Search className="text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="搜索候选人、职位、公司或阶段..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="bg-transparent focus:outline-none text-sm w-full md:w-64"
                        />
                    </div>
                </div>
                <table className="w-full text-sm">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
                        <tr>
                            <th className="px-6 py-3 text-left">{t.candidate}</th>
                            <th className="px-6 py-3 text-left">{t.job}</th>
                            <th className="px-6 py-3 text-left">{t.company}</th>
                            <th className="px-6 py-3 text-left">{t.stage}</th>
                            <th className="px-6 py-3 text-left">{t.date}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                    加载中...
                                </td>
                            </tr>
                        ) : filteredApplications.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                    没有找到匹配的申请
                                </td>
                            </tr>
                        ) : (
                            paginatedApplications.map(app => (
                                <tr key={app.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600/50">
                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{app.candidateName}</td>
                                    <td className="px-6 py-4">{app.jobTitle}</td>
                                    <td className="px-6 py-4">{app.companyName}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStageColor(app.stage)}`}>
                                            {getStageText(app.stage)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">{new Date(app.appliedDate).toLocaleDateString()}</td>
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
            </div>
        </div>
    );
};

export default ApplicationsView;