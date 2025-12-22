import React from 'react';
import { ChevronLeft, Edit, Share2, MapPin, Briefcase, User, Calendar } from 'lucide-react';
import { JobPosting } from '@/types/types';

interface RecruiterJobDetailProps {
    job: JobPosting;
    onBack: () => void;
}

const RecruiterJobDetail: React.FC<RecruiterJobDetailProps> = ({ job, onBack }) => {
    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <button onClick={onBack} className="flex items-center text-gray-500 hover:text-emerald-600 font-medium transition-colors mb-2 px-3 py-1.5 rounded-lg hover:bg-emerald-50 w-fit">
                <ChevronLeft className="w-5 h-5 mr-1"/> 返回职位列表
            </button>

            <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center"><MapPin className="w-4 h-4 mr-1 text-emerald-500"/> {job.location}</span>
                        <span className="flex items-center"><Briefcase className="w-4 h-4 mr-1 text-emerald-500"/> {job.experience || '经验不限'}</span>
                        <span className="flex items-center"><User className="w-4 h-4 mr-1 text-emerald-500"/> {job.type}</span>
                        <span className="flex items-center"><Calendar className="w-4 h-4 mr-1 text-emerald-500"/> 发布于: {job.postedDate}</span>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-3">
                    <span className="text-2xl font-bold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg">{job.salary}</span>
                    <div className="flex gap-2">
                         <span className={`px-3 py-1 rounded-full text-xs font-medium border ${job.status === 'Active' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                            {job.status === 'Active' ? '招聘中' : '已关闭'}
                        </span>
                        <button className="p-2 text-gray-400 hover:text-emerald-600 bg-gray-50 hover:bg-emerald-50 rounded-lg transition border border-transparent hover:border-emerald-100" title="编辑职位">
                            <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 rounded-lg transition border border-transparent hover:border-blue-100" title="分享职位">
                            <Share2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
                            <div className="w-1 h-5 bg-emerald-600 mr-2 rounded-full"></div> 职位描述 (JD)
                        </h3>
                        <div className="text-gray-600 leading-7 whitespace-pre-line text-sm md:text-base">
                            {job.description || "暂无描述"}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">招聘数据</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-center">
                                <p className="text-2xl font-bold text-blue-600">{job.applicants}</p>
                                <p className="text-xs text-blue-800 mt-1">总申请数</p>
                            </div>
                            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 text-center">
                                <p className="text-2xl font-bold text-emerald-600">{Math.floor(job.applicants * 0.4)}</p>
                                <p className="text-xs text-emerald-800 mt-1">今日浏览</p>
                            </div>
                            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-center">
                                <p className="text-2xl font-bold text-amber-600">5</p>
                                <p className="text-xs text-amber-800 mt-1">面试中</p>
                            </div>
                            <div className="bg-violet-50 p-4 rounded-xl border border-violet-100 text-center">
                                <p className="text-2xl font-bold text-violet-600">2</p>
                                <p className="text-xs text-violet-800 mt-1">待沟通</p>
                            </div>
                        </div>
                        <button className="w-full mt-4 py-2.5 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition shadow-sm text-sm">
                            查看候选人列表
                        </button>
                    </div>

                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl text-white shadow-lg">
                        <h3 className="font-bold text-lg mb-2">AI 建议</h3>
                        <p className="text-slate-300 text-sm mb-4 leading-relaxed">该职位的浏览量比平均水平高 20%，但申请转化率略低。建议优化薪资范围展示或增加福利描述。</p>
                        <button className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition">优化建议</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RecruiterJobDetail;