// 用户相关路由
const express = require('express');
const router = express.Router();
const { pool, query } = require('../config/db');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pinyin = require('pinyin');
const iconv = require('iconv-lite');
const { createValidator } = require('../middleware/validators');
const { asyncHandler } = require('../middleware/errorHandler');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const { sendVerificationEmail, sendPasswordResetSuccessEmail } = require('../services/emailService');
const { logAction } = require('../middleware/logger');

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

// 登录路由验证
const loginValidator = createValidator({
  required: ['identifier', 'password', 'userType']
});

// 登录路由
router.post('/login', loginValidator, asyncHandler(async (req, res) => {
  const { identifier, password, userType } = req.body;

  // 根据identifier（邮箱或手机号）查找用户及其角色
  const userQuery = await query(
    `SELECT u.*, ARRAY_AGG(ur.role) as roles 
     FROM users u 
     LEFT JOIN user_roles ur ON u.id = ur.user_id 
     WHERE u.email = $1 OR u.phone = $1 
     GROUP BY u.id`,
    [identifier]
  );

  if (userQuery.rows.length === 0) {
    throw new AppError('用户不存在', 401, 'USER_NOT_FOUND');
  }

  const user = userQuery.rows[0];
  const userRoles = user.roles || [];

  // 验证密码
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AppError('密码错误', 401, 'INVALID_PASSWORD');
  }

  // 验证用户角色
  if (!userRoles.includes(userType)) {
    throw new AppError('用户无此角色权限', 403, 'INSUFFICIENT_PERMISSIONS');
  }

  // 生成JWT token
  const tokenPayload = {
    id: user.id,
    email: user.email,
    name: user.name,
    roles: userRoles,
    currentRole: userType
  };

  const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  });

  // 准备返回数据
  const userData = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    avatar: user.avatar,
    roles: userRoles,
    role: userType
  };

  // 如果是招聘者，获取公司信息
  if (userType === 'recruiter') {
    const recruiterQuery = await pool.query(
      'SELECT ru.company_id, c.name as company_name, c.logo as company_logo, ru.is_verified FROM recruiter_user ru LEFT JOIN companies c ON ru.company_id = c.id WHERE ru.user_id = $1',
      [user.id]
    );

    if (recruiterQuery.rows.length > 0) {
      userData.company = {
        id: recruiterQuery.rows[0].company_id,
        name: recruiterQuery.rows[0].company_name,
        logo: recruiterQuery.rows[0].company_logo,
        is_verified: recruiterQuery.rows[0].is_verified
      };
    }
  }

  // 记录登录日志
  await logAction(req, res, '用户登录', `${user.name} 成功登录系统`, 'login', { type: 'user', id: user.id });

  // 返回成功响应
  res.json({
    status: 'success',
    message: '登录成功',
    data: userData,
    token: token
  });
}));

// 注册路由验证
const registerValidator = createValidator({
  required: ['name', 'password', 'userType'],
  // email和phone至少需要一个
  email: 'email',
  phone: 'phone',
  password: 'password',
  length: {
    name: { min: 2, max: 50 }
  }
});

