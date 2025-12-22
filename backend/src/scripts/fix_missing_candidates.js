const { pool } = require('../config/db');

async function fixMissingCandidates() {
    const client = await pool.connect();
    try {
        console.log('开始修复缺失的求职者数据...');
        await client.query('BEGIN');

        // 1. 查找所有是 candidate 角色或在 candidate_user 表中的用户
        //    但不在 candidates 表中的用户ID
        const queryStr = `
      SELECT u.id, u.name 
      FROM users u
      LEFT JOIN candidate_user cu ON u.id = cu.user_id
      LEFT JOIN candidates c ON u.id = c.user_id
      WHERE (cu.id IS NOT NULL OR u.id IN (SELECT user_id FROM user_roles WHERE role = 'candidate'))
      AND c.id IS NULL
    `;

        const result = await client.query(queryStr);

        if (result.rows.length === 0) {
            console.log('没有发现缺失 candidates 记录的用户。');
        } else {
            console.log(`发现 ${result.rows.length} 个用户缺失 candidates 记录，开始修复...`);

            for (const user of result.rows) {
                console.log(`正在修复用户: ${user.name} (ID: ${user.id})`);
                await client.query(
                    `INSERT INTO candidates (user_id, created_at, updated_at, availability_status)
           VALUES ($1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'available')`,
                    [user.id]
                );
            }
            console.log('所有用户修复完成！');
        }

        await client.query('COMMIT');
        console.log('✅ 数据库修复成功');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ 修复失败:', error);
    } finally {
        client.release();
        pool.end();
    }
}

fixMissingCandidates();
