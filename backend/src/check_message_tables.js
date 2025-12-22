// 检查消息相关表的结构
const { pool } = require('./config/db');

async function checkMessageTablesStructure() {
    try {
        console.log('正在检查消息相关表的结构...');
        
        // 检查conversations表结构
        console.log('\n1. conversations表结构:');
        const conversationsResult = await pool.query(
            `SELECT column_name, data_type, is_nullable, column_default
             FROM information_schema.columns
             WHERE table_name = 'conversations'
             ORDER BY ordinal_position`
        );
        conversationsResult.rows.forEach(col => {
            console.log(`   ${col.column_name} (${col.data_type}) - 可为空: ${col.is_nullable}, 默认值: ${col.column_default || '无'}`);
        });
        
        // 检查messages表结构
        console.log('\n2. messages表结构:');
        const messagesResult = await pool.query(
            `SELECT column_name, data_type, is_nullable, column_default
             FROM information_schema.columns
             WHERE table_name = 'messages'
             ORDER BY ordinal_position`
        );
        messagesResult.rows.forEach(col => {
            console.log(`   ${col.column_name} (${col.data_type}) - 可为空: ${col.is_nullable}, 默认值: ${col.column_default || '无'}`);
        });
        
        await pool.end();
    } catch (error) {
        console.error('检查消息表结构时出错:', error.message);
        await pool.end();
    }
}

checkMessageTablesStructure();