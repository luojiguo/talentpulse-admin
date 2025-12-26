const socketIo = require('socket.io');

let io;
const activeUsers = new Map(); // Map<userId, socketId>

/**
 * Initialize Socket.IO server
 * @param {Object} server - HTTP server instance
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
        console.log('New client connected:', socket.id);

        // User joins with their user ID
        socket.on('join_user', (userId) => {
            if (!userId) return;

            console.log(`User ${userId} joined via socket ${socket.id}`);

            // Store user's socket ID
            activeUsers.set(userId.toString(), socket.id);

            // Join a room specifically for this user to receive personal notifications
            socket.join(`user_${userId}`);

            // Also updates online status if needed
            io.emit('user_online', userId);
        });

        // Join a specific conversation room
        socket.on('join_conversation', (conversationId) => {
            console.log(`Socket ${socket.id} joining conversation: ${conversationId}`);
            socket.join(`conversation_${conversationId}`);
        });

        // Leave a conversation room
        socket.on('leave_conversation', (conversationId) => {
            console.log(`Socket ${socket.id} leaving conversation: ${conversationId}`);
            socket.leave(`conversation_${conversationId}`);
        });

        // Handle typing events
        socket.on('typing', ({ conversationId, userId, isTyping }) => {
            socket.to(`conversation_${conversationId}`).emit('user_typing', {
                conversationId,
                userId,
                isTyping
            });
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);

            // Remove user from active map
            for (const [userId, socketId] of activeUsers.entries()) {
                if (socketId === socket.id) {
                    activeUsers.delete(userId);
                    io.emit('user_offline', userId);
                    break;
                }
            }
        });
    });

    return io;
};

/**
 * Get Socket.IO instance
 * @returns {Object} io instance
 */
const getIo = () => {
    if (!io) {
        throw new Error('Socket.IO not initialized!');
    }
    return io;
};

/**
 * Send a notification to a specific user
 * @param {string|number} userId - The user ID to notify
 * @param {string} event - Event name
 * @param {Object} data - Data to send
 */
const notifyUser = (userId, event, data) => {
    if (!io) return;

    // Emit to the user's personal room
    io.to(`user_${userId}`).emit(event, data);
};

/**
 * Send a message to a conversation room
 * @param {string|number} conversationId - The conversation ID
 * @param {string} event - Event name
 * @param {Object} data - Data to send
 */
const notifyConversation = (conversationId, event, data) => {
    if (!io) return;

    io.to(`conversation_${conversationId}`).emit(event, data);
};

module.exports = {
    initSocket,
    getIo,
    notifyUser,
    notifyConversation
};
