import React, { useState } from 'react';
import { Upload, message } from 'antd';
import type { UploadProps } from 'antd';
import { UploadOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar } from 'antd';

// 头像上传组件 - 可复用的头像上传功能
interface AvatarUploadComponentProps {
  avatarPath: string; // 当前头像路径
  onAvatarUpdate?: (newAvatarPath: string) => void; // 头像更新回调
  size?: number; // 头像大小
  defaultAvatar?: string; // 默认头像
  userId?: string | number; // 用户ID，用于API请求
}

const AvatarUploadComponent: React.FC<AvatarUploadComponentProps> = ({
  avatarPath,
  onAvatarUpdate,
  size = 120,
  defaultAvatar = '',
  userId
}) => {
  // 状态管理
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [showUploadButton, setShowUploadButton] = useState(false);
  const [localAvatarPath, setLocalAvatarPath] = useState(avatarPath);

  // 处理头像路径，确保正确显示
  const getAvatarUrl = (avatarPath: string) => {
    if (!avatarPath) return defaultAvatar;
    // 确保路径以斜杠开头，避免相对路径问题
    let url = avatarPath;
    if (!url.startsWith('/')) {
      url = '/' + url;
    }
    // 添加时间戳参数以强制浏览器重新加载图片
    const timestamp = new Date().getTime();
    return `${url}?t=${timestamp}`;
  };

  // 处理头像上传
  const handleAvatarUpload = async (file: File) => {
    setAvatarUploading(true);
    try {
      // 验证文件类型
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        message.error('请上传有效的图片文件(JPG, PNG, GIF, WebP)');
        return Upload.LIST_IGNORE;
      }

      // 验证文件大小（5MB限制）
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        message.error('图片大小不能超过5MB');
        return Upload.LIST_IGNORE;
      }

      // 检查userId是否存在
      if (!userId) {
        message.error('用户ID缺失，无法上传头像');
        return Upload.LIST_IGNORE;
      }

      // 创建FormData进行文件上传
      const formData: FormData = new FormData();
      formData.append('avatar', file);

      // 获取认证token
      const token = localStorage.getItem('token');

      // 发送文件到服务器
      const response = await fetch(`/api/users/${userId}/avatar`, {
        method: 'POST',
        headers: {
          // 添加认证token
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || '上传失败');
      }

      const data = await response.json();

      // 更新头像路径，安全访问data.avatar
      if (data && data.data && data.data.avatar) {
        const newAvatarPath = data.data.avatar;
        // 更新本地状态
        setLocalAvatarPath(newAvatarPath);

        // 更新 localStorage 中的 currentUser 头像
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
          const currentUser = JSON.parse(storedUser);
          currentUser.avatar = newAvatarPath;
          localStorage.setItem('currentUser', JSON.stringify(currentUser));
          // 触发自定义事件，通知其他组件更新头像
          window.dispatchEvent(new CustomEvent('userAvatarUpdated', { detail: { avatar: newAvatarPath } }));
        }

        // 调用外部回调
        if (onAvatarUpdate) {
          onAvatarUpdate(newAvatarPath);
        }

        message.success('头像上传成功');
      } else {
        throw new Error('无效的响应数据');
      }

      return Upload.LIST_IGNORE; // 阻止自动上传列表更新
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '头像上传失败，请重试';
      console.error('头像上传失败:', error);
      message.error(errorMessage);
      return Upload.LIST_IGNORE;
    } finally {
      setAvatarUploading(false);
    }
  };

  // 处理头像区域鼠标事件
  const handleAvatarMouseEnter = () => {
    setShowUploadButton(true);
  };

  const handleAvatarMouseLeave = () => {
    setShowUploadButton(false);
  };

  // 头像上传配置
  const uploadProps: UploadProps = {
    name: 'avatar',
    beforeUpload: handleAvatarUpload,
    showUploadList: false,
    multiple: false,
    capture: false,
  };

  return (
    <div
      style={{ position: 'relative', cursor: 'pointer' }}
      onMouseEnter={handleAvatarMouseEnter}
      onMouseLeave={handleAvatarMouseLeave}
    >
      <Avatar
        size={size}
        src={localAvatarPath ? getAvatarUrl(localAvatarPath) : undefined}
        icon={!localAvatarPath && <UserOutlined />}
        style={{ backgroundColor: '#1890ff' }}
      />
      {avatarUploading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255,255,255,0.7)',
          borderRadius: '50%'
        }}>
          <span>上传中...</span>
        </div>
      )}

      {/* 上传按钮，只在鼠标悬停时显示 */}
      {showUploadButton && (
        <Upload {...uploadProps}>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '14px',
            cursor: 'pointer'
          }}>
            <UploadOutlined />
            <span>更换头像</span>
          </div>
        </Upload>
      )}
    </div>
  );
};

export default AvatarUploadComponent;

// 头像路径处理工具函数 - 可单独使用
export const processAvatarUrl = (avatarPath?: string, defaultAvatar?: string, forceRefresh?: boolean): string => {
  if (!avatarPath) return defaultAvatar || '';
  let url = avatarPath.trim();

  // 如果是完整的HTTP/HTTPS URL，直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // 确保路径以斜杠开头
  if (!url.startsWith('/')) {
    url = '/' + url;
  }

  // 只在明确要求刷新时才添加时间戳（例如刚上传后）
  // 正常显示时不添加时间戳，让浏览器缓存正常工作
  if (forceRefresh && url.includes('/avatars/')) {
    const timestamp = new Date().getTime();
    return `${url}?t=${timestamp}`;
  }

  return url;
};

// 生成默认头像URL的工具函数
export const generateDefaultAvatar = (seed: string): string => {
  // 使用DiceBear API生成随机头像
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed || 'default'}`;
};
