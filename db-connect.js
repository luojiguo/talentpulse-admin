// Node.js连接PostgreSQL示例代码
// 使用pg库连接到Talent数据库

// 安装pg库：npm install pg
const { Pool } = require('pg');

// 配置数据库连接
const pool = new Pool({
    user: 'postgres',           // 用户名，默认postgres
    host: 'localhost',          // 主机地址，默认localhost
    database: 'Talent',         // 数据库名，从截图看是Talent
    password: '123456',         // 密码，用户提供的123456
    port: 5432,                 // 端口，默认5432
    max: 20,                    // 连接池最大连接数
    idleTimeoutMillis: 30000,   // 连接空闲超时时间
    connectionTimeoutMillis: 2000, // 连接超时时间
});

// 测试连接
async function testConnection() {
    try {
        // 获取连接
        const client = await pool.connect();
        console.log('✅ 成功连接到PostgreSQL数据库！');
        
        // 测试查询：获取所有表名
        const res = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);
        
        console.log('📋 数据库中的表：');
        res.rows.forEach((row, index) => {
            console.log(`${index + 1}. ${row.table_name}`);
        });
        
        // 释放连接
        client.release();
        
        // 关闭连接池
        await pool.end();
        console.log('\n✅ 连接已关闭！');
        
    } catch (error) {
        console.error('❌ 连接数据库失败：', error.message);
        process.exit(1);
    }
}

// 执行测试
if (require.main === module) {
    testConnection();
}

// 导出连接池，供其他模块使用
module.exports = pool;
