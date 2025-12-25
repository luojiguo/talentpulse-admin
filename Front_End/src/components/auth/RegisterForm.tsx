import React, { useState } from 'react';
import { UserPlus, User, Mail, Phone, Lock, Shield, Briefcase, User as UserIcon } from 'lucide-react';
import { message } from 'antd';
import { UserRole } from '@/types/types';

interface RegisterFormProps {
  onRegisterSuccess: (user: any) => void;
  onSwitchToLogin: () => void;
}

interface FormErrors {
  name?: string;
  identifier?: string;
  password?: string;
  confirmPassword?: string;
  role?: string;
  general?: string;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onRegisterSuccess, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    identifier: '',
    password: '',
    confirmPassword: '',
    role: 'candidate' as UserRole,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 清除对应字段的错误信息
  const clearFieldError = (fieldName: keyof FormErrors) => {
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  // 输入变化时清除对应字段的错误
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    clearFieldError(name as keyof FormErrors);
  };

  // 前端字段验证
  const validateField = (fieldName: string, value: string) => {
    let error = '';
    
    switch (fieldName) {
      case 'name':
        if (!value.trim()) {
          error = '姓名不能为空';
        } else if (value.length < 2) {
          error = '姓名长度不能少于2个字符';
        } else if (value.length > 50) {
          error = '姓名长度不能超过50个字符';
        }
        break;
      
      case 'identifier':
        if (!value) {
          error = '请输入邮箱或手机号';
        } else {
          // 重点验证邮箱格式，如果不是邮箱再验证手机号格式
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          const phoneRegex = /^1\d{10}$/;
          
          if (emailRegex.test(value)) {
            // 是邮箱格式，验证通过
          } else if (phoneRegex.test(value)) {
            // 是手机号格式，验证通过
          } else {
            // 既不是邮箱也不是手机号格式
            error = '请输入有效的邮箱或手机号';
          }
        }
        break;
      
      case 'password':
        if (!value) {
          error = '密码不能为空';
        } else if (value.length < 8) {
          error = '密码长度不能少于8位';
        } else if (!/[a-zA-Z]/.test(value)) {
          error = '密码必须包含字母';
        } else if (!/\d/.test(value)) {
          error = '密码必须包含数字';
        }
        break;
      
      case 'role':
        // 由于role默认有值且没有空选项，无需验证空值
        break;
    }
    
    return error;
  };

  // 表单验证
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    // 姓名验证
    const nameError = validateField('name', formData.name);
    if (nameError) newErrors.name = nameError;
    
    // 标识符验证（邮箱或手机号）
    const identifierError = validateField('identifier', formData.identifier);
    if (identifierError) newErrors.identifier = identifierError;
    
    // 密码验证
    const passwordError = validateField('password', formData.password);
    if (passwordError) newErrors.password = passwordError;
    
