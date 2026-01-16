// 求职者相关路由
const express = require('express');
const router = express.Router();
const { pool, query } = require('../config/db');
const { asyncHandler, sendSuccessResponse } = require('../middleware/errorHandler');

// ==========================================
// 求职者路由
// ==========================================

// 获取所有求职者 - 优化性能，增加限制
router.get('/', asyncHandler(async (req, res) => {
    const { limit = 50, offset = 0 } = req.query;

    const result = await query(`
        SELECT 
            c.*,
            u.name,
            u.email,
            u.phone,
            u.avatar,
            COALESCE(
                (SELECT school FROM education_experiences 
                WHERE user_id = c.user_id 
                ORDER BY start_date DESC LIMIT 1),
                c.school
            ) as latest_school,
            COALESCE(
                (SELECT degree FROM education_experiences 
                WHERE user_id = c.user_id 
                ORDER BY start_date DESC LIMIT 1),
                c.education
            ) as latest_degree,
            COALESCE(
                (SELECT major FROM education_experiences 
                WHERE user_id = c.user_id 
                ORDER BY start_date DESC LIMIT 1),
                c.major
            ) as latest_major,
            (
                SELECT company_name FROM work_experiences 
                WHERE user_id = c.user_id 
                ORDER BY start_date DESC LIMIT 1
            ) as latest_company,
            (
                SELECT position FROM work_experiences 
                WHERE user_id = c.user_id 
                ORDER BY start_date DESC LIMIT 1
            ) as latest_position,
            (
                SELECT comp.name 
                FROM applications a
                JOIN jobs j ON a.job_id = j.id
                JOIN companies comp ON j.company_id = comp.id
                WHERE a.candidate_id = c.id
                ORDER BY a.created_at DESC LIMIT 1
            ) as latest_application_company,
            (
                SELECT j.title
                FROM applications a
                JOIN jobs j ON a.job_id = j.id
                WHERE a.candidate_id = c.id
                ORDER BY a.created_at DESC LIMIT 1
            ) as latest_application_job_title,
            (
                SELECT u_rec.name 
                FROM applications a
                JOIN jobs j ON a.job_id = j.id
                JOIN recruiters r ON j.recruiter_id = r.id
                JOIN users u_rec ON r.user_id = u_rec.id
                WHERE a.candidate_id = c.id
                ORDER BY a.created_at DESC LIMIT 1
            ) as latest_application_recruiter,
            (
                SELECT COUNT(*) 
                FROM applications a 
                WHERE a.candidate_id = c.id
            ) as application_count
        FROM candidates c
        LEFT JOIN users u ON c.user_id = u.id
        ORDER BY c.created_at DESC
        LIMIT $1 OFFSET $2
    `, [parseInt(limit), parseInt(offset)], 15000);

    // 获取总记录数
    const countResult = await query(`
        SELECT COUNT(*) as total
        FROM candidates
    `, [], 15000);

    sendSuccessResponse(res, {
        rows: result.rows,
        count: parseInt(countResult.rows[0].total),
        page: Math.floor(offset / limit) + 1,
        limit: parseInt(limit)
    }, 200, '获取求职者列表成功');
}));

// ==========================================
// 收藏职位路由 - 必须在 /:userId 之前定义
// ==========================================

// 获取求职者收藏的职位
router.get('/:userId/saved-jobs', asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const userIdNum = parseInt(userId);

    const result = await query(`
        SELECT 
            j.*,
            sj.created_at as saved_at,
            c.name as company_name,
            c.logo as company_logo
        FROM saved_jobs sj
        JOIN jobs j ON sj.job_id = j.id
        LEFT JOIN companies c ON j.company_id = c.id
        WHERE sj.user_id = $1
        ORDER BY sj.created_at DESC
    `, [userIdNum], 15000);

    sendSuccessResponse(res, result.rows, 200, '获取收藏职位成功');
}));

