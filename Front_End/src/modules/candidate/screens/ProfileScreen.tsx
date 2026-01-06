
import React, { useState, useEffect } from 'react';
import { Layout, message, Button, Upload, Avatar, Modal, Affix } from 'antd';
import { UserOutlined, UploadOutlined } from '@ant-design/icons';
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

    /**
     * 渲染主要内容区域
     * 包含各个表单板块
     */
    const renderContent = () => {
        return (
            <div className="flex flex-col gap-2">
                {/* 个人信息板块 */}
                <div id="personal-info">
                    <PersonalInfoSection
                        user={user}
                        onUpdate={fetchUserData}
                        // 渲染额外的头部操作按钮：预览
                        renderExtraHeader={() => (
                            <div className="flex gap-4 text-blue-600 text-sm cursor-pointer ml-4">
                                <span onClick={() => setShowPreview(true)} className="hover:text-blue-800 transition-colors">预览</span>
                            </div>
                        )}
                    />
                </div>

                {/* 期望职位板块 */}
                {/* 期望职位板块 */}
                <div id="expected-job">
                    <ExpectedJobSection userId={userId} dictionaries={dictionaries} />
                </div>

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
        return <div className="p-8 text-center text-gray-500">加载中...</div>;
    }

    return (
        <div className="bg-gray-50 min-h-screen p-4 md:p-6">
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-4 items-start relative">
                {/* 左侧边栏 - 在移动端/平板 (< lg) 隐藏, 在桌面端 (lg+) 显示 */}
                <div className="hidden lg:block w-[200px] flex-shrink-0" style={{ height: 'calc(100vh - 48px)' }}>
                    <Affix offsetTop={24}>
                        <div style={{ maxHeight: 'calc(100vh - 48px)', overflowY: 'auto' }}>
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
                        {/* 布局：小于 xl 尺寸时堆叠在下方, xl 尺寸以上固定宽度在右侧 */}
                        <div className="w-full xl:w-[300px] flex-shrink-0">
                            {/* 桌面端大屏幕视图 - 使用 Affix 固钉效果 */}
                            <div className="hidden xl:block">
                                <Affix offsetTop={24}>
                                    <ResumeManageSection userId={userId} />
                                </Affix>
                            </div>
                            {/* 移动/平板端视图 (< xl) - 无固钉，普通块级元素堆叠显示 */}
                            <div className="block xl:hidden">
                                <ResumeManageSection userId={userId} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 简历预览模态框 (普通查看模式) */}
            <ResumePreviewModal
                visible={showPreview}
                onClose={() => setShowPreview(false)}
                userId={userId}
            />


        </div>
    );
};

export default ProfileScreen;
