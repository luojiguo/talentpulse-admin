import React, { useState, useEffect, useRef } from 'react';
import {
    Building2, FileText, Upload, CheckCircle, AlertCircle,
    ArrowRight, Loader2, Shield, Camera, Save
} from 'lucide-react';
import axios from 'axios';
import { getAuthToken } from '../../../utils/auth';
import { useI18n } from '@/contexts/i18nContext';

const API_URL = 'http://localhost:8001/api';

interface CertificationStatus {
    verification_status: 'pending' | 'approved' | 'rejected' | null;
    business_license: string | null;
    rejection_reason: string | null;
    company_name: string | null;
    is_verified: boolean;
    company_id?: string;
}

interface CertificationScreenProps {
    currentUser?: any;
    onCertificationSubmitted?: () => void;
}

export const CertificationScreen: React.FC<CertificationScreenProps> = ({ currentUser, onCertificationSubmitted }) => {
    const { language, t } = useI18n();
    const [status, setStatus] = useState<CertificationStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [isReverifying, setIsReverifying] = useState(false);
    const licenseInputRef = useRef<HTMLInputElement>(null);

    // Form State
    const [formData, setFormData] = useState({
        company_name: '',
        company_address: '',
        company_size: '0-20',
        company_industry: '互联网/IT/电子/通信',
        company_description: '',
        website: '',
        social_credit_code: '',
        contact_name: '',
        contact_phone: ''
    });

    // Derived state for company existence
    const [companyId, setCompanyId] = useState<string | null>(null);

    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        try {
            const token = getAuthToken();
            const response = await axios.get(`${API_URL}/certification/status`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = response.data.data;
            setStatus(data);

            if (data) {
                // If company exists, store ID
                // Note: The /status API might need to return company_id explicitly if not already
                if (data.company_name) {
                    setFormData(prev => ({
                        ...prev,
                        company_name: data.company_name || '',
                        company_industry: data.company_industry || '互联网/IT/电子/通信',
                        company_size: data.company_size || '0-20',
                        company_address: data.company_address || '',
                        company_description: data.company_description || '',
                        social_credit_code: data.social_credit_code || '',
                        contact_name: data.contact_name || '',
                        contact_phone: data.contact_phone || '',
                    }));
                    setPreviewUrl(data.business_license || null);
                }
            }
        } catch (error) {
            console.error('Error fetching status:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (selectedFile.size > 10 * 1024 * 1024) {
                alert('File size must be less than 10MB');
                return;
            }
            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));
        }
    };

    const handleReverify = () => {
        setIsReverifying(true);
        // Reset form data for new company
        setFormData({
            company_name: '',
            company_address: '',
            company_size: '0-20',
            company_industry: '互联网/IT/电子/通信',
            company_description: '',
            website: '',
            social_credit_code: '',
            contact_name: formData.contact_name, // Keep contact info
            contact_phone: formData.contact_phone // Keep contact info
        });
        setPreviewUrl(null);
        setFile(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const formDataObj = new FormData();

            // Core Company Data
            formDataObj.append('company_name', formData.company_name);
            formDataObj.append('industry', formData.company_industry);
            formDataObj.append('size', formData.company_size);
            formDataObj.append('address', formData.company_address);
            formDataObj.append('company_description', formData.company_description);

            // Verification Data
            formDataObj.append('social_credit_code', formData.social_credit_code);
            formDataObj.append('contact_name', formData.contact_name);
            formDataObj.append('contact_phone', formData.contact_phone);

            // User ID if needed (usually extracted from token)
            // formDataObj.append('user_id', currentUser.id); 

            if (file) {
                formDataObj.append('business_license', file);
            } else if (previewUrl && !previewUrl.startsWith('data:') && !previewUrl.startsWith('blob:')) {
                // Already uploaded URL - might need to handle this if verify-create expects file
                formDataObj.append('business_license', previewUrl);
            }

            const token = getAuthToken();

            // Logic: if we have a rejection or existing company -> /verify/:id (which /submit mapped to originally?)
            // If new user -> /verify-create

            // Currently /submit in certificationRoutes calls submitCertification controller
            // Let's rely on /verify-create if we want to follow the new pattern OR check if submit certification handles create
            // The existing /certification/submit endpoint (controller submitCertification) handles update/create logic internally! 
            // So we just need to ensure we send all fields.

            await axios.post(`${API_URL}/certification/submit`, formDataObj, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            await fetchStatus();
            if (onCertificationSubmitted) {
                onCertificationSubmitted();
            }
            alert('认证申请提交成功！');
        } catch (error) {
            console.error('Error submitting certification:', error);
            alert('提交失败，请重试');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-blue-100 dark:border-blue-900/30 rounded-full"></div>
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                </div>
            </div>
        );
    }

    // Status View
    if (!isReverifying && (status?.verification_status === 'pending' || status?.verification_status === 'approved')) {
        const isApproved = status.verification_status === 'approved';
        return (
            <div className="max-w-3xl mx-auto p-6 animate-in fade-in zoom-in-95 duration-500">
                <div className={`rounded-[32px] p-10 text-center shadow-xl ${isApproved ? 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700' : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700'}`}>
                    <div className={`w-28 h-28 mx-auto rounded-[32px] flex items-center justify-center mb-8 rotate-3 shadow-lg ${isApproved ? 'bg-gradient-to-br from-green-400 to-emerald-600 text-white' : 'bg-gradient-to-br from-blue-400 to-blue-600 text-white'}`}>
                        {isApproved ? <CheckCircle className="w-14 h-14" /> : <Shield className="w-14 h-14" />}
                    </div>

                    <h2 className="text-3xl font-black mb-3 text-slate-900 dark:text-slate-100 tracking-tight">
                        {isApproved ? t.recruiter.certPassed : t.recruiter.certReviewing}
                    </h2>

                    <p className="text-slate-500 dark:text-slate-400 mb-10 max-w-lg mx-auto font-medium">
                        {isApproved
                            ? (language === 'zh' ? '卓越的成就！您的企业已成功通过官方认证，现在您可以畅享 TalentPulse 的所有高级招聘管理功能。' : 'Excellent achievement! Your company has successfully passed the official certification.')
                            : (language === 'zh' ? '您的企业认证申请已送达后台，极客审核员正在快马加鞭处理中。审核结果将第一时间同步至您的账户。' : 'Your certification application has been received and is being processed by our team.')}
                    </p>

                    {status.company_name && (
                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 inline-block text-left w-full max-w-md border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-4 mb-3">
                                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm text-blue-600">
                                    <Building2 className="w-5 h-5" />
                                </div>
                                <span className="font-black text-slate-800 dark:text-slate-200">{status.company_name}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs font-bold text-slate-400">
                                <FileText className="w-4 h-4" />
                                <span>官方身份：企业营业执照已完成存证</span>
                            </div>
                        </div>
                    )}

                    <div className="mt-12 flex justify-center">
                        <button
                            onClick={handleReverify}
                            className="group flex items-center gap-2 px-8 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 transition-all font-black active:scale-95"
                        >
                            <span>{t.recruiter.certReverify}</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="mb-10 text-center">
                <h1 className="text-4xl font-black text-slate-900 dark:text-slate-100 mb-3 tracking-tight">
                    {isReverifying ? (language === 'zh' ? '认证新企业身份' : 'Verify New Identity') : t.recruiter.certHeader}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xl mx-auto">
                    {isReverifying
                        ? (language === 'zh' ? '请输入新企业的详细信息进行认证。' : 'Please enter the details for the new company.')
                        : (language === 'zh' ? '完成企业认证可解锁所有核心能力，包括发布无限职位、查看候选人联系方式。' : 'Verify your company to unlock core features.')}
                </p>
            </div>

            {status?.verification_status === 'rejected' && (
                <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50 rounded-[24px] p-6 mb-10 flex items-start gap-4 shadow-sm">
                    <div className="p-2 bg-rose-100 dark:bg-rose-800/40 rounded-xl text-rose-600 flex-shrink-0">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-black text-rose-800 dark:text-rose-300 text-lg">认证审核未通过</h3>
                        <p className="text-rose-700 dark:text-rose-400 text-sm mt-1.5 font-bold leading-relaxed">{status.rejection_reason || '提交的资料不符合要求，请根据提示修改后重新提交。'}</p>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-[32px] shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 overflow-hidden">
                <div className="p-8 md:p-12 space-y-10">
                    {/* Company Info Section */}
                    <div>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-600">
                                <Building2 className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{language === 'zh' ? '企业基本信息' : 'Basic Info'}</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2.5">
                                <label className="text-sm font-black text-slate-700 dark:text-slate-300 px-1">{t.recruiter.companyFullName} <span className="text-rose-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-5 py-3.5 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-bold bg-slate-50/50 dark:bg-slate-900 dark:text-slate-200"
                                    placeholder={language === 'zh' ? '与营业执照保持一致' : 'Match business license'}
                                    value={formData.company_name}
                                    onChange={e => setFormData({ ...formData, company_name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2.5">
                                <label className="text-sm font-black text-slate-700 dark:text-slate-300 px-1">行业领域</label>
                                <select
                                    className="w-full px-5 py-3.5 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-bold bg-slate-50/50 dark:bg-slate-900 dark:text-slate-200 cursor-pointer appearance-none"
                                    value={formData.company_industry}
                                    onChange={e => setFormData({ ...formData, company_industry: e.target.value })}
                                >
                                    <option value="">请选择所属行业</option>
                                    <option value="互联网/IT/电子/通信">互联网/IT/电子/通信</option>
                                    <option value="金融/银行/保险">金融/银行/保险</option>
                                    <option value="房地产/建筑">房地产/建筑</option>
                                    <option value="教育/培训/院校">教育/培训/院校</option>
                                    <option value="消费品/零售/批发">消费品/零售/批发</option>
                                    <option value="广告/传媒/文化">广告/传媒/文化</option>
                                    <option value="制药/医疗/生物">制药/医疗/生物</option>
                                    <option value="能源/矿产/环保">能源/矿产/环保</option>
                                    <option value="制造/加工/自动化">制造/加工/自动化</option>
                                    <option value="交通/物流/贸易">交通/物流/贸易</option>
                                    <option value="政府/非盈利机构">政府/非盈利机构</option>
                                    <option value="服务业">服务业</option>
                                    <option value="其他">其他</option>
                                </select>
                            </div>
                            <div className="space-y-2.5">
                                <label className="text-sm font-black text-slate-700 dark:text-slate-300 px-1">人员规模</label>
                                <select
                                    className="w-full px-5 py-3.5 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-bold bg-slate-50/50 dark:bg-slate-900 dark:text-slate-200 cursor-pointer appearance-none"
                                    value={formData.company_size}
                                    onChange={e => setFormData({ ...formData, company_size: e.target.value })}
                                >
                                    <option value="">请选择公司规模</option>
                                    <option value="0-20">0-20人</option>
                                    <option value="20-99">20-99人</option>
                                    <option value="100-499">100-499人</option>
                                    <option value="500-999">500-999人</option>
                                    <option value="1000-9999">1000-9999人</option>
                                    <option value="10000+">10000人以上</option>
                                </select>
                            </div>
                            <div className="space-y-2.5">
                                <label className="text-sm font-black text-slate-700 dark:text-slate-300 px-1">官方网站</label>
                                <input
                                    type="url"
                                    className="w-full px-5 py-3.5 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-bold bg-slate-50/50 dark:bg-slate-900 dark:text-slate-200"
                                    placeholder="https://www.example.com"
                                    value={formData.website}
                                    onChange={e => setFormData({ ...formData, website: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2.5 md:col-span-2">
                                <label className="text-sm font-black text-slate-700 dark:text-slate-300 px-1">办公地址</label>
                                <input
                                    type="text"
                                    className="w-full px-5 py-3.5 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-bold bg-slate-50/50 dark:bg-slate-900 dark:text-slate-200"
                                    placeholder="请输入详细的办公楼层及门牌号"
                                    value={formData.company_address}
                                    onChange={e => setFormData({ ...formData, company_address: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2.5 md:col-span-2">
                                <label className="text-sm font-black text-slate-700 dark:text-slate-300 px-1">企业简介</label>
                                <textarea
                                    className="w-full px-5 py-4 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-bold bg-slate-50/50 dark:bg-slate-900 dark:text-slate-200 h-32 resize-none"
                                    placeholder="向候选人展示您的企业魅力、愿景及发展历程..."
                                    value={formData.company_description}
                                    onChange={e => setFormData({ ...formData, company_description: e.target.value })}
                                />
                            </div>

                            <div className="md:col-span-2 pt-4 border-t border-slate-100 dark:border-slate-700/50 mt-4 mb-2">
                                <h4 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">联络与校验信息</h4>
                            </div>

                            <div className="space-y-2.5">
                                <label className="text-sm font-black text-slate-700 dark:text-slate-300 px-1">统一社会信用代码</label>
                                <input
                                    type="text"
                                    className="w-full px-5 py-3.5 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-bold bg-slate-50/50 dark:bg-slate-900 dark:text-slate-200"
                                    placeholder="18位信用代码"
                                    value={formData.social_credit_code}
                                    onChange={e => setFormData({ ...formData, social_credit_code: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2.5 text-center md:text-left">
                                {/* Spacer for grid alignment if needed */}
                            </div>
                            <div className="space-y-2.5">
                                <label className="text-sm font-black text-slate-700 dark:text-slate-300 px-1">对接人姓名</label>
                                <input
                                    type="text"
                                    className="w-full px-5 py-3.5 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-bold bg-slate-50/50 dark:bg-slate-900 dark:text-slate-200"
                                    placeholder="常用联系人"
                                    value={formData.contact_name}
                                    onChange={e => setFormData({ ...formData, contact_name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2.5">
                                <label className="text-sm font-black text-slate-700 dark:text-slate-300 px-1">联系电话</label>
                                <input
                                    type="text"
                                    className="w-full px-5 py-3.5 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-bold bg-slate-50/50 dark:bg-slate-900 dark:text-slate-200"
                                    placeholder="手机或办公座机"
                                    value={formData.contact_phone}
                                    onChange={e => setFormData({ ...formData, contact_phone: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-700/50"></div>

                    {/* Verification Material Section */}
                    <div>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-indigo-600">
                                <Upload className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{language === 'zh' ? '认证资质上传' : 'Verification Materials'}</h3>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="block text-sm font-black text-slate-700 dark:text-slate-300 px-1">
                                    营业执照扫描件 <span className="text-rose-500">*</span>
                                </label>
                                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                                    ⚠️ 请确保营业执照复印件加盖公章，内容清晰可见。支持：JPG, PNG, PDF，文件大小控制在 10MB 以内。
                                </p>

                                <div
                                    className="mt-4 flex justify-center px-8 pt-10 pb-10 border-4 border-slate-100 dark:border-slate-700 border-dashed rounded-[32px] hover:bg-slate-50 dark:hover:bg-slate-900/40 hover:border-blue-200 dark:hover:border-blue-900/50 transition-all relative cursor-pointer group shadow-inner"
                                    onClick={() => licenseInputRef.current?.click()}
                                >
                                    <div className="space-y-4 text-center">
                                        {previewUrl ? (
                                            <div className="relative inline-block">
                                                <img
                                                    src={previewUrl}
                                                    alt="Business License Preview"
                                                    className="mx-auto h-56 object-contain rounded-2xl shadow-xl border-4 border-white dark:border-slate-800"
                                                />
                                                <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl backdrop-blur-sm">
                                                    <div className="bg-white px-4 py-2 rounded-xl text-slate-900 font-black text-sm shadow-lg">点击重传简历</div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center">
                                                <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-[24px] flex items-center justify-center mb-4 text-blue-600 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-md">
                                                    <Camera className="w-10 h-10" />
                                                </div>
                                                <div className="flex text-base text-slate-600 dark:text-slate-400 justify-center font-bold">
                                                    <span className="text-blue-600 hover:text-blue-500">点击这里开始上传</span>
                                                </div>
                                                <p className="text-xs text-slate-400 font-bold mt-2">或将文件直接拖拽至此区域</p>
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        ref={licenseInputRef}
                                        type="file"
                                        className="hidden"
                                        accept="image/*,application/pdf"
                                        onChange={handleFileChange}
                                        required={!status?.business_license}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-50/80 dark:bg-slate-900/50 px-8 py-8 flex items-center justify-end gap-5 border-t border-slate-100 dark:border-slate-700/50">
                    <button
                        type="button"
                        className="px-8 py-3.5 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 font-black text-sm transition-all active:scale-95 shadow-sm"
                        onClick={() => {
                            if (isReverifying) {
                                setIsReverifying(false);
                                fetchStatus();
                            } else {
                                window.history.back();
                            }
                        }}
                    >
                        返回上级
                    </button>
                    <button
                        type="submit"
                        disabled={submitting || (!file && !status?.business_license)}
                        className="flex items-center gap-3 px-10 py-3.5 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-black text-sm transition-all shadow-xl shadow-blue-200 dark:shadow-blue-900/20 active:scale-95 group"
                    >
                        {submitting ? (
                            <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        )}
                        {submitting ? (language === 'zh' ? '资料加密传输中...' : 'Submitting...') : t.recruiter.submitAudit}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CertificationScreen;
