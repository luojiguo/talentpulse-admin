const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function fixInterviewMessageTypes() {
    try {
        console.log('=== 检查并修复错误的面试邀请消息类型 ===\n');

        // 1. 查找所有类型为 'text' 但内容包含 interview_invitation 的消息
        const findResult = await pool.query(`
            SELECT id, type, left(text, 50) as text_preview 
            FROM messages 
            WHERE type = 'text' 
            AND text LIKE '%"type":"interview_invitation"%'
        `);

        if (findResult.rows.length > 0) {
            console.log(`发现 ${findResult.rows.length} 条类型错误的面试邀请消息:`);
            findResult.rows.forEach(row => {
                console.log(`- ID: ${row.id}, Type: ${row.type}, Preview: ${row.text_preview}...`);
            });

            // 2. 修复这些消息
            console.log('\n正在修复...');
            const updateResult = await pool.query(`
                UPDATE messages 
                SET type = 'interview_invitation' 
                WHERE type = 'text' 
                AND text LIKE '%"type":"interview_invitation"%'
            `);

            console.log(`✅ 成功修复 ${updateResult.rowCount} 条消息！`);
        } else {
            console.log('✅ 没有发现类型错误的面试邀请消息。');
        }

    } catch (err) {
        console.error('❌ 错误:', err.message);
        console.error(err);
    } finally {
        await pool.end();
    }
}

fixInterviewMessageTypes();
