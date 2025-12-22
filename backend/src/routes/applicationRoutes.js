// 申请相关路由
const express = require('express');
const router = express.Router();
const { pool, query } = require('../config/db');
const { asyncHandler } = require('../middleware/errorHandler');

// 获取特定候选人的所有申请
router.get('/candidate/:candidateId', asyncHandler(async (req, res) => {
    const { candidateId } = req.params;
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
    `;
    
    const queryParams = [];
    if (status) {
        queryText += ` WHERE a.status = $1`;
        queryParams.push(status);
    }
    
    queryText += ` ORDER BY a.created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(parseInt(limit), parseInt(offset));
    
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
      const error = new Error('Application not found');
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
    
    // 如果传递的是userId，需要转换为candidateId
    if (userId && !candidateId) {
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
    
    res.status(201).json({
        status: 'success',
        message: '职位申请提交成功',
        data: result.rows[0]
    });
}));

module.exports = router;