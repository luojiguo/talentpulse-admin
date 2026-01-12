import React, { useState, useEffect, useMemo } from 'react';
import { Search, Calendar, Clock, MapPin, Plus, FileText, Phone, User, Building2 } from 'lucide-react';
import { onboardingAPI, Onboarding } from '@/services/onboardingService';
import { message, Modal, Select } from 'antd';
import moment from 'moment';
import OnboardingModal from '../components/OnboardingModal';

const { Option } = Select;

interface OnboardingsViewProps {
  currentUserId: number;
}

const OnboardingsView: React.FC<OnboardingsViewProps> = ({ currentUserId }) => {
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
      case 'Scheduled': return 'bg-blue-100 text-blue-700';
      case 'In Progress': return 'bg-purple-100 text-purple-700';
      case 'Completed': return 'bg-green-100 text-green-700';
      case 'Pending': return 'bg-yellow-100 text-yellow-700';
      case 'Cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'Scheduled': return '已安排';
      case 'Completed': return '已完成';
      case 'Pending': return '待安排';
      case 'In Progress': return '进行中';
      case 'Cancelled': return '已取消';
      default: return status;
    }
  };

  const statusOptions = [
    { label: '全部状态', value: 'all' },
    { label: '已安排', value: '已安排' },
    { label: '进行中', value: '进行中' },
    { label: '已完成', value: '已完成' },
    { label: '待安排', value: '待安排' },
    { label: '已取消', value: '已取消' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">入职管理</h1>
        {/* Creation requires selecting candidate/job, effectively usually done from Candidate list or Job Application list. 
            Direct creation here is complex without selectors. Hidden for now or implemented with manual ID input for MVP */}
        <button onClick={handleCreate} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          安排入职
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200 flex gap-4 justify-between items-center flex-wrap">
          <div className="flex gap-2 items-center w-full md:w-auto">
            <Search className="text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="搜索候选人、职位..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-transparent focus:outline-none text-sm w-full md:w-64"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">全部状态</option>
              <option value="Scheduled">已安排</option>
              <option value="In Progress">进行中</option>
              <option value="Completed">已完成</option>
              <option value="Pending">待安排</option>
              <option value="Cancelled">已取消</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">候选人</th>
                <th className="px-6 py-3 text-left">职位</th>
                <th className="px-6 py-3 text-left">入职日期</th>
                <th className="px-6 py-3 text-left">入职详情</th>
                <th className="px-6 py-3 text-left">联系信息</th>
                <th className="px-6 py-3 text-left">状态</th>
                <th className="px-6 py-3 text-left">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    加载中...
                  </td>
                </tr>
              ) : filteredOnboardings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    {onboardings.length === 0 ? '暂无入职安排记录' : '没有找到匹配的记录'}
                  </td>
                </tr>
              ) : (
                filteredOnboardings.map(onboarding => (
                  <tr key={onboarding.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                          {onboarding.candidateAvatar ? (
                            <img src={onboarding.candidateAvatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-4 h-4 text-gray-500" />
                          )}
                        </div>
                        <div className="font-medium text-gray-900">{onboarding.candidateName || '未知'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium">{onboarding.jobTitle || '未知职位'}</span>
                        <span className="text-xs text-gray-500">{onboarding.companyName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {moment(onboarding.onboardingDate).format('YYYY-MM-DD')}
                      </div>
                      {onboarding.onboardingTime && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          {onboarding.onboardingTime}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      {onboarding.onboardingLocation && (
                        <div className="flex items-start gap-1 mb-1" title={onboarding.onboardingLocation}>
                          <MapPin className="w-3 h-3 text-gray-400 mt-0.5 shrink-0" />
                          <span className="truncate">{onboarding.onboardingLocation}</span>
                        </div>
                      )}
                      {onboarding.officialSalary && (
                        <div className="text-xs text-gray-500">
                          薪资: {onboarding.officialSalary}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {onboarding.onboardingContact ? (
                        <div>
                          <div className="text-sm">{onboarding.onboardingContact}</div>
                          {onboarding.onboardingContactPhone && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Phone className="w-3 h-3" />
                              {onboarding.onboardingContactPhone}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(onboarding.status)}`}>
                        {getStatusText(onboarding.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(onboarding)}
                          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                        >
                          查看详情
                        </button>
                      </div>
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

