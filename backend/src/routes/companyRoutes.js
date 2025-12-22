// 公司相关路由
const express = require('express');
const router = express.Router();
const { pool, query } = require('../config/db');
const { asyncHandler } = require('../middleware/errorHandler');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const iconv = require('iconv-lite');

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

// 配置multer存储 - 用于营业执照
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, frontendBusinessLicenseDir);
  },
  filename: (req, file, cb) => {
    // 修复中文文件名编码
    const fixedOriginalname = fixFilenameEncoding(file.originalname);
    const extname = path.extname(fixedOriginalname);
    const companyId = req.params.id || 'unknown';
    
    // 尝试从数据库获取公司名称
    pool.query('SELECT name FROM companies WHERE id = $1', [companyId])
      .then(result => {
        let companyName = 'unknown';
        if (result.rows.length > 0) {
          // 清理公司名称，移除特殊字符，替换为下划线
          companyName = result.rows[0].name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
        }
        
        const timestamp = Date.now();
        const randomSuffix = Math.floor(Math.random() * 10000);
        const filename = `${companyName}_营业执照_${timestamp}_${randomSuffix}${extname}`;
        cb(null, filename);
      })
      .catch(err => {
        console.error('获取公司名称失败:', err);
        // 出错时使用默认名称
        const timestamp = Date.now();
        const randomSuffix = Math.floor(Math.random() * 10000);
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
router.get('/followed', asyncHandler(async (req, res) => {
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
router.get('/recommended/:userId', asyncHandler(async (req, res) => {
    const { userId } = req.params;
    
    // 获取用户信息
    const userResult = await query(`
        SELECT 
            u.desired_position,
            u.major,
            u.skills,
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
router.get('/', asyncHandler(async (req, res) => {
    const { search, industry, status, size } = req.query;
    
    // 构建查询条件
    let queryText = 'SELECT * FROM companies WHERE 1=1';
    const queryParams = [];
    let paramIndex = 1;
    
    // 添加搜索条件
    if (search) {
      queryText += ` AND (name ILIKE $${paramIndex} OR address ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }
    
    // 添加行业筛选
    if (industry && industry !== 'all') {
      queryText += ` AND industry = $${paramIndex}`;
      queryParams.push(industry);
      paramIndex++;
    }
    
    // 添加状态筛选
    if (status && status !== 'all') {
      if (status === 'Verified') {
        queryText += ` AND is_verified = true`;
      } else if (status === 'Pending') {
        queryText += ` AND is_verified = false AND status = 'active'`;
      } else if (status === 'Rejected') {
        queryText += ` AND status = 'inactive'`;
      }
    }
    
    // 添加规模筛选
    if (size && size !== 'all') {
      queryText += ` AND size = $${paramIndex}`;
      queryParams.push(size);
      paramIndex++;
    }
    
    // 优化：使用job_count字段排序，减少JOIN操作
    // 增加查询超时时间，并添加LIMIT防止返回过多数据
    if (!queryText.includes('LIMIT')) {
      queryText += ' ORDER BY COALESCE(job_count, 0) DESC, created_at DESC LIMIT 200';
    }
    const result = await query(queryText, queryParams, 10000);
    res.json({
      status: 'success',
      data: result.rows,
      count: result.rows.length
    });
}));

// 获取单个公司
router.get('/:id', asyncHandler(async (req, res) => {
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
      SELECT u.id, u.name, u.email, u.phone, r.position, r.department, r.is_verified, r.verification_date
      FROM users u
      JOIN recruiters r ON u.id = r.user_id
      JOIN user_roles ur ON u.id = ur.user_id
      WHERE r.company_id = $1 AND ur.role = 'recruiter' AND r.is_verified = true
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

// 企业认证申请（直接通过，无需管理员审核）
router.post('/:id/verify', handleMulterError(upload.single('business_license')), asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { social_credit_code, contact_info, user_id } = req.body;
    
    // 检查公司是否存在
    const companyResult = await query('SELECT * FROM companies WHERE id = $1', [id]);
    if (companyResult.rows.length === 0) {
      const error = new Error('Company not found');
      error.statusCode = 404;
      error.errorCode = 'COMPANY_NOT_FOUND';
      throw error;
    }
    
    // 检查用户是否存在
    if (!user_id) {
      const error = new Error('请提供用户ID');
      error.statusCode = 400;
      error.errorCode = 'MISSING_USER_ID';
      throw error;
    }
    
    // 验证字段类型匹配
    // social_credit_code 必须是18位字符串
    if (social_credit_code && (typeof social_credit_code !== 'string' || social_credit_code.length !== 18)) {
      const error = new Error('统一社会信用代码必须是18位字符串');
      error.statusCode = 400;
      error.errorCode = 'INVALID_SOCIAL_CREDIT_CODE';
      throw error;
    }
    
    // contact_info 必须是字符串
    if (contact_info && typeof contact_info !== 'string') {
      const error = new Error('联系人信息必须是字符串');
      error.statusCode = 400;
      error.errorCode = 'INVALID_CONTACT_INFO';
      throw error;
    }
    
    // 构建营业执照路径
    let businessLicensePath = '';
    if (req.file) {
      businessLicensePath = `/business_license/${req.file.filename}`;
    } else if (req.body.business_license) {
      businessLicensePath = req.body.business_license;
    }
    
    // 更新公司认证信息，直接设置为已认证
    const updateResult = await query(
      `UPDATE companies 
       SET social_credit_code = $1, contact_info = $2, business_license = $3, status = 'active',
           is_verified = true, verification_date = CURRENT_TIMESTAMP 
       WHERE id = $4 RETURNING *`,
      [social_credit_code, contact_info, businessLicensePath, id]
    );
    
    // 更新招聘者用户的认证状态
    await query(
      `UPDATE recruiter_user 
       SET is_verified = true, verification_status = 'approved', 
           business_license = $1, contact_info = $2, 
           verification_date = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
       WHERE user_id = $3 AND company_id = $4`,
      [businessLicensePath, contact_info, user_id, id]
    );
    
    res.json({
      status: 'success',
      message: '企业认证成功！',
      data: {
        company: updateResult.rows[0],
        business_license: businessLicensePath,
        contact_info: contact_info,
        is_verified: true
      }
    });
}));

// 审核企业认证（管理员使用）
router.put('/:id/verify-status', async (req, res) => {
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
router.get('/user/:userId', asyncHandler(async (req, res) => {
    const { userId } = req.params;
    
    const result = await query(
      `SELECT c.*, ru.is_verified as recruiter_verified, ru.verification_status, ru.business_license as recruiter_business_license, ru.contact_info as recruiter_contact_info 
       FROM companies c 
       JOIN recruiter_user ru ON c.id = ru.company_id 
       WHERE ru.user_id = $1`,
      [userId],
      30000
    );
    
    if (result.rows.length === 0) {
      const error = new Error('未找到关联的公司');
      error.statusCode = 404;
      error.errorCode = 'COMPANY_NOT_FOUND';
      throw error;
    }
    
    res.json({ 
      status: 'success', 
      data: result.rows 
    });
}));

// 关注公司
router.post('/:id/follow', async (req, res) => {
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
router.delete('/:id/follow', async (req, res) => {
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
router.get('/:id/follow/status', async (req, res) => {
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
router.post('/:id/logo', companyLogoUpload.single('company_logo'), async (req, res) => {
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
router.post('/:id/business-license', handleMulterError(upload.single('business_license')), async (req, res) => {
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