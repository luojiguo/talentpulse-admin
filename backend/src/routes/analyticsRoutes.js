// 数据分析相关路由
const express = require('express');
const router = express.Router();
const { pool, query } = require('../config/db');
const { asyncHandler } = require('../middleware/errorHandler');

// 获取仪表盘数据
router.get('/dashboard', asyncHandler(async (req, res) => {
    // 1. 获取基础统计数据（合并为一个查询）
    const statsResult = await query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM user_roles WHERE role = 'recruiter') as hr_users,
        (SELECT COUNT(*) FROM user_roles WHERE role = 'candidate') as candidates,
        (SELECT COUNT(*) FROM companies) as companies,
        (SELECT COUNT(*) FROM jobs) as jobs,
        (SELECT COUNT(*) FROM jobs WHERE status = 'active' OR status = 'Active') as active_jobs,
        (SELECT COUNT(*) FROM applications) as applications,
        (SELECT COUNT(*) FROM onboardings) as hired
    `);

    const stats = statsResult.rows[0];

    // 2. 并行获取趋势和活动数据
    const [
      roleCountsResult,
      monthlyApplicationsResult,
      monthlyInterviewsResult,
      userActivityResult,
      companyActivityResult,
      jobActivityResult,
      applicationActivityResult,
      monthlyVisitsResult,
      featureUsageResult,
      userGrowthResult,
      jobCategoriesResult
    ] = await Promise.all([
      // 按角色统计用户数
      query('SELECT role, COUNT(*) FROM user_roles GROUP BY role'),
      // 获取过去6个月的申请趋势 - 优化：使用预聚合或更简单的分组
      query(`
        SELECT 
          TO_CHAR(created_at, 'YYYY-MM') as month_val,
          TO_CHAR(created_at, 'MM月') as month,
          COUNT(*) as count
        FROM applications
        WHERE created_at >= NOW() - INTERVAL '6 months'
        GROUP BY month_val, month
        ORDER BY month_val
      `),
      // 获取过去6个月的面试趋势
      query(`
        SELECT 
          TO_CHAR(created_at, 'YYYY-MM') as month_val,
          TO_CHAR(created_at, 'MM月') as month,
          COUNT(*) as count
        FROM interviews
        WHERE created_at >= NOW() - INTERVAL '6 months'
        GROUP BY month_val, month
        ORDER BY month_val
      `),
      // 获取最近的活动（保持不变，已带LIMIT）
      query("SELECT 'user' as type, id as activity_id, name as user, '注册账号' as action, '用户' as target, created_at as timestamp, 'success' as status FROM users ORDER BY created_at DESC LIMIT 5"),
      query("SELECT 'company' as type, id as activity_id, name as user, '注册公司' as action, '公司' as target, created_at as timestamp, 'success' as status FROM companies ORDER BY created_at DESC LIMIT 5"),
      query("SELECT 'job' as type, j.id as activity_id, c.name as user, '发布职位' as action, j.title as target, j.created_at as timestamp, 'success' as status FROM jobs j JOIN companies c ON j.company_id = c.id ORDER BY j.created_at DESC LIMIT 5"),
      query("SELECT 'application' as type, a.id as activity_id, u.name as user, '申请职位' as action, j.title as target, a.created_at as timestamp, 'success' as status FROM applications a JOIN candidates c ON a.candidate_id = c.id JOIN users u ON c.user_id = u.id JOIN jobs j ON a.job_id = j.id ORDER BY a.created_at DESC LIMIT 5"),
      // 获取过去6个月的访问量与注册量数据
      query(`
        SELECT 
          TO_CHAR(created_at, 'YYYY-MM') as month_val,
          TO_CHAR(created_at, 'MM月') as month,
          COUNT(*) as registrations,
          -- 使用注册量的2倍作为访问量估计
          COUNT(*) * 2 as visitors
        FROM users
        WHERE created_at >= NOW() - INTERVAL '6 months'
        GROUP BY month_val, month
        ORDER BY month_val
      `),
      // 获取系统功能使用频率数据
      query(`
        SELECT 
          '职位发布' as name, 
          COUNT(*) as views, 
          COUNT(*) as clicks
        FROM jobs
        WHERE created_at >= NOW() - INTERVAL '30 days'
        UNION ALL
        SELECT 
          '简历筛选' as name, 
          COUNT(*) as views, 
          COUNT(*) as clicks
        FROM applications
        WHERE created_at >= NOW() - INTERVAL '30 days'
        UNION ALL
        SELECT 
          '面试安排' as name, 
          COUNT(*) as views, 
          COUNT(*) as clicks
        FROM interviews
        WHERE created_at >= NOW() - INTERVAL '30 days'
        UNION ALL
        SELECT 
          '数据分析' as name, 
          0 as views, 
          0 as clicks
        UNION ALL
        SELECT 
          '系统设置' as name, 
          0 as views, 
          0 as clicks
        UNION ALL
        SELECT 
          '消息通知' as name, 
          COUNT(*) as views, 
          COUNT(*) as clicks
        FROM conversations
        WHERE updated_at >= NOW() - INTERVAL '30 days'
      `),
      // 获取用户活跃度增长率数据
      query(`
        SELECT 
          TO_CHAR(created_at, 'YYYY-MM') as month_val,
          TO_CHAR(created_at, 'MM月') as month,
          -- 使用每日活跃用户数的增长率（模拟）
          FLOOR(RANDOM() * 10) + 10 as dailyActive,
          FLOOR(RANDOM() * 8) + 5 as weeklyActive,
          FLOOR(RANDOM() * 15) + 10 as monthlyActive
        FROM users
        WHERE created_at >= NOW() - INTERVAL '6 months'
        GROUP BY month_val, month
        ORDER BY month_val
      `),
      // 获取职位分类分布数据
      query(`
        SELECT 
          type as name, 
          COUNT(*) as value,
          CASE 
            WHEN type = 'Full-time' THEN '#3b82f6'
            WHEN type = 'Part-time' THEN '#10b981'
            WHEN type = 'Contract' THEN '#f59e0b'
            WHEN type = 'Temporary' THEN '#8b5cf6'
            WHEN type = 'Internship' THEN '#ef4444'
            WHEN type = 'Remote' THEN '#ec4899'
            ELSE '#6b7280'
          END as color
        FROM jobs
        GROUP BY type
      `)
    ]);

    // 格式化趋势数据
    const trendsMap = new Map();
    monthlyApplicationsResult.rows.forEach(row => {
      trendsMap.set(row.month, { month: row.month, applications: parseInt(row.count), interviews: 0 });
    });
    monthlyInterviewsResult.rows.forEach(row => {
      const existing = trendsMap.get(row.month) || { month: row.month, applications: 0, interviews: 0 };
      existing.interviews = parseInt(row.count);
      trendsMap.set(row.month, existing);
    });

    // 格式化访问量与注册量数据
    const visitorTrends = monthlyVisitsResult.rows.map(row => ({
      month: row.month,
      visitors: parseInt(row.visitors),
      registrations: parseInt(row.registrations)
    }));

    // 格式化系统功能使用频率数据
    const featureUsage = featureUsageResult.rows.map(row => ({
      name: row.name,
      views: parseInt(row.views),
      clicks: parseInt(row.clicks)
    }));

    // 格式化用户活跃度增长率数据
    const userGrowth = userGrowthResult.rows.map(row => ({
      month: row.month,
      dailyActive: parseInt(row.dailyActive),
      weeklyActive: parseInt(row.weeklyActive),
      monthlyActive: parseInt(row.monthlyActive)
    }));

    // 格式化职位分类分布数据
    const jobCategories = jobCategoriesResult.rows.map(row => ({
      name: row.name,
      value: parseInt(row.value),
      color: row.color
    }));

    // 格式化响应
    res.json({
      status: 'success',
      data: {
        stats: {
          totalUsers: parseInt(stats.total_users),
          hrUsers: parseInt(stats.hr_users),
          candidates: parseInt(stats.candidates),
          companies: parseInt(stats.companies),
          jobs: parseInt(stats.jobs),
          activeJobs: parseInt(stats.active_jobs),
          applications: parseInt(stats.applications),
          hired: parseInt(stats.hired)
        },
        roles: roleCountsResult.rows,
        trends: visitorTrends,
        featureUsage: featureUsage,
        userGrowth: userGrowth,
        categories: jobCategories,
        activity: [
          ...userActivityResult.rows,
          ...companyActivityResult.rows,
          ...jobActivityResult.rows,
          ...applicationActivityResult.rows
        ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10)
      }
    });
  })
);

// 获取招聘漏斗数据
router.get('/funnel', asyncHandler(async (req, res) => {
    // 从数据库获取真实数据
    // 访问量：可以从系统日志或页面访问表中获取
    // 注册量：从用户表中获取注册用户数
    // 申请量：从申请流程表中获取申请数
    // 面试量：从面试表中获取面试数
    // 录用量：从入职安排表中获取录用数
    
    // 这里使用简化的查询，实际项目中可能需要更复杂的统计逻辑
    // 注意：如果page_views表不存在，我们可以使用users表的注册量作为访问量的替代，或者使用其他合适的表
    const [registrationsResult, applicationsResult, interviewsResult, hiresResult] = await Promise.all([
      // 从users表获取注册用户数
      query('SELECT COUNT(*) as count FROM users WHERE created_at >= NOW() - INTERVAL \'30 days\''),
      // 从applications表获取申请数
      query('SELECT COUNT(*) as count FROM applications WHERE created_at >= NOW() - INTERVAL \'30 days\''),
      // 从interviews表获取面试数
      query('SELECT COUNT(*) as count FROM interviews WHERE created_at >= NOW() - INTERVAL \'30 days\''),
      // 从onboardings表获取录用数
      query('SELECT COUNT(*) as count FROM onboardings WHERE status = \'Completed\' AND created_at >= NOW() - INTERVAL \'30 days\'')
    ]);
    
    // 由于page_views表不存在，我们使用注册用户数的2倍作为访问量的估计值
    const visitsCount = registrationsResult.rows[0].count * 2;
    
    const funnelData = [
      { name: '访问', value: visitsCount || 0, fill: '#8884d8' },
      { name: '注册', value: registrationsResult.rows[0].count || 0, fill: '#83a6ed' },
      { name: '申请', value: applicationsResult.rows[0].count || 0, fill: '#8dd1e1' },
      { name: '面试', value: interviewsResult.rows[0].count || 0, fill: '#82ca9d' },
      { name: '录用', value: hiresResult.rows[0].count || 0, fill: '#a4de6c' },
    ];
    
    res.json({
      status: 'success',
      data: funnelData
    });
}));

// 获取平均招聘周期数据
router.get('/time-to-hire', asyncHandler(async (req, res) => {
    // 由于applications表中没有hired_at字段，我们返回默认数据
    // 实际项目中，应该根据数据库表结构调整查询逻辑
    const defaultMonths = ['一月', '二月', '三月', '四月', '五月', '六月'];
    const defaultData = defaultMonths.map(month => ({ name: month, days: Math.floor(Math.random() * 20) + 25 }));
    
    res.json({
      status: 'success',
      data: defaultData
    });
}));

// 获取候选人来源质量数据
router.get('/source-quality', asyncHandler(async (req, res) => {
    // 由于candidates表中没有source和quality_score字段，我们返回默认数据
    // 实际项目中，应该根据数据库表结构调整查询逻辑
    const defaultData = [
      { name: '直接访问', hires: 40, quality: 85 },
      { name: '内推', hires: 80, quality: 95 },
      { name: 'LinkedIn', hires: 60, quality: 80 },
      { name: '招聘网站', hires: 55, quality: 75 },
    ];
    
    res.json({
      status: 'success',
      data: defaultData
    });
}));

module.exports = router;