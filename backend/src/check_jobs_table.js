// 检查岗位列表中的HR ID字段
const { pool } = require('./config/db');

async function checkJobsAndRecruiterFields() {
    try {
        console.log('开始检查岗位列表中的HR ID字段...');
        
        // 测试数据库连接
        const client = await pool.connect();
        console.log('✅ 数据库连接成功！');
        
        // 1. 检查jobs表的字段
        console.log('\n1. jobs表字段列表:');
        const jobsFields = await client.query(
            `SELECT column_name, data_type, is_nullable, column_default
             FROM information_schema.columns
             WHERE table_name = 'jobs'
             ORDER BY ordinal_position`
        );
        jobsFields.rows.forEach((field, index) => {
            console.log(`${index + 1}. ${field.column_name} (${field.data_type}) - 可为空: ${field.is_nullable}, 默认值: ${field.column_default || '无'}`);
        });
        
        // 2. 检查是否包含recruiter_id字段
        const hasRecruiterId = jobsFields.rows.some(field => field.column_name === 'recruiter_id');
        console.log(`\n2. 是否包含recruiter_id字段: ${hasRecruiterId ? '✅ 是' : '❌ 否'}`);
        
        // 3. 检查招聘者相关表
        console.log('\n3. 招聘者相关表检查:');
        
        // 检查recruiter_user表
        try {
            const recruiterUserFields = await client.query(
                `SELECT column_name, data_type
                 FROM information_schema.columns
                 WHERE table_name = 'recruiter_user'
                 ORDER BY ordinal_position`
            );
            console.log('   ✅ recruiter_user表字段:', recruiterUserFields.rows.map(f => f.column_name).join(', '));
        } catch (err) {
            console.log('   ❌ recruiter_user表不存在或无法访问');
        }
        
        // 检查recruiters表
        try {
            const recruitersFields = await client.query(
                `SELECT column_name, data_type
                 FROM information_schema.columns
                 WHERE table_name = 'recruiters'
                 ORDER BY ordinal_position`
            );
            console.log('   ✅ recruiters表字段:', recruitersFields.rows.map(f => f.column_name).join(', '));
        } catch (err) {
            console.log('   ❌ recruiters表不存在或无法访问');
        }
        
        // 4. 检查当前岗位列表API的实际返回字段
        console.log('\n4. 当前岗位列表API查询测试:');
        const jobListQuery = `
            SELECT 
                j.*, 
                c.name AS company_name,
                r.position AS recruiter_position,
                u.name AS recruiter_name
            FROM jobs j
            LEFT JOIN companies c ON j.company_id = c.id
            LEFT JOIN recruiters r ON j.recruiter_id = r.id
            LEFT JOIN users u ON r.user_id = u.id
            LIMIT 1
        `;
        
        try {
            const jobListResult = await client.query(jobListQuery);
            if (jobListResult.rows.length > 0) {
                const job = jobListResult.rows[0];
                console.log('   ✅ 岗位列表API查询成功');
                console.log('   返回的字段:', Object.keys(job).join(', '));
                console.log('   recruiter_id值:', job.recruiter_id);
                console.log('   recruiter_name值:', job.recruiter_name);
                console.log('   recruiter_position值:', job.recruiter_position);
            } else {
                console.log('   ✅ 岗位列表API查询成功，但暂无数据');
            }
        } catch (err) {
            console.log('   ❌ 岗位列表API查询失败:', err.message);
            
            // 尝试简化查询
            console.log('\n5. 简化的岗位列表查询:');
            const simpleQuery = `SELECT * FROM jobs LIMIT 1`;
            const simpleResult = await client.query(simpleQuery);
            if (simpleResult.rows.length > 0) {
                const job = simpleResult.rows[0];
                console.log('   ✅ 简化查询成功');
                console.log('   简化查询返回字段:', Object.keys(job).join(', '));
                console.log('   recruiter_id值:', job.recruiter_id);
            }
        }
        
        client.release();
        console.log('\n🎉 检查完成！');
    } catch (error) {
        console.error('❌ 检查过程中出现错误:', error.message);
        if (error.detail) {
            console.error('   详细错误:', error.detail);
        }
    } finally {
        await pool.end();
    }
}

checkJobsAndRecruiterFields();