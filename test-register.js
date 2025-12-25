// 测试注册流程的脚本
const axios = require('axios');

// 生成随机邮箱
const generateRandomEmail = () => {
  const timestamp = Date.now();
  return `test_user_${timestamp}@example.com`;
};

// 生成随机手机号
const generateRandomPhone = () => {
  return '138' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
};

// 测试注册流程
async function testRegister() {
  try {
    console.log('开始测试注册流程...');
    
    // 准备测试数据
    const testData = {
      name: '测试用户',
      email: generateRandomEmail(),
      phone: generateRandomPhone(),
      password: 'Test1234', // 符合要求：8位以上，包含字母和数字
      userType: 'candidate' // 求职者角色
    };
    
    console.log('使用测试数据:', {
      ...testData,
      password: '*** 密码已隐藏 ***' // 隐藏密码，保护安全
    });
    
    // 发送注册请求
    const response = await axios.post('http://localhost:3001/api/users/register', testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('\n✅ 注册成功!');
    console.log('响应数据:', response.data);
    
    // 测试登录流程
    console.log('\n开始测试登录流程...');
    
    const loginResponse = await axios.post('http://localhost:3001/api/users/login', {
      identifier: testData.email,
      password: testData.password,
      userType: testData.userType
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('\n✅ 登录成功!');
    console.log('登录响应:', {
      status: loginResponse.data.status,
      message: loginResponse.data.message,
      hasToken: !!loginResponse.data.token,
      userData: {
        id: loginResponse.data.data.id,
        name: loginResponse.data.data.name,
        email: loginResponse.data.data.email,
        roles: loginResponse.data.data.roles,
        role: loginResponse.data.data.role
      }
    });
    
    console.log('\n🎉 测试流程完成! 注册和登录都成功了!');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    if (error.response) {
      console.error('错误响应:', {
        status: error.response.status,
        data: error.response.data
      });
    }
  }
}

// 运行测试
testRegister();
