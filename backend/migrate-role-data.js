// 数据迁移脚本：将users和user_roles表中的数据迁移到recruiter_user和candidate_user表
const { pool } = require('./src/config/db');

async function migrateRoleData() {
  try {
    console.log('正在执行角色数据迁移...');
    
    // 1. 查看现有数据
    console.log('\n1. 查看现有数据：');
    
    // 查看user_roles表中的角色分布
    const rolesResult = await pool.query(`
      SELECT role, COUNT(*) as count 
      FROM user_roles 
      GROUP BY role 
      ORDER BY count DESC;
    `);
    console.log('角色分布：');
    rolesResult.rows.forEach(row => {
      console.log(`  ${row.role}: ${row.count} 个用户`);
    });
    
    // 2. 迁移求职者数据
    console.log('\n2. 迁移求职者数据：');
    
    // 从user_roles表中获取所有求职者用户ID
    const candidateUsersResult = await pool.query(`
      SELECT user_id 
      FROM user_roles 
      WHERE role = 'candidate';
    `);
    
    const candidateUserIds = candidateUsersResult.rows.map(row => row.user_id);
    console.log(`  找到 ${candidateUserIds.length} 个求职者用户`);
    
    if (candidateUserIds.length > 0) {
      // 批量插入到candidate_user表
      const insertCandidateQuery = `
        INSERT INTO candidate_user (user_id, is_verified)
        SELECT u_id, true
        FROM unnest($1::integer[]) AS u_id
        WHERE NOT EXISTS (
          SELECT 1 FROM candidate_user WHERE user_id = u_id
        );
      `;
      
      const candidateResult = await pool.query(insertCandidateQuery, [candidateUserIds]);
      console.log(`  成功迁移 ${candidateResult.rowCount} 个求职者记录`);
    }
    
    // 3. 迁移招聘者数据
    console.log('\n3. 迁移招聘者数据：');
    
    // 从user_roles表中获取所有招聘者用户ID
    const recruiterUsersResult = await pool.query(`
      SELECT user_id 
      FROM user_roles 
      WHERE role = 'recruiter';
    `);
    
    const recruiterUserIds = recruiterUsersResult.rows.map(row => row.user_id);
    console.log(`  找到 ${recruiterUserIds.length} 个招聘者用户`);
    
    if (recruiterUserIds.length > 0) {
      // 为每个招聘者创建记录，默认关联到第一个公司（或创建新公司）
      for (const userId of recruiterUserIds) {
        try {
          // 检查是否已存在记录
          const existingRecord = await pool.query(
            'SELECT * FROM recruiter_user WHERE user_id = $1',
            [userId]
          );
          
          if (existingRecord.rows.length === 0) {
            // 检查是否已有关联的公司
            const companyResult = await pool.query(
              'SELECT company_id FROM recruiters WHERE user_id = $1',
              [userId]
            );
            
            let companyId;
            if (companyResult.rows.length > 0) {
              // 使用现有公司
              companyId = companyResult.rows[0].company_id;
            } else {
              // 创建一个默认公司
              const newCompanyResult = await pool.query(
                `INSERT INTO companies (name, status, is_verified, created_at, updated_at)
                 VALUES ($1, 'active', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                 RETURNING id`,
                [`默认公司_${userId}`]
              );
              companyId = newCompanyResult.rows[0].id;
            }
            
            // 插入到recruiter_user表
            await pool.query(
              `INSERT INTO recruiter_user (
                user_id, company_id, is_verified, business_license, 
                contact_info, verification_status, created_at, updated_at
              ) VALUES (
                $1, $2, false, '', '', 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
              )`,
              [userId, companyId]
            );
          }
        } catch (error) {
          console.error(`  迁移用户 ${userId} 失败:`, error.message);
        }
      }
      
      // 统计迁移结果
      const finalRecruiterResult = await pool.query(
        'SELECT COUNT(*) as count FROM recruiter_user'
      );
      console.log(`  成功迁移 ${finalRecruiterResult.rows[0].count} 个招聘者记录`);
    }
    
    // 4. 验证迁移结果
    console.log('\n4. 验证迁移结果：');
    
    // 查看迁移后的表数据
    const finalCandidateResult = await pool.query(
      'SELECT COUNT(*) as count FROM candidate_user'
    );
    
    const finalRecruiterResult = await pool.query(
      'SELECT COUNT(*) as count FROM recruiter_user'
    );
    
    console.log(`  candidate_user表：${finalCandidateResult.rows[0].count} 条记录`);
    console.log(`  recruiter_user表：${finalRecruiterResult.rows[0].count} 条记录`);
    
    // 5. 检查是否有用户同时拥有两种角色
    console.log('\n5. 检查同时拥有两种角色的用户：');
    const dualRoleResult = await pool.query(`
      SELECT u.id, u.name, u.email 
      FROM users u
      JOIN user_roles ur1 ON u.id = ur1.user_id AND ur1.role = 'candidate'
      JOIN user_roles ur2 ON u.id = ur2.user_id AND ur2.role = 'recruiter';
    `);
    
    console.log(`  发现 ${dualRoleResult.rows.length} 个用户同时拥有两种角色`);
    if (dualRoleResult.rows.length > 0) {
      console.log('  这些用户在两个新表中都有记录');
    }
    
    console.log('\n🎉 数据迁移完成！');
    
  } catch (error) {
    console.error('❌ 数据迁移失败:', error.message);
    console.error('详细错误:', error);
  } finally {
    // 关闭数据库连接
    await pool.end();
  }
}

// 执行迁移脚本
migrateRoleData();
