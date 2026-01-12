const { query } = require('../config/db');
const jwt = require('jsonwebtoken');
const { asyncHandler } = require('./errorHandler');

/**
 * 身份认证中间件
 * 验证JWT token并设置req.user
 */
const authenticate = asyncHandler(async (req, res, next) => {
  // 从请求头获取token
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const error = new Error('未提供认证token');
    error.statusCode = 401;
    error.errorCode = 'MISSING_TOKEN';
    throw error;
  }

  const token = authHeader.substring(7); // 移除 'Bearer ' 前缀

  try {
    // 验证JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // 查询用户信息
    const userResult = await query(
      'SELECT id, name, email, phone, avatar, status FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      const error = new Error('用户不存在');
      error.statusCode = 401;
      error.errorCode = 'USER_NOT_FOUND';
      throw error;
    }

    const user = userResult.rows[0];

    if (user.status === 'inactive') {
      const error = new Error('账户已禁用');
      error.statusCode = 403;
      error.errorCode = 'ACCOUNT_DISABLED';
      throw error;
    }

    // 获取用户角色
    const rolesResult = await query(
      'SELECT role FROM user_roles WHERE user_id = $1',
      [userId]
    );

    const roles = rolesResult.rows.map(row => row.role);

    // 将用户信息附加到请求对象
    req.user = {
      ...user,
      roles,
      // 保留原始decoded信息（包含过期时间等）
      ...decoded
    };

    next();
  } catch (err) {
    const error = new Error('无效的认证token');
    error.statusCode = 401;
    error.errorCode = 'INVALID_TOKEN';
    error.originalError = err.message;
    throw error;
  }
});

/**
 * 角色授权中间件
 * 检查用户是否具有指定角色
 * @param {...string} allowedRoles - 允许的角色列表
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      const error = new Error('未认证');
      error.statusCode = 401;
      error.errorCode = 'UNAUTHORIZED';
      return next(error);
    }

    const userRoles = req.user.roles || [];
    const hasPermission = allowedRoles.some(role => userRoles.includes(role));

    if (!hasPermission) {
      const error = new Error('权限不足');
      error.statusCode = 403;
      error.errorCode = 'FORBIDDEN';
      return next(error);
    }

    next();
  };
};

/**
 * 可选认证中间件
 * 如果提供了token则验证，否则继续（不要求必须认证）
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);

    try {
      // 验证JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id;

      const userResult = await query(
        'SELECT id, name, email, phone, avatar, status FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length > 0) {
        const user = userResult.rows[0];
        // 如果账户被禁用，也不视为已认证
        if (user.status !== 'inactive') {
          const rolesResult = await query(
            'SELECT role FROM user_roles WHERE user_id = $1',
            [userId]
          );

          req.user = {
            ...user,
            roles: rolesResult.rows.map(row => row.role),
            ...decoded
          };
        }
      }
    } catch (err) {
      // 忽略错误，继续执行（可选认证）
    }
  }

  next();
});

module.exports = {
  authenticate,
  authorize,
  optionalAuth,
};
