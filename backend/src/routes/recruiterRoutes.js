const express = require('express');
const router = express.Router();
const { pool, query } = require('../config/db');
const { asyncHandler } = require('../middleware/errorHandler');

// 获取招聘者相关职位（自己发布的 + 公司所有职位）
router.get('/jobs', asyncHandler(async (req, res) => {
    const { recruiterId } = req.query;



    if (!recruiterId) {

        const error = new Error('必须提供招聘者ID');
        error.statusCode = 400;
        error.errorCode = 'MISSING_RECRUITER_ID';
        throw error;
    }

    // 首先获取招聘者的公司ID和用户ID
    // 支持通过招聘者ID或用户ID查询

    // 首先尝试将参数视为 user_id 查询 (这是 RecruiterApp 的标准行为)
    // 同时也保留 id = $1 作为备选，但在 SQL 层面优先匹配 user_id
    // 注意：如果 user_id 和 id 碰巧相同但属于不同记录，这确实会产生歧义
    // 鉴于前端传的是 currentUser.id (System User ID)，我们应该优先匹配 user_id

    let recruiterResult = await query(
        'SELECT company_id, user_id, id as recruiter_id FROM recruiters WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
        [recruiterId]
    );

    // 如果没找到，再尝试作为 recruiter_id 查询 (兼容可能的其他调用方式)
    if (recruiterResult.rows.length === 0) {
        recruiterResult = await query(
            'SELECT company_id, user_id, id as recruiter_id FROM recruiters WHERE id = $1 ORDER BY created_at DESC LIMIT 1',
            [recruiterId]
        );
    }



    if (recruiterResult.rows.length === 0) {
        const error = new Error('未找到该招聘者');
        error.statusCode = 404;
        error.errorCode = 'RECRUITER_NOT_FOUND';
        throw error;
    }

    const { company_id, user_id, recruiter_id } = recruiterResult.rows[0];

    if (!company_id) {
        return res.json({
            status: 'success',
            data: [],
            count: 0
        });
    }

    // 获取公司所有职位，包括发布者信息，并确保返回前端期望的字段名
    // 增加查询超时时间到30秒，因为涉及多个JOIN
    const result = await query(`
            SELECT 
                j.id,
                j.title,
                c.name AS company,
                c.name AS company_name,
                j.department,
                j.location,
                j.salary,
                j.description,
                j.type,
                j.recruiter_id AS poster_id,
                j.recruiter_id,
                u.name AS recruiter_name,
                u.avatar AS recruiter_avatar,
                r.position AS recruiter_position,
                COUNT(a.id) AS applicants,
                j.status,
                j.publish_date AS posted_date,
                j.expire_date,
                j.created_at,
                j.updated_at,
                j.required_skills,
                j.preferred_skills,
                j.benefits,
                j.experience,
                j.degree,
                j.work_mode,
                j.job_level,
                j.hiring_count,
                j.urgency,
                CASE WHEN j.recruiter_id = $1 THEN true ELSE false END AS is_own_job
            FROM jobs j
            LEFT JOIN companies c ON j.company_id = c.id
            LEFT JOIN recruiters r ON j.recruiter_id = r.id
            LEFT JOIN users u ON r.user_id = u.id
            LEFT JOIN applications a ON j.id = a.job_id
            WHERE j.company_id = $2
            GROUP BY j.id, c.name, u.name, u.avatar, r.position, r.id
            ORDER BY j.publish_date DESC
        `, [recruiter_id, company_id], 30000);

    // 将后端字段映射为前端期望的格式
    const formattedJobs = result.rows.map(job => ({
        id: job.id,
        title: job.title,
        company: job.company,
        company_name: job.company_name,
        department: job.department || '',
        location: job.location,
        salary: job.salary || '面议',
        description: job.description || '',
        type: job.type || '全职',
        posterId: job.poster_id, // 前端使用posterId
        recruiter_id: job.recruiter_id,
        recruiter_name: job.recruiter_name,
        recruiter_avatar: job.recruiter_avatar,
        recruiter_position: job.recruiter_position || '未知职位',
        applicants: job.applicants,
        status: job.status === 'active' || job.status === 'Active' ? 'Active' : 'Closed',
        posted_date: job.posted_date, // 返回原始日期格式，让前端处理
        expire_date: job.expire_date,
        created_at: job.created_at,
        updated_at: job.updated_at,
        is_own_job: job.is_own_job,
        required_skills: job.required_skills,
        preferred_skills: job.preferred_skills,
        benefits: job.benefits,
        experience: job.experience,
        degree: job.degree,
        work_mode: job.work_mode,
        job_level: job.job_level,
        hiring_count: job.hiring_count,
        urgency: job.urgency
    }));



    res.json({
        status: 'success',
        data: formattedJobs,
        count: formattedJobs.length
    });
}));

// 获取申请招聘者职位的候选人
router.get('/candidates', asyncHandler(async (req, res) => {
    const { recruiterId } = req.query;

    if (!recruiterId) {
        const error = new Error('必须提供招聘者ID');
        error.statusCode = 400;
        error.errorCode = 'MISSING_RECRUITER_ID';
        throw error;
    }

    // 首先获取招聘者ID（支持传入user_id或recruiter_id）
    const recruiterResult = await query(
        'SELECT id FROM recruiters WHERE id = $1 OR user_id = $1',
        [recruiterId]
    );

    if (recruiterResult.rows.length === 0) {
        return res.json({
            status: 'success',
            data: [],
            count: 0
        });
    }

    const actualRecruiterId = recruiterResult.rows[0].id;

    // 增加查询超时时间到30秒，因为涉及多个JOIN
    const result = await query(`
            SELECT DISTINCT
                c.id,
                COALESCE(u.name, '未知候选人') AS name,
                u.email,
                u.phone,
                u.avatar,
                u.id AS user_id,
                COALESCE(c.desired_position, '') AS current_position,
                COALESCE(c.work_experience_years, 0) AS years_of_experience,
                COALESCE(c.education, '') AS education,
                (SELECT school FROM education_experiences WHERE user_id = u.id ORDER BY start_date DESC LIMIT 1) AS school,
                c.skills,
                a.id AS application_id,
                a.job_id,
                COALESCE(j.title, '未知职位') AS job_title,
                COALESCE(a.status, 'pending') AS stage,
                a.created_at AS applied_date,
                (SELECT interview_date FROM interviews WHERE application_id = a.id ORDER BY interview_date DESC, interview_time DESC LIMIT 1) AS latest_interview_date,
                (SELECT interview_time FROM interviews WHERE application_id = a.id ORDER BY interview_date DESC, interview_time DESC LIMIT 1) AS latest_interview_time,
                (SELECT status FROM interviews WHERE application_id = a.id ORDER BY interview_date DESC, interview_time DESC LIMIT 1) AS latest_interview_status,
                r.resume_file_url AS application_resume_url,
                r.resume_file_name AS application_resume_name
            FROM applications a
            LEFT JOIN jobs j ON a.job_id = j.id
            LEFT JOIN candidates c ON a.candidate_id = c.id
            LEFT JOIN users u ON c.user_id = u.id
            LEFT JOIN resumes r ON a.resume_id = r.id
            WHERE j.recruiter_id = $1
            ORDER BY a.created_at DESC
        `, [actualRecruiterId], 30000);



    res.json({
        status: 'success',
        data: result.rows,
        count: result.rows.length
    });
}));

module.exports = router;
