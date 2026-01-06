
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function fixMessage389() {
    try {
        // Check if message 389 exists and is a system message
        const checkRes = await pool.query('SELECT * FROM messages WHERE id = 389');
        if (checkRes.rows.length > 0) {
            console.log('Found message 389:', checkRes.rows[0].type);

            // Update it to interview_invitation
            // We also need to ensure it has a valid sender_id if it's currently null/0, 
            // to render correctly in the user bubble. 
            // Based on message 390 (recruiter sent it), we might want to copy sender_id?
            // Let's assume sender_id is already there or we leave it. 
            // A system message usually has null sender_id?
            // If sender_id is null, isCurrentUser = false.

            await pool.query("UPDATE messages SET type = 'interview_invitation' WHERE id = 389");
            console.log('Updated message 389 type to interview_invitation');
        } else {
            console.log('Message 389 not found');
        }
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

fixMessage389();
