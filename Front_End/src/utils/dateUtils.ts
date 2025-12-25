// 日期时间格式化工具函数

/**
 * 将ISO格式的日期时间转换为更友好的格式
 * @param dateString ISO格式的日期时间字符串，如：2025-12-18T09:30:00.000Z
 * @returns 格式化后的日期时间字符串，如：今天 17:30、昨天 17:30 或 2025-12-18 17:30
 */
export const formatDateTime = (dateString: string, format?: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  
  // 检查日期是否有效
  if (isNaN(date.getTime())) {
    return dateString;
  }
  
  // 获取年、月、日、时、分
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  // 获取今天的年、月、日
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = String(today.getMonth() + 1).padStart(2, '0');
  const todayDay = String(today.getDate()).padStart(2, '0');
  
  // 获取昨天的年、月、日
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayYear = yesterday.getFullYear();
  const yesterdayMonth = String(yesterday.getMonth() + 1).padStart(2, '0');
  const yesterdayDay = String(yesterday.getDate()).padStart(2, '0');
  
  // 如果格式为 'date'，只返回日期部分
  if (format === 'date') {
    if (year === todayYear && month === todayMonth && day === todayDay) {
      return '今天';
    } else if (year === yesterdayYear && month === yesterdayMonth && day === yesterdayDay) {
      return '昨天';
    } else {
      return `${year}-${month}-${day}`;
    }
  }
  
  // 格式化日期时间
  if (year === todayYear && month === todayMonth && day === todayDay) {
    // 今天：直接显示时间
    return `${hours}:${minutes}`;
  } else if (year === yesterdayYear && month === yesterdayMonth && day === yesterdayDay) {
    // 昨天：显示"昨天 时:分"
    return `昨天 ${hours}:${minutes}`;
  } else {
    // 更早日期：显示完整日期时间
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }
};

/**
 * 将ISO格式的日期转换为更友好的格式
 * @param dateString ISO格式的日期字符串，如：2025-12-18T00:00:00.000Z
 * @returns 格式化后的日期字符串，如：2025-12-18 或 今天
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  
  // 检查日期是否有效
  if (isNaN(date.getTime())) {
    return dateString;
  }
  
  // 获取年、月、日
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  // 获取今天的年、月、日
  const todayYear = now.getFullYear();
  const todayMonth = String(now.getMonth() + 1).padStart(2, '0');
  const todayDay = String(now.getDate()).padStart(2, '0');
  
  // 格式化日期
  if (year === todayYear && month === todayMonth && day === todayDay) {
    // 今天
    return '今天';
  } else {
    // 其他日期：显示完整日期
    return `${year}-${month}-${day}`;
  }
};

/**
 * 将ISO格式的时间转换为更友好的格式
 * @param dateString ISO格式的日期时间字符串，如：2025-12-18T09:30:00.000Z
 * @returns 格式化后的时间字符串，如：17:30
 */
export const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  
  // 检查日期是否有效
  if (isNaN(date.getTime())) {
    return dateString;
  }
  
  // 获取时、分
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  // 格式化时间
  return `${hours}:${minutes}`;
};

/**
 * 将时间戳转换为更友好的格式
 * @param timestamp 时间戳（毫秒）
 * @returns 格式化后的日期时间字符串
 */
export const formatTimestamp = (timestamp: number): string => {
  return formatDateTime(new Date(timestamp).toISOString());
};
