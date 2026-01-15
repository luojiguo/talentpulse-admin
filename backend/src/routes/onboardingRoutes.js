const express = require('express');
const router = express.Router();
const { pool, query } = require('../config/db');
const { asyncHandler } = require('../middleware/errorHandler');

const { authenticate } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticate);

// ------------------- Create Onboarding Record -------------------
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

    // Basic validation
    if (!candidateId || !recruiterId || !jobId || !startDate) {
        return res.status(400).json({
            status: 'error',
            message: 'candidateId, recruiterId, jobId, and startDate are required fields',
        });
    }

    // Resolve recruiter_id (in case user_id given)
    const recruiterResult = await query(
        'SELECT id FROM recruiters WHERE id = $1 OR user_id = $1',
        [recruiterId]
    );

    if (recruiterResult.rows.length === 0) {
        return res.status(404).json({
            status: 'error',
            message: 'Recruiter not found',
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
            realRecruiterId, // Use resolved ID
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

// ------------------- Get Onboarding List (with filters) -------------------
router.get('/', asyncHandler(async (req, res) => {
    const { candidateId, recruiterId, jobId, status } = req.query;
    const conditions = [];
    const params = [];

    // Always filter out soft-deleted or cancelled? Maybe not for recruiter view.
    // Always filter out soft-deleted or cancelled? Maybe not for recruiter view.
    // conditions.push(`status != 'Cancelled'`);

    if (candidateId) { params.push(candidateId); conditions.push(`o.candidate_id = $${params.length}`); }

    // Resolve recruiter_id from user_id if provided
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
            // Provided recruiterId not found, likely return empty or ignore (return empty safe)
            params.push(-1); // Impossible ID
            conditions.push(`o.recruiter_id = $${params.length}`);
        }
    }

    if (jobId) { params.push(jobId); conditions.push(`o.job_id = $${params.length}`); }
    if (jobId) { params.push(jobId); conditions.push(`o.job_id = $${params.length}`); }
    if (status && status !== 'all') { params.push(status); conditions.push(`o.status = $${params.length}`); }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    // Join tables to get names
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

    // Format for frontend
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

// ------------------- Update Onboarding Record -------------------
router.put('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    // Allow updating any field passed in body
    // Mapping frontend camelCase to snake_case
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
        return res.status(400).json({ status: 'error', message: 'No valid fields to update' });
    }

    values.push(id); // ID is the last param
    const result = await query(
        `UPDATE onboardings SET ${fields.join(', ')}
     WHERE id = $${values.length}
     RETURNING *`,
        values
    );

    res.json({ status: 'success', data: result.rows[0] });
}));

// ------------------- Delete (Soft Delete / Cancel) -------------------
router.delete('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    // Soft delete: change status to Cancelled or delete if preferred.
    // Let's implement actual delete for now as per user request to "manage" data
    // or simple soft delete via status

    const result = await query(
        `DELETE FROM onboardings WHERE id = $1 RETURNING *`,
        [id]
    );
    console.log('[DEBUG] DELETE /onboardings/:id affected rows:', result.rowCount);

    if (result.rowCount === 0) {
        return res.status(404).json({ status: 'error', message: 'Record not found' });
    }

    res.json({ status: 'success', message: 'Record deleted' });
}));

module.exports = router;
