const { pool } = require('./src/config/db');

async function checkCandidatesTable() {
  try {
    // 查询candidates表的结构
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'candidates'
    `);
    
    console.log('Candidates表结构:');
    console.log('-------------------------------------');
    result.rows.forEach(row => {
      console.log(`${row.column_name} (${row.data_type})`);
    });
    
    pool.end();
  } catch (error) {
    console.error('查询表结构失败:', error);
    pool.end();
  }
}

checkCandidatesTable();