import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Download, Settings, Check, Briefcase, User, Filter, Eye } from 'lucide-react';
import { TRANSLATIONS } from '@/constants/constants';
import { candidateAPI } from '@/services/apiService';
import { Candidate, Language } from '@/types/types';
import Pagination from '@/components/Pagination';
import { exportToCSV } from '../helpers';
import { AdminCandidateDetailModal } from '../components/AdminCandidateDetailModal';

// Helper functions for normalizing status values
const normalizeJobStatus = (status: string): string => {
    const map: Record<string, string> = {
        active: '在职-看机会',
        inactive: '暂无求职意向',
        hired: '已入职',
    };
    return map[status] ?? status;
};

const normalizeAvailability = (avail: string): string => {
    const map: Record<string, string> = {
        available: '随时入职',
        unavailable: '暂不考虑',
        watching: '观望中',
    };
    return map[avail] ?? avail;
};

const CandidatesView: React.FC<{ lang: Language }> = ({ lang }) => {
    const t = TRANSLATIONS[lang].candidates;
    const [candidates, setCandidates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Filter states
    const [filterExperience, setFilterExperience] = useState('全部');

    const [filterWorkMode, setFilterWorkMode] = useState('全部');
    const [filterCity, setFilterCity] = useState('全部'); // NEW
    const [filterDegree, setFilterDegree] = useState('全部'); // NEW

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    // Modal state
    const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Column visibility state
    const [showColumnSettings, setShowColumnSettings] = useState(false);
    const settingsRef = useRef<HTMLDivElement>(null);
    const [visibleColumns, setVisibleColumns] = useState({
        name: true,
        associated: true,
        internship: true,
        education: true,
        experience: true,
        status: true,
        skills: true,
        appCount: false,
        city: false,
        expectedSalary: false,
        jobType: false,
        workMode: false,
        industry: false,
        locationPref: false,
        bio: false,
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

    const parseJsonField = (field: any): string[] => {
        if (Array.isArray(field)) return field;
        if (typeof field === 'string') {
            try {
                const parsed = JSON.parse(field);
                return Array.isArray(parsed) ? parsed : [];
            } catch {
                return field.split(/[,，]/).map((s) => s.trim()).filter(Boolean);
            }
        }
        return [];
    };

    // Options derived from DB translations
    const experienceOptions = ['全部', '应届', '1-3年', '3-5年', '5-10年', '10年以上'];

    const workModeOptions = ['全部', '远程', '混合办公', '现场办公'];
    const degreeOptions = ['全部', '本科', '硕士', '博士', '大专'];

    // Dynamic city options based on loaded candidates
    const cityOptions = useMemo(() => {
        const cities = new Set(candidates.map((c) => c.city).filter((c) => c && c !== '-'));
        return ['全部', ...Array.from(cities)];
    }, [candidates]);

    // Fetch candidates from API
    useEffect(() => {
        const fetchCandidates = async () => {
            try {
                setLoading(true);
                const response = await candidateAPI.getAllCandidates();
                if (!response.data || !Array.isArray(response.data)) {
                    setCandidates([]);
                    return;
                }
                const formatted: any[] = response.data.map((candidate: any, index: number) => {
                    const parsedSkills = parseJsonField(candidate.skills);
                    const parsedJobType = parseJsonField(candidate.job_type_preference);
                    const parsedWorkMode = parseJsonField(candidate.work_mode_preference);
                    const parsedIndustry = parseJsonField(candidate.industry_preference);
                    const parsedLocationPref = parseJsonField(candidate.location_preference);

                    let salaryStr = candidate.expected_salary;
                    if (!salaryStr && candidate.expected_salary_min && candidate.expected_salary_max) {
                        salaryStr = `${Math.round(candidate.expected_salary_min / 1000)}k-${Math.round(candidate.expected_salary_max / 1000)}k`;
                    }
                    if (!salaryStr) salaryStr = '-';

                    const jobStatus = normalizeJobStatus(candidate.job_status);
                    const availability = normalizeAvailability(candidate.availability_status);

                    return {
                        id: candidate.id?.toString() || `temp-${index}`,
                        userId: candidate.user_id,
                        name: candidate.name || '未知姓名',
                        internshipRole: candidate.latest_position || 'N/A',
                        internshipCompany: candidate.latest_company || 'N/A',
                        associatedCompany: candidate.latest_application_company || '-',
                        associatedRole: candidate.latest_application_job_title || '-',
                        associatedRecruiter: candidate.latest_application_recruiter,
                        experience: candidate.work_experience_years ? `${candidate.work_experience_years}年` : '无经验',
                        education: candidate.latest_school ? `${candidate.latest_school} ${candidate.latest_degree ? `(${candidate.latest_degree})` : ''}` : 'N/A',
                        rawDegree: candidate.latest_degree || candidate.education || '',
                        email: candidate.email,
                        phone: candidate.phone,
                        status: availability,
                        location: candidate.address || '',
                        skills: parsedSkills,
                        avatar: candidate.avatar || '',
                        work_experience_years: candidate.work_experience_years || 0,
                        job_status: jobStatus,
                        salary_negotiable: candidate.salary_negotiable || false,
                        availability_status: availability,
                        latestAppCompany: candidate.latest_application_company,
                        appCount: candidate.application_count || 0,
                        bio: candidate.bio || '-',
                        expectedSalary: salaryStr,
                        city: candidate.city || '-',
                        jobType: parsedJobType.join(', ') || '-',
                        workMode: parsedWorkMode.join(', ') || '-',
                        industry: parsedIndustry.join(', ') || '-',
                        locationPref: parsedLocationPref.join(', ') || '-',
                        latest_position: candidate.latest_position,
                        latest_school: candidate.latest_school,
                        latest_degree: candidate.latest_degree,
                        summary: candidate.summary,
                    };
                });
                setCandidates(formatted);
            } catch (error) {
                console.error('Failed to fetch candidates', error);
                setCandidates([]);
            } finally {
                setLoading(false);
            }
        };
        fetchCandidates();
    }, []);

    // Filtering logic
    const filteredCandidates = useMemo(() => {
        return candidates.filter((candidate) => {
            const matchesSearch =
                searchTerm === '' ||
                candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                candidate.internshipRole.toLowerCase().includes(searchTerm.toLowerCase()) ||
                candidate.associatedCompany.toLowerCase().includes(searchTerm.toLowerCase()) ||
                candidate.skills.some((skill: string) => skill.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesExperience =
                filterExperience === '全部' ||
                (filterExperience === '应届' && candidate.work_experience_years === 0) ||
                (filterExperience === '1-3年' && candidate.work_experience_years >= 1 && candidate.work_experience_years < 3) ||
                (filterExperience === '3-5年' && candidate.work_experience_years >= 3 && candidate.work_experience_years < 5) ||
                (filterExperience === '5-10年' && candidate.work_experience_years >= 5 && candidate.work_experience_years < 10) ||
                (filterExperience === '10年以上' && candidate.work_experience_years >= 10);

            const matchesCity = filterCity === '全部' || candidate.city === filterCity;

            const matchesWorkMode = filterWorkMode === '全部' || candidate.workMode.includes(filterWorkMode);
            const matchesDegree = filterDegree === '全部' || candidate.rawDegree.includes(filterDegree);

            return (
                matchesSearch &&
                matchesExperience &&
                matchesWorkMode &&
                matchesCity &&
                matchesDegree
            );
        });
    }, [candidates, searchTerm, filterExperience, filterWorkMode, filterCity, filterDegree]);

    // Pagination
    const paginatedCandidates = useMemo(() => {
        setTotalItems(filteredCandidates.length);
        const start = (currentPage - 1) * pageSize;
        return filteredCandidates.slice(start, start + pageSize);
    }, [filteredCandidates, currentPage, pageSize]);

    const handleViewProfile = (candidate: any) => {
        setSelectedCandidate(candidate);
        setIsModalOpen(true);
    };

    const toggleColumn = (key: keyof typeof visibleColumns) => {
        setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const resetFilters = () => {
        setFilterExperience('全部');

        setFilterWorkMode('全部');
        setFilterCity('全部');
        setFilterDegree('全部');
        setSearchTerm('');
    };

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex flex-wrap gap-4 justify-between items-center mb-4">
                        <div className="flex gap-2 items-center w-full md:w-auto">
                            <Search className="text-slate-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="所搜姓名、公司、职位或技能..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-transparent focus:outline-none text-sm w-full md:w-64"
                            />
                            {searchTerm && (
                                <button onClick={() => setSearchTerm('')} className="text-slate-400 hover:text-slate-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                        <div className="flex gap-2 items-center relative">
                            <div className="relative" ref={settingsRef}>
                                <button
                                    onClick={() => setShowColumnSettings(!showColumnSettings)}
                                    className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-all"
                                >
                                    <Settings size={16} /> 列设置
                                </button>
                                {showColumnSettings && (
                                    <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="p-3 border-b border-slate-100 dark:border-slate-700 text-xs font-semibold text-slate-500 uppercase">显示列</div>
                                        <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
                                            {[
                                                { key: 'associated', label: '关联公司 / 职位' },
                                                { key: 'internship', label: '实习经历' },
                                                { key: 'education', label: '学历' },
                                                { key: 'experience', label: '经验' },
                                                { key: 'city', label: '城市' },
                                                { key: 'expectedSalary', label: '期望薪资' },
                                                { key: 'status', label: '状态' },
                                                { key: 'skills', label: '技能标签' },
                                                { key: 'jobType', label: '期望性质' },
                                                { key: 'workMode', label: '工作方式' },
                                                { key: 'industry', label: '期望行业' },
                                                { key: 'locationPref', label: '期望城市' },
                                                { key: 'bio', label: '个人简介' },
                                                { key: 'appCount', label: '投递数' },
                                            ].map(({ key, label }) => (
                                                <button
                                                    key={key}
                                                    onClick={() => toggleColumn(key as any)}
                                                    className="w-full flex items-center justify-between px-3 py-2 text-sm text-left text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
                                                >
                                                    <span>{label}</span>
                                                    {visibleColumns[key as keyof typeof visibleColumns] && <Check size={14} className="text-indigo-600" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => exportToCSV(filteredCandidates, 'candidates')}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white text-sm font-medium rounded-lg hover:bg-slate-900 transition-all"
                                disabled={loading}
                            >
                                <Download size={16} /> 导出
                            </button>
                        </div>
                    </div>
                    {/* Optimized Filters */}
                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">学历:</label>
                            <select
                                value={filterDegree}
                                onChange={(e) => setFilterDegree(e.target.value)}
                                className="text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            >
                                {degreeOptions.map((opt) => (
                                    <option key={opt} value={opt}>
                                        {opt}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">经验:</label>
                            <select
                                value={filterExperience}
                                onChange={(e) => setFilterExperience(e.target.value)}
                                className="text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            >
                                {experienceOptions.map((opt) => (
                                    <option key={opt} value={opt}>
                                        {opt}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">城市:</label>
                            <select
                                value={filterCity}
                                onChange={(e) => setFilterCity(e.target.value)}
                                className="text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 max-w-[120px]"
                            >
                                {cityOptions.map((opt) => (
                                    <option key={opt} value={opt}>
                                        {opt}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">工作方式:</label>
                            <select
                                value={filterWorkMode}
                                onChange={(e) => setFilterWorkMode(e.target.value)}
                                className="text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            >
                                {workModeOptions.map((opt) => (
                                    <option key={opt} value={opt}>
                                        {opt}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button onClick={resetFilters} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors ml-auto md:ml-0">
                            清除筛选
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
                            <tr>
                                <th className="px-6 py-3 text-left">{t.name}</th>
                                {visibleColumns.associated && <th className="px-6 py-3 text-left">关联公司 / 职位</th>}
                                {visibleColumns.internship && <th className="px-6 py-3 text-left">实习经历</th>}
                                {visibleColumns.education && <th className="px-6 py-3 text-left">学历</th>}
                                {visibleColumns.experience && <th className="px-6 py-3 text-left">{t.exp}</th>}
                                {visibleColumns.city && <th className="px-6 py-3 text-left">城市</th>}
                                {visibleColumns.expectedSalary && <th className="px-6 py-3 text-left">期望薪资</th>}
                                {visibleColumns.status && <th className="px-6 py-3 text-left">{t.status}</th>}
                                {visibleColumns.skills && <th className="px-6 py-3 text-left">{t.skills}</th>}
                                {visibleColumns.jobType && <th className="px-6 py-3 text-left">期望性质</th>}
                                {visibleColumns.workMode && <th className="px-6 py-3 text-left">工作方式</th>}
                                {visibleColumns.industry && <th className="px-6 py-3 text-left">期望行业</th>}
                                {visibleColumns.locationPref && <th className="px-6 py-3 text-left">期望城市</th>}
                                {visibleColumns.bio && <th className="px-6 py-3 text-left min-w-[200px]">个人简介</th>}
                                {visibleColumns.appCount && <th className="px-6 py-3 text-left">投递数</th>}
                                <th className="px-6 py-3 text-left">操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={15} className="px-6 py-8 text-center text-slate-500">加载中...</td>
                                </tr>
                            ) : filteredCandidates.length === 0 ? (
                                <tr>
                                    <td colSpan={15} className="px-6 py-8 text-center text-slate-500">没有找到匹配的候选人</td>
                                </tr>
                            ) : (
                                paginatedCandidates.map((c) => (
                                    <tr key={c.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600/50">
                                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                                            <div className="flex items-center gap-3">
                                                <div className="relative h-10 w-10 flex-shrink-0">
                                                    {/* Base Layer: Initials */}
                                                    <div className="h-full w-full rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold border-2 border-white dark:border-slate-800 shadow-sm">
                                                        {c.name.charAt(0)}
                                                    </div>

                                                    {/* Top Layer: Image */}
                                                    {c.avatar && (
                                                        <img
                                                            src={c.avatar.startsWith('http') ? c.avatar : `http://localhost:3001${c.avatar}`}
                                                            alt={c.name}
                                                            className="absolute inset-0 h-full w-full rounded-full object-cover"
                                                            onError={(e) => {
                                                                e.currentTarget.style.display = 'none';
                                                            }}
                                                        />
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span>{c.name}</span>
                                                    <span className="text-xs text-slate-400">{c.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        {visibleColumns.associated && (
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1.5">
                                                    {c.associatedCompany !== '-' ? (
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-slate-700">{c.associatedRole}</span>
                                                            <div className="flex items-center gap-1 text-xs text-indigo-600 font-medium">
                                                                <Briefcase size={12} />
                                                                <span>{c.associatedCompany}</span>
                                                            </div>
                                                            {c.associatedRecruiter && (
                                                                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                                                    <User size={10} />
                                                                    <span>HR: {c.associatedRecruiter}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400 text-xs italic">无关联公司</span>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                        {visibleColumns.internship && (
                                            <td className="px-6 py-4">
                                                {(c.internshipRole !== 'N/A' || c.internshipCompany !== 'N/A') ? (
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-slate-700">{c.internshipRole}</span>
                                                        <span className="text-xs text-slate-500">{c.internshipCompany}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 text-xs">-</span>
                                                )}
                                            </td>
                                        )}
                                        {visibleColumns.education && <td className="px-6 py-4 text-slate-600">{c.education}</td>}
                                        {visibleColumns.experience && <td className="px-6 py-4">{c.experience}</td>}
                                        {visibleColumns.city && <td className="px-6 py-4 text-slate-600">{c.city}</td>}
                                        {visibleColumns.expectedSalary && <td className="px-6 py-4 text-slate-600 font-medium">{c.expectedSalary}</td>}
                                        {visibleColumns.status && (
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs ${['Available', 'available', '随时入职'].includes(c.status) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
                                                >
                                                    {c.status}
                                                </span>
                                            </td>
                                        )}
                                        {visibleColumns.skills && (
                                            <td className="px-6 py-4 max-w-xs">
                                                <div className="flex flex-wrap gap-1">
                                                    {c.skills.length > 0
                                                        ? c.skills.slice(0, 3).map((skill: string, i: number) => (
                                                            <span key={i} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-xs border border-slate-200">
                                                                {skill}
                                                            </span>
                                                        ))
                                                        : <span className="text-slate-300 text-xs">-</span>}
                                                    {c.skills.length > 3 && (
                                                        <span className="text-xs text-slate-400">+{c.skills.length - 3}</span>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                        {visibleColumns.jobType && <td className="px-6 py-4 text-slate-600 text-xs">{c.jobType}</td>}
                                        {visibleColumns.workMode && <td className="px-6 py-4 text-slate-600 text-xs">{c.workMode}</td>}
                                        {visibleColumns.industry && <td className="px-6 py-4 text-slate-600 text-xs">{c.industry}</td>}
                                        {visibleColumns.locationPref && <td className="px-6 py-4 text-slate-600 text-xs">{c.locationPref}</td>}
                                        {visibleColumns.bio && (
                                            <td className="px-6 py-4 text-slate-500 text-xs truncate max-w-xs" title={c.bio}>
                                                {c.bio}
                                            </td>
                                        )}
                                        {visibleColumns.appCount && (
                                            <td className="px-6 py-4 text-slate-600">
                                                {c.appCount > 0 ? (
                                                    <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full text-xs font-bold">{c.appCount}</span>
                                                ) : (
                                                    '0'
                                                )}
                                            </td>
                                        )}
                                        <td className="px-6 py-4">
                                            <button onClick={() => handleViewProfile(c)} className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1">
                                                <Eye size={16} /> 详情
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="px-6 py-2 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
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
            </div >
            <AdminCandidateDetailModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} candidate={selectedCandidate || {}} />
        </div >
    );
};

export default CandidatesView;