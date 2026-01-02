import React, { useState } from 'react';
import { MessageSquare, Building2, MapPin, Briefcase, ChevronDown, ChevronUp, User } from 'lucide-react';
import { JobPosting } from '@/types/types';
import { useNavigate } from 'react-router-dom';

// Fix: Explicitly type JobCard as React.FC to allow 'key' prop in JSX
const JobCard: React.FC<{ job: JobPosting; onChat?: (jobId: number, recruiterId: number) => void }> = ({ job, onChat }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const navigate = useNavigate();
    
    const handleSelect = () => {
        navigate(`/job/${job.id}`);
    };
    
    const toggleExpand = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsExpanded(!isExpanded);
    };
    
    return (
        <div 
            className="bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-lg hover:border-indigo-100 transition-all duration-300 cursor-pointer"
            onClick={handleSelect}
        >
            <div className="flex flex-col sm:flex-row sm:justify-between items-start gap-3 mb-3">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {job.title !== undefined && job.title !== null ? job.title : '未知职位'}
                </h3>
                <span className="text-base sm:text-lg font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
                    {job.salary !== undefined && job.salary !== null ? job.salary : '面议'}
                </span>
            </div>
            <div className="flex flex-wrap items-center text-sm text-gray-500 mb-3 gap-2">
                <span className="flex items-center whitespace-nowrap"><Building2 className="w-4 h-4 mr-1"/>
                    {job.company_name !== undefined && job.company_name !== null ? job.company_name : '未知公司'}
                </span>
                <span className="text-gray-300">•</span>
                <span className="flex items-center whitespace-nowrap"><MapPin className="w-4 h-4 mr-1"/>
                    {job.location !== undefined && job.location !== null ? job.location : '未知地点'}
                </span>
                <span className="text-gray-300">•</span>
                <span className="flex items-center whitespace-nowrap"><Briefcase className="w-4 h-4 mr-1"/>
                    {job.experience !== undefined && job.experience !== null ? job.experience : '经验不限'}
                </span>
                <span className="text-gray-300">•</span>
                <span className="flex items-center whitespace-nowrap"><Briefcase className="w-4 h-4 mr-1"/>
                    {job.degree !== undefined && job.degree !== null ? job.degree : '学历不限'}
                </span>
            </div>
            
            {/* HR招聘人信息 - 添加在公司和岗位中间 */}
            <div className="flex items-center gap-3 mb-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
                    {job.recruiter_name?.charAt(0) || 'HR'}
                </div>
                <div>
                    <div className="font-medium text-gray-900">{job.recruiter_name || '招聘负责人'}</div>
                    <div className="text-gray-500">{job.recruiter_position || '招聘职位'}</div>
                </div>
            </div>
            
            <p className="text-gray-600 line-clamp-2 mb-4 text-sm leading-relaxed">{job.description || '暂无描述'}</p>
            <div className="flex justify-between items-center relative pt-4 border-t border-gray-50">
                 <span className={`px-3 py-1 rounded-full text-xs font-medium ${job.type === '全职' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>{job.type}</span>
                <div className="relative" onClick={toggleExpand}>
                    <span className="text-sm font-medium text-gray-400 group-hover:text-indigo-600 transition-colors flex items-center">
                        {isExpanded ? (
                            <>
                                收起详情 <ChevronUp className="w-4 h-4 ml-1" />
                            </>
                        ) : (
                            <>
                                查看详情 <ChevronDown className="w-4 h-4 ml-1" />
                            </>
                        )}
                    </span>
                </div>
            </div>
            
            {/* Expanded Detail Section */}
            {isExpanded && (
                <div className="mt-6 pt-6 border-t border-gray-100 animate-in fade-in slide-in-from-top-1 duration-300">
                    <div className="mb-2">
                        <h4 className="font-bold text-lg text-gray-900">职位详情</h4>
                    </div>
                    <div className="w-full h-px bg-gray-100 my-3"></div>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line mb-6">{job.description}</p>
                    <button onClick={(e) => {
                        e.stopPropagation();
                        if (onChat && job.id && job.recruiter_id) {
                            onChat(Number(job.id), Number(job.recruiter_id));
                        } else {
                            handleSelect();
                        }
                    }} className="w-full bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium flex items-center justify-center">
                        <MessageSquare className="w-4 h-4 mr-2"/> 立即沟通
                    </button>
                </div>
            )}
        </div>
    );
};

export default JobCard;