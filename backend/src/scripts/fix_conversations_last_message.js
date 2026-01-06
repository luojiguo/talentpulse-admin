const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function fixConversationsLastMessage() {
    try {
        console.log('=== 修复 conversations.last_message 字段长度限制 ===\n');

        // 1. 查看当前定义
        const currentDef = await pool.query(`
            SELECT 
                column_name,
                data_type,
                character_maximum_length
            FROM information_schema.columns
            WHERE table_name = 'conversations' AND column_name = 'last_message';
        `);

        console.log('当前 last_message 字段定义:');
        console.log(currentDef.rows[0]);
        console.log('');

        // 2. 修改字段类型为 TEXT
        console.log('将 last_message 字段从 VARCHAR(255) 改为 TEXT...');

        await pool.query(`
            ALTER TABLE conversations 
            ALTER COLUMN last_message TYPE TEXT;
        `);

        console.log('✅ 修改成功！\n');

        // 3. 验证修改
        const newDef = await pool.query(`
            SELECT 
                column_name,
                data_type,
                character_maximum_length
            FROM information_schema.columns
            WHERE table_name = 'conversations' AND column_name = 'last_message';
        `);

        console.log('修改后的 last_message 字段定义:');
        console.log(newDef.rows[0]);
        console.log('');

        console.log('✅ conversations.last_message 字段现在可以存储任意长度的文本！');
        console.log('✅ 面试邀请JSON字符串（约400字符）可以正常保存了！');

    } catch (err) {
        console.error('❌ 错误:', err.message);
        console.error(err);
    } finally {
        await pool.end();
    }
}

fixConversationsLastMessage();
