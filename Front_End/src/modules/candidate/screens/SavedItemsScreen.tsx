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
      if (activeTab === 'jobs') {
        const response = await candidateAPI.getCandidateSavedJobs(currentUser.id);
        if (response.status === 'success') {
          setSavedJobs(response.data || []);
        }
      } else {
        const response = await candidateAPI.getCandidateSavedCompanies(currentUser.id);
        if (response.status === 'success') {
          setSavedCompanies(response.data || []);
        }
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
      if (response.status === 'success') {
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
      if (response.status === 'success') {
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">我的收藏</h1>
        <p className="text-gray-600">管理您收藏的职位和公司</p>
      </div>

      {/* 标签切换 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('jobs')}
            className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
              activeTab === 'jobs'
                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Briefcase className="w-5 h-5 inline-block mr-2" />
            收藏的职位 ({savedJobs.length})
          </button>
          <button
            onClick={() => setActiveTab('companies')}
            className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
              activeTab === 'companies'
                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Building className="w-5 h-5 inline-block mr-2" />
            收藏的公司 ({savedCompanies.length})
          </button>
        </div>

        {/* 搜索框 */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={activeTab === 'jobs' ? '搜索职位、公司或地点...' : '搜索公司名称、行业或地址...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>
        </div>

        {/* 内容区域 */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-200 border-t-indigo-600"></div>
              <p className="mt-4 text-gray-500">加载中...</p>
            </div>
          ) : activeTab === 'jobs' ? (
            filteredJobs.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  {searchTerm ? '没有找到匹配的收藏职位' : '您还没有收藏任何职位'}
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => navigate('/')}
                    className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    去浏览职位
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredJobs.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => navigate(`/job/${job.id}`)}
                    className="bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition-colors cursor-pointer border border-gray-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{job.title || '未知职位'}</h3>
                          <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                            <Heart className="w-3 h-3 inline-block mr-1" />
                            已收藏
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                          {job.company_name && (
                            <div className="flex items-center gap-1">
                              <Building className="w-4 h-4" />
                              {job.company_name}
                            </div>
                          )}
                          {job.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {job.location}
                            </div>
                          )}
                          {job.salary && (
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              {job.salary}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          收藏于 {new Date(job.saved_at).toLocaleDateString('zh-CN')}
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleRemoveJob(job.id, e)}
                        className="ml-4 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
              <div className="text-center py-12">
                <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  {searchTerm ? '没有找到匹配的收藏公司' : '您还没有收藏任何公司'}
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => navigate('/')}
                    className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    去浏览公司
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCompanies.map((company) => (
                  <div
                    key={company.id}
                    className="bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition-colors cursor-pointer border border-gray-200 relative"
                  >
                    <button
                      onClick={(e) => handleRemoveCompany(company.id, e)}
                      className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors z-10"
                      title="取消收藏"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-3 mb-3">
                      {company.logo ? (
                        <img
                          src={company.logo}
                          alt={company.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                          <Building className="w-6 h-6 text-indigo-600" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">{company.name || '未知公司'}</h3>
                        {company.industry && (
                          <p className="text-sm text-gray-500 truncate">{company.industry}</p>
                        )}
                      </div>
                    </div>
                    {company.address && (
                      <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate">{company.address}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-500 pt-3 border-t border-gray-200">
                      <Calendar className="w-3 h-3" />
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

