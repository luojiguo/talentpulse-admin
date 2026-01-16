const express = require('express');
const { pool } = require('../config/db');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// 获取系统日志
router.get('/logs', asyncHandler(async (req, res) => {
  try {
    // 获取查询参数
    // limit: 每页数量, offset: 分页偏移量
    // logType: 日志类型筛选
    // startDate/endDate: 时间范围筛选
    // search: 搜索关键词 (操作、描述、用户ID、用户名、邮箱)
    const { limit = 5, offset = 0, logType, startDate, endDate, search } = req.query;

    // 构建基础查询语句
    // 关联 users 表以获取操作人的详细信息
    let baseQuery = `
      FROM system_logs sl
      LEFT JOIN users u ON sl.user_id = u.id
      WHERE 1=1
    `;
    const queryParams = [];

    // 动态构建查询条件
    if (logType && logType !== 'all') {
      baseQuery += ` AND sl.log_type = $${queryParams.length + 1}`;
      queryParams.push(logType);
    }

    if (startDate) {
      baseQuery += ` AND sl.created_at >= $${queryParams.length + 1}`;
      queryParams.push(startDate);
    }

    if (endDate) {
      baseQuery += ` AND sl.created_at <= $${queryParams.length + 1}`;
      queryParams.push(endDate);
    }

    // 搜索条件：支持多字段模糊搜索
    if (search) {
      baseQuery += ` AND (
        sl.action ILIKE $${queryParams.length + 1} OR 
        sl.description ILIKE $${queryParams.length + 1} OR 
        CAST(sl.user_id AS TEXT) ILIKE $${queryParams.length + 1} OR
        u.name ILIKE $${queryParams.length + 1} OR
        u.email ILIKE $${queryParams.length + 1}
      )`;
      queryParams.push(`%${search}%`);
    }

    // 构建数据查询
    const dataQuery = `
      SELECT sl.*, u.name as user_name, u.email as user_email
      ${baseQuery}
      ORDER BY sl.created_at DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;

    // 构建总数查询
    const countQuery = `SELECT COUNT(*) ${baseQuery}`;

    // 执行数据查询
    const result = await pool.query(dataQuery, [...queryParams, parseInt(limit), parseInt(offset)]);
    const logs = result.rows;

    // 执行总数查询
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].count);

    res.status(200).json({
      status: 'success',
      data: logs,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('获取系统日志失败:', error);
    res.status(500).json({ status: 'error', message: '获取系统日志失败' });
  }
}));

module.exports = router;
