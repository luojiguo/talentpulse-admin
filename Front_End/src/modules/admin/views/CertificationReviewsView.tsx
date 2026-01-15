import React, { useState, useEffect } from 'react';
import { message, Modal } from 'antd';
import {
    CheckCircle, XCircle, Clock, Building2, User, FileText,
    ExternalLink, Loader2, Eye
} from 'lucide-react';
import axios from 'axios';
import { getAuthToken } from '../../../utils/auth';

const API_URL = 'http://localhost:8001/api';

// Helper to process image URLs
const processImageUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `http://localhost:8001${url.startsWith('/') ? '' : '/'}${url}`;
};

interface PendingRequest {
    user_id: string;
    company_id: string;
    verification_status: string;
    business_license: string;
    created_at: string;
    applicant_name: string;
    applicant_email: string;
    applicant_phone: string;
    company_name: string;
    social_credit_code?: string;
    company_logo?: string;
    applicant_avatar?: string;
}

export const CertificationReviewsView: React.FC = () => {
    const [requests, setRequests] = useState<PendingRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<PendingRequest | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    const [previewImage, setPreviewImage] = useState<string | null>(null);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const token = getAuthToken();
            const response = await axios.get(`${API_URL}/certification/admin/pending`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRequests(response.data.data);
        } catch (error) {
            console.error('Error fetching pending requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = (userId: string) => {
        Modal.confirm({
            title: '确认批准',
            content: '确认批准该企业的认证申请吗?',
            okText: '确认',
            cancelText: '取消',
            onOk: async () => {
                setProcessingId(userId);
                try {
                    const token = getAuthToken();
                    await axios.post(`${API_URL}/certification/admin/verify/${userId}`, {
                        action: 'approve'
                    }, {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    // Remove from list
                    setRequests(prev => prev.filter(r => r.user_id !== userId));
                    message.success('已批准认证');
                } catch (error) {
                    console.error('Error approving request:', error);
                    message.error('操作失败');
                } finally {
                    setProcessingId(null);
                }
            }
        });
    };

    const openRejectModal = (request: PendingRequest) => {
        setSelectedRequest(request);
        setRejectReason('');
        setRejectModalOpen(true);
    };

    const handleReject = async () => {
        if (!selectedRequest) return;

        setProcessingId(selectedRequest.user_id);
        try {
            const token = getAuthToken();
            await axios.post(`${API_URL}/certification/admin/verify/${selectedRequest.user_id}`, {
                action: 'reject',
                reason: rejectReason
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Remove from list
            setRequests(prev => prev.filter(r => r.user_id !== selectedRequest.user_id));
            setRejectModalOpen(false);
            message.success('已拒绝申请');
        } catch (error) {
            console.error('Error rejecting request:', error);
            message.error('操作失败');
        } finally {
            setProcessingId(null);
            setSelectedRequest(null);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 bg-gray-50 dark:bg-slate-900 h-full overflow-y-auto transition-colors">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">企业认证审核</h1>
                    <p className="text-gray-500 dark:text-slate-400">处理待审核的企业认证申请</p>
                </div>
                <div className="bg-white dark:bg-slate-800 px-3 py-1 rounded-full text-sm font-medium text-blue-600 dark:text-blue-400 shadow-sm border border-blue-100 dark:border-blue-900/30">
                    待处理: {requests.length}
                </div>
            </div>

            {requests.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-12 text-center border border-gray-100 dark:border-slate-700">
                    <CheckCircle className="w-16 h-16 mx-auto text-gray-300 dark:text-slate-600 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">暂无待审核申请</h3>
                    <p className="text-gray-500 dark:text-slate-400 mt-2">所有申请都已处理完毕</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {requests.map(req => (
                        <div key={req.user_id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden transition-colors">
                            <div className="p-6">
                                <div className="flex flex-col md:flex-row gap-6">
                                    {/* Left: Info */}
                                    <div className="flex-1 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg w-12 h-12 flex-shrink-0 flex items-center justify-center relative group/logo border border-blue-100 dark:border-blue-900/30">
                                                {req.company_logo ? (
                                                    <>
                                                        <img
                                                            src={processImageUrl(req.company_logo)}
                                                            alt={req.company_name}
                                                            className="w-full h-full object-cover cursor-pointer rounded"
                                                        />
                                                        {/* Hover Preview for Company Logo - Shows to the RIGHT, Centered */}
                                                        <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 w-48 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-slate-700 opacity-0 invisible group-hover/logo:opacity-100 group-hover/logo:visible transition-all duration-200 z-50 pointer-events-none">
                                                            <img
                                                                src={processImageUrl(req.company_logo)}
                                                                alt="公司Logo预览"
                                                                className="w-full h-auto rounded border border-gray-100 dark:border-slate-700"
                                                            />
                                                            <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white dark:bg-slate-800 border-b border-l border-gray-200 dark:border-slate-700 rotate-45"></div>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{req.company_name}</h3>
                                                <p className="text-sm text-gray-500 dark:text-slate-400 font-mono mt-0.5">
                                                    统一社会信用代码: {req.social_credit_code || '未提供'}
                                                </p>
                                                <p className="text-sm text-gray-500 dark:text-slate-400 flex items-center gap-2 mt-1">
                                                    <Clock className="w-3 h-3" />
                                                    申请时间: {new Date(req.created_at).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-slate-900/50 p-4 rounded-lg border border-gray-100 dark:border-slate-700">
                                            <div className="space-y-1">
                                                <span className="text-xs text-gray-500 dark:text-slate-500 uppercase font-semibold">申请人</span>
                                                <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                                                    {req.applicant_avatar ? (
                                                        <div className="relative group/avatar">
                                                            <img
                                                                src={processImageUrl(req.applicant_avatar)}
                                                                alt={req.applicant_name}
                                                                className="w-6 h-6 rounded-full object-cover cursor-pointer bg-slate-200 dark:bg-slate-700"
                                                            />
                                                            {/* Hover Preview for Applicant Avatar - Shows to the RIGHT, Centered */}
                                                            <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 w-48 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-slate-700 opacity-0 invisible group-hover/avatar:opacity-100 group-hover/avatar:visible transition-all duration-200 z-50 pointer-events-none">
                                                                <img
                                                                    src={processImageUrl(req.applicant_avatar)}
                                                                    alt="头像预览"
                                                                    className="w-full h-auto rounded border border-gray-100 dark:border-slate-700"
                                                                />
                                                                <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white dark:bg-slate-800 border-b border-l border-gray-200 dark:border-slate-700 rotate-45"></div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <User className="w-5 h-5 text-gray-400" />
                                                    )}
                                                    {req.applicant_name}
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-xs text-gray-500 dark:text-slate-500 uppercase font-semibold">联系方式</span>
                                                <div className="text-sm text-gray-700 dark:text-slate-300">{req.applicant_phone}</div>
                                                <div className="text-sm text-gray-500 dark:text-slate-400">{req.applicant_email}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Middle: License Preview */}
                                    <div className="w-full md:w-64 flex flex-col justify-center items-center bg-gray-50 dark:bg-slate-900/50 rounded-lg border-2 border-dashed border-gray-200 dark:border-slate-700 p-4 relative group/license transition-colors">
                                        <FileText className="w-8 h-8 text-gray-400 dark:text-slate-600 mb-2" />
                                        <span className="text-sm font-medium text-gray-600 dark:text-slate-400 mb-2">营业执照</span>
                                        {req.business_license ? (
                                            <>
                                                <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 cursor-pointer relative z-10 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                                                    onClick={() => setPreviewImage(req.business_license)}>
                                                    <span className="text-xs">查看大图</span>
                                                    <Eye className="w-3 h-3" />
                                                </div>

                                                {/* Hover Preview - Shows to the RIGHT (Centered) */}
                                                <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 w-80 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-slate-700 opacity-0 invisible group-hover/license:opacity-100 group-hover/license:visible transition-all duration-200 z-50 origin-right">
                                                    <div
                                                        className="relative cursor-zoom-in"
                                                        onClick={() => setPreviewImage(req.business_license)}
                                                    >
                                                        <img
                                                            src={processImageUrl(req.business_license)}
                                                            alt="营业执照预览"
                                                            className="w-full h-auto rounded border border-gray-100 dark:border-slate-700"
                                                        />
                                                        <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 hover:opacity-100 rounded">
                                                            <Eye className="w-8 h-8 text-white drop-shadow-md" />
                                                        </div>
                                                    </div>
                                                    {/* Arrow on the right side */}
                                                    <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white dark:bg-slate-800 border-t border-r border-gray-200 dark:border-slate-700 rotate-45"></div>
                                                </div>
                                            </>
                                        ) : (
                                            <span className="text-xs text-gray-400 dark:text-slate-600">未上传</span>
                                        )}
                                    </div>

                                    {/* Right: Actions */}
                                    <div className="flex flex-col justify-center gap-3 w-full md:w-auto min-w-[120px]">
                                        <button
                                            onClick={() => handleApprove(req.user_id)}
                                            disabled={processingId === req.user_id}
                                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-sm font-medium text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {processingId === req.user_id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                            通过认证
                                        </button>
                                        <button
                                            onClick={() => openRejectModal(req)}
                                            disabled={processingId === req.user_id}
                                            className="px-4 py-2 bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 font-medium text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <XCircle className="w-4 h-4" />
                                            拒绝申请
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Reject Modal */}
            {rejectModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-6 shadow-xl animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">拒绝认证申请</h3>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
                            您正在拒绝 <strong>{selectedRequest?.company_name}</strong> 的认证申请。请填写拒绝原因，以便用户重新提交。
                        </p>
                        <textarea
                            className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-3 h-32 focus:ring-2 focus:ring-red-500 focus:border-red-500 mb-4 resize-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                            placeholder="请输入拒绝原因..."
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            autoFocus
                        />
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setRejectModalOpen(false)}
                                className="px-4 py-2 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleReject}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors"
                            >
                                确认拒绝
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Image Preview Modal */}
            <Modal
                open={!!previewImage}
                footer={null}
                onCancel={() => setPreviewImage(null)}
                centered
                width={800}
                className="p-0"
                styles={{ body: { padding: 0, overflow: 'hidden', borderRadius: '8px' } }}
                closeIcon={<span className="text-white text-2xl absolute right-[-40px] top-[-40px] cursor-pointer hover:opacity-80">×</span>}
            >
                {previewImage && (
                    <img
                        alt="营业执照预览"
                        style={{ width: '100%', height: 'auto', display: 'block' }}
                        src={processImageUrl(previewImage)}
                    />
                )}
            </Modal>
        </div>
    );
};

export default CertificationReviewsView;
