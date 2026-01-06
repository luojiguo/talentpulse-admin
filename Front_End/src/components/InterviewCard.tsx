import React, { useMemo, useState, useEffect } from 'react';
import { MapPin, Clock, Calendar, CheckCircle, XCircle, AlertCircle, Briefcase } from 'lucide-react';
import { formatDateTime } from '@/utils/dateUtils';
import { message } from 'antd';
import { interviewAPI } from '@/services/apiService';
import { socketService } from '@/services/socketService';

interface InterviewCardProps {
    msg: any;
    isCurrentUser: boolean;
    isRecruiter: boolean;
    onAccept?: (interviewId: string | number, messageId: string | number) => void;
    onReject?: (interviewId: string | number, messageId: string | number) => void;
}

const InterviewCard: React.FC<InterviewCardProps> = ({
    msg,
    isCurrentUser,
    isRecruiter,
    onAccept,
    onReject
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isDisabled, setIsDisabled] = useState(false);
    const [latestStatus, setLatestStatus] = useState<string | null>(null);

    // 解析消息内容
    const content = useMemo(() => {
        try {
            // 尝试解析JSON字符串
            if (typeof msg.text === 'string' && (msg.text.startsWith('{') || msg.text.startsWith('['))) {
                const parsed = JSON.parse(msg.text);
                // 确保包含interview对象
                if (parsed.interview || parsed.type === 'interview_invitation') {
                    return parsed;
                }
            }
            return null;
        } catch (e) {
            console.error('Failed to parse interview message:', e);
            return null;
        }
    }, [msg.text]);

    if (!content || !content.interview) {
        // 如果无法解析，回退到显示文本
        return <div className="p-3 text-red-500 bg-red-50 rounded-lg text-sm">⚠️ 无法解析面试邀请信息</div>;
    }

    const { interview } = content;

    // 获取最新的面试状态
    useEffect(() => {
        const fetchLatestStatus = async () => {
            try {
                const response = await interviewAPI.getInterviewById(interview.id);
                if (response && response.data) {
                    setLatestStatus(response.data.status);
                    console.log('[InterviewCard] Fetched latest status:', response.data.status);
                }
            } catch (error) {
                console.error('[InterviewCard] Failed to fetch latest status:', error);
                // 如果获取失败，使用消息中的状态
                setLatestStatus(interview.status || 'scheduled');
            }
        };

        if (interview.id) {
            fetchLatestStatus();
        }

        // 添加 Socket.IO 监听器，实时更新状态
        const socket = socketService.getSocket();
        if (socket) {
            const handleStatusUpdate = (data: any) => {
                console.log('[InterviewCard] Received interview_status_updated:', data);
                // 如果更新的是当前面试，立即更新状态
                if (data.interviewId === interview.id) {
                    setLatestStatus(data.status);
                    console.log('[InterviewCard] Real-time status updated to:', data.status);

                    // 显示通知（仅招聘方）
                    if (isRecruiter) {
                        if (data.status === 'accepted') {
                            message.success(data.message || '候选人已接受面试邀请');
                        } else if (data.status === 'rejected') {
                            message.info(data.message || '候选人已拒绝面试邀请');
                        }
                    }
                }
            };

            socket.on('interview_status_updated', handleStatusUpdate);

            // 清理函数
            return () => {
                socket.off('interview_status_updated', handleStatusUpdate);
            };
        }
    }, [interview.id, isRecruiter]);

    // 使用最新状态，如果还没获取到则使用消息中的状态
    const interviewStatus = latestStatus || interview.status || 'scheduled';

    // 处理接受面试
    const handleAccept = async () => {
        if (isDisabled || isLoading) return;

        setIsLoading(true);
        setIsDisabled(true);

        try {
            // 调用API更新面试状态为accepted
            await interviewAPI.updateInterviewStatus(interview.id, 'accepted');
            message.success('已接受面试邀请');

            // 调用父组件的回调（如果有）
            if (onAccept) {
                onAccept(interview.id, msg.id);
            }
        } catch (error: any) {
            console.error('接受面试失败:', error);
            message.error(error.message || '操作失败，请稍后重试');
            setIsDisabled(false); // 失败时恢复按钮
        } finally {
            setIsLoading(false);
        }
    };

    // 处理拒绝面试
    const handleReject = async () => {
        if (isDisabled || isLoading) return;

        setIsLoading(true);
        setIsDisabled(true);

        try {
            // 调用API更新面试状态为rejected
            await interviewAPI.updateInterviewStatus(interview.id, 'rejected');
            message.info('已拒绝面试邀请');

            // 调用父组件的回调（如果有）
            if (onReject) {
                onReject(interview.id, msg.id);
            }
        } catch (error: any) {
            console.error('拒绝面试失败:', error);
            message.error(error.message || '操作失败，请稍后重试');
            setIsDisabled(false); // 失败时恢复按钮
        } finally {
            setIsLoading(false);
        }
    };

    // 判断显示状态
    const renderStatus = () => {
        if (interviewStatus === 'accepted') {
            return (
                <div className="flex items-center text-emerald-600 gap-1.5 bg-emerald-50 p-2 rounded-md w-full justify-center border border-emerald-200">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-xs font-semibold">已接受邀请</span>
                </div>
            );
        }
        if (interviewStatus === 'rejected' || interviewStatus === 'cancelled') {
            return (
                <div className="flex items-center text-gray-500 gap-1.5 bg-gray-50 p-2 rounded-md w-full justify-center border border-gray-200">
                    <XCircle className="w-4 h-4" />
                    <span className="text-xs font-semibold">
                        {interviewStatus === 'cancelled' ? '已取消' : '已拒绝'}
                    </span>
                </div>
            );
        }

        // 如果是待处理状态 (scheduled)
        if (isRecruiter) {
            // 招聘方视角：显示等待状态
            return (
                <div className="flex items-center text-blue-600 gap-1.5 bg-blue-50 p-2 rounded-md w-full justify-center border border-blue-200">
                    <AlertCircle className="w-4 h-4 animate-pulse" />
                    <span className="text-xs font-semibold">等待候选人回复</span>
                </div>
            );
        } else {
            // 候选人视角：显示操作按钮
            return (
                <div className="flex gap-2 mt-3">
                    <button
                        onClick={handleAccept}
                        disabled={isDisabled || isLoading}
                        className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-2.5 px-4 rounded-lg font-semibold transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <CheckCircle className="w-4 h-4" />
                        {isLoading ? '处理中...' : '接受面试'}
                    </button>
                    <button
                        onClick={handleReject}
                        disabled={isDisabled || isLoading}
                        className="flex-1 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 py-2.5 px-4 rounded-lg font-semibold transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-gray-300 transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <XCircle className="w-4 h-4" />
                        {isLoading ? '处理中...' : '拒绝'}
                    </button>
                </div>
            );
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden w-full max-w-md hover:shadow-lg transition-shadow duration-300">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-2.5 flex justify-between items-center text-white">
                <div className="flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4" />
                    <span className="font-bold text-sm">面试邀请</span>
                </div>
                <span className="text-xs bg-white/25 backdrop-blur-sm px-2 py-0.5 rounded-full font-medium">
                    {interview.interview_round ? `第${interview.interview_round} 轮` : '初试'}
                </span>
            </div>

            {/* Body */}
            <div className="p-3 space-y-2.5">
                {/* Position Title */}
                <div className="border-b border-gray-100 pb-2">
                    <h3 className="font-bold text-gray-900 text-base mb-1 flex items-center gap-1.5">
                        <span className="text-indigo-600 text-sm">📋</span>
                        {interview.position || interview.Interview_Position || "职位未知"}
                    </h3>
                    {interview.company_name && (
                        <p className="text-gray-500 text-xs flex items-center gap-1 ml-5">
                            <span>🏢</span>
                            {interview.company_name}
                        </p>
                    )}
                </div>

                {/* Interview Details - Compact Grid Layout */}
                <div className="grid grid-cols-1 gap-2">
                    <div className="flex items-center gap-2.5 p-2 rounded-md hover:bg-gray-50 transition-colors border border-gray-100">
                        <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                            <div className="text-gray-500 text-xs mb-0.5">面试日期</div>
                            <span className="text-gray-900 font-semibold text-sm">
                                {formatDateTime(interview.interview_date, 'date')}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2.5 p-2 rounded-md hover:bg-gray-50 transition-colors border border-gray-100">
                        <Clock className="w-4 h-4 text-purple-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                            <div className="text-gray-500 text-xs mb-0.5">面试时间</div>
                            <span className="text-gray-900 font-semibold text-sm">
                                {interview.interview_time?.substring(0, 5)} - {interview.interview_time_end?.substring(0, 5)}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2.5 p-2 rounded-md hover:bg-gray-50 transition-colors border border-gray-100">
                        <MapPin className="w-4 h-4 text-pink-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                            <div className="text-gray-500 text-xs mb-0.5">面试地点</div>
                            <span className="text-gray-900 font-semibold text-sm break-all">
                                {interview.location}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Status / Actions */}
                <div className="pt-1">
                    {renderStatus()}
                </div>
            </div>
        </div>
    );
};

export default InterviewCard;
