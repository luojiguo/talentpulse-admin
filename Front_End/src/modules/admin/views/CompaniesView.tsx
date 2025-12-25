import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, X, Download } from 'lucide-react';
import { TRANSLATIONS } from '@/constants/constants';
import { companyAPI } from '@/services/apiService';
import { Company, Language } from '@/types/types';
import Pagination from '@/components/Pagination';
import { exportToCSV } from '../helpers';

const CompaniesView: React.FC<{ lang: Language }> = ({ lang }) => {
    const t = TRANSLATIONS[lang].companies;
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
                    status: company.is_verified ? '已验证' : company.status === 'active' ? '待审核' : '已拒绝',
                    location: company.address || '',
                    hrCount: 0, // 数据库中没有这个字段，暂时设为0
                    jobCount: company.job_count || 0,
                    createdAt: new Date(company.created_at).toLocaleDateString()
                }));
                setCompanies(formattedCompanies);
            } catch (error) {
                console.error('获取公司数据失败:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCompanies();
   }, [searchTerm, filterIndustry, filterStatus, filterSize]);

    // 获取企业详情
    const fetchCompanyDetails = async (companyId: number | string) => {
        try {
            setDetailsLoading(true);
            const response = await companyAPI.getCompanyById(companyId);
            setCompanyDetails(response.data);
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

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                {/* 筛选栏 */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="flex gap-2 items-center w-full md:w-auto">
                        <Search className="text-slate-400 w-5 h-5" />
                        <input 
                            type="text" 
                            placeholder="搜索公司名称或地点..." 
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)} 
                            className="bg-transparent focus:outline-none text-sm w-full md:w-64"
                        />
                    </div>
                    <div className="flex flex-wrap gap-4 w-full md:w-auto">
                        <select 
                            value={filterIndustry} 
                            onChange={e => setFilterIndustry(e.target.value)} 
                            className="bg-slate-100 dark:bg-slate-700 border-none rounded-lg text-sm px-4 py-2 w-full md:w-auto focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">所有行业</option>
                            {industryOptions.map(industry => (
                                <option key={industry} value={industry}>{industry}</option>
                            ))}
                        </select>
                        <select 
                            value={filterStatus} 
                            onChange={e => setFilterStatus(e.target.value)} 
                            className="bg-slate-100 dark:bg-slate-700 border-none rounded-lg text-sm px-4 py-2 w-full md:w-auto focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">所有状态</option>
                            <option value="Verified">已验证</option>
                            <option value="Pending">待审核</option>
                            <option value="Rejected">已拒绝</option>
                        </select>
                        <select 
                            value={filterSize} 
                            onChange={e => setFilterSize(e.target.value)} 
                            className="bg-slate-100 dark:bg-slate-700 border-none rounded-lg text-sm px-4 py-2 w-full md:w-auto focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">所有规模</option>
                            {sizeOptions.map(size => (
                                <option key={size} value={size}>{size}</option>
                            ))}
                        </select>
                        {/* 导出按钮 */}
                        <button 
                            onClick={() => exportToCSV(filteredCompanies, 'companies')}
                            className="bg-slate-700 text-white border-none rounded-lg text-sm px-4 py-2 focus:ring-2 focus:ring-blue-500 flex items-center gap-2 hover:bg-slate-900 transition-all"
                        >
                            <Download size={16} />
                            <span>导出</span>
                        </button>
                        {/* 列显示/隐藏控制按钮 */}
                        <button 
                            onClick={() => setShowColumnModal(true)}
                            className="bg-slate-100 dark:bg-slate-700 border-none rounded-lg text-sm px-4 py-2 focus:ring-2 focus:ring-blue-500 flex items-center gap-2"
                        >
                            <Filter size={16} className="text-slate-500" />
                            <span>列设置</span>
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
                                {visibleColumns.hrCount && <th className="px-6 py-3 text-left">HR人数</th>}
                                {visibleColumns.jobCount && <th className="px-6 py-3 text-left">{t.jobs}</th>}
                                {visibleColumns.status && <th className="px-6 py-3 text-left">{t.status}</th>}
                                {visibleColumns.createdAt && <th className="px-6 py-3 text-left">创建时间</th>}
                                {visibleColumns.action && <th className="px-6 py-3 text-left">{t.action}</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={Object.keys(visibleColumns).length} className="px-6 py-8 text-center text-slate-500">
                                        加载中...
                                    </td>
                                </tr>
                            ) : filteredCompanies.length === 0 ? (
                                <tr>
                                    <td colSpan={Object.keys(visibleColumns).length} className="px-6 py-8 text-center text-slate-500">
                                        没有找到匹配的公司
                                    </td>
                                </tr>
                            ) : (
                                paginatedCompanies.map(company => (
                                     <tr key={company.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600/50">
                                        {visibleColumns.name && <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{company.name}</td>}
                                        {visibleColumns.industry && <td className="px-6 py-4">{company.industry}</td>}
                                        {visibleColumns.location && <td className="px-6 py-4">{company.location}</td>}
                                        {visibleColumns.hrCount && <td className="px-6 py-4">{company.hrCount}</td>}
                                        {visibleColumns.jobCount && <td className="px-6 py-4">{company.jobCount}</td>}
                                        {visibleColumns.status && <td className="px-6 py-4">{company.status}</td>}
                                        {visibleColumns.createdAt && <td className="px-6 py-4">{company.createdAt}</td>}
                                        {visibleColumns.action && <td className="px-6 py-4">
                                            <button className="font-medium text-blue-600 dark:text-blue-500 hover:underline" onClick={() => setSelectedCompany(company)}>查看</button>
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
            {showColumnModal && (
                <div className="fixed inset-0 bg-black/30 z-50" onClick={() => setShowColumnModal(false)}>
                    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center border-b pb-4 dark:border-slate-700 mb-4">
                            <h2 className="text-xl font-bold dark:text-white">列设置</h2>
                            <button onClick={() => setShowColumnModal(false)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><X size={20}/></button>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">公司名称</label>
                                <input 
                                    type="checkbox" 
                                    checked={visibleColumns.name} 
                                    onChange={(e) => setVisibleColumns(prev => ({...prev, name: e.target.checked}))}
                                    className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-slate-800 dark:bg-slate-700 dark:border-slate-600"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">行业</label>
                                <input 
                                    type="checkbox" 
                                    checked={visibleColumns.industry} 
                                    onChange={(e) => setVisibleColumns(prev => ({...prev, industry: e.target.checked}))}
                                    className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-slate-800 dark:bg-slate-700 dark:border-slate-600"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">地点</label>
                                <input 
                                    type="checkbox" 
                                    checked={visibleColumns.location} 
                                    onChange={(e) => setVisibleColumns(prev => ({...prev, location: e.target.checked}))}
                                    className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-slate-800 dark:bg-slate-700 dark:border-slate-600"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">HR人数</label>
                                <input 
                                    type="checkbox" 
                                    checked={visibleColumns.hrCount} 
                                    onChange={(e) => setVisibleColumns(prev => ({...prev, hrCount: e.target.checked}))}
                                    className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-slate-800 dark:bg-slate-700 dark:border-slate-600"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">职位数量</label>
                                <input 
                                    type="checkbox" 
                                    checked={visibleColumns.jobCount} 
                                    onChange={(e) => setVisibleColumns(prev => ({...prev, jobCount: e.target.checked}))}
                                    className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-slate-800 dark:bg-slate-700 dark:border-slate-600"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">状态</label>
                                <input 
                                    type="checkbox" 
                                    checked={visibleColumns.status} 
                                    onChange={(e) => setVisibleColumns(prev => ({...prev, status: e.target.checked}))}
                                    className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-slate-800 dark:bg-slate-700 dark:border-slate-600"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">创建时间</label>
                                <input 
                                    type="checkbox" 
                                    checked={visibleColumns.createdAt} 
                                    onChange={(e) => setVisibleColumns(prev => ({...prev, createdAt: e.target.checked}))}
                                    className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-slate-800 dark:bg-slate-700 dark:border-slate-600"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">操作</label>
                                <input 
                                    type="checkbox" 
                                    checked={visibleColumns.action} 
                                    onChange={(e) => setVisibleColumns(prev => ({...prev, action: e.target.checked}))}
                                    className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-slate-800 dark:bg-slate-700 dark:border-slate-600"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6 justify-end">
                            <button 
                                onClick={() => setShowColumnModal(false)}
                                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                            >
                                取消
                            </button>
                            <button 
                                onClick={() => {
                                    setShowColumnModal(false);
                                }}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                保存
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* 企业详情弹窗 */}
            {selectedCompany && (
                <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setSelectedCompany(null)}>
                    <div className="fixed top-0 right-0 h-full w-full max-w-2xl bg-white dark:bg-slate-800 shadow-2xl animate-in slide-in-from-right-1/4 duration-300 p-6 flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center border-b pb-4 dark:border-slate-700">
                            <h2 className="text-xl font-bold dark:text-white">{t.title === '入驻企业库' ? '企业详情' : 'Company Details'}</h2>
                            <button onClick={() => setSelectedCompany(null)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><X size={20}/></button>
                        </div>
                        {detailsLoading ? (
                            <div className="py-12 flex justify-center items-center">
                                <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                            </div>
                        ) : companyDetails ? (
                            <div className="py-6 space-y-6 overflow-y-auto flex-1">
                                {/* 企业基本信息 */}
                                <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
                                    <h3 className="text-lg font-semibold dark:text-white mb-3">{t.title === '入驻企业库' ? '基本信息' : 'Basic Information'}</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">{t.name}</p>
                                            <p className="font-medium dark:text-white">{companyDetails.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">{t.industry}</p>
                                            <p className="font-medium dark:text-white">{companyDetails.industry}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">{t.size}</p>
                                            <p className="font-medium dark:text-white">{companyDetails.size}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">{t.status}</p>
                                            <p className="font-medium dark:text-white">{companyDetails.is_verified ? (t.title === '入驻企业库' ? '已验证' : 'Verified') : (companyDetails.status === 'active' ? (t.title === '入驻企业库' ? '待审核' : 'Pending') : (t.title === '入驻企业库' ? '已拒绝' : 'Rejected'))}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">{t.location}</p>
                                            <p className="font-medium dark:text-white">{companyDetails.address}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">{t.jobs}</p>
                                            <p className="font-medium dark:text-white">{companyDetails.job_count || 0}</p>
                                        </div>
                                        <div className="md:col-span-2">
                                            <p className="text-sm text-slate-500 dark:text-slate-400">{t.title === '入驻企业库' ? '创建时间' : 'Created At'}</p>
                                            <p className="font-medium dark:text-white">{new Date(companyDetails.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* 认证招聘者 */}
                                {companyDetails.verified_recruiters && companyDetails.verified_recruiters.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-semibold dark:text-white mb-3">{t.title === '入驻企业库' ? '认证招聘者' : 'Verified Recruiters'}</h3>
                                        <div className="space-y-3">
                                            {companyDetails.verified_recruiters.map((recruiter: any) => (
                                                <div key={recruiter.id} className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="font-medium dark:text-white">{recruiter.name}</p>
                                                            <p className="text-sm text-slate-500 dark:text-slate-400">{recruiter.position} - {recruiter.department}</p>
                                                        </div>
                                                        <p className="text-sm text-slate-500 dark:text-slate-400">{recruiter.email}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {/* 职位城市分布 */}
                                {companyDetails.job_cities && companyDetails.job_cities.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-semibold dark:text-white mb-3">{t.title === '入驻企业库' ? '职位城市分布' : 'Job Cities Distribution'}</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {companyDetails.job_cities.map((city: any) => (
                                                <div key={city.location} className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg text-center">
                                                    <p className="font-medium dark:text-white">{city.location}</p>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400">{city.count} {t.title === '入驻企业库' ? '个职位' : 'jobs'}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="py-12 text-center">
                                <p className="text-slate-500 dark:text-slate-400">{t.title === '入驻企业库' ? '未找到企业详情' : 'Company details not found'}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompaniesView;