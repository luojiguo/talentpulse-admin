import React, { useState, useEffect, useMemo } from 'react';
import { Search, Calendar, Clock, MapPin, User, FileText, CheckCircle, XCircle, AlertCircle, Plus, X } from 'lucide-react';
import { message } from 'antd';
import { interviewAPI } from '@/services/apiService';

interface Interview {
  id: number;
  applicationId: number;
  interviewDate: string;
  interviewTime: string;
  location: string;
  interviewerId: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'accepted' | 'rejected';
  notes?: string;
  interviewRound: number;
  interviewType: '电话' | '视频' | '现场';
  interviewTopic?: string;
  interviewDuration: number;
  interviewerName?: string;
  interviewerPosition?: string;
  interviewResult?: '通过' | '未通过' | '待定';
  interviewFeedback?: string;
  candidateName?: string;
  jobTitle?: string;
  companyName?: string;
  // 新增字段
  invitationMessage?: string;
  invitationSentAt?: string;
  invitationExpiresAt?: string;
  candidateResponseAt?: string;
  timeZone?: string;
  candidateId?: number;
  jobId?: number;
}

interface InterviewsViewProps {
  currentUserId: number;
}

const InterviewsView: React.FC<InterviewsViewProps> = ({ currentUserId }) => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // 面试邀请模态框状态
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
  
  // 面试表单状态
  const [interviewForm, setInterviewForm] = useState({
    applicationId: 0,
    interviewDate: '',
    interviewTime: '',
    location: '',
    interviewType: '电话' as '电话' | '视频' | '现场',
    interviewRound: 1,
    interviewDuration: 60,
    interviewerName: '',
    interviewerPosition: '',
    notes: '',
    interviewTopic: '',
    // 新增字段
    invitationMessage: '',
    invitationExpiresAt: '',
    timeZone: 'Asia/Shanghai'
  });
  
  // 表单加载状态
  const [formLoading, setFormLoading] = useState(false);
  
  // 打开面试邀请模态框
  const openInterviewModal = () => {
    setIsInterviewModalOpen(true);
  };
  
  // 关闭面试邀请模态框
  const closeInterviewModal = () => {
    setIsInterviewModalOpen(false);
    // 重置表单
    setInterviewForm({
      applicationId: 0,
      interviewDate: '',
      interviewTime: '',
      location: '',
      interviewType: '电话',
      interviewRound: 1,
      interviewDuration: 60,
      interviewerName: '',
      interviewerPosition: '',
      notes: '',
      interviewTopic: '',
      // 新增字段重置
      invitationMessage: '',
      invitationExpiresAt: '',
      timeZone: 'Asia/Shanghai'
    });
  };
  
  // 处理表单字段变化
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setInterviewForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // 创建面试邀请
  const handleCreateInterview = async () => {
    try {
      setFormLoading(true);
      // 验证必填字段
      if (!interviewForm.applicationId || !interviewForm.interviewDate || !interviewForm.interviewTime) {
        message.error('请填写必填字段');
        return;
      }
      
      const response = await interviewAPI.createInterview({
        ...interviewForm,
        interviewerId: currentUserId
      });
      
      if ((response as any).status === 'success') {
        message.success('面试邀请创建成功');
        // 重新获取面试列表
        const fetchResponse = await interviewAPI.getAllInterviews();
        if ((fetchResponse as any).status === 'success') {
          const recruiterInterviews = (fetchResponse.data || []).filter(
            (interview: Interview) => interview.interviewerId === currentUserId
          );
          setInterviews(recruiterInterviews);
        }
        closeInterviewModal();
      }
    } catch (error) {
      console.error('创建面试失败:', error);
      message.error('创建面试邀请失败，请重试');
    } finally {
      setFormLoading(false);
    }
  };

  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        setLoading(true);
        const response = await interviewAPI.getAllInterviews();
        if ((response as any).status === 'success') {
          // 只显示当前招聘者的面试
          const recruiterInterviews = (response.data || []).filter(
            (interview: Interview) => interview.interviewerId === currentUserId
          );
          setInterviews(recruiterInterviews);
        }
      } catch (error) {
        console.error('获取面试数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInterviews();
  }, [currentUserId]);

  const filteredInterviews = useMemo(() => {
    return interviews.filter(interview => {
      const matchesSearch = searchTerm === '' ||
        interview.candidateName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        interview.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || interview.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [interviews, searchTerm, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      case 'accepted': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return '已安排';
      case 'completed': return '已完成';
      case 'cancelled': return '已取消';
      case 'accepted': return '已接受';
      case 'rejected': return '已拒绝';
      default: return status;
    }
  };

  const getResultColor = (result?: string) => {
    switch (result) {
      case '通过': return 'bg-green-100 text-green-700';
      case '未通过': return 'bg-red-100 text-red-700';
      case '待定': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">面试管理</h1>
        <button 
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
          onClick={openInterviewModal}
        >
          <Plus className="w-4 h-4" />
          安排面试
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
              <option value="scheduled">已安排</option>
              <option value="completed">已完成</option>
              <option value="cancelled">已取消</option>
              <option value="accepted">已接受</option>
              <option value="rejected">已拒绝</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">候选人</th>
                <th className="px-6 py-3 text-left">职位</th>
                <th className="px-6 py-3 text-left">面试日期</th>
                <th className="px-6 py-3 text-left">面试时间</th>
                <th className="px-6 py-3 text-left">面试类型</th>
                <th className="px-6 py-3 text-left">轮次</th>
                <th className="px-6 py-3 text-left">状态</th>
                <th className="px-6 py-3 text-left">结果</th>
                <th className="px-6 py-3 text-left">邀请消息</th>
                <th className="px-6 py-3 text-left">操作</th>
              </tr>
            </thead>
            <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                        加载中...
                      </td>
                    </tr>
                  ) : filteredInterviews.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                        没有找到匹配的面试
                      </td>
                    </tr>
                  ) : (
                    filteredInterviews.map(interview => (
                      <tr key={interview.id} className="border-b hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {interview.candidateName || '未知'}
                        </td>
                        <td className="px-6 py-4">{interview.jobTitle || '未知'}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {new Date(interview.interviewDate).toLocaleDateString('zh-CN')}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-gray-400" />
                            {interview.interviewTime}
                          </div>
                        </td>
                        <td className="px-6 py-4">{interview.interviewType}</td>
                        <td className="px-6 py-4">第 {interview.interviewRound} 轮</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(interview.status)}`}>
                            {getStatusText(interview.status)}
                          </span>
                          {interview.status === 'scheduled' && interview.invitationSentAt && (
                            <div className="text-xs text-gray-500 mt-1">
                              已发送: {new Date(interview.invitationSentAt).toLocaleString('zh-CN')}
                            </div>
                          )}
                          {(interview.status === 'accepted' || interview.status === 'rejected') && interview.candidateResponseAt && (
                            <div className="text-xs text-gray-500 mt-1">
                              已{interview.status === 'accepted' ? '接受' : '拒绝'}: {new Date(interview.candidateResponseAt).toLocaleString('zh-CN')}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {interview.interviewResult ? (
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getResultColor(interview.interviewResult)}`}>
                              {interview.interviewResult}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {interview.invitationMessage ? (
                            <div className="text-xs text-gray-600 truncate max-w-[150px]">
                              {interview.invitationMessage}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
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
      
      {/* 面试邀请模态框 */}
      {isInterviewModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden transform transition-all duration-300 animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b flex justify-between items-center bg-emerald-50/50">
              <h3 className="text-xl font-bold text-gray-800 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-emerald-600" />
                安排面试邀请
              </h3>
              <button 
                onClick={closeInterviewModal} 
                className="p-2 rounded-full text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* 申请ID */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">申请ID *</label>
                    <input
                      type="number"
                      name="applicationId"
                      value={interviewForm.applicationId}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="请输入申请ID"
                      required
                    />
                  </div>
                  
                  {/* 面试日期 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">面试日期 *</label>
                    <input
                      type="date"
                      name="interviewDate"
                      value={interviewForm.interviewDate}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      required
                    />
                  </div>
                  
                  {/* 面试时间 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">面试时间 *</label>
                    <input
                      type="time"
                      name="interviewTime"
                      value={interviewForm.interviewTime}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      required
                    />
                  </div>
                  
                  {/* 面试类型 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">面试类型 *</label>
                    <select
                      name="interviewType"
                      value={interviewForm.interviewType}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      required
                    >
                      <option value="电话">电话</option>
                      <option value="视频">视频</option>
                      <option value="现场">现场</option>
                    </select>
                  </div>
                  
                  {/* 面试轮次 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">面试轮次</label>
                    <input
                      type="number"
                      name="interviewRound"
                      value={interviewForm.interviewRound}
                      onChange={handleFormChange}
                      min="1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  
                  {/* 面试时长 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">面试时长 (分钟)</label>
                    <input
                      type="number"
                      name="interviewDuration"
                      value={interviewForm.interviewDuration}
                      onChange={handleFormChange}
                      min="15"
                      max="180"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  
                  {/* 面试官姓名 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">面试官姓名</label>
                    <input
                      type="text"
                      name="interviewerName"
                      value={interviewForm.interviewerName}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="请输入面试官姓名"
                    />
                  </div>
                  
                  {/* 面试官职位 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">面试官职位</label>
                    <input
                      type="text"
                      name="interviewerPosition"
                      value={interviewForm.interviewerPosition}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="请输入面试官职位"
                    />
                  </div>
                  
                  {/* 面试地点 */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">面试地点</label>
                    <input
                      type="text"
                      name="location"
                      value={interviewForm.location}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="请输入面试地点，留空则使用公司地址"
                    />
                  </div>
                  
                  {/* 面试主题 */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">面试主题</label>
                    <input
                      type="text"
                      name="interviewTopic"
                      value={interviewForm.interviewTopic}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="请输入面试主题"
                    />
                  </div>
                  
                  {/* 邀请消息 */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">邀请消息</label>
                    <textarea
                      name="invitationMessage"
                      value={interviewForm.invitationMessage}
                      onChange={handleFormChange}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="请输入发送给候选人的邀请消息"
                    ></textarea>
                  </div>
                  
                  {/* 邀请过期时间 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">邀请过期时间</label>
                    <input
                      type="datetime-local"
                      name="invitationExpiresAt"
                      value={interviewForm.invitationExpiresAt}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="请选择邀请过期时间"
                    />
                  </div>
                  
                  {/* 时区选择 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">时区</label>
                    <select
                      name="timeZone"
                      value={interviewForm.timeZone}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="Asia/Shanghai">亚洲/上海</option>
                      <option value="Asia/Beijing">亚洲/北京</option>
                      <option value="Asia/Hong_Kong">亚洲/香港</option>
                      <option value="Asia/Tokyo">亚洲/东京</option>
                      <option value="Asia/Seoul">亚洲/首尔</option>
                      <option value="Europe/London">欧洲/伦敦</option>
                      <option value="Europe/Paris">欧洲/巴黎</option>
                      <option value="America/New_York">美洲/纽约</option>
                      <option value="America/Los_Angeles">美洲/洛杉矶</option>
                    </select>
                  </div>
                  
                  {/* 备注信息 */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">备注信息</label>
                    <textarea
                      name="notes"
                      value={interviewForm.notes}
                      onChange={handleFormChange}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="请输入备注信息"
                    ></textarea>
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button 
                    type="button" 
                    onClick={closeInterviewModal}
                    className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    取消
                  </button>
                  <button 
                    type="button" 
                    onClick={handleCreateInterview}
                    disabled={formLoading}
                    className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
                  >
                    {formLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    {formLoading ? '创建中...' : '发送面试邀请'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewsView;

