// 测试招聘者获取对话列表的问题
const http = require('http');

// 测试用户ID 20 (这应该是一个招聘者)
const userId = 20;

function testRecruiterConversations() {
    console.log(`正在测试招聘者 (userId: ${userId}) 的对话列表...\n`);

    const req = http.get(`http://localhost:3001/api/messages/conversations/${userId}`, (res) => {
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            try {
                const response = JSON.parse(data);
                const conversations = response.data;

                console.log(`✅ API返回了 ${conversations.length} 个对话\n`);

                // 分析对话数据
                conversations.forEach((conv, index) => {
                    console.log(`对话 ${index + 1}:`);
                    console.log(`  ID: ${conv.id}`);
                    console.log(`  候选人: ${conv.candidate_name} (ID: ${conv.candidateId})`);
                    console.log(`  招聘者: ${conv.recruiter_name} (ID: ${conv.recruiterId})`);
                    console.log(`  招聘者用户ID: ${conv.recruiterUserId}`);
                    console.log(`  职位: ${conv.job_title}`);
                    console.log(`  公司: ${conv.company_name}`);
                    console.log(`  最后消息: ${conv.lastMessage}`);
                    console.log('');
                });

                // 检查是否所有对话的 recruiterUserId 都等于当前用户ID
                const validConversations = conversations.filter(conv =>
                    Number(conv.recruiterUserId) === Number(userId)
                );
                const invalidConversations = conversations.filter(conv =>
                    Number(conv.recruiterUserId) !== Number(userId)
                );

                console.log('📊 数据分析:');
                console.log(`  有效对话 (recruiterUserId = ${userId}): ${validConversations.length}`);
                console.log(`  无效对话 (recruiterUserId ≠ ${userId}): ${invalidConversations.length}`);

                if (invalidConversations.length > 0) {
                    console.log('\n❌ 发现问题：返回了不属于该招聘者的对话！');
                    console.log('无效对话详情:');
                    invalidConversations.forEach(conv => {
                        console.log(`  - 对话ID ${conv.id}: recruiterUserId=${conv.recruiterUserId}, 应该是 ${userId}`);
                    });
                } else {
                    console.log('\n✅ 所有对话都属于该招聘者');
                }

            } catch (error) {
                console.error('❌ 解析JSON数据时出错:', error.message);
            }
        });
    });

    req.on('error', (error) => {
        console.error('❌ 请求API时出错:', error.message);
        console.log('\n提示: 请确保后端服务正在运行 (npm run dev)');
    });
}

testRecruiterConversations();
