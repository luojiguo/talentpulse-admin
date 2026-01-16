// 申请相关路由
const express = require('express');
const router = express.Router();
const { pool, query } = require('../config/db');
const { asyncHandler } = require('../middleware/errorHandler');
const { notifyUser, notifyRole } = require('../services/socketService');
const { SERVER_EVENTS } = require('../constants/socketEvents');

// 获取特定候选人的所有申请
router.get('/candidate/:candidateId', asyncHandler(async (req, res) => {
  const { candidateId } = req.params;
  // 查询特定候选人的申请记录，关联职位、公司及用户信息
  const result = await query(`
      SELECT 
        a.id, 
        a.candidate_id AS "candidateId", 
        a.job_id AS "jobId", 
        j.company_id AS "companyId", 
        a.status AS "stage", 
        a.created_at AS "appliedDate",
        a.updated_at AS "updatedDate",
        u.name AS "candidateName",
        j.title AS "jobTitle",
        co.name AS "companyName"
      FROM applications a
      LEFT JOIN candidates c ON a.candidate_id = c.id
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN jobs j ON a.job_id = j.id
      LEFT JOIN companies co ON j.company_id = co.id
      WHERE a.candidate_id = $1 OR c.user_id = $1
      ORDER BY a.created_at DESC
    `, [candidateId]);

  res.json({
    status: 'success',
    data: result.rows,
    count: result.rows.length
  });
}));

// 获取特定职位的所有申请
router.get('/job/:jobId', asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  const result = await query(`
      SELECT 
        a.id, 
        a.candidate_id AS "candidateId", 
        a.job_id AS "jobId", 
        j.company_id AS "companyId", 
        a.status AS "stage", 
        a.created_at AS "appliedDate",
        a.updated_at AS "updatedDate",
        u.name AS "candidateName",
        u.email AS "candidateEmail",
        u.phone AS "candidatePhone",
        j.title AS "jobTitle",
        co.name AS "companyName"
      FROM applications a
      LEFT JOIN candidates c ON a.candidate_id = c.id
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN jobs j ON a.job_id = j.id
      LEFT JOIN companies co ON j.company_id = co.id
      WHERE a.job_id = $1
      ORDER BY a.created_at DESC
    `, [jobId]);

  res.json({
    status: 'success',
    data: result.rows,
    count: result.rows.length
  });
}));

