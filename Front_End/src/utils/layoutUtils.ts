/**
 * 布局工具函数
 * 用于统一计算不同设备类型下的容器高度和响应式类名
 */

/**
 * 获取消息容器的响应式高度类名
 * @param isMobile 是否为手机设备 (<640px)
 * @param isTablet 是否为平板设备 (640-1024px)
 * @param layoutType 布局类型：'candidate' | 'recruiter'
 * @returns Tailwind CSS 高度类名
 */
export const getMessageContainerHeight = (
  isMobile: boolean,
  isTablet: boolean,
  layoutType: 'candidate' | 'recruiter' = 'candidate'
): string => {
  if (isMobile) {
    // 手机端：全屏高度，减去 header (64px)
    return 'h-[calc(100vh-64px)]';
  } else if (isTablet) {
    // 平板端：全屏高度，减去 header (64px) 和少量 padding (8px)
    return 'h-[calc(100vh-72px)]';
  } else {
    // 桌面端：全屏高度，减去 header 和少量 padding，取消 footer 空间
    return layoutType === 'candidate'
      ? 'h-[calc(100vh-96px)]' // header 64px + padding 32px (上下各16px)
      : 'h-[calc(100vh-96px)]'; // 统一高度
  }
};

/**
 * 获取消息容器的响应式 padding 类名
 * @param isMobile 是否为手机设备
 * @param isTablet 是否为平板设备
 * @returns Tailwind CSS padding 类名
 */
export const getMessageContainerPadding = (
  isMobile: boolean,
  isTablet: boolean
): string => {
  if (isMobile) {
    return 'p-0';
  } else if (isTablet) {
    return 'px-4 py-2'; // 减少垂直padding
  } else {
    return 'px-4 sm:px-6 lg:px-8 py-4'; // 减少垂直padding从py-6到py-4
  }
};

/**
 * 获取聊天窗口的响应式类名
 * @param isMobile 是否为手机设备
 * @param isTablet 是否为平板设备
 * @param showChat 是否显示聊天窗口
 * @returns Tailwind CSS 类名字符串
 */
export const getChatWindowClasses = (
  isMobile: boolean,
  isTablet: boolean,
  showChat: boolean
): string => {
  const baseClasses = 'flex-1 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden relative transition-colors';

  if (isMobile) {
    // 手机端：全屏显示，不使用 fixed，而是通过路由切换
    return `${baseClasses} ${showChat ? 'block' : 'hidden'} w-full border-0 rounded-none shadow-none p-2`;
  } else if (isTablet) {
    // 平板端：正常显示，有圆角和阴影
    return `${baseClasses} ${showChat ? 'block' : 'hidden'} p-2`;
  } else {
    // 桌面端：正常显示
    return `${baseClasses} ${showChat ? 'block' : 'hidden'} p-2`;
  }
};

/**
 * 获取消息列表的响应式类名
 * @param isMobile 是否为手机设备
 * @param isTablet 是否为平板设备
 * @param showList 是否显示列表
 * @returns Tailwind CSS 类名字符串
 */
export const getMessageListClasses = (
  isMobile: boolean,
  isTablet: boolean,
  showList: boolean
): string => {
  const baseClasses = 'bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden transition-colors';

  if (isMobile) {
    // 手机端：全宽，无边框和阴影
    return `${baseClasses} ${showList ? 'block' : 'hidden'} w-full border-0 rounded-none shadow-none p-2`;
  } else if (isTablet) {
    // 平板端：40% 宽度，增加内边距
    return `${baseClasses} ${showList ? 'block' : 'hidden'} w-[40%] min-w-[280px] p-2`;
  } else {
    // 桌面端：33% 宽度，增加内边距
    return `${baseClasses} ${showList ? 'block' : 'hidden'} lg:w-1/3 min-w-[320px] p-2`;
  }
};

/**
 * 获取聊天窗口的响应式宽度类名
 * @param isMobile 是否为手机设备
 * @param isTablet 是否为平板设备
 * @returns Tailwind CSS 宽度类名
 */
export const getChatWindowWidth = (
  isMobile: boolean,
  isTablet: boolean
): string => {
  if (isMobile) {
    return 'w-full';
  } else if (isTablet) {
    return 'w-[60%]';
  } else {
    return 'flex-1';
  }
};

