import { io, Socket } from 'socket.io-client';

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
        if (this.socket?.connected) {
            return this.socket;
        }

        // 确定 Socket.IO 服务器地址
        // 如果是开发环境，通常直接连接到后端端口 3001
        // 生产环境可能与 API 地址相同或通过 env 配置
        const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
        // 如果 apiUrl 是相对路径 (如 /api)，则需要根据当前 host 构造绝对路径，或者硬编码后端地址
        // 简单起见，如果包含 /api，我们假设它是代理，尝试连接到根路径或硬编码的 localhost:3001
        const socketUrl = apiUrl.startsWith('http')
            ? apiUrl.replace(/\/api\/?$/, '') // 移除结尾的 /api
            : 'http://localhost:3001';

        console.log('Connecting to socket server:', socketUrl);

        this.socket = io(socketUrl, {
            transports: ['websocket', 'polling'], // 优先使用 websocket
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        this.socket.on('connect', () => {
            console.log('Socket connected:', this.socket?.id);
            // 连接成功后，加入用户个人房间
            this.socket?.emit('join_user', userId);
        });

        this.socket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
        });

        this.socket.on('connect_error', (err) => {
            console.error('Socket connection error:', err);
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
            this.socket.emit('join_conversation', conversationId);
        }
    }

    public leaveConversation(conversationId: string | number): void {
        if (this.socket && this.socket.connected) {
            this.socket.emit('leave_conversation', conversationId);
        }
    }

    // 监听新消息
    public onNewMessage(callback: (message: any) => void): void {
        if (this.socket) {
            this.socket.on('new_message', callback);
        }
    }

    // 移除新消息监听
    public offNewMessage(callback?: (message: any) => void): void {
        if (this.socket) {
            if (callback) {
                this.socket.off('new_message', callback);
            } else {
                this.socket.off('new_message');
            }
        }
    }

    public getSocket(): Socket | null {
        return this.socket;
    }
}

export const socketService = SocketService.getInstance();
