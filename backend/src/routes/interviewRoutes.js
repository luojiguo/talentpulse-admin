// 面试相关路由
const express = require('express');
const router = express.Router();
const { pool, query } = require('../config/db');
const { asyncHandler } = require('../middleware/errorHandler');

// 获取所有面试，支持按照 userId 和 role 过滤
router.get('/', asyncHandler(async (req, res) => {
    const { userId, role } = req.query;
    console.log(`[DEBUG] GET /interviews - Fetching interviews, role: ${role}, userId: ${userId}`);

    let queryText = `
      SELECT 
        i.id,
        i.application_id AS "applicationId",
        i.interview_date AS "interviewDate",
        i.interview_time AS "interviewTime",
        i.interview_time_end AS "interviewTimeEnd",
        i.location,
        i.interviewer_id AS "interviewerId",
        i.status,
        i.notes,
        i.interview_round AS "interviewRound",
        i.interviewer_name AS "interviewerName",
        i.interviewer_position AS "interviewerPosition",
        i.interview_result AS "interviewResult",
        i.interview_feedback AS "interviewFeedback",
        a.id AS "applicationId",
        a.candidate_id AS "candidateId",
        a.job_id AS "jobId",
        u.name AS "candidateName",
        u.email AS "candidateEmail",
        u.phone AS "candidatePhone",
        u.avatar AS "candidateAvatar",
        j.title AS "jobTitle",
        j.location AS "jobLocation",
        j.salary AS "jobSalary",
        co.name AS "companyName",
        co.logo AS "companyLogo"
      FROM interviews i
      LEFT JOIN applications a ON i.application_id = a.id
      LEFT JOIN candidates c ON a.candidate_id = c.id
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN jobs j ON a.job_id = j.id
      LEFT JOIN companies co ON j.company_id = co.id
    `;

    const queryParams = [];
    if (userId && role === 'candidate') {
        queryText += ` WHERE u.id = $1`;
        queryParams.push(userId);
    } else if (userId && role === 'recruiter') {
        // 对于招聘者，还需要关联 recruiters 表来通过 user_id 过滤
        queryText += ` JOIN recruiters r ON i.interviewer_id = r.id WHERE r.user_id = $1`;
        queryParams.push(userId);
    }

    queryText += ` ORDER BY i.interview_date DESC, i.interview_time DESC`;

    const result = await query(queryText, queryParams);

    console.log('[DEBUG] Interviews query returned', result.rows.length, 'rows');

    res.json({
        status: 'success',
        data: result.rows,
        count: result.rows.length
    });
}));

