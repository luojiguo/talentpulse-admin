import React, { useState, useEffect } from 'react';
import { ChevronLeft, Edit, Share2, MapPin, Briefcase, User, Calendar, Calendar as CalendarIcon, XCircle, CheckCircle } from 'lucide-react';
import { JobPosting } from '@/types/types';
import { message } from 'antd';
import { interviewAPI, applicationAPI } from '@/services/apiService';
import { socketService } from '@/services/socketService';

interface RecruiterJobDetailProps {
    job: JobPosting;
    onBack: () => void;
    currentUserId: number;
    currentUser?: {
        name: string;
        position?: string;
    };
    companyAddress?: string;
    jobs?: JobPosting[];
    onEditJob?: (job: JobPosting) => void;
}

const RecruiterJobDetail: React.FC<RecruiterJobDetailProps> = ({ job, onBack, currentUserId, currentUser, companyAddress, jobs = [], onEditJob }) => {
    // 面试邀请模态框状态
    const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
    // 面试表单状态
    const [interviewForm, setInterviewForm] = useState({
        applicationId: 0,
        interviewDate: '',
        interviewTime: '',
        interviewTimeEnd: '',
        interviewerName: '',
        interviewerPosition: '',
        notes: '',
        location: '',
        interviewPosition: ''
    });
    // 表单加载状态
    const [formLoading, setFormLoading] = useState(false);
    // 申请列表状态
    const [applications, setApplications] = useState<any[]>([]);
    // 申请列表加载状态
    const [applicationsLoading, setApplicationsLoading] = useState(false);

    // 获取该职位的申请列表
    useEffect(() => {
        const fetchApplications = async () => {
            try {
                setApplicationsLoading(true);
                const response = await applicationAPI.getJobApplications(job.id);
                if ((response as any).status === 'success') {
                    setApplications(response.data || []);
                }
            } catch (error) {
                console.error('获取申请列表失败:', error);
                message.error('获取申请列表失败');
            } finally {
                setApplicationsLoading(false);
            }
        };

        fetchApplications();
    }, [job.id]);

    // 打开面试邀请模态框
    const openInterviewModal = () => {
        // 使用招聘者所在公司的地址作为面试地点默认值
        const companyLocation = companyAddress || '';

        setInterviewForm(prev => ({
            ...prev,
            // 自动填充字段
            interviewerName: currentUser?.name || '', // 自动填充面试官姓名
            interviewerPosition: currentUser?.position || '', // 自动填充面试官职位
            location: companyLocation, // 自动填充面试地址
            interviewPosition: job.title || '' // 自动填充面试岗位
        }));
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
            interviewTimeEnd: '',
            interviewerName: '',
            interviewerPosition: '',
            notes: '',
            location: '',
            interviewPosition: ''
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
            if (interviewForm.applicationId === 0 || !interviewForm.interviewDate || !interviewForm.interviewTime || !interviewForm.interviewTimeEnd) {
                message.error('请填写必填字段');
                return;
            }

            // 验证结束时间必须晚于开始时间
            const startTime = new Date(`2000-01-01T${interviewForm.interviewTime}`);
            const endTime = new Date(`2000-01-01T${interviewForm.interviewTimeEnd}`);
            if (endTime <= startTime) {
                message.error('面试结束时间必须晚于开始时间');
                return;
            }

            // 准备完整的面试数据，只包含数据库中存在的字段
            const interviewData = {
                applicationId: interviewForm.applicationId,
                interviewDate: interviewForm.interviewDate,
                interviewTime: interviewForm.interviewTime,
                interviewTimeEnd: interviewForm.interviewTimeEnd,
                interviewerId: currentUserId,
                status: 'scheduled', // 默认状态：已安排
                notes: interviewForm.notes,
                interviewRound: 1, // 默认第1轮
                interviewerName: interviewForm.interviewerName,
                interviewerPosition: interviewForm.interviewerPosition,
                location: interviewForm.location,
                interviewPosition: interviewForm.interviewPosition
            };

            const response = await interviewAPI.createInterview(interviewData);

            if ((response as any).status === 'success') {
                // 更新对应的申请状态为Interview，并增加面试次数
                await applicationAPI.updateApplicationStatus(
                    interviewForm.applicationId,
                    'Interview',
                    '已安排面试'
                );

                message.success('面试邀请创建成功');
                // 通过Socket.IO发送面试邀请通知
                const socket = socketService.getSocket();
                if (socket) {
                    socket.emit('interview_invitation', {
                        interview: response.data,
                        message: `已向您发送面试邀请，请查收！`,
                        interviewerId: currentUserId
                    });
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

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <button onClick={onBack} className="flex items-center text-gray-500 hover:text-emerald-600 font-medium transition-colors mb-2 px-3 py-1.5 rounded-lg hover:bg-emerald-50 w-fit">
                <ChevronLeft className="w-5 h-5 mr-1" /> 返回职位列表
            </button>

            <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center"><MapPin className="w-4 h-4 mr-1 text-emerald-500" /> {job.location}</span>
                        <span className="flex items-center"><Briefcase className="w-4 h-4 mr-1 text-emerald-500" /> {job.experience || '经验不限'}</span>
                        <span className="flex items-center"><User className="w-4 h-4 mr-1 text-emerald-500" /> {job.type}</span>
                        <span className="flex items-center"><Calendar className="w-4 h-4 mr-1 text-emerald-500" /> 发布于: {job.postedDate}</span>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-3">
                    <span className="text-2xl font-bold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg">{job.salary}</span>
                    <div className="flex gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${job.status === 'active' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                            {job.status === 'active' ? '发布中' : '已关闭'}
                        </span>
                        <button
                            onClick={() => onEditJob?.(job)}
                            className="p-2 text-gray-400 hover:text-emerald-600 bg-gray-50 hover:bg-emerald-50 rounded-lg transition border border-transparent hover:border-emerald-100"
                            title="编辑职位"
                        >
                            <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 rounded-lg transition border border-transparent hover:border-blue-100" title="分享职位">
                            <Share2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
                            <div className="w-1 h-5 bg-emerald-600 mr-2 rounded-full"></div> 职位描述 (JD)
                        </h3>
                        <div className="text-gray-600 leading-7 whitespace-pre-line text-sm md:text-base">
                            {job.description || "暂无描述"}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">招聘数据</h3>
                        <div className="grid grid-cols-1 gap-4">
                            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 text-center">
                                <p className="text-3xl font-bold text-blue-600">{job.applicants || 0}</p>
                                <p className="text-sm text-blue-800 mt-2">总申请数</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-3 mt-4">
                            <button
                                className="w-full py-2.5 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition shadow-sm text-sm"
                                onClick={openInterviewModal}
                            >
                                发起面试邀请
                            </button>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl text-white shadow-lg">
                        <h3 className="font-bold text-lg mb-2">AI 建议</h3>
                        <p className="text-slate-300 text-sm mb-4 leading-relaxed">该职位的浏览量比平均水平高 20%，但申请转化率略低。建议优化薪资范围展示或增加福利描述。</p>
                        <button className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition">优化建议</button>
                    </div>
                </div>
            </div>

            {/* 面试邀请模态框 */}
            {
                isInterviewModalOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                        <div
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden transform transition-all duration-300 animate-in fade-in zoom-in-95"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-5 border-b flex justify-between items-center bg-emerald-50/50">
                                <h3 className="text-xl font-bold text-gray-800 flex items-center">
                                    <CalendarIcon className="w-5 h-5 mr-2 text-emerald-600" />
                                    安排面试邀请
                                </h3>
                                <button
                                    onClick={closeInterviewModal}
                                    className="p-2 rounded-full text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                                >
                                    <XCircle className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
                                <form className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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

                                        {/* 面试开始时间 */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">面试开始时间 *</label>
                                            <select
                                                name="interviewTime"
                                                value={interviewForm.interviewTime}
                                                onChange={handleFormChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                required
                                            >
                                                <option value="">请选择时间</option>
                                                {/* 生成固定时间选项：08:00到18:00，分钟为00, 15, 30, 45 */}
                                                {Array.from({ length: 11 }).map((_, i) => {
                                                    const hour = 8 + i; // 8到18点
                                                    const hourStr = hour.toString().padStart(2, '0');
                                                    return [0, 15, 30, 45].map(minute => {
                                                        const minuteStr = minute.toString().padStart(2, '0');
                                                        const timeValue = `${hourStr}:${minuteStr}`;
                                                        return (
                                                            <option key={timeValue} value={timeValue}>
                                                                {timeValue}
                                                            </option>
                                                        );
                                                    });
                                                }).flat()}
                                            </select>
                                        </div>

                                        {/* 面试结束时间 */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">面试结束时间 *</label>
                                            <select
                                                name="interviewTimeEnd"
                                                value={interviewForm.interviewTimeEnd}
                                                onChange={handleFormChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                required
                                            >
                                                <option value="">请选择时间</option>
                                                {/* 生成固定时间选项：08:00到18:00，分钟为00, 15, 30, 45 */}
                                                {Array.from({ length: 11 }).map((_, i) => {
                                                    const hour = 8 + i; // 8到18点
                                                    const hourStr = hour.toString().padStart(2, '0');
                                                    return [0, 15, 30, 45].map(minute => {
                                                        const minuteStr = minute.toString().padStart(2, '0');
                                                        const timeValue = `${hourStr}:${minuteStr}`;
                                                        return (
                                                            <option key={timeValue} value={timeValue}>
                                                                {timeValue}
                                                            </option>
                                                        );
                                                    });
                                                }).flat()}
                                            </select>
                                        </div>

                                        {/* 候选人选择 - 必须选择，获取applicationId */}
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">选择候选人 *</label>
                                            <select
                                                name="applicationId"
                                                value={interviewForm.applicationId}
                                                onChange={handleFormChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                required
                                            >
                                                <option value={0}>请选择候选人</option>
                                                {applicationsLoading ? (
                                                    <option value={0} disabled>加载中...</option>
                                                ) : (
                                                    applications.map(application => (
                                                        <option key={application.id} value={application.id}>
                                                            {application.candidate_name || '候选人'} - 申请状态: {application.status}
                                                        </option>
                                                    ))
                                                )}
                                            </select>
                                        </div>

                                        {/* 自动填充字段 - 只读显示 */}
                                        {currentUser && (
                                            <>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">面试官姓名</label>
                                                    <input
                                                        type="text"
                                                        name="interviewerName"
                                                        value={interviewForm.interviewerName}
                                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
                                                        disabled
                                                    />
                                                </div>

                                                {currentUser.position && (
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">面试官职位</label>
                                                        <input
                                                            type="text"
                                                            name="interviewerPosition"
                                                            value={interviewForm.interviewerPosition}
                                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
                                                            disabled
                                                        />
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        {/* 面试岗位 - 下拉选择 */}
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">面试岗位 *</label>
                                            <select
                                                name="interviewPosition"
                                                value={interviewForm.interviewPosition}
                                                onChange={handleFormChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                required
                                            >
                                                {jobs.map(job => (
                                                    <option key={job.id} value={job.title}>
                                                        {job.title}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* 面试地址 */}
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">面试地址</label>
                                            <input
                                                type="text"
                                                name="location"
                                                value={interviewForm.location}
                                                onChange={handleFormChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                placeholder="请输入面试地址"
                                            />
                                        </div>

                                        {/* 面试备注 */}
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">面试备注</label>
                                            <textarea
                                                name="notes"
                                                value={interviewForm.notes}
                                                onChange={handleFormChange}
                                                rows={3}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                placeholder="请输入面试备注（选填）"
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
                )
            }
        </div >
    );
};

export default RecruiterJobDetail;