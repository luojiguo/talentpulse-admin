const { pool } = require('./config/db');

async function checkExistingData() {
    try {
        const client = await pool.connect();
        
        console.log('正在检查现有数据...');
        
        // 检查 candidates 表中的数据
        const candidatesResult = await client.query('SELECT id, user_id FROM candidates LIMIT 5');
        console.log('\nCandidates 表数据:');
        candidatesResult.rows.forEach(candidate => {
            console.log(`- ID: ${candidate.id}, User ID: ${candidate.user_id}`);
        });
        
        // 检查 jobs 表中的数据
        const jobsResult = await client.query('SELECT id, company_id FROM jobs LIMIT 5');
        console.log('\nJobs 表数据:');
        jobsResult.rows.forEach(job => {
            console.log(`- ID: ${job.id}, Company ID: ${job.company_id}`);
        });
        
        // 检查 users 表中的数据
        const usersResult = await client.query('SELECT id, name FROM users WHERE role = \'candidate\' LIMIT 5');
        console.log('\nUsers 表数据 (候选人):');
        usersResult.rows.forEach(user => {
            console.log(`- ID: ${user.id}, Name: ${user.name}`);
        });
        
        client.release();
        await pool.end();
    } catch (error) {
        console.error('查询错误:', error.message);
        process.exit(1);
    }
}

checkExistingData();