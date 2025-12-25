const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'talentpulse',
    password: process.env.DB_PASSWORD || '123456',
    port: process.env.DB_PORT || 5432,
});

async function checkData() {
    try {
        console.log('--- Finding User 28 ---');
        // Find a recruiter to test with
        const recruiters = await pool.query('SELECT * FROM recruiters WHERE user_id = 28');

        if (recruiters.rows.length === 0) {
            console.log('No recruiters found in the database!');
            return;
        }

        const recruiterRecord = recruiters.rows[0];
        const userId = recruiterRecord.user_id;
        console.log(`Found Recruiter Record: ID ${recruiterRecord.id}, User ID ${userId}`);

        console.log('\n--- Checking User Data ---');
        const users = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [userId]);
        console.table(users.rows);

        const recruiterId = recruiterRecord.id;

        console.log('\n--- Checking Conversations for this Recruiter ---');
        const conversations = await pool.query('SELECT * FROM conversations WHERE recruiter_id = $1', [recruiterId]);
        console.table(conversations.rows);

        if (conversations.rows.length > 0) {
            console.log('\n--- Checking JOIN Logic ---');
            const query = `
          SELECT 
            c.id as conversation_id,
            r.id as recruiter_table_id,
            r.user_id as r_user_id,
            u.id as user_table_id,
            COALESCE(u.id, r.user_id) AS "recruiterUserId"
          FROM conversations c
          LEFT JOIN recruiters r ON c.recruiter_id = r.id
          LEFT JOIN users u ON r.user_id = u.id
          WHERE c.recruiter_id = $1
        `;
            const joinResult = await pool.query(query, [recruiterId]);
            console.table(joinResult.rows);
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        pool.end();
    }
}

checkData();
