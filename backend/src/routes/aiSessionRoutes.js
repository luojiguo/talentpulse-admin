// AI会话相关路由
const express = require('express');
const router = express.Router();
const { pool, query } = require('../config/db');
const { asyncHandler } = require('../middleware/errorHandler');

// 获取用户的所有AI会话
router.get('/user/:userId', asyncHandler(async (req, res) => {
    const { userId } = req.params;
    // 查询指定用户的所有 AI 会话，按最后更新时间倒序排列
    const result = await query(
        'SELECT * FROM ai_sessions WHERE user_id = $1 ORDER BY updated_at DESC',
        [userId]
    );
    res.json({
        status: 'success',
        data: result.rows
    });
}));

// 获取单个AI会话
router.get('/:sessionId', asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const result = await query(
        'SELECT * FROM ai_sessions WHERE id = $1',
        [sessionId]
    );
    if (result.rows.length === 0) {
        const error = new Error('AI会话不存在');
        error.statusCode = 404;
        throw error;
    }
    res.json({
        status: 'success',
        data: result.rows[0]
    });
}));

// 创建新的AI会话
router.post('/', asyncHandler(async (req, res) => {
    const { userId, title, sessionType, messages = [] } = req.body;

    // 插入新会话
    // messages 默认为空数组，存储为 JSON 格式
    // initial last_message_at 设置为当前时间
    const result = await query(
        `INSERT INTO ai_sessions (user_id, title, session_type, messages, total_messages, last_message_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [userId, title, sessionType, JSON.stringify(messages), messages.length, new Date()]
    );

    res.status(201).json({
        status: 'success',
        data: result.rows[0]
    });
}));

// 更新AI会话（添加消息和/或更新标题）
router.put('/:sessionId', asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { messages, title } = req.body;

    // 构建更新查询，支持同时更新消息和标题
    const updateFields = [];
    const updateValues = [];
    let valueIndex = 1;

    // 动态构建更新字段
    if (messages !== undefined) {
        updateFields.push(`messages = $${valueIndex++}`);
        updateFields.push(`total_messages = $${valueIndex++}`);
        // 确保消息被序列化为 JSON 字符串
        updateValues.push(JSON.stringify(messages));
        updateValues.push(messages.length);
    }

    if (title !== undefined) {
        updateFields.push(`title = $${valueIndex++}`);
        updateValues.push(title);
    }

    // 总是更新最后消息时间和更新时间
    updateFields.push(`last_message_at = $${valueIndex++}`);
    updateFields.push(`updated_at = $${valueIndex++}`);
    const now = new Date();
    updateValues.push(now);
    updateValues.push(now);

    // 添加sessionId作为最后一个参数
    updateValues.push(sessionId);

    const result = await query(
        `UPDATE ai_sessions
         SET ${updateFields.join(', ')}
         WHERE id = $${valueIndex}
         RETURNING *`,
        updateValues
    );

    if (result.rows.length === 0) {
        const error = new Error('AI会话不存在');
        error.statusCode = 404;
        throw error;
    }

    res.json({
        status: 'success',
        data: result.rows[0]
    });
}));

// 删除AI会话
router.delete('/:sessionId', asyncHandler(async (req, res) => {
    const { sessionId } = req.params;

    const result = await query(
        'DELETE FROM ai_sessions WHERE id = $1 RETURNING *',
        [sessionId]
    );

    if (result.rows.length === 0) {
        const error = new Error('AI会话不存在');
        error.statusCode = 404;
        throw error;
    }

    res.json({ status: 'success', message: 'AI会话已删除' });
}));

// 批量删除AI会话
router.delete('/', asyncHandler(async (req, res) => {
    const { sessionIds } = req.body;

    if (!Array.isArray(sessionIds) || sessionIds.length === 0) {
        const error = new Error('请提供有效的会话ID列表');
        error.statusCode = 400;
        throw error;
    }

    // 使用 Postgres 的 ANY 操作符高效删除多个 ID
    // 确保 sessionIds 被转换为整数数组 ($1::int[])
    const result = await query(
        `DELETE FROM ai_sessions WHERE id = ANY($1::int[])
         RETURNING id`,
        [sessionIds]
    );

    res.json({
        status: 'success',
        message: `已删除 ${result.rows.length} 个AI会话`,
        data: {
            deletedIds: result.rows.map(row => row.id)
        }
    });
}));

module.exports = router;