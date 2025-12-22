// 统一错误处理中间件

/**
 * 统一错误响应格式
 * @param {Error} err - 错误对象
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express next函数
 */
const errorHandler = (err, req, res, next) => {
  // 默认错误信息
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || '服务器内部错误';
  let errorCode = err.errorCode || 'INTERNAL_ERROR';

  // 开发环境显示详细错误信息
  const isDevelopment = process.env.NODE_ENV === 'development';

  // 处理不同类型的错误
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = err.message || '输入验证失败';
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    errorCode = 'UNAUTHORIZED';
    message = '未授权访问';
  } else if (err.name === 'ForbiddenError') {
    statusCode = 403;
    errorCode = 'FORBIDDEN';
    message = '禁止访问';
  } else if (err.name === 'NotFoundError') {
    statusCode = 404;
    errorCode = 'NOT_FOUND';
    message = err.message || '资源不存在';
  } else if (err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED') {
    statusCode = 504;
    errorCode = 'DATABASE_TIMEOUT';
    message = '数据库连接超时，请稍后重试';
  } else if (err.code === '23505') { // PostgreSQL唯一约束违反
    statusCode = 409;
    errorCode = 'DUPLICATE_ENTRY';
    message = '数据已存在';
  } else if (err.code === '23503') { // PostgreSQL外键约束违反
    statusCode = 400;
    errorCode = 'FOREIGN_KEY_VIOLATION';
    message = '关联数据不存在';
  } else if (err.code && err.code.startsWith('42')) { // PostgreSQL语法错误
    statusCode = 500;
    errorCode = 'SQL_SYNTAX_ERROR';
    message = isDevelopment ? err.message : '数据库查询语法错误';
  } else if (err.code && err.code.startsWith('22')) { // PostgreSQL数据格式错误
    statusCode = 400;
    errorCode = 'DATA_FORMAT_ERROR';
    message = isDevelopment ? err.message : '数据格式错误';
  }

  // 记录错误日志
  if (statusCode >= 500) {
    console.error('服务器错误:', {
      error: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
  } else {
    console.warn('客户端错误:', {
      error: err.message,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
  }

  // 构建响应对象
  const response = {
    status: 'error',
    errorCode,
    message,
    ...(isDevelopment && { 
      stack: err.stack,
      details: err.details 
    })
  };

  // 如果是生产环境且是服务器错误，隐藏详细信息
  if (!isDevelopment && statusCode >= 500) {
    response.message = '服务器内部错误';
  }

  res.status(statusCode).json(response);
};

/**
 * 404错误处理
 */
const notFoundHandler = (req, res, next) => {
  const error = new Error('API路由不存在');
  error.statusCode = 404;
  error.errorCode = 'NOT_FOUND';
  next(error);
};

/**
 * 异步错误包装器
 * 用于包装异步路由处理函数，自动捕获错误
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler
};

