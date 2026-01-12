const socketIo = require('socket.io');
const { pool } = require('../config/db');
const { CLIENT_EVENTS, SERVER_EVENTS, ROOM_PREFIXES } = require('../constants/socketEvents');

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
        socket.on(CLIENT_EVENTS.JOIN_USER, (userId) => {
            if (!userId) return;

            console.log(`User ${userId} joined via socket ${socket.id}`);
            
            // Store userId on the socket for permission checks
            socket.userId = userId.toString();

            // Store user's socket ID
            activeUsers.set(userId.toString(), socket.id);

            // Join a room specifically for this user to receive personal notifications
            socket.join(`${ROOM_PREFIXES.USER}${userId}`);

            // Also updates online status if needed
            io.emit(SERVER_EVENTS.USER_ONLINE, userId);
        });

        // Join a role-based room
        socket.on(CLIENT_EVENTS.JOIN_ROLE, async (role) => {
            if (!role || !socket.userId) return;

            try {
                // Check if user has this role in user_roles table
                const result = await pool.query(
                    'SELECT 1 FROM user_roles WHERE user_id = $1 AND role = $2',
                    [socket.userId, role]
                );

                if (result.rows.length > 0) {
                    console.log(`Socket ${socket.id} (User ${socket.userId}) joining role room: ${role}`);
                    socket.join(`${ROOM_PREFIXES.ROLE}${role}`);
                } else {
                    console.warn(`User ${socket.userId} attempted to join role room ${role} without permission`);
                }
            } catch (error) {
                console.error('Error verifying role join permission:', error);
            }
        });

        // Join a specific conversation room
        socket.on(CLIENT_EVENTS.JOIN_CONVERSATION, async (conversationId) => {
            if (!socket.userId) {
                console.warn(`Unauthorized ${CLIENT_EVENTS.JOIN_CONVERSATION} attempt from socket ${socket.id}`);
                return;
            }

            try {
                // Check if user is either the candidate or the recruiter in this conversation
                const result = await pool.query(`
                    SELECT c.id 
                    FROM conversations c
                    LEFT JOIN candidates cd ON c.candidate_id = cd.id
                    LEFT JOIN recruiters r ON c.recruiter_id = r.id
                    WHERE c.id = $1 AND (cd.user_id = $2 OR r.user_id = $2)
                `, [conversationId, socket.userId]);

                if (result.rows.length > 0) {
                    console.log(`Socket ${socket.id} (User ${socket.userId}) joining conversation: ${conversationId}`);
                    socket.join(`${ROOM_PREFIXES.CONVERSATION}${conversationId}`);
                } else {
                    console.warn(`User ${socket.userId} attempted to join conversation ${conversationId} without permission`);
                }
            } catch (error) {
                console.error('Error verifying conversation join permission:', error);
            }
        });

        // Leave a conversation room
        socket.on(CLIENT_EVENTS.LEAVE_CONVERSATION, (conversationId) => {
            console.log(`Socket ${socket.id} leaving conversation: ${conversationId}`);
            socket.leave(`${ROOM_PREFIXES.CONVERSATION}${conversationId}`);
        });

        // Handle typing events
        socket.on(CLIENT_EVENTS.TYPING, ({ conversationId, userId, isTyping }) => {
            socket.to(`${ROOM_PREFIXES.CONVERSATION}${conversationId}`).emit(SERVER_EVENTS.USER_TYPING, {
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
                    io.emit(SERVER_EVENTS.USER_OFFLINE, userId);
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
 * Send a notification to a specific conversation room
 * @param {string|number} conversationId - The conversation ID
 * @param {string} event - Event name
 * @param {Object} data - Data to send
 */
const notifyConversation = (conversationId, event, data) => {
    if (!io) return;

    // Emit to the conversation room
    io.to(`${ROOM_PREFIXES.CONVERSATION}${conversationId}`).emit(event, data);
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
    io.to(`${ROOM_PREFIXES.USER}${userId}`).emit(event, data);
};

/**
 * Send a notification to all users with a specific role
 * @param {string} role - The role to notify (e.g., 'admin')
 * @param {string} event - Event name
 * @param {Object} data - Data to send
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