// 获取所有申请 - 优化性能，增加限制
router.get('/', asyncHandler(async (req, res) => {
  const { status, limit = 50, offset = 0 } = req.query;

  let queryText = `
      SELECT 
        a.id, 
        a.candidate_id AS "candidateId", 
        a.job_id AS "jobId", 
        j.company_id AS "companyId", 
        a.status AS "stage", 
        a.match_score AS "matchScore",
        (SELECT COUNT(*) FROM interviews WHERE application_id = a.id) AS "interviewCount",
        a.created_at AS "appliedDate",
        a.updated_at AS "updatedDate",
        u.name AS "candidateName",
        u.email AS "candidateEmail",
        u.phone AS "candidatePhone",
        u.avatar AS "candidateAvatar",
        j.title AS "jobTitle",
        j.location AS "jobLocation",
        j.salary AS "jobSalary",
        co.name AS "companyName",
        co.logo AS "companyLogo"
      FROM applications a
      LEFT JOIN candidates c ON a.candidate_id = c.id
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN jobs j ON a.job_id = j.id
      LEFT JOIN companies co ON j.company_id = co.id
    `;

  // 动态构建查询条件

  const queryParams = [];
  if (status) {
    queryText += ` WHERE a.status = $1`;
    queryParams.push(status);
  }

  queryText += ` ORDER BY a.created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
  queryParams.push(parseInt(limit), parseInt(offset));

  // 执行分页查询，设置较高的超时时间 (10s) 以防数据量大
  const result = await query(queryText, queryParams, 10000);

  res.json({
    status: 'success',
    data: result.rows,
    count: result.rows.length
  });
}));

// 获取单个申请
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await query(`
      SELECT 
        a.id, 
        a.candidate_id AS "candidateId", 
        a.job_id AS "jobId", 
        j.company_id AS "companyId", 
        a.status AS "stage", 
        a.created_at AS "appliedDate",
        a.updated_at AS "updatedDate",
        u.name AS "candidateName",
        j.title AS "jobTitle",
        co.name AS "companyName"
      FROM applications a
      LEFT JOIN candidates c ON a.candidate_id = c.id
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN jobs j ON a.job_id = j.id
      LEFT JOIN companies co ON j.company_id = co.id
      WHERE a.id = $1
    `, [id]);

  if (result.rows.length === 0) {
    const error = new Error('申请记录未找到');
    error.statusCode = 404;
    error.errorCode = 'APPLICATION_NOT_FOUND';
    throw error;
  }

  res.json({
    status: 'success',
    data: result.rows[0]
  });
}));

// 创建新申请
router.post('/', asyncHandler(async (req, res) => {
  const { candidateId, jobId, resumeId, coverLetter, userId } = req.body;

  if (!jobId) {
    const error = new Error('请提供职位ID');
    error.statusCode = 400;
    error.errorCode = 'MISSING_JOB_ID';
    throw error;
  }

  // 支持两种方式：直接传递candidateId，或传递userId自动转换
  let actualCandidateId = candidateId;

  // 如果传递的是userId，优先使用它来获取正确的candidateId
  if (userId) {
    const candidateResult = await query(
      'SELECT id FROM candidates WHERE user_id = $1',
      [userId]
    );

    if (candidateResult.rows.length === 0) {
      // 如果没有candidate记录，创建一个
      const newCandidateResult = await query(
        `INSERT INTO candidates (user_id, created_at, updated_at)
                 VALUES ($1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                 RETURNING id`,
        [userId]
      );
      actualCandidateId = newCandidateResult.rows[0].id;
    } else {
      actualCandidateId = candidateResult.rows[0].id;
    }
  }

  if (!actualCandidateId) {
    const error = new Error('请提供候选人ID或用户ID');
    error.statusCode = 400;
    error.errorCode = 'MISSING_CANDIDATE_ID';
    throw error;
  }

  // 检查是否已经申请过
  const checkResult = await query(
    'SELECT id FROM applications WHERE candidate_id = $1 AND job_id = $2',
    [actualCandidateId, jobId]
  );

  if (checkResult.rows.length > 0) {
    // 如果已经申请过，返回现有申请而不是报错（因为立即沟通也是一种申请方式）
    const existingApplication = await query(
      'SELECT * FROM applications WHERE candidate_id = $1 AND job_id = $2',
      [actualCandidateId, jobId]
    );

    return res.json({
      status: 'success',
      message: '您已经申请过该职位了',
      data: existingApplication.rows[0]
    });
  }

  // 创建申请
  const result = await query(
    `INSERT INTO applications (candidate_id, job_id, resume_id, cover_letter, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'New', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING *`,
    [actualCandidateId, jobId, resumeId || null, coverLetter || null]
  );

  // 更新职位申请人数
  try {
    await query(
      'UPDATE jobs SET applications_count = COALESCE(applications_count, 0) + 1 WHERE id = $1',
      [jobId]
    );

    // 发送实时通知
    // 1. 通知管理员
    notifyRole('admin', SERVER_EVENTS.SYSTEM_NOTIFICATION, {
      type: 'new_application',
      title: '新职位申请',
      message: `有新的候选人申请了职位 ID: ${jobId}`,
      timestamp: new Date(),
      data: result.rows[0]
    });

    // 2. 通知招聘者 (需要先找到职位的招聘者)
    const jobResult = await query('SELECT recruiter_id FROM jobs WHERE id = $1', [jobId]);
    if (jobResult.rows.length > 0) {
      const recruiterId = jobResult.rows[0].recruiter_id;
      const recruiterUser = await query('SELECT user_id FROM recruiters WHERE id = $1', [recruiterId]);
      if (recruiterUser.rows.length > 0) {
        notifyUser(recruiterUser.rows[0].user_id, SERVER_EVENTS.SYSTEM_NOTIFICATION, {
          type: 'new_application',
          title: '收到新申请',
          message: '您的职位收到了一个新的申请',
          timestamp: new Date(),
          data: result.rows[0]
        });
      }
    }
  } catch (updateError) {
    console.error('发送申请通知失败:', updateError);
  }

  res.status(201).json({
    status: 'success',
    message: '职位申请提交成功',
    data: result.rows[0]
  });
}));

// 更新申请状态
router.patch('/:id/status', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body; // notes 接收但不一定存入 applications 表，取决于业务需求

  if (!status) {
    const error = new Error('请提供状态');
    error.statusCode = 400;
    error.errorCode = 'MISSING_STATUS';
    throw error;
  }

  // 更新申请状态 - 仅更新 status 字段，notes 理由如需存储可后续扩展日志表
  const result = await query(
    `UPDATE applications 
     SET status = $1, 
         updated_at = CURRENT_TIMESTAMP 
     WHERE id = $2 
     RETURNING *`,
    [status, id]
  );

  if (result.rows.length === 0) {
    const error = new Error('申请记录未找到');
    error.statusCode = 404;
    error.errorCode = 'APPLICATION_NOT_FOUND';
    throw error;
  }

  res.json({
    status: 'success',
    message: '申请状态已更新',
    data: result.rows[0]
  });
}));

module.exports = router;