// 注册路由
router.post('/register', registerValidator, asyncHandler(async (req, res) => {
  const { name, email, phone, password, userType } = req.body;

  // 检查角色是否合法，不允许注册管理员
  if (userType === 'admin') {
    throw new AppError('不允许直接注册管理员账号', 403, 'INVALID_ROLE');
  }

  // 验证邮箱和手机号至少有一个
  if (!email && !phone) {
    throw new AppError('邮箱和手机号至少需要提供一个', 400, 'EMAIL_OR_PHONE_REQUIRED');
  }

  // 检查邮箱是否已存在（如果提供了邮箱）
  if (email) {
    const emailCheck = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    if (emailCheck.rows.length > 0) {
      throw new AppError('邮箱已被注册', 400, 'EMAIL_EXISTS');
    }
  }

  // 检查手机号是否已存在（如果提供了手机号）
  if (phone) {
    const phoneCheck = await query(
      'SELECT id FROM users WHERE phone = $1',
      [phone]
    );
    if (phoneCheck.rows.length > 0) {
      throw new AppError('手机号已被注册', 400, 'PHONE_EXISTS');
    }
  }

  // 密码加密
  const hashedPassword = await bcrypt.hash(password, 10);

  // 开启事务
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 创建用户
    const userResult = await client.query(
      'INSERT INTO users (name, email, phone, password, status) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [name, email, phone, hashedPassword, 'active']
    );

    const userId = userResult.rows[0].id;

    // 分配角色
    await client.query(
      'INSERT INTO user_roles (user_id, role) VALUES ($1, $2)',
      [userId, userType]
    );

    // 根据用户类型创建对应的扩展信息
    if (userType === 'recruiter') {
      // 创建一个默认公司
      const companyResult = await client.query(
        'INSERT INTO companies (name, status, created_at, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING id',
        ['未命名公司', 'active']
      );

      const companyId = companyResult.rows[0].id;

      // 创建招聘者记录 - recruiter_user表
      await client.query(
        'INSERT INTO recruiter_user (user_id, company_id, is_verified, status, created_at, updated_at) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
        [userId, companyId, false, 'pending']
      );

      // 创建招聘者记录 - recruiters表
      await client.query(
        'INSERT INTO recruiters (user_id, company_id, is_verified, created_at, updated_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
        [userId, companyId, false]
      );
    } else if (userType === 'candidate') {
      // 创建求职者记录 - candidate_user表
      await client.query(
        'INSERT INTO candidate_user (user_id, is_verified, created_at, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
        [userId, true]
      );

      // 关键修复：同时创建 candidates 表记录，否则消息功能无法使用
      await client.query(
        'INSERT INTO candidates (user_id, created_at, updated_at, availability_status) VALUES ($1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $2)',
        [userId, 'available']
      );
    }

    await client.query('COMMIT');

    // 记录注册日志
    await logAction(req, res, '用户注册', `新用户 ${name} 成功注册为 ${userType}`, 'create', { type: 'user', id: userId });

    // 返回成功响应
    res.status(201).json({
      status: 'success',
      message: '注册成功',
      data: {
        id: userId,
        name,
        email,
        phone,
        roles: [userType],
        role: userType
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}));

// 中文转拼音函数
const chineseToPinyin = (text) => {
  try {
    // 使用正确的pinyin库调用方式 (pinyin v4.0.0)
    const pinyinResult = pinyin(text, {
      style: pinyin.STYLE_NORMAL,
      heteronym: false,
      segment: false
    });
    return pinyinResult.join('');
  } catch (error) {
    console.error('中文转拼音失败:', error);
    // 如果转换失败，返回原始文本
    return text;
  }
};

// 用于存储验证码的内存存储（生产环境建议使用Redis）
const verificationCodes = new Map();

// 生成6位数字验证码
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// 发送验证码路由验证
const sendCodeValidator = createValidator({
  required: ['identifier']
});

// 发送验证码路由
router.post('/send-verification-code', sendCodeValidator, asyncHandler(async (req, res) => {
  const { identifier } = req.body;

  // 查找用户
  const userQuery = await query(
    'SELECT id, email, phone FROM users WHERE email = $1 OR phone = $1',
    [identifier]
  );

  // 无论用户是否存在，都生成并发送验证码（防止攻击者通过验证码判断邮箱是否已注册）
  // 但只有存在的用户才能通过后续验证
  const user = userQuery.rows[0];
  const code = generateVerificationCode();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10分钟后过期

  // 存储验证码
  verificationCodes.set(identifier, {
    code,
    expiresAt,
    userId: user ? user.id : null
  });

  // 检查是否是邮箱地址
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailRegex.test(identifier)) {
    // 发送邮件验证码
    await sendVerificationEmail(identifier, code);
  } else {
    // 这里可以添加短信验证码发送逻辑
    console.log(`向用户 ${identifier} 发送验证码: ${code}`);
  }

  res.json({
    status: 'success',
    message: '验证码发送成功，请注意查收',
    data: {
      expiresIn: 600 // 验证码有效期（秒）
    }
  });
}));

// 确保前端public/avatars目录存在
// backend/src/routes/userRoutes.js -> backend/src -> backend -> root -> Front_End
const frontendAvatarsDir = path.join(__dirname, '../../../Front_End/public/avatars');
if (!fs.existsSync(frontendAvatarsDir)) {
  fs.mkdirSync(frontendAvatarsDir, { recursive: true });
}

// 配置multer存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, frontendAvatarsDir);
  },
  filename: (req, file, cb) => {
    // 使用时间戳+随机数生成文件名，避免中文文件名问题
    // 修复中文文件名编码
    const fixedOriginalname = fixFilenameEncoding(file.originalname);
    const extname = path.extname(fixedOriginalname);
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const filename = `avatar_${timestamp}_${random}${extname}`;
    cb(null, filename);
  }
});

// 创建multer实例
const upload = multer({
  storage: storage,
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

// 上传用户头像 - 需要特殊处理multer，不能直接用asyncHandler
router.post('/:id/avatar', asyncHandler(async (req, res) => {
  const { id } = req.params;

  // 检查用户是否存在
  const userCheck = await query('SELECT id, avatar FROM users WHERE id = $1', [id]);
  if (userCheck.rows.length === 0) {
    throw new AppError('用户不存在', 404, 'USER_NOT_FOUND');
  }

  // 使用multer处理上传
  upload.single('avatar')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ status: 'error', errorCode: 'UPLOAD_ERROR', message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ status: 'error', errorCode: 'NO_FILE', message: '请选择要上传的图片' });
    }

    try {
      // 构建文件路径
      const avatarPath = `/avatars/${req.file.filename}`;

      // 删除旧头像 (可选，为了节省空间)
      const oldAvatar = userCheck.rows[0].avatar;
      if (oldAvatar && oldAvatar.startsWith('/avatars/') && !oldAvatar.includes('default')) {
        const oldAvatarFullPath = path.join(frontendAvatarsDir, path.basename(oldAvatar));
        if (fs.existsSync(oldAvatarFullPath)) {
          try {
            fs.unlinkSync(oldAvatarFullPath);
          } catch (e) {
            console.error('删除旧头像失败:', e);
          }
        }
      }

      // 更新数据库
      const updateResult = await query(
        'UPDATE users SET avatar = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING avatar',
        [avatarPath, id]
      );

      res.json({
        status: 'success',
        message: '头像上传成功',
        data: {
          avatar: updateResult.rows[0].avatar
        }
      });
    } catch (dbError) {
      // 如果数据库更新失败，删除已上传的文件
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      const error = new Error('数据库错误');
      error.statusCode = 500;
      error.errorCode = 'DATABASE_ERROR';
      throw error;
    }
  });
}));

// 获取性别选项配置 - 必须在 /:id 路由之前
router.get('/config/genders', asyncHandler(async (req, res) => {
  // 查询数据库中的 check 约束定义
  const result = await query(`
      SELECT pg_get_constraintdef(oid) as definition
      FROM pg_constraint
      WHERE conname = 'users_gender_check'
    `);

  if (result.rows.length === 0) {
    // 如果没有找到约束，返回默认值
    return res.json({
      status: 'success',
      data: ['男', '女', '其他']
    });
  }

  const definition = result.rows[0].definition;
  // 解析定义字符串: CHECK (((gender)::text = ANY ((ARRAY['男'::character varying, '女'::character varying, '其他'::character varying])::text[])))
  // 使用正则提取单引号中的内容
  const matches = definition.match(/'([^']*)'::character varying/g);

  if (matches) {
    const options = matches.map(m => m.match(/'([^']*)'/)[1]);
    return res.json({
      status: 'success',
      data: options
    });
  }

  // 如果解析失败，返回默认值
  res.json({
    status: 'success',
    data: ['男', '女', '其他']
  });
}));

// 获取用户信息
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await query(
    `SELECT id, name, email, phone, avatar, gender, birth_date, 
              education, major, school, graduation_year, work_experience_years, 
              desired_position, skills, languages, address, wechat, linkedin, 
              github, personal_website, created_at, updated_at 
       FROM users WHERE id = $1`,
    [id],
    30000
  );

  if (result.rows.length === 0) {
    const error = new Error('用户不存在');
    error.statusCode = 404;
    error.errorCode = 'USER_NOT_FOUND';
    throw error;
  }

  res.json({
    status: 'success',
    data: result.rows[0]
  });
}));