    // 确认密码验证
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '请确认密码';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致';
    }
    
    // 身份类型验证
    const roleError = validateField('role', formData.role);
    if (roleError) newErrors.role = roleError;
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 处理后端错误
  const handleBackendErrors = (errorData: any) => {
    const newErrors: FormErrors = {};
    
    // 根据errorCode处理不同的错误
    switch (errorData.errorCode) {
      case 'EMAIL_EXISTS':
      case 'PHONE_EXISTS':
        // 邮箱或手机号已存在，显示全局提示
        newErrors.general = '该账号已被注册';
        break;
      case 'EMAIL_OR_PHONE_REQUIRED':
        newErrors.identifier = '请输入邮箱或手机号';
        break;
      case 'VALIDATION_ERROR':
        // 处理具体的验证错误
        if (errorData.errors && Array.isArray(errorData.errors)) {
          errorData.errors.forEach((error: string) => {
            if (error.includes('name')) {
              newErrors.name = error;
            } else if (error.includes('email')) {
              newErrors.identifier = error;
            } else if (error.includes('phone')) {
              newErrors.identifier = error;
            } else if (error.includes('password')) {
              newErrors.password = error;
            } else if (error.includes('userType')) {
              newErrors.role = error;
            } else {
              // 未匹配到具体字段的错误，显示为通用错误
              newErrors.general = error;
            }
          });
        }
        break;
      default:
        // 其他错误显示为通用错误
        newErrors.general = errorData.message || '注册失败，请稍后重试';
    }
    
    setErrors(newErrors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    // 前端验证
    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    try {
      // 移除确认密码字段
      const { confirmPassword, ...registerData } = formData;
      const identifier = formData.identifier;
      
      // 解析identifier为email或phone，确保至少有一个非空
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^1\d{10}$/;
      
      let email = '';
      let phone = '';
      
      if (emailRegex.test(identifier)) {
        email = identifier;
      } else if (phoneRegex.test(identifier)) {
        phone = identifier;
      }
      
      // 准备发送给后端的数据
      const requestData = {
        ...registerData,
        email,
        phone,
        userType: registerData.role // 后端期望的字段名是userType，而不是role
      };
      
      const response = await fetch('/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (response.ok) {
        onRegisterSuccess(data.data);
      } else {
        handleBackendErrors(data);
        // 显示全局错误提示
        message.error(data.message || '注册失败，请稍后重试');
      }
    } catch (err: any) {
      const errorMsg = '网络错误，请稍后重试';
      setErrors({ general: errorMsg });
      // 显示全局错误提示
      message.error(errorMsg);
      console.error('Register error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
          <UserPlus className="w-8 h-8 text-indigo-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">注册 TalentPulse</h2>
        <p className="text-sm text-slate-500 mt-2">创建您的账号，开始使用 TalentPulse</p>
      </div>

      {/* 全局错误 */}
      {errors.general && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            姓名
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="请输入您的姓名"
              className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${errors.name ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-indigo-500'}`}
              required
            />
          </div>
          {errors.name && (
            <p className="text-red-500 text-xs mt-1">{errors.name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            邮箱/手机号 <span className="text-slate-400 text-xs">(用于接收验证信息，重点推荐使用邮箱)</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              name="identifier"
              value={formData.identifier}
              onChange={handleChange}
              placeholder="请输入您的邮箱（如：user@example.com）或手机号（如：13800138000）"
              className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all ${errors.identifier ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-indigo-500'}`}
              required
            />
          </div>
          {errors.identifier && (
            <p className="text-red-500 text-xs mt-1">{errors.identifier}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            密码
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="请输入密码（至少8位，包含字母和数字）"
              className={`w-full pl-10 pr-12 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${errors.password ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-indigo-500'}`}
              required
              minLength={8}
            />
            {/* 显示/隐藏密码按钮 */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
              aria-label={showPassword ? '隐藏密码' : '显示密码'}
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-500 text-xs mt-1">{errors.password}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            确认密码
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="请再次输入密码"
              className={`w-full pl-10 pr-12 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${errors.confirmPassword ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-indigo-500'}`}
              required
              minLength={8}
            />
            {/* 显示/隐藏确认密码按钮 */}
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
              aria-label={showConfirmPassword ? '隐藏密码' : '显示密码'}
            >
              {showConfirmPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            身份类型
          </label>
          <div className="relative">
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all appearance-none bg-white ${errors.role ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-indigo-500'}`}
            >
              <option value="candidate">求职者</option>
              <option value="recruiter">招聘方</option>
            </select>
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          {errors.role && (
            <p className="text-red-500 text-xs mt-1">{errors.role}</p>
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
              注册中...
            </div>
          ) : (
            '注册'
          )}
        </button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-sm text-slate-600">
          已有账号？
          <button
            onClick={onSwitchToLogin}
            className="text-indigo-600 font-medium hover:text-indigo-800 transition-colors ml-1"
          >
            立即登录
          </button>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm;
