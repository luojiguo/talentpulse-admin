
import React, { useState, useEffect } from 'react';
import { Layout, message, Button, Upload, Avatar, Modal, Affix } from 'antd';
import { UserOutlined, UploadOutlined } from '@ant-design/icons';
import { Eye, EyeOff } from 'lucide-react';
import { resumeAPI, userAPI, configAPI, candidateAPI } from '../../../services/apiService';
import ProfileSidebar from '../components/Profile/ProfileSidebar';
import PersonalInfoSection from '../components/Profile/PersonalInfoSection';
import WorkExperienceSection from '../components/Profile/WorkExperienceSection';
import ProjectExperienceSection from '../components/Profile/ProjectExperienceSection';
import EducationSection from '../components/Profile/EducationSection';
import ExpectedJobSection from '../components/Profile/ExpectedJobSection';
import PersonalAdvantageSection from '../components/Profile/PersonalAdvantageSection';
import SkillsSection from '../components/Profile/SkillsSection';
import ResumeManageSection from '../components/Profile/ResumeManageSection';

import ResumePreviewModal from '../components/Profile/ResumePreviewModal';

const { Content } = Layout;

// 定义组件属性接口
interface ProfileScreenProps {
    currentUser?: { id: number | string };
    onUpdateUser?: (user: any) => void;
}

/**
 * 候选人个人资料页面组件
 * 
 * 此组件作为候选人的主要个人资料页面，包含以下功能：
 * 1. 展示和编辑个人信息、工作经历、项目经历、教育经历等。
 * 2. 侧边栏导航，支持滚动定位。
 * 3. 简历管理（上传、查看附件简历）。
 * 4. 简历预览和导出功能。
 * 5. 响应式布局，适配桌面、平板和移动设备。
 */
