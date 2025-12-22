// 插入测试日志数据脚本
const { pool } = require('./backend/src/config/db');

async function insertTestLogs() {
  try {
    // 测试日志数据
    const testLogs = [
      {
        user_id: 1,
        action: '登录系统',
        description: '管理员用户登录系统',
        ip_address: '192.168.1.100',
        log_type: 'login',
        resource_type: 'user',
        resource_id: 1,
        request_method: 'POST',
        request_url: '/api/users/login',
        response_status: 200,
        response_time: 150,
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        device_type: 'desktop',
        browser: 'Chrome',
        os: 'Windows 10'
      },
      {
        user_id: 1,
        action: '创建职位',
        description: '创建了新的招聘职位',
        ip_address: '192.168.1.100',
        log_type: 'create',
        resource_type: 'job',
        resource_id: 1,
        request_method: 'POST',
        request_url: '/api/jobs',
        response_status: 201,
        response_time: 250,
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        device_type: 'desktop',
        browser: 'Chrome',
        os: 'Windows 10'
      },
      {
        user_id: 2,
        action: '更新简历',
        description: '更新了个人简历信息',
        ip_address: '192.168.1.101',
        log_type: 'update',
        resource_type: 'resume',
        resource_id: 1,
        request_method: 'PUT',
        request_url: '/api/resumes/1',
        response_status: 200,
        response_time: 200,
        user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
        device_type: 'desktop',
        browser: 'Safari',
        os: 'macOS Sonoma'
      },
      {
        user_id: 3,
        action: '投递简历',
        description: '向职位投递了简历',
        ip_address: '192.168.1.102',
        log_type: 'create',
        resource_type: 'application',
        resource_id: 1,
        request_method: 'POST',
        request_url: '/api/applications',
        response_status: 201,
        response_time: 300,
        user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        device_type: 'mobile',
        browser: 'Safari',
        os: 'iOS 17.0'
      },
      {
        user_id: null,
        action: '访问首页',
        description: '匿名用户访问了系统首页',
        ip_address: '192.168.1.103',
        log_type: 'info',
        resource_type: 'page',
        resource_id: null,
        request_method: 'GET',
        request_url: '/',
        response_status: 200,
        response_time: 100,
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Firefox/119.0',
        device_type: 'desktop',
        browser: 'Firefox',
        os: 'Windows 10'
      },
      {
        user_id: 2,
        action: '查看职位详情',
        description: '查看了特定职位的详细信息',
        ip_address: '192.168.1.101',
        log_type: 'info',
        resource_type: 'job',
        resource_id: 1,
        request_method: 'GET',
        request_url: '/api/jobs/1',
        response_status: 200,
        response_time: 150,
        user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
        device_type: 'desktop',
        browser: 'Safari',
        os: 'macOS Sonoma'
      },
      {
        user_id: 3,
        action: '发送消息',
        description: '向招聘方发送了面试询问消息',
        ip_address: '192.168.1.102',
        log_type: 'create',
        resource_type: 'message',
        resource_id: 1,
        request_method: 'POST',
        request_url: '/api/messages',
        response_status: 201,
        response_time: 200,
        user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        device_type: 'mobile',
        browser: 'Safari',
        os: 'iOS 17.0'
      }
    ];

    // 插入日志数据
    for (const log of testLogs) {
      const query = `
        INSERT INTO public.system_logs (
          user_id, action, description, ip_address, log_type, resource_type, 
          resource_id, request_method, request_url, response_status, response_time, 
          user_agent, device_type, browser, os
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
        )
      `;
      const values = [
        log.user_id,
        log.action,
        log.description,
        log.ip_address,
        log.log_type,
        log.resource_type,
        log.resource_id,
        log.request_method,
        log.request_url,
        log.response_status,
        log.response_time,
        log.user_agent,
        log.device_type,
        log.browser,
        log.os
      ];
      await pool.query(query, values);
      console.log(`已插入日志: ${log.action}`);
    }

    console.log('✅ 成功插入7条测试日志数据');
    process.exit(0);
  } catch (error) {
    console.error('❌ 插入测试日志失败:', error);
    process.exit(1);
  }
}

insertTestLogs();
