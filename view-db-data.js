// 查看数据库数据的脚本
const { pool } = require('./backend/src/config/db');

async function viewDatabaseData() {
  try {
    console.log('=== 查看数据库数据 ===\n');
    
    // 查看用户表数据
    console.log('1. 用户表数据:');
    const usersResult = await pool.query('SELECT * FROM users');
    console.table(usersResult.rows);
    
    // 查看公司表数据
    console.log('\n2. 公司表数据:');
    const companiesResult = await pool.query('SELECT * FROM companies');
    console.table(companiesResult.rows);
    
    // 查看招聘者表数据
    console.log('\n3. 招聘者表数据:');
    const recruitersResult = await pool.query('SELECT * FROM recruiters');
    console.table(recruitersResult.rows);
    
    // 查看职位表数据
    console.log('\n4. 职位表数据:');
    const jobsResult = await pool.query('SELECT * FROM jobs');
    console.table(jobsResult.rows);
    
    await pool.end();
  } catch (error) {
    console.error('查看数据时出错:', error.message);
    await pool.end();
  }
}

viewDatabaseData();