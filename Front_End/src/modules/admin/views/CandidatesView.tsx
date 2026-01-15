import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Download, Settings, Check, Briefcase, User, Filter, Eye, X } from 'lucide-react';
import { TRANSLATIONS } from '@/constants/constants';
import { candidateAPI } from '@/services/apiService';
import { Candidate, Language } from '@/types/types';
import Pagination from '@/components/Pagination';
import { exportToCSV } from '../helpers';
import { AdminCandidateDetailModal } from '../components/AdminCandidateDetailModal';

const CandidatesView: React.FC<{ lang: Language }> = ({ lang }) => {
    const t = TRANSLATIONS[lang].candidates;
    const common = TRANSLATIONS[lang].common;
    const [candidates, setCandidates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Filter states
    const [filterExperience, setFilterExperience] = useState('all');
    const [filterWorkMode, setFilterWorkMode] = useState('all');
    const [filterCity, setFilterCity] = useState('all');
    const [filterDegree, setFilterDegree] = useState('all');

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

    // Helper functions for normalizing status values using translations
    const normalizeJobStatus = (status: string): string => {
        if (!status) return status;
        return (t.job_status as any)[status.toLowerCase()] ?? status;
    };

    const normalizeAvailability = (avail: string): string => {
        if (!avail) return avail;
        return (t.availability as any)[avail.toLowerCase()] ?? avail;
    };

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
                return field.split(/[,，]/).map((s: string) => s.trim()).filter(Boolean);
            }
        }
        return [];
    };

    // Translated Options
    const experienceOptions = useMemo(() => [
        { value: 'all', label: common.all },
        { value: '0', label: lang === 'zh' ? '应届生' : 'Fresher' },
        { value: '1-3', label: '1-3' + (lang === 'zh' ? '年' : ' Years') },
        { value: '3-5', label: '3-5' + (lang === 'zh' ? '年' : ' Years') },
        { value: '5-10', label: '5-10' + (lang === 'zh' ? '年' : ' Years') },
        { value: '10+', label: '10+' + (lang === 'zh' ? '年' : ' Years') }
    ], [lang, common.all]);

    const workModeOptions = useMemo(() => [
        { value: 'all', label: common.all },
        { value: '远程', label: lang === 'zh' ? '远程' : 'Remote' },
        { value: '混合办公', label: lang === 'zh' ? '混合办公' : 'Hybrid' },
        { value: '现场办公', label: lang === 'zh' ? '现场办公' : 'On-site' }
    ], [lang, common.all]);

    const degreeOptions = useMemo(() => [
        { value: 'all', label: common.all },
        { value: '本科', label: lang === 'zh' ? '本科' : 'Bachelor' },
        { value: '硕士', label: lang === 'zh' ? '硕士' : 'Master' },
        { value: '博士', label: lang === 'zh' ? '博士' : 'PhD' },
        { value: '大专', label: lang === 'zh' ? '大专' : 'Associate' }
    ], [lang, common.all]);

    // Dynamic city options based on loaded candidates
    const cityOptions = useMemo(() => {
        const cities = new Set(candidates.map((c) => c.city).filter((c) => c && c !== '-' && c !== '未知'));
        return [{ value: 'all', label: common.all }, ...Array.from(cities).map(city => ({ value: city, label: city }))];
    }, [candidates, common.all]);

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
                        name: candidate.name || (lang === 'zh' ? '未知姓名' : 'Unknown'),
                        internshipRole: candidate.latest_position || 'N/A',
                        internshipCompany: candidate.latest_company || 'N/A',
                        associatedCompany: candidate.latest_application_company || '-',
                        associatedRole: candidate.latest_application_job_title || '-',
                        associatedRecruiter: candidate.latest_application_recruiter,
                        experience: candidate.work_experience_years ? `${candidate.work_experience_years}${lang === 'zh' ? '年' : ' yrs'}` : (lang === 'zh' ? '无经验' : 'No Exp'),
                        education: candidate.latest_school ? `${candidate.latest_school} ${candidate.latest_degree ? `(${candidate.latest_degree})` : ''}` : common.na,
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
    }, [lang]);

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
                filterExperience === 'all' ||
                (filterExperience === '0' && candidate.work_experience_years === 0) ||
                (filterExperience === '1-3' && candidate.work_experience_years >= 1 && candidate.work_experience_years < 3) ||
                (filterExperience === '3-5' && candidate.work_experience_years >= 3 && candidate.work_experience_years < 5) ||
                (filterExperience === '5-10' && candidate.work_experience_years >= 5 && candidate.work_experience_years < 10) ||
                (filterExperience === '10+' && candidate.work_experience_years >= 10);

            const matchesCity = filterCity === 'all' || candidate.city === filterCity;
            const matchesWorkMode = filterWorkMode === 'all' || candidate.workMode.includes(filterWorkMode);
            const matchesDegree = filterDegree === 'all' || candidate.rawDegree.includes(filterDegree);

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
        setFilterExperience('all');
        setFilterWorkMode('all');
        setFilterCity('all');
        setFilterDegree('all');
        setSearchTerm('');
    };

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 space-y-4">
                    <div className="flex flex-wrap gap-4 justify-between items-center">
                        <div className="flex gap-2 items-center w-full md:w-auto">
                            <Search className="text-slate-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder={lang === 'zh' ? "搜索姓名、公司、职位或技能..." : "Search name, company, skill..."}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-transparent focus:outline-none text-sm w-full md:w-64 dark:text-white"
                            />
                            {searchTerm && (
                                <button onClick={() => setSearchTerm('')} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                        <div className="flex gap-2 items-center relative">
                            <div className="relative" ref={settingsRef}>
                                <button
                                    onClick={() => setShowColumnSettings(!showColumnSettings)}
                                    className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-all shadow-sm"
                                >
                                    <Settings size={16} /> {lang === 'zh' ? '列设置' : 'Columns'}
                                </button>
                                {showColumnSettings && (
                                    <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="p-3 border-b border-slate-100 dark:border-slate-700 text-[10px] font-bold text-slate-500 uppercase tracking-wider">{lang === 'zh' ? '显示列' : 'Visible Columns'}</div>
                                        <div className="p-2 space-y-0.5 max-h-[400px] overflow-y-auto custom-scrollbar">
                                            {[
                                                { key: 'associated', label: t.associated },
                                                { key: 'internship', label: t.internship },
                                                { key: 'education', label: t.education },
                                                { key: 'experience', label: t.exp },
                                                { key: 'city', label: t.city },
                                                { key: 'expectedSalary', label: t.expectedSalary },
                                                { key: 'status', label: t.status },
                                                { key: 'skills', label: t.skills },
                                                { key: 'jobType', label: t.jobType },
                                                { key: 'workMode', label: t.workMode },
                                                { key: 'industry', label: t.industry },
                                                { key: 'locationPref', label: t.locationPref },
                                                { key: 'bio', label: t.bio },
                                                { key: 'appCount', label: t.appCount },
                                            ].map(({ key, label }) => (
                                                <button
                                                    key={key}
                                                    onClick={() => toggleColumn(key as any)}
                                                    className="w-full flex items-center justify-between px-3 py-2 text-sm text-left text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors group"
                                                >
                                                    <span className="group-hover:text-blue-600 dark:group-hover:text-blue-400">{label}</span>
                                                    {visibleColumns[key as keyof typeof visibleColumns] && <Check size={14} className="text-blue-600 dark:text-blue-400" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => exportToCSV(filteredCandidates, 'candidates')}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-700 dark:bg-slate-600 text-white text-sm font-medium rounded-lg hover:bg-slate-900 dark:hover:bg-slate-500 transition-all shadow-sm"
                                disabled={loading}
                            >
                                <Download size={16} /> {common.export}
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-x-6 gap-y-3 items-center pt-2">
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t.education}:</label>
                            <select
                                value={filterDegree}
                                onChange={(e) => setFilterDegree(e.target.value)}
                                className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            >
                                {degreeOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t.exp}:</label>
                            <select
                                value={filterExperience}
                                onChange={(e) => setFilterExperience(e.target.value)}
                                className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            >
                                {experienceOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t.city}:</label>
                            <select
                                value={filterCity}
                                onChange={(e) => setFilterCity(e.target.value)}
                                className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 min-w-[80px]"
                            >
                                {cityOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t.workMode}:</label>
                            <select
                                value={filterWorkMode}
                                onChange={(e) => setFilterWorkMode(e.target.value)}
                                className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            >
                                {workModeOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button onClick={resetFilters} className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-bold transition-colors ml-auto flex items-center gap-1">
                            <X size={12} /> {t.resetFilters}
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-xs text-slate-500 font-bold uppercase tracking-wider bg-slate-50 dark:bg-slate-700/50 dark:text-slate-400">
                            <tr>
                                <th className="px-6 py-4 text-left">{t.name}</th>
                                {visibleColumns.associated && <th className="px-6 py-4 text-left">{t.associated}</th>}
                                {visibleColumns.internship && <th className="px-6 py-4 text-left">{t.internship}</th>}
                                {visibleColumns.education && <th className="px-6 py-4 text-left">{t.education}</th>}
                                {visibleColumns.experience && <th className="px-6 py-4 text-left">{t.exp}</th>}
                                {visibleColumns.city && <th className="px-6 py-4 text-left">{t.city}</th>}
                                {visibleColumns.expectedSalary && <th className="px-6 py-4 text-left">{t.expectedSalary}</th>}
                                {visibleColumns.status && <th className="px-6 py-4 text-left">{t.status}</th>}
                                {visibleColumns.skills && <th className="px-6 py-4 text-left">{t.skills}</th>}
                                {visibleColumns.jobType && <th className="px-6 py-4 text-left">{t.jobType}</th>}
                                {visibleColumns.workMode && <th className="px-6 py-4 text-left">{t.workMode}</th>}
                                {visibleColumns.industry && <th className="px-6 py-4 text-left">{t.industry}</th>}
                                {visibleColumns.locationPref && <th className="px-6 py-4 text-left">{t.locationPref}</th>}
                                {visibleColumns.bio && <th className="px-6 py-4 text-left min-w-[200px]">{t.bio}</th>}
                                {visibleColumns.appCount && <th className="px-6 py-4 text-left">{t.appCount}</th>}
                                <th className="px-6 py-4 text-left">{t.action}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={16} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                            <span className="font-medium">{common.loading}</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredCandidates.length === 0 ? (
                                <tr>
                                    <td colSpan={16} className="px-6 py-12 text-center text-slate-400">
                                        <div className="bg-slate-50 dark:bg-slate-900/20 py-10 rounded-2xl border-2 border-dashed border-slate-100 dark:border-slate-800">
                                            <User size={40} className="mx-auto text-slate-200 dark:text-slate-700 mb-2" />
                                            <p className="font-medium">{t.noMatch}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedCandidates.map((c) => (
                                    <tr key={c.id} className="group hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                                            <div className="flex items-center gap-3">
                                                <div className="relative h-10 w-10 flex-shrink-0">
                                                    <div className="h-full w-full rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold border-2 border-white dark:border-slate-800 shadow-sm transition-transform group-hover:scale-105">
                                                        {c.name.charAt(0)}
                                                    </div>
                                                    {c.avatar && (
                                                        <img
                                                            src={c.avatar.startsWith('http') ? c.avatar : `http://localhost:8001${c.avatar}`}
                                                            alt={c.name}
                                                            className="absolute inset-0 h-full w-full rounded-full object-cover border-2 border-white dark:border-slate-800"
                                                            onError={(e) => {
                                                                e.currentTarget.style.display = 'none';
                                                            }}
                                                        />
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{c.name}</span>
                                                    <span className="text-xs text-slate-400 dark:text-slate-500 font-mono truncate max-w-[120px]">{c.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        {visibleColumns.associated && (
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    {c.associatedCompany !== '-' ? (
                                                        <>
                                                            <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs">{c.associatedRole}</span>
                                                            <div className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-bold">
                                                                <Briefcase size={12} />
                                                                <span className="truncate max-w-[120px]">{c.associatedCompany}</span>
                                                            </div>
                                                            {c.associatedRecruiter && (
                                                                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium italic">
                                                                    <User size={10} />
                                                                    <span>HR: {c.associatedRecruiter}</span>
                                                                </div>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <span className="text-slate-300 dark:text-slate-600 text-[10px] font-medium tracking-wider uppercase italic">{lang === 'zh' ? '无关联' : 'NO ASSOC.'}</span>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                        {visibleColumns.internship && (
                                            <td className="px-6 py-4">
                                                {(c.internshipRole !== 'N/A' || c.internshipCompany !== 'N/A') ? (
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs">{c.internshipRole}</span>
                                                        <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[120px]">{c.internshipCompany}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 text-xs">-</span>
                                                )}
                                            </td>
                                        )}
                                        {visibleColumns.education && <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-xs font-medium">{c.education}</td>}
                                        {visibleColumns.experience && <td className="px-6 py-4 dark:text-slate-400 font-semibold">{c.experience}</td>}
                                        {visibleColumns.city && <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-xs font-medium">{c.city}</td>}
                                        {visibleColumns.expectedSalary && <td className="px-6 py-4 text-blue-600 dark:text-blue-400 font-bold">{c.expectedSalary}</td>}
                                        {visibleColumns.status && (
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${['Available', 'available', '随时入职', 'Available Now'].includes(c.status) ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border border-green-200 dark:border-green-800' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'}`}
                                                >
                                                    {c.status}
                                                </span>
                                            </td>
                                        )}
                                        {visibleColumns.skills && (
                                            <td className="px-6 py-4 max-w-xs">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {c.skills.length > 0
                                                        ? c.skills.slice(0, 3).map((skill: string, i: number) => (
                                                            <span key={i} className="px-1.5 py-0.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-[10px] border border-slate-200 dark:border-slate-600 font-bold shadow-sm">
                                                                {skill}
                                                            </span>
                                                        ))
                                                        : <span className="text-slate-300 dark:text-slate-600 text-xs">-</span>}
                                                    {c.skills.length > 3 && (
                                                        <span className="text-[10px] text-slate-400 font-bold">+{c.skills.length - 3}</span>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                        {visibleColumns.jobType && <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-[11px] font-medium italic">{c.jobType}</td>}
                                        {visibleColumns.workMode && <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-[11px] font-medium italic">{c.workMode}</td>}
                                        {visibleColumns.industry && <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-[11px] font-medium italic">{c.industry}</td>}
                                        {visibleColumns.locationPref && <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-[11px] font-medium italic">{c.locationPref}</td>}
                                        {visibleColumns.bio && (
                                            <td className="px-6 py-4 text-slate-400 dark:text-slate-500 text-[11px] truncate max-w-xs leading-relaxed" title={c.bio}>
                                                {c.bio}
                                            </td>
                                        )}
                                        {visibleColumns.appCount && (
                                            <td className="px-6 py-4">
                                                {c.appCount > 0 ? (
                                                    <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full text-[10px] font-black shadow-sm">{c.appCount}</span>
                                                ) : (
                                                    <span className="text-slate-300">0</span>
                                                )}
                                            </td>
                                        )}
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleViewProfile(c)}
                                                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-bold flex items-center gap-1.5 transition-all active:scale-95"
                                            >
                                                <Eye size={16} />
                                                <span className="text-xs uppercase tracking-tighter">{t.details}</span>
                                            </button>
                                        </td>
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
            </div >
            <AdminCandidateDetailModal lang={lang} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} candidate={selectedCandidate || {}} />
        </div >
    );
};

export default CandidatesView;