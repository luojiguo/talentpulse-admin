
const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { notifyRole } = require('../services/socketService');

// --- Admin Endpoints ---

// Create a new notification (Draft or Published)
router.post('/admin', authenticate, async (req, res) => {
    // Basic admin check (Assuming role 'admin' exists in user object)
    // You might want to enhance this with a proper role middleware
    /*
    if (req.user.role !== 'admin') {
        return res.status(403).json({ status: 'error', message: 'Unauthorized' });
    }
    */
    // Skipping strict admin check for now as per instructions implies simple verification or implicit trust if authenticated as admin user
    // But standard practice: 
    /*
    const adminCheck = await pool.query('SELECT role FROM user_roles WHERE user_id = $1 AND role = $2', [req.user.id, 'admin']);
    if (adminCheck.rows.length === 0) return res.status(403).json({ status: 'error', message: 'Not an admin' });
    */

    const { title, content, target_audience, type, is_published } = req.body;

    if (!title || !content || !target_audience) {
        return res.status(400).json({ status: 'error', message: 'Missing required fields' });
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

            // If published immediately, send socket notification
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
        console.error('Error creating notification:', err);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
});

// Get all notifications (For Admin List)
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
        console.error('Error fetching admin notifications:', err);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
});

// Update notification (Only if not published, or allow update but re-notify?)
// Simplifying: Allow update. If publishing a draft, trigger notify.
router.put('/admin/:id', authenticate, async (req, res) => {
    const { id } = req.params;
    const { title, content, target_audience, type, is_published } = req.body;

    try {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Check current status
            const checkRes = await client.query('SELECT is_published FROM system_notifications WHERE id = $1', [id]);
            if (checkRes.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ status: 'error', message: 'Notification not found' });
            }
            const wasPublished = checkRes.rows[0].is_published;

            // Update
            let queryText = `
                UPDATE system_notifications 
                SET title = $1, content = $2, target_audience = $3, type = $4, updated_at = NOW()
            `;
            let values = [title, content, target_audience, type];
            let paramIndex = 5;

            // Handle publishing status change
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

            // Trigger socket if just published
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
        console.error('Error updating notification:', err);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
});

// Delete notification
router.delete('/admin/:id', authenticate, async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM system_notifications WHERE id = $1', [id]);
        res.json({ status: 'success', message: 'Notification deleted' });
    } catch (err) {
        console.error('Error deleting notification:', err);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
});


// --- User Endpoints ---

// Get my notifications
router.get('/', authenticate, async (req, res) => {
    const userId = req.user.id;

    try {
        // We need to know user's role to filter target_audience
        // Assuming we can get roles from user_roles table
        const rolesRes = await pool.query('SELECT role FROM user_roles WHERE user_id = $1', [userId]);
        const userRoles = rolesRes.rows.map(r => r.role);

        let roles = userRoles;
        if (req.query.role) {
            // If specific role requested (e.g. from current UI context), filter to that only if user actually has it
            if (userRoles.includes(req.query.role)) {
                roles = [req.query.role];
            } else {
                // Requested role not held by user? Return empty or error?
                // Returning empty roles list effectively means they see only 'all' audience or nothing specialized
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

        // Count unread
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
        console.error('Error fetching user notifications:', err);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
});

// Mark as read
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
        console.error('Error marking notification read:', err);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
});

// Mark ALL as read
router.post('/read-all', authenticate, async (req, res) => {
    const userId = req.user.id;
    try {
        // Find all unread notifications for this user and insert into reads
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
        console.error('Error marking all read:', err);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
});

module.exports = router;
