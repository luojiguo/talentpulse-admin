// 检查招聘者相关表结构，了解如何关联recruiter_id到用户信息和职位字段
const { pool } = require('./config/db');

async function checkRecruiterStructure() {
    try {
        console.log('开始检查招聘者相关表结构...');
        
        // 测试数据库连接
        const client = await pool.connect();
        console.log('✅ 数据库连接成功！');
        
        // 检查jobs表字段
        console.log('\n1. jobs表字段:');
        const jobsFields = await client.query(
            `SELECT column_name, data_type, is_nullable
             FROM information_schema.columns
             WHERE table_name = 'jobs'
             ORDER BY ordinal_position`
        );
        jobsFields.rows.forEach((field, index) => {
            console.log(`${index + 1}. ${field.column_name} (${field.data_type}) - 可为空: ${field.is_nullable}`);
        });
        
        // 检查recruiter_user表结构
        console.log('\n2. recruiter_user表字段:');
        const recruiterUserFields = await client.query(
            `SELECT column_name, data_type, is_nullable
             FROM information_schema.columns
             WHERE table_name = 'recruiter_user'
             ORDER BY ordinal_position`
        );
        recruiterUserFields.rows.forEach((field, index) => {
            console.log(`${index + 1}. ${field.column_name} (${field.data_type}) - 可为空: ${field.is_nullable}`);
        });
        
        // 检查users表结构
        console.log('\n3. users表字段:');
        const usersFields = await client.query(
            `SELECT column_name, data_type, is_nullable
             FROM information_schema.columns
             WHERE table_name = 'users'
             ORDER BY ordinal_position`
        );
        // 只显示主要字段
        const keyUserFields = usersFields.rows.filter(field => 
            ['id', 'name', 'email', 'phone', 'avatar', 'created_at'].includes(field.column_name)
        );
        keyUserFields.forEach((field, index) => {
            console.log(`${index + 1}. ${field.column_name} (${field.data_type}) - 可为空: ${field.is_nullable}`);
        });
        
        // 检查是否有recruiters表
        console.log('\n4. 检查是否存在recruiters表:');
        const hasRecruitersTable = await client.query(
            `SELECT table_name
             FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'recruiters'`
        );
        console.log(`   存在recruiters表: ${hasRecruitersTable.rows.length > 0 ? '✅ 是' : '❌ 否'}`);
        
        // 如果存在recruiters表，检查其结构
        if (hasRecruitersTable.rows.length > 0) {
            console.log('   recruiters表字段:');
            const recruitersFields = await client.query(
                `SELECT column_name, data_type, is_nullable
                 FROM information_schema.columns
                 WHERE table_name = 'recruiters'
                 ORDER BY ordinal_position`
            );
            recruitersFields.rows.forEach((field, index) => {
                console.log(`   ${index + 1}. ${field.column_name} (${field.data_type}) - 可为空: ${field.is_nullable}`);
            });
        }
        
        // 检查岗位列表查询结果，显示recruiter_id
        console.log('\n5. 岗位列表示例数据:');
        const jobsSample = await client.query('SELECT id, title, company, recruiter_id FROM jobs LIMIT 2');
        if (jobsSample.rows.length > 0) {
            console.log('   ID | 职位标题 | 公司 | recruiter_id');
            jobsSample.rows.forEach(job => {
                console.log(`   ${job.id} | ${job.title} | ${job.company} | ${job.recruiter_id}`);
            });
        } else {
            console.log('   暂无岗位数据');
        }
        
        // 检查招聘者用户数据
        console.log('\n6. 招聘者用户示例数据:');
        const recruiterUsersSample = await client.query(
            `SELECT ru.user_id, u.name, ru.company_id, c.name AS company_name
             FROM recruiter_user ru
             JOIN users u ON ru.user_id = u.id
             JOIN companies c ON ru.company_id = c.id
             LIMIT 2`
        );
        if (recruiterUsersSample.rows.length > 0) {
            console.log('   user_id | 姓名 | company_id | 公司名称');
            recruiterUsersSample.rows.forEach(ru => {
                console.log(`   ${ru.user_id} | ${ru.name} | ${ru.company_id} | ${ru.company_name}`);
            });
        } else {
            console.log('   暂无招聘者用户数据');
        }
        
        // 构建关联查询示例
        console.log('\n7. 关联查询示例 (jobs + users + recruiter_user):');
        const jobRecruiterJoin = await client.query(
            `SELECT 
                j.id AS job_id, 
                j.title AS job_title, 
                j.company AS job_company, 
                u.id AS recruiter_user_id, 
                u.name AS recruiter_name, 
                c.name AS company_name
            FROM jobs j
            LEFT JOIN users u ON j.recruiter_id = u.id
            LEFT JOIN recruiter_user ru ON u.id = ru.user_id
            LEFT JOIN companies c ON ru.company_id = c.id
            LIMIT 2`
        );
        if (jobRecruiterJoin.rows.length > 0) {
            console.log('   职位ID | 职位标题 | 职位公司 | 招聘者ID | 招聘者姓名 | 所属公司');
            jobRecruiterJoin.rows.forEach(row => {
                console.log(`   ${row.job_id} | ${row.job_title} | ${row.job_company} | ${row.recruiter_user_id} | ${row.recruiter_name} | ${row.company_name}`);
            });
        } else {
            console.log('   暂无关联数据');
        }
        
        client.release();
        console.log('\n🎉 招聘者相关表结构检查完成！');
    } catch (error) {
        console.error('❌ 检查招聘者表结构失败:', error.message);
        if (error.detail) {
            console.error('   详细错误:', error.detail);
        }
    } finally {
        await pool.end();
    }
}

checkRecruiterStructure();