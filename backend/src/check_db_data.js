// 检查数据库中的对话和消息数据
const { pool } = require('./config/db');

async function checkDatabaseData() {
    try {
        console.log('正在检查数据库中的对话和消息数据...');
        
        // 检查conversations表数据
        console.log('\n1. conversations表数据:');
        const conversationsResult = await pool.query(`
            SELECT id, job_id, candidate_id, recruiter_id, last_message, last_time, total_messages, recruiter_unread, candidate_unread
            FROM conversations
            WHERE deleted_at IS NULL
            ORDER BY updated_at DESC
        `);
        
        console.log(`   共有 ${conversationsResult.rows.length} 个活跃对话`);
        if (conversationsResult.rows.length > 0) {
            console.log('   对话详情:');
            conversationsResult.rows.forEach(conv => {
                console.log(`   - 对话 ${conv.id}: job_id=${conv.job_id}, candidate_id=${conv.candidate_id}, recruiter_id=${conv.recruiter_id}, 总消息数=${conv.total_messages}`);
            });
        }
        
        // 检查messages表数据
        console.log('\n2. messages表数据:');
        const messagesResult = await pool.query(`
            SELECT conversation_id, sender_id, receiver_id, text, time, status, is_deleted
            FROM messages
            WHERE is_deleted = false
            ORDER BY time DESC
        `);
        
        console.log(`   共有 ${messagesResult.rows.length} 条未删除的消息`);
        if (messagesResult.rows.length > 0) {
            console.log('   最近10条消息:');
            messagesResult.rows.slice(0, 10).forEach(msg => {
                console.log(`   - 对话 ${msg.conversation_id}: 发送者=${msg.sender_id} -> 接收者=${msg.receiver_id}, 时间=${msg.time}, 状态=${msg.status}`);
                console.log(`     内容: ${msg.text.substring(0, 50)}${msg.text.length > 50 ? '...' : ''}`);
            });
        }
        
        // 检查用户表数据，特别是关联关系
        console.log('\n3. 用户关联数据:');
        
        // 检查candidates和users的关联
        const candidatesResult = await pool.query(`
            SELECT id, user_id, name FROM candidates LIMIT 5
        `);
        console.log(`   候选人与用户关联 (前5条):`);
        candidatesResult.rows.forEach(candidate => {
            console.log(`   - 候选人 ${candidate.id}: user_id=${candidate.user_id}, 姓名=${candidate.name}`);
        });
        
        // 检查recruiters和users的关联
        const recruitersResult = await pool.query(`
            SELECT id, user_id, name FROM recruiters LIMIT 5
        `);
        console.log(`   招聘者与用户关联 (前5条):`);
        recruitersResult.rows.forEach(recruiter => {
            console.log(`   - 招聘者 ${recruiter.id}: user_id=${recruiter.user_id}, 姓名=${recruiter.name}`);
        });
        
        // 检查users表
        const usersResult = await pool.query(`
            SELECT id, name, role FROM users LIMIT 10
        `);
        console.log(`   用户表数据 (前10条):`);
        usersResult.rows.forEach(user => {
            console.log(`   - 用户 ${user.id}: 姓名=${user.name}, 角色=${user.role}`);
        });
        
        await pool.end();
    } catch (error) {
        console.error('检查数据库数据时出错:', error.message);
        await pool.end();
    }
}

checkDatabaseData();