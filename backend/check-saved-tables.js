// 检查saved_companies和saved_jobs表结构的脚本
const { pool } = require('./src/config/db');

async function checkSavedTablesStructure() {
  try {
    console.log('正在检查saved_companies和saved_jobs表结构...');
    
    // 检查saved_companies表
    console.log('\n=== saved_companies表结构 ===');
    try {
      const companiesResult = await pool.query(`
        SELECT column_name, data_type, character_maximum_length
        FROM information_schema.columns
        WHERE table_name = 'saved_companies'
        ORDER BY ordinal_position
      `);
      
      if (companiesResult.rows.length > 0) {
        console.log('+---------------------------+------------------+-----------------+');
        console.log('| 列名                      | 数据类型         | 最大长度        |');
        console.log('+---------------------------+------------------+-----------------+');
        
        companiesResult.rows.forEach(row => {
          const columnName = row.column_name.padEnd(25);
          const dataType = row.data_type.padEnd(16);
          const maxLength = (row.character_maximum_length || '').toString().padEnd(15);
          console.log(`| ${columnName} | ${dataType} | ${maxLength} |`);
        });
        
        console.log('+---------------------------+------------------+-----------------+');
        
        // 查询示例数据
        const companiesSample = await pool.query('SELECT * FROM saved_companies LIMIT 2');
        console.log('\nsaved_companies表中的示例数据:');
        console.log(JSON.stringify(companiesSample.rows, null, 2));
      } else {
        console.log('saved_companies表不存在，需要创建');
      }
    } catch (error) {
      console.error('查询saved_companies表结构失败:', error.message);
    }
    
    // 检查saved_jobs表
    console.log('\n=== saved_jobs表结构 ===');
    try {
      const jobsResult = await pool.query(`
        SELECT column_name, data_type, character_maximum_length
        FROM information_schema.columns
        WHERE table_name = 'saved_jobs'
        ORDER BY ordinal_position
      `);
      
      if (jobsResult.rows.length > 0) {
        console.log('+---------------------------+------------------+-----------------+');
        console.log('| 列名                      | 数据类型         | 最大长度        |');
        console.log('+---------------------------+------------------+-----------------+');
        
        jobsResult.rows.forEach(row => {
          const columnName = row.column_name.padEnd(25);
          const dataType = row.data_type.padEnd(16);
          const maxLength = (row.character_maximum_length || '').toString().padEnd(15);
          console.log(`| ${columnName} | ${dataType} | ${maxLength} |`);
        });
        
        console.log('+---------------------------+------------------+-----------------+');
        
        // 查询示例数据
        const jobsSample = await pool.query('SELECT * FROM saved_jobs LIMIT 2');
        console.log('\nsaved_jobs表中的示例数据:');
        console.log(JSON.stringify(jobsSample.rows, null, 2));
      } else {
        console.log('saved_jobs表不存在，需要创建');
      }
    } catch (error) {
      console.error('查询saved_jobs表结构失败:', error.message);
    }
    
  } catch (error) {
    console.error('检查表结构失败:', error.message);
  } finally {
    // 关闭数据库连接
    await pool.end();
  }
}

checkSavedTablesStructure();
