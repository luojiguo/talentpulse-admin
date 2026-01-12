import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Download, Filter, Settings, Check } from 'lucide-react';
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

    // Click outside handler for column settings popover
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

    // 将英文阶段转换为中文
    const getStageText = (stage: string) => {
        switch (stage) {
            case 'New': return '新申请';
            case 'pending': return '待处理';
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
            case 'New':
            case 'pending':
            case '新申请':
            case '待处理':
                return 'bg-blue-100 text-blue-700';
            case 'Applied':
            case '已申请':
                return 'bg-sky-100 text-sky-700';
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
    useEffect(() => {
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
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row gap-4 justify-between items-center">
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
                    <div className="flex gap-2">
                        <div className="relative" ref={settingsRef}>
                            <button
                                onClick={() => setShowColumnSettings(!showColumnSettings)}
                                className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                title="列设置"
                            >
                                <Settings size={20} />
                            </button>

                            {showColumnSettings && (
                                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 p-4">
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                        <Settings size={16} />
                                        显示/隐藏列
                                    </h4>
                                    <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                                        {Object.entries(visibleColumns).map(([key, isVisible]) => (
                                            <button
                                                key={key}
                                                onClick={() => setVisibleColumns(prev => ({ ...prev, [key]: !isVisible }))}
                                                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group"
                                            >
                                                <span className="text-sm text-slate-600 dark:text-slate-300">
                                                    {key === 'candidate' ? t.candidate :
                                                        key === 'job' ? t.job :
                                                            key === 'company' ? t.company :
                                                                key === 'stage' ? t.stage :
                                                                    key === 'score' ? '匹配度' :
                                                                        key === 'interviews' ? '面试次数' :
                                                                            key === 'email' ? '邮箱' :
                                                                                key === 'phone' ? '电话' :
                                                                                    key === 'location' ? '职位地点' :
                                                                                        key === 'salary' ? '职位薪资' :
                                                                                            key === 'date' ? t.date :
                                                                                                key === 'updated' ? t.updated : key}
                                                </span>
                                                {isVisible && <Check size={16} className="text-indigo-500" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => exportToCSV(filteredApplications, 'applications_export')}
                            className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            title="导出数据"
                        >
                            <Download size={20} />
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
                            <tr>
                                {visibleColumns.candidate && <th className="px-6 py-3 text-left">{t.candidate}</th>}
                                {visibleColumns.job && <th className="px-6 py-3 text-left">{t.job}</th>}
                                {visibleColumns.company && <th className="px-6 py-3 text-left">{t.company}</th>}
                                {visibleColumns.stage && <th className="px-6 py-3 text-left">{t.stage}</th>}
                                {visibleColumns.score && <th className="px-6 py-3 text-left text-center">匹配度</th>}
                                {visibleColumns.interviews && <th className="px-6 py-3 text-left">面试次数</th>}
                                {visibleColumns.email && <th className="px-6 py-3 text-left">邮箱</th>}
                                {visibleColumns.phone && <th className="px-6 py-3 text-left">电话</th>}
                                {visibleColumns.location && <th className="px-6 py-3 text-left">地点</th>}
                                {visibleColumns.salary && <th className="px-6 py-3 text-left">薪资</th>}
                                {visibleColumns.date && <th className="px-6 py-3 text-left">{t.date}</th>}
                                {visibleColumns.updated && <th className="px-6 py-3 text-left">{t.updated}</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={Object.values(visibleColumns).filter(Boolean).length} className="px-6 py-8 text-center text-slate-500">
                                        加载中...
                                    </td>
                                </tr>
                            ) : filteredApplications.length === 0 ? (
                                <tr>
                                    <td colSpan={Object.values(visibleColumns).filter(Boolean).length} className="px-6 py-8 text-center text-slate-500">
                                        没有找到匹配的申请
                                    </td>
                                </tr>
                            ) : (
                                paginatedApplications.map(app => (
                                    <tr key={app.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600/50">
                                        {visibleColumns.candidate && (
                                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative h-8 w-8 flex-shrink-0">
                                                        {/* Base Layer: Initials */}
                                                        <div className="h-full w-full rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold border-2 border-white dark:border-slate-800 shadow-sm text-xs">
                                                            {app.candidateName?.charAt(0)}
                                                        </div>

                                                        {/* Top Layer: Image */}
                                                        {app.candidateAvatar && (
                                                            <img
                                                                src={app.candidateAvatar.startsWith('http') ? app.candidateAvatar : `http://localhost:3001${app.candidateAvatar}`}
                                                                alt={app.candidateName}
                                                                className="absolute inset-0 h-full w-full rounded-full object-cover"
                                                                onError={(e) => {
                                                                    e.currentTarget.style.display = 'none';
                                                                }}
                                                            />
                                                        )}
                                                    </div>
                                                    <span>{app.candidateName}</span>
                                                </div>
                                            </td>
                                        )}
                                        {visibleColumns.job && <td className="px-6 py-4">{app.jobTitle}</td>}
                                        {visibleColumns.company && (
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative h-8 w-8 flex-shrink-0">
                                                        {/* Base Layer: Initials */}
                                                        <div className="h-full w-full rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold border border-white dark:border-slate-800 shadow-sm text-xs">
                                                            {app.companyName?.charAt(0) || '?'}
                                                        </div>

                                                        {/* Top Layer: Image */}
                                                        {app.companyLogo && (
                                                            <img
                                                                src={app.companyLogo.startsWith('http') ? app.companyLogo : `http://localhost:3001${app.companyLogo}`}
                                                                alt={app.companyName}
                                                                className="absolute inset-0 h-full w-full rounded object-cover"
                                                                onError={(e) => {
                                                                    e.currentTarget.style.display = 'none';
                                                                }}
                                                            />
                                                        )}
                                                    </div>
                                                    <span>{app.companyName}</span>
                                                </div>
                                            </td>
                                        )}
                                        {visibleColumns.stage && (
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStageColor(app.stage)}`}>
                                                    {getStageText(app.stage)}
                                                </span>
                                            </td>
                                        )}
                                        {visibleColumns.score && (
                                            <td className="px-6 py-4 text-center">
                                                {(() => {
                                                    // 如果没有匹配度，使用招聘者端的 Mock 逻辑（70-100%）
                                                    const score = app.matchScore || (Math.floor((app.id % 30)) + 70);
                                                    return (
                                                        <div className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${score >= 80 ? 'bg-green-100 text-green-700' :
                                                            score >= 60 ? 'bg-blue-100 text-blue-700' :
                                                                'bg-slate-100 text-slate-600'
                                                            }`}>
                                                            {score}%
                                                        </div>
                                                    );
                                                })()}
                                            </td>
                                        )}
                                        {visibleColumns.interviews && <td className="px-6 py-4">{app.interviewCount || 0}</td>}
                                        {visibleColumns.email && <td className="px-6 py-4 text-slate-500">{app.candidateEmail || '-'}</td>}
                                        {visibleColumns.phone && <td className="px-6 py-4 text-slate-500">{app.candidatePhone || '-'}</td>}
                                        {visibleColumns.location && <td className="px-6 py-4 text-slate-500">{app.jobLocation || '-'}</td>}
                                        {visibleColumns.salary && <td className="px-6 py-4 text-slate-600 font-medium">{app.jobSalary || '-'}</td>}
                                        {visibleColumns.date && <td className="px-6 py-4 text-slate-400">{new Date(app.appliedDate).toLocaleDateString()}</td>}
                                        {visibleColumns.updated && <td className="px-6 py-4 text-slate-400">{app.updatedDate ? new Date(app.updatedDate).toLocaleDateString() : '-'}</td>}
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

export default ApplicationsView;