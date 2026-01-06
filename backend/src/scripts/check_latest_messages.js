const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function checkLatestMessages() {
    try {
        const res = await pool.query(`
      SELECT id, type, text, sender_id, receiver_id, conversation_id, created_at 
      FROM messages 
      WHERE type = 'interview_invitation'
      ORDER BY id DESC 
      LIMIT 3
    `);
        console.log('Latest interview_invitation messages:');
        res.rows.forEach(row => {
            console.log('\n---');
            console.log('ID:', row.id);
            console.log('Type:', row.type);
            console.log('Sender ID:', row.sender_id);
            console.log('Receiver ID:', row.receiver_id);
            console.log('Conversation ID:', row.conversation_id);
            console.log('Text preview:', row.text.substring(0, 200));
        });
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkLatestMessages();
