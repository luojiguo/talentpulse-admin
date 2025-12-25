const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'talentpulse',
    password: process.env.DB_PASSWORD || '123456',
    port: process.env.DB_PORT || 5432,
});

async function initData() {
    try {
        console.log('--- Initializing Recruiter Data for User 28 ---');

        // 1. Get User 28
        const userRes = await pool.query('SELECT * FROM users WHERE id = 28');
        if (userRes.rows.length === 0) {
            console.log('User 28 not found. Cannot proceed.');
            return;
        }
        console.log('User 28 found:', userRes.rows[0].email);

        // 2. Check/Create Company (Check via Recruiter first usually, but let's just creating one if needed)
        // Use an existing company "TalentPulse Tech" if exists, or create new.
        let companyId;
        const compRes = await pool.query('SELECT * FROM companies WHERE name = $1', ['TalentPulse Tech']);
        if (compRes.rows.length > 0) {
            companyId = compRes.rows[0].id;
            console.log('Company found:', companyId);
        } else {
            console.log('Creating Company...');
            const newComp = await pool.query(`
            INSERT INTO companies (name, industry, description) 
            VALUES ($1, $2, $3) RETURNING id`,
                ['TalentPulse Tech', 'Internet', 'Leading AI Recruitment Platform']
            );
            companyId = newComp.rows[0].id;
            console.log('Company created:', companyId);
        }

        // 3. Check/Create Recruiter
        let recruiterId;
        const recRes = await pool.query('SELECT * FROM recruiters WHERE user_id = 28');
        if (recRes.rows.length > 0) {
            recruiterId = recRes.rows[0].id;
            console.log('Recruiter record found:', recruiterId);
        } else {
            console.log('Creating Recruiter Record...');
            const newRec = await pool.query(`
            INSERT INTO recruiters (user_id, company_id, position) 
            VALUES ($1, $2, $3) RETURNING id`,
                [28, companyId, 'HR Manager']
            );
            recruiterId = newRec.rows[0].id;
            console.log('Recruiter record created:', recruiterId);
        }

        // 4. Find a Candidate (User 28 is also a candidate? No, let's use another user)
        // Find a user who is NOT 28 to be the candidate.
        const candUserRes = await pool.query('SELECT id FROM users WHERE id != 28 LIMIT 1');
        if (candUserRes.rows.length === 0) {
            console.log('No other users found to be candidate.');
            // Create one? No, just stop.
            return;
        }
        const candidateUserId = candUserRes.rows[0].id;

        // Check if this user has a candidate profile
        let candidateId;
        const candProfileRes = await pool.query('SELECT id FROM candidates WHERE user_id = $1', [candidateUserId]);
        if (candProfileRes.rows.length > 0) {
            candidateId = candProfileRes.rows[0].id;
        } else {
            console.log(`Creating Candidate Profile for User ${candidateUserId}...`);
            const newCand = await pool.query(`
            INSERT INTO candidates (user_id, name, experience_years) 
            VALUES ($1, $2, $3) RETURNING id`,
                [candidateUserId, 'Test Candidate', 3]
            );
            candidateId = newCand.rows[0].id;
        }
        console.log(`Using Candidate ID: ${candidateId} (User ${candidateUserId})`);

        // 5. Create Job (needed for conversation)
        let jobId;
        const jobRes = await pool.query('SELECT id FROM jobs WHERE recruiter_id = $1 LIMIT 1', [recruiterId]);
        if (jobRes.rows.length > 0) {
            jobId = jobRes.rows[0].id;
        } else {
            console.log('Creating Job...');
            const newJob = await pool.query(`
            INSERT INTO jobs (title, recruiter_id, company_id, description, status, location, type) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
                ['Senior Engineer', recruiterId, companyId, 'Join us!', 'active', 'Shenzhen', '全职']
            );
            jobId = newJob.rows[0].id;
        }

        // 6. Create Conversation
        let convId;
        const convRes = await pool.query(
            'SELECT id FROM conversations WHERE recruiter_id = $1 AND candidate_id = $2 AND job_id = $3',
            [recruiterId, candidateId, jobId]
        );
        if (convRes.rows.length > 0) {
            convId = convRes.rows[0].id;
            console.log('Conversation exists:', convId);
        } else {
            console.log('Creating Conversation...');
            const newConv = await pool.query(`
            INSERT INTO conversations (recruiter_id, candidate_id, job_id, last_message, is_active) 
            VALUES ($1, $2, $3, $4, $5) RETURNING id`,
                [recruiterId, candidateId, jobId, 'Hello check!', true]
            );
            convId = newConv.rows[0].id;
        }

        // 7. Create Message from Candidate to Recruiter
        console.log('Creating Message...');
        await pool.query(`
        INSERT INTO messages (conversation_id, sender_id, receiver_id, text, type, is_deleted) 
        VALUES ($1, $2, $3, $4, $5, $6)`,
            [convId, candidateUserId, 28, 'Hi, I am interested in the job.', 'text', false]
        );

        console.log('--- Data Initialization Complete ---');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        pool.end();
    }
}

initData();
