import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// 主题类型定义
export type ThemeMode = 'light' | 'dark';

// 主题颜色定义
export interface ThemeColors {
    // 主色调
    primary: string;
    primaryLight: string;
    primaryDark: string;

    // 背景色
    background: string;
    cardBackground: string;

    // 文字颜色
    textPrimary: string;
    textSecondary: string;

    // 强调色
    accent: string;

    // 边框色
    border: string;

    // 状态色
    success: string;
    warning: string;
    error: string;
    info: string;
}

// 浅色主题 - 苹果蓝 (#007AFF)
const lightTheme: ThemeColors = {
    primary: '#007AFF',
    primaryLight: '#e6f4ff', // Light blue tint
    primaryDark: '#005bb5', // Darker shade of #007AFF
    background: '#f8fbff',
    cardBackground: '#FFFFFF',
    textPrimary: '#1e293b',
    textSecondary: '#64748b',
    accent: '#5ac8fa', // Apple light blue
    border: '#e2e8f0',
    success: '#34c759', // Apple Green
    warning: '#ff9500', // Apple Orange
    error: '#ff3b30', // Apple Red
    info: '#007AFF',
};

// 深色主题 - 现代深蓝
const darkTheme: ThemeColors = {
    primary: '#0a84ff', // Apple Blue (Dark Mode) - slightly lighter for better contrast
    primaryLight: '#1e293b',
    primaryDark: '#005bb5',
    background: '#1C1C1E', // Apple style dark gray background
    cardBackground: '#1c1c1e', // Apple dark mode card
    textPrimary: '#f5f5f7',
    textSecondary: '#86868b',
    accent: '#5ac8fa',
    border: '#38383a',
    success: '#30d158',
    warning: '#ff9f0a',
    error: '#ff453a',
    info: '#0a84ff',
};

// 主题上下文接口
interface ThemeContextType {
    mode: ThemeMode;
    colors: ThemeColors;
    toggleTheme: () => void;
    setTheme: (mode: ThemeMode) => void;
}

// 创建上下文
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Provider组件
interface ThemeProviderProps {
    children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    // 从localStorage读取保存的主题,默认为浅色
    const [mode, setMode] = useState<ThemeMode>(() => {
        // 尝试获取新键名，如果不存在则尝试旧键名（平滑迁移）
        const savedTheme = localStorage.getItem('talentpulse-theme') || localStorage.getItem('recruiter-theme');
        return (savedTheme as ThemeMode) || 'light';
    });

    // 根据模式选择颜色
    const colors = mode === 'light' ? lightTheme : darkTheme;

    // 切换主题
    const toggleTheme = () => {
        setMode(prev => prev === 'light' ? 'dark' : 'light');
    };

    // 设置指定主题
    const setTheme = (newMode: ThemeMode) => {
        setMode(newMode);
    };

    // 持久化主题到localStorage
    useEffect(() => {
        localStorage.setItem('talentpulse-theme', mode);

        // 更新document的data-theme属性,用于CSS变量
        document.documentElement.setAttribute('data-theme', mode);

        // 同步Tailwind的dark类名
        if (mode === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [mode]);

    const value: ThemeContextType = {
        mode,
        colors,
        toggleTheme,
        setTheme,
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

// 自定义Hook
export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme必须在ThemeProvider内部使用');
    }
    return context;
};
