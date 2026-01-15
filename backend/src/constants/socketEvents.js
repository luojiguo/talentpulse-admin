// Socket.IO 事件常量定义

// 客户端发送的事件
const CLIENT_EVENTS = {
    JOIN_USER: 'join_user',                    // 用户加入个人房间
    JOIN_ROLE: 'join_role',                    // 加入角色房间
    JOIN_CONVERSATION: 'join_conversation',    // 加入会话房间
    LEAVE_CONVERSATION: 'leave_conversation',  // 离开会话房间
    TYPING: 'typing',                          // 输入状态
};

// 服务器发送的事件
const SERVER_EVENTS = {
    NEW_MESSAGE: 'new_message',                // 新消息
    MESSAGE_UPDATED: 'message_updated',        // 消息更新
    CONVERSATION_UPDATED: 'conversation_updated', // 会话更新
    SYSTEM_NOTIFICATION: 'system_notification', // 系统通知
    USER_ONLINE: 'user_online',                // 用户上线
    USER_OFFLINE: 'user_offline',              // 用户下线
    USER_TYPING: 'user_typing',                // 用户输入状态
    JOB_POSTED: 'job_posted',                  // 新职位发布
    JOB_UPDATED: 'job_updated',                // 职位更新
};

// 房间前缀
const ROOM_PREFIXES = {
    USER: 'user:',                             // 用户房间前缀
    ROLE: 'role:',                             // 角色房间前缀
    CONVERSATION: 'conversation:',             // 会话房间前缀
};

module.exports = {
    CLIENT_EVENTS,
    SERVER_EVENTS,
    ROOM_PREFIXES,
};
