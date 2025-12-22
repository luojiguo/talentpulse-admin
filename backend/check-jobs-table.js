// 检查jobs表结构
const { pool } = require('./src/config/db');

async function checkJobsTable() {
    try {
        // 查询jobs表的结构
        const result = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'jobs'
            ORDER BY ordinal_position
        `);
        
        console.log('=== jobs表结构 ===');
        result.rows.forEach(row => {
            console.log(`${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
        });
        
        // 检查特定字段是否存在
        const requiredFields = ['required_skills', 'preferred_skills', 'benefits'];
        console.log('\n=== 检查特定字段 ===');
        
        requiredFields.forEach(field => {
            const exists = result.rows.some(row => row.column_name === field);
            console.log(`${field}: ${exists ? '存在' : '不存在'}`);
        });
        
        process.exit(0);
    } catch (error) {
        console.error('查询表结构失败:', error);
        process.exit(1);
    }
}

checkJobsTable();