// 求职者相关路由
const express = require('express');
const router = express.Router();
const { pool, query } = require('../config/db');
const { asyncHandler } = require('../middleware/errorHandler');

// ==========================================
// Candidate Routes
// ==========================================

// 获取所有求职者 - 优化性能，增加限制
router.get('/', asyncHandler(async (req, res) => {
    const { limit = 50, offset = 0 } = req.query;
    
    const result = await query(`
        SELECT 
            c.*,
            u.name,
            u.email,
            u.phone,
            u.avatar
        FROM candidates c
        LEFT JOIN users u ON c.user_id = u.id
        ORDER BY c.created_at DESC
        LIMIT $1 OFFSET $2
    `, [parseInt(limit), parseInt(offset)], 10000);

    res.json({
        status: 'success',
        data: result.rows,
        count: result.rows.length
    });
}));

// ==========================================
// Saved Jobs Routes (收藏职位) - 必须在 /:userId 之前
// ==========================================

// 获取求职者收藏的职位
router.get('/:userId/saved-jobs', asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const result = await query(`
        SELECT 
            j.*,
            sj.created_at as saved_at,
            c.name as company_name,
            c.logo as company_logo
        FROM saved_jobs sj
        JOIN jobs j ON sj.job_id = j.id
        LEFT JOIN companies c ON j.company_id = c.id
        WHERE sj.user_id = $1
        ORDER BY sj.created_at DESC
    `, [userId]);

    res.json({
        status: 'success',
        data: result.rows
    });
}));

// 收藏职位
router.post('/:userId/saved-jobs', asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { jobId } = req.body;

    if (!jobId) {
        const error = new Error('请提供职位ID');
        error.statusCode = 400;
        error.errorCode = 'MISSING_JOB_ID';
        throw error;
    }

    // 检查职位是否存在
    const jobCheck = await query('SELECT id FROM jobs WHERE id = $1', [jobId]);
    if (jobCheck.rows.length === 0) {
        const error = new Error('职位不存在');
        error.statusCode = 404;
        error.errorCode = 'JOB_NOT_FOUND';
        throw error;
    }

    // 使用 INSERT ... ON CONFLICT 实现幂等性
    const result = await query(
        `INSERT INTO saved_jobs (user_id, job_id, created_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (user_id, job_id) DO NOTHING
         RETURNING *`,
        [userId, jobId]
    );

    if (result.rows.length === 0) {
        return res.json({
            status: 'success',
            message: '您已经收藏了该职位',
            data: null
        });
    }

    res.json({
        status: 'success',
        message: '收藏成功',
        data: result.rows[0]
    });
}));

// 取消收藏职位
router.delete('/:userId/saved-jobs/:jobId', asyncHandler(async (req, res) => {
    const { userId, jobId } = req.params;

    const result = await query(
        'DELETE FROM saved_jobs WHERE user_id = $1 AND job_id = $2 RETURNING *',
        [userId, jobId]
    );

    res.json({
        status: 'success',
        message: result.rows.length > 0 ? '取消收藏成功' : '您还没有收藏该职位',
        data: result.rows.length > 0 ? result.rows[0] : null
    });
}));

// ==========================================
// Saved Companies Routes (收藏公司) - 必须在 /:userId 之前
// ==========================================

// 获取求职者收藏的公司
router.get('/:userId/saved-companies', asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const result = await query(`
        SELECT 
            c.*,
            sc.created_at as saved_at
        FROM saved_companies sc
        JOIN companies c ON sc.company_id = c.id
        WHERE sc.user_id = $1
        ORDER BY sc.created_at DESC
    `, [userId]);

    res.json({
        status: 'success',
        data: result.rows
    });
}));

// 收藏公司
router.post('/:userId/saved-companies', asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { companyId } = req.body;

    if (!companyId) {
        const error = new Error('请提供公司ID');
        error.statusCode = 400;
        error.errorCode = 'MISSING_COMPANY_ID';
        throw error;
    }

    // 检查公司是否存在
    const companyCheck = await query('SELECT id FROM companies WHERE id = $1', [companyId]);
    if (companyCheck.rows.length === 0) {
        const error = new Error('公司不存在');
        error.statusCode = 404;
        error.errorCode = 'COMPANY_NOT_FOUND';
        throw error;
    }

    // 使用 INSERT ... ON CONFLICT 实现幂等性
    const result = await query(
        `INSERT INTO saved_companies (user_id, company_id, created_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (user_id, company_id) DO NOTHING
         RETURNING *`,
        [userId, companyId]
    );

    if (result.rows.length === 0) {
        return res.json({
            status: 'success',
            message: '您已经收藏了该公司',
            data: null
        });
    }

    res.json({
        status: 'success',
        message: '收藏成功',
        data: result.rows[0]
    });
}));

// 取消收藏公司
router.delete('/:userId/saved-companies/:companyId', asyncHandler(async (req, res) => {
    const { userId, companyId } = req.params;

    const result = await query(
        'DELETE FROM saved_companies WHERE user_id = $1 AND company_id = $2 RETURNING *',
        [userId, companyId]
    );

    res.json({
        status: 'success',
        message: result.rows.length > 0 ? '取消收藏成功' : '您还没有收藏该公司',
        data: result.rows.length > 0 ? result.rows[0] : null
    });
}));

// ==========================================
// Candidate Profile Routes
// ==========================================

// 获取求职者详情 (通过 user_id) - 必须在所有 /:userId/xxx 路由之后
router.get('/:userId', asyncHandler(async (req, res) => {
        const { userId } = req.params;

        const result = await query(
            'SELECT * FROM candidates WHERE user_id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            // 如果没有找到记录，返回空对象而不是404，方便前端处理
            return res.json({
                status: 'success',
                data: null
            });
        }

        res.json({
            status: 'success',
            data: result.rows[0]
        });
}));

// 更新或创建求职者详情 (Upsert)
router.post('/:userId', asyncHandler(async (req, res) => {
        const { userId } = req.params;
        const {
            summary,
            availability_status,
            preferred_locations
        } = req.body;

        let { expected_salary_min, expected_salary_max } = req.body;

        // 数据清洗：将空字符串转换为 null，防止数据库报错
        if (expected_salary_min === '') expected_salary_min = null;
        if (expected_salary_max === '') expected_salary_max = null;

        // 检查是否存在
        const checkResult = await query(
            'SELECT id FROM candidates WHERE user_id = $1',
            [userId]
        );

        let result;

        if (checkResult.rows.length === 0) {
            // Insert
            result = await query(
                `INSERT INTO candidates (
          user_id, summary, expected_salary_min, expected_salary_max, 
          availability_status, preferred_locations, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *`,
                [userId, summary, expected_salary_min, expected_salary_max, availability_status, preferred_locations]
            );
        } else {
            // Update
            result = await query(
                `UPDATE candidates SET 
          summary = $2, 
          expected_salary_min = $3, 
          expected_salary_max = $4, 
          availability_status = $5, 
          preferred_locations = $6, 
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1
        RETURNING *`,
                [userId, summary, expected_salary_min, expected_salary_max, availability_status, preferred_locations]
            );
        }

        res.json({
            status: 'success',
            message: 'Candidate profile saved successfully',
            data: result.rows[0]
        });
}));

module.exports = router;