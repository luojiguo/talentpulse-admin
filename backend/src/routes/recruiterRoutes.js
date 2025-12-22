const express = require('express');
const router = express.Router();
const { pool, query } = require('../config/db');
const { asyncHandler } = require('../middleware/errorHandler');

// 获取招聘者相关职位（自己发布的 + 公司所有职位）
router.get('/jobs', asyncHandler(async (req, res) => {
        const { recruiterId } = req.query;

        if (!recruiterId) {
            const error = new Error('Recruiter ID is required');
            error.statusCode = 400;
            error.errorCode = 'MISSING_RECRUITER_ID';
            throw error;
        }

        // 首先获取招聘者的公司ID和用户ID
        // 支持通过招聘者ID或用户ID查询
        const recruiterResult = await query(
            'SELECT company_id, user_id, id as recruiter_id FROM recruiters WHERE id = $1 OR user_id = $1',
            [recruiterId]
        );

        if (recruiterResult.rows.length === 0) {
            const error = new Error('Recruiter not found');
            error.statusCode = 404;
            error.errorCode = 'RECRUITER_NOT_FOUND';
            throw error;
        }

        const { company_id, user_id, recruiter_id } = recruiterResult.rows[0];

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
                COALESCE(j.applications_count, 0) AS applicants,
                j.status,
                j.publish_date AS posted_date,
                j.expire_date,
                j.created_at,
                j.updated_at,
                CASE WHEN j.recruiter_id = $1 THEN true ELSE false END AS is_own_job
            FROM jobs j
            LEFT JOIN companies c ON j.company_id = c.id
            LEFT JOIN recruiters r ON j.recruiter_id = r.id
            LEFT JOIN users u ON r.user_id = u.id
            WHERE j.company_id = $2
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
            status: job.status === 'active' ? 'Active' : 'Closed',
            posted_date: job.posted_date, // 返回原始日期格式，让前端处理
            expire_date: job.expire_date,
            created_at: job.created_at,
            updated_at: job.updated_at,
            is_own_job: job.is_own_job
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
            const error = new Error('Recruiter ID is required');
            error.statusCode = 400;
            error.errorCode = 'MISSING_RECRUITER_ID';
            throw error;
        }

        // 增加查询超时时间到30秒，因为涉及多个JOIN
        const result = await query(`
            SELECT DISTINCT
                c.id,
                u.name,
                u.email,
                u.phone,
                u.avatar,
                u.desired_position AS current_position,
                u.work_experience_years AS years_of_experience,
                u.education,
                u.skills,
                a.id AS application_id,
                a.job_id,
                j.title AS job_title,
                a.status AS stage,
                a.created_at AS applied_date
            FROM applications a
            JOIN jobs j ON a.job_id = j.id
            JOIN candidates c ON a.candidate_id = c.id
            JOIN users u ON c.user_id = u.id
            WHERE j.recruiter_id = $1
            ORDER BY a.created_at DESC
        `, [recruiterId], 30000);

        res.json({
            status: 'success',
            data: result.rows,
            count: result.rows.length
        });
}));

module.exports = router;
