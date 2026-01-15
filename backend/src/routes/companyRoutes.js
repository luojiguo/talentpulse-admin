// 公司相关路由
const express = require('express');
const router = express.Router();
const { pool, query } = require('../config/db');
const { asyncHandler } = require('../middleware/errorHandler');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const iconv = require('iconv-lite');
const { authenticate, optionalAuth } = require('../middleware/auth');

// 修复中文文件名编码
function fixFilenameEncoding(filename) {
  // 尝试将当前字符串视为 ISO-8859-1 编码的字节，重新用 UTF-8 解码
  try {
    const buf = iconv.encode(filename, 'latin1'); // latin1 = ISO-8859-1
    return iconv.decode(buf, 'utf8');
  } catch (err) {
    console.warn('Filename encoding fix failed, using original:', filename);
    return filename;
  }
}

// 确保前端public目录存在
const frontendPublicDir = path.join(__dirname, '../../../Front_End/public');
if (!fs.existsSync(frontendPublicDir)) {
  fs.mkdirSync(frontendPublicDir, { recursive: true });
}

// 确保前端public/avatars目录存在
const frontendAvatarsDir = path.join(frontendPublicDir, 'avatars');
if (!fs.existsSync(frontendAvatarsDir)) {
  fs.mkdirSync(frontendAvatarsDir, { recursive: true });
}

// 确保前端public/companies_logo目录存在
const frontendCompaniesLogoDir = path.join(frontendPublicDir, 'companies_logo');
if (!fs.existsSync(frontendCompaniesLogoDir)) {
  fs.mkdirSync(frontendCompaniesLogoDir, { recursive: true });
}

// 确保前端public/business_license目录存在
const frontendBusinessLicenseDir = path.join(frontendPublicDir, 'business_license');
if (!fs.existsSync(frontendBusinessLicenseDir)) {
  fs.mkdirSync(frontendBusinessLicenseDir, { recursive: true });
}

// 配置multer存储 - 用于营业执照和公司Logo
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'logo') {
      cb(null, frontendCompaniesLogoDir);
    } else {
      cb(null, frontendBusinessLicenseDir);
    }
  },
  filename: (req, file, cb) => {
    // 修复中文文件名编码
    const fixedOriginalname = fixFilenameEncoding(file.originalname);
    const extname = path.extname(fixedOriginalname);
    const companyId = req.params.id || 'unknown';
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 10000);

    if (file.fieldname === 'logo') {
      const filename = `company_logo_${companyId}_${timestamp}_${randomSuffix}${extname}`;
      cb(null, filename);
      return;
    }

    // 尝试从数据库获取公司名称 (仅对非logo, 或通用)
    pool.query('SELECT name FROM companies WHERE id = $1', [companyId])
      .then(result => {
        let companyName = 'unknown';
        if (result.rows.length > 0) {
          // 清理公司名称，移除特殊字符，替换为下划线
          companyName = result.rows[0].name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
        }
        const filename = `${companyName}_营业执照_${timestamp}_${randomSuffix}${extname}`;
        cb(null, filename);
      })
      .catch(err => {
        console.error('获取公司名称失败:', err);
        // 出错时使用默认名称
        const filename = `company_${companyId}_营业执照_${timestamp}_${randomSuffix}${extname}`;
        cb(null, filename);
      });
  }
});

// 配置multer存储 - 用于公司Logo
const companyLogoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, frontendCompaniesLogoDir);
  },
  filename: (req, file, cb) => {
    // 修复中文文件名编码
    const fixedOriginalname = fixFilenameEncoding(file.originalname);
    const extname = path.extname(fixedOriginalname);
    const filename = `company_logo_${Date.now()}${extname}`;
    cb(null, filename);
  }
});

// 创建公司Logo上传multer实例
const companyLogoUpload = multer({
  storage: companyLogoStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 限制文件大小为5MB
  },
  fileFilter: (req, file, cb) => {
    // 只允许上传图片文件
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件（JPEG, JPG, PNG, GIF, WEBP）'));
    }
  }
});

// 创建multer实例
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 限制文件大小为10MB
  },
  fileFilter: (req, file, cb) => {
    // 只允许上传图片文件
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件（JPEG, JPG, PNG, GIF）'));
    }
  }
});

