const { pool } = require('../config/db');

/**
 * 系统日志记录服务
 * 用于记录用户操作到system_logs表
 */

/**
 * 解析用户代理信息
 * @param {string} userAgent - 用户代理字符串
 * @returns {Object} 解析后的设备信息
 */
const parseUserAgent = (userAgent) => {
  const result = {
    browser: 'Unknown',
    os: 'Unknown',
    device_type: 'Unknown'
  };

  if (!userAgent) return result;

  // 简单的浏览器检测
  if (userAgent.includes('Chrome')) {
    result.browser = 'Chrome';
  } else if (userAgent.includes('Firefox')) {
    result.browser = 'Firefox';
  } else if (userAgent.includes('Safari')) {
    result.browser = 'Safari';
  } else if (userAgent.includes('Edge')) {
    result.browser = 'Edge';
  } else if (userAgent.includes('Opera') || userAgent.includes('OPR')) {
    result.browser = 'Opera';
  } else if (userAgent.includes('MSIE') || userAgent.includes('Trident')) {
    result.browser = 'Internet Explorer';
  }

  // 简单的操作系统检测
  if (userAgent.includes('Windows')) {
    result.os = 'Windows';
  } else if (userAgent.includes('Mac')) {
    result.os = 'macOS';
  } else if (userAgent.includes('Linux')) {
    result.os = 'Linux';
  } else if (userAgent.includes('Android')) {
    result.os = 'Android';
    result.device_type = 'mobile';
  } else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    result.os = 'iOS';
    result.device_type = 'mobile';
  }

  // 设备类型检测
  if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iOS')) {
    result.device_type = 'mobile';
  } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
    result.device_type = 'tablet';
  } else {
    result.device_type = 'desktop';
  }

  return result;
};

/**
 * 记录系统日志
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {string} action - 操作名称
 * @param {string} description - 操作描述
 * @param {string} logType - 日志类型 (login, logout, create, update, delete, error, warning, info)
 * @param {Object} resource - 资源信息 { type, id }
 */
const logAction = async (req, res, action, description, logType = 'info', resource = null) => {
  try {
    const { user } = req;
    let ipAddress = req.ip || req.connection.remoteAddress;

    // Normalize IP
    if (ipAddress === '::1') {
      ipAddress = '127.0.0.1';
    } else if (ipAddress && ipAddress.startsWith('::ffff:')) {
      ipAddress = ipAddress.replace('::ffff:', '');
    }

    const userAgent = req.headers['user-agent'] || '';
    const { browser, os, device_type } = parseUserAgent(userAgent);

    // 准备日志数据
    const logData = {
      user_id: user ? user.id : null,
      action,
      description,
      ip_address: ipAddress,
      log_type: logType,
      request_method: req.method,
      request_url: req.originalUrl,
      response_status: res.statusCode,
      user_agent: userAgent,
      browser,
      os,
      device_type,
      created_at: new Date()
    };

    // 添加资源信息
    if (resource) {
      logData.resource_type = resource.type;
      logData.resource_id = resource.id;
    }

    // 准备SQL查询
    const keys = Object.keys(logData);
    const values = Object.values(logData);
    const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');
    const columns = keys.join(', ');

    const query = `INSERT INTO system_logs (${columns}) VALUES (${placeholders})`;
    await pool.query(query, values);
  } catch (error) {
    console.error('记录系统日志失败:', error);
    // 记录日志失败不影响主流程
  }
};

/**
 * 日志记录中间件
 * 用于自动记录HTTP请求和响应
 */
const logMiddleware = (logType = 'info') => {
  return async (req, res, next) => {
    const startTime = Date.now();

    // 保存原始的res.end方法
    const originalEnd = res.end;

    res.end = async (chunk, encoding) => {
      // 计算响应时间
      const responseTime = Date.now() - startTime;

      // 调用原始的res.end方法
      originalEnd.call(res, chunk, encoding);

      // 记录日志（跳过某些特定路径，如日志查询本身）
      // 仅记录修改操作 (POST, PUT, PATCH, DELETE)，跳过读取操作 (GET, OPTIONS, HEAD)
      const isStateChangeMethod = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);

      if (isStateChangeMethod && !req.originalUrl.includes('/logs')) {
        try {
          const { user } = req;
          let ipAddress = req.ip || req.connection.remoteAddress;

          // Normalize IP
          if (ipAddress === '::1') {
            ipAddress = '127.0.0.1';
          } else if (ipAddress && ipAddress.startsWith('::ffff:')) {
            ipAddress = ipAddress.replace('::ffff:', '');
          }

          const userAgent = req.headers['user-agent'] || '';
          const { browser, os, device_type } = parseUserAgent(userAgent);

          // 准备日志数据
          const logData = {
            user_id: user ? user.id : null,
            action: `${req.method} ${req.originalUrl}`,
            description: `${req.method} 请求 ${req.originalUrl}`,
            ip_address: ipAddress,
            log_type: logType,
            request_method: req.method,
            request_url: req.originalUrl,
            response_status: res.statusCode,
            response_time: responseTime,
            user_agent: userAgent,
            browser,
            os,
            device_type,
            created_at: new Date()
          };

          // 准备SQL查询
          const keys = Object.keys(logData);
          const values = Object.values(logData);
          const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');
          const columns = keys.join(', ');

          const query = `INSERT INTO system_logs (${columns}) VALUES (${placeholders})`;
          await pool.query(query, values);
        } catch (error) {
          console.error('记录系统日志失败:', error);
          // 记录日志失败不影响主流程
        }
      }
    };

    next();
  };
};

module.exports = {
  logAction,
  logMiddleware
};
