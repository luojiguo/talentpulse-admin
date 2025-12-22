import React, { useState } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Eye, ChevronDown } from 'lucide-react';
import { JobPosting } from '@/types/types';

interface JobsViewProps {
  jobs: JobPosting[];
  onPostJob: () => void;
  onEditJob: (job: JobPosting) => void;
  onDeleteJob: (jobId: number | string) => void;
  onViewJob: (jobId: number | string) => void;
  onToggleJobStatus: (jobId: number | string, currentStatus: string) => void;
  currentUserId: number | string;
}

export const JobsView: React.FC<JobsViewProps> = ({
  jobs,
  onPostJob,
  onEditJob,
  onDeleteJob,
  onViewJob,
  onToggleJobStatus,
  currentUserId
}) => {
  // 状态管理
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [jobType, setJobType] = useState<'my' | 'company' | 'other'>('my');
  
  // 职位类型筛选
  const filteredByTypeJobs = jobs.filter(job => {
    if (jobType === 'my') {
      // 我发布的职位
      return job.is_own_job || job.posterId?.toString() === currentUserId.toString() || job.recruiter_id?.toString() === currentUserId.toString();
    } else if (jobType === 'company') {
      // 所有公司职位，包括当前HR发布的
      return true;
    } else if (jobType === 'other') {
      // 其他HR发布的职位，排除当前HR发布的
      return !job.is_own_job && job.posterId?.toString() !== currentUserId.toString() && job.recruiter_id?.toString() !== currentUserId.toString();
    }
    return true;
  });

  // 筛选和排序职位
  const filteredJobs = filteredByTypeJobs
    .filter(job => {
      const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (job.company?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
                          (job.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
                          job.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || job.status.toLowerCase() === filterStatus.toLowerCase();
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'postedDate') {
        const dateA = new Date(a.postedDate).getTime();
        const dateB = new Date(b.postedDate).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      }
      if (sortBy === 'updatedAt') {
        const dateA = a.updated_at ? new Date(a.updated_at).getTime() : new Date(a.postedDate).getTime();
        const dateB = b.updated_at ? new Date(b.updated_at).getTime() : new Date(b.postedDate).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      }
      if (sortBy === 'applicants') {
        return sortOrder === 'desc' ? b.applicants - a.applicants : a.applicants - b.applicants;
      }
      return 0;
    });

  // 获取发布人信息
  const getPosterInfo = (job: JobPosting) => {
    if (job.recruiter_name) {
      return job.recruiter_name;
    }
    if (job.posterId?.toString() === currentUserId.toString()) {
      return '我';
    }
    return '未知发布人';
  };

  // 获取职位类型标签 - 根据需求，所有职位列表中都不显示标签
  const getJobTypeLabel = (job: JobPosting) => {
    return null;
  };

  return (
    <div className="p-6">
      {/* 页面标题和操作栏 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">职位管理</h1>
          <p className="text-gray-500">管理您发布的所有职位</p>
        </div>
        <button
          onClick={onPostJob}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium shadow-md"
        >
          <Plus className="w-5 h-5" />
          发布新职位
        </button>
      </div>

      {/* 职位类型筛选标签页 */}
      <div className="mb-6">
        <div className="inline-flex rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
          <button
            onClick={() => setJobType('my')}
            className={`px-5 py-2.5 text-sm font-medium transition-colors ${jobType === 'my' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
          >
            我发布的职位
          </button>
          <button
            onClick={() => setJobType('company')}
            className={`px-5 py-2.5 text-sm font-medium transition-colors ${jobType === 'company' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
          >
            公司所有职位
          </button>
          <button
            onClick={() => setJobType('other')}
            className={`px-5 py-2.5 text-sm font-medium transition-colors ${jobType === 'other' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
          >
            同事发布的职位
          </button>
        </div>
      </div>

      {/* 搜索和筛选栏 */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="搜索职位名称、公司或地点"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>

          {/* 状态筛选 */}
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            >
              <option value="all">所有状态</option>
              <option value="active">发布中</option>
              <option value="closed">已关闭</option>
            </select>

            {/* 排序选择 */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [newSortBy, newSortOrder] = e.target.value.split('-');
                setSortBy(newSortBy as 'postedDate' | 'updatedAt' | 'applicants');
                setSortOrder(newSortOrder as 'asc' | 'desc');
              }}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            >
              <option value="updatedAt-desc">最新更新</option>
              <option value="updatedAt-asc">最早更新</option>
              <option value="postedDate-desc">最新发布</option>
              <option value="postedDate-asc">最早发布</option>
              <option value="applicants-desc">申请人数最多</option>
              <option value="applicants-asc">申请人数最少</option>
            </select>
          </div>

          {/* 更多筛选按钮 */}
          <div className="flex justify-end">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              <Filter className="w-5 h-5" />
              更多筛选
              <ChevronDown className="w-4 h-4 transition-transform" style={{ transform: isFilterOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
            </button>
          </div>
        </div>

        {/* 展开的筛选选项 */}
        {isFilterOpen && (
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">职位类型</label>
              <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none">
                <option value="all">所有类型</option>
                <option value="fulltime">全职</option>
                <option value="parttime">兼职</option>
                <option value="intern">实习</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">薪资范围</label>
              <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none">
                <option value="all">所有薪资</option>
                <option value="0-10k">0-10K</option>
                <option value="10k-20k">10K-20K</option>
                <option value="20k-30k">20K-30K</option>
                <option value="30k+">30K+</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">部门</label>
              <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none">
                <option value="all">所有部门</option>
                <option value="tech">技术部</option>
                <option value="product">产品部</option>
                <option value="design">设计部</option>
                <option value="operation">运营部</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* 职位列表 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">职位信息</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">地点</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">薪资</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">申请人数</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">发布日期</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden 2xl:table-cell">过期日期</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden 2xl:table-cell">更新日期</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">发布人</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-10 text-center text-gray-500">
                    暂无职位数据
                  </td>
                </tr>
              ) : (
                filteredJobs.map(job => (
                  <tr key={job.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="font-medium text-gray-900">{job.title}</div>
                        {getJobTypeLabel(job)}
                      </div>
                      <div className="text-sm text-gray-500">{job.company || job.company_name || '未设置公司'} · {job.department || '未设置部门'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                      {job.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 hidden md:table-cell">
                      {job.salary || '面议'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                      {job.applicants}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden xl:table-cell">
                      {job.postedDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden 2xl:table-cell">
                      {job.expire_date ? new Date(job.expire_date).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }) : '未设置'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden 2xl:table-cell">
                      {job.updated_at ? new Date(job.updated_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }) : '未更新'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                      {getPosterInfo(job)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${job.status.toLowerCase() === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {/* 始终显示查看按钮 */}
                        <button
                          onClick={() => onViewJob(job.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="查看职位"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {/* 只有在自己发布的职位中显示编辑、删除按钮，状态切换在编辑中处理 */}
                        {(job.is_own_job || job.posterId === currentUserId || job.recruiter_id === currentUserId) && jobType === 'my' && (
                          <>
                            <button
                              onClick={() => onEditJob(job)}
                              className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition"
                              title="编辑职位"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDeleteJob(job.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="删除职位"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 分页 */}
      {filteredJobs.length > 0 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-500">
            显示 <span className="font-medium">{filteredJobs.length}</span> 个职位
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
              上一页
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
              1
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
