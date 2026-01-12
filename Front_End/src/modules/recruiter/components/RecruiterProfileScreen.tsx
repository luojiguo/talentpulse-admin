import React, { useState, useRef, useEffect } from 'react';
import { User, Camera, Building2, Shield, Settings, Save, Sparkles, ChevronDown, ChevronUp, Lock, Eye, EyeOff, Mail } from 'lucide-react';
import { UserRole } from '@/types/types';
import { userAPI } from '@/services/apiService';
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
    const handleGenerateCompanyDescription = async () => {
        // Check if required fields are filled
        if (!profile.company?.name || !profile.company?.industry || !profile.company?.company_type || !profile.company?.size) {
            setAlertMessage('请先填写公司名称、所属行业、公司类型和公司规模，才能生成公司简介！');
            setTimeout(() => setAlertMessage(''), 3000);
            return;
        }

        try {
            setLoading(true);
            // Generate company description using AI
            const description = await generateCompanyDescription(
                profile.company.name,
                profile.company.industry,
                profile.company.company_type,
                profile.company.size
            );
            // Update profile with generated description
            setProfile({ ...profile, company: { ...profile.company, description } });
            setAlertMessage('公司简介已成功生成！');
            setTimeout(() => setAlertMessage(''), 3000);
        } catch (error) {
            console.error('生成公司简介错误:', error);
            setAlertMessage('生成公司简介失败，请稍后重试！');
            setTimeout(() => setAlertMessage(''), 3000);
        } finally {
            setLoading(false);
        }
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
                // 创建FormData上传公司Logo
                const formData = new FormData();
                formData.append('company_logo', file);

                // 调用后端API上传公司Logo到companies_logo目录
                const response = await fetch(`/api/companies/${profile.company?.id}/logo`, {
                    method: 'POST',
                    body: formData,
                    credentials: 'include',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                const responseData = await response.json();

                if (responseData.status === 'success') {
                    // 使用后端返回的Logo路径
                    const logoUrl = responseData.data.logo_url;
                    setProfile({ ...profile, company: { ...profile.company, logo: logoUrl } });

                    // 显示保存成功消息
                    setAlertMessage('公司Logo已成功上传！');
                    setTimeout(() => setAlertMessage(''), 3000);
                } else {
                    setAlertMessage('公司Logo上传失败：' + responseData.message);
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
            <h2 className="text-3xl font-bold text-gray-900">个人中心</h2>

            {alertMessage && <MessageAlert text={alertMessage} />}

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center">
                        <User className="w-5 h-5 mr-2 text-emerald-600" /> 个人信息
                    </h3>
                    <button
                        onClick={() => setPasswordModalVisible(true)}
                        className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center transition-colors"
                    >
                        <Lock className="w-4 h-4 mr-1" /> 修改密码
                    </button>
                </div>
                <div className="p-8 flex flex-col md:flex-row items-start gap-8">
                    <div className="relative mb-4">
                        <UserAvatar
                            src={profile.avatar}
                            name={profile.name}
                            size={96}
                            className="w-24 h-24 rounded-full border-4 border-white shadow-sm bg-emerald-100 text-emerald-600"
                        />
                        <button
                            onClick={() => avatarInputRef.current?.click()}
                            className="absolute bottom-0 right-0 bg-emerald-600 text-white p-2 rounded-full shadow-md hover:bg-emerald-700 transition-colors border-2 border-white z-10"
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

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div
                    className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => setIsCompanyInfoExpanded(!isCompanyInfoExpanded)}
                >
                    <h3 className="text-lg font-bold text-gray-800 flex items-center">
                        <Building2 className="w-5 h-5 mr-2 text-emerald-600" /> 公司信息与认证
                    </h3>
                    {isCompanyInfoExpanded ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
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
                        <div className={`mb-6 p-4 rounded-lg ${profile.company?.is_verified
                            ? 'bg-green-50 border border-green-200'
                            : (profile.company?.status === 'active' && !profile.company?.is_verified)
                                ? 'bg-blue-50 border border-blue-200' // Pending state
                                : 'bg-yellow-50 border border-yellow-200' // Unverified/Rejected state
                            }`}>
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    {profile.company?.is_verified ? (
                                        <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
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
                                    <h3 className="text-sm font-medium text-gray-800">企业认证状态</h3>
                                    <div className="mt-2 text-sm">
                                        <div>
                                            {profile.company?.is_verified ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-green-600 font-medium">✅ 您的企业已通过认证</span>
                                                    <span className="text-xs text-green-500">认证日期：{profile.company?.verification_date ? new Date(profile.company.verification_date).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }) : '未知'}</span>
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
                                    className="absolute bottom-0 right-0 bg-emerald-600 text-white p-1.5 rounded-full shadow-md hover:bg-emerald-700 transition-colors border-2 border-white"
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
                                options={[
                                    { value: '互联网', label: '互联网' },
                                    { value: '金融', label: '金融' },
                                    { value: '电商', label: '电商' },
                                    { value: '教育', label: '教育' },
                                    { value: '医疗', label: '医疗' },
                                    { value: '制造业', label: '制造业' },
                                    { value: '房地产', label: '房地产' },
                                    { value: '物流', label: '物流' },
                                    { value: '科技', label: '科技' },
                                    { value: '新能源', label: '新能源' },
                                    { value: '人工智能', label: '人工智能' },
                                    { value: '其他', label: '其他' }
                                ]}
                                disabled={loading}
                            />

                            {/* 公司规模 - 下拉选择 */}
                            <InputField
                                label="公司规模"
                                value={profile.company?.size}
                                onChange={(e: any) => setProfile({ ...profile, company: { ...profile.company, size: e.target.value } })}
                                placeholder="请选择公司规模"
                                options={[
                                    { value: '10-50人', label: '10-50人' },
                                    { value: '50-200人', label: '50-200人' },
                                    { value: '200-500人', label: '200-500人' },
                                    { value: '500-1000人', label: '500-1000人' },
                                    { value: '1000人以上', label: '1000人以上' }
                                ]}
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
                                    className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 font-medium rounded-md hover:bg-purple-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={loading}
                                >
                                    <Sparkles className="w-4 h-4" />
                                    {loading ? '生成中...' : 'AI生成'}
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
                        <div className="mt-8 pt-6 border-t border-gray-200">
                            <h4 className="text-md font-bold text-gray-800 flex items-center mb-4">
                                <Shield className="w-4 h-4 mr-2 text-green-600" /> {profile.company?.is_verified ? '企业认证信息' : '企业认证申请'}
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
                                        className={`px-6 py-2 rounded-lg font-medium transition-colors border shadow-sm flex items-center gap-2
                                            ${(loading || profile.company?.is_verified || (profile.company?.status === 'active' && !profile.company?.is_verified))
                                                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                                : 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                                            }`}
                                    >
                                        <Shield className="w-4 h-4" />
                                        {(profile.company?.status === 'active' && !profile.company?.is_verified) ? '审核中' : '提交认证申请'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center">
                        <Settings className="w-5 h-5 mr-2 text-emerald-600" /> 账号操作
                    </h3>
                </div>
                <div className="p-8 flex flex-col md:flex-col gap-4">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <button
                            onClick={handleSave}
                            className="flex items-center justify-center w-full md:w-auto px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition shadow-lg shadow-emerald-200"
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="animate-spin mr-2 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                            ) : (
                                <Save className="w-5 h-5 mr-2" />
                            )}
                            {loading ? '保存中...' : '保存更新'}
                        </button>

                        {/* 修改密码按钮 */}
                        <button
                            onClick={() => setPasswordModalVisible(true)}
                            className="flex items-center justify-center w-full md:w-auto px-6 py-3 bg-blue-50 text-blue-700 font-bold rounded-xl hover:bg-blue-100 transition border border-blue-200"
                            disabled={loading}
                        >
                            <Lock className="w-5 h-5 mr-2" /> 修改密码
                        </button>

                        <button
                            onClick={() => onSwitchRole('candidate')}
                            className="flex items-center justify-center w-full md:w-auto px-6 py-3 bg-indigo-50 text-indigo-700 font-bold rounded-xl hover:bg-indigo-100 transition border border-indigo-200"
                            disabled={loading}
                        >
                            <User className="w-5 h-5 mr-2" /> 切换为求职者 (Candidate) 身份
                        </button>
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
                    <div className="text-xl font-bold flex items-center gap-2 text-gray-800">
                        <Shield className="w-6 h-6 text-emerald-600" />
                        <span>修改密码</span>
                    </div>
                }
                open={passwordModalVisible}
                onCancel={() => setPasswordModalVisible(false)}
                footer={null}
                centered
                maskClosable={false}
                className="rounded-xl overflow-hidden"
                width={480}
            >
                <div className="mt-6 space-y-6">
                    <div className="bg-emerald-50 p-4 rounded-lg flex items-start gap-3">
                        <div className="bg-emerald-100 p-2 rounded-full mt-0.5">
                            <Shield className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                            <h4 className="font-medium text-emerald-800 text-sm">账号安全保护</h4>
                            <p className="text-xs text-emerald-600 mt-1">
                                为了保障您的账号安全，修改密码需要验证您的注册邮箱：<br />
                                <span className="font-bold">{profile.email}</span>
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
                                    className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                    placeholder="请输入当前使用的密码"
                                />
                                <button
                                    type="button"
                                    onClick={() => setPasswordVisible({ ...passwordVisible, old: !passwordVisible.old })}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                                    className={`w-full pl-10 pr-10 py-2.5 border rounded-lg focus:ring-2 outline-none transition-all ${passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword
                                        ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
                                        : 'border-gray-300 focus:ring-emerald-500 focus:border-emerald-500'
                                        }`}
                                    placeholder="请输入新密码（至少6位）"
                                />
                                <button
                                    type="button"
                                    onClick={() => setPasswordVisible({ ...passwordVisible, new: !passwordVisible.new })}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                                    className={`w-full pl-10 pr-10 py-2.5 border rounded-lg focus:ring-2 outline-none transition-all ${passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword
                                        ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
                                        : 'border-gray-300 focus:ring-emerald-500 focus:border-emerald-500'
                                        }`}
                                    placeholder="请再次输入新密码"
                                />
                                <button
                                    type="button"
                                    onClick={() => setPasswordVisible({ ...passwordVisible, confirm: !passwordVisible.confirm })}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                        placeholder="6位数字验证码"
                                        maxLength={6}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleSendCode}
                                    disabled={countdown > 0 || sendingCode}
                                    className={`px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all border ${countdown > 0 || sendingCode
                                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                        : 'bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300'
                                        }`}
                                >
                                    {sendingCode ? '发送中...' : countdown > 0 ? `${countdown}s 后重试` : '获取验证码'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-gray-100">
                        <button
                            onClick={() => setPasswordModalVisible(false)}
                            className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                        >
                            取消
                        </button>
                        <button
                            onClick={handlePasswordChange}
                            disabled={loading || !passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.verificationCode}
                            className={`flex-1 py-2.5 rounded-lg text-white font-medium shadow-sm transition-all ${loading || !passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.verificationCode
                                ? 'bg-emerald-400 cursor-not-allowed'
                                : 'bg-emerald-600 hover:bg-emerald-700 hover:shadow transform active:scale-95'
                                }`}
                        >
                            {loading ? '提交中...' : '确认修改'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div >
    );
}

export default RecruiterProfileScreen;