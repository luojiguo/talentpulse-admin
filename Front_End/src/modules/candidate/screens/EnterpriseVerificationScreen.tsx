import React, { useState, useRef, useEffect } from 'react';
import { Shield, Building2, Camera, Save, PenTool } from 'lucide-react';
import InputField from '../components/InputField';
import MessageAlert from '../components/MessageAlert';

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
        contactInfo: ''
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
                const response = await fetch(`/api/companies/user/${currentUser.id}`);
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
                        contactInfo: company.contact_info || ''
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

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
            setLogoFile(file);
            const reader = new FileReader();
            reader.onload = (event) => {
                const result = event.target?.result as string;
                setCompanyInfo({...companyInfo, logo: result});
            };
            reader.readAsDataURL(file);
        }
    };

    const handleLicenseUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setMessage('请选择图片文件！');
                setTimeout(() => setMessage(''), 3000);
                return;
            }
            if (file.size > 10 * 1024 * 1024) {
                setMessage('图片大小不能超过10MB！');
                setTimeout(() => setMessage(''), 3000);
                return;
            }
            setLicenseFile(file);
        }
    };

    const handleSubmitVerification = async () => {
        try {
            // 检查是否有公司ID
            if (!companyInfo.id) {
                setMessage('未找到关联的公司，请先选择或创建公司！');
                setTimeout(() => setMessage(''), 3000);
                return;
            }
            
            // 准备表单数据，支持文件上传
            const formData = new FormData();
            formData.append('social_credit_code', verificationInfo.socialCreditCode);
            formData.append('contact_info', verificationInfo.contactInfo);
            formData.append('user_id', currentUser.id);
            
            // 添加营业执照文件
            if (licenseFile) {
                formData.append('business_license', licenseFile);
            }
            
            // 调用真实的API提交认证申请
            const response = await fetch(`/api/companies/${companyInfo.id}/verify`, {
                method: 'POST',
                body: formData,
            });
            
            const data = await response.json();
            
            if (data.status === 'success') {
                setMessage(data.message || '企业认证成功！');
                // 更新公司信息
                setCompanyInfo(prev => ({ ...prev, is_verified: true }));
                setTimeout(() => setMessage(''), 3000);
            } else {
                setMessage(data.message || '认证申请提交失败，请稍后重试！');
                setTimeout(() => setMessage(''), 3000);
            }
        } catch (error) {
            console.error('认证申请提交失败:', error);
            setMessage('认证申请提交失败，请稍后重试！');
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
                                        <Building2 className="w-5 h-5 mr-2 text-indigo-500"/> 公司信息
                                    </h3>
                                    
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="relative">
                                            <div className="w-16 h-16 rounded-xl bg-gray-50 flex items-center justify-center text-3xl shadow-inner shrink-0 overflow-hidden">
                                                {typeof companyInfo.logo === 'string' && companyInfo.logo.startsWith('data:image/') ? (
                                                    <img src={companyInfo.logo} alt="公司Logo" className="w-full h-full object-cover" />
                                                ) : (
                                                    companyInfo.logo
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
                                                onChange={(e: any) => setCompanyInfo({...companyInfo, name: e.target.value})} 
                                                required
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                                         <InputField 
                                             label="所属行业" 
                                             value={companyInfo.industry} 
                                             onChange={(e: any) => setCompanyInfo({...companyInfo, industry: e.target.value})} 
                                         />
                                         <InputField 
                                             label="公司规模" 
                                             value={companyInfo.size} 
                                             onChange={(e: any) => setCompanyInfo({...companyInfo, size: e.target.value})} 
                                         />
                                    </div>
                                    
                                    <InputField 
                                        label="公司地址" 
                                        value={companyInfo.address} 
                                        onChange={(e: any) => setCompanyInfo({...companyInfo, address: e.target.value})} 
                                    />
                                </div>

                                {/* 认证信息编辑 */}
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 flex items-center mb-6">
                                        <Shield className="w-5 h-5 mr-2 text-blue-500"/> 认证信息
                                    </h3>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">统一社会信用代码</label>
                                            <input 
                                                type="text" 
                                                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                                placeholder="请输入统一社会信用代码"
                                                value={verificationInfo.socialCreditCode}
                                                onChange={(e) => setVerificationInfo({...verificationInfo, socialCreditCode: e.target.value})}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">联系人信息</label>
                                            <input 
                                                type="text" 
                                                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                                placeholder="请输入联系人姓名和电话"
                                                value={verificationInfo.contactInfo}
                                                onChange={(e) => setVerificationInfo({...verificationInfo, contactInfo: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="mt-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">营业执照照片</label>
                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition-colors">
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
                                                {licenseFile && (
                                                    <p className="text-xs text-green-500 mt-1">
                                                        已选择文件: {licenseFile.name}
                                                    </p>
                                                )}
                                            </div>
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
                                        <Building2 className="w-5 h-5 mr-2 text-indigo-500"/> 公司信息
                                    </h3>
                                    
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="relative">
                                            <div className="w-16 h-16 rounded-xl bg-gray-50 flex items-center justify-center text-3xl shadow-inner shrink-0 overflow-hidden">
                                                {typeof companyInfo.logo === 'string' && companyInfo.logo.startsWith('data:image/') ? (
                                                    <img src={companyInfo.logo} alt="公司Logo" className="w-full h-full object-cover" />
                                                ) : (
                                                    companyInfo.logo
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
                                        <Shield className="w-5 h-5 mr-2 text-blue-500"/> 认证信息
                                    </h3>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">统一社会信用代码</label>
                                            <div className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-sm">{verificationInfo.socialCreditCode || '未填写'}</div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">联系人信息</label>
                                            <div className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-sm">{verificationInfo.contactInfo || '未填写'}</div>
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
                            <Building2 className="w-5 h-5 mr-2 text-indigo-500"/> 公司信息
                        </h3>
                        
                        <div className="flex items-center gap-4 mb-6">
                            <div className="relative">
                                <div className="w-16 h-16 rounded-xl bg-gray-50 flex items-center justify-center text-3xl shadow-inner shrink-0 overflow-hidden">
                                    {typeof companyInfo.logo === 'string' && companyInfo.logo.startsWith('data:image/') ? (
                                        <img src={companyInfo.logo} alt="公司Logo" className="w-full h-full object-cover" />
                                    ) : (
                                        companyInfo.logo
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
                                    onChange={(e: any) => setCompanyInfo({...companyInfo, name: e.target.value})} 
                                    required
                                />
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                             <InputField 
                                 label="所属行业" 
                                 value={companyInfo.industry} 
                                 onChange={(e: any) => setCompanyInfo({...companyInfo, industry: e.target.value})} 
                             />
                             <InputField 
                                 label="公司规模" 
                                 value={companyInfo.size} 
                                 onChange={(e: any) => setCompanyInfo({...companyInfo, size: e.target.value})} 
                             />
                        </div>
                        
                        <InputField 
                            label="公司地址" 
                            value={companyInfo.address} 
                            onChange={(e: any) => setCompanyInfo({...companyInfo, address: e.target.value})} 
                        />
                    </div>

                    {/* 认证信息 */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 flex items-center mb-6">
                            <Shield className="w-5 h-5 mr-2 text-blue-500"/> 认证材料
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">统一社会信用代码</label>
                                <input 
                                    type="text" 
                                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    placeholder="请输入统一社会信用代码"
                                    value={verificationInfo.socialCreditCode}
                                    onChange={(e) => setVerificationInfo({...verificationInfo, socialCreditCode: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">联系人信息</label>
                                <input 
                                    type="text" 
                                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    placeholder="请输入联系人姓名和电话"
                                    value={verificationInfo.contactInfo}
                                    onChange={(e) => setVerificationInfo({...verificationInfo, contactInfo: e.target.value})}
                                />
                            </div>
                        </div>
                        
                        <div className="mt-6">
                            <label className="block text-sm font-medium text-gray-700 mb-1">营业执照照片</label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition-colors">
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
                                    {licenseFile && (
                                        <p className="text-xs text-green-500 mt-1">
                                            已选择文件: {licenseFile.name}
                                        </p>
                                    )}
                                </div>
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