// 更新用户信息
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, position, education, major, school, desired_position, skills, languages, emergency_contact, emergency_phone, address, wechat, linkedin, github, personal_website, company } = req.body;
  let { graduation_year, work_experience_years, birth_date, gender } = req.body;

  // 检查用户是否存在
  const userResult = await query('SELECT * FROM users WHERE id = $1', [id]);
  if (userResult.rows.length === 0) {
    throw new AppError('用户不存在', 404, 'USER_NOT_FOUND');
  }
  const currentUserRecord = userResult.rows[0];

  // 使用当前用户记录的值作为默认值，只更新前端发送的字段
  const updateData = {
    name: name !== undefined ? name : currentUserRecord.name,
    email: email !== undefined ? email : currentUserRecord.email,
    phone: phone !== undefined ? phone : currentUserRecord.phone,
    position: position !== undefined ? position : currentUserRecord.position,
    education: education !== undefined ? education : currentUserRecord.education,
    major: major !== undefined ? major : currentUserRecord.major,
    school: school !== undefined ? school : currentUserRecord.school,
    desired_position: desired_position !== undefined ? desired_position : currentUserRecord.desired_position,
    skills: skills !== undefined ? skills : currentUserRecord.skills,
    languages: languages !== undefined ? languages : currentUserRecord.languages,
    emergency_contact: emergency_contact !== undefined ? emergency_contact : currentUserRecord.emergency_contact,
    emergency_phone: emergency_phone !== undefined ? emergency_phone : currentUserRecord.emergency_phone,
    address: address !== undefined ? address : currentUserRecord.address,
    wechat: wechat !== undefined ? wechat : currentUserRecord.wechat,
    linkedin: linkedin !== undefined ? linkedin : currentUserRecord.linkedin,
    github: github !== undefined ? github : currentUserRecord.github,
    personal_website: personal_website !== undefined ? personal_website : currentUserRecord.personal_website,
    graduation_year: graduation_year !== undefined && graduation_year !== '' ? graduation_year : currentUserRecord.graduation_year,
    work_experience_years: work_experience_years !== undefined && work_experience_years !== '' ? work_experience_years : currentUserRecord.work_experience_years,
    birth_date: birth_date !== undefined && birth_date !== '' ? birth_date : currentUserRecord.birth_date,
    gender: gender !== undefined && gender !== '' ? gender : currentUserRecord.gender
  };

  // 检查邮箱冲突（如果更改了邮箱）
  if (email && email !== currentUserRecord.email) {
    const emailCheck = await query(
      'SELECT id FROM users WHERE email = $1 AND id != $2',
      [email, id]
    );
    if (emailCheck.rows.length > 0) {
      throw new AppError('该邮箱已被其他账号占用', 400, 'EMAIL_EXISTS');
    }
  }

  // 检查手机号冲突（如果更改了手机号）
  if (phone && phone !== currentUserRecord.phone) {
    const phoneCheck = await query(
      'SELECT id FROM users WHERE phone = $1 AND id != $2',
      [phone, id]
    );
    if (phoneCheck.rows.length > 0) {
      throw new AppError('该手机号已被其他账号占用', 400, 'PHONE_EXISTS');
    }
  }

  // 更新用户信息
  const updateResult = await query(
    `UPDATE users 
       SET name = $1, email = $2, phone = $3, position = $4, gender = $5, birth_date = $6, 
           education = $7, major = $8, school = $9, graduation_year = $10, 
           work_experience_years = $11, desired_position = $12, skills = $13, 
           languages = $14, emergency_contact = $15, emergency_phone = $16, 
           address = $17, wechat = $18, linkedin = $19, github = $20, 
           personal_website = $21, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $22 RETURNING *`,
    [
      updateData.name, updateData.email, updateData.phone, updateData.position, updateData.gender, updateData.birth_date, 
      updateData.education, updateData.major, updateData.school, updateData.graduation_year, 
      updateData.work_experience_years, updateData.desired_position, updateData.skills, 
      updateData.languages, updateData.emergency_contact, updateData.emergency_phone, 
      updateData.address, updateData.wechat, updateData.linkedin, updateData.github, 
      updateData.personal_website, id
    ]
  );

  // 如果提供了公司信息，更新公司信息
  if (company) {
    // 检查用户是否为招聘者角色
    const recruiterResult = await query(
      `SELECT ru.company_id FROM recruiter_user ru WHERE ru.user_id = $1`,
      [id]
    );

    if (recruiterResult.rows.length > 0) {
      const companyId = recruiterResult.rows[0].company_id;

      // 处理日期字段，空字符串转为null
      const establishmentDate = company.establishment_date === '' ? null : company.establishment_date;

      // 更新公司信息
      await query(
        `UPDATE companies 
           SET name = $1, industry = $2, size = $3, address = $4, description = $5, 
               logo = $6, company_type = $7, establishment_date = $8, registered_capital = $9, 
               social_credit_code = $10, company_website = $11, company_phone = $12, 
               company_email = $13, is_verified = $14, status = $15, 
               business_license = $16, contact_info = $17, updated_at = CURRENT_TIMESTAMP 
           WHERE id = $18 RETURNING *`,
        [
          company.name, company.industry, company.size, company.address, company.description,
          company.logo, company.company_type, establishmentDate, company.registered_capital,
          company.social_credit_code, company.company_website, company.company_phone,
          company.company_email, company.is_verified, company.status,
          company.business_license, company.contact_info, companyId
        ]
      );

      // 更新招聘者用户信息
      await query(
        `UPDATE recruiter_user 
           SET is_verified = $1, verification_status = $2, updated_at = CURRENT_TIMESTAMP 
           WHERE user_id = $3 RETURNING *`,
        [company.is_verified, company.verification_status || 'pending', id]
      );
    }
  }

  // 记录更新用户信息日志
  await logAction(req, res, '更新用户信息', `用户 ${updateResult.rows[0].name} 更新了个人信息`, 'update', { type: 'user', id: id });

  res.json({
    status: 'success',
    message: 'User information updated successfully',
    data: updateResult.rows[0]
  });
}));

