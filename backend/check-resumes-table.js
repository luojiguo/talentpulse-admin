const { pool } = require('./src/config/db');

async function checkResumesTable() {
  try {
    // 查询resumes表的结构
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'resumes'
    `);
    
    console.log('Resumes表结构:');
    console.log('-------------------------------------');
    result.rows.forEach(row => {
      console.log(`${row.column_name} (${row.data_type})`);
    });
    
    // 也检查一下是否存在这个表
    const tableCheck = await pool.query(
      "SELECT EXISTS (SELECT FROM pg_tables WHERE tablename = 'resumes')"
    );
    
    console.log('\n表是否存在:', tableCheck.rows[0].exists);
    
    pool.end();
  } catch (error) {
    console.error('查询表结构失败:', error);
    pool.end();
  }
}

checkResumesTable();