import React, { useState, useEffect, useMemo } from 'react';
import { Search } from 'lucide-react';
import { TRANSLATIONS } from '@/constants/constants';
import { applicationAPI } from '@/services/apiService';
import { Application, Language } from '@/types/types';

const ApplicationsView: React.FC<{ lang: Language }> = ({ lang }) => {
    const t = TRANSLATIONS[lang].applications;
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const getStageColor = (stage: Application['stage']) => {
        switch(stage) {
            case 'Applied': return 'bg-blue-100 text-blue-700';
            case 'Screening': return 'bg-indigo-100 text-indigo-700';
            case 'Interview': return 'bg-amber-100 text-amber-700';
            case 'Offer': return 'bg-purple-100 text-purple-700';
            case 'Hired': return 'bg-green-100 text-green-700';
            case 'Rejected': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    // 从API获取申请数据
    React.useEffect(() => {
        const fetchApplications = async () => {
            try {
                setLoading(true);
                const response = await applicationAPI.getAllApplications();
                setApplications(response.data);
            } catch (error) {
                console.error('获取申请数据失败:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchApplications();
    }, []);

    // 筛选申请数据
    const filteredApplications = useMemo(() => {
        return applications.filter(app => 
            (searchTerm === '' || 
             app.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
             app.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
             app.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
             app.stage.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [applications, searchTerm]);
    
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t.title}</h1>
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex gap-4 justify-between items-center">
                    <div className="flex gap-2 items-center w-full md:w-auto">
                        <Search className="text-slate-400 w-5 h-5" />
                        <input 
                            type="text" 
                            placeholder="搜索候选人、职位、公司或阶段..." 
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)} 
                            className="bg-transparent focus:outline-none text-sm w-full md:w-64"
                        />
                    </div>
                </div>
                <table className="w-full text-sm">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
                    <tr>
                        <th className="px-6 py-3 text-left">{t.candidate}</th>
                        <th className="px-6 py-3 text-left">{t.job}</th>
                        <th className="px-6 py-3 text-left">{t.company}</th>
                        <th className="px-6 py-3 text-left">{t.stage}</th>
                        <th className="px-6 py-3 text-left">{t.date}</th>
                    </tr>
                </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                    加载中...
                                </td>
                            </tr>
                        ) : filteredApplications.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                    没有找到匹配的申请
                                </td>
                            </tr>
                        ) : (
                            filteredApplications.map(app => (
                                <tr key={app.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600/50">
                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{app.candidateName}</td>
                                    <td className="px-6 py-4">{app.jobTitle}</td>
                                    <td className="px-6 py-4">{app.companyName}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStageColor(app.stage as Application['stage'])}`}>
                                            {app.stage}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">{new Date(app.appliedDate).toLocaleDateString()}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ApplicationsView;