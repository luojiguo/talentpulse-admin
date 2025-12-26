const axios = require('axios');

async function testUpdate() {
    const jobId = 37; // 用户报错的ID
    const url = `http://localhost:3500/api/jobs/${jobId}`;

    const payload = {
        title: "测试职位-更新-修复后",
        location: "深圳",
        salary: "20-30K",
        description: "职位描述测试-修复后",
        required_skills: ["React", "TypeScript", "Node.js"],
        preferred_skills: ["Next.js", "Docker"],
        benefits: ["五险一金", "年底双薪", "弹性工作"],
        experience: "1-3年",
        degree: "本科",
        type: "全职",
        work_mode: "现场",
        job_level: "中级",
        hiring_count: 2,
        urgency: "紧急",
        department: "技术部",
        expire_date: "2025-12-31",
        status: "active"
    };

    try {
        console.log('Sending PUT request to:', url);
        const response = await axios.put(url, payload);
        console.log('Success:', response.data);
    } catch (error) {
        if (error.response) {
            console.error('Error Status:', error.response.status);
            console.error('Error Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error Message:', error.message);
        }
    }
}

testUpdate();