// 角色切换验证路由
router.post('/switch-role', asyncHandler(async (req, res) => {
  const { userId, newRole, companyName } = req.body;

  // 验证用户是否存在
  const userResult = await query('SELECT * FROM users WHERE id = $1', [userId]);
  if (userResult.rows.length === 0) {
    throw new AppError('用户不存在', 404, 'USER_NOT_FOUND');
  }

  const user = userResult.rows[0];

  // 获取用户的所有角色
  const rolesResult = await query(
    `SELECT role FROM user_roles WHERE user_id = $1`,
    [userId]
  );

  const roles = rolesResult.rows.map(row => row.role);

  // 验证用户是否有该角色
  if (!roles.includes(newRole)) {
    throw new AppError('您没有该角色权限', 403, 'INSUFFICIENT_PERMISSIONS');
  }

  // 角色切换逻辑
  let roleData = {};
  let needsVerification = false;

  if (newRole === 'recruiter') {
    // 招聘者角色切换逻辑
    const recruiterUserResult = await query(
      'SELECT * FROM recruiter_user WHERE user_id = $1',
      [userId]
    );

    let companyId;

    if (recruiterUserResult.rows.length === 0) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // 创建招聘者记录
        if (companyName) {
          // 检查公司是否存在
          const companyResult = await client.query('SELECT id FROM companies WHERE name = $1', [companyName]);
          if (companyResult.rows.length > 0) {
            companyId = companyResult.rows[0].id;
          } else {
            // 创建新公司
            const newCompany = await client.query(
              'INSERT INTO companies (name, created_at, updated_at) VALUES ($1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING id',
              [companyName]
            );
            companyId = newCompany.rows[0].id;
          }
        } else {
          // 如果没有提供公司名称，创建一个默认公司
          const newCompany = await client.query(
            'INSERT INTO companies (name, created_at, updated_at) VALUES ($1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING id',
            ['未命名公司']
          );
          companyId = newCompany.rows[0].id;
        }

        // 插入招聘者记录 - recruiter_user表
        await client.query(
          `INSERT INTO recruiter_user (user_id, company_id, is_verified, created_at, updated_at)
             VALUES ($1, $2, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [userId, companyId]
        );

        // 插入招聘者记录 - recruiters表
        await client.query(
          `INSERT INTO recruiters (user_id, company_id, is_verified, created_at, updated_at)
             VALUES ($1, $2, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [userId, companyId]
        );

        await client.query('COMMIT');
        needsVerification = true;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } else {
      // 已存在的招聘者
      const recruiter = recruiterUserResult.rows[0];
      companyId = recruiter.company_id;
      needsVerification = !recruiter.is_verified;
    }

    // 获取公司信息
    if (companyId) {
      const companyDetails = await query('SELECT * FROM companies WHERE id = $1', [companyId]);
      if (companyDetails.rows.length > 0) {
        roleData = {
          company: companyDetails.rows[0],
          is_verified: !needsVerification
        };
      }
    }
  }
  if (newRole === 'candidate') {
    // 求职者角色切换逻辑
    const candidateUserResult = await query(
      'SELECT * FROM candidate_user WHERE user_id = $1',
      [userId]
    );

    if (candidateUserResult.rows.length === 0) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // 创建求职者基础记录
        await client.query(
          `INSERT INTO candidate_user (user_id, is_verified, created_at, updated_at)
             VALUES ($1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [userId]
        );

        // 关键修复：同时创建 candidates 表记录，否则消息功能无法使用
        await client.query(
          `INSERT INTO candidates (user_id, created_at, updated_at, availability_status)
             VALUES ($1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'available')
             ON CONFLICT (user_id) DO NOTHING`,
          [userId]
        );

        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } else {
      // 即使 candidate_user 存在，也检查 candidates 表是否存在记录
      await query(
        `INSERT INTO candidates (user_id, created_at, updated_at, availability_status)
             VALUES ($1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'available')
             ON CONFLICT (user_id) DO NOTHING`,
        [userId]
      );
    }

    roleData = {
      is_verified: true
    };
  }

  // 返回切换结果
  const { password: _, ...userWithoutPassword } = user;

  if (needsVerification) {
    return res.status(200).json({
      status: 'success',
      message: '角色切换成功，但需要完成企业认证',
      data: {
        ...userWithoutPassword,
        roles,
        role: newRole,
        needs_verification: true,
        role_data: roleData
      }
    });
  }

  res.json({
    status: 'success',
    message: '角色切换成功',
    data: {
      ...userWithoutPassword,
      roles,
      role: newRole,
      needs_verification: false,
      role_data: roleData
    }
  });
}));



// 验证验证码路由验证
const verifyCodeValidator = createValidator({
  required: ['identifier', 'code']
});

// 验证验证码路由
router.post('/verify-code', verifyCodeValidator, asyncHandler(async (req, res) => {
  const { identifier, code } = req.body;

  // 查找验证码
  const storedCode = verificationCodes.get(identifier);

  if (!storedCode) {
    throw new AppError('验证码不存在或已过期', 400, 'INVALID_CODE');
  }

  // 检查验证码是否过期
  if (Date.now() > storedCode.expiresAt) {
    verificationCodes.delete(identifier);
    throw new AppError('验证码已过期', 400, 'CODE_EXPIRED');
  }

  // 检查验证码是否正确
  if (code !== storedCode.code) {
    throw new AppError('验证码错误', 400, 'INVALID_CODE');
  }

  // 验证成功，生成一个临时token用于重置密码
  const resetToken = jwt.sign(
    { userId: storedCode.userId, identifier },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '10m' } // 10分钟有效期
  );

  res.json({
    status: 'success',
    message: '验证码验证成功',
    data: {
      resetToken
    }
  });
}));

// 注销账号路由
router.delete('/:id/delete-account', asyncHandler(async (req, res) => {
  const { id } = req.params;

  // 验证用户是否存在
  const userCheck = await query('SELECT id, email, phone FROM users WHERE id = $1', [id]);
  if (userCheck.rows.length === 0) {
    throw new AppError('用户不存在', 404, 'USER_NOT_FOUND');
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. 删除用户相关的所有关联数据
    // 删除用户角色关联
    await client.query('DELETE FROM user_roles WHERE user_id = $1', [id]);

    // 删除用户头像文件（如果存在）
    const user = userCheck.rows[0];
    if (user.avatar && user.avatar.startsWith('/avatars/')) {
      const avatarPath = path.join(frontendAvatarsDir, path.basename(user.avatar));
      if (fs.existsSync(avatarPath)) {
        try {
          fs.unlinkSync(avatarPath);
        } catch (e) {
          console.error('删除用户头像失败:', e);
        }
      }
    }

    // 2. 删除求职者相关数据
    // 先获取求职者ID
    const candidateCheck = await client.query('SELECT id FROM candidates WHERE user_id = $1', [id]);
    if (candidateCheck.rows.length > 0) {
      const candidateId = candidateCheck.rows[0].id;
      // 删除求职者简历
      await client.query('DELETE FROM resumes WHERE candidate_id = $1', [candidateId]);
    }

    // 删除求职者记录
    await client.query('DELETE FROM candidate_user WHERE user_id = $1', [id]);
    await client.query('DELETE FROM candidates WHERE user_id = $1', [id]);

    // 3. 删除招聘者相关数据
    // 获取招聘者关联的公司ID
    const recruiterCheck = await client.query('SELECT company_id FROM recruiter_user WHERE user_id = $1', [id]);
    if (recruiterCheck.rows.length > 0) {
      const companyId = recruiterCheck.rows[0].company_id;

      // 删除招聘者记录
      await client.query('DELETE FROM recruiter_user WHERE user_id = $1', [id]);
      await client.query('DELETE FROM recruiters WHERE user_id = $1', [id]);

      // 检查是否还有其他招聘者关联该公司
      const otherRecruiters = await client.query('SELECT id FROM recruiter_user WHERE company_id = $1', [companyId]);
      if (otherRecruiters.rows.length === 0) {
        // 如果没有其他招聘者，删除公司及其相关数据
        // 删除公司Logo文件
        const companyLogoCheck = await client.query('SELECT logo FROM companies WHERE id = $1', [companyId]);
        if (companyLogoCheck.rows[0]?.logo) {
          const logoPath = path.join(__dirname, '../../../Front_End/public', companyLogoCheck.rows[0].logo);
          if (fs.existsSync(logoPath)) {
            try {
              fs.unlinkSync(logoPath);
            } catch (e) {
              console.error('删除公司Logo失败:', e);
            }
          }
        }

        // 删除公司营业执照文件
        const companyLicenseCheck = await client.query('SELECT business_license FROM companies WHERE id = $1', [companyId]);
        if (companyLicenseCheck.rows[0]?.business_license) {
          const licensePath = path.join(__dirname, '../../../Front_End/public', companyLicenseCheck.rows[0].business_license);
          if (fs.existsSync(licensePath)) {
            try {
              fs.unlinkSync(licensePath);
            } catch (e) {
              console.error('删除公司营业执照失败:', e);
            }
          }
        }

        // 删除公司职位
        await client.query('DELETE FROM job_postings WHERE company_id = $1', [companyId]);

        // 删除公司
        await client.query('DELETE FROM companies WHERE id = $1', [companyId]);
      }
    }

    // 4. 最后删除用户本身
    await client.query('DELETE FROM users WHERE id = $1', [id]);

    await client.query('COMMIT');

    // 记录账号注销日志
    await logAction(req, res, '账号注销', `用户 ${userCheck.rows[0].email || userCheck.rows[0].phone} 成功注销账号`, 'delete', { type: 'user', id: id });

    res.json({
      status: 'success',
      message: '账号注销成功，所有相关数据已清除'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('账号注销失败:', error);
    throw new AppError('账号注销失败，请稍后重试', 500, 'ACCOUNT_DELETION_FAILED');
  } finally {
    client.release();
  }
}));

// 重置密码路由验证
const resetPasswordValidator = createValidator({
  required: ['resetToken', 'newPassword']
});

// 重置密码路由
router.post('/reset-password', resetPasswordValidator, asyncHandler(async (req, res) => {
  const { resetToken, newPassword } = req.body;

  try {
    // 验证重置token
    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET || 'your-secret-key');
    const { userId } = decoded;

    // 检查用户是否存在
    const userQuery = await query(
      'SELECT id, email FROM users WHERE id = $1',
      [userId]
    );

    if (userQuery.rows.length === 0) {
      throw new AppError('用户不存在', 404, 'USER_NOT_FOUND');
    }

    const user = userQuery.rows[0];

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 更新密码
    await query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, userId]
    );

    // 发送密码重置成功邮件
    if (user.email) {
      await sendPasswordResetSuccessEmail(user.email);
    }

    res.json({
      status: 'success',
      message: '密码重置成功'
    });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      throw new AppError('重置链接无效或已过期', 400, 'INVALID_RESET_TOKEN');
    }
    throw err;
  }
}));

// 发送邮箱绑定验证码路由验证
const sendEmailBindCodeValidator = createValidator({
  required: ['email']
});

// 发送邮箱绑定验证码路由
router.post('/send-email-bind-code', sendEmailBindCodeValidator, asyncHandler(async (req, res) => {
  const { email } = req.body;
  const userId = req.user?.id; // 从认证中间件获取

  if (!userId) {
    throw new AppError('用户未登录', 401, 'UNAUTHORIZED');
  }

  // 检查邮箱是否已被其他用户使用
  const emailCheck = await query(
    'SELECT id FROM users WHERE email = $1 AND id != $2',
    [email, userId]
  );

  if (emailCheck.rows.length > 0) {
    throw new AppError('邮箱已被其他用户使用', 400, 'EMAIL_EXISTS');
  }

  // 生成验证码
  const code = generateVerificationCode();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10分钟后过期

  // 存储验证码，使用userId_email作为键
  verificationCodes.set(`${userId}_email`, {
    code,
    expiresAt,
    userId,
    email
  });

  // 发送邮件验证码
  await sendVerificationEmail(email, code);

  res.json({
    status: 'success',
    message: '验证码发送成功，请注意查收',
    data: {
      expiresIn: 600 // 验证码有效期（秒）
    }
  });
}));

// 绑定邮箱路由验证
const bindEmailValidator = createValidator({
  required: ['email', 'code']
});

// 绑定邮箱路由
router.post('/bind-email', bindEmailValidator, asyncHandler(async (req, res) => {
  const { email, code } = req.body;
  const userId = req.user?.id; // 从认证中间件获取

  if (!userId) {
    throw new AppError('用户未登录', 401, 'UNAUTHORIZED');
  }

  // 查找验证码
  const storedCode = verificationCodes.get(`${userId}_email`);

  if (!storedCode) {
    throw new AppError('验证码不存在或已过期', 400, 'INVALID_CODE');
  }

  // 检查验证码是否过期
  if (Date.now() > storedCode.expiresAt) {
    verificationCodes.delete(`${userId}_email`);
    throw new AppError('验证码已过期', 400, 'CODE_EXPIRED');
  }

  // 检查验证码是否正确
  if (code !== storedCode.code) {
    throw new AppError('验证码错误', 400, 'INVALID_CODE');
  }

  // 检查验证码对应的邮箱是否匹配
  if (email !== storedCode.email) {
    throw new AppError('验证码与邮箱不匹配', 400, 'EMAIL_MISMATCH');
  }

  // 更新用户邮箱
  await query(
    'UPDATE users SET email = $1, email_verified = true, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [email, userId]
  );

  // 删除使用过的验证码
  verificationCodes.delete(`${userId}_email`);

  res.json({
    status: 'success',
    message: '邮箱绑定成功'
  });
}));

// 获取所有用户
router.get('/', asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT u.id, u.name, u.email, u.phone, u.password, u.avatar, u.created_at, u.updated_at,
              json_agg(ur.role) as roles
       FROM users u
       JOIN user_roles ur ON u.id = ur.user_id
       GROUP BY u.id
       ORDER BY u.created_at DESC`
  );

  res.json({
    status: 'success',
    data: result.rows
  });
}));

module.exports = router;
