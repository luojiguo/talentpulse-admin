import React, { useState } from 'react';
import { useI18n } from '@/contexts/i18nContext';
import { Plus, Search, Filter, Edit, Trash2, Eye, ChevronDown, Briefcase } from 'lucide-react';
import { processAvatarUrl } from '@/components/AvatarUploadComponent';
import { JobPosting } from '@/types/types';

interface JobsViewProps {
  jobs: JobPosting[];
  onPostJob: () => void;
  onEditJob: (job: JobPosting) => void;
  onDeleteJob: (jobId: number | string) => void;
  onViewJob: (jobId: number | string) => void;
  onToggleJobStatus: (jobId: number | string, currentStatus: string) => void;
  currentUserId: number | string;
  profile?: any;
}

export const JobsView: React.FC<JobsViewProps> = ({
  jobs,
  onPostJob,
  onEditJob,
  onDeleteJob,
  onViewJob,
  onToggleJobStatus,
  currentUserId,
  profile
}) => {
  const { language, t } = useI18n();
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
      return language === 'zh' ? '我' : 'Me';
    }
    return language === 'zh' ? '未知发布人' : 'Unknown';
  };

  // 获取职位类型标签 - 根据需求，所有职位列表中都不显示标签
  const getJobTypeLabel = (job: JobPosting) => {
    return null;
  };

  return (
    <div className="p-6">
      {/* 页面标题和操作栏 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-6">
        <div className="flex items-center gap-5">
          {profile?.company?.logo && profile.company.logo !== 'C' && (
            <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-slate-100 dark:border-slate-700 flex items-center justify-center overflow-hidden p-2">
              <img
                src={processAvatarUrl(profile.company.logo)}
                alt="Company Logo"
                className="max-w-full max-h-full object-contain"
              />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{t.recruiter.jobsTitle}</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">{language === 'zh' ? '管理' : 'Manage'} {profile?.company?.name || (language === 'zh' ? '公司' : 'Company')} {language === 'zh' ? '发布的所有职位' : 'all posted positions'}</p>
          </div>
        </div>
        <button
          onClick={onPostJob}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all font-bold shadow-xl shadow-blue-200 dark:shadow-blue-900/20 active:scale-95 group"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
          {t.recruiter.createJob}
        </button>
      </div>

      {/* 职位类型筛选标签页 */}
      <div className="mb-8">
        <div className="inline-flex p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
          <button
            onClick={() => setJobType('my')}
            className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-all ${jobType === 'my' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
          >
            {t.recruiter.myJobs}
          </button>
          <button
            onClick={() => setJobType('company')}
            className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-all ${jobType === 'company' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
          >
            {t.recruiter.allJobs}
          </button>
          <button
            onClick={() => setJobType('other')}
            className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-all ${jobType === 'other' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
          >
            {t.recruiter.colleagueJobs}
          </button>
        </div>
      </div>

      {/* 搜索和筛选栏 */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5 mb-8 border border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 搜索框 */}
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-blue-600 transition-colors" />
            <input
              type="text"
              placeholder={t.recruiter.searchJobsPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all bg-white dark:bg-slate-900 dark:text-slate-200 font-medium"
            />
          </div>

          {/* 状态筛选 */}
          <div className="flex gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="flex-1 px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all bg-white dark:bg-slate-900 dark:text-slate-200 font-medium cursor-pointer"
            >
              <option value="all">{t.recruiter.anyStatus}</option>
              <option value="active">{t.recruiter.activeStatus}</option>
              <option value="closed">{t.recruiter.closedStatus}</option>
            </select>

            {/* 排序选择 */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [newSortBy, newSortOrder] = e.target.value.split('-');
                setSortBy(newSortBy as 'postedDate' | 'updatedAt' | 'applicants');
                setSortOrder(newSortOrder as 'asc' | 'desc');
              }}
              className="flex-1 px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all bg-white dark:bg-slate-900 dark:text-slate-200 font-medium cursor-pointer"
            >
              <option value="updatedAt-desc">按更新时间 (新-旧)</option>
              <option value="updatedAt-asc">按更新时间 (旧-新)</option>
              <option value="postedDate-desc">按发布时间 (新-旧)</option>
              <option value="postedDate-asc">按发布时间 (旧-新)</option>
              <option value="applicants-desc">申请人数 (多-少)</option>
              <option value="applicants-asc">申请人数 (少-多)</option>
            </select>
          </div>

          {/* 更多筛选按钮 */}
          <div className="flex justify-end">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center gap-2 px-5 py-3 border rounded-xl transition-all font-bold active:scale-95 ${isFilterOpen ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50'}`}
            >
              <Filter className="w-5 h-5" />
              {t.recruiter.filterConditions}
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isFilterOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* 展开的筛选选项 */}
        {isFilterOpen && (
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">职位类型</label>
              <select className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                <option value="all">所有类型</option>
                <option value="fulltime">全职</option>
                <option value="parttime">兼职</option>
                <option value="intern">实习</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">薪资范围</label>
              <select className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                <option value="all">所有薪资</option>
                <option value="0-10k">0-10K</option>
                <option value="10k-20k">10K-20K</option>
                <option value="20k-30k">20K-30K</option>
                <option value="30k+">30K+</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">部门</label>
              <select className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none">
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
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700/50">
                <th className="px-6 py-4 text-left text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">职位详情</th>
                <th className="px-6 py-4 text-left text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest hidden sm:table-cell">城市地区</th>
                <th className="px-6 py-4 text-left text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest hidden md:table-cell">薪酬范围</th>
                <th className="px-6 py-4 text-left text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest hidden lg:table-cell">申请热度</th>
                <th className="px-6 py-4 text-left text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest hidden xl:table-cell">发布日期</th>
                <th className="px-6 py-4 text-left text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest hidden 2xl:table-cell">更新动态</th>
                <th className="px-6 py-4 text-left text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest hidden lg:table-cell">发布负责人</th>
                <th className="px-6 py-4 text-left text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">当前状态</th>
                <th className="px-6 py-4 text-right text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-10 text-center text-gray-500">
                    {t.common.noData}
                  </td>
                </tr>
              ) : (
                filteredJobs.map(job => (
                  <tr key={job.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {job.company_logo && job.company_logo !== 'C' ? (
                          <div className="w-10 h-10 flex-shrink-0 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 flex items-center justify-center overflow-hidden p-1">
                            <img
                              src={processAvatarUrl(job.company_logo)}
                              alt="Company"
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 flex-shrink-0 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400">
                            <Briefcase className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <div className="font-medium text-slate-900 dark:text-slate-100">{job.title}</div>
                            {getJobTypeLabel(job)}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {job.company || job.company_name || '未设置公司'} · {job.department || '未设置部门'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400 hidden sm:table-cell">
                      {job.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100 hidden md:table-cell">
                      {job.salary || '面议'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400 hidden lg:table-cell">
                      {job.applicants}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400 hidden xl:table-cell">
                      {job.postedDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400 hidden 2xl:table-cell">
                      {job.expire_date ? new Date(job.expire_date).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }) : '未设置'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400 hidden 2xl:table-cell">
                      {job.updated_at ? new Date(job.updated_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }) : '未更新'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400 hidden lg:table-cell">
                      {getPosterInfo(job)}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black tracking-wide ${job.status.toLowerCase() === 'active'
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                        {job.status.toLowerCase() === 'active' ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mr-2 animate-pulse"></span>
                            {t.recruiter.activeStatus}
                          </>
                        ) : t.recruiter.closedStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {/* 始终显示查看按钮 */}
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onViewJob(job.id)}
                            className="p-2.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all active:scale-90"
                            title="查看详情"
                          >
                            <Eye className="w-4.5 h-4.5" />
                          </button>

                          {(job.is_own_job || job.posterId === currentUserId || job.recruiter_id === currentUserId) && jobType === 'my' && (
                            <>
                              <button
                                onClick={() => onEditJob(job)}
                                className="p-2.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-xl transition-all active:scale-90"
                                title="快捷编辑"
                              >
                                <Edit className="w-4.5 h-4.5" />
                              </button>
                              <button
                                onClick={() => onDeleteJob(job.id)}
                                className="p-2.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-all active:scale-90"
                                title="移除职位"
                              >
                                <Trash2 className="w-4.5 h-4.5" />
                              </button>
                            </>
                          )}
                        </div>
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
            <button className="px-3 py-1 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
              上一页
            </button>
            <button className="px-3 py-1 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold rounded hover:bg-slate-50 dark:hover:bg-slate-700">
              1
            </button>
            <button className="px-3 py-1 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
