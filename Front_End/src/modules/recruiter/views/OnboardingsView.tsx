import React, { useState, useEffect, useMemo } from 'react';
import { Search, Calendar, Clock, MapPin, Plus, FileText, Phone, User, Building2 } from 'lucide-react';
import { onboardingAPI, Onboarding } from '@/services/onboardingService';
import { message, Modal, Select } from 'antd';
import moment from 'moment';
import OnboardingModal from '../components/OnboardingModal';
import { useI18n } from '@/contexts/i18nContext';

const { Option } = Select;

interface OnboardingsViewProps {
  currentUserId: number;
}

const OnboardingsView: React.FC<OnboardingsViewProps> = ({ currentUserId }) => {
  const { language, t } = useI18n();
  const [onboardings, setOnboardings] = useState<Onboarding[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchOnboardings = async () => {
    try {
      setLoading(true);
      const response = await onboardingAPI.getAllOnboardings({ recruiterId: currentUserId });
      if ((response as any).status === 'success') {
        setOnboardings((response as any).data);
      }
    } catch (error) {
      console.error('获取入职数据失败:', error);
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUserId) {
      fetchOnboardings();
    }
  }, [currentUserId]);

  const filteredOnboardings = useMemo(() => {
    return onboardings.filter(onboarding => {
      const matchesSearch = searchTerm === '' ||
        onboarding.candidateName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        onboarding.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || onboarding.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [onboardings, searchTerm, statusFilter]);




  const handleEdit = (record: Onboarding) => {
    setEditingId(record.id);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingId(null);
    setIsModalOpen(true);
  };

  /* handleModalOk removed - handled in OnboardingModal */

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Scheduled': return 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
      case 'In Progress': return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300';
      case 'Completed': return 'bg-green-50 text-green-700 dark:bg-green-900/40 dark:text-green-300';
      case 'Pending': return 'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
      case 'Cancelled': return 'bg-rose-50 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300';
      default: return 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'Scheduled': return t.recruiter.statusScheduled;
      case 'Completed': return t.recruiter.statusCompleted;
      case 'Pending': return t.recruiter.pending;
      case 'In Progress': return language === 'zh' ? '进行中' : 'In Progress';
      case 'Cancelled': return t.recruiter.statusCancelled;
      default: return status;
    }
  };

  const statusOptions = [
    { label: language === 'zh' ? '全部状态' : 'All Status', value: 'all' },
    { label: language === 'zh' ? '已安排' : 'Scheduled', value: '已安排' },
    { label: language === 'zh' ? '进行中' : 'In Progress', value: '进行中' },
    { label: language === 'zh' ? '已完成' : 'Completed', value: '已完成' },
    { label: language === 'zh' ? '待安排' : 'Pending', value: '待安排' },
    { label: language === 'zh' ? '已取消' : 'Cancelled', value: '已取消' },
  ];

  return (
    <div className="space-y-6 p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{t.recruiter.onboardTitle}</h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">{t.recruiter.onboardSubtitle}</p>
        </div>
        <button
          onClick={handleCreate}
          className="px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all font-bold shadow-xl shadow-blue-200 dark:shadow-blue-900/20 active:scale-95 flex items-center gap-2 group"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          {t.recruiter.scheduleOnboarding}
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-700/50 flex flex-col lg:flex-row gap-5 justify-between items-center">
          <div className="flex gap-3 items-center w-full lg:w-1/2 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="搜索入职员工姓名或职位..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium text-slate-700 dark:text-slate-200"
            />
          </div>
          <div className="flex gap-3 w-full lg:w-auto">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all cursor-pointer w-full lg:w-48"
            >
              <option value="all">{t.recruiter.allPhases}</option>
              <option value="Scheduled">📋 {t.recruiter.statusScheduled}</option>
              <option value="In Progress">⚡ {language === 'zh' ? '进行中...' : 'In Progress...'}</option>
              <option value="Completed">✨ {t.recruiter.statusCompleted}</option>
              <option value="Pending">⌛ {t.recruiter.pending}</option>
              <option value="Cancelled">🚫 {t.recruiter.statusCancelled}</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700/50">
                <th className="px-6 py-4 text-left font-black text-slate-400 dark:text-slate-500 text-xs uppercase tracking-widest">入职伙伴</th>
                <th className="px-6 py-4 text-left font-black text-slate-400 dark:text-slate-500 text-xs uppercase tracking-widest">归属职位</th>
                <th className="px-6 py-4 text-left font-black text-slate-400 dark:text-slate-500 text-xs uppercase tracking-widest">入职时间</th>
                <th className="px-6 py-4 text-left font-black text-slate-400 dark:text-slate-500 text-xs uppercase tracking-widest">办公地点及待遇</th>
                <th className="px-6 py-4 text-left font-black text-slate-400 dark:text-slate-500 text-xs uppercase tracking-widest">入职联络人</th>
                <th className="px-6 py-4 text-left font-black text-slate-400 dark:text-slate-500 text-xs uppercase tracking-widest">当前状态</th>
                <th className="px-6 py-4 text-right font-black text-slate-400 dark:text-slate-500 text-xs uppercase tracking-widest">管理操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    {t.common.loading}
                  </td>
                </tr>
              ) : filteredOnboardings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    {onboardings.length === 0 ? t.recruiter.noOnboardingRecords : t.common.noData}
                  </td>
                </tr>
              ) : (
                filteredOnboardings.map(onboarding => (
                  <tr key={onboarding.id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-all duration-300">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden shadow-sm transition-transform group-hover:scale-105">
                          {onboarding.candidateAvatar ? (
                            <img src={onboarding.candidateAvatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black text-lg">
                              {onboarding.candidateName ? onboarding.candidateName.charAt(0).toUpperCase() : '?'}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100">{onboarding.candidateName || '未知'}</div>
                          <div className="text-[10px] text-slate-400 font-bold mt-0.5">EMP-ID: {onboarding.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{onboarding.jobTitle || '未知职位'}</span>
                        <div className="flex items-center text-[10px] text-slate-500 font-bold">
                          <Building2 className="w-3 h-3 mr-1 text-slate-400" />
                          {onboarding.companyName}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 font-black text-slate-700 dark:text-slate-300 text-sm">
                          <Calendar className="w-4 h-4 text-blue-500" />
                          {moment(onboarding.onboardingDate).format('YYYY年MM月DD日')}
                        </div>
                        {onboarding.onboardingTime && (
                          <div className="flex items-center gap-2 mt-1.5 text-[10px] font-bold text-slate-400">
                            <Clock className="w-3.5 h-3.5" />
                            {t.recruiter.onboardingCheckinTime} {onboarding.onboardingTime}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1.5 max-w-xs">
                        {onboarding.onboardingLocation && (
                          <div className="flex items-start gap-1.5 group/loc" title={onboarding.onboardingLocation}>
                            <MapPin className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 truncate">{onboarding.onboardingLocation}</span>
                          </div>
                        )}
                        {onboarding.officialSalary && (
                          <div className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-lg w-fit">
                            {t.recruiter.officialSalaryPrefix}{onboarding.officialSalary}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {onboarding.onboardingContact ? (
                        <div className="flex flex-col gap-1">
                          <div className="text-sm font-bold text-slate-700 dark:text-slate-200">{onboarding.onboardingContact}</div>
                          {onboarding.onboardingContactPhone && (
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                              <Phone className="w-3 h-3" />
                              {onboarding.onboardingContactPhone}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-300 italic text-[10px] font-bold">{t.recruiter.noContact}</span>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1 text-[10px] font-black rounded-full w-fit uppercase tracking-widest ${getStatusColor(onboarding.status)}`}>
                        {getStatusText(onboarding.status)}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button
                        onClick={() => handleEdit(onboarding)}
                        className="px-4 py-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl text-xs font-black transition-all active:scale-90"
                      >
                        {t.recruiter.editDetails}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <OnboardingModal
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingId(null);
        }}
        onSuccess={() => {
          setIsModalOpen(false);
          setEditingId(null);
          fetchOnboardings();
        }}
        recruiterId={currentUserId}
        isEditing={!!editingId}
        initialValues={editingId ? onboardings.find(o => o.id === editingId) : undefined}
      />
    </div>
  );
};

export default OnboardingsView;

