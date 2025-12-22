// 检查对话相关的数据库问题 - 简化版
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
        
        // 2. 检查candidates表和recruiters表的结构
        console.log('\n2. 检查candidates表结构...');
        const candidatesColumns = await client.query(`
            SELECT column_name, data_type FROM information_schema.columns 
            WHERE table_name = 'candidates' ORDER BY ordinal_position
        `);
        console.log('candidates表字段:');
        candidatesColumns.rows.forEach(col => {
            console.log(`   - ${col.column_name} (${col.data_type})`);
        });
        
        console.log('\n3. 检查recruiters表结构...');
        const recruitersColumns = await client.query(`
            SELECT column_name, data_type FROM information_schema.columns 
            WHERE table_name = 'recruiters' ORDER BY ordinal_position
        `);
        console.log('recruiters表字段:');
        recruitersColumns.rows.forEach(col => {
            console.log(`   - ${col.column_name} (${col.data_type})`);
        });
        
        // 3. 检查users表结构
        console.log('\n4. 检查users表结构...');
        const usersColumns = await client.query(`
            SELECT column_name, data_type FROM information_schema.columns 
            WHERE table_name = 'users' ORDER BY ordinal_position
        `);
        console.log('users表字段:');
        usersColumns.rows.forEach(col => {
            console.log(`   - ${col.column_name} (${col.data_type})`);
        });
        
        // 4. 检查candidates表中的数据
        console.log('\n5. 检查candidates表中的数据...');
        const candidatesResult = await client.query('SELECT id, user_id, name, email FROM candidates LIMIT 5');
        console.log(`   共有 ${candidatesResult.rowCount} 个候选人`);
        candidatesResult.rows.forEach(candidate => {
            console.log(`   - ID: ${candidate.id}, user_id: ${candidate.user_id}, 名称: ${candidate.name}, 邮箱: ${candidate.email}`);
        });
        
        // 5. 检查recruiters表中的数据
        console.log('\n6. 检查recruiters表中的数据...');
        const recruitersResult = await client.query('SELECT id, user_id, name, email FROM recruiters LIMIT 5');
        console.log(`   共有 ${recruitersResult.rowCount} 个招聘者`);
        recruitersResult.rows.forEach(recruiter => {
            console.log(`   - ID: ${recruiter.id}, user_id: ${recruiter.user_id}, 名称: ${recruiter.name}, 邮箱: ${recruiter.email}`);
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