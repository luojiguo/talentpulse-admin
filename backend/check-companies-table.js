// 检查companies表结构的脚本
const { pool } = require('./src/config/db');

async function checkCompaniesTableStructure() {
  try {
    console.log('正在检查companies表结构...');
    
    // 查询companies表的所有列
    const result = await pool.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'companies'
      ORDER BY ordinal_position
    `);
    
    console.log('companies表结构:');
    console.log('+---------------------------+------------------+-----------------+');
    console.log('| 列名                      | 数据类型         | 最大长度        |');
    console.log('+---------------------------+------------------+-----------------+');
    
    result.rows.forEach(row => {
      const columnName = row.column_name.padEnd(25);
      const dataType = row.data_type.padEnd(16);
      const maxLength = (row.character_maximum_length || '').toString().padEnd(15);
      console.log(`| ${columnName} | ${dataType} | ${maxLength} |`);
    });
    
    console.log('+---------------------------+------------------+-----------------+');
    
    // 同时查询一些示例数据
    console.log('\ncompanies表中的示例数据:');
    const sampleResult = await pool.query('SELECT * FROM companies LIMIT 2');
    console.log(JSON.stringify(sampleResult.rows, null, 2));
    
  } catch (error) {
    console.error('查询表结构失败:', error.message);
  } finally {
    // 关闭数据库连接
    await pool.end();
  }
}

checkCompaniesTableStructure();