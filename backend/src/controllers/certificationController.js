const { pool, query } = require('../config/db');
const AppError = require('../utils/AppError');
const fs = require('fs');
const { sendCertificationResultEmail } = require('../services/emailService');

/**
 * 提交企业认证
 */
exports.submitCertification = async (req, res) => {
    const userId = req.user.id;
    const {
        company_name,
        company_address,
        company_size,
        company_industry,
        company_description,
        website,
        contact_name,
        contact_phone,
        social_credit_code
    } = req.body;

    console.log('[Certification] User submitting:', userId, req.body);

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. 获取招聘者信息
        const recruiterRes = await client.query(
            'SELECT company_id, id FROM recruiter_user WHERE user_id = $1',
            [userId]
        );

        if (recruiterRes.rows.length === 0) {
            throw new AppError('招聘者账户不存在', 404, 'RECRUITER_NOT_FOUND');
        }

        // 2. 处理营业执照上传
        let business_license = req.file ? `/business_license/${req.file.filename}` : undefined;

        console.log('[Certification] File uploaded:', business_license);
        if (!business_license) {
            console.warn('[Certification] No file uploaded');
        }

        // 3. Determine Company Logic (Update or Switch)
        let company_id;
        let isSwitchingCompany = false;
        const currentCompanyId = recruiterRes.rows[0].company_id;

        if (currentCompanyId) {
            // Check current company's social credit code
            const currentCompanyRes = await client.query('SELECT social_credit_code FROM companies WHERE id = $1', [currentCompanyId]);
            const currentCode = currentCompanyRes.rows[0]?.social_credit_code;

            // If social_credit_code provided and different, assume switching company
            if (social_credit_code && currentCode !== social_credit_code) {
                isSwitchingCompany = true;
                console.log(`[Certification] User ${userId} switching company from ${currentCode} to ${social_credit_code}`);
            } else {
                company_id = currentCompanyId;
            }
        } else {
            // No current company, effectively "switching" to a new one (or creating first one)
            isSwitchingCompany = true;
        }

        if (isSwitchingCompany) {
            // Check if target company exists
            const targetCompanyRes = await client.query('SELECT id FROM companies WHERE social_credit_code = $1', [social_credit_code]);

            if (targetCompanyRes.rows.length > 0) {
                // Link to existing company
                company_id = targetCompanyRes.rows[0].id;
                // Optional: Update that company's details if needed, but usually we just link. 
                // Let's minimally update fields if provided to ensure they are fresh? 
                // Or risky if multiple recruiters? Let's assume we update shared company info.
                await client.query(
                    `UPDATE companies SET 
                        name = COALESCE($1, name), address = COALESCE($2, address), 
                        size = COALESCE($3, size), industry = COALESCE($4, industry), 
                        description = COALESCE($5, description),
                        contact_name = COALESCE($6, contact_name), contact_phone = COALESCE($7, contact_phone),
                        updated_at = CURRENT_TIMESTAMP 
                     WHERE id = $8`,
                    [company_name, company_address, company_size, company_industry, company_description, contact_name, contact_phone, company_id]
                );
            } else {
                // Create new company
                // Check Name Uniqueness
                const nameCheck = await client.query('SELECT id FROM companies WHERE name = $1', [company_name]);
                if (nameCheck.rows.length > 0) {
                    res.status(400).json({ status: 'error', message: '该公司名称已存在，请使用其他名称或核对统一社会信用代码' });
                    await client.query('ROLLBACK');
                    return;
                }

                const newCompany = await client.query(
                    `INSERT INTO companies (name, address, size, industry, description, contact_name, contact_phone, social_credit_code, status, is_verified)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', false) RETURNING id`,
                    [company_name, company_address, company_size, company_industry, company_description, contact_name, contact_phone, social_credit_code]
                );
                company_id = newCompany.rows[0].id;
            }
        } else {
            // Update existing company (Same Social Credit Code)
            await client.query(
                `UPDATE companies SET 
                    name = $1, address = $2, size = $3, industry = $4, description = $5,
                    contact_name = $6, contact_phone = $7, social_credit_code = $8,
                    updated_at = CURRENT_TIMESTAMP 
                 WHERE id = $9`,
                [company_name, company_address, company_size, company_industry, company_description, contact_name, contact_phone, social_credit_code, company_id]
            );
        }

        // 4. Update recruiter_user association and status
        let updateQuery = `
            UPDATE recruiter_user 
            SET verification_status = 'pending', 
                company_id = $1,
                contact_name = $2,
                contact_phone = $3,
                updated_at = CURRENT_TIMESTAMP
        `;
        const queryParams = [company_id, contact_name, contact_phone];

        // If file uploaded, update license path. If switching company and no new file, 
        // strictly speaking we should probably require a license for the new company if not exists.
        // But if they are just linking to an existing one that might have one... 
        // For now, if file provided, update it.
        if (business_license) {
            updateQuery += `, business_license = $4 WHERE user_id = $5`;
            queryParams.push(business_license, userId);
        } else {
            updateQuery += ` WHERE user_id = $4`;
            queryParams.push(userId);
        }

        await client.query(updateQuery, queryParams);

        // 5. 确保 recruiters 表也是未认证状态 (直到管理员通过)
        // Also update company_id in public recruiters table
        await client.query(
            'UPDATE recruiters SET is_verified = false, company_id = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
            [company_id, userId]
        );

        await client.query('COMMIT');

        res.json({
            status: 'success',
            message: '认证申请已提交，等待审核',
            data: {
                verification_status: 'pending',
                business_license: business_license
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        if (req.file && fs.existsSync(req.file.path)) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (e) { /* ignore */ }
        }
        throw error;
    } finally {
        client.release();
    }
};

/**
 * 获取认证状态
 */
exports.getCertificationStatus = async (req, res) => {
    const userId = req.user.id;

    const result = await query(
        `SELECT ru.verification_status, ru.business_license, ru.rejection_reason,
                ru.contact_name, ru.contact_phone,
                c.name as company_name, c.industry as company_industry, c.size as company_size, 
                c.address as company_address, c.description as company_description,
                c.social_credit_code,
                c.is_verified,
                r.id as recruiter_id
         FROM recruiter_user ru
         LEFT JOIN companies c ON ru.company_id = c.id
         LEFT JOIN recruiters r ON ru.user_id = r.user_id
         WHERE ru.user_id = $1`,
        [userId]
    );

    if (result.rows.length === 0) {
        // 如果不是 recruiter
        return res.json({
            status: 'success',
            data: {
                is_recruiter: false
            }
        });
    }

    res.json({
        status: 'success',
        data: {
            is_recruiter: true,
            ...result.rows[0]
        }
    });
};

/**
 * [Admin] 获取待审核列表
 */
exports.adminGetPendingRequests = async (req, res) => {
    const result = await query(
        `SELECT ru.user_id, ru.company_id, ru.verification_status, ru.business_license, ru.created_at,
                u.name as applicant_name, u.email as applicant_email, u.phone as applicant_phone, u.avatar as applicant_avatar,
                c.name as company_name, c.social_credit_code, c.logo as company_logo
         FROM recruiter_user ru
         JOIN users u ON ru.user_id = u.id
         JOIN companies c ON ru.company_id = c.id
         WHERE ru.verification_status = 'pending'
         ORDER BY ru.updated_at ASC`
    );

    res.json({
        status: 'success',
        count: result.rows.length,
        data: result.rows
    });
};

/**
 * [Admin] 审核请求
 */
/**
 * [Admin] 审核请求
 */
exports.adminVerifyRequest = async (req, res) => {
    const { userId } = req.params; // 这里传的是 user_id (recruiter_user 的主键之一)
    const { action, reason } = req.body; // action: 'approve' | 'reject'

    if (!['approve', 'reject'].includes(action)) {
        throw new AppError('无效的操作', 400, 'INVALID_ACTION');
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 获取当前信息
        const currentRes = await client.query(
            'SELECT company_id FROM recruiter_user WHERE user_id = $1',
            [userId]
        );

        if (currentRes.rows.length === 0) {
            throw new AppError('申请不存在', 404, 'REQUEST_NOT_FOUND');
        }
        const companyId = currentRes.rows[0].company_id;

        // Get User Email for notification
        const userRes = await client.query('SELECT email FROM users WHERE id = $1', [userId]);
        const userEmail = userRes.rows[0]?.email;

        if (action === 'approve') {
            const now = new Date();
            // 1. 更新 recruiter_user
            await client.query(
                `UPDATE recruiter_user 
                 SET verification_status = 'approved', 
                     is_verified = true, 
                     verification_date = $2,
                     updated_at = $2
                 WHERE user_id = $1`,
                [userId, now]
            );

            // 2. 更新 recruiters (公开表)
            await client.query(
                `UPDATE recruiters 
                 SET is_verified = true, 
                     updated_at = $2
                 WHERE user_id = $1`,
                [userId, now]
            );

            // 3. 更新 companies 
            await client.query(
                `UPDATE companies 
                 SET is_verified = true, 
                     updated_at = $2
                 WHERE id = $1`,
                [companyId, now]
            );

            // Send Email
            if (userEmail) {
                await sendCertificationResultEmail(userEmail, true);
            }

        } else if (action === 'reject') {
            // 拒绝
            await client.query(
                `UPDATE recruiter_user 
                 SET verification_status = 'rejected', 
                     rejection_reason = $2,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE user_id = $1`,
                [userId, reason]
            );

            // Send Email
            if (userEmail) {
                await sendCertificationResultEmail(userEmail, false, reason);
            }
        }

        await client.query('COMMIT');

        res.json({
            status: 'success',
            message: action === 'approve' ? '已批准' : '已拒绝'
        });

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};
