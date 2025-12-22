// 检查所有用户的公司认证状态
const { pool } = require('./src/config/db');

async function checkAllCompanyVerification() {
  try {
    console.log('=== 检查所有用户的公司认证状态 ===\n');
    
    // 查询所有招聘者用户及其公司信息
    const result = await pool.query(`
      SELECT 
        u.id as user_id,
        u.name as user_name,
        u.email as user_email,
        ru.is_verified as recruiter_verified,
        c.id as company_id,
        c.name as company_name,
        c.is_verified as company_verified,
        c.status as company_status,
        c.industry as company_industry
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN recruiter_user ru ON u.id = ru.user_id
      LEFT JOIN companies c ON ru.company_id = c.id
      WHERE ur.role = 'recruiter'
      ORDER BY u.id
    `);
    
    if (result.rows.length === 0) {
      console.log('没有找到招聘者用户');
      return;
    }
    
    console.log('共找到', result.rows.length, '个招聘者用户\n');
    
    // 统计数据
    const totalRecruiters = result.rows.length;
    const verifiedCompanies = result.rows.filter(row => row.company_verified).length;
    const boundCompanies = result.rows.filter(row => row.company_id).length;
    
    console.log('=== 统计信息 ===');
    console.log(`总招聘者用户数: ${totalRecruiters}`);
    console.log(`已绑定公司的用户数: ${boundCompanies}`);
    console.log(`已认证公司的用户数: ${verifiedCompanies}`);
    console.log(`未绑定公司的用户数: ${totalRecruiters - boundCompanies}`);
    console.log(`未认证公司的用户数: ${totalRecruiters - verifiedCompanies}`);
    console.log('');
    
    // 详细列表
    console.log('=== 详细用户列表 ===');
    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. 用户ID: ${row.user_id}`);
      console.log(`   用户名: ${row.user_name}`);
      console.log(`   邮箱: ${row.user_email}`);
      console.log(`   公司ID: ${row.company_id || '未绑定'}`);
      console.log(`   公司名称: ${row.company_name || '未绑定'}`);
      console.log(`   公司行业: ${row.company_industry || '未设置'}`);
      console.log(`   公司认证状态: ${row.company_verified ? '已认证' : '未认证'}`);
      console.log(`   公司状态: ${row.company_status || '未设置'}`);
      console.log(`   招聘者认证状态: ${row.recruiter_verified ? '已认证' : '未认证'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('查询出错:', error);
  } finally {
    await pool.end();
  }
}

checkAllCompanyVerification();
