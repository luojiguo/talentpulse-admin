// 执行数据库迁移脚本
const { pool } = require('./backend/src/config/db');

async function runMigration() {
    try {
        console.log('开始执行数据库迁移...');
        
        // 1. 检查user_roles表是否存在
        const tableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'user_roles'
            )
        `);
        
        if (!tableCheck.rows[0].exists) {
            // 创建user_roles表
            await pool.query(`
                CREATE TABLE user_roles (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'recruiter', 'candidate')),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(user_id, role)
                )
            `);
            console.log('✅ 创建user_roles表成功');
        } else {
            console.log('ℹ️ user_roles表已存在，跳过创建');
        }
        
        // 2. 检查users表是否还有role字段
        const columnCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'role'
            )
        `);
        
        if (columnCheck.rows[0].exists) {
            // 将现有用户的角色迁移到新表
            await pool.query(`
                INSERT INTO user_roles (user_id, role) 
                SELECT id, role FROM users
                ON CONFLICT (user_id, role) DO NOTHING
            `);
            console.log('✅ 迁移现有用户角色成功');
            
            // 修改users表，移除role字段
            await pool.query(`ALTER TABLE users DROP COLUMN role`);
            console.log('✅ 从users表移除role字段成功');
        } else {
            console.log('ℹ️ users表已移除role字段，跳过迁移');
        }
        
        // 3. 检查索引是否存在
        const indexCheck1 = await pool.query(`
            SELECT EXISTS (
                SELECT FROM pg_indexes 
                WHERE tablename = 'user_roles' AND indexname = 'idx_user_roles_user_id'
            )
        `);
        
        if (!indexCheck1.rows[0].exists) {
            await pool.query(`CREATE INDEX idx_user_roles_user_id ON user_roles(user_id)`);
            console.log('✅ 创建idx_user_roles_user_id索引成功');
        } else {
            console.log('ℹ️ idx_user_roles_user_id索引已存在，跳过创建');
        }
        
        const indexCheck2 = await pool.query(`
            SELECT EXISTS (
                SELECT FROM pg_indexes 
                WHERE tablename = 'user_roles' AND indexname = 'idx_user_roles_role'
            )
        `);
        
        if (!indexCheck2.rows[0].exists) {
            await pool.query(`CREATE INDEX idx_user_roles_role ON user_roles(role)`);
            console.log('✅ 创建idx_user_roles_role索引成功');
        } else {
            console.log('ℹ️ idx_user_roles_role索引已存在，跳过创建');
        }
        
        console.log('🎉 数据库迁移完成！');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ 数据库迁移失败：', error.message);
        console.error('❌ 错误详情：', error.stack);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runMigration();