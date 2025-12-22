// 检查数据库结构
const { pool } = require('./config/db');

async function checkDatabaseStructure() {
    try {
        console.log('正在检查数据库结构...');
        
        // 获取所有表
        const tablesResult = await pool.query(
            `SELECT table_name 
             FROM information_schema.tables 
             WHERE table_schema = 'public' 
             ORDER BY table_name`
        );
        
        console.log('数据库中的表:');
        tablesResult.rows.forEach((table, index) => {
            console.log(`${index + 1}. ${table.table_name}`);
        });
        
        // 检查是否有消息相关的表
        const hasMessagesTable = tablesResult.rows.some(table => 
            table.table_name.includes('message') || table.table_name.includes('conversation')
        );
        
        console.log(`\n是否存在消息相关表: ${hasMessagesTable ? '是' : '否'}`);
        
        await pool.end();
    } catch (error) {
        console.error('检查数据库结构时出错:', error.message);
        await pool.end();
    }
}

checkDatabaseStructure();