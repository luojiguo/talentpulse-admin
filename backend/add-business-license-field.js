// 使用Node.js脚本添加营业执照照片字段到companies表
const { pool } = require('./src/config/db');

async function addBusinessLicenseField() {
  try {
    console.log('正在添加营业执照照片字段到companies表...');
    
    // 添加营业执照照片字段
    await pool.query('ALTER TABLE companies ADD COLUMN IF NOT EXISTS business_license VARCHAR(255);');
    console.log('✓ 成功添加business_license字段');
    
    // 添加contact_info字段（如果不存在）
    await pool.query('ALTER TABLE companies ADD COLUMN IF NOT EXISTS contact_info VARCHAR(255);');
    console.log('✓ 成功添加或确认contact_info字段存在');
    
    // 查看更新后的表结构
    const result = await pool.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'companies'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n更新后的companies表结构:');
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
    
    console.log('\n🎉 所有操作完成！');
    
  } catch (error) {
    console.error('操作失败:', error.message);
  } finally {
    // 关闭数据库连接
    await pool.end();
  }
}

addBusinessLicenseField();
