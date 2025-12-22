// 测试数据库连接和插入数据
const { pool } = require('./src/config/db');

async function testDatabase() {
    try {
        // 1. 测试数据库连接
        console.log('正在测试数据库连接...');
        const client = await pool.connect();
        console.log('✅ 成功连接到PostgreSQL数据库！');

        // 2. 向users表插入求职者信息
        console.log('\n正在向users表插入求职者信息...');
        
        const insertQuery = `
            INSERT INTO users (
                name, 
                email, 
                password, 
                role, 
                phone, 
                avatar,
                status
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7
            ) RETURNING *
        `;
        
        const values = [
            '艾希', // name
            'aixi@example.com', // email
            'password123', // password (实际应用中应该加密)
            'candidate', // role
            '13800138000', // phone
            'default-avatar.png', // avatar
            'active' // status
        ];
        
        const result = await client.query(insertQuery, values);
        console.log('✅ 成功插入求职者信息！');
        console.log('插入的用户信息:', result.rows[0]);

        // 3. 查询验证插入结果
        console.log('\n正在验证插入结果...');
        const selectQuery = `SELECT * FROM users WHERE name = $1`;
        const selectResult = await client.query(selectQuery, ['艾希']);
        
        if (selectResult.rows.length > 0) {
            console.log('✅ 验证成功！可以查询到刚插入的用户信息:');
            console.log(selectResult.rows[0]);
        } else {
            console.log('❌ 验证失败！未查询到刚插入的用户信息');
        }

        client.release();
        await pool.end();
        console.log('\n✅ 测试完成！数据库连接和插入操作都成功了。');
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
        console.error('详细错误:', error);
        process.exit(1);
    }
}

// 执行测试
testDatabase();
