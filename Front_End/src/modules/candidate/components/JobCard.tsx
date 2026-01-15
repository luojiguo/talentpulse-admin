import React from 'react';
import { Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { JobPosting } from '@/types/types';
import { processAvatarUrl } from '@/components/AvatarUploadComponent';

const JobCard: React.FC<{ job: JobPosting; onChat?: (jobId: number, recruiterId: number) => void }> = ({ job, onChat }) => {
    const navigate = useNavigate();

    const handleSelect = () => {
        navigate(`/job/${job.id}`);
    };

    // Ensure data safety
    const title = job.title || '未知职位';
    const salary = job.salary || '面议';
    const companyName = job.company_name || '未知公司';
    const location = job.location || '未知地点';
    const experience = job.experience || '经验不限';
    const degree = job.degree || '学历不限';

    // Filter out empty tags
    const tags = [experience, degree].filter(t => t && t !== '不限' && t !== '经验不限' && t !== '学历不限');
    if (tags.length === 0) {
        if (experience) tags.push(experience);
        if (degree) tags.push(degree);
    }
    // Optional: Add job.type/level if needed, but keeping it minimal as per reference image

    return (
        <div
            className="group bg-white dark:bg-slate-800 p-6 rounded-[1.5rem] shadow-sm border border-slate-100 dark:border-slate-700/60 hover:shadow-xl hover:shadow-brand-500/10 dark:hover:shadow-none hover:border-brand-200 dark:hover:border-brand-500/30 transition-all duration-500 cursor-pointer flex flex-col h-full relative overflow-hidden active:scale-[0.98]"
            onClick={handleSelect}
        >
            {/* Hover Decorator line */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-400 to-brand-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            {/* Header: Title & Salary */}
            <div className="flex justify-between items-start gap-4 mb-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 line-clamp-1 flex-1 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors duration-300" title={title}>
                    {title}
                </h3>
                <span
                    className="font-black text-lg whitespace-nowrap px-3 py-1.5 rounded-xl border shadow-sm transition-colors"
                    style={{
                        backgroundColor: '#EFF6FF', // brand-50
                        color: '#007AFF', // brand-600 (Apple Blue)
                        borderColor: '#DBEAFE', // brand-100
                        boxShadow: '0 1px 2px 0 rgba(0, 122, 255, 0.05)'
                    }}
                >
                    {salary}
                </span>
            </div>

            {/* Tags Row */}
            <div className="flex flex-wrap gap-2 mb-6">
                {tags.map((tag, index) => (
                    <span key={index} className="px-2.5 py-1 bg-slate-50 dark:bg-slate-700/30 text-slate-600 dark:text-slate-400 text-xs font-medium rounded-lg border border-slate-100 dark:border-slate-600/30 group-hover:border-slate-200 dark:group-hover:border-slate-600 transition-colors">
                        {tag}
                    </span>
                ))}
            </div>

            {/* Footer: Company & Location */}
            <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-700/30">
                <div className="flex items-center gap-3 min-w-0">
                    {job.company_logo && job.company_logo !== 'C' ? (
                        <img src={processAvatarUrl(job.company_logo)} alt={companyName} className="w-10 h-10 rounded-xl object-cover border border-slate-100 dark:border-slate-600 bg-white p-0.5" />
                    ) : (
                        <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-slate-700/50 flex items-center justify-center text-brand-400 border border-brand-100/50 dark:border-slate-600/50">
                            <Building2 className="w-5 h-5" />
                        </div>
                    )}
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate max-w-[120px] group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors duration-300" title={companyName}>
                        {companyName}
                    </span>
                </div>
                <div className="flex items-center text-slate-400 dark:text-slate-500 text-xs font-medium whitespace-nowrap bg-slate-50 dark:bg-slate-700/30 px-2.5 py-1 rounded-lg border border-slate-100 dark:border-slate-700/50">
                    {location}
                </div>
            </div>
        </div>
    );
};

export default JobCard;