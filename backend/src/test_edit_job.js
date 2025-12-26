const axios = require('axios');

// 测试编辑职位功能
async function testEditJob() {
    const baseURL = 'http://localhost:3000/api';

    try {
        console.log('=== 测试编辑职位功能 ===\n');

        // 1. 获取第一个职位
        console.log('1. 获取职位列表...');
        const jobsResponse = await axios.get(`${baseURL}/jobs`);
        if (!jobsResponse.data.data || jobsResponse.data.data.length === 0) {
            console.log('❌ 没有找到职位');
            return;
        }

        const job = jobsResponse.data.data[0];
        console.log(`✅ 找到职位: ${job.title} (ID: ${job.id})`);
        console.log('职位数据:', JSON.stringify(job, null, 2));

        // 2. 测试更新职位
        console.log('\n2. 测试更新职位...');
        const updateData = {
            title: job.title,
            location: job.location,
            salary: job.salary,
            description: job.description,
            required_skills: ['React', 'TypeScript', 'Node.js'], // 数组格式
            preferred_skills: ['Docker', 'Kubernetes'],
            benefits: ['五险一金', '弹性工作', '年度旅游'],
            experience: job.experience || '1-3年',
            degree: job.degree || '本科',
            type: job.type || '全职',
            work_mode: job.work_mode || '现场',
            job_level: job.job_level || '初级',
            hiring_count: job.hiring_count || 1,
            urgency: job.urgency || '普通',
            department: job.department || '',
            status: job.status
        };

        console.log('发送的更新数据:', JSON.stringify(updateData, null, 2));

        const updateResponse = await axios.put(`${baseURL}/jobs/${job.id}`, updateData);
        console.log('✅ 更新成功');
        console.log('返回数据:', JSON.stringify(updateResponse.data, null, 2));

        // 3. 验证更新结果
        console.log('\n3. 验证更新结果...');
        const verifyResponse = await axios.get(`${baseURL}/jobs/${job.id}`);
        const updatedJob = verifyResponse.data.data;

        console.log('更新后的职位数据:');
        console.log('- required_skills:', updatedJob.required_skills);
        console.log('- preferred_skills:', updatedJob.preferred_skills);
        console.log('- benefits:', updatedJob.benefits);

        // 检查JSONB字段是否正确
        if (Array.isArray(updatedJob.required_skills)) {
            console.log('✅ required_skills 是数组格式');
        } else {
            console.log('❌ required_skills 不是数组格式:', typeof updatedJob.required_skills);
        }

        if (Array.isArray(updatedJob.preferred_skills)) {
            console.log('✅ preferred_skills 是数组格式');
        } else {
            console.log('❌ preferred_skills 不是数组格式:', typeof updatedJob.preferred_skills);
        }

        if (Array.isArray(updatedJob.benefits)) {
            console.log('✅ benefits 是数组格式');
        } else {
            console.log('❌ benefits 不是数组格式:', typeof updatedJob.benefits);
        }

        console.log('\n=== 测试完成 ===');

    } catch (error) {
        console.error('❌ 测试失败:', error.response?.data || error.message);
        if (error.response) {
            console.error('响应状态:', error.response.status);
            console.error('响应数据:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testEditJob();
