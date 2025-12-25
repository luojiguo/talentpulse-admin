const AppError = require('../utils/AppError');

/**
 * 统一错误处理中间件
 */
const errorHandler = (err, req, res, next) => {
  // 确保错误对象有必要的属性
  err.statusCode = err.statusCode || 500;
  err.status = err.status || (err.statusCode < 500 ? 'fail' : 'error');
  err.errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';

  // 记录所有错误日志，便于调试和监控
  console.error('ERROR DETAILS:', {
    statusCode: err.statusCode,
    errorCode: err.errorCode,
    message: err.message,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString(),
    stack: err.stack,
    code: err.code,
    name: err.name
  });

  // 开发环境发送详细错误
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    // 生产环境发送简洁错误
    let error = { ...err };
    error.message = err.message;
    error.name = err.name;
    error.errorCode = err.errorCode;
    error.isOperational = err.isOperational;

    // 处理特定类型的错误
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === '23505') error = handleDuplicateFieldsDB(error);
    if (error.code === '23503') error = handleForeignKeyErrorDB(error); // Foreign key violation
    if (error.code === '23514') error = handleCheckViolationDB(error); // Check constraint violation
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
    if (error.code === 'ECONNRESET' || error.code === 'ECONNREFUSED') error = handleConnectionError();
    if (error.code === '57014') error = handleQueryTimeoutError();

    sendErrorProd(error, res);
  }
};

// 开发环境错误处理函数
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    errorCode: err.errorCode,
    message: err.message,
    error: {
      name: err.name,
      code: err.code,
      detail: err.detail,
      hint: err.hint,
      position: err.position
    },
    stack: err.stack
  });
};

const sendErrorProd = (err, res) => {
  // 确保所有错误都有统一的响应格式
  const response = {
    status: err.status,
    errorCode: err.errorCode,
    message: err.message
  };

  // 操作错误：发送详细信息给客户端
  if (err.isOperational) {
    res.status(err.statusCode).json(response);
  } 
  // 编程错误或未知错误：发送通用错误信息
  else {
    // 隐藏敏感错误详情
    response.message = '服务器内部错误，请稍后重试';
    response.errorCode = 'INTERNAL_SERVER_ERROR';
    res.status(500).json(response);
  }
};

// 具体错误处理逻辑
const handleCastErrorDB = err => {
  const message = `无效的数据格式: ${err.path}: ${err.value}`;
  return new AppError(message, 400, 'INVALID_DATA_FORMAT');
};

const handleDuplicateFieldsDB = err => {
  // PG unique violation usually detail looks like: "Key (email)=(test@test.com) already exists."
  let value = 'unknown';
  try {
    // 尝试从错误详情中提取重复的值
    const matches = err.detail.match(/\((.*?)\)=\((.*?)\)/);
    if (matches && matches[2]) {
      value = matches[2];
    }
  } catch (e) {
    // 忽略解析错误
  }
  const message = `重复的字段值: ${value}. 请使用其他值`;
  return new AppError(message, 409, 'DUPLICATE_FIELD');
};

const handleForeignKeyErrorDB = err => {
  const message = `关联数据错误: ${err.detail || '引用的资源不存在'}`;
  return new AppError(message, 400, 'INVALID_REFERENCE');
};

const handleCheckViolationDB = err => {
  const message = `数据验证错误: ${err.detail || '违反了数据库约束'}`;
  return new AppError(message, 400, 'VALIDATION_ERROR');
};

const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `无效的输入数据. ${errors.join('. ')}`;
  return new AppError(message, 400, 'VALIDATION_ERROR');
};

const handleJWTError = () => {
  return new AppError('无效的认证令牌，请重新登录!', 401, 'INVALID_TOKEN');
};

const handleJWTExpiredError = () => {
  return new AppError('认证令牌已过期，请重新登录!', 401, 'EXPIRED_TOKEN');
};

const handleConnectionError = () => {
  return new AppError('数据库连接错误，请稍后重试', 503, 'DATABASE_CONNECTION_ERROR');
};

const handleQueryTimeoutError = () => {
  return new AppError('数据库查询超时，请稍后重试', 504, 'DATABASE_TIMEOUT');
};

/**
 * 404错误处理
 */
const notFoundHandler = (req, res, next) => {
  next(new AppError(`找不到路径: ${req.originalUrl}`, 404, 'RESOURCE_NOT_FOUND'));
};

/**
 * 异步错误包装器 - 确保所有异步错误都被捕获
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(err => {
      // 确保异步错误被正确标记
      if (!err.isOperational) {
        err.isOperational = true;
      }
      next(err);
    });
  };
};

/**
 * 确保所有API返回统一的成功响应格式
 */
const sendSuccessResponse = (res, data, statusCode = 200, message = '操作成功') => {
  const response = {
    status: 'success',
    message: message,
    data: data
  };
  
  // 如果是分页数据，添加分页信息
  if (data && typeof data === 'object' && 'rows' in data && 'count' in data) {
    response.data = data.rows;
    response.meta = {
      count: data.count,
      page: data.page || 1,
      limit: data.limit || 20,
      totalPages: data.totalPages || Math.ceil(data.count / (data.limit || 20))
    };
  }
  
  res.status(statusCode).json(response);
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  sendSuccessResponse
};

