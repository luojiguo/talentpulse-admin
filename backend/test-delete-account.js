const axios = require('axios');

async function testDeleteAccount() {
  try {
    const userId = 27;
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjcsImVtYWlsIjoiMTIzNDU2Nzg5MUBleGFtcGxlLmNvbSIsIm5hbWUiOiLor7vlt7Tml6Xlip4iLCJyb2xlcyI6WyJjYW5kaWRhdGUiXSwidXJsZSI6ImN1c3RvbWVyIiwiaWF0IjoxNzQwNDQ3MjM4LCJleHAiOjE3NDA1MzM2Mzh9.mX1zXH0wX8X0X0X0X0X0X0X0X0X0X0X0X0X0X0X0X0X0X0';
    
    console.log(`正在测试删除用户ID ${userId} 的账号...`);
    
    const response = await axios.delete(`http://localhost:3001/api/users/${userId}/delete-account`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('注销成功:', response.data);
  } catch (error) {
    console.error('注销失败:');
    if (error.response) {
      // 服务器返回了错误响应
      console.error('状态码:', error.response.status);
      console.error('响应数据:', error.response.data);
      console.error('响应头:', error.response.headers);
    } else if (error.request) {
      // 请求已发出，但没有收到响应
      console.error('没有收到响应:', error.request);
    } else {
      // 请求配置出错
      console.error('请求配置错误:', error.message);
    }
    console.error('完整错误:', error);
  }
}

testDeleteAccount();