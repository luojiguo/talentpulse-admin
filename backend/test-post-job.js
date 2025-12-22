const fetch = require('node-fetch').default || require('node-fetch');

async function testPostJob() {
    try {
        const response = await fetch('http://localhost:3001/api/jobs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: '测试职位 ' + Date.now(),
                location: '上海',
                salary: '25-35K',
                description: '这是一个测试职位描述',
                required_skills: ['Node.js', 'PostgreSQL', 'React'],
                posterId: 1,
                company: 'Tech Corp',
                type: '全职',
                status: 'active'
            })
        });
        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

testPostJob();

