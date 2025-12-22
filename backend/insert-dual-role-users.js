// 插入既是求职者也是招聘者的用户数据
const { pool } = require('./src/config/db');
const bcrypt = require('bcrypt');

async function insertDualRoleUsers() {
  try {
    console.log('正在插入既是求职者也是招聘者的用户数据...');
    
    // 1. 检查数据库中是否存在"科技有限公司"
    console.log('\n1. 检查数据库中是否存在"科技有限公司"：');
    
    const companyResult = await pool.query(
      'SELECT id FROM companies WHERE name ILIKE $1',
      ['%科技有限公司%']
    );
    
    let companyId;
    if (companyResult.rows.length > 0) {
      companyId = companyResult.rows[0].id;
      console.log(`  找到现有公司，ID：${companyId}`);
    } else {
      // 创建新公司
      const newCompanyResult = await pool.query(
        `INSERT INTO companies (name, status, is_verified, created_at, updated_at)
         VALUES ($1, 'active', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING id`,
        ['科技有限公司']
      );
      companyId = newCompanyResult.rows[0].id;
      console.log(`  创建新公司，ID：${companyId}`);
    }
    
    // 2. 创建两个既是求职者也是招聘者的用户
    console.log('\n2. 创建既是求职者也是招聘者的用户：');
    
    const usersToInsert = [
      { name: '梁金', email: 'liangjin@163.com', phone: '13800138001' },
      { name: '于吉', email: 'yuji@163.com', phone: '13800138002' }
    ];
    
    for (const userData of usersToInsert) {
      console.log(`  处理用户：${userData.name}`);
      
      // 检查用户是否已存在
      const existingUserResult = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [userData.email]
      );
      
      let userId;
      if (existingUserResult.rows.length > 0) {
        userId = existingUserResult.rows[0].id;
        console.log(`    用户已存在，ID：${userId}`);
      } else {
        // 创建新用户
        const hashedPassword = await bcrypt.hash('password123', 10);
        
        const newUserResult = await pool.query(
          `INSERT INTO users (
            name, email, password, phone, status, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          ) RETURNING id`,
          [userData.name, userData.email, hashedPassword, userData.phone]
        );
        
        userId = newUserResult.rows[0].id;
        console.log(`    创建新用户，ID：${userId}`);
      }
      
      // 3. 添加角色
      console.log(`    添加角色...`);
      
      // 添加求职者角色
      await pool.query(
        `INSERT INTO user_roles (user_id, role)
         VALUES ($1, 'candidate')
         ON CONFLICT (user_id, role) DO NOTHING`,
        [userId]
      );
      
      // 添加招聘者角色
      await pool.query(
        `INSERT INTO user_roles (user_id, role)
         VALUES ($1, 'recruiter')
         ON CONFLICT (user_id, role) DO NOTHING`,
        [userId]
      );
      
      // 4. 在candidate_user表中添加记录
      await pool.query(
        `INSERT INTO candidate_user (user_id, is_verified)
         VALUES ($1, true)
         ON CONFLICT (user_id) DO NOTHING`,
        [userId]
      );
      
      // 5. 在recruiter_user表中添加记录
      await pool.query(
        `INSERT INTO recruiter_user (
          user_id, company_id, is_verified, business_license, 
          contact_info, verification_status, created_at, updated_at
        ) VALUES (
          $1, $2, true, 'business_license.jpg', $3, 'approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        ) ON CONFLICT (user_id) DO UPDATE SET
          company_id = $2,
          is_verified = true,
          verification_status = 'approved',
          updated_at = CURRENT_TIMESTAMP`,
        [userId, companyId, `${userData.name}，${userData.phone}`]
      );
      
      console.log(`    成功添加用户 ${userData.name} 的双重角色记录`);
    }
    
    // 6. 验证结果
    console.log('\n3. 验证结果：');
    
    // 查看新添加的用户
    const newUsersResult = await pool.query(
      `SELECT u.id, u.name, u.email, u.phone
       FROM users u
       WHERE u.email IN ('liangjin@163.com', 'yuji@163.com')
       ORDER BY u.name;
      `
    );
    
    console.log('  新添加的用户：');
    for (const user of newUsersResult.rows) {
      console.log(`    ID：${user.id}，姓名：${user.name}，邮箱：${user.email}，电话：${user.phone}`);
      
      // 查看用户的角色
      const rolesResult = await pool.query(
        `SELECT role FROM user_roles WHERE user_id = $1 ORDER BY role;
        `,
        [user.id]
      );
      
      const roles = rolesResult.rows.map(row => row.role);
      console.log(`    角色：${roles.join(', ')}`);
      
      // 查看用户在candidate_user表中的记录
      const candidateResult = await pool.query(
        `SELECT is_verified FROM candidate_user WHERE user_id = $1;
        `,
        [user.id]
      );
      
      if (candidateResult.rows.length > 0) {
        console.log(`    求职者验证状态：${candidateResult.rows[0].is_verified ? '已验证' : '未验证'}`);
      }
      
      // 查看用户在recruiter_user表中的记录
      const recruiterResult = await pool.query(
        `SELECT is_verified, verification_status, company_id
         FROM recruiter_user WHERE user_id = $1;
        `,
        [user.id]
      );
      
      if (recruiterResult.rows.length > 0) {
        const recruiterRecord = recruiterResult.rows[0];
        console.log(`    招聘者验证状态：${recruiterRecord.is_verified ? '已验证' : '未验证'}`);
        console.log(`    验证状态：${recruiterRecord.verification_status}`);
        console.log(`    所属公司ID：${recruiterRecord.company_id}`);
      }
    }
    
    console.log('\n🎉 既是求职者也是招聘者的用户数据插入完成！');
    
  } catch (error) {
    console.error('❌ 插入数据失败:', error.message);
    console.error('详细错误:', error);
  } finally {
    // 关闭数据库连接
    await pool.end();
  }
}

// 执行脚本
insertDualRoleUsers();
