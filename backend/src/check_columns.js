const { pool } = require('./config/db');

async function checkColumns() {
    try {
        const client = await pool.connect();

        // 使用 pg 的内置功能获取表的列信息
        const result = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'applications' 
            ORDER BY ordinal_position
        `);

        console.log('Applications 表的所有列名:');
        result.rows.forEach(row => {
            console.log(`- ${row.column_name}`);
        });

        // 检查 jobs 表是否有 company_id 字段
        const jobsResult = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'jobs' 
            AND column_name = 'company_id'
        `);

        console.log(`\nJobs 表是否有 company_id 字段: ${jobsResult.rows.length > 0}`);

        client.release();
        await pool.end();
    } catch (error) {
        console.error('查询错误:', error.message);
        process.exit(1);
    }
}

checkColumns();