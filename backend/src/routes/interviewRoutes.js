// 面试相关路由
const express = require('express');
const router = express.Router();
const { pool, query } = require('../config/db');
const { asyncHandler } = require('../middleware/errorHandler');

// 获取所有面试
router.get('/', asyncHandler(async (req, res) => {
    const result = await query(`
      SELECT 
        i.id,
        i.application_id AS "applicationId",
        i.interview_date AS "interviewDate",
        i.interview_time AS "interviewTime",
        i.location,
        i.interviewer_id AS "interviewerId",
        i.status,
        i.notes,
        i.interview_round AS "interviewRound",
        i.interview_type AS "interviewType",
        i.interview_topic AS "interviewTopic",
        i.interview_duration AS "interviewDuration",
        i.interviewer_name AS "interviewerName",
        i.interviewer_position AS "interviewerPosition",
        i.interview_result AS "interviewResult",
        i.interview_feedback AS "interviewFeedback",
        a.id AS "applicationId",
        a.candidate_id AS "candidateId",
        a.job_id AS "jobId",
        u.name AS "candidateName",
        j.title AS "jobTitle",
        co.name AS "companyName"
      FROM interviews i
      LEFT JOIN applications a ON i.application_id = a.id
      LEFT JOIN candidates c ON a.candidate_id = c.id
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN jobs j ON a.job_id = j.id
      LEFT JOIN companies co ON j.company_id = co.id
      ORDER BY i.interview_date DESC, i.interview_time DESC
    `);
    
    res.json({
      status: 'success',
      data: result.rows,
      count: result.rows.length
    });
}));

// 获取单个面试
router.get('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await query(`
      SELECT 
        i.id,
        i.application_id AS "applicationId",
        i.interview_date AS "interviewDate",
        i.interview_time AS "interviewTime",
        i.location,
        i.interviewer_id AS "interviewerId",
        i.status,
        i.notes,
        i.interview_round AS "interviewRound",
        i.interview_type AS "interviewType",
        i.interview_topic AS "interviewTopic",
        i.interview_duration AS "interviewDuration",
        i.interviewer_name AS "interviewerName",
        i.interviewer_position AS "interviewerPosition",
        i.interview_result AS "interviewResult",
        i.interview_feedback AS "interviewFeedback",
        a.id AS "applicationId",
        a.candidate_id AS "candidateId",
        a.job_id AS "jobId",
        u.name AS "candidateName",
        j.title AS "jobTitle",
        co.name AS "companyName"
      FROM interviews i
      LEFT JOIN applications a ON i.application_id = a.id
      LEFT JOIN candidates c ON a.candidate_id = c.id
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN jobs j ON a.job_id = j.id
      LEFT JOIN companies co ON j.company_id = co.id
      WHERE i.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      const error = new Error('Interview not found');
      error.statusCode = 404;
      error.errorCode = 'INTERVIEW_NOT_FOUND';
      throw error;
    }
    
    res.json({
      status: 'success',
      data: result.rows[0]
    });
}));

// 根据申请ID获取面试
router.get('/application/:applicationId', asyncHandler(async (req, res) => {
    const { applicationId } = req.params;
    const result = await query(`
      SELECT 
        i.id,
        i.application_id AS "applicationId",
        i.interview_date AS "interviewDate",
        i.interview_time AS "interviewTime",
        i.location,
        i.interviewer_id AS "interviewerId",
        i.status,
        i.notes,
        i.interview_round AS "interviewRound",
        i.interview_type AS "interviewType",
        i.interview_topic AS "interviewTopic",
        i.interview_duration AS "interviewDuration",
        i.interviewer_name AS "interviewerName",
        i.interviewer_position AS "interviewerPosition",
        i.interview_result AS "interviewResult",
        i.interview_feedback AS "interviewFeedback"
      FROM interviews i
      WHERE i.application_id = $1
      ORDER BY i.interview_round ASC, i.interview_date ASC, i.interview_time ASC
    `, [applicationId]);
    
    res.json({
      status: 'success',
      data: result.rows,
      count: result.rows.length
    });
}));

module.exports = router;