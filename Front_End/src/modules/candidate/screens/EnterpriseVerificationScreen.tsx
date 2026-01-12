import React, { useState, useRef, useEffect } from 'react';
import { Shield, Building2, Camera, Save, PenTool } from 'lucide-react';
import { message as antdMessage } from 'antd';
import InputField from '../components/InputField';
import MessageAlert from '../components/MessageAlert';
import { getAuthToken } from '../../../utils/auth';

// Helper to process image URLs
const processImageUrl = (url?: string) => {
    if (!url || url === '🏢') return null;
    if (url.startsWith('data:image')) return url;
    if (url.startsWith('http')) return url;
    return `http://localhost:3001${url.startsWith('/') ? '' : '/'}${url}`;
};

// Enterprise Verification Component for Candidates
const EnterpriseVerificationScreen = ({ currentUser, profile, onSwitchRole }: { currentUser: any, profile: any, onSwitchRole?: (role: any) => void }) => {
    const [message, setMessage] = useState('');
    const [companyInfo, setCompanyInfo] = useState({
        id: '',
        name: '',
        industry: '',
        size: '',
        address: '',
        logo: '🏢',
        is_verified: false,
        business_license: ''
    });
    const [verificationInfo, setVerificationInfo] = useState({
        socialCreditCode: '',
        contactName: '',
        contactPhone: ''
    });
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [licenseFile, setLicenseFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false); // 添加编辑状态
    const logoInputRef = useRef<HTMLInputElement>(null);
    const licenseInputRef = useRef<HTMLInputElement>(null);

    // 获取用户关联的公司信息
    useEffect(() => {
        const fetchCompanyInfo = async () => {
            try {
                setIsLoading(true);
                const token = getAuthToken();
                const headers: HeadersInit = {};
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }

                const response = await fetch(`/api/companies/user/${currentUser.id}`, {
                    headers: headers
                });
                const data = await response.json();

                if (data.status === 'success' && data.data.length > 0) {
                    const company = data.data[0];
                    setCompanyInfo({
                        id: company.id,
                        name: company.name,
                        industry: company.industry || '',
                        size: company.size || '',
                        address: company.address || '',
                        logo: company.logo || '🏢',
                        is_verified: company.is_verified,
                        business_license: company.business_license || ''
                    });
                    setVerificationInfo({
                        socialCreditCode: company.social_credit_code || '',
                        contactName: company.recruiter_contact_name || '',
                        contactPhone: company.recruiter_contact_phone || ''
                    });
                }
            } catch (error) {
                console.error('获取公司信息失败:', error);
                // 即使获取失败，也确保isLoading设置为false
                setIsLoading(false);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCompanyInfo();
    }, [currentUser.id]);

    // 检查当前用户是否已认证企业
    const isVerified = companyInfo.is_verified;

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setMessage('请选择图片文件！');
                setTimeout(() => setMessage(''), 3000);
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                setMessage('图片大小不能超过5MB！');
                setTimeout(() => setMessage(''), 3000);
                return;
            }

            // 立即预览
            setLogoFile(file);
            const reader = new FileReader();
            reader.onload = (event) => {
                const result = event.target?.result as string;
                setCompanyInfo(prev => ({ ...prev, logo: result }));
            };
            reader.readAsDataURL(file);

            // 如果公司已存在，尝试立即上传
            if (companyInfo.id) {
                try {
                    const formData = new FormData();
                    formData.append('logo', file);
                    const token = getAuthToken();

                    const response = await fetch(`/api/companies/${companyInfo.id}/logo`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        },
                        body: formData,
                    });

                    const data = await response.json();

                    if (data.status === 'success') {
                        setCompanyInfo(prev => ({
                            ...prev,
                            logo: data.data.logo
                        }));
                        antdMessage.success('Logo上传成功！');
                    } else {
                        antdMessage.error('Logo上传失败：' + data.message);
                    }
                } catch (error) {
                    console.error('Logo auto-upload failed:', error);
                    antdMessage.error('Logo自动上传失败');
                }
            }
        }
    };

    const handleLicenseUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                antdMessage.error('请选择图片文件！');
                setMessage('请选择图片文件！');
                setTimeout(() => setMessage(''), 3000);
                return;
            }
            if (file.size > 10 * 1024 * 1024) {
                antdMessage.error('图片大小不能超过10MB！');
                setMessage('图片大小不能超过10MB！');
                setTimeout(() => setMessage(''), 3000);
                return;
            }

            // Case 1: Company exists - ID available -> Immediate Upload
            if (companyInfo.id) {
                try {
                    // Immediate upload
                    const formData = new FormData();
                    formData.append('business_license', file);

                    const token = getAuthToken();
                    const response = await fetch(`/api/companies/${companyInfo.id}/business-license`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        },
                        body: formData,
                    });

                    const data = await response.json();

                    if (data.status === 'success') {
                        // Update state with new URL
                        setCompanyInfo(prev => ({
                            ...prev,
                            business_license: data.data.business_license_url
                        }));
                        antdMessage.success('营业执照上传成功！');
                        setMessage('营业执照上传成功！');
                        setTimeout(() => setMessage(''), 3000);
                    } else {
                        antdMessage.error('上传失败：' + data.message);
                        setMessage('上传失败：' + data.message);
                    }
                } catch (error) {
                    console.error('上传失败:', error);
                    antdMessage.error('上传失败，请稍后重试');
                    setMessage('上传失败，请稍后重试');
                }
            }
            // Case 2: New Company (No ID) -> Store file locally for submission later
            else {
                setLicenseFile(file);
                // Create a local preview URL
                const previewUrl = URL.createObjectURL(file);
                setCompanyInfo(prev => ({
                    ...prev,
                    business_license: previewUrl
                }));
            }
        }
    };

    const handleSubmitVerification = async () => {
        // First, basic validation
        if (!companyInfo.name.trim()) {
            antdMessage.error('请输入公司名称！');
            setMessage('请输入公司名称！');
            setTimeout(() => setMessage(''), 3000);
            return;
        }
        if (!companyInfo.industry) {
            antdMessage.error('请选择所属行业！');
            setMessage('请选择所属行业！');
            setTimeout(() => setMessage(''), 3000);
            return;
        }
        if (!companyInfo.size) {
            antdMessage.error('请选择公司规模！');
            setMessage('请选择公司规模！');
            setTimeout(() => setMessage(''), 3000);
            return;
        }
        if (!companyInfo.address.trim()) {
            antdMessage.error('请输入公司地址！');
            setMessage('请输入公司地址！');
            setTimeout(() => setMessage(''), 3000);
            return;
        }

        // Validate Social Credit Code
        if (!verificationInfo.socialCreditCode.trim()) {
            antdMessage.error('请输入统一社会信用代码！');
            setMessage('请输入统一社会信用代码！');
            setTimeout(() => setMessage(''), 3000);
            return;
        }
        if (verificationInfo.socialCreditCode.length !== 18) {
            antdMessage.error('统一社会信用代码必须是18位字符！');
            setMessage('统一社会信用代码必须是18位字符！');
            setTimeout(() => setMessage(''), 3000);
            return;
        }

        // Validate Contact Info
        if (!verificationInfo.contactName.trim()) {
            antdMessage.error('请输入联系人姓名！');
            setMessage('请输入联系人姓名！');
            setTimeout(() => setMessage(''), 3000);
            return;
        }
        if (!verificationInfo.contactPhone.trim()) {
            antdMessage.error('请输入联系电话！');
            setMessage('请输入联系电话！');
            setTimeout(() => setMessage(''), 3000);
            return;
        }

        try {
            // 准备表单数据
            const formData = new FormData();
            formData.append('social_credit_code', verificationInfo.socialCreditCode);
            formData.append('contact_name', verificationInfo.contactName);
            formData.append('contact_phone', verificationInfo.contactPhone);
            formData.append('user_id', currentUser.id);

            // 添加公司基础信息确保更新
            formData.append('company_name', companyInfo.name);
            formData.append('industry', companyInfo.industry);
            formData.append('size', companyInfo.size);
            formData.append('address', companyInfo.address);

            let url = `/api/companies/${companyInfo.id}/verify`;

            // Case 1: New Company (No ID) -> Create & Verify
            if (!companyInfo.id) {
                url = `/api/companies/verify-create`;
                // Must attach file from state
                if (licenseFile) {
                    formData.append('business_license', licenseFile);
                } else {
                    antdMessage.error('请先上传营业执照！');
                    setMessage('请先上传营业执照！');
                    setTimeout(() => setMessage(''), 3000);
                    return;
                }

                // Add logo file if exists
                if (logoFile) {
                    formData.append('logo', logoFile);
                }
            }
            // Case 2: Existing Company -> Update & Verify
            else {
                // 如果已经上传了营业执照（在companyInfo中），传路径
                if (companyInfo.business_license) {
                    formData.append('business_license', companyInfo.business_license);
                } else {
                    antdMessage.error('请先上传营业执照！');
                    setMessage('请先上传营业执照！');
                    setTimeout(() => setMessage(''), 3000);
                    return;
                }
            }

            // 调用API submitted认证申请
            const token = getAuthToken();
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData,
            });

            const data = await response.json();

            if (data.status === 'success') {
                antdMessage.success(data.message || '企业认证提交成功！');
                setMessage(data.message || '企业认证成功！');

                // Update local state with returned data
                if (data.data) {
                    if (data.data.company) {
                        const newCompany = data.data.company;
                        setCompanyInfo(prev => ({
                            ...prev,
                            id: newCompany.id,
                            is_verified: true, // Pending but UI treats as submitted
                            business_license: data.data.business_license
                        }));
                    }
                } else {
                    setCompanyInfo(prev => ({ ...prev, is_verified: true }));
                }

                setTimeout(() => setMessage(''), 3000);
            } else {
                antdMessage.error(data.message || '认证申请提交失败，请稍后重试！');
                setMessage(data.message || '认证申请提交失败，请稍后重试！');
                setTimeout(() => setMessage(''), 3000);
            }
        } catch (error: any) {
            console.error('认证申请提交失败:', error);
            const errorMsg = error.message || '认证申请提交失败，请稍后重试！';
            antdMessage.error(errorMsg);
            setMessage(errorMsg);
            setTimeout(() => setMessage(''), 3000);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
            <div className="flex justify-between items-center mb-8 border-b border-gray-200 pb-4">
                <h2 className="text-3xl font-bold text-slate-900">企业认证</h2>
            </div>

            {message && <MessageAlert text={message} type="success" />}

            {isVerified ? (
                // 已认证状态显示
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-8">
                    {/* 认证成功提示 */}
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-green-800">企业已认证成功</h3>
                                <div className="mt-2 text-sm text-green-700">
                                    <p>您的企业已通过认证，现在可以享受完整的招聘功能。</p>
                                </div>
                                <div className="ml-auto">
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition shadow-sm flex items-center"
                                    >
                                        <PenTool className="w-4 h-4 mr-2" /> 编辑信息
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 已认证企业信息 */}
                    <div>
                        {isEditing ? (
                            // 编辑模式
                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 flex items-center mb-6">
                                        <Building2 className="w-5 h-5 mr-2 text-indigo-500" /> 公司信息
                                    </h3>

                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="relative">
                                            <div className="w-16 h-16 rounded-xl bg-gray-50 flex items-center justify-center text-3xl shadow-inner shrink-0 overflow-hidden">
                                                {processImageUrl(companyInfo.logo) ? (
                                                    <img src={processImageUrl(companyInfo.logo)!} alt="公司Logo" className="w-full h-full object-cover" />
                                                ) : (
                                                    companyInfo.logo || '🏢'
                                                )}
                                            </div>
                                            <button
                                                onClick={() => logoInputRef.current?.click()}
                                                className="absolute bottom-0 right-0 bg-indigo-600 text-white p-1.5 rounded-full shadow-md hover:bg-indigo-700 transition-colors border-2 border-white"
                                            >
                                                <Camera className="w-4 h-4" />
                                            </button>
                                            <input
                                                ref={logoInputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={handleLogoUpload}
                                                className="hidden"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <InputField
                                                label="公司名称"
                                                value={companyInfo.name}
                                                onChange={(e: any) => setCompanyInfo({ ...companyInfo, name: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                                        <div className="space-y-1">
                                            <label className="block text-sm font-medium text-gray-700">所属行业</label>
                                            <select
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                value={companyInfo.industry}
                                                onChange={(e) => setCompanyInfo({ ...companyInfo, industry: e.target.value })}
                                            >
                                                <option value="">请选择行业</option>
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
                                        <div className="space-y-1">
                                            <label className="block text-sm font-medium text-gray-700">公司规模</label>
                                            <select
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                value={companyInfo.size}
                                                onChange={(e) => setCompanyInfo({ ...companyInfo, size: e.target.value })}
                                            >
                                                <option value="">请选择规模</option>
                                                <option value="0-20">0-20人</option>
                                                <option value="20-99">20-99人</option>
                                                <option value="100-499">100-499人</option>
                                                <option value="500-999">500-999人</option>
                                                <option value="1000-9999">1000-9999人</option>
                                                <option value="10000+">10000人以上</option>
                                            </select>
                                        </div>
                                    </div>

                                    <InputField
                                        label="公司地址"
                                        value={companyInfo.address}
                                        onChange={(e: any) => setCompanyInfo({ ...companyInfo, address: e.target.value })}
                                    />
                                </div>

                                {/* 认证信息编辑 */}
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 flex items-center mb-6">
                                        <Shield className="w-5 h-5 mr-2 text-blue-500" /> 认证信息
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">统一社会信用代码</label>
                                            <input
                                                type="text"
                                                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                                placeholder="请输入统一社会信用代码"
                                                value={verificationInfo.socialCreditCode}
                                                onChange={(e) => setVerificationInfo({ ...verificationInfo, socialCreditCode: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">联系人姓名</label>
                                            <input
                                                type="text"
                                                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                                placeholder="请输入联系人姓名"
                                                value={verificationInfo.contactName}
                                                onChange={(e) => setVerificationInfo({ ...verificationInfo, contactName: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">联系电话</label>
                                            <input
                                                type="text"
                                                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                                placeholder="请输入联系电话"
                                                value={verificationInfo.contactPhone}
                                                onChange={(e) => setVerificationInfo({ ...verificationInfo, contactPhone: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">营业执照照片</label>
                                        <div
                                            className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition-colors cursor-pointer"
                                            onClick={() => licenseInputRef.current?.click()}
                                        >
                                            {companyInfo.business_license ? (
                                                <div className="flex flex-col items-center">
                                                    <img
                                                        src={companyInfo.business_license}
                                                        alt="营业执照"
                                                        className="max-w-full h-64 object-contain rounded-lg mb-2 border border-gray-200"
                                                    />
                                                    <p className="text-xs text-green-600 mt-1 font-medium">
                                                        点击更换图片
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center">
                                                    <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                    </svg>
                                                    <p className="mt-2 text-sm text-gray-500">
                                                        <span className="font-semibold">点击上传</span> 或拖拽文件到此处
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        PNG, JPG (最大 10MB)
                                                    </p>
                                                </div>
                                            )}

                                            <input
                                                ref={licenseInputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={handleLicenseUpload}
                                                className="hidden"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* 保存按钮 */}
                                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-gray-50 transition"
                                    >
                                        取消
                                    </button>
                                    <button
                                        onClick={handleSubmitVerification}
                                        className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 flex items-center"
                                    >
                                        <Save className="w-4 h-4 mr-2" /> 保存更新
                                    </button>
                                </div>
                            </div>
                        ) : (
                            // 查看模式
                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 flex items-center mb-6">
                                        <Building2 className="w-5 h-5 mr-2 text-indigo-500" /> 公司信息
                                    </h3>

                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="relative">
                                            <div className="w-16 h-16 rounded-xl bg-gray-50 flex items-center justify-center text-3xl shadow-inner shrink-0 overflow-hidden">
                                                {processImageUrl(companyInfo.logo) ? (
                                                    <img src={processImageUrl(companyInfo.logo)!} alt="公司Logo" className="w-full h-full object-cover" />
                                                ) : (
                                                    companyInfo.logo || '🏢'
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="mb-4">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">公司名称</label>
                                                <div className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-sm">{companyInfo.name}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">所属行业</label>
                                            <div className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-sm">{companyInfo.industry || '未填写'}</div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">公司规模</label>
                                            <div className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-sm">{companyInfo.size || '未填写'}</div>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">公司地址</label>
                                        <div className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-sm">{companyInfo.address || '未填写'}</div>
                                    </div>
                                </div>

                                {/* 认证信息 */}
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 flex items-center mb-6">
                                        <Shield className="w-5 h-5 mr-2 text-blue-500" /> 认证信息
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">统一社会信用代码</label>
                                            <div className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-sm">{verificationInfo.socialCreditCode || '未填写'}</div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">联系人姓名</label>
                                            <div className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-sm">{verificationInfo.contactName || '未填写'}</div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">联系电话</label>
                                            <div className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-sm">{verificationInfo.contactPhone || '未填写'}</div>
                                        </div>
                                    </div>

                                    <div className="mt-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">营业执照照片</label>
                                        <div className="border-2 border-gray-200 rounded-lg p-4 text-center">
                                            {companyInfo.business_license ? (
                                                <div className="flex flex-col items-center">
                                                    <img
                                                        src={companyInfo.business_license}
                                                        alt="营业执照"
                                                        className="max-w-full h-64 object-contain rounded-lg mb-2"
                                                    />
                                                    <p className="text-xs text-gray-500">
                                                        营业执照照片已上传
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center">
                                                    <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    <p className="mt-2 text-sm text-gray-500">
                                                        营业执照照片
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                // 未认证状态显示
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-8">
                    {/* 认证说明 */}
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-blue-800">为什么需要企业认证？</h3>
                                <div className="mt-2 text-sm text-blue-700">
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>认证后可以发布职位信息</li>
                                        <li>可以查看和联系候选人</li>
                                        <li>提升企业可信度</li>
                                        <li>享受完整的招聘功能</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 公司信息 */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 flex items-center mb-6">
                            <Building2 className="w-5 h-5 mr-2 text-indigo-500" /> 公司信息
                        </h3>

                        <div className="flex items-center gap-4 mb-6">
                            <div className="relative">
                                <div className="w-16 h-16 rounded-xl bg-gray-50 flex items-center justify-center text-3xl shadow-inner shrink-0 overflow-hidden">
                                    {processImageUrl(companyInfo.logo) ? (
                                        <img src={processImageUrl(companyInfo.logo)!} alt="公司Logo" className="w-full h-full object-cover" />
                                    ) : (
                                        companyInfo.logo || '🏢'
                                    )}
                                </div>
                                <button
                                    onClick={() => logoInputRef.current?.click()}
                                    className="absolute bottom-0 right-0 bg-indigo-600 text-white p-1.5 rounded-full shadow-md hover:bg-indigo-700 transition-colors border-2 border-white"
                                >
                                    <Camera className="w-4 h-4" />
                                </button>
                                <input
                                    ref={logoInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoUpload}
                                    className="hidden"
                                />
                            </div>
                            <div className="flex-1">
                                <InputField
                                    label="公司名称"
                                    value={companyInfo.name}
                                    onChange={(e: any) => setCompanyInfo({ ...companyInfo, name: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-700">所属行业</label>
                                <select
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    value={companyInfo.industry}
                                    onChange={(e) => setCompanyInfo({ ...companyInfo, industry: e.target.value })}
                                >
                                    <option value="">请选择行业</option>
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
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-700">公司规模</label>
                                <select
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    value={companyInfo.size}
                                    onChange={(e) => setCompanyInfo({ ...companyInfo, size: e.target.value })}
                                >
                                    <option value="">请选择规模</option>
                                    <option value="0-20">0-20人</option>
                                    <option value="20-99">20-99人</option>
                                    <option value="100-499">100-499人</option>
                                    <option value="500-999">500-999人</option>
                                    <option value="1000-9999">1000-9999人</option>
                                    <option value="10000+">10000人以上</option>
                                </select>
                            </div>
                        </div>

                        <InputField
                            label="公司地址"
                            value={companyInfo.address}
                            onChange={(e: any) => setCompanyInfo({ ...companyInfo, address: e.target.value })}
                        />
                    </div>

                    {/* 认证信息 */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 flex items-center mb-6">
                            <Shield className="w-5 h-5 mr-2 text-blue-500" /> 认证材料
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">统一社会信用代码</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    placeholder="请输入统一社会信用代码"
                                    value={verificationInfo.socialCreditCode}
                                    onChange={(e) => setVerificationInfo({ ...verificationInfo, socialCreditCode: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">联系人姓名</label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        placeholder="姓名"
                                        value={verificationInfo.contactName}
                                        onChange={(e) => setVerificationInfo({ ...verificationInfo, contactName: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">联系电话</label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        placeholder="电话号码"
                                        value={verificationInfo.contactPhone}
                                        onChange={(e) => setVerificationInfo({ ...verificationInfo, contactPhone: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-6">
                            <label className="block text-sm font-medium text-gray-700 mb-1">营业执照照片</label>
                            <div
                                className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition-colors cursor-pointer"
                                onClick={() => licenseInputRef.current?.click()}
                            >
                                {companyInfo.business_license ? (
                                    <div className="flex flex-col items-center">
                                        <img
                                            src={companyInfo.business_license}
                                            alt="营业执照"
                                            className="max-w-full h-64 object-contain rounded-lg mb-2 border border-gray-200"
                                        />
                                        <p className="text-xs text-green-600 mt-1 font-medium">
                                            点击更换图片
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                        <p className="mt-2 text-sm text-gray-500">
                                            <span className="font-semibold">点击上传</span> 或拖拽文件到此处
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            PNG, JPG (最大 10MB)
                                        </p>
                                    </div>
                                )}

                                <input
                                    ref={licenseInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLicenseUpload}
                                    className="hidden"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 提交按钮 */}
                    <div className="flex justify-center pt-4">
                        <button
                            onClick={handleSubmitVerification}
                            className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200 flex items-center justify-center"
                        >
                            <Save className="w-5 h-5 mr-2" /> 提交认证申请
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EnterpriseVerificationScreen;