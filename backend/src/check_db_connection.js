// 检查数据库连接和表结构
const { pool } = require('./config/db');

async function checkDatabase() {
    try {
        console.log('开始检查数据库...');
        
        // 测试数据库连接
        const client = await pool.connect();
        console.log('✅ 数据库连接成功！');
        
        // 检查conversations表
        console.log('\n检查conversations表...');
        const conversationsCheck = await client.query('SELECT * FROM conversations LIMIT 1');
        console.log('✅ conversations表存在，结构正常');
        console.log('   表字段:', conversationsCheck.fields.map(f => f.name));
        
        // 检查messages表
        console.log('\n检查messages表...');
        const messagesCheck = await client.query('SELECT * FROM messages LIMIT 1');
        console.log('✅ messages表存在，结构正常');
        console.log('   表字段:', messagesCheck.fields.map(f => f.name));
        
        // 检查jobs表
        console.log('\n检查jobs表...');
        const jobsCheck = await client.query('SELECT * FROM jobs LIMIT 1');
        console.log('✅ jobs表存在，结构正常');
        
        // 检查users表
        console.log('\n检查users表...');
        const usersCheck = await client.query('SELECT * FROM users LIMIT 1');
        console.log('✅ users表存在，结构正常');
        
        client.release();
        console.log('\n🎉 所有必要的表都存在，数据库结构正常！');
    } catch (error) {
        console.error('❌ 数据库检查失败:', error.message);
        if (error.detail) {
            console.error('   详细错误:', error.detail);
        }
    } finally {
        await pool.end();
    }
}

checkDatabase();