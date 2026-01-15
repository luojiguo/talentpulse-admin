import React, { useState, useEffect } from 'react';
import { X, Mail, Phone, MapPin, Briefcase, Calendar, GraduationCap, FileText, Download, ExternalLink, User, Sparkles } from 'lucide-react';
import { api } from '../../../services/apiService';
import { useI18n } from '@/contexts/i18nContext';

interface CandidateDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    candidate: any; // Using any for flexibility with the fetched data structure
}

export const CandidateDetailModal: React.FC<CandidateDetailModalProps> = ({ isOpen, onClose, candidate }) => {
    const { language, t } = useI18n();
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [details, setDetails] = useState<any>({
        workExperiences: [],
        educationExperiences: [],
        projectExperiences: [],
        resumes: []
    });

    useEffect(() => {
        if (isOpen && candidate && candidate.userId) {
            fetchCandidateDetails();
        }
    }, [isOpen, candidate]);

    const fetchCandidateDetails = async () => {
        setLoading(true);
        try {
            const userId = candidate.userId;

            // Parallel fetching for performance (excluding resumes to show only relevant one)
            const [workRes, eduRes, projRes] = await Promise.all([
                api.get(`/candidates/${userId}/work-experiences`),
                api.get(`/candidates/${userId}/education-experiences`),
                api.get(`/candidates/${userId}/project-experiences`)
            ]);

            // Use application specific resume if available
            const resumes = candidate.applicationResume ? [{
                id: 'application_resume',
                resume_file_url: candidate.applicationResume.url,
                resume_file_name: candidate.applicationResume.name,
                created_at: candidate.appliedDate
            }] : [];

            setDetails({
                workExperiences: workRes.data?.data || [],
                educationExperiences: eduRes.data?.data || [],
                projectExperiences: projRes.data?.data || [],
                resumes: resumes
            });
        } catch (error) {
            console.error('Failed to fetch candidate details:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    // Helper to format date
    const formatDate = (dateString: string) => {
        if (!dateString) return '至今';
        return new Date(dateString).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' });
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col border border-white/20 dark:border-slate-800 animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-8 border-b border-slate-100 dark:border-slate-800/50 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20 relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-64 h-64 bg-blue-100/30 dark:bg-blue-900/10 rounded-full blur-3xl -mr-32 -mt-32"></div>

                    <div className="flex items-center gap-6 relative z-10">
                        <div className="relative h-24 w-24 flex-shrink-0">
                            <div className="h-full w-full rounded-[24px] bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-blue-200 dark:shadow-none border-4 border-white dark:border-slate-800">
                                {candidate.candidateName?.charAt(0)}
                            </div>
                            {candidate.avatar && (
                                <img
                                    src={candidate.avatar.startsWith('http') ? candidate.avatar : `http://localhost:8001${candidate.avatar}`}
                                    alt={candidate.candidateName}
                                    className="absolute inset-0 h-full w-full rounded-[24px] object-cover border-4 border-white dark:border-slate-800 shadow-md"
                                    onError={(e) => e.currentTarget.style.display = 'none'}
                                />
                            )}
                            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 border-4 border-white dark:border-slate-900 rounded-full shadow-sm"></div>
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{candidate.candidateName}</h2>
                                <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-blue-100 dark:border-blue-800/50">Candidate</span>
                            </div>
                            <div className="flex flex-wrap gap-5 text-sm text-slate-500 dark:text-slate-400 font-bold">
                                {candidate.currentPosition && (
                                    <div className="flex items-center gap-2">
                                        <Briefcase className="w-4 h-4 text-blue-500" />
                                        {candidate.currentPosition}
                                    </div>
                                )}
                                {candidate.years_of_experience && (
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-blue-500" />
                                        {typeof candidate.years_of_experience === 'number'
                                            ? (language === 'zh' ? `${candidate.years_of_experience}年工作经验` : `${candidate.years_of_experience} Years Exp.`)
                                            : candidate.years_of_experience}
                                    </div>
                                )}
                                {candidate.education && (
                                    <div className="flex items-center gap-2">
                                        <GraduationCap className="w-4 h-4 text-blue-500" />
                                        {candidate.degree || candidate.education}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-2xl transition-all shadow-sm border border-slate-100 dark:border-slate-700 active:scale-95 relative z-50 group"
                    >
                        <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    {/* Sidebar / Tabs */}
                    <div className="w-full md:w-64 bg-slate-50 dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800/50 p-6 flex md:flex-col gap-3 overflow-x-auto md:overflow-visible shrink-0">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`w-full text-left px-5 py-3.5 rounded-2xl text-sm font-black tracking-tight transition-all flex items-center gap-3 ${activeTab === 'overview' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-none scale-[1.02]' : 'text-slate-500 hover:bg-white dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400'}`}
                        >
                            <User className={`w-4 h-4 ${activeTab === 'overview' ? 'text-white' : ''}`} />
                            {language === 'zh' ? '档案总览' : 'Overview'}
                        </button>
                        <button
                            onClick={() => setActiveTab('experience')}
                            className={`w-full text-left px-5 py-3.5 rounded-2xl text-sm font-black tracking-tight transition-all flex items-center gap-3 ${activeTab === 'experience' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-none scale-[1.02]' : 'text-slate-500 hover:bg-white dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400'}`}
                        >
                            <Briefcase className={`w-4 h-4 ${activeTab === 'experience' ? 'text-white' : ''}`} />
                            {language === 'zh' ? '简历详情' : 'Experience'}
                        </button>
                        <button
                            onClick={() => setActiveTab('education')}
                            className={`w-full text-left px-5 py-3.5 rounded-2xl text-sm font-black tracking-tight transition-all flex items-center gap-3 ${activeTab === 'education' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-none scale-[1.02]' : 'text-slate-500 hover:bg-white dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400'}`}
                        >
                            <GraduationCap className={`w-4 h-4 ${activeTab === 'education' ? 'text-white' : ''}`} />
                            {language === 'zh' ? '教育背景' : 'Education'}
                        </button>
                        <button
                            onClick={() => setActiveTab('resume')}
                            className={`w-full text-left px-5 py-3.5 rounded-2xl text-sm font-black tracking-tight transition-all flex items-center gap-3 ${activeTab === 'resume' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-none scale-[1.02]' : 'text-slate-500 hover:bg-white dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400'}`}
                        >
                            <FileText className={`w-4 h-4 ${activeTab === 'resume' ? 'text-white' : ''}`} />
                            {language === 'zh' ? '附加附件' : 'Attachments'}
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-8 lg:p-12 bg-white dark:bg-slate-900">
                        {loading ? (
                            <div className="h-full flex flex-col items-center justify-center gap-4 text-slate-400">
                                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-sm font-black tracking-widest uppercase">Fetching Profile...</span>
                            </div>
                        ) : (
                            <div className="max-w-3xl">
                                {/* Overview Tab */}
                                {activeTab === 'overview' && (
                                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <section>
                                            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                                                <User className="w-6 h-6 text-blue-600" />
                                                {language === 'zh' ? '能力概览' : 'Ability Overview'}
                                            </h3>
                                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[28px] p-8 text-slate-600 dark:text-slate-300 leading-relaxed font-medium border border-slate-100 dark:border-slate-800/50 shadow-inner">
                                                {candidate.summary || (language === 'zh' ? '该候选人暂未填写个人职业概览。' : 'No summary provided by the candidate.')}
                                            </div>
                                        </section>

                                        <section>
                                            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                                                <Sparkles className="w-6 h-6 text-blue-600" />
                                                {language === 'zh' ? '核心技能' : 'Core Skills'}
                                            </h3>
                                            <div className="flex flex-wrap gap-3">
                                                {candidate.skills && candidate.skills.length > 0 ? (
                                                    candidate.skills.map((skill: string, index: number) => (
                                                        <span key={index} className="px-5 py-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-2xl text-sm font-black border border-blue-100 dark:border-blue-800/50 shadow-sm hover:scale-110 transition-transform cursor-default">
                                                            {skill}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-slate-400 font-bold italic">{language === 'zh' ? '未标记具体核心技能' : 'No specific skills listed'}</span>
                                                )}
                                            </div>
                                        </section>

                                        <section>
                                            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                                                <Mail className="w-6 h-6 text-blue-600" />
                                                {language === 'zh' ? '联系方式' : 'Contact Details'}
                                            </h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                <div className="bg-white dark:bg-slate-800 p-6 rounded-[24px] border border-slate-200 dark:border-slate-700/50 flex items-center gap-5 shadow-sm group hover:border-blue-300 transition-colors">
                                                    <div className="p-3.5 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-2xl">
                                                        <Mail className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] text-slate-400 uppercase tracking-widest font-black mb-1">Email Address</div>
                                                        <div className="text-base font-black text-slate-900 dark:text-white">{candidate.email || 'Private'}</div>
                                                    </div>
                                                </div>
                                                <div className="bg-white dark:bg-slate-800 p-6 rounded-[24px] border border-slate-200 dark:border-slate-700/50 flex items-center gap-5 shadow-sm group hover:border-blue-300 transition-colors">
                                                    <div className="p-3.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                                                        <Phone className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] text-slate-400 uppercase tracking-widest font-black mb-1">Phone Number</div>
                                                        <div className="text-base font-black text-slate-900 dark:text-white">{candidate.phone || 'Private'}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </section>
                                    </div>
                                )}

                                {/* Experience Tab */}
                                {activeTab === 'experience' && (
                                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <section>
                                            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-8 flex items-center gap-3">
                                                <Briefcase className="w-6 h-6 text-blue-600" />
                                                {language === 'zh' ? '履历详情' : 'Career History'}
                                            </h3>
                                            <div className="space-y-10">
                                                {details.workExperiences.length > 0 ? (
                                                    details.workExperiences.map((exp: any) => (
                                                        <div key={exp.id} className="relative pl-8 border-l-4 border-blue-100 dark:border-blue-900/30 last:border-0 pb-10">
                                                            <div className="absolute -left-[14px] top-0 w-6 h-6 rounded-full bg-blue-600 border-4 border-white dark:border-slate-900 shadow-md"></div>
                                                            <div className="mb-2 flex justify-between items-start flex-wrap gap-4">
                                                                <div>
                                                                    <h4 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">{exp.position}</h4>
                                                                    <div className="text-blue-600 dark:text-blue-400 font-bold mt-1 text-sm">{exp.company_name}</div>
                                                                </div>
                                                                <span className="text-xs font-black text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 uppercase tracking-widest">
                                                                    {formatDate(exp.start_date)} — {formatDate(exp.end_date)}
                                                                </span>
                                                            </div>
                                                            <p className="text-slate-600 dark:text-slate-400 text-sm whitespace-pre-line leading-relaxed font-medium bg-slate-50 dark:bg-slate-800/30 p-6 rounded-3xl mt-4 border border-slate-100 dark:border-slate-800/50">
                                                                {exp.description}
                                                            </p>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-center py-16 bg-slate-50 dark:bg-slate-800/20 rounded-[32px] border border-dashed border-slate-300 dark:border-slate-700">
                                                        <Briefcase className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                                                        <div className="text-slate-400 font-black tracking-widest uppercase text-xs">No Career History Recorded</div>
                                                    </div>
                                                )}
                                            </div>
                                        </section>

                                        <section>
                                            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-8 flex items-center gap-3">
                                                <Sparkles className="w-6 h-6 text-indigo-600" />
                                                {language === 'zh' ? '实战项目' : 'Projects'}
                                            </h3>
                                            <div className="space-y-10">
                                                {details.projectExperiences.length > 0 ? (
                                                    details.projectExperiences.map((proj: any) => (
                                                        <div key={proj.id} className="relative pl-8 border-l-4 border-indigo-100 dark:border-indigo-900/30 last:border-0 pb-10">
                                                            <div className="absolute -left-[14px] top-0 w-6 h-6 rounded-full bg-indigo-600 border-4 border-white dark:border-slate-900 shadow-md"></div>
                                                            <div className="mb-2 flex justify-between items-start flex-wrap gap-4">
                                                                <div>
                                                                    <h4 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{proj.project_name}</h4>
                                                                    <div className="text-indigo-600 dark:text-indigo-400 font-bold mt-1 text-sm">Role: {proj.role}</div>
                                                                </div>
                                                                <span className="text-xs font-black text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 uppercase tracking-widest">
                                                                    {formatDate(proj.start_date)} — {formatDate(proj.end_date)}
                                                                </span>
                                                            </div>
                                                            <p className="text-slate-600 dark:text-slate-400 text-sm whitespace-pre-line leading-relaxed font-medium bg-indigo-50/30 dark:bg-indigo-900/10 p-6 rounded-3xl mt-4 border border-indigo-100 dark:border-indigo-900/20">
                                                                {proj.description}
                                                            </p>
                                                            {proj.project_link && (
                                                                <a
                                                                    href={proj.project_link}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center gap-2 text-sm font-black text-blue-600 hover:text-blue-700 mt-6 bg-blue-50 px-6 py-2.5 rounded-2xl transition-all shadow-sm active:scale-95"
                                                                >
                                                                    <ExternalLink className="w-4 h-4" />
                                                                    查看项目详情 / 演示
                                                                </a>
                                                            )}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-center py-16 bg-slate-50 dark:bg-slate-800/20 rounded-[32px] border border-dashed border-slate-300 dark:border-slate-700">
                                                        <div className="text-slate-400 font-black tracking-widest uppercase text-xs">No Project Experience Available</div>
                                                    </div>
                                                )}
                                            </div>
                                        </section>
                                    </div>
                                )}

                                {/* Education Tab */}
                                {activeTab === 'education' && (
                                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-8 flex items-center gap-3">
                                            <GraduationCap className="w-7 h-7 text-blue-600" />
                                            {language === 'zh' ? '学历与背景' : 'Education History'}
                                        </h3>
                                        <div className="space-y-8">
                                            {details.educationExperiences.length > 0 ? (
                                                details.educationExperiences.map((edu: any) => (
                                                    <div key={edu.id} className="bg-white dark:bg-slate-800 p-8 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300 group">
                                                        <div className="flex justify-between items-start flex-wrap gap-4 mb-6">
                                                            <div className="flex items-center gap-5">
                                                                <div className="p-4 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl group-hover:scale-110 transition-transform">
                                                                    <GraduationCap className="w-6 h-6" />
                                                                </div>
                                                                <div>
                                                                    <h4 className="text-xl font-black text-slate-900 dark:text-white">{edu.school}</h4>
                                                                    <div className="text-blue-600 dark:text-blue-400 font-bold mt-1 uppercase tracking-widest text-xs">{edu.degree} · {edu.major}</div>
                                                                </div>
                                                            </div>
                                                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-800 tracking-[0.2em]">
                                                                {formatDate(edu.start_date)} — {formatDate(edu.end_date)}
                                                            </span>
                                                        </div>
                                                        {edu.description && (
                                                            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-medium bg-slate-50/50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-50 dark:border-slate-800">
                                                                {edu.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/20 rounded-[32px] border border-dashed border-slate-300 dark:border-slate-700">
                                                    <div className="text-slate-400 font-black tracking-widest uppercase text-xs">No Education Records Available</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Resume Tab */}
                                {activeTab === 'resume' && (
                                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-8 flex items-center gap-3">
                                            <FileText className="w-7 h-7 text-blue-600" />
                                            {language === 'zh' ? '投递附件' : 'Application Files'}
                                        </h3>
                                        <div className="grid gap-6">
                                            {details.resumes.length > 0 ? (
                                                details.resumes.map((resume: any) => (
                                                    <div key={resume.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-8 bg-white dark:bg-slate-800 border-2 border-slate-50 dark:border-slate-800 rounded-[32px] shadow-sm hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-2xl transition-all group relative overflow-hidden">
                                                        <div className="absolute right-0 top-0 w-32 h-32 bg-blue-50/50 dark:bg-blue-900/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-100 transition-colors"></div>

                                                        <div className="flex items-center gap-6 relative z-10">
                                                            <div className="p-5 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-2xl group-hover:rotate-12 transition-transform shadow-inner">
                                                                <FileText className="w-8 h-8" />
                                                            </div>
                                                            <div>
                                                                <div className="font-black text-lg text-slate-800 dark:text-white group-hover:text-blue-600 transition-colors break-all leading-tight">{resume.resume_file_name || resume.resume_title}</div>
                                                                <div className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-2 flex items-center gap-2">
                                                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                                    Uploaded on {formatDate(resume.created_at)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3 mt-6 sm:mt-0 relative z-10">
                                                            <a
                                                                href={resume.resume_file_url?.startsWith('http') ? resume.resume_file_url : `http://localhost:8001${resume.resume_file_url}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="px-6 py-3 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 font-black text-sm rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm flex items-center gap-2 border border-slate-100 dark:border-slate-800 hover:border-blue-600"
                                                            >
                                                                <ExternalLink className="w-4 h-4" />
                                                                {language === 'zh' ? '在线查阅' : 'View Online'}
                                                            </a>
                                                            <a
                                                                href={resume.resume_file_url?.startsWith('http') ? resume.resume_file_url : `http://localhost:8001${resume.resume_file_url}`}
                                                                download
                                                                className="p-4 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-100 dark:border-blue-800/50 flex items-center justify-center active:scale-95"
                                                            >
                                                                <Download className="w-5 h-5" />
                                                            </a>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/20 rounded-[32px] border border-dashed border-slate-300 dark:border-slate-700">
                                                    <div className="text-slate-400 font-black tracking-widest uppercase text-xs">No External Attachments Distributed</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-4 rounded-b-[32px] px-10">
                    <button
                        onClick={onClose}
                        className="px-8 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-black text-sm rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-95"
                    >
                        {language === 'zh' ? '暂不处理' : 'Postpone'}
                    </button>
                    <button
                        onClick={() => window.open(`mailto:${candidate.email}`)}
                        className="px-10 py-3 bg-blue-600 text-white font-black text-sm rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 dark:shadow-none active:scale-95"
                    >
                        {language === 'zh' ? '立即取得联系' : 'Contact Immediately'}
                    </button>
                </div>
            </div>
        </div>
    );
};
