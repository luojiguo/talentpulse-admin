// 测试日志API的简单脚本
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/activities/logs',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('📝 API响应状态码:', res.statusCode);
    console.log('📋 API响应数据:', data);
    try {
      const parsedData = JSON.parse(data);
      console.log('✅ 解析成功');
      console.log('📊 日志数量:', parsedData.data?.length || 0);
      if (parsedData.data && parsedData.data.length > 0) {
        console.log('📄 第一条日志:', parsedData.data[0]);
      }
    } catch (error) {
      console.error('❌ JSON解析失败:', error);
    }
    process.exit(0);
  });
});

req.on('error', (error) => {
  console.error('❌ 请求失败:', error);
  process.exit(1);
});

req.end();
