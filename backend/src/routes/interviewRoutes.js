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

// 创建面试
router.post('/', asyncHandler(async (req, res) => {
    const {
        applicationId,
        interviewDate,
        interviewTime,
        location,
        interviewerId,
        status = 'scheduled',
        notes,
        interviewRound = 1,
        interviewType,
        interviewTopic,
        interviewDuration = 60,
        interviewerName,
        interviewerPosition
    } = req.body;

    // 验证必填字段
    if (!applicationId || !interviewDate || !interviewTime || !interviewType) {
        const error = new Error('缺少必填字段');
        error.statusCode = 400;
        error.errorCode = 'MISSING_REQUIRED_FIELDS';
        throw error;
    }

    // 检查申请是否存在
    const applicationCheck = await query('SELECT * FROM applications WHERE id = $1', [applicationId]);
    if (applicationCheck.rows.length === 0) {
        const error = new Error('申请不存在');
        error.statusCode = 404;
        error.errorCode = 'APPLICATION_NOT_FOUND';
        throw error;
    }

    // 获取职位和公司信息，用于面试详情
    const jobInfo = await query(`
        SELECT j.title AS jobTitle, co.name AS companyName, co.location AS companyLocation
        FROM jobs j
        LEFT JOIN companies co ON j.company_id = co.id
        WHERE j.id = (SELECT job_id FROM applications WHERE id = $1)
    `, [applicationId]);

    let finalLocation = location;
    if (!location && jobInfo.rows.length > 0) {
        finalLocation = jobInfo.rows[0].companyLocation;
    }

    const result = await query(`
        INSERT INTO interviews (
            application_id,
            interview_date,
            interview_time,
            location,
            interviewer_id,
            status,
            notes,
            interview_round,
            interview_type,
            interview_topic,
            interview_duration,
            interviewer_name,
            interviewer_position
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
    `, [
        applicationId,
        interviewDate,
        interviewTime,
        finalLocation,
        interviewerId,
        status,
        notes,
        interviewRound,
        interviewType,
        interviewTopic,
        interviewDuration,
        interviewerName,
        interviewerPosition
    ]);

    res.status(201).json({
        status: 'success',
        data: result.rows[0],
        message: '面试邀请创建成功'
    });
}));

// 更新面试
router.patch('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
        interviewDate,
        interviewTime,
        location,
        interviewerId,
        status,
        notes,
        interviewRound,
        interviewType,
        interviewTopic,
        interviewDuration,
        interviewerName,
        interviewerPosition,
        interviewResult,
        interviewFeedback
    } = req.body;

    // 检查面试是否存在
    const interviewCheck = await query('SELECT * FROM interviews WHERE id = $1', [id]);
    if (interviewCheck.rows.length === 0) {
        const error = new Error('面试不存在');
        error.statusCode = 404;
        error.errorCode = 'INTERVIEW_NOT_FOUND';
        throw error;
    }

    // 构建更新字段和值
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (interviewDate !== undefined) {
        updateFields.push(`interview_date = $${paramIndex++}`);
        updateValues.push(interviewDate);
    }
    if (interviewTime !== undefined) {
        updateFields.push(`interview_time = $${paramIndex++}`);
        updateValues.push(interviewTime);
    }
    if (location !== undefined) {
        updateFields.push(`location = $${paramIndex++}`);
        updateValues.push(location);
    }
    if (interviewerId !== undefined) {
        updateFields.push(`interviewer_id = $${paramIndex++}`);
        updateValues.push(interviewerId);
    }
    if (status !== undefined) {
        updateFields.push(`status = $${paramIndex++}`);
        updateValues.push(status);
    }
    if (notes !== undefined) {
        updateFields.push(`notes = $${paramIndex++}`);
        updateValues.push(notes);
    }
    if (interviewRound !== undefined) {
        updateFields.push(`interview_round = $${paramIndex++}`);
        updateValues.push(interviewRound);
    }
    if (interviewType !== undefined) {
        updateFields.push(`interview_type = $${paramIndex++}`);
        updateValues.push(interviewType);
    }
    if (interviewTopic !== undefined) {
        updateFields.push(`interview_topic = $${paramIndex++}`);
        updateValues.push(interviewTopic);
    }
    if (interviewDuration !== undefined) {
        updateFields.push(`interview_duration = $${paramIndex++}`);
        updateValues.push(interviewDuration);
    }
    if (interviewerName !== undefined) {
        updateFields.push(`interviewer_name = $${paramIndex++}`);
        updateValues.push(interviewerName);
    }
    if (interviewerPosition !== undefined) {
        updateFields.push(`interviewer_position = $${paramIndex++}`);
        updateValues.push(interviewerPosition);
    }
    if (interviewResult !== undefined) {
        updateFields.push(`interview_result = $${paramIndex++}`);
        updateValues.push(interviewResult);
    }
    if (interviewFeedback !== undefined) {
        updateFields.push(`interview_feedback = $${paramIndex++}`);
        updateValues.push(interviewFeedback);
    }

    // 执行更新
    const result = await query(`
        UPDATE interviews 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
    `, [...updateValues, id]);

    res.json({
        status: 'success',
        data: result.rows[0],
        message: '面试信息更新成功'
    });
}));

// 更新面试状态
router.patch('/:id/status', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    // 验证状态值
    const validStatuses = ['scheduled', 'completed', 'cancelled', 'accepted', 'rejected'];
    if (!status || !validStatuses.includes(status)) {
        const error = new Error('无效的状态值');
        error.statusCode = 400;
        error.errorCode = 'INVALID_STATUS';
        throw error;
    }

    // 检查面试是否存在
    const interviewCheck = await query('SELECT * FROM interviews WHERE id = $1', [id]);
    if (interviewCheck.rows.length === 0) {
        const error = new Error('面试不存在');
        error.statusCode = 404;
        error.errorCode = 'INTERVIEW_NOT_FOUND';
        throw error;
    }

    const result = await query(`
        UPDATE interviews 
        SET status = $1
        WHERE id = $2
        RETURNING *
    `, [status, id]);

    res.json({
        status: 'success',
        data: result.rows[0],
        message: '面试状态更新成功'
    });
}));

module.exports = router;