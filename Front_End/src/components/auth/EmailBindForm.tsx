import React, { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { message } from 'antd';
import { userAPI } from '@/services/apiService';

interface EmailBindFormProps {
  onBindSuccess: () => void;
}

const EmailBindForm: React.FC<EmailBindFormProps> = ({ onBindSuccess }) => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);

  // 倒计时逻辑
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 发送验证码
  const handleSendCode = async () => {
    if (!email) {
      setError('请输入邮箱地址');
      return;
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('请输入有效的邮箱地址');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await userAPI.sendEmailBindCode(email);
      if (response.success) {
        message.success('验证码发送成功，请注意查收');
        setCountdown(60); // 60秒倒计时
      } else {
        setError(response.message || '发送验证码失败');
        message.error(response.message || '发送验证码失败');
      }
    } catch (err: any) {
      let errorMsg = '网络错误，请稍后重试';
      if (err.response) {
        errorMsg = err.response.data?.message || '发送验证码失败';
      }
      setError(errorMsg);
      message.error(errorMsg);
      console.error('Send email bind code error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 绑定邮箱
  const handleBindEmail = async () => {
    if (!email) {
      setError('请输入邮箱地址');
      return;
    }

    if (!code) {
      setError('请输入验证码');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await userAPI.bindEmail(email, code);
      if (response.success) {
        message.success('邮箱绑定成功');
        onBindSuccess();
      } else {
        setError(response.message || '邮箱绑定失败');
        message.error(response.message || '邮箱绑定失败');
      }
    } catch (err: any) {
      let errorMsg = '网络错误，请稍后重试';
      if (err.response) {
        errorMsg = err.response.data?.message || '邮箱绑定失败';
      }
      setError(errorMsg);
      message.error(errorMsg);
      console.error('Bind email error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl animate-in fade-in zoom-in-95">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900">绑定邮箱</h2>
          <p className="text-sm text-slate-500 mt-1">
            请绑定您的邮箱，以便使用完整功能
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* 邮箱输入 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              邮箱地址
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="请输入您的邮箱地址"
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                required
              />
            </div>
          </div>

          {/* 验证码输入 */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-slate-700">
                验证码
              </label>
              <button
                onClick={handleSendCode}
                disabled={countdown > 0 || isLoading}
                className={`text-sm text-indigo-600 font-medium hover:text-indigo-800 transition-colors ${countdown > 0 || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {countdown > 0 ? `${countdown}秒后重新发送` : '发送验证码'}
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="请输入6位验证码"
                maxLength={6}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                required
              />
            </div>
          </div>

          {/* 绑定按钮 */}
          <button
            onClick={handleBindEmail}
            disabled={isLoading}
            className={`w-full py-3 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                绑定中...
              </div>
            ) : (
              '绑定邮箱'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailBindForm;