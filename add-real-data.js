// 添加真实数据的脚本
const { pool } = require('./backend/src/config/db');

async function addRealData() {
  try {
    console.log('=== 开始添加真实数据 ===\n');
    
    // 1. 为新添加的公司创建招聘者账号
    console.log('1. 为新添加的公司创建招聘者账号...');
    
    const newCompanies = [
      { id: 7, name: '创新科技有限公司', city: '深圳' },
      { id: 8, name: '绿色能源集团', city: '北京' },
      { id: 9, name: '智慧物流有限公司', city: '上海' }
    ];
    
    const recruitersData = [
      // 创新科技有限公司招聘者
      {
        company_id: 7,
        name: '李娜',
        email: 'lina@innovationtech.com',
        phone: '13800138002',
        password: 'password123',
        position: '招聘总监',
        department: '人力资源部'
      },
      {
        company_id: 7,
        name: '王强',
        email: 'wangqiang@innovationtech.com',
        phone: '13800138003',
        password: 'password123',
        position: '高级招聘专员',
        department: '招聘部'
      },
      // 绿色能源集团招聘者
      {
        company_id: 8,
        name: '张敏',
        email: 'zhangmin@greenenergy.com',
        phone: '13800138004',
        password: 'password123',
        position: 'HR经理',
        department: '人力资源中心'
      },
      // 智慧物流有限公司招聘者
      {
        company_id: 9,
        name: '刘杰',
        email: 'liujie@smartlogistics.com',
        phone: '13800138005',
        password: 'password123',
        position: '招聘主管',
        department: '人事行政部'
      },
      {
        company_id: 9,
        name: '陈丽',
        email: 'chenli@smartlogistics.com',
        phone: '13800138006',
        password: 'password123',
        position: '招聘专员',
        department: '招聘部'
      }
    ];
    
    const createdRecruiters = [];
    
    // 使用已加密的密码（明文：password123）
    const hashedPassword = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
    
    for (const recruiter of recruitersData) {
      // 检查邮箱是否已存在
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [recruiter.email]
      );
      
      if (existingUser.rows.length === 0) {
        // 创建用户，直接使用已加密的密码
        const userResult = await pool.query(
          `INSERT INTO users (name, email, phone, password, role, status, email_verified, phone_verified)
           VALUES ($1, $2, $3, $4, 'recruiter', 'active', true, true)
           RETURNING id`,
          [recruiter.name, recruiter.email, recruiter.phone, hashedPassword]
        );
        
        const userId = userResult.rows[0].id;
        
        // 创建招聘者记录
        const recruiterResult = await pool.query(
          `INSERT INTO recruiters (user_id, company_id, position, department, is_verified)
           VALUES ($1, $2, $3, $4, true)
           RETURNING id`,
          [userId, recruiter.company_id, recruiter.position, recruiter.department]
        );
        
        createdRecruiters.push({
          id: recruiterResult.rows[0].id,
          user_id: userId,
          company_id: recruiter.company_id,
          name: recruiter.name,
          email: recruiter.email
        });
        
        console.log(`   已为公司ID ${recruiter.company_id} 创建招聘者: ${recruiter.name} (${recruiter.email})`);
      } else {
        console.log(`   招聘者邮箱 ${recruiter.email} 已存在，跳过创建`);
      }
    }
    
    // 2. 为招聘者发布真实的职位
    console.log('\n2. 为招聘者发布真实的职位...');
    
    const jobsData = [
      // 创新科技有限公司职位
      {
        company_id: 7,
        title: '人工智能算法工程师',
        description: '负责公司核心AI产品的算法研发，包括机器学习、深度学习等技术方向',
        salary: '30-50K',
        location: '深圳',
        experience: '3-5年',
        degree: '硕士',
        type: '全职',
        department: '算法部',
        work_mode: '混合',
        job_level: '高级',
        hiring_count: 2,
        urgency: '紧急',
        required_skills: ['Python', 'TensorFlow', 'PyTorch', '机器学习'],
        preferred_skills: ['自然语言处理', '计算机视觉', '大模型'],
        benefits: ['五险一金', '年终奖', '股票期权', '弹性工作', '定期体检']
      },
      {
        company_id: 7,
        title: '产品经理',
        description: '负责AI产品的规划和设计，包括需求分析、产品原型设计等',
        salary: '25-40K',
        location: '深圳',
        experience: '3-5年',
        degree: '本科',
        type: '全职',
        department: '产品部',
        work_mode: '混合',
        job_level: '中级',
        hiring_count: 1,
        urgency: '普通',
        required_skills: ['产品设计', '需求分析', '原型设计', 'AI产品经验'],
        preferred_skills: ['用户研究', '数据分析', '项目管理'],
        benefits: ['五险一金', '年终奖', '弹性工作', '定期体检']
      },
      // 绿色能源集团职位
      {
        company_id: 8,
        title: '新能源工程师',
        description: '负责太阳能、风能等新能源项目的设计和开发',
        salary: '20-35K',
        location: '北京',
        experience: '2-4年',
        degree: '本科',
        type: '全职',
        department: '技术部',
        work_mode: '现场',
        job_level: '中级',
        hiring_count: 3,
        urgency: '紧急',
        required_skills: ['新能源技术', '工程设计', 'AutoCAD'],
        preferred_skills: ['项目管理', '光伏系统', '风力发电'],
        benefits: ['五险一金', '年终奖', '包住', '餐补', '定期体检']
      },
      {
        company_id: 8,
        title: '市场经理',
        description: '负责公司新能源产品的市场推广和品牌建设',
        salary: '18-30K',
        location: '北京',
        experience: '3-5年',
        degree: '本科',
        type: '全职',
        department: '市场部',
        work_mode: '混合',
        job_level: '中级',
        hiring_count: 1,
        urgency: '普通',
        required_skills: ['市场推广', '品牌建设', '营销策划'],
        preferred_skills: ['新能源行业经验', '数据分析', '新媒体运营'],
        benefits: ['五险一金', '年终奖', '弹性工作', '定期体检']
      },
      // 智慧物流有限公司职位
      {
        company_id: 9,
        title: '物流运营经理',
        description: '负责公司物流网络的运营管理，优化物流效率',
        salary: '25-40K',
        location: '上海',
        experience: '3-5年',
        degree: '本科',
        type: '全职',
        department: '运营部',
        work_mode: '现场',
        job_level: '中级',
        hiring_count: 2,
        urgency: '紧急',
        required_skills: ['物流管理', '运营优化', '团队管理'],
        preferred_skills: ['供应链管理', '数据分析', 'ERP系统'],
        benefits: ['五险一金', '年终奖', '餐补', '交通补贴', '定期体检']
      },
      {
        company_id: 9,
        title: '前端开发工程师',
        description: '负责公司物流管理系统的前端开发',
        salary: '20-35K',
        location: '上海',
        experience: '2-4年',
        degree: '本科',
        type: '全职',
        department: '技术部',
        work_mode: '混合',
        job_level: '中级',
        hiring_count: 2,
        urgency: '普通',
        required_skills: ['Vue.js', 'JavaScript', 'HTML/CSS', 'Element UI'],
        preferred_skills: ['React', 'TypeScript', 'Node.js'],
        benefits: ['五险一金', '年终奖', '弹性工作', '定期体检']
      }
    ];
    
    for (const job of jobsData) {
      // 获取该公司的招聘者ID
      const recruiterResult = await pool.query(
        'SELECT id FROM recruiters WHERE company_id = $1 ORDER BY id LIMIT 1',
        [job.company_id]
      );
      
      if (recruiterResult.rows.length > 0) {
        const recruiter_id = recruiterResult.rows[0].id;
        
        // 发布职位，将数组转换为JSON字符串
        await pool.query(
          `INSERT INTO jobs (
            company_id, recruiter_id, title, description, salary, location, 
            experience, degree, type, status, department, work_mode, 
            job_level, hiring_count, urgency, required_skills, 
            preferred_skills, benefits
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, 'active', $10, $11, $12, $13, $14, $15::jsonb, $16::jsonb, $17::jsonb
          )`,
          [
            job.company_id, recruiter_id, job.title, job.description, job.salary, job.location,
            job.experience, job.degree, job.type, job.department, job.work_mode,
            job.job_level, job.hiring_count, job.urgency, JSON.stringify(job.required_skills),
            JSON.stringify(job.preferred_skills), JSON.stringify(job.benefits)
          ]
        );
        
        console.log(`   已为公司ID ${job.company_id} 发布职位: ${job.title}`);
      } else {
        console.log(`   公司ID ${job.company_id} 没有招聘者，无法发布职位`);
      }
    }
    
    // 3. 更新公司和招聘者的统计数据
    console.log('\n3. 更新公司和招聘者的统计数据...');
    
    // 更新公司的职位数量
    await pool.query(`
      UPDATE companies c
      SET job_count = (
        SELECT COUNT(*) FROM jobs j WHERE j.company_id = c.id
      )
    `);
    
    // 更新招聘者的发布职位数量
    await pool.query(`
      UPDATE recruiters r
      SET posted_jobs_count = (
        SELECT COUNT(*) FROM jobs j WHERE j.recruiter_id = r.id
      )
    `);
    
    console.log('   已更新所有公司和招聘者的统计数据');
    
    console.log('\n=== 真实数据添加完成 ===');
    await pool.end();
  } catch (error) {
    console.error('添加真实数据时出错:', error.message);
    console.error(error.stack);
    await pool.end();
  }
}

addRealData();