// 收藏职位
router.post('/:userId/saved-jobs', asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const userIdNum = parseInt(userId);
    const { jobId } = req.body;

    if (!jobId) {
        const error = new Error('请提供职位ID');
        error.statusCode = 400;
        error.errorCode = 'MISSING_JOB_ID';
        throw error;
    }

    // 检查职位是否存在
    const jobCheck = await query('SELECT id FROM jobs WHERE id = $1', [jobId], 15000);
    if (jobCheck.rows.length === 0) {
        const error = new Error('职位不存在');
        error.statusCode = 404;
        error.errorCode = 'JOB_NOT_FOUND';
        throw error;
    }

    // 使用 INSERT ... ON CONFLICT 实现幂等性
    const result = await query(
        `INSERT INTO saved_jobs (user_id, job_id, created_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (user_id, job_id) DO NOTHING
         RETURNING *`,
        [userIdNum, jobId],
        15000
    );

    if (result.rows.length === 0) {
        return sendSuccessResponse(res, null, 200, '您已经收藏了该职位');
    }

    sendSuccessResponse(res, result.rows[0], 201, '收藏成功');
}));

// 取消收藏职位
router.delete('/:userId/saved-jobs/:jobId', asyncHandler(async (req, res) => {
    const { userId, jobId } = req.params;
    const userIdNum = parseInt(userId);

    const result = await query(
        'DELETE FROM saved_jobs WHERE user_id = $1 AND job_id = $2 RETURNING *',
        [userIdNum, jobId],
        15000
    );

    sendSuccessResponse(res,
        result.rows.length > 0 ? result.rows[0] : null,
        200,
        result.rows.length > 0 ? '取消收藏成功' : '您还没有收藏该职位'
    );
}));

// ==========================================
// 收藏公司路由 - 必须在 /:userId 之前定义
// ==========================================

// 获取求职者收藏的公司
router.get('/:userId/saved-companies', asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const userIdNum = parseInt(userId);

    const result = await query(`
        SELECT 
            c.*,
            sc.created_at as saved_at
        FROM saved_companies sc
        JOIN companies c ON sc.company_id = c.id
        WHERE sc.user_id = $1
        ORDER BY sc.created_at DESC
    `, [userIdNum], 15000);

    sendSuccessResponse(res, result.rows, 200, '获取收藏公司成功');
}));

// 收藏公司
router.post('/:userId/saved-companies', asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const userIdNum = parseInt(userId);
    const { companyId } = req.body;

    if (!companyId) {
        const error = new Error('请提供公司ID');
        error.statusCode = 400;
        error.errorCode = 'MISSING_COMPANY_ID';
        throw error;
    }

    // 检查公司是否存在
    const companyCheck = await query('SELECT id FROM companies WHERE id = $1', [companyId], 15000);
    if (companyCheck.rows.length === 0) {
        const error = new Error('公司不存在');
        error.statusCode = 404;
        error.errorCode = 'COMPANY_NOT_FOUND';
        throw error;
    }

    // 使用 INSERT ... ON CONFLICT 实现幂等性
    const result = await query(
        `INSERT INTO saved_companies (user_id, company_id, created_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (user_id, company_id) DO NOTHING
         RETURNING *`,
        [userIdNum, companyId],
        15000
    );

    if (result.rows.length === 0) {
        return sendSuccessResponse(res, null, 200, '您已经收藏了该公司');
    }

    sendSuccessResponse(res, result.rows[0], 201, '收藏成功');
}));

// 取消收藏公司
router.delete('/:userId/saved-companies/:companyId', asyncHandler(async (req, res) => {
    const { userId, companyId } = req.params;
    const userIdNum = parseInt(userId);

    const result = await query(
        'DELETE FROM saved_companies WHERE user_id = $1 AND company_id = $2 RETURNING *',
        [userIdNum, companyId],
        15000
    );

    sendSuccessResponse(res,
        result.rows.length > 0 ? result.rows[0] : null,
        200,
        result.rows.length > 0 ? '取消收藏成功' : '您还没有收藏该公司'
    );
}));

// ==========================================
// 求职者个人资料路由
// ==========================================

