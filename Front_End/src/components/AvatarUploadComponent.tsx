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
}

const AvatarUploadComponent: React.FC<AvatarUploadComponentProps> = ({
  avatarPath,
  onAvatarUpdate,
  size = 120,
  defaultAvatar = ''
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

      // 创建FormData进行文件上传
      const formData: FormData = new FormData();
      formData.append('avatar', file);

      // 发送文件到服务器
      const response = await fetch('/api/users/avatar', {
        method: 'POST',
        headers: {
          // 实际项目中应该从认证状态获取token
          // 'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('上传失败');
      }

      const data = await response.json();
      
      // 更新头像路径
      if (data.avatarPath) {
        // 更新本地状态
        setLocalAvatarPath(data.avatarPath);
        
        // 调用外部回调
        if (onAvatarUpdate) {
          onAvatarUpdate(data.avatarPath);
        }
        
        message.success('头像上传成功');
      }

      return Upload.LIST_IGNORE; // 阻止自动上传列表更新
    } catch (error: unknown) {
      console.error('头像上传失败:', error);
      message.error('头像上传失败，请重试');
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
export const processAvatarUrl = (avatarPath: string): string => {
  if (!avatarPath) return '';
  let url = avatarPath;
  if (!url.startsWith('/')) {
    url = '/' + url;
  }
  const timestamp = new Date().getTime();
  return `${url}?t=${timestamp}`;
};
