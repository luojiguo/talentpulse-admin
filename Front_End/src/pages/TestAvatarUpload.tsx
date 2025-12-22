import React, { useState } from 'react';
import AvatarUploadComponent from '../components/AvatarUploadComponent';

const TestAvatarUpload: React.FC = () => {
  const [avatarPath, setAvatarPath] = useState<string>('');

  const handleAvatarUpdate = (newAvatarPath: string) => {
    setAvatarPath(newAvatarPath);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>头像上传测试页面</h1>
      <div style={{ margin: '20px 0' }}>
        <h2>当前头像</h2>
        <AvatarUploadComponent
          avatarPath={avatarPath}
          onAvatarUpdate={handleAvatarUpdate}
          size={150}
        />
      </div>
      <div style={{ margin: '20px 0' }}>
        <h2>头像路径</h2>
        <p>{avatarPath || '暂无头像'}</p>
      </div>
      <div style={{ margin: '20px 0' }}>
        <h2>使用说明</h2>
        <ul>
          <li>点击头像区域或悬停后点击"更换头像"按钮</li>
          <li>选择一张图片文件（JPG, PNG, GIF, WebP，大小不超过5MB）</li>
          <li>等待上传完成，头像会自动更新</li>
          <li>上传成功后，头像路径会显示在下方</li>
        </ul>
      </div>
    </div>
  );
};

export default TestAvatarUpload;