// 获取求职者详情 (通过 user_id) - 必须在所有 /:userId/xxx 路由之后
router.get('/:userId', asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const result = await query(
        'SELECT * FROM candidates WHERE user_id = $1',
        [userId],
        15000
    );

    if (result.rows.length === 0) {
        // 如果没有找到记录，返回空对象而不是404，方便前端处理
        return sendSuccessResponse(res, null, 200, '未找到求职者信息');
    }

    sendSuccessResponse(res, result.rows[0], 200, '获取求职者信息成功');
}));

// 更新或创建求职者详情 (Upsert - 插入或更新)
router.post('/:userId', asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const {
        summary,
        skills,
        availability_status,
        preferred_locations
    } = req.body;

    let { expected_salary_min, expected_salary_max } = req.body;

    if (expected_salary_min === '') expected_salary_min = null;
    if (expected_salary_max === '') expected_salary_max = null;

    // 确保 skills 存储为字符串 (如果是数组)
    // 假设数据库字段为 TEXT 类型。如果是 JSONB，则应直接传递对象/数组。
    // 为了安全起见，这里统一处理为字符串。
    let skillsValue = skills;
    if (Array.isArray(skills)) {
        skillsValue = JSON.stringify(skills);
    }


    // 检查是否存在
    const checkResult = await query(
        'SELECT id FROM candidates WHERE user_id = $1',
        [userId],
        15000
    );

    let result;
    let message;

    // 准备部分更新的值。如果 req.body 中未定义某字段，则传递 null，
    // 以便在 SQL 中使用 COALESCE 保留原有值。
    const _summary = summary === undefined ? null : summary;
    const _skillsValue = skillsValue === undefined ? null : skillsValue;
    const _expected_salary_min = expected_salary_min === undefined ? null : expected_salary_min;
    const _expected_salary_max = expected_salary_max === undefined ? null : expected_salary_max;
    const _availability_status = availability_status === undefined ? null : availability_status;
    const _preferred_locations = preferred_locations === undefined ? null : preferred_locations;

    if (checkResult.rows.length === 0) {
        // 插入操作 - 通常这里需要完整数据或默认值。
        // 如果是新记录，COALESCE 没有意义，因为没有前值。
        // 但如果仅提供部分字段创建记录，未提供的字段将为 NULL，这是符合预期的。
        result = await query(
            `INSERT INTO candidates (
          user_id, summary, skills, expected_salary_min, expected_salary_max, 
          availability_status, preferred_locations, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *`,
            [userId, summary, skillsValue, expected_salary_min, expected_salary_max, availability_status, preferred_locations],
            15000
        );
        message = '创建求职者信息成功';
    } else {
        // 更新操作 - 使用 COALESCE 保留现有值 (如果是 NULL)
        // 注意：如果前端显式传递 NULL，这里需要区分，但目前 undefined 视为"不更新"。
        result = await query(
            `UPDATE candidates SET 
          summary = COALESCE($2, summary), 
          skills = COALESCE($3, skills),
          expected_salary_min = COALESCE($4, expected_salary_min), 
          expected_salary_max = COALESCE($5, expected_salary_max), 
          availability_status = COALESCE($6, availability_status), 
          preferred_locations = COALESCE($7, preferred_locations), 
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1
        RETURNING *`,
            [userId, _summary, _skillsValue, _expected_salary_min, _expected_salary_max, _availability_status, _preferred_locations],
            15000
        );
        message = '更新求职者信息成功';
    }

    sendSuccessResponse(res, result.rows[0], 200, message);
}));


// ==========================================
// 经验增删改查 (CRUD) 助手函数
// ==========================================

const handleExperienceCRUD = (tableName) => {
    return {
        // 获取用户的所有条目
        getAll: asyncHandler(async (req, res) => {
            const { userId } = req.params;
            const result = await query(
                `SELECT * FROM ${tableName} WHERE user_id = $1 ORDER BY start_date DESC`,
                [userId]
            );
            sendSuccessResponse(res, result.rows, 200, '获取成功');
        }),

        // 创建新条目
        create: asyncHandler(async (req, res) => {
            const { userId } = req.params;
            const data = req.body;

            // 过滤非数据库列的字段
            // 这里为了通用性，暂未实现具体的字段过滤逻辑，建议直接使用具体的路由处理函数。
            throw new Error("Generic create not implemented directly, use specific route handlers.");
        }),

        // 删除条目
        delete: asyncHandler(async (req, res) => {
            const { userId, id } = req.params;
            const result = await query(
                `DELETE FROM ${tableName} WHERE id = $1 AND user_id = $2 RETURNING id`,
                [id, userId]
            );
            if (result.rows.length === 0) {
                const error = new Error('条目不存在或无需删除');
                error.statusCode = 404;
                throw error;
            }
            sendSuccessResponse(res, null, 200, '删除成功');
        })
    };
};

