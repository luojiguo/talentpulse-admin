import React from 'react';
import { Menu } from 'antd';
import {
    UserOutlined,
    SolutionOutlined,
    ProjectOutlined,
    BankOutlined,
    TrophyOutlined,
    RocketOutlined
} from '@ant-design/icons';

interface ProfileSidebarProps {
    activeSection: string;
    onSectionChange: (section: string) => void;
}

const ProfileSidebar: React.FC<ProfileSidebarProps> = ({ activeSection, onSectionChange }) => {
    const menuItems = [
        {
            key: 'personal-info',
            icon: <UserOutlined />,
            label: '个人信息',
        },
        {
            key: 'expected-job',
            icon: <RocketOutlined />,
            label: '期望职位',
        },
        {
            key: 'work-experience',
            icon: <BankOutlined />,
            label: '工作经历',
        },
        {
            key: 'project-experience',
            icon: <ProjectOutlined />,
            label: '项目经历',
        },
        {
            key: 'education',
            icon: <SolutionOutlined />,
            label: '教育经历',
        },
        {
            key: 'skills',
            icon: <TrophyOutlined />,
            label: '专业技能',
        },
        {
            key: 'advantages',
            icon: <TrophyOutlined />,
            label: '个人优势',
        }
    ];

    return (
        <div className="bg-white rounded-lg shadow-sm py-4 px-2 h-full">
            <div className="mb-4 px-2">
                <h3 className="text-lg font-bold text-gray-800">简历目录</h3>
            </div>
            <Menu
                mode="inline"
                selectedKeys={[activeSection]}
                onClick={({ key }) => onSectionChange(key)}
                items={menuItems}
                style={{ borderRight: 0 }}
                className="profile-sidebar-menu"
            />
        </div>
    );
};

export default ProfileSidebar;
