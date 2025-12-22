// 插入模拟数据脚本
const { pool } = require('./backend/src/config/db');
const fs = require('fs');
const path = require('path');

async function insertMockData() {
    try {
        // 1. 测试数据库连接
        console.log('正在测试数据库连接...');
        const client = await pool.connect();
        console.log('✅ 成功连接到PostgreSQL数据库！');

        // 2. 读取并执行模拟数据SQL脚本
        console.log('\n正在执行模拟数据SQL脚本...');
        const sqlScriptPath = path.join(__dirname, 'mock_data.sql');
        const sqlScript = fs.readFileSync(sqlScriptPath, 'utf8');
        
        // 执行SQL脚本
        await client.query(sqlScript);
        console.log('✅ 成功插入模拟数据！');

        // 3. 查询验证插入结果
        console.log('\n正在验证插入结果...');
        
        // 验证企业数据
        const companiesResult = await client.query('SELECT COUNT(*) FROM companies');
        console.log(`📊 企业数量: ${companiesResult.rows[0].count}`);
        
        // 验证HR用户数据
        const recruitersResult = await client.query('SELECT COUNT(*) FROM recruiters');
        console.log(`👥 HR数量: ${recruitersResult.rows[0].count}`);
        
        // 验证岗位数据
        const jobsResult = await client.query('SELECT COUNT(*) FROM jobs');
        console.log(`💼 岗位数量: ${jobsResult.rows[0].count}`);
        
        // 验证求职者数据
        const candidatesResult = await client.query('SELECT COUNT(*) FROM candidates');
        console.log(`👤 求职者数量: ${candidatesResult.rows[0].count}`);

        client.release();
        await pool.end();
        console.log('\n✅ 模拟数据插入完成！');
        
    } catch (error) {
        console.error('❌ 插入模拟数据失败:', error.message);
        console.error('详细错误:', error);
        process.exit(1);
    }
}

// 执行插入
insertMockData();
