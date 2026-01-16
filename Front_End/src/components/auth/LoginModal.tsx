import React from 'react';
import { Modal } from 'antd';
import AuthScreen from './AuthScreen';
import { SystemUser } from '../../types/types';

interface User extends SystemUser {
    needs_verification?: boolean;
}

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLoginSuccess: (user: User) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
    const handleAuthSuccess = (user: User) => {
        onLoginSuccess(user);
        onClose();
    };

    return (
        <Modal
            open={isOpen}
            onCancel={onClose}
            footer={null}
            destroyOnHidden
            centered
            width={480}
            maskClosable={false}
            title={<div className="text-center font-bold text-lg mb-2">登录 / 注册</div>}
        >
            <AuthScreen onAuthSuccess={handleAuthSuccess} isModal={true} />
        </Modal>
    );
};

export default LoginModal;
