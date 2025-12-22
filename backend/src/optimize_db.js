const { pool, query } = require('./config/db');

async function optimizeDatabase() {
    console.log('开始优化数据库索引...');
    
    const indexesToAdd = [
        // 用户表
        { table: 'users', column: 'email', name: 'idx_users_email' },
        { table: 'users', column: 'phone', name: 'idx_users_phone' },
        
        // 角色表
        { table: 'user_roles', column: 'user_id', name: 'idx_user_roles_user_id' },
        
        // 招聘者扩展表
        { table: 'recruiter_user', column: 'user_id', name: 'idx_recruiter_user_user_id' },
        { table: 'recruiter_user', column: 'company_id', name: 'idx_recruiter_user_company_id' },
        
        // 简历表
        { table: 'resumes', column: 'candidate_id', name: 'idx_resumes_candidate_id' },
        
        // 申请表
        { table: 'applications', column: 'candidate_id', name: 'idx_applications_candidate_id' },
        { table: 'applications', column: 'job_id', name: 'idx_applications_job_id' },
        { table: 'applications', column: 'resume_id', name: 'idx_applications_resume_id' },
        
        // 消息表
        { table: 'messages', column: 'sender_id', name: 'idx_messages_sender_id' },
        { table: 'messages', column: 'receiver_id', name: 'idx_messages_receiver_id' },
        { table: 'messages', column: 'conversation_id', name: 'idx_messages_conversation_id' },
        
        // 会话表
        { table: 'conversations', column: 'job_id', name: 'idx_conversations_job_id' },
        { table: 'conversations', column: 'candidate_id', name: 'idx_conversations_candidate_id' },
        { table: 'conversations', column: 'recruiter_id', name: 'idx_conversations_recruiter_id' },
        
        // 职位表
        { table: 'jobs', column: 'company_id', name: 'idx_jobs_company_id' },
        { table: 'jobs', column: 'recruiter_id', name: 'idx_jobs_recruiter_id' },
        { table: 'jobs', column: 'created_at', name: 'idx_jobs_created_at' },

        // 时间戳索引（用于动态和统计）
        { table: 'users', column: 'created_at', name: 'idx_users_created_at' },
        { table: 'companies', column: 'created_at', name: 'idx_companies_created_at' },
        { table: 'applications', column: 'created_at', name: 'idx_applications_created_at' },
        { table: 'interviews', column: 'created_at', name: 'idx_interviews_created_at' },
    ];

    for (const item of indexesToAdd) {
        try {
            // 检查表是否存在
            const tableCheck = await query(`
                SELECT count(*) 
                FROM information_schema.tables 
                WHERE table_name = $1
            `, [item.table]);

            if (parseInt(tableCheck.rows[0].count) === 0) {
                console.log(`ℹ️ 表 ${item.table} 不存在，跳过`);
                continue;
            }

            // 检查列是否存在
            const columnCheck = await query(`
                SELECT count(*) 
                FROM information_schema.columns 
                WHERE table_name = $1 AND column_name = $2
            `, [item.table, item.column]);

            if (parseInt(columnCheck.rows[0].count) === 0) {
                console.log(`ℹ️ 表 ${item.table} 的列 ${item.column} 不存在，跳过`);
                continue;
            }

            // 检查索引是否已存在
            const checkResult = await query(`
                SELECT count(*) 
                FROM pg_indexes 
                WHERE tablename = $1 AND indexname = $2
            `, [item.table, item.name]);

            if (parseInt(checkResult.rows[0].count) === 0) {
                console.log(`正在为表 ${item.table} 的列 ${item.column} 创建索引 ${item.name}...`);
                await query(`CREATE INDEX ${item.name} ON ${item.table} (${item.column})`);
                console.log(`✅ 索引 ${item.name} 创建成功`);
            } else {
                console.log(`ℹ️ 索引 ${item.name} 已存在，跳过`);
            }
        } catch (error) {
            console.error(`❌ 处理索引 ${item.name} 时出错:`, error.message);
        }
    }

    // 更新统计信息
    console.log('正在更新数据库统计信息 (ANALYZE)...');
    try {
        await query('ANALYZE');
        console.log('✅ 数据库统计信息更新完成');
    } catch (error) {
        console.error('❌ 更新统计信息失败:', error.message);
    }

    console.log('数据库优化完成！');
    process.exit(0);
}

optimizeDatabase();
