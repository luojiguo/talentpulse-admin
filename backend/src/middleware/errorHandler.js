const AppError = require('../utils/AppError');

/**
 * 统一错误处理中间件
 */
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // 开发环境发送详细错误
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    // 生产环境发送简洁错误
    let error = { ...err };
    error.message = err.message;
    error.name = err.name;

    // 处理特定类型的错误
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === '23505') error = handleDuplicateFieldsDB(error);
    if (error.code === '23503') error = handleForeignKeyErrorDB(error); // Foreign key violation
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }

  // 记录严重错误日志
  if (err.statusCode >= 500) {
    console.error('SERVER ERROR 💥', {
      error: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  }
};

// 生产环境错误处理函数
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  }
  // Programming or other unknown error: don't leak details
  else {
    console.error('ERROR 💥', err);
    res.status(500).json({
      status: 'error',
      message: '服务器内部错误'
    });
  }
};

// 具体错误处理逻辑
const handleCastErrorDB = err => {
  const message = `无效的数据格式: ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err => {
  // PG unique violation usually detail looks like: "Key (email)=(test@test.com) already exists."
  const value = err.detail ? err.detail.match(/\((.*?)\)/)[1] : 'unknown';
  const message = `重复的字段值: ${value}. 请使用其他值`;
  return new AppError(message, 409); // 409 Conflict
};

const handleForeignKeyErrorDB = err => {
  const message = `关联数据错误: ${err.detail || '引用的资源不存在'}`;
  return new AppError(message, 400);
}

const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `无效的输入数据. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () => new AppError('无效的 Token，请重新登录!', 401);

const handleJWTExpiredError = () => new AppError('Token 已过期，请重新登录!', 401);

/**
 * 404错误处理
 */
const notFoundHandler = (req, res, next) => {
  next(new AppError(`找不到路径: ${req.originalUrl}`, 404));
};

/**
 * 异步错误包装器
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

