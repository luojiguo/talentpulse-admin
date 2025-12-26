// 检查头像数据的获取情况
const http = require('http');

function checkAvatarData() {
    console.log('正在检查头像数据的获取情况...\n');

    // 检查对话列表中的头像数据
    const req = http.get('http://localhost:3001/api/messages/conversations/20', (res) => {
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            try {
                const response = JSON.parse(data);
                const conversations = response.data;

                console.log(`✅ API返回了 ${conversations.length} 个对话\n`);

                // 检查每个对话的头像字段
                conversations.forEach((conv, index) => {
                    console.log(`对话 ${index + 1}:`);
                    console.log(`  ID: ${conv.id}`);
                    console.log(`  候选人姓名: ${conv.candidate_name || '未知'}`);
                    console.log(`  候选人头像: ${conv.candidate_avatar || '(空)'}`);
                    console.log(`  招聘者姓名: ${conv.recruiter_name || '未知'}`);
                    console.log(`  招聘者头像: ${conv.recruiter_avatar || '(空)'}`);
                    console.log(`  公司名称: ${conv.company_name || '未知'}`);
                    console.log(`  职位名称: ${conv.job_title || '未知'}`);
                    console.log('');
                });

                // 统计头像数据完整性
                let candidateAvatarCount = 0;
                let recruiterAvatarCount = 0;

                conversations.forEach(conv => {
                    if (conv.candidate_avatar && conv.candidate_avatar !== '') {
                        candidateAvatarCount++;
                    }
                    if (conv.recruiter_avatar && conv.recruiter_avatar !== '') {
                        recruiterAvatarCount++;
                    }
                });

                console.log('📊 头像数据统计:');
                console.log(`  候选人头像: ${candidateAvatarCount}/${conversations.length} (${(candidateAvatarCount / conversations.length * 100).toFixed(1)}%)`);
                console.log(`  招聘者头像: ${recruiterAvatarCount}/${conversations.length} (${(recruiterAvatarCount / conversations.length * 100).toFixed(1)}%)`);

                // 检查头像路径格式
                console.log('\n🔍 头像路径格式检查:');
                const candidateAvatars = conversations
                    .filter(c => c.candidate_avatar && c.candidate_avatar !== '')
                    .map(c => c.candidate_avatar);
                const recruiterAvatars = conversations
                    .filter(c => c.recruiter_avatar && c.recruiter_avatar !== '')
                    .map(c => c.recruiter_avatar);

                if (candidateAvatars.length > 0) {
                    console.log(`  候选人头像示例: ${candidateAvatars[0]}`);
                } else {
                    console.log('  候选人头像: 无数据');
                }

                if (recruiterAvatars.length > 0) {
                    console.log(`  招聘者头像示例: ${recruiterAvatars[0]}`);
                } else {
                    console.log('  招聘者头像: 无数据');
                }

                console.log('\n✅ 头像数据检查完成！');

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

checkAvatarData();
