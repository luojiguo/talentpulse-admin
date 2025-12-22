// 检查所有用户，确认于吉是否存在
const { pool } = require('./src/config/db');

async function checkAllUsers() {
  try {
    console.log('正在检查所有用户...');
    
    // 获取所有用户
    const usersResult = await pool.query(
      'SELECT id, name, email, phone FROM users ORDER BY id'
    );
    
    console.log(`\n共找到 ${usersResult.rows.length} 个用户：`);
    usersResult.rows.forEach(user => {
      console.log(`ID: ${user.id}, 姓名: ${user.name}, 邮箱: ${user.email}, 电话: ${user.phone}`);
    });
    
    // 检查用户名为于吉的用户
    const yujiResult = await pool.query(
      'SELECT id, name, email, phone FROM users WHERE name = $1',
      ['于吉']
    );
    
    console.log(`\n查找名为"于吉"的用户：`);
    if (yujiResult.rows.length > 0) {
      const yuji = yujiResult.rows[0];
      console.log(`找到用户：ID: ${yuji.id}, 姓名: ${yuji.name}, 邮箱: ${yuji.email}, 电话: ${yuji.phone}`);
      
      // 查看该用户的角色
      const rolesResult = await pool.query(
        'SELECT role FROM user_roles WHERE user_id = $1',
        [yuji.id]
      );
      
      const roles = rolesResult.rows.map(row => row.role);
      console.log(`角色：${roles.join(', ')}`);
      
      // 查看招聘者状态
      const recruiterResult = await pool.query(
        `SELECT ru.*, c.name AS company_name 
         FROM recruiter_user ru 
         JOIN companies c ON ru.company_id = c.id 
         WHERE ru.user_id = $1`,
        [yuji.id]
      );
      
      if (recruiterResult.rows.length > 0) {
        const recruiterData = recruiterResult.rows[0];
        console.log(`招聘者状态：已验证: ${recruiterData.is_verified}, 状态: ${recruiterData.verification_status}`);
        console.log(`所属公司：${recruiterData.company_name}`);
      } else {
        console.log(`招聘者状态：未注册`);
      }
      
      // 查看求职者状态
      const candidateResult = await pool.query(
        'SELECT * FROM candidate_user WHERE user_id = $1',
        [yuji.id]
      );
      
      if (candidateResult.rows.length > 0) {
        console.log(`求职者状态：已注册，验证状态: ${candidateResult.rows[0].is_verified}`);
      } else {
        console.log(`求职者状态：未注册`);
      }
    } else {
      console.log('未找到名为"于吉"的用户');
    }
    
    console.log('\n检查完成！');
    
  } catch (error) {
    console.error('检查失败:', error.message);
    console.error('详细错误:', error);
  } finally {
    // 关闭数据库连接
    await pool.end();
  }
}

// 执行脚本
checkAllUsers();
