// 使用Node.js脚本执行SQL文件，为表字段添加注释
const { pool } = require('./src/config/db');
const fs = require('fs');
const path = require('path');

async function addTableComments() {
  try {
    console.log('正在为表字段添加注释...');
    
    // 读取SQL文件内容
    const sqlFilePath = path.join(__dirname, 'add-table-comments.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // 执行SQL语句
    await pool.query(sqlContent);
    
    console.log('✅ 成功为recruiter_user和candidate_user表的字段添加注释！');
    
    // 验证结果
    console.log('\n验证结果：');
    
    // 查看recruiter_user表的注释
    const recruiterTableCommentResult = await pool.query(`
      SELECT 
        col.column_name,
        col.data_type,
        des.description
      FROM 
        information_schema.columns col
      LEFT JOIN 
        pg_description des ON des.objoid = (SELECT oid FROM pg_class WHERE relname = col.table_name)
                           AND des.objsubid = col.ordinal_position
      WHERE 
        col.table_name = 'recruiter_user'
      ORDER BY 
        col.ordinal_position;
    `);
    
    console.log('recruiter_user表字段注释：');
    console.log('+------------------------+------------------+-----------------------------+');
    console.log('| 列名                   | 数据类型         | 描述                         |');
    console.log('+------------------------+------------------+-----------------------------+');
    
    recruiterTableCommentResult.rows.forEach(row => {
      const columnName = row.column_name.padEnd(22);
      const dataType = row.data_type.padEnd(16);
      const description = (row.description || '').padEnd(27);
      console.log(`| ${columnName} | ${dataType} | ${description} |`);
    });
    
    console.log('+------------------------+------------------+-----------------------------+');
    
    // 查看candidate_user表的注释
    const candidateTableCommentResult = await pool.query(`
      SELECT 
        col.column_name,
        col.data_type,
        des.description
      FROM 
        information_schema.columns col
      LEFT JOIN 
        pg_description des ON des.objoid = (SELECT oid FROM pg_class WHERE relname = col.table_name)
                           AND des.objsubid = col.ordinal_position
      WHERE 
        col.table_name = 'candidate_user'
      ORDER BY 
        col.ordinal_position;
    `);
    
    console.log('\ncandidate_user表字段注释：');
    console.log('+------------------------+------------------+-----------------------------+');
    console.log('| 列名                   | 数据类型         | 描述                         |');
    console.log('+------------------------+------------------+-----------------------------+');
    
    candidateTableCommentResult.rows.forEach(row => {
      const columnName = row.column_name.padEnd(22);
      const dataType = row.data_type.padEnd(16);
      const description = (row.description || '').padEnd(27);
      console.log(`| ${columnName} | ${dataType} | ${description} |`);
    });
    
    console.log('+------------------------+------------------+-----------------------------+');
    
    console.log('\n🎉 所有注释添加完成！');
    
  } catch (error) {
    console.error('❌ 添加注释失败:', error.message);
    console.error('详细错误:', error);
  } finally {
    // 关闭数据库连接
    await pool.end();
  }
}

// 执行脚本
addTableComments();
