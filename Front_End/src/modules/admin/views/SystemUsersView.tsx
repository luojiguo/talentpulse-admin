import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Download, X, Shield, Briefcase, Users, User, Ban, CheckCircle, Key, Building2 } from 'lucide-react';
import { message, Popconfirm, Tooltip } from 'antd';
import { TRANSLATIONS } from '@/constants/constants';
import { userAPI } from '@/services/apiService';
import { SystemUser, Language, UserRole } from '@/types/types';
import { exportToCSV, calculateResumeCompleteness } from '../helpers';
import Pagination from '@/components/Pagination';

// 测试环境中密码哈希值到明文密码的映射
const passwordMap: Record<string, string> = {
    '$2b$10$TfgQY0rgp0WPJt.7ZiEFDuBuM7geFIJwybRTcxI.RTxs81j7iO1Iy': '123456',
    // 可以根据需要添加更多映射
};

const SystemUsersView: React.FC<{ lang: Language }> = ({ lang }) => {
    const t = TRANSLATIONS[lang].users;
    const [users, setUsers] = useState<SystemUser[]>([]);
    const [filterRole, setFilterRole] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);
    const [loading, setLoading] = useState(true);

    // 列配置状态
    const [visibleColumns, setVisibleColumns] = useState({
        name: true,
        email: true,
        phone: true, // 手机号
        gender: true, // 性别
        password: false, // 默认隐藏密码列
        userType: true, // 用户类型列
        status: true, // 状态列 - Added back to clarify state vs action
        education: true, // 学历
        workExperience: true, // 工作经验
        desiredPosition: false, // 期望职位
        createdAt: true,
        lastLogin: false,
        emailVerified: false, // 邮箱验证状态
        phoneVerified: false, // 手机验证状态
        action: true
    });

    // 列显示/隐藏弹窗状态
    const [showColumnModal, setShowColumnModal] = useState(false);

    // 分页状态
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10); // 每页显示10条数据
    const [totalItems, setTotalItems] = useState(0);

    // 从API获取用户数据
    React.useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoading(true);
                const response = await userAPI.getAllUsers();
                // 将数据库返回的用户数据转换为前端所需的格式
                const formattedUsers: SystemUser[] = response.data.map((user: any) => ({
                    id: user.id.toString(),
                    name: user.name,
                    email: user.email,
                    password: user.password, // 提取密码字段（仅测试环境使用）
                    role: user.roles && user.roles.length > 0 ? user.roles[0] as UserRole : 'candidate',
                    roles: user.roles || [user.role as UserRole], // 确保roles数组存在
                    status: user.status === 'active' ? 'Active' : user.status === 'inactive' ? 'Inactive' : 'Suspended',
                    lastLogin: user.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'Never',
                    createdAt: new Date(user.created_at).toLocaleDateString(),
                    // 个人基本信息
                    phone: user.phone,
                    gender: user.gender,
                    birthDate: user.birth_date ? new Date(user.birth_date).toLocaleDateString() : undefined,
                    education: user.education,
                    major: user.major,
                    school: user.school,
                    graduationYear: user.graduation_year,
                    // 职业信息
                    workExperienceYears: user.work_experience_years,
                    desiredPosition: user.desired_position,
                    skills: user.skills || [],
                    languages: user.languages || [],
                    // 联系与社交信息
                    address: user.address,
                    wechat: user.wechat,
                    linkedin: user.linkedin,
                    github: user.github,
                    personalWebsite: user.personal_website,
                    // 系统信息
                    emailVerified: user.email_verified,
                    phoneVerified: user.phone_verified,
                    resumeCompleteness: calculateResumeCompleteness(user),
                    dbResumeCompleteness: user.resume_completeness, // Store original DB value for comparison
                    avatar: user.avatar
                }));
                setUsers(formattedUsers);
            } catch (error) {
                console.error('获取用户数据失败:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    // 筛选用户数据
    const filteredUsersList = useMemo(() => {
        return users.filter(user =>
            (filterRole === 'all' || user.role === filterRole) &&
            (user.name.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [users, filterRole, searchTerm]);

    // 分页处理
    const filteredUsers = useMemo(() => {
        // 更新总数据量
        setTotalItems(filteredUsersList.length);
        // 计算当前页显示的数据
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        return filteredUsersList.slice(startIndex, endIndex);
    }, [filteredUsersList, currentPage, pageSize]);

    // 重置当前页当筛选条件变化时
    useEffect(() => {
        setCurrentPage(1);
    }, [filterRole, searchTerm]);

    const RoleBadge = ({ role }: { role: UserRole }) => {
        const colors = {
            admin: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
            recruiter: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
            candidate: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
        };
        const icons = { admin: <Shield size={12} />, recruiter: <Briefcase size={12} />, candidate: <Users size={12} /> };
        return <span className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${colors[role]}`}>{icons[role]}{role}</span>;
    };

    const StatusBadge = ({ status }: { status: SystemUser['status'] }) => {
        const colors = {
            Active: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
            Inactive: 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-400',
            Suspended: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
        };
        const labels: Record<string, string> = {
            Active: t.activeStatus,
            Inactive: t.inactiveStatus,
            Suspended: t.suspendedStatus,
        };
        return <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${colors[status]}`}>{labels[status] || status}</span>;
    };

    // Fetch full user details when a user is selected
    useEffect(() => {
        const fetchUserDetails = async () => {
            if (selectedUser?.id && selectedUser.roles?.includes('recruiter')) {
                try {
                    const response = await userAPI.getUserById(selectedUser.id);
                    if (response.data) {
                        setSelectedUser(prev => prev ? {
                            ...prev,
                            company_name: response.data.company_name,
                            company_address: response.data.company_address
                        } : null);
                    }
                } catch (error) {
                    console.error('Failed to fetch user details:', error);
                }
            }
        };

        if (selectedUser) {
            fetchUserDetails();
        }
    }, [selectedUser?.id]);

    const syncResumeCompleteness = async (user: SystemUser) => {
        try {
            await userAPI.updateUser(user.id.toString(), {
                resume_completeness: user.resumeCompleteness
            });
            // 更新本地状态
            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, dbResumeCompleteness: user.resumeCompleteness } : u));
            if (selectedUser?.id === user.id) {
                setSelectedUser(prev => prev ? { ...prev, dbResumeCompleteness: user.resumeCompleteness } : null);
            }
        } catch (error) {
            console.error('同步简历完整度失败:', error);
        }
    };

    const handleUpdateStatus = async (userId: string | number, newStatus: 'active' | 'suspended') => {
        try {
            await userAPI.updateUserStatus(userId, newStatus);
            message.success(`用户状态已更新为 ${newStatus === 'active' ? '正常' : '已封禁'}`);

            // Update local state
            setUsers(prev => prev.map(u => {
                if (u.id === userId) {
                    return { ...u, status: newStatus === 'active' ? 'Active' : 'Suspended' };
                }
                return u;
            }));

            if (selectedUser?.id === userId) {
                setSelectedUser(prev => prev ? { ...prev, status: newStatus === 'active' ? 'Active' : 'Suspended' } : null);
            }
        } catch (error) {
            console.error('更新用户状态失败:', error);
            message.error(lang === 'zh' ? '更新用户状态失败' : 'Failed to update user status');
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="flex gap-2 items-center w-full md:w-auto">
                        <Search className="text-slate-400 w-5 h-5" />
                        <input type="text" placeholder={t.search} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-transparent focus:outline-none text-sm w-full md:w-64 dark:text-white" />
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="bg-slate-100 dark:bg-slate-700 dark:text-white border-none rounded-lg text-sm px-4 py-2 w-full md:w-auto focus:ring-2 focus:ring-blue-500">
                            <option value="all">{t.allRoles}</option>
                            <option value="admin">{TRANSLATIONS[lang].roles.admin}</option>
                            <option value="recruiter">{TRANSLATIONS[lang].roles.recruiter}</option>
                            <option value="candidate">{TRANSLATIONS[lang].roles.candidate}</option>
                        </select>
                        <button onClick={() => exportToCSV(filteredUsers, 'system_users')} className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white text-sm font-medium rounded-lg hover:bg-slate-900 transition-all">
                            <Download size={16} /> {t.export}
                        </button>
                        {/* 列显示/隐藏控制按钮 */}
                        <button
                            onClick={() => setShowColumnModal(true)}
                            className="bg-slate-100 dark:bg-slate-700 dark:text-white border-none rounded-lg text-sm px-4 py-2 focus:ring-2 focus:ring-blue-500 flex items-center gap-2"
                        >
                            <Filter size={16} className="text-slate-500 dark:text-slate-400" />
                            <span>{t.columnSettings}</span>
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400 min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300 sticky top-0 z-10">
                            <tr>
                                {visibleColumns.name && <th scope="col" className="px-6 py-3 text-left min-w-[150px]">{t.name}</th>}
                                {visibleColumns.email && <th scope="col" className="px-6 py-3 text-left min-w-[200px]">{t.email}</th>}
                                {visibleColumns.phone && <th scope="col" className="px-6 py-3 text-left min-w-[120px]">{t.phone}</th>}
                                {visibleColumns.gender && <th scope="col" className="px-6 py-3 text-left min-w-[80px]">{t.gender}</th>}
                                {visibleColumns.password && <th scope="col" className="px-6 py-3 text-left min-w-[150px]">{t.password}</th>}
                                {visibleColumns.userType && <th scope="col" className="px-6 py-3 text-left min-w-[120px]">{t.userType}</th>}
                                {visibleColumns.status && <th scope="col" className="px-6 py-3 text-left min-w-[100px]">{t.status}</th>}
                                {visibleColumns.education && <th scope="col" className="px-6 py-3 text-left min-w-[120px]">{t.education}</th>}
                                {visibleColumns.workExperience && <th scope="col" className="px-6 py-3 text-left min-w-[120px]">{t.workExperience}</th>}
                                {visibleColumns.desiredPosition && <th scope="col" className="px-6 py-3 text-left min-w-[150px]">{t.desiredPosition}</th>}
                                {visibleColumns.emailVerified && <th scope="col" className="px-6 py-3 text-left min-w-[100px]">{t.emailVerified}</th>}
                                {visibleColumns.phoneVerified && <th scope="col" className="px-6 py-3 text-left min-w-[100px]">{t.phoneVerified}</th>}
                                {visibleColumns.createdAt && <th scope="col" className="px-6 py-3 text-left min-w-[120px]">{t.createdAt}</th>}
                                {visibleColumns.lastLogin && <th scope="col" className="px-6 py-3 text-left min-w-[150px]">{t.lastLogin}</th>}
                                {visibleColumns.action && <th scope="col" className="px-6 py-3 text-left min-w-[80px]">{t.action}</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={Object.keys(visibleColumns).length} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                                        {t.loading}
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={Object.keys(visibleColumns).length} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                                        {t.noUsers}
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map(user => (
                                    <tr key={user.id} className="group bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600/50">
                                        {visibleColumns.name && (
                                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-white overflow-hidden text-ellipsis whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative h-8 w-8 flex-shrink-0">
                                                        {/* Base Layer: Initials */}
                                                        <div className={`h-full w-full rounded-full flex items-center justify-center font-bold border border-white dark:border-slate-800 shadow-sm text-xs ${user.roles?.includes('candidate')
                                                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                                            : user.roles?.includes('recruiter')
                                                                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                                                                : 'bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400'
                                                            }`}>
                                                            {user.name.charAt(0)}
                                                        </div>

                                                        {/* Top Layer: Image */}
                                                        {user.avatar && (
                                                            <img
                                                                src={user.avatar.startsWith('http') ? user.avatar : `http://localhost:8001${user.avatar}`}
                                                                alt={user.name}
                                                                className="absolute inset-0 h-full w-full rounded-full object-cover"
                                                                onError={(e) => {
                                                                    e.currentTarget.style.display = 'none';
                                                                }}
                                                            />
                                                        )}
                                                    </div>
                                                    <Tooltip title={user.name}>
                                                        <span
                                                            className="cursor-pointer hover:text-blue-600 hover:underline transition-colors"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigator.clipboard.writeText(user.name);
                                                                message.success(t.copyName);
                                                            }}
                                                        >
                                                            {(() => {
                                                                const isChinese = /[\u4e00-\u9fa5]/.test(user.name);
                                                                const limit = isChinese ? 4 : 16;
                                                                return user.name.length > limit ? `${user.name.substring(0, limit)}...` : user.name;
                                                            })()}
                                                        </span>
                                                    </Tooltip>
                                                </div>
                                            </td>
                                        )}
                                        {visibleColumns.email && (
                                            <td className="px-6 py-4 text-slate-900 dark:text-white">
                                                <Tooltip title={user.email}>
                                                    <span
                                                        className="cursor-pointer hover:text-blue-600 hover:underline transition-colors"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigator.clipboard.writeText(user.email);
                                                            message.success(t.copyEmail);
                                                        }}
                                                    >
                                                        {user.email.length > 16 ? `${user.email.substring(0, 16)}...` : user.email}
                                                    </span>
                                                </Tooltip>
                                            </td>
                                        )}
                                        {visibleColumns.phone && <td className="px-6 py-4 text-slate-900 dark:text-white overflow-hidden text-ellipsis whitespace-nowrap">{user.phone || '-'}</td>}
                                        {visibleColumns.gender && <td className="px-6 py-4 text-slate-900 dark:text-white">{user.gender || '-'}</td>}
                                        {visibleColumns.password && <td className="px-6 py-4 font-mono text-sm text-slate-900 dark:text-white overflow-hidden text-ellipsis whitespace-nowrap">
                                            {user.password ? user.password : t.notSet}
                                        </td>}
                                        {visibleColumns.userType && <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {user.roles?.includes('candidate') && (
                                                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm border border-blue-200 dark:border-blue-800" title={TRANSLATIONS[lang].roles.candidate}>
                                                        <User size={16} />
                                                    </div>
                                                )}
                                                {user.roles?.includes('recruiter') && (
                                                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm border border-emerald-200 dark:border-emerald-800" title={TRANSLATIONS[lang].roles.recruiter}>
                                                        <Building2 size={16} />
                                                    </div>
                                                )}
                                                {user.roles?.includes('admin') && (
                                                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-sm border border-purple-200 dark:border-purple-800" title={TRANSLATIONS[lang].roles.admin}>
                                                        <Shield size={16} />
                                                    </div>
                                                )}
                                            </div>
                                        </td>}
                                        {visibleColumns.status && <td className="px-6 py-4">
                                            <StatusBadge status={user.status} />
                                        </td>}
                                        {visibleColumns.education && <td className="px-6 py-4 text-slate-900 dark:text-white overflow-hidden text-ellipsis whitespace-nowrap">{user.education || (lang === 'zh' ? '无' : 'None')}</td>}
                                        {visibleColumns.workExperience && <td className="px-6 py-4 text-slate-900 dark:text-white">{user.workExperienceYears || 0} {lang === 'zh' ? '年' : 'Years'}</td>}
                                        {visibleColumns.desiredPosition && <td className="px-6 py-4 text-slate-900 dark:text-white overflow-hidden text-ellipsis whitespace-nowrap">{user.desiredPosition || t.notSet}</td>}
                                        {visibleColumns.emailVerified && <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${user.emailVerified ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-400'}`}>
                                                {user.emailVerified ? t.verified : t.unverified}
                                            </span>
                                        </td>}
                                        {visibleColumns.phoneVerified && <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${user.phoneVerified ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-400'}`}>
                                                {user.phoneVerified ? t.verified : t.unverified}
                                            </span>
                                        </td>}
                                        {visibleColumns.createdAt && <td className="px-6 py-4 whitespace-nowrap">{user.createdAt}</td>}
                                        {visibleColumns.lastLogin && <td className="px-6 py-4 whitespace-nowrap">{user.lastLogin}</td>}
                                        {visibleColumns.action && <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => setSelectedUser(user)} className="font-medium text-blue-600 dark:text-blue-500 hover:underline">{lang === 'zh' ? '查看' : 'View'}</button>
                                                {user.role !== 'admin' && (
                                                    <div className="flex items-center gap-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                                                        <Popconfirm
                                                            title={t.resetPassword}
                                                            description={t.resetConfirm}
                                                            onConfirm={async () => {
                                                                try {
                                                                    await userAPI.adminResetPassword(user.id);
                                                                    message.success(lang === 'zh' ? '密码已重置为 123456' : 'Password reset to 123456');
                                                                } catch (error) {
                                                                    console.error('重置密码失败:', error);
                                                                    message.error(lang === 'zh' ? '重置密码失败' : 'Failed to reset password');
                                                                }
                                                            }}
                                                            okText={lang === 'zh' ? '确定' : 'OK'}
                                                            cancelText={t.cancel}
                                                        >
                                                            <button
                                                                className="p-1 text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded"
                                                                title={t.resetPassword}
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <Key size={16} />
                                                            </button>
                                                        </Popconfirm>

                                                        {user.status === 'Suspended' ? (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleUpdateStatus(user.id, 'active'); }}
                                                                className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                                                                title={t.unbanUser}
                                                            >
                                                                <Ban size={16} />
                                                            </button>
                                                        ) : (
                                                            <div onClick={e => e.stopPropagation()}>
                                                                <Popconfirm
                                                                    title={t.banUser}
                                                                    description={t.banConfirm}
                                                                    onConfirm={() => handleUpdateStatus(user.id, 'suspended')}
                                                                    okText={lang === 'zh' ? '确定' : 'OK'}
                                                                    cancelText={t.cancel}
                                                                >
                                                                    <button
                                                                        className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded"
                                                                        title={t.banUser}
                                                                    >
                                                                        <CheckCircle size={16} />
                                                                    </button>
                                                                </Popconfirm>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </td>}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* 分页组件 */}
                <div className="px-6 py-2 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
                    <Pagination
                        currentPage={currentPage}
                        pageSize={pageSize}
                        totalItems={totalItems}
                        onPageChange={(page) => setCurrentPage(page)}
                        onPageSizeChange={(size) => {
                            setPageSize(size);
                            setCurrentPage(1); // 重置到第一页
                        }}
                        pageSizeOptions={[10, 20, 50, 100]}
                    />
                </div>
            </div>
            {/* 列显示/隐藏配置弹窗 */}
            {showColumnModal && (
                <div className="fixed inset-0 bg-black/30 z-50" onClick={() => setShowColumnModal(false)}>
                    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center border-b pb-4 dark:border-slate-700 mb-4">
                            <h2 className="text-xl font-bold dark:text-white">{t.columnSettings}</h2>
                            <button onClick={() => setShowColumnModal(false)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><X size={20} /></button>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.name}</label>
                                <input
                                    type="checkbox"
                                    checked={visibleColumns.name}
                                    onChange={(e) => setVisibleColumns(prev => ({ ...prev, name: e.target.checked }))}
                                    className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-slate-800 dark:bg-slate-700 dark:border-slate-600"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.email}</label>
                                <input
                                    type="checkbox"
                                    checked={visibleColumns.email}
                                    onChange={(e) => setVisibleColumns(prev => ({ ...prev, email: e.target.checked }))}
                                    className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-slate-800 dark:bg-slate-700 dark:border-slate-600"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.phone}</label>
                                <input
                                    type="checkbox"
                                    checked={visibleColumns.phone}
                                    onChange={(e) => setVisibleColumns(prev => ({ ...prev, phone: e.target.checked }))}
                                    className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-slate-800 dark:bg-slate-700 dark:border-slate-600"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.gender}</label>
                                <input
                                    type="checkbox"
                                    checked={visibleColumns.gender}
                                    onChange={(e) => setVisibleColumns(prev => ({ ...prev, gender: e.target.checked }))}
                                    className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-slate-800 dark:bg-slate-700 dark:border-slate-600"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.password}</label>
                                <input
                                    type="checkbox"
                                    checked={visibleColumns.password}
                                    onChange={(e) => setVisibleColumns(prev => ({ ...prev, password: e.target.checked }))}
                                    className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-slate-800 dark:bg-slate-700 dark:border-slate-600"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.userType}</label>
                                <input
                                    type="checkbox"
                                    checked={visibleColumns.userType}
                                    onChange={(e) => setVisibleColumns(prev => ({ ...prev, userType: e.target.checked }))}
                                    className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-slate-800 dark:bg-slate-700 dark:border-slate-600"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.status}</label>
                                <input
                                    type="checkbox"
                                    checked={visibleColumns.status}
                                    onChange={(e) => setVisibleColumns(prev => ({ ...prev, status: e.target.checked }))}
                                    className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-slate-800 dark:bg-slate-700 dark:border-slate-600"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.education}</label>
                                <input
                                    type="checkbox"
                                    checked={visibleColumns.education}
                                    onChange={(e) => setVisibleColumns(prev => ({ ...prev, education: e.target.checked }))}
                                    className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-slate-800 dark:bg-slate-700 dark:border-slate-600"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.workExperience}</label>
                                <input
                                    type="checkbox"
                                    checked={visibleColumns.workExperience}
                                    onChange={(e) => setVisibleColumns(prev => ({ ...prev, workExperience: e.target.checked }))}
                                    className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-slate-800 dark:bg-slate-700 dark:border-slate-600"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.desiredPosition}</label>
                                <input
                                    type="checkbox"
                                    checked={visibleColumns.desiredPosition}
                                    onChange={(e) => setVisibleColumns(prev => ({ ...prev, desiredPosition: e.target.checked }))}
                                    className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-slate-800 dark:bg-slate-700 dark:border-slate-600"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.emailVerified}</label>
                                <input
                                    type="checkbox"
                                    checked={visibleColumns.emailVerified}
                                    onChange={(e) => setVisibleColumns(prev => ({ ...prev, emailVerified: e.target.checked }))}
                                    className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-slate-800 dark:bg-slate-700 dark:border-slate-600"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.phoneVerified}</label>
                                <input
                                    type="checkbox"
                                    checked={visibleColumns.phoneVerified}
                                    onChange={(e) => setVisibleColumns(prev => ({ ...prev, phoneVerified: e.target.checked }))}
                                    className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-slate-800 dark:bg-slate-700 dark:border-slate-600"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.createdAt}</label>
                                <input
                                    type="checkbox"
                                    checked={visibleColumns.createdAt}
                                    onChange={(e) => setVisibleColumns(prev => ({ ...prev, createdAt: e.target.checked }))}
                                    className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-slate-800 dark:bg-slate-700 dark:border-slate-600"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.lastLogin}</label>
                                <input
                                    type="checkbox"
                                    checked={visibleColumns.lastLogin}
                                    onChange={(e) => setVisibleColumns(prev => ({ ...prev, lastLogin: e.target.checked }))}
                                    className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-slate-800 dark:bg-slate-700 dark:border-slate-600"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.action}</label>
                                <input
                                    type="checkbox"
                                    checked={visibleColumns.action}
                                    onChange={(e) => setVisibleColumns(prev => ({ ...prev, action: e.target.checked }))}
                                    className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-slate-800 dark:bg-slate-700 dark:border-slate-600"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6 justify-end">
                            <button
                                onClick={() => setShowColumnModal(false)}
                                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                            >
                                {t.cancel}
                            </button>
                            <button
                                onClick={() => {
                                    setShowColumnModal(false);
                                }}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                {t.save}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* User Detail Panel */}
            {selectedUser && (
                <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setSelectedUser(null)}>
                    <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-slate-800 shadow-2xl animate-in slide-in-from-right-1/4 duration-300 p-6 flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center border-b pb-4 dark:border-slate-700">
                            <h2 className="text-xl font-bold dark:text-white">{t.userDetails}</h2>
                            <button onClick={() => setSelectedUser(null)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><X size={20} /></button>
                        </div>
                        <div className="py-6 space-y-6 overflow-y-auto flex-1">
                            {/* 头像展示 */}
                            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-700/30 rounded-2xl border border-slate-100 dark:border-slate-700">
                                <div className="relative h-24 w-24 flex-shrink-0">
                                    {/* Base Layer: Initials */}
                                    <div className={`h-full w-full rounded-full flex items-center justify-center text-3xl font-bold border-4 border-white dark:border-slate-800 shadow-lg ${selectedUser.roles?.includes('candidate')
                                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                        : selectedUser.roles?.includes('recruiter')
                                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                                            : 'bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400'
                                        }`}>
                                        {selectedUser.name.charAt(0)}
                                    </div>

                                    {/* Top Layer: Image */}
                                    {selectedUser.avatar && (
                                        <img
                                            src={selectedUser.avatar.startsWith('http') ? selectedUser.avatar : `http://localhost:8001${selectedUser.avatar}`}
                                            alt={selectedUser.name}
                                            className="absolute inset-0 h-full w-full rounded-full object-cover"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                            }}
                                        />
                                    )}
                                </div>
                                <h3 className="mt-4 text-xl font-bold dark:text-white uppercase tracking-tight">{selectedUser.name}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{selectedUser.email}</p>
                            </div>

                            {/* 基本信息 */}
                            <div>
                                <h3 className="text-lg font-semibold dark:text-white mb-3">{t.basicInfo}</h3>
                                <div className="space-y-3 text-slate-600 dark:text-slate-300">
                                    <p><strong className="dark:text-white">ID:</strong> {selectedUser.id}</p>
                                    <p><strong className="dark:text-white">{t.name}:</strong> {selectedUser.name}</p>
                                    <p><strong className="dark:text-white">{t.email}:</strong> {selectedUser.email}</p>
                                    <p><strong className="dark:text-white">{t.password}:</strong>
                                        <span className="font-mono text-sm ml-1">
                                            {selectedUser.password ? selectedUser.password : t.notSet}
                                        </span>
                                    </p>
                                    <p><strong className="dark:text-white">{t.phone}:</strong> {selectedUser.phone || t.notSet}</p>
                                    <p><strong className="dark:text-white">{t.userType}:</strong>
                                        <span className="ml-1">
                                            {selectedUser.roles?.includes('candidate') && selectedUser.roles?.includes('recruiter') ? (lang === 'zh' ? '求职者和招聘者' : 'Candidate & Recruiter') :
                                                selectedUser.roles?.includes('candidate') ? TRANSLATIONS[lang].roles.candidate :
                                                    selectedUser.roles?.includes('recruiter') ? TRANSLATIONS[lang].roles.recruiter :
                                                        TRANSLATIONS[lang].roles.admin}
                                        </span>
                                    </p>
                                    {/* Display Company for Recruiters */}
                                    {selectedUser.roles?.includes('recruiter') && (
                                        <>
                                            <p><strong className="dark:text-white">{lang === 'zh' ? '所属公司' : 'Company'}:</strong> {selectedUser.company_name || 'Loading...'}</p>
                                            {selectedUser.company_address && (
                                                <p><strong className="dark:text-white">{lang === 'zh' ? '公司地址' : 'Address'}:</strong> {selectedUser.company_address}</p>
                                            )}
                                        </>
                                    )}
                                    <p><strong className="dark:text-white">{t.createdAt}:</strong> {selectedUser.createdAt}</p>
                                    <p><strong className="dark:text-white">{t.lastLogin}:</strong> {selectedUser.lastLogin}</p>
                                </div>
                            </div>

                            {/* 个人信息 */}
                            <div>
                                <h3 className="text-lg font-semibold dark:text-white mb-3">{t.personalInfo}</h3>
                                <div className="space-y-3 text-slate-600 dark:text-slate-300">
                                    <p><strong className="dark:text-white">{t.gender}:</strong> {selectedUser.gender || t.notSet}</p>
                                    <p><strong className="dark:text-white">{lang === 'zh' ? '出生日期' : 'Birth Date'}:</strong> {selectedUser.birthDate || t.notSet}</p>
                                    <p><strong className="dark:text-white">{t.education}:</strong> {selectedUser.education || t.notSet}</p>
                                    <p><strong className="dark:text-white">{lang === 'zh' ? '专业' : 'Major'}:</strong> {selectedUser.major || t.notSet}</p>
                                    <p><strong className="dark:text-white">{lang === 'zh' ? '毕业院校' : 'School'}:</strong> {selectedUser.school || t.notSet}</p>
                                    <p><strong className="dark:text-white">{lang === 'zh' ? '毕业年份' : 'Graduation Year'}:</strong> {selectedUser.graduationYear || t.notSet}</p>
                                </div>
                            </div>

                            {/* 职业信息 */}
                            <div>
                                <h3 className="text-lg font-semibold dark:text-white mb-3">{t.professionalInfo}</h3>
                                <div className="space-y-3 text-slate-600 dark:text-slate-300">
                                    <p><strong className="dark:text-white">{t.workExperience}:</strong> {selectedUser.workExperienceYears || 0} {lang === 'zh' ? '年' : 'Years'}</p>
                                    <p><strong className="dark:text-white">{t.desiredPosition}:</strong> {selectedUser.desiredPosition || t.notSet}</p>
                                    <p><strong className="dark:text-white">{lang === 'zh' ? '技能' : 'Skills'}:</strong> {selectedUser.skills?.length ? selectedUser.skills.join(', ') : t.notSet}</p>
                                    <p><strong className="dark:text-white">{lang === 'zh' ? '语言能力' : 'Languages'}:</strong> {selectedUser.languages?.length ? selectedUser.languages.join(', ') : t.notSet}</p>
                                </div>
                            </div>

                            {/* 联系与社交信息 */}
                            <div>
                                <h3 className="text-lg font-semibold dark:text-white mb-3">{t.contactInfo}</h3>
                                <div className="space-y-3 text-slate-600 dark:text-slate-300">
                                    <p><strong className="dark:text-white">{lang === 'zh' ? '地址' : 'Address'}:</strong> {selectedUser.address || t.notSet}</p>
                                    <p><strong className="dark:text-white">{lang === 'zh' ? '微信号' : 'WeChat'}:</strong> {selectedUser.wechat || t.notSet}</p>
                                    <p><strong className="dark:text-white">LinkedIn:</strong> {selectedUser.linkedin || t.notSet}</p>
                                    <p><strong className="dark:text-white">GitHub:</strong> {selectedUser.github || t.notSet}</p>
                                    <p><strong className="dark:text-white">{lang === 'zh' ? '个人网站' : 'Website'}:</strong> {selectedUser.personalWebsite || t.notSet}</p>
                                </div>
                            </div>
                            {/* 系统信息 */}
                            <div>
                                <h3 className="text-lg font-semibold dark:text-white mb-3">{t.systemInfo}</h3>
                                <div className="space-y-3 text-slate-600 dark:text-slate-300">
                                    <div className="flex items-center justify-between">
                                        <p><strong className="dark:text-white">{lang === 'zh' ? '简历完整度' : 'Resume Completeness'}:</strong> {selectedUser.resumeCompleteness || 0}%</p>
                                        {selectedUser.dbResumeCompleteness !== selectedUser.resumeCompleteness && (
                                            <button
                                                onClick={() => syncResumeCompleteness(selectedUser)}
                                                className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                                                title={lang === 'zh' ? '同步到数据库' : 'Sync to DB'}
                                            >
                                                {lang === 'zh' ? '同步数据' : 'Sync Data'}
                                            </button>
                                        )}
                                    </div>
                                    {selectedUser.dbResumeCompleteness !== selectedUser.resumeCompleteness && (
                                        <p className="text-[10px] text-amber-500 mt-1">* {lang === 'zh' ? '实时计算值与数据库记录不符' : 'Calculated value differs from DB'}</p>
                                    )}
                                </div>
                                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                    <h3 className="text-lg font-semibold dark:text-white mb-3">{t.accountManage}</h3>
                                    <div className="flex gap-3">
                                        {selectedUser.status === 'Suspended' ? (
                                            <button
                                                onClick={() => handleUpdateStatus(selectedUser.id, 'active')}
                                                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <CheckCircle size={18} />
                                                {t.unbanUser}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleUpdateStatus(selectedUser.id, 'suspended')}
                                                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Ban size={18} />
                                                {t.banUser}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SystemUsersView;