import React, { useState } from 'react';
import { LogIn, Mail, Phone, Lock, Eye, EyeOff, User, Briefcase, Shield, Building2 } from 'lucide-react';
import { message } from 'antd';
import { UserRole } from '@/types/types';
import { userAPI } from '@/services/apiService';

interface LoginFormProps {
  onLoginSuccess: (user: any) => void;
  onSwitchToRegister: () => void;
  onForgotPassword: (identifier?: string) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess, onSwitchToRegister, onForgotPassword }) => {
  // 从localStorage加载记住的账号密码
  const loadRememberedCredentials = () => {
    const remembered = localStorage.getItem('rememberedCredentials');
    if (remembered) {
      try {
        return JSON.parse(remembered);
      } catch (error) {
        console.error('Failed to parse remembered credentials:', error);
        return null;
      }
    }
    return null;
  };

  // 获取当前端口
  const getCurrentPort = () => {
    return window.location.port || (window.location.protocol === 'https:' ? '443' : '80');
  };

  const rememberedCredentials = loadRememberedCredentials();
  const [identifier, setIdentifier] = useState(rememberedCredentials?.identifier || '');
  const [password, setPassword] = useState(rememberedCredentials?.password || '');
  // 根据端口设置默认角色
  const currentPort = getCurrentPort();
  const isAdminPort = currentPort === '3100';
  // 如果是管理员端口，默认角色为admin，否则为candidate
  const defaultUserType = isAdminPort ? 'admin' : 'candidate';
  const [userType, setUserType] = useState<UserRole>(rememberedCredentials?.userType || defaultUserType);
  const [companyName, setCompanyName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(!!rememberedCredentials);
  const [showPassword, setShowPassword] = useState(false);

  // 处理标识符输入变化
  const handleIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setIdentifier(value);
    // 移除实时验证，只在登录时验证
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // 1. 验证账号格式
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^1\d{10}$/;

      // 对于求职者和招聘方，只允许邮箱或手机号
      if (userType === 'candidate' || userType === 'recruiter') {
        if (!emailRegex.test(identifier) && !phoneRegex.test(identifier)) {
          setError('请输入有效的邮箱或手机号');
          setIsLoading(false);
          return;
        }
      }

      // 2. 调用登录API
      const loginData = {
        identifier,
        password,
        userType
      };

      // 使用apiService中的login方法
      const data = await userAPI.login(loginData);

      if (data.success) {
        // 登录成功
        // 保存记住的凭证
        if (rememberMe) {
          localStorage.setItem('rememberedCredentials', JSON.stringify({
            identifier,
            password,
            userType
          }));
        } else {
          localStorage.removeItem('rememberedCredentials');
        }
        onLoginSuccess(data.data);
      } else {
        // 登录失败，根据错误信息分类处理
        let errorMsg = data.message || '登录失败，请稍后重试';

        // 分类错误信息 - 优先使用errorCode
        if (data.errorCode === 'USER_NOT_FOUND') {
          errorMsg = '该账号未注册，请先注册';
        } else if (data.errorCode === 'INVALID_PASSWORD') {
          errorMsg = '密码错误，请重新输入';
        } else if (data.errorCode === 'INSUFFICIENT_PERMISSIONS') {
          errorMsg = '您没有权限登录该账号';
        } else if (errorMsg.includes('未注册') || errorMsg.includes('不存在') || errorMsg.includes('not found')) {
          errorMsg = '该账号未注册，请先注册';
        } else if (errorMsg.includes('密码') || errorMsg.includes('password')) {
          errorMsg = '密码错误，请重新输入';
        } else if (errorMsg.includes('权限') || errorMsg.includes('permission')) {
          errorMsg = '您没有权限登录该账号';
        }

        setError(errorMsg);
      }
    } catch (err: any) {
      // 捕获网络错误或其他异常
      let errorMsg = '网络错误，请稍后重试';
      if (err.response) {
        // 服务器返回了错误响应
        const status = err.response.status;
        const responseData = err.response.data;

        if (status === 401) {
          // 401通常表示未授权，可能是账号不存在或密码错误
          // 精确识别错误：优先使用errorCode，其次检查错误消息
          if (responseData?.errorCode === 'INVALID_PASSWORD') {
            errorMsg = '密码错误，请重新输入';
          } else if (responseData?.errorCode === 'USER_NOT_FOUND') {
            errorMsg = '该账号未注册，请先注册';
          } else if (responseData?.message?.includes('密码')) {
            errorMsg = '密码错误，请重新输入';
          } else if (responseData?.message?.includes('不存在') || responseData?.message?.includes('not found')) {
            errorMsg = '该账号未注册，请先注册';
          } else {
            errorMsg = '登录失败，请检查您的用户名和密码';
          }
        } else if (status === 403) {
          errorMsg = '您没有权限登录该账号';
        } else if (status >= 500) {
          errorMsg = '服务器内部错误，请稍后重试';
        } else {
          errorMsg = responseData?.message || '登录失败，请稍后重试';
        }
      } else if (err.request) {
        // 请求已发出但没有收到响应
        errorMsg = '服务器无响应，请检查网络连接';
      } else {
        // 请求配置出错
        errorMsg = err.message || '登录失败，请稍后重试';
      }
      setError(errorMsg);
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
          <LogIn className="w-8 h-8 text-indigo-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">登录 TalentPulse</h2>
        <p className="text-sm text-slate-500 mt-2">
          {userType === 'admin' ? '请使用您的用户名、邮箱或手机号登录' : '请使用您的邮箱或手机号登录'}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 用户类型选择 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">选择登录身份</label>
          <div className="grid grid-cols-3 gap-3">
            {/* 管理员端口只显示管理员选项 */}
            {isAdminPort ? (
              <button
                type="button"
                onClick={() => setUserType('admin')}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${userType === 'admin' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300'}`}
              >
                <Shield className={`w-6 h-6 mb-2 ${userType === 'admin' ? 'text-indigo-500' : 'text-slate-400'}`} />
                <span className="text-xs font-medium">管理员</span>
              </button>
            ) : (
              // 用户端口显示求职者和招聘方选项
              <>
                <button
                  type="button"
                  onClick={() => setUserType('candidate')}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${userType === 'candidate' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300'}`}
                >
                  <User className={`w-6 h-6 mb-2 ${userType === 'candidate' ? 'text-blue-500' : 'text-slate-400'}`} />
                  <span className="text-xs font-medium">求职者</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUserType('recruiter')}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${userType === 'recruiter' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-emerald-300'}`}
                >
                  <Briefcase className={`w-6 h-6 mb-2 ${userType === 'recruiter' ? 'text-emerald-500' : 'text-slate-400'}`} />
                  <span className="text-xs font-medium">招聘方</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* 邮箱或手机号 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            邮箱或手机号
          </label>
          <div className="relative">
            {/* 固定宽度的图标容器，确保切换图标时不会导致跳动 */}
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 flex items-center justify-center">
              {identifier.includes('@') ? (
                <Mail className="w-5 h-5" />
              ) : (
                <Phone className="w-5 h-5" />
              )}
            </div>
            <input
              type="text"
              value={identifier}
              onChange={handleIdentifierChange}
              placeholder={userType === 'admin' ? '请输入用户名、邮箱或手机号' : '请输入邮箱或手机号'}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              required
            />
          </div>
        </div>

        {/* 密码 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            密码
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              className="w-full pl-10 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
              aria-label={showPassword ? '隐藏密码' : '显示密码'}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* 记住我和忘记密码 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-700">
              记住账号密码
            </label>
          </div>
          {/* 管理员不显示忘记密码 */}
          {userType !== 'admin' && (
            <div>
              <button
                type="button"
                onClick={() => onForgotPassword(identifier)}
                className="text-sm text-indigo-600 font-medium hover:text-indigo-800 transition-colors"
              >
                忘记密码？
              </button>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-3 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              登录中...
            </div>
          ) : (
            '登录'
          )}
        </button>
      </form>

      {/* 管理员不显示注册链接 */}
      {userType !== 'admin' && (
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-600">
            还没有账号？
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-indigo-600 font-medium hover:text-indigo-800 transition-colors ml-1"
            >
              立即注册
            </button>
          </p>
        </div>
      )}
    </div>
  );
};

export default LoginForm;
