// 检查jobs表结构，确认company字段是否存在
const { pool } = require('./config/db');

async function checkJobsCompanyField() {
    try {
        console.log('开始检查jobs表的company字段...');
        
        // 测试数据库连接
        const client = await pool.connect();
        console.log('✅ 数据库连接成功！');
        
        // 检查jobs表的字段
        console.log('\njobs表字段列表:');
        const jobsFields = await client.query(
            `SELECT column_name, data_type, is_nullable, column_default
             FROM information_schema.columns
             WHERE table_name = 'jobs'
             ORDER BY ordinal_position`
        );
        jobsFields.rows.forEach((field, index) => {
            console.log(`${index + 1}. ${field.column_name} (${field.data_type}) - 可为空: ${field.is_nullable}, 默认值: ${field.column_default || '无'}`);
        });
        
        // 检查是否包含company字段
        const hasCompanyField = jobsFields.rows.some(field => field.column_name === 'company');
        console.log(`\n是否包含company字段: ${hasCompanyField ? '✅ 是' : '❌ 否'}`);
        
        // 检查jobs表的示例数据
        console.log('\njobs表示例数据:');
        const jobsSample = await client.query('SELECT * FROM jobs LIMIT 1');
        if (jobsSample.rows.length > 0) {
            console.log('   示例数据字段:', Object.keys(jobsSample.rows[0]));
            console.log('   示例数据:', JSON.stringify(jobsSample.rows[0], null, 2));
        } else {
            console.log('   暂无岗位数据');
        }
        
        // 检查与companies表的关联
        console.log('\n检查与companies表的关联:');
        const companiesSample = await client.query('SELECT * FROM companies LIMIT 1');
        if (companiesSample.rows.length > 0) {
            console.log('   companies表示例数据:', JSON.stringify(companiesSample.rows[0], null, 2));
        } else {
            console.log('   暂无公司数据');
        }
        
        client.release();
        console.log('\n🎉 jobs表company字段检查完成！');
    } catch (error) {
        console.error('❌ 检查jobs表失败:', error.message);
        if (error.detail) {
            console.error('   详细错误:', error.detail);
        }
    } finally {
        await pool.end();
    }
}

checkJobsCompanyField();