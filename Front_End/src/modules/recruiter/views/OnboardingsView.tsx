import React, { useState, useEffect, useMemo } from 'react';
import { Search, Calendar, Clock, MapPin, Plus, FileText } from 'lucide-react';

interface Onboarding {
  id: number;
  applicationId: number;
  onboardingDate: string;
  status: 'Scheduled' | 'Completed' | 'Pending';
  notes?: string;
  onboardingTime?: string;
  onboardingLocation?: string;
  onboardingContact?: string;
  onboardingContactPhone?: string;
  officialSalary?: string;
  probationSalary?: string;
  probationPeriod?: number;
  candidateName?: string;
  jobTitle?: string;
  companyName?: string;
}

interface OnboardingsViewProps {
  currentUserId: number;
}

const OnboardingsView: React.FC<OnboardingsViewProps> = ({ currentUserId }) => {
  const [onboardings, setOnboardings] = useState<Onboarding[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const fetchOnboardings = async () => {
      try {
        setLoading(true);
        // TODO: 创建onboarding API endpoint
        // const response = await onboardingAPI.getAllOnboardings();
        // if (response.status === 'success') {
        //   // 只显示当前招聘者的入职安排
        //   const recruiterOnboardings = (response.data || []).filter(
        //     (onboarding: Onboarding) => onboarding.recruiterId === currentUserId
        //   );
        //   setOnboardings(recruiterOnboardings);
        // }
        // 临时使用空数组
        setOnboardings([]);
      } catch (error) {
        console.error('获取入职数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOnboardings();
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

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Scheduled': return 'bg-blue-100 text-blue-700';
      case 'Completed': return 'bg-green-100 text-green-700';
      case 'Pending': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch(status) {
      case 'Scheduled': return '已安排';
      case 'Completed': return '已完成';
      case 'Pending': return '待安排';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">入职管理</h1>
        <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2">
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
              <option value="Completed">已完成</option>
              <option value="Pending">待安排</option>
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
                <th className="px-6 py-3 text-left">入职时间</th>
                <th className="px-6 py-3 text-left">入职地点</th>
                <th className="px-6 py-3 text-left">联系人</th>
                <th className="px-6 py-3 text-left">状态</th>
                <th className="px-6 py-3 text-left">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    加载中...
                  </td>
                </tr>
              ) : filteredOnboardings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    {onboardings.length === 0 ? '暂无入职记录' : '没有找到匹配的入职记录'}
                  </td>
                </tr>
              ) : (
                filteredOnboardings.map(onboarding => (
                  <tr key={onboarding.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {onboarding.candidateName || '未知'}
                    </td>
                    <td className="px-6 py-4">{onboarding.jobTitle || '未知'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {new Date(onboarding.onboardingDate).toLocaleDateString('zh-CN')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {onboarding.onboardingTime ? (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-gray-400" />
                          {onboarding.onboardingTime}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {onboarding.onboardingLocation ? (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          {onboarding.onboardingLocation}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {onboarding.onboardingContact ? (
                        <div>
                          <div>{onboarding.onboardingContact}</div>
                          {onboarding.onboardingContactPhone && (
                            <div className="text-xs text-gray-500">{onboarding.onboardingContactPhone}</div>
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
                      <button className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">
                        查看详情
                      </button>
                    </td>
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

export default OnboardingsView;

