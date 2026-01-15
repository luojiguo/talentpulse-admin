import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { candidateAPI } from '@/services/apiService';
import { Briefcase, Building, Heart, MapPin, DollarSign, Calendar, X, Search } from 'lucide-react';

interface SavedJob {
  id: number;
  title: string;
  company_name?: string;
  location?: string;
  salary?: string;
  saved_at: string;
  [key: string]: any;
}

interface SavedCompany {
  id: number;
  name: string;
  industry?: string;
  address?: string;
  logo?: string;
  saved_at: string;
  [key: string]: any;
}

interface SavedItemsScreenProps {
  currentUser: { id: number | string };
}

const SavedItemsScreen: React.FC<SavedItemsScreenProps> = ({ currentUser }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'jobs' | 'companies'>('jobs');
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [savedCompanies, setSavedCompanies] = useState<SavedCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSavedItems();
  }, [activeTab, currentUser?.id]);

  const fetchSavedItems = async () => {
    if (!currentUser?.id) return;

    try {
      setLoading(true);
      // 同时获取收藏的职位和公司，而不仅仅是当前标签的数据
      const [jobsResponse, companiesResponse] = await Promise.all([
        candidateAPI.getCandidateSavedJobs(currentUser.id),
        candidateAPI.getCandidateSavedCompanies(currentUser.id)
      ]);

      // 更新职位数据
      if ((jobsResponse as any).data?.status === 'success' || (jobsResponse as any).status === 'success') {
        setSavedJobs(jobsResponse.data || []);
      }

      // 更新公司数据
      if ((companiesResponse as any).data?.status === 'success' || (companiesResponse as any).status === 'success') {
        setSavedCompanies(companiesResponse.data || []);
      }
    } catch (error: any) {
      console.error('获取收藏失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveJob = async (jobId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await candidateAPI.removeSavedJob(currentUser.id, jobId);
      if ((response as any).data?.status === 'success' || (response as any).status === 'success') {
        setSavedJobs(prev => prev.filter(job => job.id !== jobId));
      }
    } catch (error: any) {
      console.error('取消收藏失败:', error);
      alert('取消收藏失败，请重试');
    }
  };

  const handleRemoveCompany = async (companyId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await candidateAPI.removeSavedCompany(currentUser.id, companyId);
      if ((response as any).data?.status === 'success' || (response as any).status === 'success') {
        setSavedCompanies(prev => prev.filter(company => company.id !== companyId));
      }
    } catch (error: any) {
      console.error('取消收藏失败:', error);
      alert('取消收藏失败，请重试');
    }
  };

  const filteredJobs = savedJobs.filter(job => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      job.title?.toLowerCase().includes(term) ||
      job.company_name?.toLowerCase().includes(term) ||
      job.location?.toLowerCase().includes(term)
    );
  });

  const filteredCompanies = savedCompanies.filter(company => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      company.name?.toLowerCase().includes(term) ||
      company.industry?.toLowerCase().includes(term) ||
      company.address?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">我的收藏</h1>
          <p className="text-slate-500 dark:text-slate-400">管理您收藏的职位和公司</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder={activeTab === 'jobs' ? '搜索职位、公司或地点...' : '搜索公司名称、行业或地址...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:text-slate-200 text-sm shadow-sm"
          />
        </div>
      </div>

      {/* 标签切换 */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-8 overflow-hidden">
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('jobs')}
            className={`flex-1 px-6 py-4 text-center font-bold transition-all relative ${activeTab === 'jobs'
              ? 'text-brand-600 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-900/10'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900/50'
              }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Briefcase className="w-5 h-5" />
              <span>收藏的职位 ({savedJobs.length})</span>
            </div>
            {activeTab === 'jobs' && (
              <div className="absolute bottom-0 left-0 w-full h-1 bg-brand-500 rounded-t-full"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('companies')}
            className={`flex-1 px-6 py-4 text-center font-bold transition-all relative ${activeTab === 'companies'
              ? 'text-brand-600 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-900/10'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900/50'
              }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Building className="w-5 h-5" />
              <span>收藏的公司 ({savedCompanies.length})</span>
            </div>
            {activeTab === 'companies' && (
              <div className="absolute bottom-0 left-0 w-full h-1 bg-brand-500 rounded-t-full"></div>
            )}
          </button>
        </div>

        {/* 内容区域 */}
        <div className="p-6 min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-brand-100 border-t-brand-500 rounded-full animate-spin"></div>
              <p className="mt-4 text-slate-500 dark:text-slate-400">加载中...</p>
            </div>
          ) : activeTab === 'jobs' ? (
            filteredJobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4">
                  <Briefcase className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">
                  {searchTerm ? '没有找到匹配的收藏职位' : '您还没有收藏任何职位'}
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => navigate('/')}
                    className="mt-6 px-6 py-2.5 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-all font-bold shadow-lg shadow-brand-100 dark:shadow-none active:scale-95"
                  >
                    去浏览职位
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredJobs.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => navigate(`/job/${job.id}`)}
                    className="bg-white dark:bg-slate-900/50 rounded-2xl p-6 hover:shadow-lg hover:shadow-brand-100/50 dark:hover:shadow-none hover:border-brand-200 dark:hover:border-brand-900 transition-all cursor-pointer border border-slate-100 dark:border-slate-700 group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          <h3 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{job.title || '未知职位'}</h3>
                          <span className="px-2.5 py-0.5 bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-full text-xs font-bold flex items-center gap-1 border border-brand-100 dark:border-brand-800">
                            <Heart className="w-3 h-3 fill-current" />
                            已收藏
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-sm text-slate-600 dark:text-slate-400 mb-4">
                          {job.company_name && (
                            <div className="flex items-center gap-1.5 font-medium">
                              <Building className="w-4 h-4 text-brand-500" />
                              {job.company_name}
                            </div>
                          )}
                          {job.location && (
                            <div className="flex items-center gap-1.5 font-medium">
                              <MapPin className="w-4 h-4 text-brand-500" />
                              {job.location}
                            </div>
                          )}
                          {job.salary && (
                            <div className="flex items-center gap-0.5 font-black text-lg" style={{ color: '#007AFF' }}>
                              <span>¥</span>
                              {job.salary}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 font-medium">
                          <Calendar className="w-3.5 h-3.5" />
                          收藏于 {new Date(job.saved_at).toLocaleDateString('zh-CN')}
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleRemoveJob(job.id, e)}
                        className="p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all active:scale-90"
                        title="取消收藏"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            filteredCompanies.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4">
                  <Building className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">
                  {searchTerm ? '没有找到匹配的收藏公司' : '您还没有收藏任何公司'}
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => navigate('/')}
                    className="mt-6 px-6 py-2.5 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-all font-bold shadow-lg shadow-brand-100 dark:shadow-none active:scale-95"
                  >
                    去浏览公司
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCompanies.map((company) => (
                  <div
                    key={company.id}
                    className="bg-white dark:bg-slate-900/50 rounded-2xl p-6 hover:shadow-lg hover:shadow-brand-100/50 dark:hover:shadow-none hover:border-brand-200 dark:hover:border-brand-900 transition-all cursor-pointer border border-slate-100 dark:border-slate-700 relative group"
                    onClick={() => navigate(`/company/${company.id}`)}
                  >
                    <button
                      onClick={(e) => handleRemoveCompany(company.id, e)}
                      className="absolute top-4 right-4 p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all z-10 active:scale-90"
                      title="取消收藏"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-4 mb-5">
                      {company.logo ? (
                        <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700 p-2 shadow-sm">
                          <img
                            src={company.logo}
                            alt={company.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="w-14 h-14 bg-brand-50 dark:bg-brand-900/30 rounded-xl flex items-center justify-center border border-brand-100 dark:border-brand-800">
                          <Building className="w-7 h-7 text-brand-500" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{company.name || '未知公司'}</h3>
                        {company.industry && (
                          <p className="text-sm text-slate-500 dark:text-slate-400 truncate font-medium">{company.industry}</p>
                        )}
                      </div>
                    </div>
                    {company.address && (
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-5">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="truncate">{company.address}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                      <Calendar className="w-3.5 h-3.5" />
                      收藏于 {new Date(company.saved_at).toLocaleDateString('zh-CN')}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default SavedItemsScreen;

