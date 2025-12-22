// AI会话相关路由
const express = require('express');
const router = express.Router();
const { pool, query } = require('../config/db');
const { asyncHandler } = require('../middleware/errorHandler');

// 获取用户的所有AI会话
router.get('/user/:userId', asyncHandler(async (req, res) => {
    const { userId } = req.params;
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

    if (messages !== undefined) {
        updateFields.push(`messages = $${valueIndex++}`);
        updateFields.push(`total_messages = $${valueIndex++}`);
        updateValues.push(JSON.stringify(messages));
        updateValues.push(messages.length);
    }

    if (title !== undefined) {
        updateFields.push(`title = $${valueIndex++}`);
        updateValues.push(title);
    }

    // 总是更新时间戳
    updateFields.push(`last_message_at = $${valueIndex++}`);
    updateFields.push(`updated_at = $${valueIndex++}`);
    updateValues.push(new Date());
    updateValues.push(new Date());

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