// 输入验证中间件 - 使用简单的验证函数，避免额外依赖

/**
 * 验证邮箱格式
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 验证手机号格式（中国大陆）
 */
const isValidPhone = (phone) => {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
};

/**
 * 验证密码强度（至少8位，包含字母和数字）
 */
const isValidPassword = (password) => {
  if (!password || password.length < 8) {
    return false;
  }
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  return hasLetter && hasNumber;
};

/**
 * 验证必填字段
 */
const validateRequired = (fields, req) => {
  const errors = [];
  for (const field of fields) {
    const value = req.body[field];
    if (value === undefined || value === null || value === '') {
      errors.push(`${field}是必填字段`);
    }
  }
  return errors;
};

/**
 * 创建验证中间件
 */
const createValidator = (rules) => {
  return (req, res, next) => {
    const errors = [];

    // 验证必填字段
    if (rules.required) {
      const requiredErrors = validateRequired(rules.required, req);
      errors.push(...requiredErrors);
    }

    // 验证邮箱
    if (rules.email && req.body[rules.email]) {
      if (!isValidEmail(req.body[rules.email])) {
        errors.push('邮箱格式不正确');
      }
    }

    // 验证手机号
    if (rules.phone && req.body[rules.phone]) {
      if (!isValidPhone(req.body[rules.phone])) {
        errors.push('手机号格式不正确（需要11位中国大陆手机号）');
      }
    }

    // 验证密码
    if (rules.password && req.body[rules.password]) {
      if (!isValidPassword(req.body[rules.password])) {
        errors.push('密码必须至少8位，包含字母和数字');
      }
    }

    // 验证字符串长度
    if (rules.length) {
      for (const [field, { min, max }] of Object.entries(rules.length)) {
        const value = req.body[field];
        if (value !== undefined && value !== null) {
          const strValue = String(value);
          if (min !== undefined && strValue.length < min) {
            errors.push(`${field}长度不能少于${min}个字符`);
          }
          if (max !== undefined && strValue.length > max) {
            errors.push(`${field}长度不能超过${max}个字符`);
          }
        }
      }
    }

    // 验证数字范围
    if (rules.range) {
      for (const [field, { min, max }] of Object.entries(rules.range)) {
        const value = req.body[field];
        if (value !== undefined && value !== null) {
          const numValue = Number(value);
          if (isNaN(numValue)) {
            errors.push(`${field}必须是数字`);
          } else {
            if (min !== undefined && numValue < min) {
              errors.push(`${field}不能小于${min}`);
            }
            if (max !== undefined && numValue > max) {
              errors.push(`${field}不能大于${max}`);
            }
          }
        }
      }
    }

    // 如果有错误，返回错误响应
    if (errors.length > 0) {
      return res.status(400).json({
        status: 'error',
        errorCode: 'VALIDATION_ERROR',
        message: '输入验证失败',
        errors
      });
    }

    next();
  };
};

module.exports = {
  createValidator,
  isValidEmail,
  isValidPhone,
  isValidPassword
};

