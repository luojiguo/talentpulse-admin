import React from 'react';
import { Modal, Descriptions, Tag, Button } from 'antd';
import { Calendar, Clock, MapPin, User, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import moment from 'moment';
import { useI18n } from '@/contexts/i18nContext';

// 面试详情数据接口
interface Interview {
    id: number;
    applicationId: number;
    interviewDate: string;    // 面试日期
    interviewTime: string;    // 面试开始时间
    interviewTimeEnd?: string; // 面试结束时间
    location: string;         // 面试地点或在线链接
    interviewerId: number;    // 面试官 ID
    status: 'scheduled' | 'completed' | 'cancelled' | 'accepted' | 'rejected'; // 面试状态：已安排、已完成、已取消、候选人已接受、候选人已拒绝
    notes?: string;           // 内部备注
    interviewRound: number;   // 面试轮次（如：第1轮）
    interviewType: '电话' | '视频' | '现场'; // 面试形式
    interviewerName?: string; // 面试官姓名
    interviewerPosition?: string; // 面试官职位
    interviewResult?: '通过' | '未通过' | '待定'; // 面试结论
    interviewFeedback?: string; // 面试评价
    candidateName?: string;   // 候选人姓名
    jobTitle?: string;        // 职位名称
    companyName?: string;     // 公司名称
    invitationSentAt?: string; // 邀请发送时间
    invitationExpiresAt?: string; // 邀请过期时间
    candidateResponseAt?: string; // 候选人反馈时间
}

// 面试详情模态框属性
interface InterviewDetailModalProps {
    open: boolean;            // 模态框显示状态
    onCancel: () => void;     // 关闭模态框的回调
    interview: Interview | null; // 面试数据对象
}

const InterviewDetailModal: React.FC<InterviewDetailModalProps> = ({ open, onCancel, interview }) => {
    const { language, t } = useI18n();
    if (!interview) return null;

    // 根据面试状态获取对应的 Ant Design Tag 标签颜色
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'scheduled': return 'orange'; // 已安排：橙色提醒
            case 'completed': return 'green';  // 已完成：绿色代表通过
            case 'cancelled': return 'red';    // 已取消：红色警告
            case 'accepted': return 'cyan';    // 候选人已接受：青色
            case 'rejected': return 'magenta'; // 候选人已拒绝：洋红色
            default: return 'default';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'scheduled': return t.recruiter.statusScheduled;
            case 'completed': return t.recruiter.statusCompleted;
            case 'cancelled': return t.recruiter.statusCancelled;
            case 'accepted': return t.recruiter.statusAccepted;
            case 'rejected': return t.recruiter.statusRejected;
            default: return status;
        }
    };

    return (
        <Modal
            title={
                <div className="flex items-center gap-3 py-2">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                        <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{t.recruiter.interviewDetailTitle}</span>
                </div>
            }
            open={open}
            onCancel={onCancel}
            footer={[
                <button
                    key="close"
                    onClick={onCancel}
                    className="px-8 py-2.5 bg-slate-900 dark:bg-slate-800 text-white font-black text-xs rounded-xl hover:bg-slate-800 transition-all active:scale-95 uppercase tracking-widest"
                >
                    {t.recruiter.closeWindow}
                </button>
            ]}
            width={720}
            centered // 垂直居中展示，提升大屏幕下的审美平衡
            className="custom-interview-detail-modal dark:custom-modal-dark"
        >
            <div className="py-2">
                <div className="mb-8 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40 p-6 rounded-[24px] border border-slate-100 dark:border-slate-700/50 relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-blue-50/50 dark:bg-blue-900/10 rounded-full blur-3xl -mr-16 -mt-16"></div>

                    <div className="flex items-center gap-5 relative z-10">
                        {/* 候选人头像占位：提取首字母大写展示 */}
                        <div className="w-16 h-16 rounded-[20px] bg-blue-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-blue-200 dark:shadow-none">
                            {interview.candidateName ? interview.candidateName.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div>
                            <div className="font-black text-xl text-slate-900 dark:text-white mb-1 tracking-tight">{interview.candidateName || (language === 'zh' ? '未知候选人' : 'Unknown Candidate')}</div>
                            <div className="text-slate-500 dark:text-slate-400 text-sm font-bold flex items-center gap-2">
                                <FileText className="w-4 h-4 text-blue-500" />
                                {language === 'zh' ? '申请职位' : 'Applied Job'}: {interview.jobTitle || (language === 'zh' ? '未关联职位' : 'N/A')}
                            </div>
                        </div>
                    </div>
                    <div className="text-right relative z-10">
                        <Tag color={getStatusColor(interview.status)} className="mb-2 text-sm font-black px-4 py-1.5 rounded-xl border-none shadow-sm">
                            {getStatusText(interview.status).toUpperCase()}
                        </Tag>
                        {interview.status === 'scheduled' && (
                            // 动态倒计时动画：使用脉冲效果（pulse）提醒 HR 该面试即将进行
                            <div className="text-[10px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-widest animate-pulse">Waiting for Interview</div>
                        )}
                    </div>
                </div>

                <div className="mb-8 p-6 bg-slate-50 dark:bg-slate-800/30 rounded-[24px] border border-slate-100 dark:border-slate-700/50">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <AlertCircle className="w-3.5 h-3.5" /> {t.recruiter.basicInfo}
                    </h3>
                    <div className="grid grid-cols-2 gap-y-6">
                        <div className="space-y-1">
                            <div className="text-xs text-slate-400 font-bold">{t.recruiter.interviewDate}</div>
                            <div className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-blue-500" />
                                {moment(interview.interviewDate).format('YYYY-MM-DD')}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-xs text-slate-400 font-bold">{t.recruiter.interviewTime}</div>
                            <div className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                                <Clock className="w-4 h-4 text-blue-500" />
                                {interview.interviewTime?.slice(0, 5)} - {interview.interviewTimeEnd?.slice(0, 5) || (language === 'zh' ? '未设定' : 'N/A')}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-xs text-slate-400 font-bold">{language === 'zh' ? '面试方式' : 'Type'}</div>
                            <div className="font-black text-slate-900 dark:text-white">{interview.interviewType || (language === 'zh' ? '常规面试' : 'Regular')}</div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-xs text-slate-400 font-bold">{language === 'zh' ? '面试轮次' : 'Round'}</div>
                            <div className="font-black text-blue-600 dark:text-blue-400">ROUND {interview.interviewRound}</div>
                        </div>
                        <div className="col-span-2 space-y-1">
                            <div className="text-xs text-slate-400 font-bold">{language === 'zh' ? '面试地点 / 链接' : 'Location / Link'}</div>
                            {/* NOTE: 面试地点可能包含 URL（视频面试），因此增加边框卡片样式以突出显示 */}
                            <div className="font-black text-slate-900 dark:text-white flex items-center gap-2 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                                <MapPin className="w-4 h-4 text-rose-500" />
                                {interview.location || (language === 'zh' ? '面试地点未指定' : 'N/A')}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mb-8 p-6 bg-slate-50 dark:bg-slate-800/30 rounded-[24px] border border-slate-100 dark:border-slate-700/50">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{t.recruiter.interviewerDetail}</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                            <div className="text-xs text-slate-400 font-bold mb-1">{language === 'zh' ? '面试官姓名' : 'Name'}</div>
                            <div className="font-black text-slate-900 dark:text-white">{interview.interviewerName || '-'}</div>
                        </div>
                        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                            <div className="text-xs text-slate-400 font-bold mb-1">{language === 'zh' ? '面试官职位' : 'Position'}</div>
                            <div className="font-black text-slate-900 dark:text-white">{interview.interviewerPosition || '-'}</div>
                        </div>
                    </div>
                </div>

                {(interview.invitationSentAt || interview.candidateResponseAt) && (
                    <Descriptions title={t.recruiter.timeline} bordered column={1} className="mb-6">
                        {interview.invitationSentAt && (
                            <Descriptions.Item label={t.recruiter.invitationSentAt}>
                                {moment(interview.invitationSentAt).format('YYYY-MM-DD HH:mm:ss')}
                            </Descriptions.Item>
                        )}
                        {(interview.status === 'accepted' || interview.status === 'rejected') && interview.candidateResponseAt && (
                            <Descriptions.Item label={t.recruiter.candidateResponseAt}>
                                {moment(interview.candidateResponseAt).format('YYYY-MM-DD HH:mm:ss')}
                            </Descriptions.Item>
                        )}
                    </Descriptions>
                )}

                {interview.notes && (
                    <div className="mb-8 p-6 bg-amber-50 dark:bg-amber-900/10 rounded-[24px] border border-amber-100 dark:border-amber-800/30">
                        <h3 className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest mb-3">{t.recruiter.interviewerNotes}</h3>
                        <div className="text-amber-800 dark:text-amber-400 text-sm font-medium leading-relaxed">
                            {interview.notes}
                        </div>
                    </div>
                )}

                {/* 面试结果展示区域：根据结论（通过/未通过）动态切换背景色，强化结果导向 */}
                {interview.interviewResult && (
                    <div className={`p-8 rounded-[32px] border relative overflow-hidden ${interview.interviewResult === '通过' ? 'bg-blue-600 text-white border-blue-500' : interview.interviewResult === '未通过' ? 'bg-slate-900 text-white border-slate-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white border-slate-200 dark:border-slate-700'}`}>
                        {/* 装饰性背景：仅在通过时显示发光效果 */}
                        {interview.interviewResult === '通过' && <div className="absolute right-0 bottom-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mb-16"></div>}
                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] mb-3 ${interview.interviewResult === '通过' ? 'text-blue-100' : interview.interviewResult === '未通过' ? 'text-slate-400' : 'text-slate-400'}`}>Interview Result</h3>
                                <div className="text-3xl font-black mb-4 flex items-center gap-3">
                                    {((interview.interviewResult as any) === '通过' || (interview.interviewResult as any) === 'PASSED') ? <CheckCircle className="w-8 h-8" /> : ((interview.interviewResult as any) === '未通过' || (interview.interviewResult as any) === 'REJECTED') ? <XCircle className="w-8 h-8" /> : <Clock className="w-8 h-8" />}
                                    {language === 'zh' ? (interview.interviewResult as string) : ((interview.interviewResult as any) === '通过' ? 'PASSED' : (interview.interviewResult as any) === '未通过' ? 'REJECTED' : (interview.interviewResult as string))}
                                </div>
                                {interview.interviewFeedback && (
                                    // 评价文本区域：使用半透明毛玻璃背景（backdrop-blur），提升在深色背景上的可读性
                                    <div className={`text-sm font-medium p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 leading-relaxed`}>
                                        {interview.interviewFeedback}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default InterviewDetailModal;
