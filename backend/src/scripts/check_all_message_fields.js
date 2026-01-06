const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function checkAllMessageFields() {
    try {
        console.log('=== 检查 messages 表的所有字段 ===\n');

        const result = await pool.query(`
            SELECT 
                column_name,
                data_type,
                character_maximum_length,
                is_nullable
            FROM information_schema.columns
            WHERE table_name = 'messages'
            ORDER BY ordinal_position;
        `);

        console.log('messages 表的所有字段:\n');
        result.rows.forEach(row => {
            const lengthInfo = row.character_maximum_length
                ? `(最大长度: ${row.character_maximum_length})`
                : '';
            console.log(`- ${row.column_name}: ${row.data_type} ${lengthInfo}`);
        });

        console.log('\n=== 查找所有 VARCHAR 字段 ===\n');
        const varcharFields = result.rows.filter(row =>
            row.data_type === 'character varying' && row.character_maximum_length
        );

        if (varcharFields.length > 0) {
            console.log('发现以下 VARCHAR 字段有长度限制:');
            varcharFields.forEach(field => {
                console.log(`  - ${field.column_name}: VARCHAR(${field.character_maximum_length})`);
            });
        } else {
            console.log('没有发现 VARCHAR 字段有长度限制');
        }

    } catch (err) {
        console.error('错误:', err);
    } finally {
        await pool.end();
    }
}

checkAllMessageFields();
