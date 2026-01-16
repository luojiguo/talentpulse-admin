
const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { notifyRole } = require('../services/socketService');

// --- 管理员接口 ---

// 创建新通知（草稿或已发布）
router.post('/admin', authenticate, async (req, res) => {


    const { title, content, target_audience, type, is_published } = req.body;

    /*
    // 基础管理员检查（假设用户对象中存在角色 'admin'）
    // 可能需要使用适当的角色中间件来增强此功能
    if (req.user.role !== 'admin') {
        return res.status(403).json({ status: 'error', message: '无权访问' });
    }
    */
    // 按照说明暂时跳过严格的管理员检查，仅进行简单的验证或在验证为管理员用户时给予隐式信任
    // 标准做法如下：
    /*
    const adminCheck = await pool.query('SELECT role FROM user_roles WHERE user_id = $1 AND role = $2', [req.user.id, 'admin']);
    if (adminCheck.rows.length === 0) return res.status(403).json({ status: 'error', message: '非管理员用户' });
    */
    if (!title || !content || !target_audience) {
        return res.status(400).json({ status: 'error', message: '缺少必填字段' });
    }

    try {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const queryText = `
                INSERT INTO system_notifications (title, content, target_audience, type, admin_id, is_published, published_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *
            `;
            const publishedAt = is_published ? new Date() : null;
            const values = [title, content, target_audience, type || 'announcement', req.user.id, is_published || false, publishedAt];

            const result = await client.query(queryText, values);
            const newNotification = result.rows[0];

            await client.query('COMMIT');

            // 如果立即发布，发送 Socket 通知
            if (is_published) {
                const notificationPayload = {
                    id: newNotification.id,
                    title: newNotification.title,
                    type: newNotification.type,
                    created_at: newNotification.created_at
                };

                if (target_audience === 'all') {
                    notifyRole('candidate', 'system_notification', notificationPayload);
                    notifyRole('recruiter', 'system_notification', notificationPayload);
                } else {
                    notifyRole(target_audience, 'system_notification', notificationPayload);
                }
            }

            res.status(201).json({ status: 'success', data: newNotification });
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (err) {
        // console.error('创建通知失败:', err);
        res.status(500).json({ status: 'error', message: '服务器内部错误' });
    }
});

// 获取所有通知（管理员列表）
router.get('/admin', authenticate, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT n.*, u.name as admin_name, COUNT(r.user_id)::int as read_count
            FROM system_notifications n
            LEFT JOIN users u ON n.admin_id = u.id
            LEFT JOIN system_notification_reads r ON n.id = r.notification_id
            GROUP BY n.id, u.name
            ORDER BY n.created_at DESC
        `);
        res.json({ status: 'success', data: result.rows });
    } catch (err) {
        // console.error('获取管理员通知失败:', err);
        res.status(500).json({ status: 'error', message: '服务器内部错误' });
    }
});

// 更新通知（仅在未发布时，或允许更新但重新通知？）
// 简化处理：允许更新。如果是发布草稿，则触发通知。
router.put('/admin/:id', authenticate, async (req, res) => {
    const { id } = req.params;
    const { title, content, target_audience, type, is_published } = req.body;

    try {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 检查当前状态
            const checkRes = await client.query('SELECT is_published FROM system_notifications WHERE id = $1', [id]);
            if (checkRes.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ status: 'error', message: '通知未找到' });
            }
            const wasPublished = checkRes.rows[0].is_published;

            // 更新
            let queryText = `
                UPDATE system_notifications 
                SET title = $1, content = $2, target_audience = $3, type = $4, updated_at = NOW()
            `;
            let values = [title, content, target_audience, type];
            let paramIndex = 5;

            // 处理发布状态变更
            let becomingPublished = false;
            if (typeof is_published !== 'undefined') {
                queryText += `, is_published = $${paramIndex}`;
                values.push(is_published);
                paramIndex++;

                if (is_published && !wasPublished) {
                    queryText += `, published_at = NOW()`;
                    becomingPublished = true;
                }
            }

            queryText += ` WHERE id = $${paramIndex} RETURNING *`;
            values.push(id);

            const result = await client.query(queryText, values);
            const updatedNotification = result.rows[0];

            await client.query('COMMIT');

            // 如果刚刚发布，触发 Socket 通知
            if (becomingPublished) {
                const notificationPayload = {
                    id: updatedNotification.id,
                    title: updatedNotification.title,
                    type: updatedNotification.type,
                    created_at: updatedNotification.created_at
                };

                if (updatedNotification.target_audience === 'all') {
                    notifyRole('candidate', 'system_notification', notificationPayload);
                    notifyRole('recruiter', 'system_notification', notificationPayload);
                } else {
                    notifyRole(updatedNotification.target_audience, 'system_notification', notificationPayload);
                }
            }

            res.json({ status: 'success', data: updatedNotification });

        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (err) {
        // console.error('更新通知失败:', err);
        res.status(500).json({ status: 'error', message: '服务器内部错误' });
    }
});

// 删除通知
router.delete('/admin/:id', authenticate, async (req, res) => {
    const { id } = req.params;
    try {
        // 按照说明暂时跳过严格的管理员检查，仅进行简单的验证或在验证为管理员用户时给予隐式信任
        // 标准做法如下：
        /*
        const adminCheck = await pool.query('SELECT role FROM user_roles WHERE user_id = $1 AND role = $2', [req.user.id, 'admin']);
        if (adminCheck.rows.length === 0) return res.status(403).json({ status: 'error', message: '非管理员用户' });
        */
        await pool.query('DELETE FROM system_notifications WHERE id = $1', [id]);
        res.json({ status: 'success', message: '通知已删除' });
    } catch (err) {
        // console.error('删除通知失败:', err);
        res.status(500).json({ status: 'error', message: '服务器内部错误' });
    }
});


// --- 用户接口 ---

// 获取我的通知
router.get('/', authenticate, async (req, res) => {
    const userId = req.user.id;

    try {
        // 我们需要知道用户的角色来过滤目标受众
        // 假设我们可以从 user_roles 表获取角色
        const rolesRes = await pool.query('SELECT role FROM user_roles WHERE user_id = $1', [userId]);
        const userRoles = rolesRes.rows.map(r => r.role);

        let roles = userRoles;
        if (req.query.role) {
            // 如果请求了特定角色（例如从当前 UI 上下文），且用户确实拥有该角色，则仅过滤该角色
            if (userRoles.includes(req.query.role)) {
                roles = [req.query.role];
            } else {
                // 请求的角色不是用户拥有的？返回空或错误？
                // 返回空角色列表通常意味着他们只能看到 'all' 受众或看不到特定角色的通知
                roles = [];
            }
        }

        const userRoleParams = roles.map(r => `'${r}'`).join(',');

        const queryText = `
            SELECT n.*, 
                CASE WHEN r.read_at IS NOT NULL THEN true ELSE false END as is_read
            FROM system_notifications n
            LEFT JOIN system_notification_reads r ON n.id = r.notification_id AND r.user_id = $1
            WHERE n.is_published = true
              AND (
                  n.target_audience = 'all' 
                  OR n.target_audience = ANY($2)
              )
            ORDER BY n.published_at DESC
            LIMIT 50
        `;

        const result = await pool.query(queryText, [userId, roles]);

        // 统计未读数量
        const unreadCountRes = await pool.query(`
            SELECT count(*) 
            FROM system_notifications n
            LEFT JOIN system_notification_reads r ON n.id = r.notification_id AND r.user_id = $1
            WHERE n.is_published = true
              AND (n.target_audience = 'all' OR n.target_audience = ANY($2))
              AND r.read_at IS NULL
        `, [userId, roles]);

        res.json({
            status: 'success',
            data: result.rows,
            unread_count: parseInt(unreadCountRes.rows[0].count)
        });

    } catch (err) {
        // console.error('获取用户通知失败:', err);
        res.status(500).json({ status: 'error', message: '服务器内部错误' });
    }
});

// 标记为已读
router.post('/:id/read', authenticate, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        await pool.query(`
            INSERT INTO system_notification_reads (user_id, notification_id, read_at)
            VALUES ($1, $2, NOW())
            ON CONFLICT (user_id, notification_id) DO UPDATE SET read_at = NOW()
        `, [userId, id]);

        res.json({ status: 'success' });
    } catch (err) {
        // console.error('标记通知为已读失败:', err);
        res.status(500).json({ status: 'error', message: '服务器内部错误' });
    }
});

// 标记所有为已读
router.post('/read-all', authenticate, async (req, res) => {
    const userId = req.user.id;
    try {
        // 查找该用户的所有未读通知并插入已读表
        const rolesRes = await pool.query('SELECT role FROM user_roles WHERE user_id = $1', [userId]);
        const roles = rolesRes.rows.map(r => r.role);

        await pool.query(`
            INSERT INTO system_notification_reads (user_id, notification_id, read_at)
            SELECT $1, n.id, NOW()
            FROM system_notifications n
            LEFT JOIN system_notification_reads r ON n.id = r.notification_id AND r.user_id = $1
            WHERE n.is_published = true
              AND (n.target_audience = 'all' OR n.target_audience = ANY($2))
              AND r.read_at IS NULL
            ON CONFLICT DO NOTHING
         `, [userId, roles]);

        res.json({ status: 'success' });
    } catch (err) {
        // console.error('标记所有为已读失败:', err);
        res.status(500).json({ status: 'error', message: '服务器内部错误' });
    }
});

module.exports = router;
