import { io, Socket } from 'socket.io-client';
import { message } from 'antd';
import { CLIENT_EVENTS, SERVER_EVENTS } from '@/constants/socketEvents';

class SocketService {
    private socket: Socket | null = null;
    private static instance: SocketService;

    private constructor() { }

    public static getInstance(): SocketService {
        if (!SocketService.instance) {
            SocketService.instance = new SocketService();
        }
        return SocketService.instance;
    }

    public connect(userId: string | number): Socket {
        if (this.socket) {
            return this.socket;
        }

        // 确定 Socket.IO 服务器地址
        const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';
        const socketUrl = apiUrl.startsWith('http')
            ? apiUrl.replace(/\/api\/?$/, '') // 移除结尾的 /api
            : 'http://localhost:8001';

        console.log('Connecting to socket server:', socketUrl);

        this.socket = io(socketUrl, {
            transports: ['websocket', 'polling'], // 优先使用 websocket
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
        });

        this.socket.on('connect', () => {
            console.log('Socket connected:', this.socket?.id);
            message.success('消息服务连接成功');
            // 连接成功后，加入用户个人房间
            this.socket?.emit(CLIENT_EVENTS.JOIN_USER, userId);
        });

        this.socket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
            if (reason === 'io server disconnect') {
                message.error('服务器断开连接，正在尝试重连...');
            } else if (reason === 'io client disconnect') {
                // 客户端主动断开，不显示提示
            } else {
                message.warning(`连接已断开 (${reason})，正在尝试重连...`);
            }
        });

        this.socket.on('connect_error', (err) => {
            console.error('Socket connection error:', err);
            message.error('连接服务器失败，请检查网络连接');
        });

        this.socket.on('reconnect', (attemptNumber) => {
            console.log('Socket reconnected after', attemptNumber, 'attempts');
            message.success('消息服务重连成功');
            // 重连成功后，重新加入用户个人房间
            this.socket?.emit(CLIENT_EVENTS.JOIN_USER, userId);
        });

        this.socket.on('reconnect_failed', () => {
            console.error('Socket reconnection failed');
            message.error('无法重新连接到服务器，请刷新页面重试');
        });

        this.socket.on('reconnect_attempt', (attemptNumber) => {
            console.log('Socket reconnect attempt:', attemptNumber);
        });

        return this.socket;
    }

    public disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    public joinConversation(conversationId: string | number): void {
        if (this.socket && this.socket.connected) {
            this.socket.emit(CLIENT_EVENTS.JOIN_CONVERSATION, conversationId);
        }
    }

    public leaveConversation(conversationId: string | number): void {
        if (this.socket && this.socket.connected) {
            this.socket.emit(CLIENT_EVENTS.LEAVE_CONVERSATION, conversationId);
        }
    }

    public joinRole(role: string): void {
        if (this.socket && this.socket.connected) {
            this.socket.emit(CLIENT_EVENTS.JOIN_ROLE, role);
        }
    }

    // 监听新消息
    public onNewMessage(callback: (message: any) => void): void {
        if (this.socket) {
            this.socket.on(SERVER_EVENTS.NEW_MESSAGE, callback);
        }
    }

    // 移除新消息监听
    public offNewMessage(callback?: (message: any) => void): void {
        if (this.socket) {
            if (callback) {
                this.socket.off(SERVER_EVENTS.NEW_MESSAGE, callback);
            } else {
                this.socket.off(SERVER_EVENTS.NEW_MESSAGE);
            }
        }
    }

    public onMessageUpdated(callback: (message: any) => void): void {
        if (this.socket) {
            this.socket.on(SERVER_EVENTS.MESSAGE_UPDATED, callback);
        }
    }

    public offMessageUpdated(callback?: (message: any) => void): void {
        if (this.socket) {
            if (callback) {
                this.socket.off(SERVER_EVENTS.MESSAGE_UPDATED, callback);
            } else {
                this.socket.off(SERVER_EVENTS.MESSAGE_UPDATED);
            }
        }
    }

    public onConversationUpdated(callback: (conversation: any) => void): void {
        if (this.socket) {
            this.socket.on(SERVER_EVENTS.CONVERSATION_UPDATED, callback);
        }
    }

    public offConversationUpdated(callback?: (conversation: any) => void): void {
        if (this.socket) {
            if (callback) {
                this.socket.off(SERVER_EVENTS.CONVERSATION_UPDATED, callback);
            } else {
                this.socket.off(SERVER_EVENTS.CONVERSATION_UPDATED);
            }
        }
    }

    // 监听系统通知
    public onSystemNotification(callback: (notification: any) => void): void {
        if (this.socket) {
            this.socket.on(SERVER_EVENTS.SYSTEM_NOTIFICATION, callback);
        }
    }

    public offSystemNotification(callback?: (notification: any) => void): void {
        if (this.socket) {
            if (callback) {
                this.socket.off(SERVER_EVENTS.SYSTEM_NOTIFICATION, callback);
            } else {
                this.socket.off(SERVER_EVENTS.SYSTEM_NOTIFICATION);
            }
        }
    }

    public getSocket(): Socket | null {
        return this.socket;
    }
}

export { SocketService };
export const socketService = SocketService.getInstance();
