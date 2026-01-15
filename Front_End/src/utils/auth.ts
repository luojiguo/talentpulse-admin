// 认证工具函数

/**
 * 从 localStorage 获取认证 token
 */
export const getAuthToken = (): string | null => {
    return localStorage.getItem('token');
};

/**
 * 设置认证 token
 */
export const setAuthToken = (token: string): void => {
    localStorage.setItem('token', token);
};

/**
 * 移除认证 token
 */
export const removeAuthToken = (): void => {
    localStorage.removeItem('token');
};

/**
 * 检查用户是否已登录
 */
export const isAuthenticated = (): boolean => {
    return !!getAuthToken();
};

/**
 * 获取当前用户信息
 */
export const getCurrentUser = () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
};

/**
 * 设置当前用户信息
 */
export const setCurrentUser = (user: any): void => {
    localStorage.setItem('user', JSON.stringify(user));
};

/**
 * 移除当前用户信息
 */
export const removeCurrentUser = (): void => {
    localStorage.removeItem('user');
};

/**
 * 清除所有认证信息
 */
export const clearAuth = (): void => {
    removeAuthToken();
    removeCurrentUser();
};
