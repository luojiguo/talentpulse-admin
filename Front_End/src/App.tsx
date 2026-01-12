
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider, message } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

// Set dayjs locale globally
dayjs.locale('zh-cn');

import { AdminApp } from './modules/admin/AdminApp';
import { RecruiterApp } from './modules/recruiter/RecruiterApp';
import CandidateApp from './modules/candidate/CandidateApp';
import { UserRole, SystemUser } from './types/types';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import ForgotPasswordForm from './components/auth/ForgotPasswordForm';
import EmailBindForm from './components/auth/EmailBindForm';
import { userAPI, companyAPI } from './services/apiService';

// 使用系统定义的用户类型
interface User extends SystemUser {
  needs_verification?: boolean; // 添加需要认证的标记
}

const AuthScreen: React.FC<{ onAuthSuccess: (user: User) => void }> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [initialIdentifier, setInitialIdentifier] = useState('');

  const handleLoginSuccess = (user: any) => {
    onAuthSuccess(user as User);
  };

  const handleRegisterSuccess = () => {
    // 注册成功后，显示成功消息并切换到登录表单
    message.success('注册成功，请使用新账号登录');
    setIsLogin(true);
  };

  const handleBackToLogin = () => {
    setIsForgotPassword(false);
    setIsLogin(true);
  };

  const handleResetSuccess = () => {
    message.success('密码重置成功，请使用新密码登录');
    setIsForgotPassword(false);
    setIsLogin(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 to-slate-100 p-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
        {/* Left Side: Brand */}
        <div className="md:w-1/2 bg-indigo-900 text-white p-10 flex flex-col justify-center">
          <h1 className="text-4xl font-extrabold mb-4">TalentPulse</h1>
          <p className="text-indigo-200 text-lg mb-8">下一代智能招聘与求职管理平台。</p>
          <ul className="space-y-4 text-sm text-indigo-100">
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-indigo-400 rounded-full" />
              AI 驱动的简历匹配
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-indigo-400 rounded-full" />
              实时数据分析看板
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-indigo-400 rounded-full" />
              全流程在线沟通
            </li>
          </ul>
        </div>

        {/* Right Side: Auth Forms */}
        <div className="md:w-1/2 flex items-center justify-center p-6">
          {isForgotPassword ? (
            <ForgotPasswordForm
              onBackToLogin={handleBackToLogin}
              onResetSuccess={handleResetSuccess}
              initialIdentifier={initialIdentifier}
            />
          ) : isLogin ? (
            <LoginForm
              onLoginSuccess={handleLoginSuccess}
              onSwitchToRegister={() => setIsLogin(false)}
              onForgotPassword={(identifier) => {
                setInitialIdentifier(identifier || '');
                setIsForgotPassword(true);
              }}
            />
          ) : (
            <RegisterForm
              onRegisterSuccess={handleRegisterSuccess}
              onSwitchToLogin={() => setIsLogin(true)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  // 从localStorage初始化用户状态，确保刷新页面时保持登录状态
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const storedUser = localStorage.getItem('currentUser');
      const token = localStorage.getItem('token');

      // Must have both user and token to be considered logged in
      if (storedUser && token) {
        const parsedUser = JSON.parse(storedUser);

        // 确保id始终是数字类型
        if (parsedUser.id && typeof parsedUser.id === 'string') {
          parsedUser.id = parseInt(parsedUser.id, 10);
        }

        // Validate role exists
        if (!parsedUser.role) {
          return null;
        }

        return parsedUser;
      }

      // If one is missing, clear both to ensure clean state
      if (storedUser || token) {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');
        localStorage.removeItem('user'); // Clean up potential legacy key
      }
    } catch (error) {
      console.error('Error parsing stored user:', error);
      // On error, clear everything
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
      console.error('角色切换失败：', error);
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
            // 已认证，直接调用后端切换角色，不使用模态框
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
              console.error('角色切换失败：', error);
              message.error('网络错误，请稍后重试');
            }
            return;
          }
        }

        // 未认证或未关联企业，打开模态框
        openSwitchModal(newRole);
      } catch (error) {
        console.error('检查企业认证状态失败：', error);
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
        console.error('角色切换失败：', error);
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

  // Dropdown menu state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <ConfigProvider locale={zhCN}>
      <BrowserRouter>
        <Routes>
          {/* 公共路由 */}
          {!currentUser ? (
            <Route path="/*" element={<AuthScreen onAuthSuccess={handleAuthSuccess} />} />
          ) : (
            // 登录后的路由
            <>
              {/* 求职者路由 */}
              {currentUser.role === 'candidate' && (
                <Route path="/*" element={<CandidateApp currentUser={currentUser} onLogout={handleLogout} onSwitchRole={handleSwitchRole} onUpdateUser={handleUpdateUser} />} />
              )}

              {/* 招聘者路由 */}
              {currentUser.role === 'recruiter' && (
                <>
                  <Route path="/recruiter/*" element={<RecruiterApp onLogout={handleLogout} onSwitchRole={handleSwitchRole} currentUser={currentUser} />} />
                  <Route path="/*" element={<RecruiterApp onLogout={handleLogout} onSwitchRole={handleSwitchRole} currentUser={currentUser} />} />
                </>
              )}

              {/* 管理员路由 */}
              {currentUser.role === 'admin' && (
                <>
                  <Route path="/admin/*" element={<AdminApp currentUser={currentUser} onLogout={handleLogout} />} />
                  <Route path="/*" element={<AdminApp currentUser={currentUser} onLogout={handleLogout} />} />
                </>
              )}
            </>
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
    </ConfigProvider>
  );
};

export default App;
