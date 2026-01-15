import React, { useState, useEffect } from 'react';
import { X, Mail, Phone, MapPin, Briefcase, Calendar, GraduationCap, FileText, Download, ExternalLink, User } from 'lucide-react';
import { candidateAPI } from '@/services/apiService';
import { TRANSLATIONS } from '@/constants/constants';
import { Language } from '@/types/types';

interface AdminCandidateDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    candidate: any;
    lang: Language;
}

export const AdminCandidateDetailModal: React.FC<AdminCandidateDetailModalProps> = ({ isOpen, onClose, candidate, lang }) => {
    const t = TRANSLATIONS[lang].candidates;
    const common = TRANSLATIONS[lang].common;
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

            // Parallel fetching
            const [workRes, eduRes, projRes] = await Promise.all([
                candidateAPI.getWorkExperiences(userId),
                candidateAPI.getEducationExperiences(userId),
                candidateAPI.getProjectExperiences(userId)
            ]);

            setDetails({
                workExperiences: workRes.data || [],
                educationExperiences: eduRes.data || [],
                projectExperiences: projRes.data || [],
                resumes: []
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
        if (!dateString) return t.until_now;
        const date = new Date(dateString);
        return date.toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', {
            year: 'numeric',
            month: lang === 'zh' ? 'long' : 'short'
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-start bg-slate-50/50 dark:bg-slate-900/20">
                    <div className="flex items-center gap-6">
                        <div className="relative h-20 w-20 flex-shrink-0">
                            <div className="h-full w-full rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-3xl font-bold border-4 border-white dark:border-slate-800 shadow-md">
                                {candidate.name?.charAt(0)}
                            </div>
                            {candidate.avatar && (
                                <img
                                    src={candidate.avatar.startsWith('http') ? candidate.avatar : `http://localhost:8001${candidate.avatar}`}
                                    alt={candidate.name}
                                    className="absolute inset-0 h-full w-full rounded-full object-cover border-4 border-white dark:border-slate-800"
                                    onError={(e) => e.currentTarget.style.display = 'none'}
                                />
                            )}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1.5">{candidate.name}</h2>
                            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500 dark:text-slate-400 font-medium">
                                {candidate.latestPosition && (
                                    <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm">
                                        <Briefcase className="w-4 h-4 text-emerald-500" />
                                        {candidate.latestPosition}
                                    </div>
                                )}
                                {candidate.work_experience_years !== undefined && candidate.work_experience_years !== null && (
                                    <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm">
                                        <Calendar className="w-4 h-4 text-emerald-500" />
                                        {candidate.work_experience_years}{t.exp_years}
                                    </div>
                                )}
                                {candidate.latest_school && (
                                    <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm">
                                        <GraduationCap className="w-4 h-4 text-emerald-500" />
                                        {candidate.latest_school} {candidate.latest_degree ? `· ${candidate.latest_degree}` : ''}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-all active:scale-95"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    {/* Sidebar / Tabs */}
                    <div className="w-full md:w-64 bg-slate-50 dark:bg-slate-900/30 border-r border-slate-100 dark:border-slate-700/50 p-4 flex md:flex-col gap-2 overflow-x-auto md:overflow-visible shrink-0 scrollbar-none">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-3 whitespace-nowrap md:whitespace-normal ${activeTab === 'overview' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'}`}
                        >
                            <User className="w-4 h-4" />
                            {lang === 'zh' ? '基本信息' : 'Overview'}
                        </button>
                        <button
                            onClick={() => setActiveTab('experience')}
                            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-3 whitespace-nowrap md:whitespace-normal ${activeTab === 'experience' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'}`}
                        >
                            <Briefcase className="w-4 h-4" />
                            {t.exp_and_projects}
                        </button>
                        <button
                            onClick={() => setActiveTab('education')}
                            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-3 whitespace-nowrap md:whitespace-normal ${activeTab === 'education' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'}`}
                        >
                            <GraduationCap className="w-4 h-4" />
                            {t.education}
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
                        {loading ? (
                            <div className="h-full flex flex-col items-center justify-center gap-3">
                                <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-500 border-t-transparent shadow-sm"></div>
                                <span className="text-slate-500 font-medium">{common.loading}</span>
                            </div>
                        ) : (
                            <div className="max-w-3xl mx-auto">
                                {/* Overview Tab */}
                                {activeTab === 'overview' && (
                                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-400">
                                        <section>
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-3">
                                                <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg">
                                                    <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                                </div>
                                                {t.bio}
                                            </h3>
                                            <div className="bg-slate-50 dark:bg-slate-900/40 rounded-2xl p-6 text-slate-700 dark:text-slate-300 leading-relaxed border border-slate-100 dark:border-slate-700/50 shadow-inner">
                                                {candidate.summary || t.no_bio}
                                            </div>
                                        </section>

                                        <section>
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-3">
                                                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                                                    <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                {t.skills}
                                            </h3>
                                            <div className="flex flex-wrap gap-2.5">
                                                {candidate.skills && candidate.skills.length > 0 ? (
                                                    candidate.skills.map((skill: string, index: number) => (
                                                        <span key={index} className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-xl text-sm font-bold border border-emerald-100 dark:border-emerald-800/50 shadow-sm">
                                                            {skill}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-slate-500 italic px-2">{lang === 'zh' ? '暂无技能标签' : 'No skills listed'}</span>
                                                )}
                                            </div>
                                        </section>

                                        <section>
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-3">
                                                <div className="p-1.5 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
                                                    <Mail className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                                </div>
                                                {t.contact_admin_only}
                                            </h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                <div className="bg-white dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-4 shadow-sm group hover:border-emerald-200 dark:hover:border-emerald-900/50 transition-colors">
                                                    <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl group-hover:scale-110 transition-transform">
                                                        <Mail className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{lang === 'zh' ? '邮箱' : 'Email'}</div>
                                                        <div className="text-sm font-bold text-slate-900 dark:text-white">{candidate.email || (lang === 'zh' ? '未公开' : 'Private')}</div>
                                                    </div>
                                                </div>
                                                <div className="bg-white dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-4 shadow-sm group hover:border-emerald-200 dark:hover:border-emerald-900/50 transition-colors">
                                                    <div className="p-3 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl group-hover:scale-110 transition-transform">
                                                        <Phone className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{lang === 'zh' ? '电话' : 'Phone'}</div>
                                                        <div className="text-sm font-bold text-slate-900 dark:text-white">{candidate.phone || (lang === 'zh' ? '未公开' : 'Private')}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </section>
                                    </div>
                                )}

                                {/* Experience Tab */}
                                {activeTab === 'experience' && (
                                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-400">
                                        <section>
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-3">
                                                <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg">
                                                    <Briefcase className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                                </div>
                                                {t.workExperience}
                                            </h3>
                                            <div className="space-y-8">
                                                {details.workExperiences.length > 0 ? (
                                                    details.workExperiences.map((exp: any) => (
                                                        <div key={exp.id} className="relative pl-8 border-l-2 border-slate-100 dark:border-slate-700 last:border-0 pb-8 group">
                                                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-emerald-500 border-4 border-white dark:border-slate-800 shadow-sm group-hover:scale-125 transition-transform"></div>
                                                            <div className="mb-2 flex flex-col md:flex-row md:justify-between md:items-start gap-2">
                                                                <h4 className="text-lg font-bold text-slate-900 dark:text-white">{exp.position}</h4>
                                                                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded uppercase tracking-wider shadow-sm">
                                                                    {formatDate(exp.start_date)} - {formatDate(exp.end_date)}
                                                                </span>
                                                            </div>
                                                            <div className="text-emerald-700 dark:text-emerald-400 font-bold mb-3">{exp.company_name}</div>
                                                            <p className="text-slate-600 dark:text-slate-400 text-sm whitespace-pre-line leading-relaxed">{exp.description}</p>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-center py-16 bg-slate-50 dark:bg-slate-900/20 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                                                        <div className="text-slate-400 dark:text-slate-600 font-bold uppercase tracking-widest text-xs">{t.noWorkExperience}</div>
                                                    </div>
                                                )}
                                            </div>
                                        </section>

                                        <section>
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-3">
                                                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                                                    <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                {t.projectExperience}
                                            </h3>
                                            <div className="space-y-8">
                                                {details.projectExperiences.length > 0 ? (
                                                    details.projectExperiences.map((proj: any) => (
                                                        <div key={proj.id} className="relative pl-8 border-l-2 border-blue-100 dark:border-slate-700 last:border-0 pb-8 group">
                                                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-500 border-4 border-white dark:border-slate-800 shadow-sm group-hover:scale-125 transition-transform"></div>
                                                            <div className="mb-2 flex flex-col md:flex-row md:justify-between md:items-start gap-2">
                                                                <h4 className="text-lg font-bold text-slate-900 dark:text-white">{proj.project_name}</h4>
                                                                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded uppercase tracking-wider shadow-sm">
                                                                    {formatDate(proj.start_date)} - {formatDate(proj.end_date)}
                                                                </span>
                                                            </div>
                                                            <div className="text-blue-700 dark:text-blue-400 font-bold mb-3">{proj.role}</div>
                                                            <p className="text-slate-600 dark:text-slate-400 text-sm whitespace-pre-line leading-relaxed">{proj.description}</p>
                                                            {proj.project_link && (
                                                                <a
                                                                    href={proj.project_link}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center gap-2 text-xs text-blue-500 hover:text-blue-600 font-bold mt-4 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg transition-all hover:translate-x-1"
                                                                >
                                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                                    {t.view_project_link}
                                                                </a>
                                                            )}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-center py-16 bg-slate-50 dark:bg-slate-900/20 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                                                        <div className="text-slate-400 dark:text-slate-600 font-bold uppercase tracking-widest text-xs">{t.noProjectExperience}</div>
                                                    </div>
                                                )}
                                            </div>
                                        </section>
                                    </div>
                                )}

                                {/* Education Tab */}
                                {activeTab === 'education' && (
                                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-400">
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-3">
                                            <div className="p-1.5 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
                                                <GraduationCap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                            </div>
                                            {t.education}
                                        </h3>
                                        <div className="space-y-6">
                                            {details.educationExperiences.length > 0 ? (
                                                details.educationExperiences.map((edu: any) => (
                                                    <div key={edu.id} className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg hover:border-emerald-200 dark:hover:border-emerald-900/30 transition-all group">
                                                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
                                                            <div>
                                                                <h4 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">{edu.school}</h4>
                                                                <div className="text-emerald-700 dark:text-emerald-400 font-bold mt-0.5">{edu.major} · {edu.degree}</div>
                                                            </div>
                                                            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded uppercase tracking-wider self-start">
                                                                {formatDate(edu.start_date)} - {formatDate(edu.end_date)}
                                                            </span>
                                                        </div>
                                                        {edu.description && (
                                                            <p className="text-slate-600 dark:text-slate-400 text-sm mt-4 pt-4 border-t border-slate-50 dark:border-slate-700/50 leading-relaxed">{edu.description}</p>
                                                        )}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-16 bg-slate-50 dark:bg-slate-900/20 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                                                    <div className="text-slate-400 dark:text-slate-600 font-bold uppercase tracking-widest text-xs">{lang === 'zh' ? '暂无教育背景' : 'No education details'}</div>
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
                <div className="p-5 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20 flex justify-end gap-3 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition-all shadow-sm active:scale-95"
                    >
                        {common.close}
                    </button>
                </div>
            </div>
        </div>
    );
};
