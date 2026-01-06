import React from 'react';
import { Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { JobPosting } from '@/types/types';

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
            className="group bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-lg hover:border-indigo-50 transition-all duration-300 cursor-pointer flex flex-col h-full relative overflow-hidden"
            onClick={handleSelect}
        >
            {/* Hover Decorator line */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

            {/* Header: Title & Salary */}
            <div className="flex justify-between items-center gap-2 mb-3">
                <h3 className="text-[16px] font-bold text-slate-800 line-clamp-1 flex-1 group-hover:text-indigo-600 transition-colors" title={title}>
                    {title}
                </h3>
                <span className="text-[#fe574a] font-bold text-[15px] whitespace-nowrap">
                    {salary}
                </span>
            </div>

            {/* Tags Row */}
            <div className="flex flex-wrap gap-2 mb-4">
                {tags.map((tag, index) => (
                    <span key={index} className="px-2 py-[2px] bg-slate-50 text-slate-500 text-[12px] rounded border border-slate-100">
                        {tag}
                    </span>
                ))}
            </div>

            {/* Footer: Company & Location */}
            <div className="mt-auto flex items-center justify-between pt-3">
                <div className="flex items-center gap-2 min-w-0">
                    {job.company_logo ? (
                        <img src={job.company_logo} alt={companyName} className="w-8 h-8 rounded-lg object-cover border border-slate-50 bg-slate-50" />
                    ) : (
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-400 border border-indigo-50">
                            <Building2 className="w-4 h-4" />
                        </div>
                    )}
                    <span className="text-[13px] text-slate-600 truncate max-w-[120px] hover:text-indigo-600 transition-colors" title={companyName}>
                        {companyName}
                    </span>
                </div>
                <div className="flex items-center text-slate-400 text-[13px] whitespace-nowrap ml-2">
                    {location}
                </div>
            </div>

            {/* HR Info - Optional, simplified */}
            {/* <div className="absolute bottom-4 right-4 text-xs text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">
                {job.recruiter_name}
            </div> */}
        </div>
    );
};

export default JobCard;