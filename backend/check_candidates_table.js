const { pool } = require('./src/config/db');

async function checkCandidatesTable() {
    try {
        console.log('检查 candidates 表结构...');
        
        // 查询表结构
        const result = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'candidates'
            ORDER BY ordinal_position
        `);
        
        console.log('candidates 表字段信息:');
        console.table(result.rows);
        
        // 检查特定字段是否存在
        const availabilityStatusExists = result.rows.some(col => col.column_name === 'availability_status');
        const jobStatusExists = result.rows.some(col => col.column_name === 'job_status');
        
        console.log(`\navailability_status 字段存在: ${availabilityStatusExists}`);
        console.log(`job_status 字段存在: ${jobStatusExists}`);
        
        // 关闭连接池
        await pool.end();
        
    } catch (error) {
        console.error('检查失败:', error.message);
        process.exit(1);
    }
}

checkCandidatesTable();
