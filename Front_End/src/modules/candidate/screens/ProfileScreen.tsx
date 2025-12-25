import React, { useState, useEffect, useRef } from 'react';
import { Modal } from 'antd';
import { userAPI, candidateAPI, resumeAPI } from '../../../services/apiService';
import { processAvatarUrl } from '@/components/AvatarUploadComponent';

// 修复文件名编码问题的函数
const fixFilenameEncoding = (filename: string): string => {
    try {
        // 将字符串视为 ISO-8859-1 编码的字节，重新用 UTF-8 解码
        const buf = Buffer.from(filename, 'latin1');
        return buf.toString('utf8');
    } catch (err) {
        console.warn('Filename encoding fix failed, using original:', filename);
        return filename;
    }
};

// 用户数据接口定义
interface UserData {
    id: number;
    name: string;
    email: string;
    phone: string;
    gender: string;
    birth_date: string | Date;
    education: string;
    major: string;
    school: string;
    graduation_year: string;
    work_experience_years: string;
    desired_position: string;
    skills: string;
    languages: string;
    avatar: string;
    wechat?: string;
}

// 求职者数据接口定义
interface CandidateData {
    summary?: string;
    expected_salary_min?: number;
    expected_salary_max?: number;
    availability_status?: string;
    preferred_locations?: string;
}

