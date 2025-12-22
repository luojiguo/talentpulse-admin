// 检查API返回的数据结构
const axios = require('axios');

async function checkApiResponse() {
    try {
        console.log('正在检查API返回的数据结构...');
        
        // 调用对话列表接口
        const response = await axios.get('http://localhost:3001/api/messages/conversations/20');
        
        const { data } = response.data;
        
        console.log(`\nAPI返回了 ${data.length} 个对话`);
        
        // 显示每个对话的招聘者信息
        data.forEach((conv, index) => {
            console.log(`\n对话 ${index + 1}:`);
            console.log(`  ID: ${conv.id}`);
            console.log(`  招聘者姓名: ${conv.recruiter_name}`);
            console.log(`  招聘者ID字段:`);
            console.log(`    - recruiterId: ${conv.recruiterId}`);
            console.log(`    - recruiterid: ${conv.recruiterid}`);
            console.log(`    - recruiter_id: ${conv.recruiter_id}`);
            console.log(`    - RecruiterId: ${conv.RecruiterId}`);
            console.log(`  更新时间字段:`);
            console.log(`    - updatedAt: ${conv.updatedAt}`);
            console.log(`    - updated_at: ${conv.updated_at}`);
            console.log(`    - updatedat: ${conv.updatedat}`);
            console.log(`  公司名称: ${conv.company_name}`);
            console.log(`  职位名称: ${conv.job_title}`);
        });
        
        console.log('\n✅ API响应检查完成！');
    } catch (error) {
        console.error('检查API响应时出错:', error.message);
        if (error.response) {
            console.error('响应状态:', error.response.status);
            console.error('响应数据:', error.response.data);
        }
    }
}

checkApiResponse();