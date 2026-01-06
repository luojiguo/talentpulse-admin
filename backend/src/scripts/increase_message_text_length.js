const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function increaseMessageTextLength() {
    try {
        console.log('开始修改 messages 表的 text 字段长度...\n');

        // 1. 查看当前的字段定义
        const currentDef = await pool.query(`
            SELECT 
                column_name,
                data_type,
                character_maximum_length
            FROM information_schema.columns
            WHERE table_name = 'messages' AND column_name = 'text';
        `);

        console.log('当前 text 字段定义:');
        console.log(currentDef.rows[0]);
        console.log('');

        // 2. 修改字段类型为 TEXT（无长度限制）
        console.log('将 text 字段类型从 VARCHAR(255) 改为 TEXT...');

        await pool.query(`
            ALTER TABLE messages 
            ALTER COLUMN text TYPE TEXT;
        `);

        console.log('✅ 修改成功！\n');

        // 3. 验证修改
        const newDef = await pool.query(`
            SELECT 
                column_name,
                data_type,
                character_maximum_length
            FROM information_schema.columns
            WHERE table_name = 'messages' AND column_name = 'text';
        `);

        console.log('修改后的 text 字段定义:');
        console.log(newDef.rows[0]);
        console.log('');

        console.log('✅ messages.text 字段现在可以存储任意长度的文本！');

    } catch (err) {
        console.error('❌ 错误:', err.message);
        console.error(err);
    } finally {
        await pool.end();
    }
}

increaseMessageTextLength();