interface ProfileScreenProps {
    currentUser?: { id: number | string };
    onUpdateUser?: (user: any) => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ currentUser, onUpdateUser }) => {
    const [user, setUser] = useState<UserData | null>(null);
    const [candidateProfile, setCandidateProfile] = useState<CandidateData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 简历相关状态
    const [resumes, setResumes] = useState<any[]>([]);
    const [resumeLoading, setResumeLoading] = useState(false);
    const resumeFileInputRef = useRef<HTMLInputElement>(null);

    // 表单状态
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        gender: '',
        birth_date: '',
        education: '',
        major: '',
        school: '',
        graduation_year: '',
        work_experience_years: '',
        desired_position: '',
        languages: '',
        wechat: '',
        // 求职者特定字段
        summary: '',
        expected_salary_min: '',
        expected_salary_max: '',
        availability_status: 'available', // available, employed, open_to_offers
        preferred_locations: '',
    });

    const [genderOptions, setGenderOptions] = useState<string[]>([]);

    useEffect(() => {
        if (currentUser?.id || localStorage.getItem('userId')) {
            fetchData();
            fetchGenderOptions();
            fetchResumes();
        }
    }, [currentUser]);

    const fetchGenderOptions = async () => {
        try {
            const res = await userAPI.getGenderOptions();
            if (res.data && Array.isArray(res.data)) {
                setGenderOptions(res.data);
            }
        } catch (e) {
            console.error('获取性别选项失败', e);
            // Fallback
            setGenderOptions(['男', '女', '其他']);
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            // 优先使用传入的 currentUser.id，如果不存在则回退到 localStorage
            const userId = currentUser?.id || localStorage.getItem('userId');
            if (!userId) {
                throw new Error('未找到用户ID');
            }

            // 获取用户基本信息
            const userRes = await userAPI.getUserById(userId);
            const userData: UserData = userRes.data;
            setUser(userData);

            // 获取求职者档案信息 (如果存在)
            let candidateData: CandidateData = {};
            try {
                const candidateRes = await candidateAPI.getCandidateProfile(userId);
                if (candidateRes.data) {
                    candidateData = candidateRes.data;
                    setCandidateProfile(candidateData);
                }
            } catch (e) {
                // 移除调试日志，减少性能开销和控制台输出
            }

            // 日期格式化辅助函数
            const formatDate = (date: string | Date | null | undefined) => {
                if (!date) return '';
                if (date instanceof Date) return date.toISOString().split('T')[0];
                if (typeof date === 'string') return date.split('T')[0];
                return '';
            };

            // 初始化表单数据
            setFormData({
                name: userData.name || '',
                email: userData.email || '',
                phone: userData.phone || '',
                gender: userData.gender || '',
                birth_date: formatDate(userData.birth_date),
                education: userData.education || '',
                major: userData.major || '',
                school: userData.school || '',
                graduation_year: userData.graduation_year || '',
                work_experience_years: userData.work_experience_years || '',
                desired_position: userData.desired_position || '',
                languages: userData.languages || '',
                wechat: userData.wechat || '',

                // 求职者字段
                summary: candidateData.summary || '',
                expected_salary_min: candidateData.expected_salary_min ? String(candidateData.expected_salary_min) : '',
                expected_salary_max: candidateData.expected_salary_max ? String(candidateData.expected_salary_max) : '',
                availability_status: candidateData.availability_status || 'available',
                preferred_locations: candidateData.preferred_locations || '',
            });

        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || '加载个人资料失败' });
        } finally {
            setLoading(false);
        }
    };

    // 获取简历列表
    const fetchResumes = async () => {
        try {
            setResumeLoading(true);
            const userId = currentUser?.id || localStorage.getItem('userId');
            if (!userId) {
                throw new Error('未找到用户ID');
            }

            const res = await resumeAPI.getUserResumes(userId);
            if ((res as any).status === 'success') {
                setResumes(res.data || []);
            }
        } catch (error: any) {
            console.error('获取简历列表失败:', error);
        } finally {
            setResumeLoading(false);
        }
    };

    // 上传简历
    const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setSaving(true);
            const userId = currentUser?.id || localStorage.getItem('userId');
            if (!userId) {
                throw new Error('未找到用户ID');
            }

            const res = await resumeAPI.uploadResume(userId, file);
            if ((res as any).status === 'success') {
                setMessage({ type: 'success', text: '简历上传成功' });
                await fetchResumes(); // 刷新简历列表
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || '简历上传失败' });
        } finally {
            setSaving(false);
        }
    };

    // 删除简历
    const handleResumeDelete = async (id: number) => {
        try {
            setSaving(true);
            const res = await resumeAPI.deleteResume(id);
            if ((res as any).status === 'success') {
                setMessage({ type: 'success', text: '简历删除成功' });
                await fetchResumes(); // 刷新简历列表
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || '简历删除失败' });
        } finally {
            setSaving(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setSaving(true);
            const userId = user?.id;
            if (!userId) return;

            const res = await userAPI.uploadAvatar(String(userId), file);

            setUser(prev => prev ? ({ ...prev, avatar: processAvatarUrl(res.data.avatar) }) : null);
            // 更新全局用户状态，确保导航栏头像同步更新
            onUpdateUser?.({ ...currentUser, avatar: processAvatarUrl(res.data.avatar) });
            setMessage({ type: 'success', text: '头像更新成功' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || '头像上传失败' });
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            const userId = user?.id;
            if (!userId) return;

            // 辅助函数：清洗数据，将空字符串转换为 null
            const sanitize = (value: any) => {
                if (value === '') return null;
                return value;
            };

            // 1. 更新用户基本信息
            const userDataToUpdate = {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                gender: sanitize(formData.gender),
                birth_date: sanitize(formData.birth_date),
                education: formData.education,
                major: formData.major,
                school: formData.school,
                graduation_year: sanitize(formData.graduation_year),
                work_experience_years: sanitize(formData.work_experience_years),
                desired_position: formData.desired_position,
                languages: formData.languages,
                wechat: formData.wechat,
            };
            await userAPI.updateUser(String(userId), userDataToUpdate);

            // 2. 更新/创建求职者档案信息
            const candidateDataToUpdate = {
                user_id: userId,
                summary: formData.summary,
                expected_salary_min: sanitize(formData.expected_salary_min),
                expected_salary_max: sanitize(formData.expected_salary_max),
                availability_status: formData.availability_status,
                preferred_locations: formData.preferred_locations,
            };
            await candidateAPI.updateCandidateProfile(userId, candidateDataToUpdate);

            setMessage({ type: 'success', text: '个人资料保存成功' });

            // 刷新数据以确保同步
            await fetchData();
            await fetchResumes();

        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || '保存失败' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center">正在加载个人资料...</div>;

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">个人中心</h1>

            {message && (
                <div className={`p-4 mb-6 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* 头部 / 头像区域 */}
                <div className="p-8 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center gap-6">
                    <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md bg-gray-200">
                            {user?.avatar && user.avatar.trim() !== '' ? (
                                <img src={processAvatarUrl(user.avatar)} alt="头像" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-3xl font-bold">
                                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                            )}
                        </div>
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-full transition-all flex items-center justify-center">
                            <span className="text-white opacity-0 group-hover:opacity-100 text-xs font-medium">更换</span>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{user?.name || '用户名'}</h2>
                        <p className="text-gray-500">{user?.email}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8">
                    {/* 第一部分：基本信息 (Users 表) */}
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">基本信息</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    placeholder="请输入您的姓名"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    disabled
                                    className="w-full px-4 py-2 border border-gray-200 bg-gray-50 text-gray-500 rounded-lg cursor-not-allowed"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">手机号码</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    placeholder="请输入手机号码"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">性别</label>
                                <select
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                >
                                    <option value="">请选择性别</option>
                                    {genderOptions.map(option => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">出生日期</label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        name="birth_date"
                                        value={formData.birth_date}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all opacity-0 absolute inset-0 z-10 cursor-pointer"
                                    />
                                    <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900">
                                        {formData.birth_date ? (
                                            (() => {
                                                const date = new Date(formData.birth_date);
                                                return isNaN(date.getTime()) ? '' : `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, '0')}月${String(date.getDate()).padStart(2, '0')}日`;
                                            })()
                                        ) : (
                                            <span className="text-gray-400">请选择出生日期</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">微信号</label>
                                <input
                                    type="text"
                                    name="wechat"
                                    value={formData.wechat}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    placeholder="请输入您的微信号"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 第二部分：教育与技能 (Users 表) */}
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">教育背景与技能</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">毕业院校</label>
                                <input
                                    type="text"
                                    name="school"
                                    value={formData.school}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    placeholder="请输入毕业院校"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">专业</label>
                                <input
                                    type="text"
                                    name="major"
                                    value={formData.major}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    placeholder="请输入专业名称"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">学历</label>
                                <select
                                    name="education"
                                    value={formData.education}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                >
                                    <option value="">请选择学历</option>
                                    <option value="High School">高中/中专</option>
                                    <option value="Associate">大专</option>
                                    <option value="Bachelor">本科</option>
                                    <option value="Master">硕士</option>
                                    <option value="PhD">博士</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">毕业年份</label>
                                <input
                                    type="number"
                                    name="graduation_year"
                                    value={formData.graduation_year}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    placeholder="例如：2023"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 第三部分：职业档案 (Candidates 表) */}
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">职业档案</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">个人优势 / 简介</label>
                                <textarea
                                    name="summary"
                                    value={formData.summary}
                                    onChange={handleInputChange}
                                    rows={4}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                                    placeholder="请简要描述您的职业背景、核心优势和职业目标..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">期望职位</label>
                                <input
                                    type="text"
                                    name="desired_position"
                                    value={formData.desired_position}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    placeholder="例如：前端工程师"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">工作年限 (年)</label>
                                <input
                                    type="number"
                                    name="work_experience_years"
                                    value={formData.work_experience_years}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    placeholder="例如：3"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">期望薪资 (最低/月)</label>
                                <input
                                    type="number"
                                    name="expected_salary_min"
                                    value={formData.expected_salary_min}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    placeholder="例如：15000"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">期望薪资 (最高/月)</label>
                                <input
                                    type="number"
                                    name="expected_salary_max"
                                    value={formData.expected_salary_max}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    placeholder="例如：25000"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">求职状态</label>
                                <select
                                    name="availability_status"
                                    value={formData.availability_status}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                >
                                    <option value="available">随时到岗</option>
                                    <option value="open_to_offers">在职-看机会</option>
                                    <option value="employed">在职-暂不考虑</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">期望城市</label>
                                <input
                                    type="text"
                                    name="preferred_locations"
                                    value={formData.preferred_locations}
                                    onChange={handleInputChange}
                                    placeholder="例如：上海, 北京, 远程"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 第四部分：简历管理 */}
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">简历管理</h3>

                        {/* 上传按钮 */}
                        <div className="mb-6">
                            <div className="flex items-center gap-4">
                                <button
                                    type="button"
                                    onClick={() => resumeFileInputRef.current?.click()}
                                    disabled={saving}
                                    className={`px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium shadow-md hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all ${saving ? 'opacity-70 cursor-wait' : ''}`}
                                >
                                    {saving ? '正在上传...' : '上传简历'}
                                </button>
                                <input
                                    type="file"
                                    ref={resumeFileInputRef}
                                    className="hidden"
                                    accept=".pdf,.doc,.docx,.txt"
                                    onChange={handleResumeUpload}
                                />
                                <span className="text-sm text-gray-500">支持 PDF、Word 等格式，单个文件大小不超过 10MB</span>
                            </div>
                        </div>

                        {/* 简历列表 */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            {resumeLoading ? (
                                <div className="text-center py-4 text-gray-500">正在加载简历列表...</div>
                            ) : resumes.length === 0 ? (
                                <div className="text-center py-4 text-gray-500">暂无上传的简历</div>
                            ) : (
                                <div className="space-y-3">
                                    {resumes.map((resume) => (
                                        <div key={resume.id} className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div className="text-blue-600">
                                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1-3a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">{fixFilenameEncoding(resume.resume_file_name)}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-xs text-gray-500">
                                                            {resume.created_at ? new Date(resume.created_at).toLocaleString() : ''}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            {(resume.resume_file_size / (1024 * 1024)).toFixed(2)}MB
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {/* 查看按钮 - 可下载简历 */}
                                                <a
                                                    href={resume.resume_file_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition"
                                                >
                                                    查看
                                                </a>
                                                {/* 删除按钮 */}
                                                <button
                                                    onClick={() => handleResumeDelete(Number(resume.id))}
                                                    disabled={saving}
                                                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition"
                                                >
                                                    删除
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end pt-6 border-t border-gray-100">
                        <button
                            type="submit"
                            disabled={saving}
                            className={`px-8 py-3 bg-blue-600 text-white rounded-lg font-medium shadow-md hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all ${saving ? 'opacity-70 cursor-wait' : ''}`}
                        >
                            {saving ? '正在保存...' : '保存修改'}
                        </button>
                    </div>
                </form>
                
                {/* 注销账号功能 */}
                <div className="p-8 border-t border-gray-100 bg-gray-50">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">账号管理</h3>
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
                                                <li>简历和投递记录</li>
                                                <li>收藏和浏览历史</li>
                                                <li>所有相关的职位和公司信息</li>
                                            </ul>
                                        </div>
                                    ),
                                    okText: '确定注销',
                                    okType: 'danger',
                                    cancelText: '取消',
                                    onOk: async () => {
                                        try {
                                            setLoading(true);
                                            const userId = user?.id;
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
                            className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium shadow-md hover:bg-red-700 focus:ring-4 focus:ring-red-200 transition-all"
                        >
                            {loading ? '处理中...' : '注销账号'}
                        </button>
                        <p className="text-sm text-gray-500 flex-1">
                            注意：注销账号将永久删除您的所有数据，包括个人信息、简历、投递记录等，此操作不可恢复。
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileScreen;
