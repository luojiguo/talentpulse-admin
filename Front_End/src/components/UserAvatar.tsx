import React, { useState, useEffect } from 'react';
import { processAvatarUrl, generateDefaultAvatar } from './AvatarUploadComponent';

interface UserAvatarProps {
  src?: string;
  name?: string;
  size?: number;
  className?: string;
  alt?: string;
  style?: React.CSSProperties;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ src, name, size = 40, className, alt, style }) => {
  const [imgError, setImgError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const imgRef = React.useRef<HTMLImageElement>(null);

  const handleImageError = () => {
    setImgError(true);
    setIsLoading(false);
  };

  const handleImageLoad = () => {
    setImgError(false);
    setIsLoading(false);
  };

  // 当src变化时重置状态
  useEffect(() => {
    if (src) {
      setImgError(false);

      // Check if image is already loaded (cached)
      if (imgRef.current && imgRef.current.complete) {
        setIsLoading(false);
      } else {
        setIsLoading(true);
      }

      // Safety timeout
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setIsLoading(false);
    }
  }, [src]);

  const processedSrc = processAvatarUrl(src);
  const shouldShowImage = processedSrc && !imgError;

  // Use default style if no className provided
  const finalClassName = className || 'bg-gradient-to-br from-blue-400 to-blue-600 text-white';

  return (
    <div
      className={`relative inline-flex items-center justify-center overflow-hidden rounded-full ${finalClassName}`}
      style={{ width: size, height: size, ...style }}
    >
      {shouldShowImage ? (
        <>
          {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-200 rounded-full">
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          <img
            ref={imgRef}
            src={processedSrc}
            alt={alt || name}
            className="w-full h-full object-cover"
            onError={handleImageError}
            onLoad={handleImageLoad}
            style={{
              opacity: isLoading ? 0 : 1,
              transition: 'opacity 0.2s ease-in-out'
            }}
          />
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center font-bold">
          <span style={{ fontSize: size * 0.4 }}>
            {name ? name.charAt(0).toUpperCase() : '?'}
          </span>
        </div>
      )}
    </div>
  );
};

export default UserAvatar;