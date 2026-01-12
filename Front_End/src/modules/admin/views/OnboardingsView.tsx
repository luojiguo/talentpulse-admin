import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Calendar, Clock, MapPin, FileText, CheckCircle, XCircle, AlertCircle, Download, Settings, Check, User, Phone } from 'lucide-react';
import { TRANSLATIONS } from '@/constants/constants';
import { onboardingAPI } from '@/services/apiService';
import { Language } from '@/types/types';
import Pagination from '@/components/Pagination';
import { exportToCSV } from '../helpers';
import { AdminOnboardingDetailModal } from '../components/AdminOnboardingDetailModal';

interface Onboarding {
  id: number;
  applicationId: number;
  onboardingDate: string;
  status: string;
  notes?: string;
  onboardingTime?: string;
  onboardingLocation?: string;
  onboardingContact?: string;
  onboardingContactPhone?: string;
  officialSalary?: string;
  probationSalary?: string;
  probationPeriod?: number;
  candidateName?: string;
  candidateAvatar?: string;
  candidateEmail?: string;
  candidatePhone?: string;
  jobTitle?: string;
  jobLocation?: string;
  jobSalary?: string;
  companyName?: string;
}

const OnboardingsView: React.FC<{ lang: Language }> = ({ lang }) => {
  const t = TRANSLATIONS[lang];
  const [onboardings, setOnboardings] = useState<Onboarding[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Modal state
  const [selectedOnboarding, setSelectedOnboarding] = useState<Onboarding | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Column visibility state
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const [visibleColumns, setVisibleColumns] = useState({
    candidate: true,
    job: true,
    company: true,
    date: true,
    time: true,
    location: true,
    contact: true,
    status: true,
    email: false,
    phone: false,
    salary: false,
    probation: false,
    notes: false
  });

  // Click outside handler for column settings popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowColumnSettings(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchOnboardings = async () => {
      try {
        setLoading(true);
        const response = await onboardingAPI.getAllOnboardings();
        if ((response as any).status === 'success') {
          setOnboardings(response.data || []);
        }
      } catch (error) {
        console.error('获取入职数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOnboardings();
  }, []);

  const filteredOnboardings = useMemo(() => {
    return onboardings.filter(onboarding => {
      const matchesSearch = searchTerm === '' ||
        onboarding.candidateName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        onboarding.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        onboarding.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        onboarding.onboardingContact?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || onboarding.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [onboardings, searchTerm, statusFilter]);

  // 计算分页数据
  const paginatedOnboardings = useMemo(() => {
    setTotalItems(filteredOnboardings.length);
    const startIndex = (currentPage - 1) * pageSize;
    return filteredOnboardings.slice(startIndex, startIndex + pageSize);
  }, [filteredOnboardings, currentPage, pageSize]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Scheduled':
      case '已安排':
        return 'bg-blue-100 text-blue-700';
      case 'Completed':
      case '已完成':
        return 'bg-green-100 text-green-700';
      case 'Pending':
      case '待安排':
      case '待处理':
        return 'bg-amber-100 text-amber-700';
      case 'Cancelled':
      case '已取消':
        return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'Scheduled': return '已安排';
      case 'Completed': return '已完成';
      case 'Pending': return '待安排';
      case 'Cancelled': return '已取消';
      default: return status;
    }
  };

  const handleViewDetails = (onboarding: Onboarding) => {
    setSelectedOnboarding(onboarding);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex gap-4 justify-between items-center flex-wrap">
          <div className="flex gap-2 items-center w-full md:w-auto">
            <Search className="text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="搜索候选人、职位、联系人..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-transparent focus:outline-none text-sm w-full md:w-64"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全部状态</option>
              <option value="已安排">已安排</option>
              <option value="待安排">待安排</option>
              <option value="已完成">已完成</option>
              <option value="已取消">已取消</option>
            </select>

            <div className="relative" ref={settingsRef}>
              <button
                onClick={() => setShowColumnSettings(!showColumnSettings)}
                className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                title="列设置"
              >
                <Settings size={20} />
              </button>

              {showColumnSettings && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 p-4 font-sans">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <Settings size={16} />
                    显示/隐藏列
                  </h4>
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-2 text-xs">
                    {Object.entries(visibleColumns).map(([key, isVisible]) => (
                      <button
                        key={key}
                        onClick={() => setVisibleColumns(prev => ({ ...prev, [key]: !isVisible }))}
                        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group"
                      >
                        <span className="capitalize">{
                          key === 'candidate' ? '候选人' :
                            key === 'job' ? '职位' :
                              key === 'company' ? '公司' :
                                key === 'date' ? '入职日期' :
                                  key === 'time' ? '报到时间' :
                                    key === 'location' ? '入职地点' :
                                      key === 'contact' ? '联系人' :
                                        key === 'status' ? '状态' :
                                          key === 'email' ? '邮箱' :
                                            key === 'phone' ? '电话' :
                                              key === 'salary' ? '薪资待遇' :
                                                key === 'probation' ? '试用期' :
                                                  key === 'notes' ? '备注信息' : key
                        }</span>
                        {isVisible && <Check size={14} className="text-indigo-500" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => exportToCSV(filteredOnboardings, 'onboardings')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white text-sm font-medium rounded-lg hover:bg-slate-900 transition-all font-sans"
              disabled={loading}
              title="导出数据"
            >
              <Download size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
              <tr>
                {visibleColumns.candidate && <th className="px-6 py-3 text-left">候选人</th>}
                {visibleColumns.job && <th className="px-6 py-3 text-left">职位</th>}
                {visibleColumns.company && <th className="px-6 py-3 text-left">公司</th>}
                {visibleColumns.email && <th className="px-6 py-3 text-left">邮箱</th>}
                {visibleColumns.phone && <th className="px-6 py-3 text-left">电话</th>}
                {visibleColumns.date && <th className="px-6 py-3 text-left">入职日期</th>}
                {visibleColumns.time && <th className="px-6 py-3 text-left">报到时间</th>}
                {visibleColumns.location && <th className="px-6 py-3 text-left">入职地点</th>}
                {visibleColumns.salary && <th className="px-6 py-3 text-left">薪资待遇</th>}
                {visibleColumns.probation && <th className="px-6 py-3 text-left">试用期</th>}
                {visibleColumns.contact && <th className="px-6 py-3 text-left">联系人</th>}
                {visibleColumns.status && <th className="px-6 py-3 text-left">状态</th>}
                {visibleColumns.notes && <th className="px-6 py-3 text-left">备注</th>}
                <th className="px-6 py-3 text-left">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={Object.values(visibleColumns).filter(Boolean).length + 1} className="px-6 py-8 text-center text-slate-500 font-sans">
                    加载中...
                  </td>
                </tr>
              ) : filteredOnboardings.length === 0 ? (
                <tr>
                  <td colSpan={Object.values(visibleColumns).filter(Boolean).length + 1} className="px-6 py-8 text-center text-slate-500 font-sans">
                    {onboardings.length === 0 ? '暂无入职记录' : '没有找到匹配的入职记录'}
                  </td>
                </tr>
              ) : (
                paginatedOnboardings.map(onboarding => (
                  <tr key={onboarding.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600/50">
                    {visibleColumns.candidate && (
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white font-sans">
                        <div className="flex items-center gap-3">
                          <div className="relative h-8 w-8 flex-shrink-0">
                            {/* Base Layer: Initials */}
                            <div className="h-full w-full rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold border border-white dark:border-slate-800 shadow-sm text-[10px]">
                              {onboarding.candidateName?.charAt(0) || '?'}
                            </div>

                            {/* Top Layer: Image */}
                            {onboarding.candidateAvatar && (
                              <img
                                src={onboarding.candidateAvatar.startsWith('http') ? onboarding.candidateAvatar : `http://localhost:3001${onboarding.candidateAvatar}`}
                                alt={onboarding.candidateName}
                                className="absolute inset-0 h-full w-full rounded-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            )}
                          </div>
                          <span>{onboarding.candidateName || '未知'}</span>
                        </div>
                      </td>
                    )}
                    {visibleColumns.job && <td className="px-6 py-4 text-xs font-sans">{onboarding.jobTitle || '未知'}</td>}
                    {visibleColumns.company && (
                      <td className="px-6 py-4 text-xs font-sans">
                        <div className="flex items-center gap-3">
                          <div className="relative h-8 w-8 flex-shrink-0">
                            {/* Base Layer: Initials */}
                            <div className="h-full w-full rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold border border-white dark:border-slate-800 shadow-sm text-[10px]">
                              {onboarding.companyName?.charAt(0) || '?'}
                            </div>

                            {/* Top Layer: Image */}
                            {(onboarding as any).companyLogo && (
                              <img
                                src={(onboarding as any).companyLogo.startsWith('http') ? (onboarding as any).companyLogo : `http://localhost:3001${(onboarding as any).companyLogo}`}
                                alt={onboarding.companyName}
                                className="absolute inset-0 h-full w-full rounded object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            )}
                          </div>
                          <span>{onboarding.companyName || '未知'}</span>
                        </div>
                      </td>
                    )}
                    {visibleColumns.email && <td className="px-6 py-4 text-xs text-slate-500 font-sans">{onboarding.candidateEmail || '-'}</td>}
                    {visibleColumns.phone && <td className="px-6 py-4 text-xs text-slate-500 font-sans">{onboarding.candidatePhone || '-'}</td>}
                    {visibleColumns.date && (
                      <td className="px-6 py-4 font-sans">
                        <div className="flex items-center gap-1 text-xs whitespace-nowrap">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(onboarding.onboardingDate).toLocaleDateString('zh-CN')}
                        </div>
                      </td>
                    )}
                    {visibleColumns.time && (
                      <td className="px-6 py-4 font-sans">
                        {onboarding.onboardingTime ? (
                          <div className="flex items-center gap-1 text-xs whitespace-nowrap">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {onboarding.onboardingTime}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>
                    )}
                    {visibleColumns.location && (
                      <td className="px-6 py-4 font-sans">
                        {onboarding.onboardingLocation ? (
                          <div className="flex items-center gap-1 text-xs max-w-[150px] truncate" title={onboarding.onboardingLocation}>
                            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            {onboarding.onboardingLocation}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>
                    )}
                    {visibleColumns.salary && (
                      <td className="px-6 py-4 font-sans">
                        <div className="flex flex-col text-[10px] leading-tight text-slate-600">
                          <span className="font-bold text-indigo-600 scale-90 origin-left">试用: {onboarding.probationSalary || '-'}</span>
                          <span className="scale-90 origin-left">正式: {onboarding.officialSalary || '-'}</span>
                        </div>
                      </td>
                    )}
                    {visibleColumns.probation && (
                      <td className="px-6 py-4 font-sans text-xs">
                        {onboarding.probationPeriod ? `${onboarding.probationPeriod}个月` : '-'}
                      </td>
                    )}
                    {visibleColumns.contact && (
                      <td className="px-6 py-4 font-sans">
                        {onboarding.onboardingContact ? (
                          <div className="flex flex-col text-xs">
                            <span className="flex items-center gap-1"><User size={12} className="text-slate-400" />{onboarding.onboardingContact}</span>
                            {onboarding.onboardingContactPhone && (
                              <span className="flex items-center gap-1 text-slate-400 scale-90 origin-left"><Phone size={10} />{onboarding.onboardingContactPhone}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>
                    )}
                    {visibleColumns.status && (
                      <td className="px-6 py-4 font-sans">
                        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full whitespace-nowrap ${getStatusColor(onboarding.status)}`}>
                          {getStatusText(onboarding.status)}
                        </span>
                      </td>
                    )}
                    {visibleColumns.notes && (
                      <td className="px-6 py-4 font-sans text-xs text-slate-500 max-w-[150px] truncate" title={onboarding.notes}>
                        {onboarding.notes || '-'}
                      </td>
                    )}
                    <td className="px-6 py-4 font-sans whitespace-nowrap">
                      <button
                        onClick={() => handleViewDetails(onboarding)}
                        className="text-indigo-600 hover:text-indigo-700 text-xs font-medium"
                      >
                        详情
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 分页组件 */}
        <div className="px-6 py-2 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
          <Pagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={(page) => setCurrentPage(page)}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1); // 重置到第一页
            }}
          />
        </div>
      </div>

      <AdminOnboardingDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onboarding={selectedOnboarding}
      />
    </div>
  );
};

export default OnboardingsView;

