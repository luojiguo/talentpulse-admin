const { pool } = require('./config/db');

async function insertValidData() {
    try {
        const client = await pool.connect();
        
        console.log('正在插入有效测试数据...');
        
        // 使用存在的 candidate_id 和 job_id 插入测试数据
        await client.query(`
            INSERT INTO applications (candidate_id, job_id, status, created_at, updated_at)
            VALUES 
                (1, 1, 'Screening', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
                (2, 2, 'Interview', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
                (3, 3, 'Offer', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
                (19, 6, 'New', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days')
        `);
        
        console.log('测试数据插入成功！');
        
        client.release();
        await pool.end();
    } catch (error) {
        console.error('插入测试数据失败:', error.message);
        process.exit(1);
    }
}

insertValidData();