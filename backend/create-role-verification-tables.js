// 使用Node.js脚本执行SQL文件，创建角色验证表
const { pool } = require('./src/config/db');
const fs = require('fs');
const path = require('path');

async function createRoleVerificationTables() {
  try {
    console.log('正在创建角色验证表...');
    
    // 读取SQL文件内容
    const sqlFilePath = path.join(__dirname, 'create-role-verification-tables.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // 执行SQL语句
    await pool.query(sqlContent);
    
    console.log('✅ 成功创建recruiter_user和candidate_user表！');
    
    // 查看创建的表结构
    console.log('\n创建的表结构：');
    const result = await pool.query(`
      SELECT table_name, column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name IN ('recruiter_user', 'candidate_user')
      ORDER BY table_name, ordinal_position;
    `);
    
    console.log('+------------------+---------------------------+------------------+-----------------+');
    console.log('| 表名             | 列名                      | 数据类型         | 最大长度        |');
    console.log('+------------------+---------------------------+------------------+-----------------+');
    
    result.rows.forEach(row => {
      const tableName = row.table_name.padEnd(16);
      const columnName = row.column_name.padEnd(25);
      const dataType = row.data_type.padEnd(16);
      const maxLength = (row.character_maximum_length || '').toString().padEnd(15);
      console.log(`| ${tableName} | ${columnName} | ${dataType} | ${maxLength} |`);
    });
    
    console.log('+------------------+---------------------------+------------------+-----------------+');
    
    console.log('\n🎉 所有操作完成！');
    
  } catch (error) {
    console.error('❌ 操作失败:', error.message);
    console.error('详细错误:', error);
  } finally {
    // 关闭数据库连接
    await pool.end();
  }
}

// 执行脚本
createRoleVerificationTables();
