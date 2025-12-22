const { pool } = require('./config/db');

async function insertTestData() {
    try {
        const client = await pool.connect();
        
        console.log('正在插入测试数据...');
        
        // 检查是否已有数据
        const existingCount = await client.query('SELECT COUNT(*) FROM applications');
        if (parseInt(existingCount.rows[0].count) > 0) {
            console.log('Applications 表已有数据，跳过插入');
            return;
        }
        
        // 插入测试申请数据
        await client.query(`
            INSERT INTO applications (candidate_id, job_id, status, created_at, updated_at)
            VALUES 
                (1, 1, 'Applied', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
                (2, 2, 'Screening', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
                (3, 3, 'Interview', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
                (4, 4, 'Offer', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days')
        `);
        
        console.log('测试数据插入成功！');
        
        // 测试查询
        const testResult = await client.query(`
            SELECT 
                a.id, 
                a.candidate_id AS "candidateId", 
                a.job_id AS "jobId", 
                j.company_id AS "companyId", 
                a.status AS "stage", 
                a.created_at AS "appliedDate",
                a.updated_at AS "updatedDate",
                c.name AS "candidateName",
                j.title AS "jobTitle",
                co.name AS "companyName"
            FROM applications a
            LEFT JOIN candidates c ON a.candidate_id = c.id
            LEFT JOIN jobs j ON a.job_id = j.id
            LEFT JOIN companies co ON j.company_id = co.id
            ORDER BY a.created_at DESC
        `);
        
        console.log('\n测试查询结果:');
        console.log(`返回行数: ${testResult.rows.length}`);
        
        if (testResult.rows.length > 0) {
            console.log('示例数据:');
            testResult.rows.forEach(row => {
                console.log(`- ID: ${row.id}, 候选人: ${row.candidateName}, 职位: ${row.jobTitle}, 公司: ${row.companyName}, 阶段: ${row.stage}`);
            });
        }
        
        client.release();
        await pool.end();
    } catch (error) {
        console.error('插入测试数据失败:', error.message);
        process.exit(1);
    }
}

insertTestData();