const { pool } = require('./config/db');

async function checkJobsStructure() {
    try {
        const client = await pool.connect();
        
        console.log('正在检查 jobs 表结构...');
        
        // 检查 jobs 表的所有字段
        const columnsResult = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'jobs' 
            ORDER BY ordinal_position
        `);
        
        console.log('Jobs 表字段结构:');
        columnsResult.rows.forEach(col => {
            console.log(`- ${col.column_name}: ${col.data_type}`);
        });
        
        // 检查 jobs 表中的数据样本
        const dataResult = await client.query('SELECT * FROM jobs LIMIT 3');
        console.log('\nJobs 表数据样本:');
        dataResult.rows.forEach(job => {
            console.log(`- ID: ${job.id}, Title: ${job.title}, Company ID: ${job.company_id}, Recruiter ID: ${job.recruiter_id}`);
        });
        
        // 测试完整的查询，包括关联表
        const fullQueryResult = await client.query(`
            SELECT 
                j.*, 
                c.name AS company_name,
                u.name AS recruiter_name,
                u.avatar AS recruiter_avatar,
                r.position AS recruiter_position,
                r.id AS recruiter_id
            FROM jobs j
            LEFT JOIN companies c ON j.company_id = c.id
            LEFT JOIN recruiters r ON j.recruiter_id = r.id
            LEFT JOIN users u ON r.user_id = u.id
            LIMIT 2
        `);
        
        console.log('\n完整查询结果:');
        console.log(JSON.stringify(fullQueryResult.rows, null, 2));
        
        client.release();
        await pool.end();
    } catch (error) {
        console.error('查询错误:', error.message);
        process.exit(1);
    }
}

checkJobsStructure();