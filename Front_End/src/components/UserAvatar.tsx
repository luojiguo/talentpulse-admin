import React, { useState } from 'react';
import { processAvatarUrl, generateDefaultAvatar } from './AvatarUploadComponent';

interface UserAvatarProps {
  src?: string;
  name?: string;
  size?: number;
  className?: string;
  alt?: string;
  onError?: () => void;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  name = '',
  size = 36,
  className = '',
  alt = 'User Avatar',
  onError
}) => {
  const [imageError, setImageError] = useState(false);
  
  const handleError = () => {
    setImageError(true);
    onError?.();
  };
  
  // 生成默认头像或使用名称首字母作为备用
  const fallbackAvatar = () => {
    // 如果有名称，使用首字母
    if (name && name.length > 0) {
      return (
        <span className="w-full h-full flex items-center justify-center text-sm font-bold">
          {name.charAt(0)}
        </span>
      );
    }
    // 否则使用默认头像
    return (
      <img
        src={generateDefaultAvatar(name)}
        alt={alt}
        className="w-full h-full object-cover"
      />
    );
  };
  
  return (
    <div
      className={`rounded-full overflow-hidden flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {!imageError && src && src !== '' ? (
        <img
          src={processAvatarUrl(src)}
          alt={alt}
          className="w-full h-full object-cover"
          onError={handleError}
        />
      ) : (
        fallbackAvatar()
      )}
    </div>
  );
};

export default UserAvatar;