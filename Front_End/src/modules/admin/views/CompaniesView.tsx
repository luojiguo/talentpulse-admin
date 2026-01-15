import React, { useState, useMemo } from 'react';
import { Search, Filter, X, Download, CheckCircle, Ban, Eye, Copy } from 'lucide-react';
import { message, Tooltip } from 'antd';
import { TRANSLATIONS } from '@/constants/constants';
import { companyAPI } from '@/services/apiService';
import { Company, Language } from '@/types/types';
import Pagination from '@/components/Pagination';
import { exportToCSV } from '../helpers';

const CompaniesView: React.FC<{ lang: Language }> = ({ lang }) => {
    const t = TRANSLATIONS[lang].companies;
    const common = TRANSLATIONS[lang].common;
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterIndustry, setFilterIndustry] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterSize, setFilterSize] = useState('all');
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
    const [companyDetails, setCompanyDetails] = useState<any>(null);
    const [detailsLoading, setDetailsLoading] = useState(false);

    // 列配置状态
    const [visibleColumns, setVisibleColumns] = useState({
        name: true,
        industry: true,
        location: true,
        hrCount: true,
        jobCount: true,
        status: true,
        createdAt: true,
        action: true
    });

    // 列显示/隐藏弹窗状态
    const [showColumnModal, setShowColumnModal] = useState(false);

    // 分页状态
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    // 从API获取公司数据
    React.useEffect(() => {
        const fetchCompanies = async () => {
            try {
                setLoading(true);
                const response = await companyAPI.getAllCompanies({
                    search: searchTerm,
                    industry: filterIndustry,
                    status: filterStatus,
                    size: filterSize
                });
                // 将数据库返回的公司数据转换为前端所需的格式
                const formattedCompanies: Company[] = response.data.map((company: any) => ({
                    id: company.id,
                    name: company.name,
                    industry: company.industry || '',
                    size: company.size || '',
                    logo: company.logo || '🏢',
                    status: company.is_verified ? 'Verified' : (company.status === 'active' ? 'Pending' : 'Rejected'),
                    location: company.address || '',
                    hrCount: company.hr_count || 0,
                    jobCount: company.job_count || 0,
                    createdAt: new Date(company.created_at).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US')
                }));
                setCompanies(formattedCompanies);
            } catch (error) {
                console.error('获取公司数据失败:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCompanies();
    }, [searchTerm, filterIndustry, filterStatus, filterSize, lang]);

    // 获取企业详情
    const fetchCompanyDetails = async (companyId: number | string) => {
        try {
            setDetailsLoading(true);
            const response = await companyAPI.getCompanyDetails(companyId);
            // Flatten the response data to match state expectation
            if (response.data && response.data.company) {
                setCompanyDetails({
                    ...response.data.company,
                    verified_recruiters: response.data.verified_recruiters,
                    job_cities: response.data.job_cities,
                    recruiters_count: response.data.recruiters_count,
                    jobs_count: response.data.jobs_count
                });
            } else {
                setCompanyDetails(response.data);
            }
        } catch (error) {
            console.error('获取企业详情失败:', error);
        } finally {
            setDetailsLoading(false);
        }
    };

    // 获取所有行业选项
    const industryOptions = useMemo(() => {
        const industries = [...new Set(companies.map(company => company.industry).filter(Boolean))];
        return ['all', ...industries];
    }, [companies]);

    // 获取所有规模选项
    const sizeOptions = useMemo(() => {
        const sizes = [...new Set(companies.map(company => company.size).filter(Boolean))];
        return ['all', ...sizes];
    }, [companies]);

    // 筛选公司数据
    const filteredCompanies = useMemo(() => {
        return companies.filter(company =>
            (searchTerm === '' || company.name.toLowerCase().includes(searchTerm.toLowerCase()) || company.location.toLowerCase().includes(searchTerm.toLowerCase())) &&
            (filterIndustry === 'all' || company.industry === filterIndustry) &&
            (filterStatus === 'all' || company.status === filterStatus) &&
            (filterSize === 'all' || company.size === filterSize)
        );
    }, [companies, searchTerm, filterIndustry, filterStatus, filterSize]);

    // 计算分页数据
    const paginatedCompanies = useMemo(() => {
        setTotalItems(filteredCompanies.length);
        const startIndex = (currentPage - 1) * pageSize;
        return filteredCompanies.slice(startIndex, startIndex + pageSize);
    }, [filteredCompanies, currentPage, pageSize]);

    // 监听选中企业变化
    React.useEffect(() => {
        if (selectedCompany) {
            fetchCompanyDetails(selectedCompany.id);
        }
    }, [selectedCompany]);

    const handleVerifyCompany = async (companyId: number | string, isVerified: boolean) => {
        try {
            await companyAPI.updateCompanyVerifyStatus(companyId, isVerified);
            message.success(`${t.title === 'Registered Companies' ? 'Company has been ' : '企业已'}${isVerified ? (t.title === 'Registered Companies' ? 'Approved' : '通过审核') : (t.title === 'Registered Companies' ? 'Rejected' : '拒绝')}`);

            // Update local state
            setCompanies(prev => prev.map(c => {
                if (c.id === companyId) {
                    return { ...c, status: isVerified ? 'Verified' : 'Rejected' };
                }
                return c;
            }));

            if (selectedCompany?.id === companyId) {
                const newStatus = isVerified ? 'Verified' : 'Rejected';
                setSelectedCompany(prev => prev ? { ...prev, status: newStatus } : null);

                // Also update details if open
                if (companyDetails) {
                    setCompanyDetails((prev: any) => ({
                        ...prev,
                        is_verified: isVerified,
                        status: isVerified ? 'active' : 'inactive'
                    }));
                }
            }
        } catch (error) {
            console.error('审核企业失败:', error);
            message.error(lang === 'zh' ? '操作失败，请重试' : 'Operation failed, please try again');
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'Verified': return t.verified;
            case 'Pending': return t.pending;
            case 'Rejected': return t.rejected;
            default: return status;
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                {/* 筛选栏 */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="flex gap-2 items-center w-full md:w-auto">
                        <Search className="text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder={lang === 'zh' ? "搜索公司名称或地点..." : "Search name or location..."}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="bg-transparent focus:outline-none text-sm w-full md:w-64 dark:text-white"
                        />
                    </div>
                    <div className="flex flex-wrap gap-4 w-full md:w-auto">
                        <select
                            value={filterIndustry}
                            onChange={e => setFilterIndustry(e.target.value)}
                            className="bg-slate-100 dark:bg-slate-700 border-none rounded-lg text-sm px-4 py-2 w-full md:w-auto focus:ring-2 focus:ring-blue-500 dark:text-white"
                        >
                            <option value="all">{common.all + t.industry}</option>
                            {industryOptions.filter(o => o !== 'all').map(industry => (
                                <option key={industry} value={industry}>{industry}</option>
                            ))}
                        </select>
                        <select
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value)}
                            className="bg-slate-100 dark:bg-slate-700 border-none rounded-lg text-sm px-4 py-2 w-full md:w-auto focus:ring-2 focus:ring-blue-500 dark:text-white"
                        >
                            <option value="all">{common.all + t.status}</option>
                            <option value="Verified">{t.verified}</option>
                            <option value="Pending">{t.pending}</option>
                            <option value="Rejected">{t.rejected}</option>
                        </select>
                        <select
                            value={filterSize}
                            onChange={e => setFilterSize(e.target.value)}
                            className="bg-slate-100 dark:bg-slate-700 border-none rounded-lg text-sm px-4 py-2 w-full md:w-auto focus:ring-2 focus:ring-blue-500 dark:text-white"
                        >
                            <option value="all">{common.all + t.size}</option>
                            {sizeOptions.filter(o => o !== 'all').map(size => (
                                <option key={size} value={size}>{size}</option>
                            ))}
                        </select>
                        {/* 导出按钮 */}
                        <button
                            onClick={() => exportToCSV(filteredCompanies, 'companies')}
                            className="bg-slate-700 text-white border-none rounded-lg text-sm px-4 py-2 focus:ring-2 focus:ring-blue-500 flex items-center gap-2 hover:bg-slate-900 transition-all dark:bg-slate-600 dark:hover:bg-slate-500"
                        >
                            <Download size={16} />
                            <span>{common.export}</span>
                        </button>
                        {/* 列显示/隐藏控制按钮 */}
                        <button
                            onClick={() => setShowColumnModal(true)}
                            className="bg-slate-100 dark:bg-slate-700 border-none rounded-lg text-sm px-4 py-2 focus:ring-2 focus:ring-blue-500 flex items-center gap-2 dark:text-white"
                        >
                            <Filter size={16} className="text-slate-500" />
                            <span>{lang === 'zh' ? '列设置' : 'Columns'}</span>
                        </button>
                    </div>
                </div>
                {/* 公司列表 */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
                            <tr>
                                {visibleColumns.name && <th className="px-6 py-3 text-left">{t.name}</th>}
                                {visibleColumns.industry && <th className="px-6 py-3 text-left">{t.industry}</th>}
                                {visibleColumns.location && <th className="px-6 py-3 text-left">{t.location}</th>}
                                {visibleColumns.hrCount && <th className="px-6 py-3 text-left">{t.hrCount}</th>}
                                {visibleColumns.jobCount && <th className="px-6 py-3 text-left">{t.jobs}</th>}
                                {visibleColumns.status && <th className="px-6 py-3 text-left">{t.status}</th>}
                                {visibleColumns.createdAt && <th className="px-6 py-3 text-left">{t.createdAt}</th>}
                                {visibleColumns.action && <th className="px-6 py-3 text-left">{t.action}</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={Object.keys(visibleColumns).length} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                                        {common.loading}
                                    </td>
                                </tr>
                            ) : filteredCompanies.length === 0 ? (
                                <tr>
                                    <td colSpan={Object.keys(visibleColumns).length} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                                        {lang === 'zh' ? '没有找到匹配的公司' : 'No companies found'}
                                    </td>
                                </tr>
                            ) : (
                                paginatedCompanies.map(company => (
                                    <tr key={company.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                        {visibleColumns.name && (
                                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative h-10 w-10 flex-shrink-0">
                                                        {/* Base Layer: Initials */}
                                                        <div className="h-full w-full rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold border-2 border-white dark:border-slate-800 shadow-sm">
                                                            {company.name.charAt(0)}
                                                        </div>

                                                        {/* Top Layer: Image */}
                                                        {company.logo && company.logo !== '🏢' && (
                                                            <img
                                                                src={company.logo.startsWith('http') ? company.logo : `http://localhost:8001${company.logo}`}
                                                                alt={company.name}
                                                                className="absolute inset-0 h-full w-full rounded-lg object-cover"
                                                                onError={(e) => {
                                                                    e.currentTarget.style.display = 'none';
                                                                }}
                                                            />
                                                        )}
                                                    </div>
                                                    <Tooltip title={company.name}>
                                                        <span
                                                            className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors truncate max-w-[150px] inline-block"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigator.clipboard.writeText(company.name);
                                                                message.success(t.copySuccessName);
                                                            }}
                                                        >
                                                            {company.name}
                                                        </span>
                                                    </Tooltip>
                                                </div>
                                            </td>
                                        )}
                                        {visibleColumns.industry && <td className="px-6 py-4 dark:text-slate-400">{company.industry}</td>}
                                        {visibleColumns.location && (
                                            <td className="px-6 py-4 dark:text-slate-400">
                                                <Tooltip title={company.location}>
                                                    <span
                                                        className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors truncate max-w-[120px] inline-block"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigator.clipboard.writeText(company.location);
                                                            message.success(t.copySuccessLocation);
                                                        }}
                                                    >
                                                        {company.location}
                                                    </span>
                                                </Tooltip>
                                            </td>
                                        )}
                                        {visibleColumns.hrCount && <td className="px-6 py-4 dark:text-slate-400">{company.hrCount}</td>}
                                        {visibleColumns.jobCount && <td className="px-6 py-4 dark:text-slate-400">{company.jobCount}</td>}
                                        {visibleColumns.status && <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${company.status === 'Verified' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' :
                                                company.status === 'Pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300' :
                                                    'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                                                }`}>
                                                {getStatusLabel(company.status)}
                                            </span>
                                        </td>}
                                        {visibleColumns.createdAt && <td className="px-6 py-4 dark:text-slate-400">{company.createdAt}</td>}
                                        {visibleColumns.action && <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    className="p-1 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded transition-colors"
                                                    onClick={() => setSelectedCompany(company)}
                                                    title={t.viewDetails}
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                {company.status === 'Pending' && (
                                                    <>
                                                        <button
                                                            className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/40 rounded transition-colors"
                                                            onClick={(e) => { e.stopPropagation(); handleVerifyCompany(company.id, true); }}
                                                            title={t.pass}
                                                        >
                                                            <CheckCircle size={16} />
                                                        </button>
                                                        <button
                                                            className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 rounded transition-colors"
                                                            onClick={(e) => { e.stopPropagation(); handleVerifyCompany(company.id, false); }}
                                                            title={t.reject}
                                                        >
                                                            <Ban size={16} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>}
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
            {/* 列显示/隐藏配置弹窗 */}
            {
                showColumnModal && (
                    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowColumnModal(false)}>
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-center border-b pb-4 dark:border-slate-700 mb-4">
                                <h2 className="text-xl font-bold dark:text-white">{lang === 'zh' ? '列设置' : 'Column Settings'}</h2>
                                <button onClick={() => setShowColumnModal(false)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors dark:text-slate-400">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="space-y-3">
                                {[
                                    { key: 'name', label: t.name },
                                    { key: 'industry', label: t.industry },
                                    { key: 'location', label: t.location },
                                    { key: 'hrCount', label: t.hrCount },
                                    { key: 'jobCount', label: t.jobs },
                                    { key: 'status', label: t.status },
                                    { key: 'createdAt', label: t.createdAt },
                                    { key: 'action', label: t.action },
                                ].map((col) => (
                                    <div key={col.key} className="flex items-center justify-between group">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            {col.label}
                                        </label>
                                        <input
                                            type="checkbox"
                                            checked={(visibleColumns as any)[col.key]}
                                            onChange={(e) => setVisibleColumns(prev => ({ ...prev, [col.key]: e.target.checked }))}
                                            className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-slate-800 dark:bg-slate-700 dark:border-slate-600 cursor-pointer"
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-3 mt-6 justify-end">
                                <button
                                    onClick={() => setShowColumnModal(false)}
                                    className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-medium border border-transparent dark:border-slate-600"
                                >
                                    {common.cancel}
                                </button>
                                <button
                                    onClick={() => setShowColumnModal(false)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm hover:shadow-md"
                                >
                                    {common.save}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* 企业详情弹窗 */}
            {
                selectedCompany && (
                    <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={() => setSelectedCompany(null)}>
                        <div className="fixed top-0 right-0 h-full w-full max-w-2xl bg-white dark:bg-slate-800 shadow-2xl animate-in slide-in-from-right duration-300 p-6 flex flex-col border-l border-slate-200 dark:border-slate-700" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-center border-b pb-4 dark:border-slate-700">
                                <h2 className="text-xl font-bold dark:text-white">{lang === 'zh' ? '企业详情' : 'Company Details'}</h2>
                                <button onClick={() => setSelectedCompany(null)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors dark:text-slate-400"><X size={20} /></button>
                            </div>
                            {detailsLoading ? (
                                <div className="py-24 flex flex-col justify-center items-center gap-4">
                                    <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                                    <p className="text-slate-500 font-medium">{common.loading}</p>
                                </div>
                            ) : companyDetails ? (
                                <div className="py-6 space-y-8 overflow-y-auto flex-1 pr-2 custom-scrollbar">
                                    {/* 企业基本信息 */}
                                    <div className="bg-slate-50 dark:bg-slate-700/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm">
                                        <h3 className="text-lg font-bold dark:text-white mb-6 flex items-center gap-2">
                                            <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                                            {lang === 'zh' ? '基本信息' : 'Basic Information'}
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                                            <div className="flex items-center gap-4 md:col-span-2 border-b border-white dark:border-slate-600 pb-6 mb-2">
                                                <div className="relative h-20 w-20 flex-shrink-0">
                                                    {/* Base Layer: Initials */}
                                                    <div className="h-full w-full rounded-2xl bg-blue-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                                                        {companyDetails.name.charAt(0)}
                                                    </div>

                                                    {/* Top Layer: Image */}
                                                    {companyDetails.logo && companyDetails.logo !== '🏢' && (
                                                        <img
                                                            src={companyDetails.logo.startsWith('http') ? companyDetails.logo : `http://localhost:8001${companyDetails.logo}`}
                                                            alt={companyDetails.name}
                                                            className="absolute inset-0 h-full w-full rounded-2xl object-cover border-4 border-white dark:border-slate-700"
                                                            onError={(e) => {
                                                                e.currentTarget.style.display = 'none';
                                                            }}
                                                        />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">{t.name}</p>
                                                    <p className="font-bold text-2xl dark:text-white leading-tight">{companyDetails.name}</p>
                                                </div>
                                            </div>

                                            <div>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1 font-medium">{t.industry}</p>
                                                <p className="font-semibold text-slate-800 dark:text-slate-200">{companyDetails.industry}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1 font-medium">{t.social_credit_code}</p>
                                                <p className="font-semibold text-slate-800 dark:text-slate-200 font-mono">{companyDetails.social_credit_code || '-'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1 font-medium">{t.size}</p>
                                                <p className="font-semibold text-slate-800 dark:text-slate-200">{companyDetails.size}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1 font-medium">{t.status}</p>
                                                <span className={`px-2 py-0.5 rounded text-sm font-semibold inline-block ${companyDetails.is_verified ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' :
                                                    (companyDetails.status === 'active' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300')
                                                    }`}>
                                                    {getStatusLabel(companyDetails.is_verified ? 'Verified' : (companyDetails.status === 'active' ? 'Pending' : 'Rejected'))}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1 font-medium">{t.jobs}</p>
                                                <p className="font-semibold text-slate-800 dark:text-slate-200">{companyDetails.job_count || 0}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1 font-medium">{t.createdAt}</p>
                                                <p className="font-semibold text-slate-800 dark:text-slate-200">{new Date(companyDetails.created_at).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US')}</p>
                                            </div>
                                            <div className="md:col-span-2">
                                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1 font-medium">{t.location}</p>
                                                <p className="font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">{companyDetails.address}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 营业执照 */}
                                    {companyDetails.business_license && (
                                        <div className="bg-slate-50 dark:bg-slate-700/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm">
                                            <h3 className="text-lg font-bold dark:text-white mb-6 flex items-center gap-2">
                                                <div className="w-1.5 h-6 bg-purple-600 rounded-full"></div>
                                                {lang === 'zh' ? '营业执照' : 'Business License'}
                                            </h3>
                                            <div className="relative group w-full h-64 md:h-80 rounded-xl overflow-hidden border-2 border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 flex items-center justify-center">
                                                <img
                                                    src={companyDetails.business_license.startsWith('http') ? companyDetails.business_license : `http://localhost:8001${companyDetails.business_license}`}
                                                    alt="Business License"
                                                    className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                                                    onClick={() => window.open(companyDetails.business_license.startsWith('http') ? companyDetails.business_license : `http://localhost:8001${companyDetails.business_license}`, '_blank')}
                                                    style={{ cursor: 'pointer' }}
                                                    title={lang === 'zh' ? '点击查看大图' : 'Click to view large image'}
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                    }}
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none"></div>
                                            </div>
                                        </div>
                                    )}

                                    {/* 认证招聘者 */}
                                    {companyDetails.verified_recruiters && companyDetails.verified_recruiters.length > 0 && (
                                        <div>
                                            <h3 className="text-lg font-bold dark:text-white mb-4 flex items-center gap-2">
                                                <div className="w-1.5 h-6 bg-green-600 rounded-full"></div>
                                                {lang === 'zh' ? '招聘者成员' : 'Recruiters'}
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {companyDetails.verified_recruiters.map((recruiter: any) => (
                                                    <div key={recruiter.id} className="bg-white dark:bg-slate-700/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-900/30 transition-all group">
                                                        <div className="flex flex-col gap-4">
                                                            <div className="flex items-center gap-4">
                                                                <div className="relative h-14 w-14 flex-shrink-0">
                                                                    <div className="h-full w-full rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold border-2 border-white dark:border-slate-600 shadow-sm overflow-hidden group-hover:border-blue-200 dark:group-hover:border-blue-900/50 transition-colors">
                                                                        {recruiter.avatar && (
                                                                            <img
                                                                                src={recruiter.avatar.startsWith('http') ? recruiter.avatar : `http://localhost:8001${recruiter.avatar}`}
                                                                                alt={recruiter.name}
                                                                                className="w-full h-full object-cover"
                                                                                onError={(e) => {
                                                                                    e.currentTarget.style.display = 'none';
                                                                                }}
                                                                            />
                                                                        )}
                                                                        {(!recruiter.avatar || recruiter.avatar === '') && (
                                                                            <span className="text-xl">{recruiter.name.charAt(0).toUpperCase()}</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                                                        {recruiter.name}
                                                                        {!recruiter.is_verified && (
                                                                            <span className="px-1.5 py-0.5 bg-yellow-50 text-yellow-600 text-[10px] rounded-full border border-yellow-200 font-bold uppercase tracking-wider">
                                                                                {lang === 'zh' ? '未认证' : 'Unverified'}
                                                                            </span>
                                                                        )}
                                                                    </p>
                                                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-1 mt-0.5" title={`${recruiter.position} - ${recruiter.department}`}>
                                                                        {recruiter.position} • {recruiter.department}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex-1 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-3 py-2 rounded-lg border border-slate-100 dark:border-slate-700/50 truncate font-mono" title={recruiter.email}>
                                                                    {recruiter.email}
                                                                </div>
                                                                <button
                                                                    onClick={() => {
                                                                        navigator.clipboard.writeText(recruiter.email);
                                                                        message.success(t.copySuccessEmail);
                                                                    }}
                                                                    className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all border border-slate-100 dark:border-slate-700/50 bg-white dark:bg-slate-800/50 shadow-sm active:scale-95"
                                                                    title={lang === 'zh' ? '复制邮箱' : 'Copy Email'}
                                                                    type="button"
                                                                >
                                                                    <Copy size={16} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* 职位城市分布 */}
                                    {companyDetails.job_cities && companyDetails.job_cities.length > 0 && (
                                        <div>
                                            <h3 className="text-lg font-bold dark:text-white mb-4 flex items-center gap-2">
                                                <div className="w-1.5 h-6 bg-orange-500 rounded-full"></div>
                                                {lang === 'zh' ? '职位城市分布' : 'Job Cities Distribution'}
                                            </h3>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                {companyDetails.job_cities.map((city: any) => (
                                                    <div key={city.location} className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-2xl text-center border border-slate-100 dark:border-slate-700/50 shadow-sm hover:translate-y-[-2px] transition-transform">
                                                        <p className="font-bold text-slate-800 dark:text-white">{city.location}</p>
                                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">{city.count} {lang === 'zh' ? '个职位' : 'jobs'}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="py-24 text-center">
                                    <p className="text-slate-500 dark:text-slate-400 font-medium">{t.noDetails}</p>
                                </div>
                            )}

                            {/* 审核操作区 */}
                            {(!companyDetails?.is_verified && companyDetails?.status === 'active') && (
                                <div className="mt-auto pt-6 border-t border-slate-200 dark:border-slate-700 pb-2">
                                    <h3 className="text-lg font-bold dark:text-white mb-4 flex items-center gap-2">
                                        <div className="w-4 h-4 bg-yellow-500 rounded-full animate-pulse"></div>
                                        {t.audit}
                                    </h3>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => handleVerifyCompany(selectedCompany.id, true)}
                                            className="flex-1 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white py-3.5 px-6 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-200 dark:shadow-none hover:translate-y-[-2px]"
                                        >
                                            <CheckCircle size={20} />
                                            {t.pass}
                                        </button>
                                        <button
                                            onClick={() => handleVerifyCompany(selectedCompany.id, false)}
                                            className="flex-1 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white py-3.5 px-6 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-200 dark:shadow-none hover:translate-y-[-2px]"
                                        >
                                            <Ban size={20} />
                                            {t.reject}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default CompaniesView;