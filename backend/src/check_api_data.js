// 使用内置http模块检查API返回的数据结构
const http = require('http');

function checkApiData() {
    console.log('正在检查API返回的数据结构...');
    
    // 发送HTTP GET请求
    const req = http.get('http://localhost:3001/api/messages/conversations/20', (res) => {
        let data = '';
        
        // 接收数据
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        // 数据接收完成
        res.on('end', () => {
            try {
                const response = JSON.parse(data);
                const conversations = response.data;
                
                console.log(`\nAPI返回了 ${conversations.length} 个对话`);
                
                // 显示每个对话的招聘者信息
                conversations.forEach((conv, index) => {
                    console.log(`\n对话 ${index + 1}:`);
                    console.log(`  ID: ${conv.id}`);
                    console.log(`  招聘者姓名: ${conv.recruiter_name}`);
                    console.log(`  招聘者ID字段:`);
                    console.log(`    - recruiterId: ${conv.recruiterId}`);
                    console.log(`    - recruiterid: ${conv.recruiterid}`);
                    console.log(`    - recruiter_id: ${conv.recruiter_id}`);
                    console.log(`    - RecruiterId: ${conv.RecruiterId}`);
                    console.log(`  公司名称: ${conv.company_name}`);
                    console.log(`  职位名称: ${conv.job_title}`);
                });
                
                // 统计不同招聘者的数量
                const recruiterNames = new Set();
                conversations.forEach(conv => {
                    recruiterNames.add(conv.recruiter_name);
                });
                
                console.log(`\n总共有 ${recruiterNames.size} 个不同的招聘者:`);
                console.log(`  ${Array.from(recruiterNames).join(', ')}`);
                
                console.log('\n✅ API响应检查完成！');
            } catch (error) {
                console.error('解析JSON数据时出错:', error.message);
            }
        });
    });
    
    // 处理请求错误
    req.on('error', (error) => {
        console.error('请求API时出错:', error.message);
    });
}

checkApiData();