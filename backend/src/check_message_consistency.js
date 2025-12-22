// 检查消息数据一致性的脚本
const { pool } = require('./config/db');

async function checkMessageConsistency() {
    try {
        console.log('正在检查消息数据一致性...');
        
        // 1. 检查对话表中的未读计数与实际消息状态是否一致
        console.log('\n1. 检查对话未读计数与实际消息状态...');
        
        // 获取所有活跃对话
        const conversationsResult = await pool.query(`
            SELECT id, recruiter_unread, candidate_unread FROM conversations WHERE deleted_at IS NULL
        `);
        
        let inconsistencyCount = 0;
        
        for (const conversation of conversationsResult.rows) {
            const { id, recruiter_unread, candidate_unread } = conversation;
            
            // 获取该对话的相关用户信息
            const userInfoResult = await pool.query(`
                SELECT 
                    cd.user_id AS candidate_user_id,
                    r.user_id AS recruiter_user_id
                FROM conversations c
                JOIN candidates cd ON c.candidate_id = cd.id
                JOIN recruiters r ON c.recruiter_id = r.id
                WHERE c.id = $1
            `, [id]);
            
            if (userInfoResult.rows.length === 0) continue;
            
            const { candidate_user_id, recruiter_user_id } = userInfoResult.rows[0];
            
            // 计算实际的未读消息数
            const recruiterUnreadActual = await pool.query(`
                SELECT COUNT(*) AS count 
                FROM messages 
                WHERE conversation_id = $1 AND receiver_id = $2 AND status != 'read' AND is_deleted = false
            `, [id, recruiter_user_id]);
            
            const candidateUnreadActual = await pool.query(`
                SELECT COUNT(*) AS count 
                FROM messages 
                WHERE conversation_id = $1 AND receiver_id = $2 AND status != 'read' AND is_deleted = false
            `, [id, candidate_user_id]);
            
            const actualRecruiterUnread = parseInt(recruiterUnreadActual.rows[0].count);
            const actualCandidateUnread = parseInt(candidateUnreadActual.rows[0].count);
            
            // 检查是否不一致
            if (recruiter_unread !== actualRecruiterUnread || candidate_unread !== actualCandidateUnread) {
                inconsistencyCount++;
                console.log(`   对话 ${id} 存在不一致: recruiter_unread=${recruiter_unread} vs ${actualRecruiterUnread}, candidate_unread=${candidate_unread} vs ${actualCandidateUnread}`);
                
                // 修复不一致
                await pool.query(`
                    UPDATE conversations 
                    SET recruiter_unread = $1, candidate_unread = $2
                    WHERE id = $3
                `, [actualRecruiterUnread, actualCandidateUnread, id]);
                
                console.log(`   已修复对话 ${id} 的未读计数`);
            }
        }
        
        console.log(`   共检查 ${conversationsResult.rows.length} 个对话，修复了 ${inconsistencyCount} 个不一致`);
        
        // 2. 检查对话的 total_messages 与实际消息数是否一致
        console.log('\n2. 检查对话总消息数与实际消息数...');
        
        let totalMessagesInconsistency = 0;
        
        for (const conversation of conversationsResult.rows) {
            const { id } = conversation;
            
            // 获取实际消息数
            const actualCountResult = await pool.query(`
                SELECT COUNT(*) AS count FROM messages WHERE conversation_id = $1 AND is_deleted = false
            `, [id]);
            
            const actualCount = parseInt(actualCountResult.rows[0].count);
            
            // 获取对话表中的总消息数
            const conversationResult = await pool.query(`
                SELECT total_messages FROM conversations WHERE id = $1
            `, [id]);
            
            const storedCount = parseInt(conversationResult.rows[0].total_messages);
            
            if (storedCount !== actualCount) {
                totalMessagesInconsistency++;
                console.log(`   对话 ${id} 总消息数不一致: stored=${storedCount} vs actual=${actualCount}`);
                
                // 修复不一致
                await pool.query(`
                    UPDATE conversations 
                    SET total_messages = $1
                    WHERE id = $2
                `, [actualCount, id]);
                
                console.log(`   已修复对话 ${id} 的总消息数`);
            }
        }
        
        console.log(`   共检查 ${conversationsResult.rows.length} 个对话，修复了 ${totalMessagesInconsistency} 个总消息数不一致`);
        
        console.log('\n✅ 消息数据一致性检查完成！');
        await pool.end();
    } catch (error) {
        console.error('检查消息数据一致性时出错:', error.message);
        await pool.end();
    }
}

checkMessageConsistency();