const ProfileScreen: React.FC<ProfileScreenProps> = (props) => {
    // ---- 状态定义 ----
    const [user, setUser] = useState<any>(null); // 存储用户详细信息
    const [loading, setLoading] = useState(true); // 页面加载状态
    const [activeSection, setActiveSection] = useState('personal-info'); // 当前高亮的侧边栏菜单项
    const [dictionaries, setDictionaries] = useState<any>({}); // 字典数据（如行业、职位等）
    const [showPreview, setShowPreview] = useState(false); // 控制简历预览模态框的显示




    // 计算资料完整度 (模拟或简单逻辑)
    // 这里的逻辑基于关键字段是否填写来计算百分比
    const completionPercentage = user ? Math.min(100, (
        (user.name ? 10 : 0) +
        (user.gender ? 5 : 0) +
        (user.phone ? 10 : 0) +
        (user.email ? 10 : 0) +
        (user.major ? 10 : 0) +
        (user.summary ? 20 : 0) +
        (user.education ? 15 : 0) +
        (user.work_experience_years ? 10 : 0) +
        (user.skills ? 10 : 0)
    )) : 0;

    // 获取当前用户ID，优先使用props传入的，否则从本地存储获取
    const userId = props.currentUser?.id || (JSON.parse(localStorage.getItem('user') || '{}').id);

    // ---- 事件处理函数 ----


    /**
     * 获取用户数据和候选人资料
     * 并行请求用户基本信息和候选人详细档案，合并后更新状态
     * @param updatedData 可选参数：如果提供，则直接用于更新本地状态，避免重新请求
     */
    const fetchUserData = async (updatedData?: any) => {
        // 🚀 优化：如果提供了更新数据，直接合并到当前状态，避免刷新
        if (updatedData) {
            setUser((prevUser: any) => {
                const newUser = { ...prevUser, ...updatedData, id: userId };
                if (props.onUpdateUser) {
                    setTimeout(() => props.onUpdateUser!(newUser), 0);
                }
                return newUser;
            });
            return;
        }

        // 否则从API重新获取完整数据
        if (!userId) return;
        try {
            setLoading(true);
            // 并行请求：获取用户信息 和 获取候选人档案
            const [userRes, candidateRes] = await Promise.all([
                userAPI.getUserById(userId),
                candidateAPI.getCandidateProfile(userId).catch(() => ({ data: null })) // 捕获错误，允许档案不存在的情况
            ]);

            if (userRes.data) {
                // 如果存在候选人档案，将其与用户基本信息合并
                const candidateData = candidateRes.data || {};
                const newUser = {
                    ...userRes.data,
                    ...candidateData,
                    // 确保ID字段始终被保留（使用userId优先）
                    id: userId,
                    // 优先使用候选人档案中的个人优势，否则使用用户描述
                    summary: candidateData.summary || userRes.data.description,
                    skills: candidateData.skills || userRes.data.skills
                };

                setUser(newUser);

                // 同步更新父组件状态，确保Header头像/名称即时更新
                if (props.onUpdateUser) {
                    props.onUpdateUser(newUser);
                }
            }
        } catch (error) {
            console.error(error);
            message.error('获取用户信息失败');
        } finally {
            setLoading(false);
        }
    };

    /**
     * 获取字典数据
     * 用于页面上的下拉选择等组件
     */
    const fetchDictionaries = async () => {
        try {
            const res = await configAPI.getDictionaries();
            if (res.status === 'success') {
                setDictionaries(res.data);
            }
        } catch (error) {
            console.error('获取字典数据失败', error);
        }
    };

    // 初始化加载数据
    useEffect(() => {
        fetchUserData();
        fetchDictionaries();
    }, [userId]);

    // ---- 滚动监听逻辑 (ScrollSpy) ----
    // 监听窗口滚动，根据滚动位置自动高亮侧边栏对应菜单
    useEffect(() => {
        const handleScroll = () => {
            const sections = ['personal-info', 'expected-job', 'work-experience', 'project-experience', 'education', 'skills', 'advantages'];

            for (const section of sections) {
                const element = document.getElementById(section);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    // 检测元素是否在视口上方区域，以决定高亮哪个部分
                    if (rect.top >= 0 && rect.top <= 300) {
                        setActiveSection(section);
                        break;
                    }
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        // 清理函数：移除事件监听器
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // ---- 渲染辅助函数 ----

    // ---- 修改密码逻辑 ----
    const [passwordModalVisible, setPasswordModalVisible] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
        verificationCode: ''
    });
    // Count down timer for verification code
    const [countdown, setCountdown] = useState(0);
    const [sendingCode, setSendingCode] = useState(false);

    // Password visibility state
    const [showOldPass, setShowOldPass] = useState(false);
    const [showNewPass, setShowNewPass] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (countdown > 0) {
            timer = setInterval(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [countdown]);

    const handleSendCode = async () => {
        try {
            setSendingCode(true);
            await userAPI.sendVerificationCode();
            message.success('验证码已发送，请注意查收');
            setCountdown(60); // Start 60s countdown
        } catch (error: any) {
            console.error('发送验证码失败:', error);
            message.error(error.response?.data?.message || '发送验证码失败，请稍后重试');
        } finally {
            setSendingCode(false);
        }
    };

    const handlePasswordChange = async () => {
        const { oldPassword, newPassword, confirmPassword } = passwordForm;

        if (!oldPassword || !newPassword || !confirmPassword) {
            message.error('请填写所有密码字段');
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

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            message.error('两次输入的密码不一致');
            return;
        }

        if (!passwordForm.verificationCode) {
            message.error('请输入验证码');
            return;
        }

        try {
            setPasswordLoading(true);
            const { oldPassword, newPassword, verificationCode } = passwordForm;
            await userAPI.updatePassword({
                oldPassword,
                newPassword,
                verificationCode
            });
            message.success('密码修改成功，请重新登录');
            message.success('密码修改成功，请重新登录');
            // 不要关闭模态框，直接跳转，避免触发组件更新导致的API请求错误
            // setPasswordModalVisible(false);

            // 登出并跳转
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('currentUser');
            // 使用 replace 替换当前历史记录，避免用户返回
            window.location.replace('/');
        } catch (error: any) {
            console.error('修改密码失败:', error);
            message.error(error.response?.data?.message || '修改密码失败，请检查旧密码是否正确');
        } finally {
            setPasswordLoading(false);
        }
    };

    /**
     * 渲染主要内容区域
     * 包含各个表单板块
     */
    const renderContent = () => {
        return (
            <div className="flex flex-col gap-6">
                {/* 个人信息板块 */}
                <div id="personal-info">
                    <PersonalInfoSection
                        user={user}
                        onUpdate={fetchUserData}
                        // 渲染额外的头部操作按钮：预览 和 修改密码
                        renderExtraHeader={() => (
                            <div className="flex items-center gap-2 ml-4">
                                <button
                                    onClick={() => setPasswordModalVisible(true)}
                                    className="px-4 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-white text-xs font-bold hover:border-brand-300 hover:text-brand-600 dark:hover:border-brand-400 dark:hover:text-white transition-all active:scale-95"
                                >
                                    修改密码
                                </button>
                                <button
                                    onClick={() => setShowPreview(true)}
                                    className="px-4 py-1.5 rounded-xl bg-brand-50 dark:bg-slate-800 border border-brand-100 dark:border-brand-500/50 text-brand-600 dark:text-white text-xs font-bold hover:bg-brand-100 dark:hover:bg-brand-900/30 transition-all active:scale-95"
                                >
                                    预览简历
                                </button>
                            </div>
                        )}
                    />
                </div>

                {/* 期望职位板块 */}
                <div id="expected-job">
                    <ExpectedJobSection userId={userId} dictionaries={dictionaries} />
                </div>
                {/* ... other sections ... */}
                {/* 工作经历板块 */}
                <div id="work-experience">
                    <WorkExperienceSection userId={userId} dictionaries={dictionaries} />
                </div>

                {/* 项目经历板块 */}
                <div id="project-experience">
                    <ProjectExperienceSection userId={userId} />
                </div>

                {/* 教育经历板块 */}
                <div id="education">
                    <EducationSection userId={userId} dictionaries={dictionaries} />
                </div>

                {/* 专业技能板块 */}
                <div id="skills">
                    <SkillsSection userId={userId} skills={user.skills} onUpdate={fetchUserData} />
                </div>

                {/* 个人优势板块 */}
                <div id="advantages">
                    <PersonalAdvantageSection
                        userId={userId}
                        summary={user.summary || user.description}
                        onUpdate={fetchUserData}
                    />
                </div>
            </div>
        );
    };

    /**
     * 处理侧边栏导航点击
     * 点击时平滑滚动到对应锚点位置
     * @param key section id
     */
    const handleSectionChange = (key: string) => {
        setActiveSection(key);
        const element = document.getElementById(key);
        if (element) {
            const yOffset = -80; // 偏移量，为顶部导航或粘性头部预留空间
            const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    };

    if (loading || !user) {
        return (
            <div className="flex h-screen items-center justify-center bg-white dark:bg-slate-950">
                <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-brand-100 dark:border-slate-800 border-t-brand-500 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-2 h-2 bg-brand-500 rounded-full animate-pulse"></div>
                        </div>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-bold tracking-wider animate-pulse text-sm">正在加载个人资料...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 dark:bg-slate-950 min-h-screen p-4 md:p-6 transition-colors duration-500">
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 items-start relative">
                {/* 左侧边栏 - 在移动端/平板 (< lg) 隐藏, 在桌面端 (lg+) 显示 */}
                <div className="hidden lg:block w-[220px] flex-shrink-0">
                    <Affix offsetTop={84}>
                        <div className="max-h-[calc(100vh-100px)] overflow-y-auto pr-2 custom-scrollbar">
                            <ProfileSidebar activeSection={activeSection} onSectionChange={handleSectionChange} />
                        </div>
                    </Affix>
                </div>

                {/* 右侧内容区域 */}
                <div className="flex-1 min-w-0 w-full">
                    {/* 主要内容 + 右侧边栏包装器 */}
                    <div className="flex flex-col xl:flex-row gap-6 items-start">
                        {/* 核心资料内容区 */}
                        <div className="flex-1 min-w-0 w-full">
                            {renderContent()}
                        </div>

                        {/* 右侧边栏 - 附件简历管理 */}
                        <div className="w-full xl:w-[320px] flex-shrink-0">
                            <div className="hidden xl:block">
                                <Affix offsetTop={84}>
                                    <ResumeManageSection userId={userId} />
                                </Affix>
                            </div>
                            <div className="block xl:hidden">
                                <ResumeManageSection userId={userId} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 简历预览模态框 */}
            <ResumePreviewModal
                visible={showPreview}
                onClose={() => setShowPreview(false)}
                userId={userId}
            />

            {/* 修改密码模态框 */}
            <Modal
                title={<span className="text-slate-900 dark:text-white font-bold">修改密码</span>}
                open={passwordModalVisible}
                onOk={handlePasswordChange}
                onCancel={() => setPasswordModalVisible(false)}
                confirmLoading={passwordLoading}
                okText="确认修改"
                cancelText="取消"
                className="dark:bg-slate-900"
                styles={{
                    body: {
                        borderRadius: '24px',
                        padding: '24px',
                        backgroundColor: 'var(--modal-bg, #ffffff)'
                    },
                    header: {
                        marginBottom: '20px',
                        borderBottom: 'none',
                        backgroundColor: 'transparent'
                    }
                }}
            >
                <div className="flex flex-col gap-5 py-2">
                    <div>
                        <div className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-400">旧密码</div>
                        <div className="relative">
                            <input
                                type={showOldPass ? "text" : "password"}
                                value={passwordForm.oldPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-brand-500/20 text-slate-900 dark:text-white placeholder-slate-400 transition-all"
                                placeholder="请输入旧密码"
                            />
                            <button
                                type="button"
                                onClick={() => setShowOldPass(!showOldPass)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-500 transition-colors"
                            >
                                {showOldPass ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <div className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-400">验证码</div>
                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={passwordForm.verificationCode}
                                onChange={(e) => setPasswordForm({ ...passwordForm, verificationCode: e.target.value })}
                                className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-brand-500/20 text-slate-900 dark:text-white placeholder-slate-400 transition-all"
                                placeholder="请输入6位验证码"
                            />
                            <button
                                onClick={handleSendCode}
                                disabled={countdown > 0 || sendingCode}
                                className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 whitespace-nowrap
                                    ${countdown > 0 || sendingCode
                                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                        : 'bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-900/50'
                                    }`}
                            >
                                {sendingCode ? '发送中...' : countdown > 0 ? `${countdown}s` : '获取验证码'}
                            </button>
                        </div>
                    </div>

                    <div>
                        <div className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-400">新密码</div>
                        <div className="relative">
                            <input
                                type={showNewPass ? "text" : "password"}
                                value={passwordForm.newPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-brand-500/20 text-slate-900 dark:text-white placeholder-slate-400 transition-all"
                                placeholder="请输入新密码（至少6位）"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPass(!showNewPass)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-500 transition-colors"
                            >
                                {showNewPass ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <div className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-400">确认新密码</div>
                        <div className="relative">
                            <input
                                type={showConfirmPass ? "text" : "password"}
                                value={passwordForm.confirmPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-brand-500/20 text-slate-900 dark:text-white placeholder-slate-400 transition-all"
                                placeholder="请再次输入新密码"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPass(!showConfirmPass)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-500 transition-colors"
                            >
                                {showConfirmPass ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ProfileScreen;
