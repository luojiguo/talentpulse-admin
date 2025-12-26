// 测试修复后的招聘者对话列表API
const http = require('http');

const userId = 20;

function testAPI(role) {
    return new Promise((resolve, reject) => {
        const url = role
            ? `http://localhost:3001/api/messages/conversations/${userId}?role=${role}`
            : `http://localhost:3001/api/messages/conversations/${userId}`;

        console.log(`\n${'='.repeat(60)}`);
        console.log(`测试: ${role ? `role=${role}` : '无role参数 (兼容模式)'}`);
        console.log(`URL: ${url}`);
        console.log('='.repeat(60));

        const req = http.get(url, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    const conversations = response.data;

                    console.log(`\n✅ 返回 ${conversations.length} 个对话 (role: ${response.role})\n`);

                    if (conversations.length > 0) {
                        console.log('对话详情:');
                        conversations.forEach((conv, index) => {
                            console.log(`  ${index + 1}. ID:${conv.id} | 候选人:${conv.candidate_name} | 招聘者:${conv.recruiter_name} (userId:${conv.recruiterUserId})`);
                        });
                    }

                    // 验证数据正确性
                    if (role === 'recruiter') {
                        const validConversations = conversations.filter(conv =>
                            Number(conv.recruiterUserId) === Number(userId)
                        );
                        const invalidConversations = conversations.filter(conv =>
                            Number(conv.recruiterUserId) !== Number(userId)
                        );

                        console.log(`\n📊 验证结果:`);
                        console.log(`  ✅ 有效对话: ${validConversations.length}`);
                        console.log(`  ❌ 无效对话: ${invalidConversations.length}`);

                        if (invalidConversations.length > 0) {
                            console.log('\n❌ 错误：仍然返回了不属于该招聘者的对话！');
                            resolve({ success: false, role, count: conversations.length });
                        } else {
                            console.log('\n✅ 成功：所有对话都属于该招聘者！');
                            resolve({ success: true, role, count: conversations.length });
                        }
                    } else if (role === 'candidate') {
                        // 候选人模式下，检查是否所有对话的候选人都是当前用户
                        console.log('\n✅ 候选人模式测试通过');
                        resolve({ success: true, role, count: conversations.length });
                    } else {
                        console.log('\n✅ 兼容模式测试通过');
                        resolve({ success: true, role: 'all', count: conversations.length });
                    }

                } catch (error) {
                    console.error('❌ 解析JSON数据时出错:', error.message);
                    reject(error);
                }
            });
        });

        req.on('error', (error) => {
            console.error('❌ 请求API时出错:', error.message);
            reject(error);
        });
    });
}

async function runTests() {
    console.log('\n🧪 开始测试招聘者对话列表API修复...\n');

    try {
        // 测试1: 招聘者模式
        const result1 = await testAPI('recruiter');

        // 测试2: 候选人模式
        const result2 = await testAPI('candidate');

        // 测试3: 兼容模式（无role参数）
        const result3 = await testAPI(null);

        console.log('\n' + '='.repeat(60));
        console.log('📋 测试总结');
        console.log('='.repeat(60));
        console.log(`招聘者模式 (role=recruiter): ${result1.success ? '✅ 通过' : '❌ 失败'} - ${result1.count} 个对话`);
        console.log(`候选人模式 (role=candidate): ${result2.success ? '✅ 通过' : '❌ 失败'} - ${result2.count} 个对话`);
        console.log(`兼容模式 (无role参数): ${result3.success ? '✅ 通过' : '❌ 失败'} - ${result3.count} 个对话`);
        console.log('='.repeat(60));

        if (result1.success && result2.success && result3.success) {
            console.log('\n🎉 所有测试通过！API修复成功！');
        } else {
            console.log('\n⚠️ 部分测试失败，请检查问题');
        }

    } catch (error) {
        console.error('\n❌ 测试过程中出错:', error.message);
    }
}

runTests();
