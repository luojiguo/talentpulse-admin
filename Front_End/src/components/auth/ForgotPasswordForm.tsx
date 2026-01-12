import React, { useState, useEffect } from 'react';
import { Mail, Phone, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { message } from 'antd';
import { userAPI } from '@/services/apiService';

interface ForgotPasswordFormProps {
  onBackToLogin: () => void;
  onResetSuccess: () => void;
  initialIdentifier?: string;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onBackToLogin, onResetSuccess, initialIdentifier = '' }) => {
  // 步骤状态：1-输入邮箱/手机号，2-验证验证码，3-重置密码
  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [resetToken, setResetToken] = useState('');

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
    if (!identifier) {
      setError('请输入邮箱或手机号');
      return;
    }

    // 验证邮箱或手机号格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^1\d{10}$/;
    if (!emailRegex.test(identifier) && !phoneRegex.test(identifier)) {
      setError('请输入有效的邮箱或手机号');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await userAPI.sendVerificationCodeForReset(identifier);
      if (response.success) {
        message.success('验证码发送成功，请注意查收');
        setCountdown(60); // 60秒倒计时
        setStep(2); // 进入验证步骤
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
      console.error('Send verification code error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 验证验证码
  const handleVerifyCode = async () => {
    if (!code) {
      setError('请输入验证码');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await userAPI.verifyCode(identifier, code);
      if (response.success) {
        message.success('验证码验证成功');
        setResetToken(response.data.resetToken);
        setStep(3); // 进入重置密码步骤
      } else {
        setError(response.message || '验证码验证失败');
        message.error(response.message || '验证码验证失败');
      }
    } catch (err: any) {
      let errorMsg = '网络错误，请稍后重试';
      if (err.response) {
        errorMsg = err.response.data?.message || '验证码验证失败';
      }
      setError(errorMsg);
      message.error(errorMsg);
      console.error('Verify code error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 重置密码
  const handleResetPassword = async () => {
    if (!newPassword) {
      setError('请输入新密码');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    // 密码强度验证
    if (newPassword.length < 6) {
      setError('密码长度不能少于6位');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await userAPI.resetPassword(resetToken, newPassword);
      if (response.success) {
        message.success('密码重置成功');
        onResetSuccess();
      } else {
        setError(response.message || '密码重置失败');
        message.error(response.message || '密码重置失败');
      }
    } catch (err: any) {
      let errorMsg = '网络错误，请稍后重试';
      if (err.response) {
        errorMsg = err.response.data?.message || '密码重置失败';
      }
      setError(errorMsg);
      message.error(errorMsg);
      console.error('Reset password error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 返回上一步
  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setError('');
    } else {
      onBackToLogin();
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg">
      {/* 标题和返回按钮 */}
      <div className="flex items-center mb-8">
        <button
          onClick={handleBack}
          className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors mr-4"
          aria-label="返回"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">找回密码</h2>
          <p className="text-sm text-slate-500 mt-1">
            {step === 1 && '请输入您的邮箱或手机号'}
            {step === 2 && '请输入验证码'}
            {step === 3 && '请设置新密码'}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* 步骤1：输入邮箱/手机号 */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              邮箱或手机号
            </label>
            <div className="relative">
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
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="请输入邮箱或手机号"
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                required
              />
            </div>
          </div>

          <button
            onClick={handleSendCode}
            disabled={isLoading}
            className={`w-full py-3 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                发送中...
              </div>
            ) : (
              '发送验证码'
            )}
          </button>
        </div>
      )}

      {/* 步骤2：验证验证码 */}
      {step === 2 && (
        <div className="space-y-6">
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
                {countdown > 0 ? `${countdown}秒后重新发送` : '重新发送'}
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="请输入6位验证码"
                maxLength={6}
                className="w-full pl-4 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                required
              />
            </div>
          </div>

          <button
            onClick={handleVerifyCode}
            disabled={isLoading}
            className={`w-full py-3 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                验证中...
              </div>
            ) : (
              '验证验证码'
            )}
          </button>
        </div>
      )}

      {/* 步骤3：重置密码 */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              新密码
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="请输入新密码"
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

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              确认密码
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="请再次输入新密码"
                className="w-full pl-10 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                required
              />
            </div>
          </div>

          <button
            onClick={handleResetPassword}
            disabled={isLoading}
            className={`w-full py-3 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                重置中...
              </div>
            ) : (
              '重置密码'
            )}
          </button>
        </div>
      )}

      <div className="mt-8 text-center">
        <button
          onClick={onBackToLogin}
          className="text-sm text-slate-600 hover:text-slate-800 transition-colors"
        >
          回到登录
        </button>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;