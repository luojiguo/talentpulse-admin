const express = require('express');
const { pool } = require('../config/db');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// 获取系统日志
router.get('/logs', asyncHandler(async (req, res) => {
  try {
    const { limit = 5, offset = 0, logType, startDate, endDate } = req.query;
    
    let query = `
      SELECT * FROM system_logs
      WHERE 1=1
    `;
    const queryParams = [];
    
    if (logType && logType !== 'all') {
      query += ` AND log_type = $${queryParams.length + 1}`;
      queryParams.push(logType);
    }
    
    if (startDate) {
      query += ` AND created_at >= $${queryParams.length + 1}`;
      queryParams.push(startDate);
    }
    
    if (endDate) {
      query += ` AND created_at <= $${queryParams.length + 1}`;
      queryParams.push(endDate);
    }
    
    query += ` ORDER BY created_at DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(parseInt(limit), parseInt(offset));
    
    const result = await pool.query(query, queryParams);
    const logs = result.rows;
    
    // 获取总数用于分页
    const countQuery = `
      SELECT COUNT(*) FROM system_logs
      WHERE 1=1
    `;
    const countResult = await pool.query(countQuery, queryParams.slice(0, -2));
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
