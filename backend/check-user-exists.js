const { pool } = require('./src/config/db');

async function checkUserExists() {
  try {
    const userId = 27;
    
    console.log(`正在检查用户ID ${userId} 是否存在...`);
    
    const result = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [userId]);
    
    if (result.rows.length > 0) {
      console.log('用户仍然存在:', result.rows[0]);
    } else {
      console.log('用户已成功删除');
    }
    
    pool.end();
  } catch (error) {
    console.error('查询用户失败:', error);
    pool.end();
  }
}

checkUserExists();