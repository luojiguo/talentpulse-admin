import React, { useState } from 'react';
import { LogIn, Mail, Phone, Lock, User, Briefcase, Shield, Building2 } from 'lucide-react';
import { UserRole } from '@/types/types';
import { userAPI } from '@/services/apiService';

interface LoginFormProps {
  onLoginSuccess: (user: any) => void;
  onSwitchToRegister: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess, onSwitchToRegister }) => {
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

  const rememberedCredentials = loadRememberedCredentials();
  const [identifier, setIdentifier] = useState(rememberedCredentials?.identifier || '');
  const [password, setPassword] = useState(rememberedCredentials?.password || '');
  const [userType, setUserType] = useState<UserRole>(rememberedCredentials?.userType || 'candidate');
  const [companyName, setCompanyName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(!!rememberedCredentials);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const loginData = {
        identifier,
        password,
        userType
      };

      // 使用apiService中的login方法
      const data = await userAPI.login(loginData);

      if (data.status === 'success') {
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
        setError(data.message || '登录失败，请检查您的用户名和密码');
      }
    } catch (err: any) {
      setError(err.message || '网络错误，请稍后重试');
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
        <p className="text-sm text-slate-500 mt-2">请使用您的邮箱或手机号登录</p>
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
            <button
              type="button"
              onClick={() => setUserType('admin')}
              className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${userType === 'admin' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300'}`}
            >
              <Shield className={`w-6 h-6 mb-2 ${userType === 'admin' ? 'text-indigo-500' : 'text-slate-400'}`} />
              <span className="text-xs font-medium">管理员</span>
            </button>
          </div>
        </div>

        {/* 邮箱或手机号 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            邮箱或手机号
          </label>
          <div className="relative">
            {identifier.includes('@') ? (
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            ) : (
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            )}
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="请输入邮箱或手机号"
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
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              required
            />
          </div>
        </div>

        {/* 记住我 */}
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

      <div className="mt-8 text-center">
        <p className="text-sm text-slate-600">
          还没有账号？
          <button
            onClick={onSwitchToRegister}
            className="text-indigo-600 font-medium hover:text-indigo-800 transition-colors ml-1"
          >
            立即注册
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
