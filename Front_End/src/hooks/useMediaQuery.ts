// 响应式媒体查询Hook
import { useState, useEffect } from 'react';

/**
 * 自定义Hook用于响应式媒体查询
 * @param query - CSS媒体查询字符串，例如 '(max-width: 1024px)'
 * @returns 是否匹配媒体查询
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    
    // 设置初始值
    setMatches(mediaQuery.matches);

    // 创建事件监听器
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // 添加监听器（使用addEventListener如果支持，否则使用addListener）
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
    } else {
      // 兼容旧版浏览器
      mediaQuery.addListener(handler);
    }

    // 清理函数
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handler);
      } else {
        mediaQuery.removeListener(handler);
      }
    };
  }, [query]);

  return matches;
}

// 预定义的常用断点
// 手机：< 640px
export const useIsMobile = () => useMediaQuery('(max-width: 640px)');
// 平板：641px - 1024px
export const useIsTablet = () => useMediaQuery('(min-width: 641px) and (max-width: 1024px)');
// 桌面：> 1024px
export const useIsDesktop = () => useMediaQuery('(min-width: 1025px)');
// 移动设备或平板（用于向后兼容）
export const useIsMobileOrTablet = () => useMediaQuery('(max-width: 1024px)');

/**
 * 组合 Hook：同时返回所有设备类型判断
 * @returns { isMobile, isTablet, isDesktop }
 */
export const useDeviceType = () => {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isDesktop = useIsDesktop();
  
  return { isMobile, isTablet, isDesktop };
};

