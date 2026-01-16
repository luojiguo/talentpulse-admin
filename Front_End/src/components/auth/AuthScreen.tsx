import React, { useState } from 'react';
import { message } from 'antd';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import ForgotPasswordForm from './ForgotPasswordForm';
import { SystemUser } from '../../types/types';


interface User extends SystemUser {
    needs_verification?: boolean;
}

interface AuthScreenProps {
    onAuthSuccess: (user: User) => void;
    isModal?: boolean;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess, isModal = false }) => {
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
        <div className={`flex items-center justify-center ${isModal ? '' : 'min-h-screen bg-gradient-to-br from-indigo-100 to-slate-100 p-4'}`}>
            <div className={`w-full bg-white overflow-hidden flex flex-col md:flex-row ${isModal ? '' : 'max-w-4xl rounded-2xl shadow-2xl'}`}>
                {/* 左侧：品牌展示 - 在模态框中隐藏 */}
                {!isModal && (
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
                )}



                {/* 右侧：认证表单 */}
                <div className={`${isModal ? 'w-full' : 'md:w-1/2'} flex items-center justify-center p-6`}>
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

export default AuthScreen;
