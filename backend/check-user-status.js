// 检查用户于吉的当前状态
const { pool } = require('./src/config/db');

async function checkUserStatus() {
  try {
    console.log('正在检查用户于吉的当前状态...');
    
    // 1. 根据手机号查找用户
    const userResult = await pool.query(
      'SELECT id, name, email, phone FROM users WHERE phone = $1',
      ['13800138002']
    );
    
    if (userResult.rows.length === 0) {
      console.log('未找到该用户');
      return;
    }
    
    const user = userResult.rows[0];
    console.log(`\n1. 用户基本信息：`);
    console.log(`   ID：${user.id}`);
    console.log(`   姓名：${user.name}`);
    console.log(`   邮箱：${user.email}`);
    console.log(`   电话：${user.phone}`);
    
    // 2. 查看用户的角色
    const rolesResult = await pool.query(
      'SELECT role FROM user_roles WHERE user_id = $1',
      [user.id]
    );
    
    const roles = rolesResult.rows.map(row => row.role);
    console.log(`\n2. 用户角色：${roles.join(', ')}`);
    
    // 3. 查看求职者状态
    const candidateResult = await pool.query(
      'SELECT * FROM candidate_user WHERE user_id = $1',
      [user.id]
    );
    
    console.log(`\n3. 求职者状态：`);
    if (candidateResult.rows.length > 0) {
      console.log(`   已注册为求职者，验证状态：${candidateResult.rows[0].is_verified ? '已验证' : '未验证'}`);
    } else {
      console.log(`   未注册为求职者`);
    }
    
    // 4. 查看招聘者状态
    const recruiterResult = await pool.query(
      `SELECT ru.*, c.name AS company_name, c.* 
       FROM recruiter_user ru 
       JOIN companies c ON ru.company_id = c.id 
       WHERE ru.user_id = $1`,
      [user.id]
    );
    
    console.log(`\n4. 招聘者状态：`);
    if (recruiterResult.rows.length > 0) {
      const recruiterData = recruiterResult.rows[0];
      console.log(`   已注册为招聘者`);
      console.log(`   验证状态：${recruiterData.is_verified ? '已验证' : '未验证'}`);
      console.log(`   验证状态详情：${recruiterData.verification_status}`);
      console.log(`   所属公司：${recruiterData.company_name}`);
      console.log(`   公司ID：${recruiterData.company_id}`);
      console.log(`   公司验证状态：${recruiterData.is_verified ? '已验证' : '未验证'}`);
      console.log(`   营业执照：${recruiterData.business_license || '未上传'}`);
      console.log(`   联系人信息：${recruiterData.contact_info || '未填写'}`);
    } else {
      console.log(`   未注册为招聘者`);
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
checkUserStatus();
