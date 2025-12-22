const { pool, query } = require('./config/db');

async function optimizeDatabase() {
    // 创建必要的表（如果不存在）
    console.log('检查并创建必要的表...');
    try {
        await query(`
            CREATE TABLE IF NOT EXISTS job_recommendations (
                user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                status VARCHAR(20) DEFAULT 'pending',
                job_ids INTEGER[],
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ job_recommendations 表检查完成');
    } catch (error) {
        console.error('❌ 创建 job_recommendations 表失败:', error.message);
    }

    console.log('开始优化数据库索引...');
    
    const indexesToAdd = [
        // 用户表
        { table: 'users', column: 'email', name: 'idx_users_email' },
        { table: 'users', column: 'phone', name: 'idx_users_phone' },
        
        // 角色表
        { table: 'user_roles', column: 'user_id', name: 'idx_user_roles_user_id' },
        
        // 招聘者扩展表
        { table: 'recruiters', column: 'user_id', name: 'idx_recruiters_user_id' },
        { table: 'recruiters', column: 'company_id', name: 'idx_recruiters_company_id' },
        
        // 候选人扩展表
        { table: 'candidates', column: 'user_id', name: 'idx_candidates_user_id' },
        
        // 职位表
        { table: 'jobs', column: 'company_id', name: 'idx_jobs_company_id' },
        { table: 'jobs', column: 'recruiter_id', name: 'idx_jobs_recruiter_id' },
        { table: 'jobs', column: 'created_at', name: 'idx_jobs_created_at' },
        { table: 'jobs', column: 'status', name: 'idx_jobs_status' },

        // 公司表
        { table: 'companies', column: 'status', name: 'idx_companies_status' },
        { table: 'companies', column: 'is_verified', name: 'idx_companies_is_verified' },

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
