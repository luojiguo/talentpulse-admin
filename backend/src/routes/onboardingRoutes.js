const express = require('express');
const router = express.Router();
const { pool, query } = require('../config/db');
const { asyncHandler } = require('../middleware/errorHandler');

const { authenticate } = require('../middleware/auth');

// 对所有路由应用身份验证
router.use(authenticate);

// ------------------- 创建入职记录 -------------------
router.post('/', asyncHandler(async (req, res) => {
    const {
        candidateId,
        recruiterId,
        jobId,
        startDate,
        endDate,
        status = '已安排',
        onboardingType,
        notes,
        onboardingTime,
        onboardingLocation,
        onboardingContact,
        onboardingContactPhone,
        officialSalary,
        probationSalary,
        probationPeriod
    } = req.body;

    // 基础验证
    if (!candidateId || !recruiterId || !jobId || !startDate) {
        return res.status(400).json({
            status: 'error',
            message: '候选人ID、招聘者ID、职位ID和入职日期为必填项',
        });
    }

    // 解析招聘者ID（如果提供的是用户ID）
    const recruiterResult = await query(
        'SELECT id FROM recruiters WHERE id = $1 OR user_id = $1',
        [recruiterId]
    );

    if (recruiterResult.rows.length === 0) {
        return res.status(404).json({
            status: 'error',
            message: '未找到招聘者',
        });
    }
    const realRecruiterId = recruiterResult.rows[0].id;

    const result = await query(
        `INSERT INTO onboardings
       (candidate_id, recruiter_id, job_id, start_date, end_date, status, onboarding_type, notes,
        onboarding_time, onboarding_location, onboarding_contact, onboarding_contact_phone,
        official_salary, probation_salary, probation_period)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
     RETURNING *`,
        [
            candidateId,
            realRecruiterId, // 使用解析后的ID
            jobId,
            startDate,
            endDate,
            status,
            onboardingType,
            notes,
            onboardingTime,
            onboardingLocation,
            onboardingContact,
            onboardingContactPhone,
            officialSalary,
            probationSalary,
            probationPeriod
        ]
    );

    res.json({ status: 'success', data: result.rows[0] });
}));

// ------------------- 获取入职列表（带筛选） -------------------
router.get('/', asyncHandler(async (req, res) => {
    const { candidateId, recruiterId, jobId, status } = req.query;
    const conditions = [];
    const params = [];

    // 是否总是过滤掉软删除或取消的记录？对于招聘者视图可能不需要。

    if (candidateId) { params.push(candidateId); conditions.push(`o.candidate_id = $${params.length}`); }

    // 如果提供了用户ID，则解析招聘者ID
    if (recruiterId) {
        const recruiterResult = await query(
            'SELECT id FROM recruiters WHERE id = $1 OR user_id = $1',
            [recruiterId]
        );
        if (recruiterResult.rows.length > 0) {
            const realRecruiterId = recruiterResult.rows[0].id;
            params.push(realRecruiterId);
            conditions.push(`o.recruiter_id = $${params.length}`);
        } else {
            // 提供的招聘者ID未找到，可能返回空或忽略（返回空更安全）
            params.push(-1); // 不可能的ID
            conditions.push(`o.recruiter_id = $${params.length}`);
        }
    }

    if (jobId) { params.push(jobId); conditions.push(`o.job_id = $${params.length}`); }
    if (jobId) { params.push(jobId); conditions.push(`o.job_id = $${params.length}`); }
    if (status && status !== 'all') { params.push(status); conditions.push(`o.status = $${params.length}`); }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    // 关联表以获取名称
    const sql = `
    SELECT 
        o.*,
        c.user_id as candidate_user_id,
        u_cand.name as candidate_name,
        u_cand.email as candidate_email,
        u_cand.phone as candidate_phone,
        u_cand.avatar as candidate_avatar,
        j.title as job_title,
        j.location as job_location,
        j.salary as job_salary,
        comp.name as company_name,
        comp.logo as company_logo
    FROM onboardings o
    LEFT JOIN candidates c ON o.candidate_id = c.id
    LEFT JOIN users u_cand ON c.user_id = u_cand.id
    LEFT JOIN jobs j ON o.job_id = j.id
    LEFT JOIN companies comp ON j.company_id = comp.id
    ${whereClause} 
    ORDER BY o.start_date DESC
  `;

    const result = await query(sql, params);

    // 格式化为前端所需格式
    const formattedData = result.rows.map(row => ({
        id: row.id,
        candidateId: row.candidate_id,
        recruiterId: row.recruiter_id,
        jobId: row.job_id,
        candidateName: row.candidate_name,
        candidateAvatar: row.candidate_avatar,
        jobTitle: row.job_title,
        companyName: row.company_name,
        companyLogo: row.company_logo,
        onboardingDate: row.start_date,
        endDate: row.end_date,
        status: row.status,
        notes: row.notes,
        candidateEmail: row.candidate_email,
        candidatePhone: row.candidate_phone,
        jobLocation: row.job_location,
        jobSalary: row.job_salary,
        onboardingTime: row.onboarding_time,
        onboardingLocation: row.onboarding_location,
        onboardingContact: row.onboarding_contact,
        onboardingContactPhone: row.onboarding_contact_phone,
        officialSalary: row.official_salary,
        probationSalary: row.probation_salary,
        probationPeriod: row.probation_period
    }));

    res.json({ status: 'success', data: formattedData });
}));

// ------------------- 更新入职记录 -------------------
router.put('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    // 允许更新请求体中传递的任何字段
    // 将前端的小驼峰命名映射为下划线命名
    const fieldMapping = {
        startDate: 'start_date',
        endDate: 'end_date',
        status: 'status',
        onboardingType: 'onboarding_type',
        notes: 'notes',
        onboardingTime: 'onboarding_time',
        onboardingLocation: 'onboarding_location',
        onboardingContact: 'onboarding_contact',
        onboardingContactPhone: 'onboarding_contact_phone',
        officialSalary: 'official_salary',
        probationSalary: 'probation_salary',
        probationPeriod: 'probation_period'
    };

    const fields = [];
    const values = [];

    Object.keys(updates).forEach(key => {
        if (fieldMapping[key]) {
            values.push(updates[key]);
            fields.push(`${fieldMapping[key]} = $${values.length}`);
        }
    });

    if (!fields.length) {
        return res.status(400).json({ status: 'error', message: '没有有效的更新字段' });
    }

    values.push(id); // ID 是最后一个参数
    const result = await query(
        `UPDATE onboardings SET ${fields.join(', ')}
     WHERE id = $${values.length}
     RETURNING *`,
        values
    );

    res.json({ status: 'success', data: result.rows[0] });
}));

// ------------------- 删除（软删除/取消） -------------------
router.delete('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    // 软删除：将状态更改为已取消或根据需要删除。
    // 根据用户“管理”数据的请求，目前实现实际删除
    // 或通过状态进行简单的软删除

    const result = await query(
        `DELETE FROM onboardings WHERE id = $1 RETURNING *`,
        [id]
    );
    // console.log('[DEBUG] DELETE /onboardings/:id affected rows:', result.rowCount);

    if (result.rowCount === 0) {
        return res.status(404).json({ status: 'error', message: '记录未找到' });
    }

    res.json({ status: 'success', message: '记录已删除' });
}));

module.exports = router;
