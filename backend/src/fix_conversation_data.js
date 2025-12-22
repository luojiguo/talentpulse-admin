// 修复对话数据不一致问题
const { pool } = require('./config/db');

async function fixConversationData() {
    try {
        console.log('正在检查和修复对话数据不一致问题...');
        
        // 1. 检查所有对话，包括已删除的
        console.log('\n1. 检查所有对话（包括已删除的）:');
        const allConversationsResult = await pool.query(`
            SELECT id, job_id, candidate_id, recruiter_id, last_message, last_time, total_messages, recruiter_unread, candidate_unread, deleted_at, is_active, status
            FROM conversations
            ORDER BY id DESC
        `);
        
        console.log(`   共有 ${allConversationsResult.rows.length} 个对话，其中活跃对话 ${allConversationsResult.rows.filter(c => !c.deleted_at).length} 个`);
        
        if (allConversationsResult.rows.length > 0) {
            console.log('   对话详情:');
            allConversationsResult.rows.forEach(conv => {
                console.log(`   - 对话 ${conv.id}: 状态=${conv.status}, 活跃=${conv.is_active}, 已删除=${!!conv.deleted_at}, 总消息数=${conv.total_messages}`);
            });
        }
        
        // 2. 检查有消息但被删除的对话
        console.log('\n2. 检查有消息但被删除的对话:');
        
        // 获取所有有消息的对话ID
        const messageConversationsResult = await pool.query(`
            SELECT DISTINCT conversation_id FROM messages WHERE is_deleted = false
        `);
        
        const messageConversationIds = messageConversationsResult.rows.map(row => row.conversation_id);
        
        // 检查这些对话的状态
        if (messageConversationIds.length > 0) {
            const inactiveConversationsResult = await pool.query(`
                SELECT id, status, is_active, deleted_at FROM conversations
                WHERE id = ANY($1) AND (deleted_at IS NOT NULL OR is_active = false OR status = 'deleted')
            `, [messageConversationIds]);
            
            console.log(`   有 ${inactiveConversationsResult.rows.length} 个有消息但非活跃的对话`);
            
            if (inactiveConversationsResult.rows.length > 0) {
                console.log('   需要修复的对话:');
                inactiveConversationsResult.rows.forEach(conv => {
                    console.log(`   - 对话 ${conv.id}: 状态=${conv.status}, 活跃=${conv.is_active}, 已删除=${!!conv.deleted_at}`);
                });
                
                // 修复这些对话，恢复为活跃状态
                console.log('   正在修复这些对话...');
                await pool.query(`
                    UPDATE conversations
                    SET 
                        deleted_at = NULL,
                        is_active = true,
                        status = 'active',
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ANY($1)
                `, [inactiveConversationsResult.rows.map(conv => conv.id)]);
                
                console.log(`   已修复 ${inactiveConversationsResult.rows.length} 个对话`);
            }
        }
        
        // 3. 重新计算每个对话的总消息数和未读计数
        console.log('\n3. 重新计算每个对话的统计信息:');
        
        for (const conversationId of messageConversationIds) {
            // 获取对话的实际消息数
            const messageCountResult = await pool.query(`
                SELECT COUNT(*) AS count FROM messages WHERE conversation_id = $1 AND is_deleted = false
            `, [conversationId]);
            
            const actualMessageCount = parseInt(messageCountResult.rows[0].count);
            
            // 获取对话的相关用户信息
            const userInfoResult = await pool.query(`
                SELECT 
                    cd.user_id AS candidate_user_id,
                    r.user_id AS recruiter_user_id
                FROM conversations c
                JOIN candidates cd ON c.candidate_id = cd.id
                JOIN recruiters r ON c.recruiter_id = r.id
                WHERE c.id = $1
            `, [conversationId]);
            
            if (userInfoResult.rows.length === 0) continue;
            
            const { candidate_user_id, recruiter_user_id } = userInfoResult.rows[0];
            
            // 计算实际的未读消息数
            const recruiterUnreadResult = await pool.query(`
                SELECT COUNT(*) AS count FROM messages 
                WHERE conversation_id = $1 AND receiver_id = $2 AND status != 'read' AND is_deleted = false
            `, [conversationId, recruiter_user_id]);
            
            const candidateUnreadResult = await pool.query(`
                SELECT COUNT(*) AS count FROM messages 
                WHERE conversation_id = $1 AND receiver_id = $2 AND status != 'read' AND is_deleted = false
            `, [conversationId, candidate_user_id]);
            
            const actualRecruiterUnread = parseInt(recruiterUnreadResult.rows[0].count);
            const actualCandidateUnread = parseInt(candidateUnreadResult.rows[0].count);
            
            // 获取最后一条消息
            const lastMessageResult = await pool.query(`
                SELECT text, time FROM messages 
                WHERE conversation_id = $1 AND is_deleted = false
                ORDER BY time DESC LIMIT 1
            `, [conversationId]);
            
            const lastMessage = lastMessageResult.rows[0] || {};
            
            // 更新对话统计信息
            await pool.query(`
                UPDATE conversations
                SET 
                    total_messages = $1,
                    recruiter_unread = $2,
                    candidate_unread = $3,
                    last_message = $4,
                    last_time = $5,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $6
            `, [actualMessageCount, actualRecruiterUnread, actualCandidateUnread, lastMessage.text, lastMessage.time, conversationId]);
            
            console.log(`   已更新对话 ${conversationId} 的统计信息: 总消息数=${actualMessageCount}, 招聘者未读=${actualRecruiterUnread}, 候选人未读=${actualCandidateUnread}`);
        }
        
        // 4. 检查修复后的结果
        console.log('\n4. 修复后的结果:');
        const fixedConversationsResult = await pool.query(`
            SELECT id, status, is_active, deleted_at, total_messages
            FROM conversations
            WHERE deleted_at IS NULL
            ORDER BY updated_at DESC
        `);
        
        console.log(`   修复后共有 ${fixedConversationsResult.rows.length} 个活跃对话`);
        fixedConversationsResult.rows.forEach(conv => {
            console.log(`   - 对话 ${conv.id}: 状态=${conv.status}, 活跃=${conv.is_active}, 总消息数=${conv.total_messages}`);
        });
        
        await pool.end();
        console.log('\n✅ 对话数据修复完成！');
    } catch (error) {
        console.error('修复对话数据时出错:', error.message);
        await pool.end();
    }
}

fixConversationData();