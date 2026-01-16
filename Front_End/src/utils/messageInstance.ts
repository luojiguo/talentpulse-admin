import type { MessageInstance } from 'antd/es/message/interface';

// 全局 message 实例
let globalMessageInstance: MessageInstance | null = null;

/**
 * 设置全局 message 实例
 * 应该在 App 组件中调用,传入 App.useApp() 返回的 message 实例
 */
export const setGlobalMessage = (instance: MessageInstance) => {
    globalMessageInstance = instance;
};

/**
 * 获取全局 message 实例
 * 如果实例未初始化,返回一个空操作的 mock 对象以避免错误
 */
export const getGlobalMessage = (): MessageInstance => {
    if (!globalMessageInstance) {
        // NOTE: 返回一个 mock 对象,避免在实例未初始化时报错
        // console.warn('Global message instance not initialized yet');
        return {
            success: () => { },
            error: () => { },
            info: () => { },
            warning: () => { },
            loading: () => { },
            open: () => { },
            destroy: () => { },
        } as any;
    }
    return globalMessageInstance;
};