// 创建multer错误处理包装函数
const handleMulterError = (multerMiddleware) => {
  return (req, res, next) => {
    multerMiddleware(req, res, (err) => {
      if (err) {
        // 捕获并处理multer错误
        res.status(400).json({
          status: 'error',
          message: err.message
        });
      } else {
        next();
      }
    });
  };
};

// 获取用户关注的所有公司
router.get('/followed', optionalAuth, asyncHandler(async (req, res) => {
  const { user_id } = req.query;

  if (!user_id) {
    const error = new Error('请提供用户ID');
    error.statusCode = 400;
    error.errorCode = 'MISSING_USER_ID';
    throw error;
  }

  try {
    const result = await query(`
        SELECT c.* FROM companies c
        JOIN saved_companies sc ON c.id = sc.company_id
        WHERE sc.user_id = $1
        ORDER BY sc.created_at DESC
      `, [user_id], 30000);

    res.json({
      status: 'success',
      data: result.rows || []
    });
  } catch (error) {
    // 如果表不存在，返回空数组而不是错误
    if (error.code === '42P01' || error.message.includes('does not exist')) {
      console.warn('saved_companies表不存在，返回空数组');
      return res.json({
        status: 'success',
        data: []
      });
    }
    throw error;
  }
}));

// 智能推荐公司 - 根据用户期望职位匹配公司
router.get('/recommended/:userId', authenticate, asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // 获取用户信息
  const userResult = await query(`
        SELECT 
            c.desired_position,
            c.major,
            c.skills,
            c.preferred_locations
        FROM users u
        LEFT JOIN candidates c ON u.id = c.user_id
        WHERE u.id = $1
    `, [userId], 30000);

  if (userResult.rows.length === 0) {
    const error = new Error('用户不存在');
    error.statusCode = 404;
    error.errorCode = 'USER_NOT_FOUND';
    throw error;
  }

  const userInfo = userResult.rows[0];
  const { desired_position, major, skills, preferred_locations } = userInfo;

  // 如果没有期望职位，返回所有公司
  // 优化：直接使用companies表的job_count字段，避免实时计算COUNT
  if (!desired_position) {
    const allCompaniesResult = await query(`
            SELECT 
                c.*,
                COALESCE(c.job_count, 0) as job_count
            FROM companies c
            WHERE c.status = 'active'
            ORDER BY COALESCE(c.job_count, 0) DESC, c.created_at DESC
            LIMIT 50
        `, [], 10000);

    return res.json({
      status: 'success',
      data: allCompaniesResult.rows,
      count: allCompaniesResult.rows.length,
      method: 'all'
    });
  }

  // 根据期望职位查找匹配的公司（基于公司发布的职位）
  // 匹配条件：职位标题或描述包含用户的期望职位关键词
  // 排序规则：优先显示匹配职位数量多的公司
  // 优化：先筛选匹配的职位，再关联公司，减少JOIN数据量
  const matchedCompaniesResult = await query(`
        WITH matched_jobs AS (
            SELECT DISTINCT company_id, id as job_id
            FROM jobs
            WHERE status = 'active'
              AND (title ILIKE $1 OR description ILIKE $1)
        ),
        company_matches AS (
            SELECT 
                c.id,
                COUNT(DISTINCT mj.job_id) as matched_job_count
            FROM companies c
            INNER JOIN matched_jobs mj ON c.id = mj.company_id
            WHERE c.status = 'active'
            GROUP BY c.id
        )
        SELECT 
            c.*,
            COALESCE(c.job_count, 0) as job_count,
            cm.matched_job_count
        FROM company_matches cm
        INNER JOIN companies c ON cm.id = c.id
        ORDER BY cm.matched_job_count DESC, COALESCE(c.job_count, 0) DESC, c.created_at DESC
        LIMIT 50
    `, [`%${desired_position}%`], 15000);

  const matchedCompanies = matchedCompaniesResult.rows;

  res.json({
    status: 'success',
    data: matchedCompanies,
    count: matchedCompanies.length,
    method: 'matched'
  });
}));

// 获取所有公司，支持筛选
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const { search, industry, status, size } = req.query;

  // 构建查询条件
  let queryText = `SELECT c.*, 
                        (SELECT COUNT(*) FROM recruiters r 
                         JOIN user_roles ur ON r.user_id = ur.user_id 
                         WHERE r.company_id = c.id AND ur.role = 'recruiter') as hr_count 
                   FROM companies c WHERE 1=1`;
  const queryParams = [];
  let paramIndex = 1;

  // 添加搜索条件
  if (search) {
    queryText += ` AND (c.name ILIKE $${paramIndex} OR c.address ILIKE $${paramIndex})`;
    queryParams.push(`%${search}%`);
    paramIndex++;
  }

  // 添加行业筛选
  if (industry && industry !== 'all') {
    queryText += ` AND c.industry = $${paramIndex}`;
    queryParams.push(industry);
    paramIndex++;
  }

  // 添加状态筛选
  if (status && status !== 'all') {
    if (status === 'Verified') {
      queryText += ` AND c.is_verified = true`;
    } else if (status === 'Pending') {
      queryText += ` AND c.is_verified = false AND c.status = 'active'`;
    } else if (status === 'Rejected') {
      queryText += ` AND c.status = 'inactive'`;
    }
  }

  // 添加规模筛选
  if (size && size !== 'all') {
    queryText += ` AND c.size = $${paramIndex}`;
    queryParams.push(size);
    paramIndex++;
  }

  // 优化：使用job_count字段排序，减少JOIN操作
  // 增加查询超时时间，并添加LIMIT防止返回过多数据
  if (!queryText.includes('LIMIT')) {
    queryText += ' ORDER BY COALESCE(c.job_count, 0) DESC, c.created_at DESC LIMIT 200';
  }
  const result = await query(queryText, queryParams, 10000);
  res.json({
    status: 'success',
    data: result.rows,
    count: result.rows.length
  });
}));

// 获取单个公司
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await query('SELECT * FROM companies WHERE id = $1', [id]);
  if (result.rows.length === 0) {
    const error = new Error('Company not found');
    error.statusCode = 404;
    error.errorCode = 'COMPANY_NOT_FOUND';
    throw error;
  }
  res.json({
    status: 'success',
    data: result.rows[0]
  });
}));

// 获取公司详情，包括招聘者、职位数量和职位城市分布
router.get('/:id/details', asyncHandler(async (req, res) => {
  const { id } = req.params;

  // 检查公司是否存在
  const companyResult = await query('SELECT * FROM companies WHERE id = $1', [id]);
  if (companyResult.rows.length === 0) {
    const error = new Error('Company not found');
    error.statusCode = 404;
    error.errorCode = 'COMPANY_NOT_FOUND';
    throw error;
  }

  // 获取公司下的认证招聘者
  const recruitersResult = await query(`
      SELECT u.id, u.name, u.email, u.phone, u.avatar, r.position, r.department, r.is_verified, r.verification_date
      FROM users u
      JOIN recruiters r ON u.id = r.user_id
      JOIN user_roles ur ON u.id = ur.user_id
      WHERE r.company_id = $1 AND ur.role = 'recruiter'
      ORDER BY r.created_at DESC
    `, [id]);

  // 获取公司发布的职位数量
  const jobsCountResult = await query(
    'SELECT COUNT(*) as job_count FROM jobs WHERE company_id = $1',
    [id]
  );

  // 获取公司发布的职位所在的城市分布
  const citiesResult = await query(`
      SELECT location, COUNT(*) as count
      FROM jobs
      WHERE company_id = $1
      GROUP BY location
      ORDER BY count DESC
    `, [id]);

  res.json({
    status: 'success',
    data: {
      company: companyResult.rows[0],
      verified_recruiters: recruitersResult.rows,
      recruiters_count: recruitersResult.rows.length,
      jobs_count: parseInt(jobsCountResult.rows[0].job_count),
      job_cities: citiesResult.rows
    }
  });
}));

// 创建新公司并提交认证申请
router.post('/verify-create', authenticate, handleMulterError(upload.fields([
  { name: 'business_license', maxCount: 1 },
  { name: 'logo', maxCount: 1 }
])), asyncHandler(async (req, res) => {
  const {
    social_credit_code, contact_name, contact_phone, user_id,
    company_name, industry, size, address
  } = req.body;

  // 检查用户是否存在
  if (!user_id) {
    const error = new Error('请提供用户ID');
    error.statusCode = 400;
    error.errorCode = 'MISSING_USER_ID';
    throw error;
  }

  // 验证必填字段
  if (!company_name || !industry || !size) {
    const error = new Error('公司名称、行业和规模为必填项');
    error.statusCode = 400;
    error.errorCode = 'MISSING_REQUIRED_FIELDS';
    throw error;
  }

  // 验证字段类型匹配
  if (social_credit_code && (typeof social_credit_code !== 'string' || social_credit_code.length !== 18)) {
    const error = new Error('统一社会信用代码必须是18位字符串');
    error.statusCode = 400;
    error.errorCode = 'INVALID_SOCIAL_CREDIT_CODE';
    throw error;
  }

  // 构建文件路径
  let businessLicensePath = '';
  if (req.files && req.files['business_license']) {
    businessLicensePath = `/business_license/${req.files['business_license'][0].filename}`;
  } else if (req.body.business_license) {
    // Support passing existing path string if handling partial updates or reuse
    businessLicensePath = req.body.business_license;
  }

  let logoPath = '';
  if (req.files && req.files['logo']) {
    logoPath = `/companies_logo/${req.files['logo'][0].filename}`;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. 检查是否存在同名或同信用代码的公司
    const existingCompanyRes = await client.query(
      `SELECT * FROM companies WHERE name = $1 OR social_credit_code = $2`,
      [company_name, social_credit_code]
    );

    let newCompany;

    if (existingCompanyRes.rows.length > 0) {
      const existingCompany = existingCompanyRes.rows[0];

      // Case 1: 完全匹配 -> 复用现有公司
      if (existingCompany.name === company_name && existingCompany.social_credit_code === social_credit_code) {
        newCompany = existingCompany;

        // 如果用户上传了新logo，则更新公司logo
        if (logoPath) {
          await client.query(
            `UPDATE companies SET logo = $1 WHERE id = $2`,
            [logoPath, existingCompany.id]
          );
          newCompany.logo = logoPath;
        } else if (!newCompany.logo && !logoPath) {
          // 如果公司没有logo也没上传，保持原状或设默认
        }
      }
      // Case 2: 公司名相同，信用代码不同 -> 报错
      else if (existingCompany.name === company_name) {
        throw new AppError('该公司名称已被注册，且信用代码不匹配', 400, 'COMPANY_NAME_EXISTS_CODE_MISMATCH');
      }
      // Case 3: 信用代码相同，公司名不同 -> 报错
      else {
        throw new AppError('该统一社会信用代码已被其他公司注册', 400, 'CREDIT_CODE_EXISTS_NAME_MISMATCH');
      }
    } else {
      // 2. 创建新公司
      // status='active' enables it generally, but is_verified=false means it's not "official" yet
      const createCompanyRes = await client.query(
        `INSERT INTO companies (
                name, industry, size, address, 
                social_credit_code, contact_name, contact_phone, business_license,
                logo,
                status, is_verified
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active', false)
            RETURNING *`,
        [company_name, industry, size, address, social_credit_code, contact_name, contact_phone, businessLicensePath, logoPath || '🏢']
      );
      newCompany = createCompanyRes.rows[0];
    }

    // 2. 更新 recruiter_user 关联到新公司
    const updateRecruiterRes = await client.query(
      `UPDATE recruiter_user 
           SET company_id = $1, 
               is_verified = false, 
               verification_status = 'pending',
               business_license = $2, 
               contact_name = $3, 
               contact_phone = $4,
               updated_at = CURRENT_TIMESTAMP
           WHERE user_id = $5`,
      [newCompany.id, businessLicensePath, contact_name, contact_phone, user_id]
    );

    // 如果没有找到 recruiter_user 记录（可能是新用户，或者角色是 candidate），则插入一条新记录
    if (updateRecruiterRes.rowCount === 0) {
      await client.query(
        `INSERT INTO recruiter_user (
                user_id, company_id, is_verified, verification_status, 
                business_license, contact_name, contact_phone, 
                created_at, updated_at
            ) VALUES ($1, $2, false, 'pending', $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [user_id, newCompany.id, businessLicensePath, contact_name, contact_phone]
      );

      // 同时确保 recruiters 表也有一条记录 (为了兼容旧逻辑)
      // Check if exists first? Or UPSERT
      const checkRecruiter = await client.query('SELECT id FROM recruiters WHERE user_id = $1', [user_id]);
      if (checkRecruiter.rowCount === 0) {
        await client.query(
          `INSERT INTO recruiters (user_id, company_id, is_verified, created_at, updated_at)
                 VALUES ($1, $2, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [user_id, newCompany.id]
        );
      }
    }


    // 3. 确保用户拥有recruiter角色
    const checkRole = await client.query('SELECT role FROM user_roles WHERE user_id = $1 AND role = $2', [user_id, 'recruiter']);
    if (checkRole.rowCount === 0) {
      await client.query(
        `INSERT INTO user_roles (user_id, role, created_at) VALUES ($1, $2, CURRENT_TIMESTAMP)`,
        [user_id, 'recruiter']
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      status: 'success',
      message: '公司创建成功并已提交认证申请！',
      data: {
        company: newCompany,
        business_license: businessLicensePath,
        verification_status: 'pending'
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}));

// 单独上传公司Logo
router.post('/:id/logo', authenticate, handleMulterError(upload.single('logo')), asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!req.file) {
    const error = new Error('请选择图片文件');
    error.statusCode = 400;
    throw error;
  }

  const logoPath = `/companies_logo/${req.file.filename}`;

  // 检查公司是否存在
  const companyResult = await query('SELECT * FROM companies WHERE id = $1', [id]);
  if (companyResult.rows.length === 0) {
    const error = new Error('Company not found');
    error.statusCode = 404;
    throw error;
  }

  // 更新Logo
  await query(
    'UPDATE companies SET logo = $1 WHERE id = $2',
    [logoPath, id]
  );

  res.json({
    status: 'success',
    message: 'Logo上传成功',
    data: {
      logo: logoPath,
      logo_url: logoPath
    }
  });
}));

// 企业认证申请（提交审核，设置为待审核状态）或 更新企业信息
router.post('/:id/verify', authenticate, handleMulterError(upload.fields([
  { name: 'business_license', maxCount: 1 },
  { name: 'logo', maxCount: 1 }
])), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    social_credit_code, contact_name, contact_phone, user_id,
    company_name, industry, size, address
  } = req.body;

  // 1. 检查当前公司是否存在
  const companyResult = await query('SELECT * FROM companies WHERE id = $1', [id]);
  if (companyResult.rows.length === 0) {
    const error = new Error('Company not found');
    error.statusCode = 404;
    error.errorCode = 'COMPANY_NOT_FOUND';
    throw error;
  }
  const currentCompany = companyResult.rows[0];

  // 2. 检查用户ID
  if (!user_id) {
    const error = new Error('请提供用户ID');
    error.statusCode = 400;
    error.errorCode = 'MISSING_USER_ID';
    throw error;
  }

  // 3. 验证字段类型
  if (social_credit_code && (typeof social_credit_code !== 'string' || social_credit_code.length !== 18)) {
    const error = new Error('统一社会信用代码必须是18位字符串');
    error.statusCode = 400;
    error.errorCode = 'INVALID_SOCIAL_CREDIT_CODE';
    throw error;
  }

  // 4. 构建文件路径
  let businessLicensePath = '';
  if (req.files && req.files['business_license']) {
    businessLicensePath = `/business_license/${req.files['business_license'][0].filename}`;
  } else if (req.body.business_license) {
    businessLicensePath = req.body.business_license;
  } else {
    // 默认保持原有（如果切换公司，需注意是否应携带，通常如果是新上传会覆盖）
    businessLicensePath = currentCompany.business_license;
  }

  let logoPath = '';
  if (req.files && req.files['logo']) {
    logoPath = `/companies_logo/${req.files['logo'][0].filename}`;
  } else {
    logoPath = currentCompany.logo;
  }

  // 5. 核心逻辑：判断是更新当前公司 还是 切换/关联新公司
  let targetCompanyId = id;
  let targetCompanyData = currentCompany;
  let isSwitching = false;

  // 如果提供了新的社会信用代码，且与当前不同 -> 切换/创建
  if (social_credit_code && social_credit_code !== currentCompany.social_credit_code) {
    isSwitching = true;
    console.log(`[Verify] Switching company from ${currentCompany.social_credit_code} to ${social_credit_code}`);

    // 检查目标公司是否存在
    const targetRes = await query('SELECT * FROM companies WHERE social_credit_code = $1', [social_credit_code]);

    if (targetRes.rows.length > 0) {
      // 目标公司已存在 -> 关联并更新其信息
      targetCompanyId = targetRes.rows[0].id;
      targetCompanyData = targetRes.rows[0];

      await query(
        `UPDATE companies 
               SET contact_name = COALESCE($1, contact_name), 
                   contact_phone = COALESCE($2, contact_phone), 
                   business_license = COALESCE($3, business_license), 
                   name = COALESCE($4, name), 
                   industry = COALESCE($5, industry), 
                   size = COALESCE($6, size), 
                   address = COALESCE($7, address),
                   logo = COALESCE($8, logo),
                   updated_at = CURRENT_TIMESTAMP
               WHERE id = $9`,
        [contact_name, contact_phone, businessLicensePath, company_name, industry, size, address, logoPath, targetCompanyId]
      );
    } else {
      // 目标公司不存在 -> 创建新公司
      // Check Name Uniqueness first
      const nameCheck = await query('SELECT id FROM companies WHERE name = $1', [company_name]);
      if (nameCheck.rows.length > 0) {
        const error = new Error('该公司名称已存在，请使用其他名称或核对统一社会信用代码');
        error.statusCode = 400;
        throw error;
      }

      // 默认状态 active, is_verified false
      const insertRes = await query(
        `INSERT INTO companies (
            name, industry, size, address, 
            social_credit_code, contact_name, contact_phone, business_license,
            logo, status, is_verified, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *`,
        [company_name, industry, size, address, social_credit_code, contact_name, contact_phone, businessLicensePath, logoPath || '🏢']
      );
      targetCompanyId = insertRes.rows[0].id;
      targetCompanyData = insertRes.rows[0];
    }
  } else {
    // 保持当前公司 -> 更新信息
    // 根据原逻辑：如果是已认证，保持 true；否则 false（待审核）
    // 这里我们实际上是在提交审核，所以通常不需要改变 is_verified，除非管理员操作
    // 原代码逻辑：const newVerificationStatus = isPreviouslyVerified ? true : false;
    const isVerified = currentCompany.is_verified;

    await query(
      `UPDATE companies 
           SET social_credit_code = $1, contact_name = $2, contact_phone = $3, business_license = $4, 
               name = COALESCE($5, name), industry = COALESCE($6, industry), size = COALESCE($7, size), address = COALESCE($8, address),
               logo = $9,
               updated_at = CURRENT_TIMESTAMP
               -- 注意：此处不修改 is_verified 状态，认证状态由管理员决定，或者保持原样
           WHERE id = $10`,
      [social_credit_code, contact_name, contact_phone, businessLicensePath, company_name, industry, size, address, logoPath, id]
    );
    // targetCompanyId 保持为 id
    targetCompanyData = currentCompany; // 简略：依然指向当前对象，但属性可能已旧。只要ID对即可。
    targetCompanyData.is_verified = isVerified;
  }

  // 6. 确定 recruiter_user 的认证状态
  // 如果关联的是已认证公司，招聘者可视为 approved (或者 pending admin approval to link?)
  // 原逻辑：isPreviouslyVerified ? 'approved' : 'pending'
  // 如果切换了公司，通常需要重新审核关联关系，所以 safe default is 'pending' unless company is strictly verified and we trust the user.
  // 保持原逻辑：跟随公司的 is_verified 状态
  // 但是如果公司没有验证(is_verified=false), recruiter_user status naturally pending.
  // 如果公司已验证(is_verified=true), recruiter_user usually approved if auto-link, OR pending if manual check needed.
  // 让我们遵循原代码的精神：和公司状态对齐。

  // Refetch target company to be sure of status
  const finalTargetRes = await query('SELECT is_verified FROM companies WHERE id = $1', [targetCompanyId]);
  const finalIsVerified = finalTargetRes.rows[0].is_verified;

  const recruiterVerificationStatus = finalIsVerified ? 'approved' : 'pending';

  // 7. 更新 recruiter_user
  // 修复了之前缺失参数的BUG，并支持修改 company_id
  await query(
    `UPDATE recruiter_user 
       SET is_verified = $1, verification_status = $2, 
           business_license = $3, contact_name = $4, contact_phone = $5, 
           company_id = $6,
           updated_at = CURRENT_TIMESTAMP 
       WHERE user_id = $7`,
    [finalIsVerified, recruiterVerificationStatus, businessLicensePath, contact_name, contact_phone, targetCompanyId, user_id]
  );

  // 8. 确保用户拥有recruiter角色
  const checkRole = await query('SELECT role FROM user_roles WHERE user_id = $1 AND role = $2', [user_id, 'recruiter']);
  if (checkRole.rows.length === 0) {
    await query(
      `INSERT INTO user_roles (user_id, role, created_at) VALUES ($1, $2, CURRENT_TIMESTAMP)`,
      [user_id, 'recruiter']
    );
  }

  res.json({
    status: 'success',
    message: finalIsVerified ? '企业关联已更新，已通过认证！' : '企业认证申请已提交，请等待管理员审核！',
    data: {
      company: {
        ...targetCompanyData,
        id: targetCompanyId,
        is_verified: finalIsVerified
        // 其他最新字段略
      },
      user_status: recruiterVerificationStatus
    }
  });

}));

// 审核企业认证（管理员使用）
router.put('/:id/verify-status', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_verified, verification_date } = req.body;
    const verificationStatus = is_verified ? 'approved' : 'rejected';

    // 检查公司是否存在
    const companyResult = await pool.query('SELECT * FROM companies WHERE id = $1', [id]);
    if (companyResult.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Company not found'
      });
    }

    // 更新公司认证状态
    const updateResult = await pool.query(
      `UPDATE companies 
       SET is_verified = $1, verification_date = $2 
       WHERE id = $3 RETURNING *`,
      [is_verified, verification_date || new Date(), id]
    );

    // 更新所有关联该公司的招聘者用户的认证状态
    await pool.query(
      `UPDATE recruiter_user 
       SET is_verified = $1, verification_status = $2, 
           verification_date = $3, updated_at = CURRENT_TIMESTAMP 
       WHERE company_id = $4`,
      [is_verified, verificationStatus, verification_date || new Date(), id]
    );

    res.json({
      status: 'success',
      message: `企业认证${is_verified ? '通过' : '拒绝'}`,
      data: {
        company: updateResult.rows[0],
        verification_status: verificationStatus
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// 获取用户关联的公司信息
router.get('/user/:userId', optionalAuth, asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const result = await query(
    `SELECT c.*, 
            ru.is_verified as recruiter_verified, ru.verification_status, 
            ru.business_license as recruiter_business_license, 
            ru.contact_name as recruiter_contact_name, ru.contact_phone as recruiter_contact_phone
       FROM companies c 
       JOIN recruiter_user ru ON c.id = ru.company_id 
       WHERE ru.user_id = $1`,
    [userId],
    30000
  );

  if (result.rows.length === 0) {
    // Return empty array instead of 404 to allow frontend to handle "no company" state
    return res.json({
      status: 'success',
      data: []
    });
  }

  res.json({
    status: 'success',
    data: result.rows
  });
}));

// 关注公司
router.post('/:id/follow', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({
        status: 'error',
        message: '请提供用户ID'
      });
    }

    // 开启事务
    await pool.query('BEGIN');

    try {
      // 检查公司是否存在
      const companyResult = await pool.query('SELECT * FROM companies WHERE id = $1', [id]);
      if (companyResult.rows.length === 0) {
        await pool.query('ROLLBACK');
        return res.status(404).json({
          status: 'error',
          message: 'Company not found'
        });
      }

      // 使用INSERT ... ON CONFLICT实现幂等性，避免重复关注
      const result = await pool.query(
        `INSERT INTO saved_companies (user_id, company_id) VALUES ($1, $2) 
         ON CONFLICT (user_id, company_id) DO NOTHING 
         RETURNING *`,
        [user_id, id]
      );

      await pool.query('COMMIT');

      if (result.rows.length === 0) {
        // 已经关注过，返回成功但不创建新记录
        return res.json({
          status: 'success',
          message: '您已经关注了该公司',
          data: null
        });
      }

      res.json({
        status: 'success',
        message: '关注成功',
        data: result.rows[0]
      });
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// 取消关注公司
router.delete('/:id/follow', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({
        status: 'error',
        message: '请提供用户ID'
      });
    }

    // 开启事务
    await pool.query('BEGIN');

    try {
      // 检查公司是否存在
      const companyResult = await pool.query('SELECT * FROM companies WHERE id = $1', [id]);
      if (companyResult.rows.length === 0) {
        await pool.query('ROLLBACK');
        return res.status(404).json({
          status: 'error',
          message: 'Company not found'
        });
      }

      // 使用DELETE ... RETURNING实现幂等性，无论是否存在都会成功执行
      const result = await pool.query(
        'DELETE FROM saved_companies WHERE user_id = $1 AND company_id = $2 RETURNING *',
        [user_id, id]
      );

      await pool.query('COMMIT');

      // 无论是否找到记录，都返回成功消息
      res.json({
        status: 'success',
        message: result.rows.length > 0 ? '取消关注成功' : '您还没有关注该公司',
        data: result.rows.length > 0 ? result.rows[0] : null
      });
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// 检查用户是否关注了公司
router.get('/:id/follow/status', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({
        status: 'error',
        message: '请提供用户ID'
      });
    }

    const result = await pool.query(
      'SELECT * FROM saved_companies WHERE user_id = $1 AND company_id = $2',
      [user_id, id]
    );

    res.json({
      status: 'success',
      data: {
        is_following: result.rows.length > 0
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// 上传公司Logo
router.post('/:id/logo', authenticate, companyLogoUpload.single('company_logo'), async (req, res) => {
  try {
    const { id } = req.params;

    // 检查公司是否存在
    const companyResult = await pool.query('SELECT * FROM companies WHERE id = $1', [id]);
    if (companyResult.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: '公司不存在'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: '请选择要上传的图片'
      });
    }

    // 构建文件路径
    const logoPath = `/companies_logo/${req.file.filename}`;

    // 更新数据库中的公司Logo路径
    const updateResult = await pool.query(
      `UPDATE companies 
       SET logo = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 RETURNING *`,
      [logoPath, id]
    );

    res.json({
      status: 'success',
      message: '公司Logo上传成功',
      data: {
        company: updateResult.rows[0],
        logo_url: logoPath
      }
    });

  } catch (error) {
    console.error('上传公司Logo错误:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// 上传营业执照
router.post('/:id/business-license', authenticate, handleMulterError(upload.single('business_license')), async (req, res) => {
  try {
    const { id } = req.params;

    console.log('营业执照上传请求:', { companyId: id, hasFile: !!req.file, fileName: req.file?.originalname });

    // 检查公司是否存在
    const companyResult = await pool.query('SELECT * FROM companies WHERE id = $1', [id]);
    if (companyResult.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: '公司不存在'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: '请选择要上传的图片'
      });
    }

    console.log('文件上传成功:', { filename: req.file.filename, path: req.file.path });

    // 构建文件路径
    const licensePath = `/business_license/${req.file.filename}`;

    // 更新数据库中的营业执照路径
    const updateResult = await pool.query(
      `UPDATE companies 
       SET business_license = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 RETURNING *`,
      [licensePath, id]
    );

    // 同时更新recruiter_user表中的营业执照路径
    await pool.query(
      `UPDATE recruiter_user 
       SET business_license = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE company_id = $2`,
      [licensePath, id]
    );

    res.json({
      status: 'success',
      message: '营业执照上传成功',
      data: {
        company: updateResult.rows[0],
        business_license_url: licensePath
      }
    });

  } catch (error) {
    console.error('上传营业执照错误:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

module.exports = router;