// ==========================================
// 工作经历路由
// ==========================================

router.get('/:userId/work-experiences', asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const result = await query(
        `SELECT * FROM work_experiences WHERE user_id = $1 ORDER BY start_date DESC`,
        [userId]
    );
    sendSuccessResponse(res, result.rows, 200, '获取工作经历成功');
}));

router.post('/:userId/work-experiences', asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { company_name, position, start_date, end_date, description, tags } = req.body;

    const result = await query(
        `INSERT INTO work_experiences (user_id, company_name, position, start_date, end_date, description, tags)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [userId, company_name, position, start_date, end_date, description, tags]
    );
    sendSuccessResponse(res, result.rows[0], 201, '添加工作经历成功');
}));

router.put('/:userId/work-experiences/:id', asyncHandler(async (req, res) => {
    const { userId, id } = req.params;
    const { company_name, position, start_date, end_date, description, tags } = req.body;

    const result = await query(
        `UPDATE work_experiences 
         SET company_name = $1, position = $2, start_date = $3, end_date = $4, description = $5, tags = $6, updated_at = CURRENT_TIMESTAMP
         WHERE id = $7 AND user_id = $8
         RETURNING *`,
        [company_name, position, start_date, end_date, description, tags, id, userId]
    );

    if (result.rows.length === 0) {
        throw new Error('工作经历不存在或无权修改');
    }

    sendSuccessResponse(res, result.rows[0], 200, '更新工作经历成功');
}));

router.delete('/:userId/work-experiences/:id', asyncHandler(async (req, res) => {
    const { userId, id } = req.params;
    const result = await query(
        `DELETE FROM work_experiences WHERE id = $1 AND user_id = $2 RETURNING id`,
        [id, userId]
    );
    if (result.rows.length === 0) {
        throw new Error('工作经历不存在 or 无权删除');
    }
    sendSuccessResponse(res, { id }, 200, '删除工作经历成功');
}));

// ==========================================
// 项目经历路由
// ==========================================

router.get('/:userId/project-experiences', asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const result = await query(
        `SELECT * FROM project_experiences WHERE user_id = $1 ORDER BY start_date DESC`,
        [userId]
    );
    sendSuccessResponse(res, result.rows, 200, '获取项目经历成功');
}));

router.post('/:userId/project-experiences', asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { project_name, role, start_date, end_date, description, project_link } = req.body;

    const result = await query(
        `INSERT INTO project_experiences (user_id, project_name, role, start_date, end_date, description, project_link)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [userId, project_name, role, start_date, end_date, description, project_link]
    );
    sendSuccessResponse(res, result.rows[0], 201, '添加项目经历成功');
}));

router.put('/:userId/project-experiences/:id', asyncHandler(async (req, res) => {
    const { userId, id } = req.params;
    const { project_name, role, start_date, end_date, description, project_link } = req.body;

    const result = await query(
        `UPDATE project_experiences 
         SET project_name = $1, role = $2, start_date = $3, end_date = $4, description = $5, project_link = $6, updated_at = CURRENT_TIMESTAMP
         WHERE id = $7 AND user_id = $8
         RETURNING *`,
        [project_name, role, start_date, end_date, description, project_link, id, userId]
    );

    if (result.rows.length === 0) {
        throw new Error('项目经历不存在或无权修改');
    }

    sendSuccessResponse(res, result.rows[0], 200, '更新项目经历成功');
}));

