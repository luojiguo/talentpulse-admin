const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function checkMessageTypeConstraint() {
    try {
        // 查询messages表的约束
        const constraintQuery = `
            SELECT 
                con.conname AS constraint_name,
                pg_get_constraintdef(con.oid) AS constraint_definition
            FROM pg_constraint con
            INNER JOIN pg_class rel ON rel.oid = con.conrelid
            INNER JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
            WHERE rel.relname = 'messages'
            AND con.contype = 'c'
            ORDER BY con.conname;
        `;

        const result = await pool.query(constraintQuery);

        console.log('=== Messages Table CHECK Constraints ===\n');

        if (result.rows.length === 0) {
            console.log('No CHECK constraints found on messages table');
        } else {
            result.rows.forEach(row => {
                console.log(`Constraint: ${row.constraint_name}`);
                console.log(`Definition: ${row.constraint_definition}`);
                console.log('---\n');
            });
        }

        // 尝试插入一条测试消息
        console.log('\n=== Testing INSERT with type = "interview_invitation" ===\n');

        try {
            const testInsert = await pool.query(`
                INSERT INTO messages (conversation_id, sender_id, receiver_id, text, type, status, created_at)
                VALUES (1, 1, 2, 'test', 'interview_invitation', 'sent', NOW())
                RETURNING id, type
            `);

            console.log('✅ INSERT successful!');
            console.log('Inserted message ID:', testInsert.rows[0].id);
            console.log('Type:', testInsert.rows[0].type);

            // 删除测试消息
            await pool.query('DELETE FROM messages WHERE id = $1', [testInsert.rows[0].id]);
            console.log('Test message deleted');

        } catch (insertError) {
            console.log('❌ INSERT failed!');
            console.log('Error:', insertError.message);
            console.log('Detail:', insertError.detail);
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

checkMessageTypeConstraint();
