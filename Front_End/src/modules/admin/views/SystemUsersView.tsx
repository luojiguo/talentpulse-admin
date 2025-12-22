import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Download, X, Shield, Briefcase, Users } from 'lucide-react';
import { TRANSLATIONS } from '@/constants/constants';
import { userAPI } from '@/services/apiService';
import { SystemUser, Language, UserRole } from '@/types/types';
import { exportToCSV } from '../helpers';

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
        role: true,
        status: true,
        createdAt: true,
        lastLogin: true,
        action: true
    });
    
    // 列显示/隐藏弹窗状态
    const [showColumnModal, setShowColumnModal] = useState(false);

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
                    role: user.role as UserRole,
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
                    resumeCompleteness: user.resume_completeness
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

    const filteredUsers = useMemo(() => {
        return users.filter(user => 
            (filterRole === 'all' || user.role === filterRole) &&
            (user.name.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [users, filterRole, searchTerm]);

    const RoleBadge = ({ role }: { role: UserRole }) => {
        const colors = {
            admin: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
            recruiter: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
            candidate: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
        };
        const icons = { admin: <Shield size={12}/>, recruiter: <Briefcase size={12}/>, candidate: <Users size={12}/> };
        return <span className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${colors[role]}`}>{icons[role]}{role}</span>;
    };

    const StatusBadge = ({ status }: { status: SystemUser['status'] }) => {
        const colors = {
            Active: 'bg-green-100 text-green-700',
            Inactive: 'bg-gray-100 text-gray-600',
            Suspended: 'bg-yellow-100 text-yellow-700',
        };
        return <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${colors[status]}`}>{status}</span>;
    };
    
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t.title}</h1>
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="flex gap-2 items-center w-full md:w-auto">
                        <Search className="text-slate-400 w-5 h-5"/>
                        <input type="text" placeholder="Search by name or email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-transparent focus:outline-none text-sm w-full md:w-64"/>
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="bg-slate-100 dark:bg-slate-700 border-none rounded-lg text-sm px-4 py-2 w-full md:w-auto focus:ring-2 focus:ring-blue-500">
                            <option value="all">All Roles</option>
                            <option value="admin">Admin</option>
                            <option value="recruiter">Recruiter</option>
                            <option value="candidate">Candidate</option>
                        </select>
                        <button onClick={() => exportToCSV(filteredUsers, 'system_users')} className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white text-sm font-medium rounded-lg hover:bg-slate-900 transition-all">
                            <Download size={16}/> Export
                        </button>
                        {/* 列显示/隐藏控制按钮 */}
                        <button 
                            onClick={() => setShowColumnModal(true)}
                            className="bg-slate-100 dark:bg-slate-700 border-none rounded-lg text-sm px-4 py-2 focus:ring-2 focus:ring-blue-500 flex items-center gap-2"
                        >
                            <Filter size={16} className="text-slate-500" />
                            <span>列设置</span>
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
                            <tr>
                                {visibleColumns.name && <th scope="col" className="px-6 py-3 text-left">{t.name}</th>}
                                {visibleColumns.email && <th scope="col" className="px-6 py-3 text-left">Email</th>}
                                {visibleColumns.role && <th scope="col" className="px-6 py-3 text-left">{t.role}</th>}
                                {visibleColumns.status && <th scope="col" className="px-6 py-3 text-left">{t.status}</th>}
                                {visibleColumns.createdAt && <th scope="col" className="px-6 py-3 text-left">{t.createdAt}</th>}
                                {visibleColumns.lastLogin && <th scope="col" className="px-6 py-3 text-left">{t.lastLogin}</th>}
                                {visibleColumns.action && <th scope="col" className="px-6 py-3 text-left">{t.action}</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={Object.keys(visibleColumns).length} className="px-6 py-8 text-center text-slate-500">
                                        加载中...
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={Object.keys(visibleColumns).length} className="px-6 py-8 text-center text-slate-500">
                                        没有找到匹配的用户
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map(user => (
                                    <tr key={user.id} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600/50">
                                        {visibleColumns.name && <td className="px-6 py-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">{user.name}</td>}
                                        {visibleColumns.email && <td className="px-6 py-4 text-slate-900 dark:text-white whitespace-nowrap">{user.email}</td>}
                                        {visibleColumns.role && <td className="px-6 py-4"><RoleBadge role={user.role}/></td>}
                                        {visibleColumns.status && <td className="px-6 py-4"><StatusBadge status={user.status}/></td>}
                                        {visibleColumns.createdAt && <td className="px-6 py-4">{user.createdAt}</td>}
                                        {visibleColumns.lastLogin && <td className="px-6 py-4">{user.lastLogin}</td>}
                                        {visibleColumns.action && <td className="px-6 py-4">
                                            <button onClick={() => setSelectedUser(user)} className="font-medium text-blue-600 dark:text-blue-500 hover:underline">View</button>
                                        </td>}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* 列显示/隐藏配置弹窗 */}
            {showColumnModal && (
                <div className="fixed inset-0 bg-black/30 z-50" onClick={() => setShowColumnModal(false)}>
                    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center border-b pb-4 dark:border-slate-700 mb-4">
                            <h2 className="text-xl font-bold dark:text-white">列设置</h2>
                            <button onClick={() => setShowColumnModal(false)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><X size={20}/></button>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">用户名称</label>
                                <input 
                                    type="checkbox" 
                                    checked={visibleColumns.name} 
                                    onChange={(e) => setVisibleColumns(prev => ({...prev, name: e.target.checked}))}
                                    className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-slate-800 dark:bg-slate-700 dark:border-slate-600"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">邮箱</label>
                                <input 
                                    type="checkbox" 
                                    checked={visibleColumns.email} 
                                    onChange={(e) => setVisibleColumns(prev => ({...prev, email: e.target.checked}))}
                                    className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-slate-800 dark:bg-slate-700 dark:border-slate-600"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">角色</label>
                                <input 
                                    type="checkbox" 
                                    checked={visibleColumns.role} 
                                    onChange={(e) => setVisibleColumns(prev => ({...prev, role: e.target.checked}))}
                                    className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-slate-800 dark:bg-slate-700 dark:border-slate-600"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">状态</label>
                                <input 
                                    type="checkbox" 
                                    checked={visibleColumns.status} 
                                    onChange={(e) => setVisibleColumns(prev => ({...prev, status: e.target.checked}))}
                                    className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-slate-800 dark:bg-slate-700 dark:border-slate-600"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">创建时间</label>
                                <input 
                                    type="checkbox" 
                                    checked={visibleColumns.createdAt} 
                                    onChange={(e) => setVisibleColumns(prev => ({...prev, createdAt: e.target.checked}))}
                                    className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-slate-800 dark:bg-slate-700 dark:border-slate-600"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">最后登录</label>
                                <input 
                                    type="checkbox" 
                                    checked={visibleColumns.lastLogin} 
                                    onChange={(e) => setVisibleColumns(prev => ({...prev, lastLogin: e.target.checked}))}
                                    className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-slate-800 dark:bg-slate-700 dark:border-slate-600"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">操作</label>
                                <input 
                                    type="checkbox" 
                                    checked={visibleColumns.action} 
                                    onChange={(e) => setVisibleColumns(prev => ({...prev, action: e.target.checked}))}
                                    className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-slate-800 dark:bg-slate-700 dark:border-slate-600"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6 justify-end">
                            <button 
                                onClick={() => setShowColumnModal(false)}
                                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                            >
                                取消
                            </button>
                            <button 
                                onClick={() => {
                                    setShowColumnModal(false);
                                }}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                保存
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
                            <h2 className="text-xl font-bold dark:text-white">User Details</h2>
                            <button onClick={() => setSelectedUser(null)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><X size={20}/></button>
                        </div>
                        <div className="py-6 space-y-6 overflow-y-auto flex-1">
                           {/* 基本信息 */}
                           <div>
                               <h3 className="text-lg font-semibold dark:text-white mb-3">基本信息</h3>
                               <div className="space-y-3">
                                   <p><strong className="dark:text-white">ID:</strong> {selectedUser.id}</p>
                                   <p><strong className="dark:text-white">姓名:</strong> {selectedUser.name}</p>
                                   <p><strong className="dark:text-white">邮箱:</strong> {selectedUser.email}</p>
                                   <p><strong className="dark:text-white">手机号:</strong> {selectedUser.phone || '未设置'}</p>
                                   <p><strong className="dark:text-white">角色:</strong> {selectedUser.role}</p>
                                   <p><strong className="dark:text-white">状态:</strong> {selectedUser.status}</p>
                                   <p><strong className="dark:text-white">加入时间:</strong> {selectedUser.createdAt}</p>
                                   <p><strong className="dark:text-white">最后登录:</strong> {selectedUser.lastLogin}</p>
                               </div>
                           </div>
                           
                           {/* 个人信息 */}
                           <div>
                               <h3 className="text-lg font-semibold dark:text-white mb-3">个人信息</h3>
                               <div className="space-y-3">
                                   <p><strong className="dark:text-white">性别:</strong> {selectedUser.gender || '未设置'}</p>
                                   <p><strong className="dark:text-white">出生日期:</strong> {selectedUser.birthDate || '未设置'}</p>
                                   <p><strong className="dark:text-white">学历:</strong> {selectedUser.education || '未设置'}</p>
                                   <p><strong className="dark:text-white">专业:</strong> {selectedUser.major || '未设置'}</p>
                                   <p><strong className="dark:text-white">毕业院校:</strong> {selectedUser.school || '未设置'}</p>
                                   <p><strong className="dark:text-white">毕业年份:</strong> {selectedUser.graduationYear || '未设置'}</p>
                               </div>
                           </div>
                           
                           {/* 职业信息 */}
                           <div>
                               <h3 className="text-lg font-semibold dark:text-white mb-3">职业信息</h3>
                               <div className="space-y-3">
                                   <p><strong className="dark:text-white">工作经验:</strong> {selectedUser.workExperienceYears || 0} 年</p>
                                   <p><strong className="dark:text-white">期望职位:</strong> {selectedUser.desiredPosition || '未设置'}</p>
                                   <p><strong className="dark:text-white">技能:</strong> {selectedUser.skills?.length ? selectedUser.skills.join(', ') : '未设置'}</p>
                                   <p><strong className="dark:text-white">语言能力:</strong> {selectedUser.languages?.length ? selectedUser.languages.join(', ') : '未设置'}</p>
                               </div>
                           </div>
                           
                           {/* 联系与社交信息 */}
                           <div>
                               <h3 className="text-lg font-semibold dark:text-white mb-3">联系与社交信息</h3>
                               <div className="space-y-3">
                                   <p><strong className="dark:text-white">地址:</strong> {selectedUser.address || '未设置'}</p>
                                   <p><strong className="dark:text-white">微信号:</strong> {selectedUser.wechat || '未设置'}</p>
                                   <p><strong className="dark:text-white">LinkedIn:</strong> {selectedUser.linkedin || '未设置'}</p>
                                   <p><strong className="dark:text-white">GitHub:</strong> {selectedUser.github || '未设置'}</p>
                                   <p><strong className="dark:text-white">个人网站:</strong> {selectedUser.personalWebsite || '未设置'}</p>
                               </div>
                           </div>
                           
                           {/* 系统信息 */}
                           <div>
                               <h3 className="text-lg font-semibold dark:text-white mb-3">系统信息</h3>
                               <div className="space-y-3">
                                   <p><strong className="dark:text-white">邮箱验证:</strong> {selectedUser.emailVerified ? '已验证' : '未验证'}</p>
                                   <p><strong className="dark:text-white">手机验证:</strong> {selectedUser.phoneVerified ? '已验证' : '未验证'}</p>
                                   <p><strong className="dark:text-white">简历完整度:</strong> {selectedUser.resumeCompleteness || 0}%</p>
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