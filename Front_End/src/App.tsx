
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntApp, message } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

// 全局设置 dayjs 语言环境
dayjs.locale('zh-cn');

import { AdminApp } from './modules/admin/AdminApp';
import { RecruiterApp } from './modules/recruiter/RecruiterApp';
import CandidateApp from './modules/candidate/CandidateApp';
import { UserRole, SystemUser } from './types/types';
import AuthScreen from './components/auth/AuthScreen';
import EmailBindForm from './components/auth/EmailBindForm';
import { userAPI, companyAPI } from './services/apiService';
import { setGlobalMessage } from './utils/messageInstance';

// 使用系统定义的用户类型
interface User extends SystemUser {
  needs_verification?: boolean; // 添加需要认证的标记
}

// 内部组件,用于访问 App context
const AppContent: React.FC = () => {
  // 获取 App 提供的 message 实例并设置为全局实例
  const { message: messageApi } = AntApp.useApp();

  useEffect(() => {
    // 初始化全局 message 实例
    setGlobalMessage(messageApi);
  }, [messageApi]);
  // 从localStorage初始化用户状态，确保刷新页面时保持登录状态
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const storedUser = localStorage.getItem('currentUser');
      const token = localStorage.getItem('token');

      // 必须同时存在用户数据和token才视为已登录
      if (storedUser && token) {
        const parsedUser = JSON.parse(storedUser);

        // 确保id始终是数字类型
        if (parsedUser.id && typeof parsedUser.id === 'string') {
          parsedUser.id = parseInt(parsedUser.id, 10);
        }

        // 验证角色是否存在
        if (!parsedUser.role) {
          return null;
        }

        return parsedUser;
      }

      // 如果缺少其中一个，清除所有数据以确保状态干净
      if (storedUser || token) {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');
        localStorage.removeItem('user'); // 清理可能的遗留key
      }
    } catch (error) {
      // console.error('Error parsing stored user:', error);
      // 出错时清除所有数据
      localStorage.removeItem('currentUser');
      localStorage.removeItem('token');
    }
    return null;
  });

  // 角色切换模态框状态
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);
  const [switchingRole, setSwitchingRole] = useState<UserRole | null>(null);
  const [companyNameInput, setCompanyNameInput] = useState('');

  // 邮箱绑定状态
  const [needsEmailBind, setNeedsEmailBind] = useState(false);

  // 检查用户是否需要绑定邮箱
  useEffect(() => {
    if (currentUser && !currentUser.email) {
      setNeedsEmailBind(true);
    } else {
      setNeedsEmailBind(false);
    }
  }, [currentUser]);

  // 监听头像更新事件
  useEffect(() => {
    const handleAvatarUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ avatar: string }>;
      if (customEvent.detail && customEvent.detail.avatar && currentUser) {
        setCurrentUser(prev => ({
          ...prev!,
          avatar: customEvent.detail.avatar
        }));
      }
    };

    window.addEventListener('userAvatarUpdated', handleAvatarUpdate);
    return () => {
      window.removeEventListener('userAvatarUpdated', handleAvatarUpdate);
    };
  }, [currentUser]);

  // 根据用户角色动态设置浏览器标题
  useEffect(() => {
    if (currentUser) {
      switch (currentUser.role) {
        case 'admin':
          document.title = '系统管理员';
          break;
        case 'recruiter':
          document.title = '招聘者系统';
          break;
        case 'candidate':
          document.title = '求职者系统';
          break;
        default:
          document.title = 'TalentPulse';
      }
    } else {
      document.title = 'TalentPulse';
    }
  }, [currentUser]);

  // 邮箱绑定成功处理
  const handleEmailBindSuccess = () => {
    // 更新用户信息，添加邮箱已绑定标记
    if (currentUser) {
      const updatedUser = {
        ...currentUser,
        email_verified: true
      };
      setCurrentUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    }
    setNeedsEmailBind(false);
  };



  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser'); // 退出登录时清除localStorage
  };

  // 打开角色切换模态框
  const openSwitchModal = (newRole: UserRole) => {
    setSwitchingRole(newRole);
    setCompanyNameInput('');
    setIsSwitchModalOpen(true);
  };

  // 关闭角色切换模态框
  const closeSwitchModal = () => {
    setIsSwitchModalOpen(false);
    setSwitchingRole(null);
    setCompanyNameInput('');
  };

  // 角色切换确认函数
  const confirmSwitchRole = async () => {
    if (!currentUser || !switchingRole) return;

    try {
      // 调用后端角色切换验证接口
      const data = await userAPI.switchRole({
        userId: Number(currentUser.id),
        newRole: switchingRole,
        companyName: companyNameInput.trim()
      });

      if (data.success) {
        // 切换成功，更新用户信息
        const updatedUser = {
          ...currentUser,
          role: data.data.role,
          roles: data.data.roles || currentUser.roles,
          needs_verification: data.data.needs_verification || false
        };

        // 如果后端返回了新的token，也更新它
        if (data.token) {
          localStorage.setItem('token', data.token);
        }

        // 关键：更新角色
        updatedUser.role = switchingRole;

        // 如果切换到招聘者，可能需要更新company相关信息
        if (switchingRole === 'recruiter' && data.companyId) {
          updatedUser.company_name = companyNameInput.trim();
          // 如果后端返回了companyId等更多信息，也应该保存
        }

        // 保存更新后的用户状态
        // 确保id始终是数字类型
        updatedUser.id = typeof updatedUser.id === 'string' ? parseInt(updatedUser.id, 10) : updatedUser.id;
        setCurrentUser(updatedUser);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        closeSwitchModal();
        message.success('角色切换成功');
        // 角色切换成功后，重定向到正确的首页，去掉/recruiter或/admin前缀
        window.location.href = '/';
      } else {
        // 其他错误，直接显示
        message.error(data.message || '角色切换失败，请重试');
      }
    } catch (error) {
      // console.error('角色切换失败：', error);
      message.error('网络错误，请稍后重试');
    }
  };

  // 角色切换逻辑，添加验证步骤
  const handleSwitchRole = async (newRole: UserRole) => {
    if (!currentUser) return;

    // 如果切换到招聘者角色，先检查用户是否已认证企业
    if (newRole === 'recruiter') {
      try {
        // 调用后端API检查用户是否已认证企业
        const checkData = await companyAPI.getCompanyByUserId(currentUser.id);

        // 如果用户已关联企业且企业已认证，直接切换角色
        if (checkData.success && checkData.data.length > 0) {
          const company = checkData.data[0];
          if (company.is_verified) {
            // 已认证，直接调用后端切换角色, 不使用模态框
            try {
              // 直接调用后端角色切换验证接口
              const data = await userAPI.switchRole({
                userId: Number(currentUser.id),
                newRole: newRole,
                companyName: '' // 已认证企业，无需企业名称
              });

              if (data.success) {
                // 切换成功，更新用户信息
                const updatedUser = {
                  ...currentUser,
                  role: data.data.role,
                  roles: data.data.roles || currentUser.roles,
                  needs_verification: data.data.needs_verification || false
                };
                // 确保id始终是数字类型
                updatedUser.id = typeof updatedUser.id === 'string' ? parseInt(updatedUser.id, 10) : updatedUser.id;
                setCurrentUser(updatedUser);
                localStorage.setItem('currentUser', JSON.stringify(updatedUser));
                message.success('角色切换成功');
                // 角色切换成功后，重定向到正确的首页，去掉/recruiter或/admin前缀
                window.location.href = '/';
              } else {
                // 其他错误，直接显示
                message.error(data.message || '角色切换失败，请重试');
              }
            } catch (error) {
              // console.error('角色切换失败：', error);
              message.error('网络错误，请稍后重试');
            }
            return;
          }
        }

        // 未认证或未关联企业，打开模态框
        openSwitchModal(newRole);
      } catch (error) {
        // console.error('检查企业认证状态失败：', error);
        // 检查失败时，打开模态框
        openSwitchModal(newRole);
      }
    } else {
      // 其他角色直接切换
      // 直接调用后端角色切换验证接口
      try {
        // 直接调用后端角色切换验证接口
        const data = await userAPI.switchRole({
          userId: Number(currentUser.id),
          newRole: newRole,
          companyName: ''
        });

        if (data.status === 'success') {
          // 切换成功，更新用户信息
          const updatedUser = {
            ...currentUser,
            role: data.data.role,
            roles: data.data.roles || currentUser.roles,
            needs_verification: data.data.needs_verification || false
          };
          // 确保id始终是数字类型
          updatedUser.id = typeof updatedUser.id === 'string' ? parseInt(updatedUser.id, 10) : updatedUser.id;
          setCurrentUser(updatedUser);
          localStorage.setItem('currentUser', JSON.stringify(updatedUser));
          message.success('角色切换成功');
          // 角色切换成功后，重定向到正确的首页，去掉/recruiter或/admin前缀
          window.location.href = '/';
        } else {
          // 其他错误，直接显示
          message.error(data.message || '角色切换失败，请重试');
        }
      } catch (error) {
        // console.error('角色切换失败：', error);
        message.error('网络错误，请稍后重试');
      }
    }
  };

  const handleAuthSuccess = (user: User) => {
    // 确保id始终是数字类型
    const normalizedUser = {
      ...user,
      id: typeof user.id === 'string' ? parseInt(user.id, 10) : user.id
    };
    setCurrentUser(normalizedUser);
    localStorage.setItem('currentUser', JSON.stringify(normalizedUser)); // 登录成功时保存到localStorage
  };

  const handleUpdateUser = (updates: Partial<User> | User) => {
    setCurrentUser(prev => {
      if (!prev) return null;

      const updated = { ...prev, ...updates };
      // 确保id始终是数字类型
      updated.id = typeof updated.id === 'string' ? parseInt(updated.id, 10) : updated.id;

      localStorage.setItem('currentUser', JSON.stringify(updated));
      return updated;
    });
  };

  // 下拉菜单状态
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorSuccess: '#007AFF',
        },
      }}
    >
      <AntApp>
        <BrowserRouter>
          <Routes>

            {/* 登录注册页 */}
            <Route path="/login" element={
              currentUser ? <Navigate to="/" replace /> : <AuthScreen onAuthSuccess={handleAuthSuccess} />
            } />

            {/* 招聘者路由 (Authenticated) */}
            {currentUser?.role === 'recruiter' && (
              <>
                <Route path="/recruiter/*" element={<RecruiterApp onLogout={handleLogout} onSwitchRole={openSwitchModal} currentUser={currentUser} />} />
                <Route path="/*" element={<RecruiterApp onLogout={handleLogout} onSwitchRole={openSwitchModal} currentUser={currentUser} />} />
              </>
            )}

            {/* 管理员路由 (Authenticated) */}
            {currentUser?.role === 'admin' && (
              <>
                <Route path="/admin/*" element={<AdminApp currentUser={currentUser} onLogout={handleLogout} />} />
                <Route path="/*" element={<AdminApp currentUser={currentUser} onLogout={handleLogout} />} />
              </>
            )}

            {/* 求职者/游客路由 (Default) */}
            {(!currentUser || currentUser.role === 'candidate') && (
              <Route path="/*" element={
                <CandidateApp
                  currentUser={currentUser!} // CandidateApp internal logic will handle null
                  onLogout={handleLogout}
                  onSwitchRole={openSwitchModal}
                  onUpdateUser={handleUpdateUser}
                  onLogin={handleAuthSuccess}
                />
              } />
            )}
          </Routes>

          {/* 角色切换模态框 */}
          {isSwitchModalOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl animate-in fade-in zoom-in-95">
                <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">切换角色</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      您正在切换到 {switchingRole === 'recruiter' ? '招聘方' : '求职者'} 身份
                    </p>
                  </div>
                  <button onClick={closeSwitchModal} className="text-gray-400 hover:text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {switchingRole === 'recruiter' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        企业名称（认证用）
                      </label>
                      <input
                        type="text"
                        value={companyNameInput}
                        onChange={(e) => setCompanyNameInput(e.target.value)}
                        placeholder="请输入您所在的企业名称"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        请确保输入的企业名称与您的账号关联的企业一致
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    onClick={closeSwitchModal}
                    className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-gray-50 transition"
                  >
                    取消
                  </button>
                  <button
                    onClick={confirmSwitchRole}
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
                  >
                    确认切换
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 邮箱绑定模态框 */}
          {needsEmailBind && (
            <EmailBindForm onBindSuccess={handleEmailBindSuccess} />
          )}
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  );
};

// 主 App 组件
const App: React.FC = () => {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorSuccess: '#007AFF',
        },
      }}
    >
      <AntApp>
        <AppContent />
      </AntApp>
    </ConfigProvider>
  );
};

export default App;
