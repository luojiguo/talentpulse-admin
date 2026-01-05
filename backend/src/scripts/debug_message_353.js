const { pool } = require('../config/db');

async function checkMessage() {
    try {
        const res = await pool.query('SELECT * FROM messages WHERE id = 353');
        console.log('Message 353:', res.rows[0]);

        if (res.rows.length > 0) {
            const msg = res.rows[0];
            console.log('Receiver ID:', msg.receiver_id);
            console.log('Sender ID:', msg.sender_id);

            const users = await pool.query('SELECT id, name, email FROM users WHERE id IN ($1, $2)', [msg.receiver_id, msg.sender_id]);
            console.log('Users:', users.rows);

            // Check Recruiter/Candidate status
            const recruiters = await pool.query('SELECT * FROM recruiters WHERE user_id IN ($1, $2)', [msg.receiver_id, msg.sender_id]);
            console.log('Recruiters:', recruiters.rows);

            const candidates = await pool.query('SELECT * FROM candidates WHERE user_id IN ($1, $2)', [msg.receiver_id, msg.sender_id]);
            console.log('Candidates:', candidates.rows);
        }
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

checkMessage();
