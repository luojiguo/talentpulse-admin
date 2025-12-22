// 清理和优化数据库数据的脚本
const { pool } = require('./backend/src/config/db');

async function cleanDatabaseData() {
  try {
    console.log('=== 开始清理和优化数据库数据 ===\n');
    
    // 1. 清理重复的公司记录
    console.log('1. 清理重复的公司记录...');
    const duplicateCompanies = await pool.query(`
      SELECT name, MIN(id) as keep_id
      FROM companies
      GROUP BY name
      HAVING COUNT(*) > 1
    `);
    
    for (const company of duplicateCompanies.rows) {
      // 删除重复的公司记录，只保留最小ID的记录
      await pool.query(
        'DELETE FROM companies WHERE name = $1 AND id != $2',
        [company.name, company.keep_id]
      );
      console.log(`   已删除公司"${company.name}"的重复记录，保留ID: ${company.keep_id}`);
    }
    
    // 2. 更新公司表的job_count字段，使其与实际发布的职位数量一致
    console.log('\n2. 更新公司的职位数量...');
    await pool.query(`
      UPDATE companies c
      SET job_count = (
        SELECT COUNT(*) FROM jobs j WHERE j.company_id = c.id
      )
    `);
    console.log('   已更新所有公司的职位数量');
    
    // 3. 更新招聘者表的posted_jobs_count字段
    console.log('\n3. 更新招聘者的发布职位数量...');
    await pool.query(`
      UPDATE recruiters r
      SET posted_jobs_count = (
        SELECT COUNT(*) FROM jobs j WHERE j.recruiter_id = r.id
      )
    `);
    console.log('   已更新所有招聘者的发布职位数量');
    
    // 4. 添加更多真实的公司数据
    console.log('\n4. 添加更多真实的公司数据...');
    const newCompanies = [
      {
        name: '创新科技有限公司',
        industry: '人工智能',
        size: '50-200人',
        address: '深圳市南山区科技园南区',
        description: '专注于人工智能技术研发和应用的创新型企业',
        is_verified: true
      },
      {
        name: '绿色能源集团',
        industry: '新能源',
        size: '1000-5000人',
        address: '北京市海淀区中关村',
        description: '致力于清洁能源开发和利用的大型企业集团',
        is_verified: true
      },
      {
        name: '智慧物流有限公司',
        industry: '物流',
        size: '500-1000人',
        address: '上海市闵行区虹桥商务区',
        description: '提供智能化物流解决方案的领先企业',
        is_verified: true
      }
    ];
    
    for (const company of newCompanies) {
      // 先检查公司是否已存在
      const existingCompany = await pool.query(
        'SELECT id FROM companies WHERE name = $1',
        [company.name]
      );
      
      if (existingCompany.rows.length === 0) {
        await pool.query(
          `INSERT INTO companies (name, industry, size, address, description, status, is_verified)
           VALUES ($1, $2, $3, $4, $5, 'active', $6)`,
          [company.name, company.industry, company.size, company.address, company.description, company.is_verified]
        );
        console.log(`   已添加公司: ${company.name}`);
      } else {
        console.log(`   公司"${company.name}"已存在，跳过添加`);
      }
    }
    
    // 5. 验证数据完整性
    console.log('\n5. 验证数据完整性...');
    
    // 检查是否有招聘者关联到不存在的公司
    const invalidRecruiters = await pool.query(`
      SELECT r.id, r.user_id, r.company_id
      FROM recruiters r
      LEFT JOIN companies c ON r.company_id = c.id
      WHERE c.id IS NULL
    `);
    
    if (invalidRecruiters.rows.length > 0) {
      console.log(`   发现 ${invalidRecruiters.rows.length} 个招聘者关联到不存在的公司，正在清理...`);
      for (const recruiter of invalidRecruiters.rows) {
        await pool.query('DELETE FROM recruiters WHERE id = $1', [recruiter.id]);
        console.log(`   已删除无效招聘者ID: ${recruiter.id}`);
      }
    } else {
      console.log('   所有招聘者都关联到有效的公司');
    }
    
    // 检查是否有职位关联到不存在的公司或招聘者
    const invalidJobs = await pool.query(`
      SELECT j.id, j.company_id, j.recruiter_id
      FROM jobs j
      LEFT JOIN companies c ON j.company_id = c.id
      LEFT JOIN recruiters r ON j.recruiter_id = r.id
      WHERE c.id IS NULL OR r.id IS NULL
    `);
    
    if (invalidJobs.rows.length > 0) {
      console.log(`   发现 ${invalidJobs.rows.length} 个职位关联到不存在的公司或招聘者，正在清理...`);
      for (const job of invalidJobs.rows) {
        await pool.query('DELETE FROM jobs WHERE id = $1', [job.id]);
        console.log(`   已删除无效职位ID: ${job.id}`);
      }
    } else {
      console.log('   所有职位都关联到有效的公司和招聘者');
    }
    
    console.log('\n=== 数据库数据清理和优化完成 ===');
    await pool.end();
  } catch (error) {
    console.error('清理数据时出错:', error.message);
    await pool.end();
  }
}

cleanDatabaseData();