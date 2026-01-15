import React, { useState, useRef, useEffect } from 'react';
import { User, Camera, Building2, Shield, Settings, Save, Sparkles, ChevronDown, ChevronUp, Lock, Eye, EyeOff, Mail } from 'lucide-react';
import { INDUSTRY_OPTIONS, COMPANY_SIZE_OPTIONS } from '@/constants/constants';
import { UserRole } from '@/types/types';
import { userAPI, companyAPI } from '@/services/apiService';
import { MessageAlert } from './CommonComponents';
import { InputField } from './CommonComponents';
import { generateCompanyDescription } from '@/services/aiService';
import { Modal, message } from 'antd';
import { processAvatarUrl } from '@/components/AvatarUploadComponent';
import UserAvatar from '@/components/UserAvatar';


interface RecruiterProfileScreenProps {
    onSwitchRole: (role: UserRole) => void;
    profile: any;
    setProfile: any;
    fetchRecruiterProfile: () => Promise<void>;
}

const RecruiterProfileScreen: React.FC<RecruiterProfileScreenProps> = ({
    onSwitchRole, profile, setProfile, fetchRecruiterProfile
}) => {
    const [alertMessage, setAlertMessage] = useState('');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const avatarInputRef = useRef<HTMLInputElement>(null);



    // Company logo upload state
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);


    // Password Change State
    const [passwordModalVisible, setPasswordModalVisible] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
        verificationCode: ''
    });
    const [passwordVisible, setPasswordVisible] = useState({
        old: false,
        new: false,
        confirm: false
    });
    const [countdown, setCountdown] = useState(0);
    const [sendingCode, setSendingCode] = useState(false);

    // Business license upload state
    const businessLicenseInputRef = useRef<HTMLInputElement>(null);
    const [isCompanyInfoExpanded, setIsCompanyInfoExpanded] = useState(false);

    // AI Generation Modal States
    const [aiModalVisible, setAiModalVisible] = useState(false);
    const [aiKeywords, setAiKeywords] = useState('');
    const [aiStyle, setAiStyle] = useState('专业');
    const [generatedPreview, setGeneratedPreview] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    // 倒计时逻辑
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => {
                setCountdown(countdown - 1);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    // 发送验证码
    const handleSendCode = async () => {
        if (!profile.email) {
            message.error('请先绑定邮箱');
            return;
        }

        try {
            setSendingCode(true);
            const response = await userAPI.sendVerificationCode();
            if (response.status === 'success') {
                message.success('验证码已发送至您的邮箱');
                setCountdown(60);
            } else {
                message.error(response.message || '发送验证码失败');
            }
        } catch (error: any) {
            console.error('发送验证码错误:', error);
            message.error(error.response?.data?.message || '发送验证码失败，请稍后重试');
        } finally {
            setSendingCode(false);
        }
    };

    // 修改密码
    const handlePasswordChange = async () => {
        const { oldPassword, newPassword, confirmPassword, verificationCode } = passwordForm;

        if (!oldPassword || !newPassword || !confirmPassword || !verificationCode) {
            message.error('请填写所有必填字段');
            return;
        }

        if (newPassword !== confirmPassword) {
            message.error('两次输入的新密码不一致');
            return;
        }

        if (newPassword.length < 6) {
            message.error('新密码长度不能少于6位');
            return;
        }

        try {
            setLoading(true);
            await userAPI.updatePassword({
                oldPassword,
                newPassword,
                verificationCode
            });

            message.success('密码修改成功，请重新登录');

            // 清除本地存储通过
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('currentUser');

            // 强制跳转登录页
            window.location.replace('/');

        } catch (error: any) {
            console.error('密码修改失败:', error);
            const errorMsg = error.response?.data?.message || '密码修改失败';
            if (errorMsg === 'INVALID_OLD_PASSWORD') {
                message.error('旧密码错误');
            } else if (errorMsg === 'INVALID_VERIFICATION_CODE') {
                message.error('验证码错误');
            } else if (errorMsg === 'VERIFICATION_CODE_EXPIRED') {
                message.error('验证码已过期，请重新获取');
            } else {
                message.error(errorMsg);
            }
        } finally {
            setLoading(false);
        }
    };

    // AI company description generation handler
    const handleGenerateCompanyDescription = () => {
        // Check if required fields are filled
        if (!profile.company?.name || !profile.company?.industry || !profile.company?.company_type || !profile.company?.size) {
            setAlertMessage('请先填写公司名称、所属行业、公司类型和公司规模，才能使用AI生成！');
            setTimeout(() => setAlertMessage(''), 3000);
            return;
        }

        // Reset and show modal
        setGeneratedPreview(profile.company?.description || '');
        setAiModalVisible(true);
    };

    const executeCompanyDescriptionGeneration = async () => {
        try {
            setIsGenerating(true);
            // Generate company description using AI
            const description = await generateCompanyDescription(
                profile.company.name,
                profile.company.industry,
                profile.company.company_type,
                profile.company.size,
                aiKeywords,
                aiStyle
            );
            setGeneratedPreview(description);
            message.success('已为您生成新的公司简介');
        } catch (error) {
            console.error('生成公司简介错误:', error);
            message.error('生成公司简介失败，请稍后重试');
        } finally {
            setIsGenerating(false);
        }
    };

    const applyGeneratedDescription = () => {
        if (!generatedPreview) {
            message.warning('预览内容为空');
            return;
        }
        setProfile({ ...profile, company: { ...profile.company, description: generatedPreview } });
        setAiModalVisible(false);
        setAlertMessage('公司简介已更新，请记得点击下方的“保存更改”！');
        setTimeout(() => setAlertMessage(''), 3000);
    };

    // 组件挂载时获取最新信息
    useEffect(() => {
        // 使用传入的fetchRecruiterProfile函数获取完整的招聘者信息，包括公司信息
        fetchRecruiterProfile();
    }, []);

    const handleSave = async () => {
        try {
            setLoading(true);
            // 调用后端API更新用户信息
            const userId = profile.id?.toString() || profile.id;

            // 只发送companies表中实际存在的字段
            const userData = {
                ...profile,
                company: {
                    ...profile.company,
                    // 移除可能不存在于companies表中的字段
                    verification_status: undefined
                }
            };

            const response = await userAPI.updateUser(userId, userData);

            if (response.status === 'success') {
                // 保存成功后，重新获取最新的个人信息，确保页面显示的是最新数据
                const latestRecruiterProfile = await fetchRecruiterProfile();

                setAlertMessage('个人及公司信息已成功更新！');
                setTimeout(() => setAlertMessage(''), 3000);
            } else {
                setAlertMessage('个人及公司信息更新失败：' + response.message);
                setTimeout(() => setAlertMessage(''), 3000);
            }
        } catch (error) {
            console.error('个人及公司信息更新错误:', error);
            setAlertMessage('个人及公司信息更新失败，请稍后重试！');
            setTimeout(() => setAlertMessage(''), 3000);
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // 检查文件类型
            if (!file.type.startsWith('image/')) {
                setAlertMessage('请选择图片文件！');
                setTimeout(() => setAlertMessage(''), 3000);
                return;
            }

            // 检查文件大小（限制为5MB）
            if (file.size > 5 * 1024 * 1024) {
                setAlertMessage('图片大小不能超过5MB！');
                setTimeout(() => setAlertMessage(''), 3000);
                return;
            }

            setAvatarFile(file);

            try {
                setLoading(true);
                // 调用后端API上传头像
                // 使用profile.id作为用户ID，确保头像上传到当前用户的记录中
                const userId = profile.id?.toString() || profile.id; // 使用profile.id，如果不存在则使用默认值
                const response = await userAPI.uploadAvatar(userId, file);

                if (response.status === 'success') {
                    // 使用后端返回的头像路径，添加时间戳强制刷新
                    const avatarUrl = response.avatarPath || response.data.avatar;

                    // 添加短暂延迟，确保文件已完全写入磁盘
                    await new Promise(resolve => setTimeout(resolve, 500));

                    // 添加时间戳参数强制浏览器重新加载
                    const avatarUrlWithTimestamp = `${avatarUrl}?t=${Date.now()}`;

                    setProfile({ ...profile, avatar: avatarUrlWithTimestamp });

                    // Update localStorage and dispatch event to sync across app
                    const storedUser = localStorage.getItem('currentUser');
                    if (storedUser) {
                        const currentUser = JSON.parse(storedUser);
                        currentUser.avatar = avatarUrlWithTimestamp;
                        localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    }
                    window.dispatchEvent(new CustomEvent('userAvatarUpdated', { detail: { avatar: avatarUrlWithTimestamp } }));

                    // 显示保存成功消息
                    setAlertMessage('头像已成功上传！');
                    setTimeout(() => setAlertMessage(''), 3000);
                } else {
                    setAlertMessage('头像上传失败：' + response.message);
                    setTimeout(() => setAlertMessage(''), 3000);
                }
            } catch (error) {
                console.error('头像上传错误:', error);
                setAlertMessage('头像上传失败，请稍后重试！');
                setTimeout(() => setAlertMessage(''), 3000);
            } finally {
                setLoading(false);
            }
        }
    };

    // Company logo upload handler
    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // 检查文件类型
            if (!file.type.startsWith('image/')) {
                setAlertMessage('请选择图片文件！');
                setTimeout(() => setAlertMessage(''), 3000);
                return;
            }

            // 检查文件大小（限制为5MB）
            if (file.size > 5 * 1024 * 1024) {
                setAlertMessage('图片大小不能超过5MB！');
                setTimeout(() => setAlertMessage(''), 3000);
                return;
            }

            setLogoFile(file);

            try {
                setLoading(true);
                // 调用后端API上传公司Logo
                const response = await companyAPI.uploadCompanyLogo(profile.company?.id, file);

                if (response.status === 'success' || response.success) {
                    // 使用后端返回的Logo路径
                    // 注意：后端返回格式为 { status: 'success', data: { logo: '...' } }
                    // request.ts 会将其包装为 { success: true, data: { logo: '...' }, status: 'success' ... }
                    const logoUrl = response.data.logo || response.data.logo_url;
                    setProfile({ ...profile, company: { ...profile.company, logo: logoUrl } });

                    // 显示保存成功消息
                    setAlertMessage('公司Logo已成功上传！');
                    setTimeout(() => setAlertMessage(''), 3000);
                } else {
                    setAlertMessage('公司Logo上传失败：' + (response.message || '未知错误'));
                    setTimeout(() => setAlertMessage(''), 3000);
                }
            } catch (error) {
                console.error('公司Logo上传错误:', error);
                setAlertMessage('公司Logo上传失败，请稍后重试！');
                setTimeout(() => setAlertMessage(''), 3000);
            } finally {
                setLoading(false);
            }
        }
    };

    // 提交企业认证申请
    const handleSubmitVerification = async () => {
        if (!profile.company?.business_license) {
            setAlertMessage('请先上传营业执照！');
            setTimeout(() => setAlertMessage(''), 3000);
            return;
        }

        if (!profile.company?.social_credit_code || profile.company.social_credit_code.length !== 18) {
            setAlertMessage('请填写正确的18位统一社会信用代码！');
            setTimeout(() => setAlertMessage(''), 3000);
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`/api/companies/${profile.company.id}/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    social_credit_code: profile.company.social_credit_code,
                    contact_info: profile.company.contact_info || profile.name,
                    user_id: profile.id,
                    business_license: profile.company.business_license
                })
            });

            const data = await response.json();

            if (data.status === 'success') {
                // Update local profile state
                setProfile({
                    ...profile,
                    company: {
                        ...profile.company,
                        is_verified: false,
                        // Assuming the backend sets status to 'active' which implies 'Pending' when is_verified is false
                        status: 'active'
                    }
                });

                await fetchRecruiterProfile(); // Reload to get exact status

                setAlertMessage('认证申请已提交，请等待管理员审核！');
                setTimeout(() => setAlertMessage(''), 3000);
            } else {
                setAlertMessage('提交认证失败：' + data.message);
                setTimeout(() => setAlertMessage(''), 3000);
            }
        } catch (error) {
            console.error('提交认证失败:', error);
            setAlertMessage('提交认证失败，请稍后重试！');
            setTimeout(() => setAlertMessage(''), 3000);
        } finally {
            setLoading(false);
        }
    };

    // 获取字段的默认值或提示文本
    const getFieldPlaceholder = (fieldName: string, value: any) => {
        if (value) return value;
        switch (fieldName) {
            case 'name':
                return '请输入姓名';
            case 'role':
                return '请输入职位';
            case 'email':
                return '请输入电子邮箱';
            case 'phone':
                return '请输入联系电话';
            case 'company.name':
                return '请输入公司名称';
            case 'company.industry':
                return '请输入所属行业';
            case 'company.size':
                return '请输入公司规模';
            case 'company.company_type':
                return '请输入公司类型';
            case 'company.establishment_date':
                return 'YYYY-MM-DD';
            case 'company.registered_capital':
                return '请输入注册资本';
            case 'company.social_credit_code':
                return '请输入统一社会信用代码';
            case 'company.company_website':
                return 'https://';
            case 'company.company_phone':
                return '请输入公司电话';
            case 'company.company_email':
                return '请输入公司邮箱';
            case 'company.contact_info':
                return '请输入联系人信息';
            case 'company.address':
                return '请输入公司地址';
            case 'company.description':
                return '请输入公司简介，展示公司的优势和发展前景...';
            default:
                return '';
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">个人中心中心</h2>

            {alertMessage && <MessageAlert text={alertMessage} />}

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center">
                        <User className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" /> 个人信息
                    </h3>
                    <button
                        onClick={() => setPasswordModalVisible(true)}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 font-bold flex items-center transition-all hover:scale-105 active:scale-95"
                    >
                        <Lock className="w-4 h-4 mr-1.5" /> 修改密码
                    </button>
                </div>
                <div className="p-8 flex flex-col md:flex-row items-center md:items-start gap-8">
                    <div className="relative group">
                        <UserAvatar
                            src={profile.avatar}
                            name={profile.name}
                            size={112}
                            className="w-28 h-28 rounded-full border-4 border-white dark:border-slate-700 shadow-lg bg-blue-100 text-blue-600 group-hover:scale-105 transition-transform duration-300"
                        />
                        <button
                            onClick={() => avatarInputRef.current?.click()}
                            className="absolute bottom-1 right-1 bg-blue-600 text-white p-2.5 rounded-full shadow-lg hover:bg-blue-700 transition-all border-2 border-white dark:border-slate-700 z-10 active:scale-95"
                            disabled={loading}
                        >
                            <Camera className="w-5 h-5" />
                        </button>
                        <input
                            ref={avatarInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            className="hidden"
                        />
                    </div>
                    <div className="flex-1 w-full space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField
                                label="姓名"
                                value={profile.name}
                                onChange={(e: any) => setProfile({ ...profile, name: e.target.value })}
                                placeholder={getFieldPlaceholder('name', '')}
                                disabled={loading}
                            />
                            <InputField
                                label="职位"
                                value={profile.position || ''}
                                onChange={(e: any) => setProfile({ ...profile, position: e.target.value })}
                                placeholder="请输入职位"
                                disabled={loading}
                            />
                            <InputField
                                label="联系邮箱"
                                value={profile.email}
                                onChange={(e: any) => setProfile({ ...profile, email: e.target.value })}
                                placeholder={getFieldPlaceholder('email', '')}
                                disabled={loading}
                            />
                            <InputField
                                label="联系电话"
                                value={profile.phone}
                                onChange={(e: any) => setProfile({ ...profile, phone: e.target.value })}
                                placeholder={getFieldPlaceholder('phone', '')}
                                disabled={loading}
                            />
                            <InputField
                                label="微信号"
                                value={profile.wechat || ''}
                                onChange={(e: any) => setProfile({ ...profile, wechat: e.target.value })}
                                placeholder="请输入微信号，方便与候选人沟通"
                                disabled={loading}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div
                    className="p-6 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                    onClick={() => setIsCompanyInfoExpanded(!isCompanyInfoExpanded)}
                >
                    <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center">
                        <Building2 className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" /> 公司信息与认证
                    </h3>
                    {isCompanyInfoExpanded ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
                </div>
                {isCompanyInfoExpanded && (
                    <div className="p-8">
                        {/* 检查是否绑定公司 */}
                        {!profile.company?.id || !profile.company?.name ? (
                            <div className="mb-6 p-5 bg-red-50 border border-red-200 rounded-lg">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-red-800">⚠️ 未绑定公司信息</h3>
                                        <div className="mt-2 text-sm text-red-700">
                                            <p>您尚未绑定公司信息，请先填写并保存公司信息，以便进行企业认证。</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : null}

                        {/* 认证状态显示 */}
                        <div className={`mb-6 p-5 rounded-2xl ${profile.company?.is_verified
                            ? 'bg-blue-50/50 border border-blue-200 dark:bg-blue-900/10 dark:border-blue-800/50'
                            : (profile.company?.status === 'active' && !profile.company?.is_verified)
                                ? 'bg-blue-50/50 border border-blue-200 dark:bg-blue-900/10 dark:border-blue-800/50' // Pending state
                                : 'bg-amber-50/50 border border-amber-200 dark:bg-amber-900/10 dark:border-amber-800/50' // Unverified/Rejected state
                            }`}>
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    {profile.company?.is_verified ? (
                                        <svg className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    ) : (profile.company?.status === 'active' && !profile.company?.is_verified) ? (
                                        <svg className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    ) : (
                                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-gray-800 dark:text-slate-100">企业认证状态</h3>
                                    <div className="mt-2 text-sm">
                                        <div>
                                            {profile.company?.is_verified ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-blue-600 font-medium">✅ 您的企业已通过认证</span>
                                                    <span className="text-xs text-blue-500">认证日期：{profile.company?.verification_date ? new Date(profile.company.verification_date).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }) : '未知'}</span>
                                                </div>
                                            ) : (profile.company?.status === 'active' && !profile.company?.is_verified) ? (
                                                <div className="flex flex-col gap-2">
                                                    <span className="text-blue-600 font-medium">⏳ 您的企业认证正在审核中</span>
                                                    <p className="text-gray-600 text-xs">管理员正在审核您的申请，请耐心等待。</p>
                                                </div>
                                            ) : (
                                                <>
                                                    <span className="text-yellow-600 font-medium">⚠️ 您的企业尚未认证</span>
                                                    <p className="mt-1 text-gray-600">认证后可以发布职位和查看候选人信息</p>
                                                    <ul className="mt-2 space-y-1 text-xs text-gray-600 list-disc list-inside">
                                                        <li>填写完整的公司信息（包括统一社会信用代码）</li>
                                                        <li>上传营业执照照片</li>
                                                        <li>点击"提交认证申请"按钮</li>
                                                    </ul>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 mb-6">
                            <div className="relative">
                                <div className="w-16 h-16 rounded-xl bg-gray-50 flex items-center justify-center text-3xl shadow-inner shrink-0 overflow-hidden">
                                    {typeof profile.company?.logo === 'string' && (profile.company.logo.startsWith('data:image/') || profile.company.logo.startsWith('/companies_logo/') || profile.company.logo.startsWith('http')) ? (
                                        <img src={profile.company.logo} alt="公司Logo" className="w-full h-full object-cover" />
                                    ) : (
                                        profile.company?.logo || '公司Logo'
                                    )}
                                </div>
                                <button
                                    onClick={() => logoInputRef.current?.click()}
                                    className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full shadow-md hover:bg-blue-700 transition-all border-2 border-white dark:border-slate-800 active:scale-95"
                                    disabled={loading}
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
                                    value={profile.company?.name}
                                    onChange={(e: any) => setProfile({ ...profile, company: { ...profile.company, name: e.target.value } })}
                                    placeholder={getFieldPlaceholder('company.name', '')}
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                            {/* 所属行业 - 下拉选择 */}
                            <InputField
                                label="所属行业"
                                value={profile.company?.industry}
                                onChange={(e: any) => setProfile({ ...profile, company: { ...profile.company, industry: e.target.value } })}
                                placeholder="请选择所属行业"
                                options={INDUSTRY_OPTIONS}
                                disabled={loading}
                            />

                            {/* 公司规模 - 下拉选择 */}
                            <InputField
                                label="公司规模"
                                value={profile.company?.size}
                                onChange={(e: any) => setProfile({ ...profile, company: { ...profile.company, size: e.target.value } })}
                                placeholder="请选择公司规模"
                                options={COMPANY_SIZE_OPTIONS}
                                disabled={loading}
                            />

                            {/* 公司类型 - 下拉选择 */}
                            <InputField
                                label="公司类型"
                                value={profile.company?.company_type}
                                onChange={(e: any) => setProfile({ ...profile, company: { ...profile.company, company_type: e.target.value } })}
                                placeholder="请选择公司类型"
                                options={[
                                    { value: '国企', label: '国企' },
                                    { value: '民企', label: '民企' },
                                    { value: '外企', label: '外企' },
                                    { value: '合资', label: '合资' },
                                    { value: '上市公司', label: '上市公司' },
                                    { value: '创业公司', label: '创业公司' },
                                    { value: '其他', label: '其他' }
                                ]}
                                disabled={loading}
                            />

                            {/* 成立日期 - 日期选择器 */}
                            <InputField
                                label="成立日期"
                                type="date"
                                value={profile.company?.establishment_date}
                                onChange={(e: any) => setProfile({ ...profile, company: { ...profile.company, establishment_date: e.target.value } })}
                                placeholder={getFieldPlaceholder('company.establishment_date', '')}
                                disabled={loading}
                            />

                            {/* 注册资本 - 数字输入 */}
                            <InputField
                                label="注册资本"
                                type="number"
                                value={profile.company?.registered_capital}
                                onChange={(e: any) => setProfile({ ...profile, company: { ...profile.company, registered_capital: e.target.value } })}
                                placeholder="请输入注册资本（万元）"
                                disabled={loading}
                            />

                            {/* 统一社会信用代码 - 支持字母和数字 */}
                            <InputField
                                label="统一社会信用代码"
                                value={profile.company?.social_credit_code}
                                onChange={(e: any) => setProfile({ ...profile, company: { ...profile.company, social_credit_code: e.target.value } })}
                                placeholder={getFieldPlaceholder('company.social_credit_code', '')}
                                disabled={loading}
                            />

                            {/* 公司网站 - URL输入 */}
                            <InputField
                                label="公司网站"
                                type="url"
                                value={profile.company?.company_website}
                                onChange={(e: any) => setProfile({ ...profile, company: { ...profile.company, company_website: e.target.value } })}
                                placeholder={getFieldPlaceholder('company.company_website', '')}
                                disabled={loading}
                            />

                            {/* 公司电话 - 电话输入 */}
                            <InputField
                                label="公司电话"
                                type="tel"
                                value={profile.company?.company_phone}
                                onChange={(e: any) => setProfile({ ...profile, company: { ...profile.company, company_phone: e.target.value } })}
                                placeholder={getFieldPlaceholder('company.company_phone', '')}
                                disabled={loading}
                            />

                            {/* 公司邮箱 - 邮箱输入 */}
                            <InputField
                                label="公司邮箱"
                                type="email"
                                value={profile.company?.company_email}
                                onChange={(e: any) => setProfile({ ...profile, company: { ...profile.company, company_email: e.target.value } })}
                                placeholder={getFieldPlaceholder('company.company_email', '')}
                                disabled={loading}
                            />

                            <InputField
                                label="联系人信息"
                                value={profile.company?.contact_info || ''}
                                onChange={(e: any) => setProfile({ ...profile, company: { ...profile.company, contact_info: e.target.value } })}
                                placeholder={getFieldPlaceholder('company.contact_info', '')}
                                disabled={loading}
                            />
                        </div>

                        {/* 公司地址 */}
                        <InputField
                            label="公司地址"
                            value={profile.company?.address}
                            onChange={(e: any) => setProfile({ ...profile, company: { ...profile.company, address: e.target.value } })}
                            placeholder={getFieldPlaceholder('company.address', '')}
                            disabled={loading}
                        />

                        {/* 公司简介 - 多行文本 */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="block text-sm font-medium text-gray-700">公司简介</label>
                                <button
                                    onClick={handleGenerateCompanyDescription}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold rounded-xl hover:bg-blue-600 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed group active:scale-95 shadow-sm"
                                    disabled={loading}
                                >
                                    <Sparkles className="w-4 h-4 group-hover:animate-pulse" />
                                    {loading ? '生成中...' : '使用 AI 完善简介'}
                                </button>
                            </div>
                            <InputField
                                label="公司简介"
                                value={profile.company?.description || ''}
                                onChange={(e: any) => setProfile({ ...profile, company: { ...profile.company, description: e.target.value } })}
                                placeholder={getFieldPlaceholder('company.description', '')}
                                textarea={true}
                                disabled={loading}
                            />
                        </div>

                        {/* 企业认证信息 */}
                        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                            <h4 className="text-md font-bold text-slate-800 dark:text-slate-100 flex items-center mb-4">
                                <Shield className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" /> {profile.company?.is_verified ? '企业认证信息' : '企业认证申请'}
                            </h4>

                            {!profile.company?.is_verified && (
                                <p className="text-sm text-gray-600 mb-4">
                                    提交企业认证信息，上传相关材料后即可立即通过认证，享受完整的招聘功能。
                                </p>
                            )}

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-1">营业执照照片</label>
                                <div
                                    className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition-colors cursor-pointer"
                                    onClick={() => businessLicenseInputRef.current?.click()}
                                >
                                    {profile.company?.business_license ? (
                                        <div className="relative mb-4">
                                            <img
                                                src={profile.company?.business_license}
                                                alt="营业执照"
                                                className="max-w-full h-auto rounded max-h-64 object-contain border border-gray-200 shadow-sm"
                                            />

                                            <div className="mt-2 text-sm text-gray-600">
                                                <p>已上传营业执照，点击区域可更换</p>
                                            </div>
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
                                        ref={businessLicenseInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={async (e: any) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                try {
                                                    setLoading(true);
                                                    // 调用后端API上传营业执照照片
                                                    const formData = new FormData();
                                                    formData.append('business_license', file);

                                                    // 使用专门的营业执照上传API
                                                    const response = await fetch(`/api/companies/${profile.company?.id}/business-license`, {
                                                        method: 'POST',
                                                        body: formData,
                                                        credentials: 'include',
                                                        headers: {
                                                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                                                        }
                                                    });

                                                    const responseData = await response.json();

                                                    if (responseData.status === 'success') {
                                                        // 更新营业执照照片路径
                                                        const licenseUrl = responseData.data.business_license_url;
                                                        setProfile({ ...profile, company: { ...profile.company, business_license: licenseUrl } });
                                                        setAlertMessage('营业执照照片已成功上传！');
                                                        setTimeout(() => setAlertMessage(''), 3000);
                                                    } else {
                                                        setAlertMessage('营业执照照片上传失败：' + responseData.message);
                                                        setTimeout(() => setAlertMessage(''), 3000);
                                                    }
                                                } catch (error) {
                                                    console.error('营业执照照片上传错误:', error);
                                                    setAlertMessage('营业执照照片上传失败，请稍后重试！');
                                                    setTimeout(() => setAlertMessage(''), 3000);
                                                } finally {
                                                    setLoading(false);
                                                }
                                            }
                                        }}
                                    />
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <button
                                        onClick={handleSubmitVerification}
                                        disabled={loading || profile.company?.is_verified || (profile.company?.status === 'active' && !profile.company?.is_verified)}
                                        className={`px-6 py-2.5 rounded-xl font-bold transition-all border shadow-md flex items-center gap-2 active:scale-95
                                            ${(loading || profile.company?.is_verified || (profile.company?.status === 'active' && !profile.company?.is_verified))
                                                ? 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800 dark:text-slate-600 dark:border-slate-700 cursor-not-allowed'
                                                : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-blue-200/50'
                                            }`}
                                    >
                                        <Shield className="w-4 h-4" />
                                        {(profile.company?.status === 'active' && !profile.company?.is_verified) ? '认证审核中' : '开始企业认证'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/50">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center">
                        <Settings className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" /> 账号操作
                    </h3>
                </div>
                <div className="p-8 flex flex-col md:flex-col gap-4">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <button
                            onClick={handleSave}
                            className="flex items-center justify-center w-full md:w-auto px-10 py-3.5 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 dark:shadow-blue-900/20 active:scale-95 group"
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="animate-spin mr-2.5 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                            ) : (
                                <Save className="w-5 h-5 mr-2.5 group-hover:scale-110 transition-transform" />
                            )}
                            {loading ? '正在保存...' : '保存所有更改'}
                        </button>

                        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                            <button
                                onClick={() => setPasswordModalVisible(true)}
                                className="flex items-center justify-center px-6 py-3.5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-600 transition-all border border-slate-200 dark:border-slate-600 shadow-sm active:scale-95"
                                disabled={loading}
                            >
                                <Lock className="w-5 h-5 mr-2.5" /> 安全设置
                            </button>

                            <button
                                onClick={() => onSwitchRole('candidate')}
                                className="flex items-center justify-center px-6 py-3.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold rounded-2xl hover:bg-blue-600 hover:text-white transition-all border border-blue-100 dark:border-blue-800/50 shadow-sm active:scale-95"
                                disabled={loading}
                            >
                                <User className="w-5 h-5 mr-2.5" /> 切换为求职者身份
                            </button>
                        </div>
                    </div>

                    {/* 注销账号功能 */}
                    <div className="pt-6 border-t border-gray-200">
                        <h4 className="text-md font-semibold text-red-700 flex items-center mb-4">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                            账号注销
                        </h4>
                        <div className="flex flex-col md:flex-row gap-4">
                            <button
                                onClick={() => {
                                    Modal.confirm({
                                        title: '确认注销账号',
                                        content: (
                                            <div>
                                                <p className="mb-4">确定要注销账号吗？</p>
                                                <p className="text-red-500 font-medium">
                                                    此操作不可恢复，所有数据将被永久删除，包括：
                                                </p>
                                                <ul className="list-disc list-inside text-sm text-gray-600 mt-2">
                                                    <li>个人信息和联系方式</li>
                                                    <li>公司信息和职位发布</li>
                                                    <li>候选人数据和沟通记录</li>
                                                    <li>所有相关的简历和投递记录</li>
                                                </ul>
                                            </div>
                                        ),
                                        okText: '确定注销',
                                        okType: 'danger',
                                        cancelText: '取消',
                                        onOk: async () => {
                                            try {
                                                setLoading(true);
                                                const userId = profile.id;
                                                if (!userId) return;

                                                const response = await userAPI.deleteAccount(String(userId));
                                                // 无论响应状态如何，都清除本地存储并跳转到登录页
                                                // 因为数据库已经删除了用户，本地状态必须同步
                                                localStorage.removeItem('currentUser');
                                                localStorage.removeItem('token');
                                                localStorage.removeItem('userId');

                                                if (response.status === 'success') {
                                                    // 显示成功消息
                                                    message.success('账号注销成功，所有数据已清除');
                                                } else {
                                                    // 显示错误消息
                                                    message.error('账号注销失败，请稍后重试');
                                                }

                                                // 立即跳转到登录页面
                                                window.location.href = '/';

                                                // 确保跳转执行
                                                setTimeout(() => {
                                                    window.location.href = '/';
                                                }, 500);
                                            } catch (error: any) {
                                                message.error(error.response?.data?.message || '账号注销失败，请稍后重试');
                                                setLoading(false);
                                            }
                                        },
                                    });
                                }}
                                disabled={loading}
                                className="flex items-center justify-center w-full md:w-auto px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition shadow-lg shadow-red-200"
                            >
                                {loading ? (
                                    <div className="animate-spin mr-2 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                                ) : (
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                )}
                                {loading ? '处理中...' : '注销账号'}
                            </button>
                            <p className="text-sm text-gray-500 flex-1">
                                注意：注销账号将永久删除您的所有数据，包括个人信息、公司信息、职位发布记录等，此操作不可恢复。
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 修改密码模态框 */}
            <Modal
                title={
                    <div className="text-xl font-bold flex items-center gap-3 text-slate-800 dark:text-slate-100">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                            <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span>修改登录密码</span>
                    </div>
                }
                open={passwordModalVisible}
                onCancel={() => setPasswordModalVisible(false)}
                footer={null}
                centered
                maskClosable={false}
                className="rounded-xl overflow-hidden [&_.ant-modal-content]:dark:bg-slate-900 [&_.ant-modal-header]:dark:bg-slate-900 [&_.ant-modal-title]:dark:text-slate-100 [&_.ant-modal-close]:dark:text-slate-400 [&_.ant-modal-close:hover]:dark:text-slate-200"
                width={480}
            >
                <div className="mt-6 space-y-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-2xl flex items-start gap-4 border border-blue-100 dark:border-blue-800/50">
                        <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl shadow-sm mt-0.5">
                            <Shield className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h4 className="font-bold text-blue-900 dark:text-blue-100 text-sm">账号安全保护</h4>
                            <p className="text-xs text-blue-700/80 dark:text-blue-300/80 mt-1 leading-relaxed">
                                为了保障您的账号安全，修改密码需要验证您的注册邮箱：<br />
                                <span className="font-black text-blue-600 dark:text-blue-400">{profile.email}</span>
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* 旧密码 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">旧密码</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    <Lock className="w-4 h-4" />
                                </span>
                                <input
                                    type={passwordVisible.old ? "text" : "password"}
                                    value={passwordForm.oldPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                                    className="w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500"
                                    placeholder="请输入当前使用的密码"
                                />
                                <button
                                    type="button"
                                    onClick={() => setPasswordVisible({ ...passwordVisible, old: !passwordVisible.old })}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    {passwordVisible.old ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* 新密码 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">新密码</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    <Lock className="w-4 h-4" />
                                </span>
                                <input
                                    type={passwordVisible.new ? "text" : "password"}
                                    value={passwordForm.newPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                    className={`w-full pl-10 pr-10 py-2.5 border rounded-lg focus:ring-2 outline-none transition-all bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 ${passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword
                                        ? 'border-red-300 dark:border-red-800 focus:ring-red-200 focus:border-red-400'
                                        : 'border-gray-300 dark:border-slate-700 focus:ring-blue-500 focus:border-blue-500'
                                        }`}
                                    placeholder="请输入新密码（至少6位）"
                                />
                                <button
                                    type="button"
                                    onClick={() => setPasswordVisible({ ...passwordVisible, new: !passwordVisible.new })}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    {passwordVisible.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* 确认新密码 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">确认新密码</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    <Lock className="w-4 h-4" />
                                </span>
                                <input
                                    type={passwordVisible.confirm ? "text" : "password"}
                                    value={passwordForm.confirmPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                    className={`w-full pl-10 pr-10 py-2.5 border rounded-lg focus:ring-2 outline-none transition-all bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 ${passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword
                                        ? 'border-red-300 dark:border-red-800 focus:ring-red-200 focus:border-red-400'
                                        : 'border-gray-300 dark:border-slate-700 focus:ring-blue-500 focus:border-blue-500'
                                        }`}
                                    placeholder="请再次输入新密码"
                                />
                                <button
                                    type="button"
                                    onClick={() => setPasswordVisible({ ...passwordVisible, confirm: !passwordVisible.confirm })}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    {passwordVisible.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                                <p className="text-xs text-red-500 mt-1 ml-1">两次输入的密码不一致</p>
                            )}
                        </div>

                        {/* 验证码 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">邮箱验证码</label>
                            <div className="flex gap-3">
                                <div className="relative flex-1">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        <Mail className="w-4 h-4" />
                                    </span>
                                    <input
                                        type="text"
                                        value={passwordForm.verificationCode}
                                        onChange={(e) => setPasswordForm({ ...passwordForm, verificationCode: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500"
                                        placeholder="6位数字验证码"
                                        maxLength={6}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleSendCode}
                                    disabled={countdown > 0 || sendingCode}
                                    className={`px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all border ${countdown > 0 || sendingCode
                                        ? 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500 border-gray-200 dark:border-slate-700 cursor-not-allowed'
                                        : 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-300'
                                        }`}
                                >
                                    {sendingCode ? '发送中...' : countdown > 0 ? `${countdown}s 后重试` : '获取验证码'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-gray-100 dark:border-slate-700/50">
                        <button
                            onClick={() => setPasswordModalVisible(false)}
                            className="flex-1 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-300 font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                        >
                            取消
                        </button>
                        <button
                            onClick={handlePasswordChange}
                            disabled={loading || !passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.verificationCode}
                            className={`flex-1 py-2.5 rounded-lg text-white font-medium shadow-sm transition-all ${loading || !passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.verificationCode
                                ? 'bg-blue-400 dark:bg-blue-800 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 hover:shadow transform active:scale-95'
                                }`}
                        >
                            {loading ? '提交中...' : '确认修改'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* AI 公司简介生成弹窗 */}
            <Modal
                title={
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                            <Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-xl font-black text-slate-800 dark:text-slate-100">AI 智能辅助：公司简介</span>
                    </div>
                }
                open={aiModalVisible}
                onCancel={() => !isGenerating && setAiModalVisible(false)}
                footer={null}
                width={700}
                centered
                maskClosable={false}
                className="ai-generation-modal"
            >
                <div className="space-y-6 py-2">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 border border-blue-100 dark:border-blue-800/50 p-5 rounded-2xl flex items-start gap-4">
                        <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-blue-600">
                            <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-blue-900 dark:text-blue-100">已提取核心信息：</p>
                            <p className="text-xs text-blue-700/70 dark:text-blue-300/70 mt-1 font-medium">
                                {profile.company?.name} · {profile.company?.industry} · {profile.company?.company_type} · {profile.company?.size}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                <Settings className="w-4 h-4 text-slate-400" /> 叙述风格
                            </label>
                            <select
                                value={aiStyle}
                                onChange={(e) => setAiStyle(e.target.value)}
                                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all bg-white dark:bg-slate-800 dark:text-slate-200"
                                disabled={isGenerating}
                            >
                                <option value="专业">专业稳重 - 适合大型企业、国企/上市公司</option>
                                <option value="科技">科技前沿 - 适合互联网、高新技术公司</option>
                                <option value="活力">活力团队 - 适合创业公司、年轻化团队</option>
                                <option value="简洁">高效简洁 - 务实高效，强调核心信息</option>
                                <option value="创意">艺术创意 - 适合设计、传媒、文化类公司</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-slate-400" /> 特色关键词
                            </label>
                            <input
                                type="text"
                                value={aiKeywords}
                                onChange={(e) => setAiKeywords(e.target.value)}
                                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all bg-white dark:bg-slate-800 dark:text-slate-200"
                                placeholder="如：极具人性化、五险一金、弹性工时"
                                disabled={isGenerating}
                            />
                        </div>
                    </div>

                    <div className="space-y-2.5">
                        <div className="flex justify-between items-center px-1">
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">生成预览与内容编辑</label>
                            {generatedPreview && (
                                <span className="text-xs text-slate-400 font-medium">
                                    当前字数: {generatedPreview.length}
                                </span>
                            )}
                        </div>
                        <div className="relative group">
                            <textarea
                                value={generatedPreview}
                                onChange={(e) => setGeneratedPreview(e.target.value)}
                                className="w-full border border-slate-200 dark:border-slate-700 rounded-2xl p-5 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all resize-none min-h-[200px] leading-relaxed bg-white dark:bg-slate-800 dark:text-slate-200"
                                placeholder="点击“智能生成”开启您的专属公司简介之旅..."
                                disabled={isGenerating}
                            />
                            {isGenerating && (
                                <div className="absolute inset-0 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl animate-in fade-in duration-500">
                                    <div className="flex gap-2 mb-4">
                                        <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                        <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                        <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"></div>
                                    </div>
                                    <p className="text-sm font-black text-blue-700 dark:text-blue-300 animate-pulse">AI 正在为您精心撰写...</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                        <button
                            onClick={() => setAiModalVisible(false)}
                            className="flex-1 py-3.5 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95"
                            disabled={isGenerating}
                        >
                            暂时不用
                        </button>
                        <button
                            onClick={executeCompanyDescriptionGeneration}
                            disabled={isGenerating}
                            className={`flex-1 py-3.5 rounded-2xl font-black shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 ${isGenerating
                                ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed'
                                : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50 hover:bg-blue-600 hover:text-white'
                                }`}
                        >
                            <Sparkles className={`w-5 h-5 ${isGenerating ? '' : 'animate-pulse'}`} />
                            {generatedPreview ? '重新为您生成' : '立即智能生成'}
                        </button>
                        {generatedPreview && !isGenerating && (
                            <button
                                onClick={applyGeneratedDescription}
                                className="flex-[1.5] py-3.5 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-200 dark:shadow-blue-900/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 active:scale-95"
                            >
                                <Save className="w-5 h-5" />
                                采纳此版本
                            </button>
                        )}
                    </div>
                </div>
            </Modal>
        </div >
    );
}

export default RecruiterProfileScreen;