// 获取单个面试
router.get('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    console.log('[DEBUG] GET /interviews/:id - id:', id);
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
        i.interviewer_name AS "interviewerName",
        i.interviewer_position AS "interviewerPosition",
        i.interview_result AS "interviewResult",
        i.interview_feedback AS "interviewFeedback",
        a.id AS "applicationId",
        a.candidate_id AS "candidateId",
        a.job_id AS "jobId",
        u.name AS "candidateName",
        u.avatar AS "candidateAvatar",
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

    console.log('[DEBUG] Interview query returned', result.rows.length, 'rows');

    if (result.rows.length === 0) {
        console.error('[ERROR] Interview not found for id:', id);
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
    try {
        const {
            applicationId,
            interviewDate,
            interviewTime,
            location,
            interviewerId,
            status = 'scheduled',
            notes,
            interviewRound = 1,
            interviewerName,
            interviewerPosition,
            interviewTimeEnd,
            interviewPosition
        } = req.body;

        console.log('[DEBUG] POST /interviews - payload:', JSON.stringify(req.body));

        // 验证必填字段
        if (!applicationId || !interviewDate || !interviewTime) {
            console.error('[ERROR] POST /interviews - Missing required fields');
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
            SELECT j.title AS jobTitle, co.name AS companyName, co.address AS companyLocation
            FROM jobs j
            LEFT JOIN companies co ON j.company_id = co.id
            WHERE j.id = (SELECT job_id FROM applications WHERE id = $1)
        `, [applicationId]);

        let finalLocation = location;
        if (!location && jobInfo.rows.length > 0) {
            finalLocation = jobInfo.rows[0].companyLocation;
        }

        // 查找招聘者ID (interviewerId from frontend is actually User ID)
        let finalInterviewerId = interviewerId;
        try {
            const recruiterQuery = await query('SELECT id FROM recruiters WHERE user_id = $1', [interviewerId]);
            if (recruiterQuery.rows.length > 0) {
                finalInterviewerId = recruiterQuery.rows[0].id;
                console.log(`[DEBUG] Mapped User ID ${interviewerId} to Recruiter ID ${finalInterviewerId}`);
            } else {
                console.warn(`[WARNING] No recruiter found for User ID ${interviewerId}. Using original ID.`);
                // If checking by ID directly finds it, then it was already a recruiter ID
                const checkRecruiter = await query('SELECT id FROM recruiters WHERE id = $1', [interviewerId]);
                if (checkRecruiter.rows.length === 0) {
                    console.error(`[ERROR] ID ${interviewerId} not found in recruiters table as id or user_id`);
                }
            }
        } catch (err) {
            console.error('[ERROR] Failed to map interviewer ID:', err);
        }

        const result = await query(`
            INSERT INTO interviews (
                application_id,
                interview_date,
                interview_time,
                interview_time_end,
                location,
                interviewer_id,
                status,
                notes,
                interview_round,
                interviewer_name,
                interviewer_position,
                "Interview_Position"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *
        `, [
            applicationId,
            interviewDate,
            interviewTime,
            interviewTimeEnd,
            finalLocation,
            finalInterviewerId,
            status,
            notes,
            interviewRound,
            interviewerName,
            interviewerPosition,
            interviewPosition
        ]);

        console.log('[DEBUG] Interview created successfully, id:', result.rows[0].id);

        res.status(201).json({
            status: 'success',
            data: result.rows[0],
            message: '面试邀请创建成功'
        });
    } catch (error) {
        console.error('[ERROR] Failed to create interview:', error);
        throw error;
    }
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

    const updatedInterview = result.rows[0];

    // 发送Socket.IO事件通知招聘方
    try {
        const { getIo } = require('../services/socketService');
        const { ROOM_PREFIXES } = require('../constants/socketEvents');
        const io = getIo();

        // 获取招聘方用户ID（从面试记录中的interviewer_id关联的recruiters表）
        if (updatedInterview.interviewer_id) {
            // interviewer_id 存储的是 recruiters.id，需要获取对应的 user_id
            const recruiterResult = await query('SELECT user_id FROM recruiters WHERE id = $1', [updatedInterview.interviewer_id]);

            if (recruiterResult.rows.length > 0) {
                const recruiterUserId = recruiterResult.rows[0].user_id;

                // 通知招聘方面试状态已更新
                io.to(`${ROOM_PREFIXES.USER}${recruiterUserId}`).emit('interview_status_updated', {
                    interviewId: id,
                    status: status,
                    interview: updatedInterview,
                    message: status === 'accepted' ? '候选人已接受面试邀请' : '候选人已拒绝面试邀请'
                });

                console.log(`Notified recruiter user ${recruiterUserId} about interview ${id} status change to ${status}`);
            } else {
                // 如果找不到对应的招聘者记录，尝试回退到原始ID（兼容性处理）
                io.to(`${ROOM_PREFIXES.USER}${updatedInterview.interviewer_id}`).emit('interview_status_updated', {
                    interviewId: id,
                    status: status,
                    interview: updatedInterview,
                    message: status === 'accepted' ? '候选人已接受面试邀请' : '候选人已拒绝面试邀请'
                });
                console.warn(`[WARNING] Recruiter not found for ID ${updatedInterview.interviewer_id}. Sending to fallback room.`);
            }
        }
    } catch (socketError) {
        console.error('Failed to send Socket.IO notification:', socketError);
        // 不影响主流程，继续返回成功响应
    }

    res.json({
        status: 'success',
        data: updatedInterview,
        message: '面试状态更新成功'
    });
}));

module.exports = router;