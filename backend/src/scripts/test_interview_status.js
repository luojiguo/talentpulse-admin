const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'talentpulse',
    password: 'postgres',
    port: 5432
});

async function testInterviewStatus() {
    try {
        console.log('=== 测试面试状态更新 ===\n');

        // 1. 查看最近的面试记录
        console.log('1. 最近的面试记录:');
        const recent = await pool.query(`
            SELECT id, status, interview_date, interview_time, interviewer_id, created_at
            FROM interviews 
            ORDER BY id DESC 
            LIMIT 5
        `);
        console.table(recent.rows);

        // 2. 查看各状态的数量
        console.log('\n2. 各状态的面试数量:');
        const statusCount = await pool.query(`
            SELECT status, COUNT(*) as count
            FROM interviews
            GROUP BY status
            ORDER BY count DESC
        `);
        console.table(statusCount.rows);

        // 3. 查看已接受和已拒绝的面试
        console.log('\n3. 候选人已回复的面试:');
        const responded = await pool.query(`
            SELECT id, status, interview_date, interview_time
            FROM interviews 
            WHERE status IN ('accepted', 'rejected')
            ORDER BY id DESC
            LIMIT 5
        `);
        if (responded.rows.length > 0) {
            console.table(responded.rows);
        } else {
            console.log('暂无候选人回复的面试');
        }

        // 4. 测试更新状态
        if (recent.rows.length > 0) {
            const testId = recent.rows[0].id;
            console.log(`\n4. 测试更新面试 ID ${testId} 的状态为 'accepted':`);

            const updateResult = await pool.query(`
                UPDATE interviews 
                SET status = 'accepted'
                WHERE id = $1
                RETURNING id, status
            `, [testId]);

            console.log('更新成功:', updateResult.rows[0]);

            // 恢复原状态
            await pool.query(`
                UPDATE interviews 
                SET status = 'scheduled'
                WHERE id = $1
            `, [testId]);
            console.log('已恢复为 scheduled 状态');
        }

    } catch (error) {
        console.error('测试失败:', error);
    } finally {
        await pool.end();
    }
}

testInterviewStatus();
