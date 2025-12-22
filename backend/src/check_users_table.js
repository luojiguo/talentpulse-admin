// 检查users表结构，确认是否有position字段
const { pool } = require('./config/db');

async function checkUsersTable() {
    try {
        console.log('开始检查users表结构...');
        
        // 测试数据库连接
        const client = await pool.connect();
        console.log('✅ 数据库连接成功！');
        
        // 检查users表的字段
        console.log('\nusers表字段列表:');
        const usersFields = await client.query(
            `SELECT column_name, data_type, is_nullable, column_default
             FROM information_schema.columns
             WHERE table_name = 'users'
             ORDER BY ordinal_position`
        );
        usersFields.rows.forEach((field, index) => {
            console.log(`${index + 1}. ${field.column_name} (${field.data_type}) - 可为空: ${field.is_nullable}, 默认值: ${field.column_default || '无'}`);
        });
        
        // 检查是否包含position字段
        const hasPosition = usersFields.rows.some(field => field.column_name === 'position');
        console.log(`\n是否包含position字段: ${hasPosition ? '✅ 是' : '❌ 否'}`);
        
        // 检查recruiters表的结构
        console.log('\nrecruiters表字段列表:');
        const recruitersFields = await client.query(
            `SELECT column_name, data_type, is_nullable, column_default
             FROM information_schema.columns
             WHERE table_name = 'recruiters'
             ORDER BY ordinal_position`
        );
        recruitersFields.rows.forEach((field, index) => {
            console.log(`${index + 1}. ${field.column_name} (${field.data_type}) - 可为空: ${field.is_nullable}, 默认值: ${field.column_default || '无'}`);
        });
        
        client.release();
        console.log('\n🎉 users表结构检查完成！');
    } catch (error) {
        console.error('❌ 检查users表失败:', error.message);
        if (error.detail) {
            console.error('   详细错误:', error.detail);
        }
    } finally {
        await pool.end();
    }
}

checkUsersTable();