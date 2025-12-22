// 创建saved_companies和saved_jobs表的脚本
const { pool } = require('./src/config/db');

async function createSavedTables() {
  try {
    console.log('正在创建saved_companies和saved_jobs表...');
    
    // 创建saved_companies表
    console.log('\n创建saved_companies表...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS saved_companies (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, company_id) -- 确保一个用户只能收藏一个公司一次
      )
    `);
    console.log('saved_companies表创建成功');
    
    // 创建saved_jobs表
    console.log('\n创建saved_jobs表...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS saved_jobs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, job_id) -- 确保一个用户只能收藏一个职位一次
      )
    `);
    console.log('saved_jobs表创建成功');
    
    console.log('\n所有表创建完成！');
    
  } catch (error) {
    console.error('创建表失败:', error.message);
  } finally {
    // 关闭数据库连接
    await pool.end();
  }
}

createSavedTables();
