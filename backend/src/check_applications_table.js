const { pool } = require('./config/db');

async function checkApplicationsTable() {
    try {
        console.log('正在检查 applications 表结构...');
        
        // 查询表结构
        const result = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'applications' 
            ORDER BY ordinal_position
        `);
        
        console.log('Applications 表结构:');
        result.rows.forEach(col => {
            console.log(`- ${col.column_name}: ${col.data_type}`);
        });
        
        // 检查表中数据
        const dataResult = await pool.query('SELECT * FROM applications');
        console.log(`\nApplications 表数据量: ${dataResult.rows.length}`);
        
        if (dataResult.rows.length > 0) {
            console.log('示例数据:');
            dataResult.rows.slice(0, 3).forEach(row => {
                console.log(`- ID: ${row.id}, Candidate ID: ${row.candidate_id}, Job ID: ${row.job_id}, Stage: ${row.stage}`);
            });
        } else {
            console.log('表中没有数据');
        }
        
        await pool.end();
    } catch (error) {
        console.error('查询错误:', error.message);
        process.exit(1);
    }
}

checkApplicationsTable();