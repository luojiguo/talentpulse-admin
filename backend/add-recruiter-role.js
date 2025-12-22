// 为用户添加招聘者角色并关联公司
const { pool } = require('./src/config/db');

async function addRecruiterRole() {
  try {
    const userId = 2; // 用户 aixi@163.com 的 ID
    const companyName = '科技之星有限公司';
    
    console.log('开始为用户添加招聘者角色...');
    
    // 1. 检查用户是否存在
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      console.error('用户不存在');
      return;
    }
    
    console.log('用户存在，继续操作...');
    
    // 2. 检查用户是否已经有招聘者角色
    const existingRole = await pool.query(
      'SELECT * FROM user_roles WHERE user_id = $1 AND role = $2',
      [userId, 'recruiter']
    );
    
    if (existingRole.rows.length === 0) {
      // 3. 为用户添加招聘者角色
      await pool.query(
        'INSERT INTO user_roles (user_id, role) VALUES ($1, $2)',
        [userId, 'recruiter']
      );
      console.log('成功添加招聘者角色');
    } else {
      console.log('用户已经有招聘者角色');
    }
    
    // 4. 检查公司是否存在
    let companyId;
    const existingCompany = await pool.query('SELECT id FROM companies WHERE name = $1', [companyName]);
    
    if (existingCompany.rows.length > 0) {
      companyId = existingCompany.rows[0].id;
      console.log('公司已存在，ID:', companyId);
    } else {
      // 5. 创建新公司
      const newCompanyResult = await pool.query(
        `INSERT INTO companies (name, status, is_verified, created_at, updated_at)
         VALUES ($1, 'active', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING id`,
        [companyName]
      );
      companyId = newCompanyResult.rows[0].id;
      console.log('成功创建新公司，ID:', companyId);
    }
    
    // 6. 检查用户是否已经关联了公司
    const existingRecruiter = await pool.query('SELECT * FROM recruiter_user WHERE user_id = $1', [userId]);
    
    if (existingRecruiter.rows.length === 0) {
      // 7. 关联用户与公司
      await pool.query(
        `INSERT INTO recruiter_user (
          user_id, company_id, is_verified, business_license, 
          contact_info, verification_status, verification_date, created_at, updated_at
        ) VALUES (
          $1, $2, true, '', '', 'approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )`,
        [userId, companyId]
      );
      console.log('成功关联用户与公司');
    } else {
      console.log('用户已经关联了公司');
    }
    
    console.log('操作完成！');
    
    // 8. 验证结果
    const updatedUser = await pool.query(`
      SELECT u.*, ARRAY_AGG(ur.role) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      WHERE u.id = $1
      GROUP BY u.id
    `, [userId]);
    
    console.log('更新后的用户角色:', updatedUser.rows[0].roles);
    
    // 9. 检查公司关联
    const recruiterInfo = await pool.query(`
      SELECT ru.*, c.*
      FROM recruiter_user ru
      JOIN companies c ON ru.company_id = c.id
      WHERE ru.user_id = $1
    `, [userId]);
    
    if (recruiterInfo.rows.length > 0) {
      console.log('公司关联信息:', {
        company_name: recruiterInfo.rows[0].name,
        is_verified: recruiterInfo.rows[0].is_verified,
        verification_status: recruiterInfo.rows[0].verification_status
      });
    }
    
  } catch (error) {
    console.error('操作失败:', error.message);
    console.error(error.stack);
  } finally {
    // 关闭数据库连接
    pool.end();
  }
}

addRecruiterRole();