router.delete('/:userId/project-experiences/:id', asyncHandler(async (req, res) => {
    const { userId, id } = req.params;
    const result = await query(
        `DELETE FROM project_experiences WHERE id = $1 AND user_id = $2 RETURNING id`,
        [id, userId]
    );
    if (result.rows.length === 0) {
        throw new Error('项目经历不存在或无权删除');
    }
    sendSuccessResponse(res, { id }, 200, '删除项目经历成功');
}));

// ==========================================
// 教育经历路由
// ==========================================

router.get('/:userId/education-experiences', asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const result = await query(
        `SELECT * FROM education_experiences WHERE user_id = $1 ORDER BY start_date DESC`,
        [userId]
    );
    sendSuccessResponse(res, result.rows, 200, '获取教育经历成功');
}));

router.post('/:userId/education-experiences', asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { school, major, degree, start_date, end_date, description } = req.body;

    const result = await query(
        `INSERT INTO education_experiences (user_id, school, major, degree, start_date, end_date, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [userId, school, major, degree, start_date, end_date, description]
    );
    sendSuccessResponse(res, result.rows[0], 201, '添加教育经历成功');
}));

router.put('/:userId/education-experiences/:id', asyncHandler(async (req, res) => {
    const { userId, id } = req.params;
    const { school, major, degree, start_date, end_date, description } = req.body;

    const result = await query(
        `UPDATE education_experiences 
         SET school = $1, major = $2, degree = $3, start_date = $4, end_date = $5, description = $6, updated_at = CURRENT_TIMESTAMP
         WHERE id = $7 AND user_id = $8
         RETURNING *`,
        [school, major, degree, start_date, end_date, description, id, userId]
    );

    if (result.rows.length === 0) {
        throw new Error('教育经历不存在或无权修改');
    }

    sendSuccessResponse(res, result.rows[0], 200, '更新教育经历成功');
}));

router.delete('/:userId/education-experiences/:id', asyncHandler(async (req, res) => {
    const { userId, id } = req.params;
    const result = await query(
        `DELETE FROM education_experiences WHERE id = $1 AND user_id = $2 RETURNING id`,
        [id, userId]
    );
    if (result.rows.length === 0) {
        throw new Error('教育经历不存在或无权删除');
    }
    sendSuccessResponse(res, { id }, 200, '删除教育经历成功');
}));


// ==========================================
// 期望职位路由
// ==========================================

router.get('/:userId/expected-positions', asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const result = await query(
        `SELECT * FROM expected_positions WHERE user_id = $1 ORDER BY created_at DESC`,
        [userId]
    );
    sendSuccessResponse(res, result.rows, 200, '获取期望职位成功');
}));

router.post('/:userId/expected-positions', asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { position, industry, salary_min, salary_max, city } = req.body;

    const result = await query(
        `INSERT INTO expected_positions (user_id, position, industry, salary_min, salary_max, city)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [userId, position, industry, salary_min, salary_max, city]
    );
    sendSuccessResponse(res, result.rows[0], 201, '添加期望职位成功');
}));

router.put('/:userId/expected-positions/:id', asyncHandler(async (req, res) => {
    const { userId, id } = req.params;
    const { position, industry, salary_min, salary_max, city } = req.body;

    const result = await query(
        `UPDATE expected_positions 
         SET position = $1, industry = $2, salary_min = $3, salary_max = $4, city = $5, updated_at = CURRENT_TIMESTAMP
         WHERE id = $6 AND user_id = $7
         RETURNING *`,
        [position, industry, salary_min, salary_max, city, id, userId]
    );

    if (result.rows.length === 0) {
        throw new Error('期望职位不存在或无权修改');
    }

    sendSuccessResponse(res, result.rows[0], 200, '更新期望职位成功');
}));

router.delete('/:userId/expected-positions/:id', asyncHandler(async (req, res) => {
    const { userId, id } = req.params;
    const result = await query(
        `DELETE FROM expected_positions WHERE id = $1 AND user_id = $2 RETURNING id`,
        [id, userId]
    );
    if (result.rows.length === 0) {
        throw new Error('期望职位不存在或无权删除');
    }
    sendSuccessResponse(res, { id }, 200, '删除期望职位成功');
}));

module.exports = router;