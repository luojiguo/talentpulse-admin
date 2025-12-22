import React, { useState, useEffect, useMemo } from 'react';
import { Search } from 'lucide-react';
import { TRANSLATIONS } from '@/constants/constants';
import { candidateAPI } from '@/services/apiService';
import { Candidate, Language } from '@/types/types';

const CandidatesView: React.FC<{ lang: Language }> = ({ lang }) => {
    const t = TRANSLATIONS[lang].candidates;
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // 从API获取候选人数据
    React.useEffect(() => {
        const fetchCandidates = async () => {
            try {
                setLoading(true);
                const response = await candidateAPI.getAllCandidates();
                
                // 将数据库返回的候选人数据转换为前端所需的格式
                if (!response.data || !Array.isArray(response.data)) {
                    setCandidates([]);
                    return;
                }
                
                const formattedCandidates: Candidate[] = response.data.map((candidate: any, index: number) => ({
                    id: candidate.id?.toString() || `temp-${index}`,
                    name: candidate.name || '未知姓名',
                    role: candidate.desired_position || '',
                    experience: candidate.work_experience_years ? `${candidate.work_experience_years}年` : '无经验',
                    status: 'Available', // 从数据库获取状态，如果没有则默认为Available
                    location: candidate.address || '',
                    skills: Array.isArray(candidate.skills) ? candidate.skills : [],
                    avatar: candidate.avatar || ''
                }));
                
                setCandidates(formattedCandidates);
            } catch (error) {
                setCandidates([]);
            } finally {
                setLoading(false);
            }
        };
        
        fetchCandidates();
    }, []);
    
    // 筛选候选人数据
    const filteredCandidates = useMemo(() => {
        return candidates.filter(candidate => 
            (searchTerm === '' || 
             candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             candidate.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
             candidate.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase())))
        );
    }, [candidates, searchTerm]);
    
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t.title}</h1>
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex gap-4 justify-between items-center">
                    <div className="flex gap-2 items-center w-full md:w-auto">
                        <Search className="text-slate-400 w-5 h-5" />
                        <input 
                            type="text" 
                            placeholder="搜索候选人姓名、职位或技能..." 
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)} 
                            className="bg-transparent focus:outline-none text-sm w-full md:w-64"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
                            <tr>
                                <th className="px-6 py-3 text-left">{t.name}</th>
                                <th className="px-6 py-3 text-left">{t.role}</th>
                                <th className="px-6 py-3 text-left">{t.exp}</th>
                                <th className="px-6 py-3 text-left">{t.status}</th>
                                <th className="px-6 py-3 text-left">{t.skills}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                        加载中...
                                    </td>
                                </tr>
                            ) : filteredCandidates.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                        没有找到匹配的候选人
                                    </td>
                                </tr>
                            ) : (
                                filteredCandidates.map(c => (
                                    <tr key={c.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600/50">
                                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{c.name}</td>
                                        <td className="px-6 py-4">{c.role}</td>
                                        <td className="px-6 py-4">{c.experience}</td>
                                        <td className="px-6 py-4">{c.status}</td>
                                        <td className="px-6 py-4 max-w-xs truncate">{c.skills.join(', ')}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CandidatesView;