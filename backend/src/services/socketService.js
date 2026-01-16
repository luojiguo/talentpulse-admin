const socketIo = require('socket.io');
const { pool } = require('../config/db');
const { CLIENT_EVENTS, SERVER_EVENTS, ROOM_PREFIXES } = require('../constants/socketEvents');

let io;
const activeUsers = new Map(); // Map<userId, socketId>

/**
 * 初始化 Socket.IO 服务器
 * @param {Object} server - HTTP 服务器实例
 */
const initSocket = (server) => {
    io = socketIo(server, {
        cors: {
            origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : "*", // Allow all for dev if not set
            methods: ["GET", "POST"],
            credentials: true
        },
        pingTimeout: 60000,
    });

    io.on('connection', (socket) => {
        // console.log('New client connected:', socket.id);

        // 用户使用其用户 ID 加入
        socket.on(CLIENT_EVENTS.JOIN_USER, (userId) => {
            if (!userId) return;

            // console.log(`User ${userId} joined via socket ${socket.id}`);

            // 将 userId 存储在 socket 上用于权限检查
            socket.userId = userId.toString();

            // 存储用户的 socket ID
            activeUsers.set(userId.toString(), socket.id);

            // 加入特定于此用户的房间以接收个人通知
            socket.join(`${ROOM_PREFIXES.USER}${userId}`);

            // 如有需要，更新在线状态
            io.emit(SERVER_EVENTS.USER_ONLINE, userId);
        });

        // 加入基于角色的房间
        socket.on(CLIENT_EVENTS.JOIN_ROLE, async (role) => {
            if (!role || !socket.userId) return;

            try {
                // 检查用户在 user_roles 表中是否具有此角色
                const result = await pool.query(
                    'SELECT 1 FROM user_roles WHERE user_id = $1 AND role = $2',
                    [socket.userId, role]
                );

                if (result.rows.length > 0) {
                    // console.log(`Socket ${socket.id} (User ${socket.userId}) joining role room: ${role}`);
                    socket.join(`${ROOM_PREFIXES.ROLE}${role}`);
                } else {
                    // console.warn(`User ${socket.userId} attempted to join role room ${role} without permission`);
                }
            } catch (error) {
                // console.error('验证角色加入权限时出错:', error);
            }
        });

        // 加入特定对话房间
        socket.on(CLIENT_EVENTS.JOIN_CONVERSATION, async (conversationId) => {
            if (!socket.userId) {
                // console.warn(`Unauthorized ${CLIENT_EVENTS.JOIN_CONVERSATION} attempt from socket ${socket.id}`);
                return;
            }

            try {
                // 检查用户是否是此对话中的候选人或招聘者
                const result = await pool.query(`
                    SELECT c.id 
                    FROM conversations c
                    LEFT JOIN candidates cd ON c.candidate_id = cd.id
                    LEFT JOIN recruiters r ON c.recruiter_id = r.id
                    WHERE c.id = $1 AND (cd.user_id = $2 OR r.user_id = $2)
                `, [conversationId, socket.userId]);

                if (result.rows.length > 0) {
                    // console.log(`Socket ${socket.id} (User ${socket.userId}) joining conversation: ${conversationId}`);
                    socket.join(`${ROOM_PREFIXES.CONVERSATION}${conversationId}`);
                } else {
                    // console.warn(`User ${socket.userId} attempted to join conversation ${conversationId} without permission`);
                }
            } catch (error) {
                // console.error('验证对话加入权限时出错:', error);
            }
        });

        // 离开对话房间
        socket.on(CLIENT_EVENTS.LEAVE_CONVERSATION, (conversationId) => {
            // console.log(`Socket ${socket.id} leaving conversation: ${conversationId}`);
            socket.leave(`${ROOM_PREFIXES.CONVERSATION}${conversationId}`);
        });

        // 处理输入中事件
        socket.on(CLIENT_EVENTS.TYPING, ({ conversationId, userId, isTyping }) => {
            socket.to(`${ROOM_PREFIXES.CONVERSATION}${conversationId}`).emit(SERVER_EVENTS.USER_TYPING, {
                conversationId,
                userId,
                isTyping
            });
        });

        socket.on('disconnect', () => {
            // console.log('Client disconnected:', socket.id);

            // 从活动映射中移除用户
            for (const [userId, socketId] of activeUsers.entries()) {
                if (socketId === socket.id) {
                    activeUsers.delete(userId);
                    io.emit(SERVER_EVENTS.USER_OFFLINE, userId);
                    break;
                }
            }
        });
    });

    return io;
};

/**
 * 获取 Socket.IO 实例
 * @returns {Object} io 实例
 */
const getIo = () => {
    if (!io) {
        throw new Error('Socket.IO 未初始化！');
    }
    return io;
};

/**
 * 发送通知到特定对话房间
 * @param {string|number} conversationId - 对话 ID
 * @param {string} event - 事件名称
 * @param {Object} data - 发送的数据
 */
const notifyConversation = (conversationId, event, data) => {
    if (!io) return;

    // 发送到对话房间
    io.to(`${ROOM_PREFIXES.CONVERSATION}${conversationId}`).emit(event, data);
};

/**
 * 发送通知到特定用户
 * @param {string|number} userId - 要通知的用户 ID
 * @param {string} event - 事件名称
 * @param {Object} data - 发送的数据
 */
const notifyUser = (userId, event, data) => {
    if (!io) return;

    // 发送到用户的个人房间
    io.to(`${ROOM_PREFIXES.USER}${userId}`).emit(event, data);
};

/**
 * 发送通知给具有特定角色的所有用户
 * @param {string} role - 要通知的角色 (例如, 'admin')
 * @param {string} event - 事件名称
 * @param {Object} data - 发送的数据
 */
const notifyRole = (role, event, data) => {
    if (!io) return;
    io.to(`${ROOM_PREFIXES.ROLE}${role}`).emit(event, data);
};

module.exports = {
    initSocket,
    getIo,
    notifyUser,
    notifyConversation,
    notifyRole
};
