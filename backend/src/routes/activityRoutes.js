// 最近动态相关路由
const express = require('express');
const router = express.Router();
const { pool, query } = require('../config/db');
const { asyncHandler } = require('../middleware/errorHandler');

// 获取最近动态
router.get('/', asyncHandler(async (req, res) => {
    // 获取最近的用户注册
    const userActivity = await query(
      `SELECT 
        'user' as type,
        id as activity_id,
        name as user,
        '注册账号' as action,
        '用户' as target,
        created_at as timestamp,
        'success' as status
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 5`
    );

    // 获取最近的公司注册
    const companyActivity = await query(
      `SELECT 
        'company' as type,
        id as activity_id,
        name as user,
        '注册公司' as action,
        '公司' as target,
        created_at as timestamp,
        'success' as status
      FROM companies 
      ORDER BY created_at DESC 
      LIMIT 5`
    );

    // 获取最近的职位发布
    const jobActivity = await query(
      `SELECT 
        'job' as type,
        j.id as activity_id,
        c.name as user,
        '发布职位' as action,
        j.title as target,
        j.created_at as timestamp,
        'success' as status
      FROM jobs j 
      JOIN companies c ON j.company_id = c.id 
      ORDER BY j.created_at DESC 
      LIMIT 5`
    );

    // 获取最近的职位申请
    const applicationActivity = await query(
      `SELECT 
        'application' as type,
        a.id as activity_id,
        u.name as user,
        '申请职位' as action,
        j.title as target,
        a.created_at as timestamp,
        'success' as status
      FROM applications a 
      JOIN users u ON a.candidate_id = u.id 
      JOIN jobs j ON a.job_id = j.id 
      ORDER BY a.created_at DESC 
      LIMIT 5`
    );

    // 合并所有活动并按时间排序
    const allActivity = [
      ...userActivity.rows,
      ...companyActivity.rows,
      ...jobActivity.rows,
      ...applicationActivity.rows
    ];

    // 按时间倒序排序
    allActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // 只返回前10条记录
    const recentActivity = allActivity.slice(0, 10);

    res.json({
      status: 'success',
      data: recentActivity,
      count: recentActivity.length
    });
}));

module.exports = router;