// 检查对话相关的数据库问题
const { pool } = require('./config/db');

async function checkConversationIssue() {
    try {
        console.log('开始检查对话相关的数据库问题...');

        // 测试数据库连接
        const client = await pool.connect();
        console.log('✅ 数据库连接成功！');

        // 1. 检查conversations表的外键约束
        console.log('\n1. 检查conversations表的外键约束...');
        const constraintsResult = await client.query(`
            SELECT 
                tc.constraint_name, 
                tc.constraint_type, 
                kcu.column_name, 
                ccu.table_name AS foreign_table_name, 
                ccu.column_name AS foreign_column_name 
            FROM 
                information_schema.table_constraints AS tc 
                JOIN information_schema.key_column_usage AS kcu 
                  ON tc.constraint_name = kcu.constraint_name 
                  AND tc.table_schema = kcu.table_schema 
                JOIN information_schema.constraint_column_usage AS ccu 
                  ON ccu.constraint_name = tc.constraint_name 
                  AND ccu.table_schema = tc.table_schema 
            WHERE 
                tc.table_name = 'conversations' AND 
                tc.constraint_type = 'FOREIGN KEY';
        `);
        console.log('conversations表的外键约束:');
        constraintsResult.rows.forEach(constraint => {
            console.log(`   - ${constraint.constraint_name}: ${constraint.column_name} -> ${constraint.foreign_table_name}.${constraint.foreign_column_name}`);
        });

        // 2. 检查users表中的用户数据
        console.log('\n2. 检查users表中的用户数据...');
        const usersResult = await client.query(`
            SELECT u.id, u.name, u.email, string_agg(ur.role, ',') as role 
            FROM users u 
            LEFT JOIN user_roles ur ON u.id = ur.user_id 
            GROUP BY u.id, u.name, u.email
        `);
        console.log(`   共有 ${usersResult.rows.length} 个用户`);
        usersResult.rows.forEach(user => {
            console.log(`   - ID: ${user.id}, 名称: ${user.name}, 邮箱: ${user.email}, 角色: ${user.role || '无'}`);
        });

        // 3. 检查jobs表中的数据
        console.log('\n3. 检查jobs表中的数据...');
        const jobsResult = await client.query('SELECT id, title, company_id, recruiter_id FROM jobs');
        console.log(`   共有 ${jobsResult.rows.length} 个职位`);
        jobsResult.rows.forEach(job => {
            console.log(`   - ID: ${job.id}, 标题: ${job.title}, company_id: ${job.company_id}, recruiter_id: ${job.recruiter_id}`);
        });

        // 4. 检查companies表中的数据
        console.log('\n4. 检查companies表中的数据...');
        const companiesResult = await client.query('SELECT id, name FROM companies');
        console.log(`   共有 ${companiesResult.rows.length} 个公司`);
        companiesResult.rows.forEach(company => {
            console.log(`   - ID: ${company.id}, 名称: ${company.name}`);
        });

        // 5. 检查recruiters表中的数据
        console.log('\n5. 检查recruiters表中的数据...');
        const recruitersResult = await client.query('SELECT id, user_id, company_id FROM recruiters');
        console.log(`   共有 ${recruitersResult.rows.length} 个招聘者`);
        recruitersResult.rows.forEach(recruiter => {
            console.log(`   - ID: ${recruiter.id}, user_id: ${recruiter.user_id}, company_id: ${recruiter.company_id}`);
        });

        client.release();
        console.log('\n🎉 检查完成！');
    } catch (error) {
        console.error('❌ 检查失败:', error.message);
        if (error.detail) {
            console.error('   详细错误:', error.detail);
        }
    } finally {
        await pool.end();
    }
}

checkConversationIssue();