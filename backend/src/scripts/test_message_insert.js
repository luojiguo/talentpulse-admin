const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function testMessageInsert() {
    try {
        console.log('=== 测试插入面试邀请消息 ===\n');

        // 模拟一个面试邀请的JSON字符串
        const interviewInvitation = JSON.stringify({
            type: 'interview_invitation',
            interview: {
                id: 999,
                application_id: 52,
                interview_date: '2026-01-07T16:00:00.000Z',
                interview_time: '08:00:00',
                interview_time_end: '09:00:00',
                interviewer_id: 10,
                status: 'scheduled',
                notes: '测试面试邀请',
                interview_round: 1,
                interviewer_name: '张三',
                interviewer_position: '技术总监',
                location: '上海市闵行区虹桥商务区',
                interview_position: 'UI界面设计(实习)'
            },
            message: '已向您发送面试邀请，请查收！'
        });

        console.log('JSON字符串长度:', interviewInvitation.length);
        console.log('JSON内容预览:', interviewInvitation.substring(0, 100) + '...\n');

        // 尝试插入消息
        console.log('尝试插入消息到数据库...\n');

        try {
            const result = await pool.query(`
                INSERT INTO messages (
                    conversation_id, 
                    sender_id, 
                    receiver_id, 
                    text, 
                    type, 
                    status, 
                    created_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, NOW())
                RETURNING id, type, LENGTH(text) as text_length
            `, [61, 17, 2, interviewInvitation, 'interview_invitation', 'sent']);

            console.log('✅ 插入成功！');
            console.log('消息ID:', result.rows[0].id);
            console.log('消息类型:', result.rows[0].type);
            console.log('文本长度:', result.rows[0].text_length);

            // 删除测试消息
            await pool.query('DELETE FROM messages WHERE id = $1', [result.rows[0].id]);
            console.log('\n测试消息已删除');

        } catch (insertError) {
            console.log('❌ 插入失败！');
            console.log('错误代码:', insertError.code);
            console.log('错误消息:', insertError.message);
            console.log('错误详情:', insertError.detail);
            console.log('错误提示:', insertError.hint);

            // 如果是字符串长度错误，显示更多信息
            if (insertError.message.includes('太长')) {
                console.log('\n可能的原因:');
                console.log('- text 字段长度:', interviewInvitation.length);
                console.log('- type 字段长度:', 'interview_invitation'.length);
            }
        }

    } catch (err) {
        console.error('错误:', err);
    } finally {
        await pool.end();
    }
}

testMessageInsert();
