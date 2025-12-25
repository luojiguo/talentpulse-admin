// 数据库连接配置
const { Pool } = require('pg');
require('dotenv').config();

// 配置连接池参数
const poolConfig = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'Talent',
    password: process.env.DB_PASSWORD || '123456',
    port: process.env.DB_PORT || 5432,
    max: parseInt(process.env.DB_POOL_MAX) || 20,                    // 优化连接池大小，默认20
    min: parseInt(process.env.DB_POOL_MIN) || 5,                    // 保持最小连接数，默认5
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 60000,   // 延长空闲超时到60秒
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECT_TIMEOUT) || 10000, // 延长连接超时到10秒
    statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT) || 15000,  // 延长查询语句超时到15秒
    query_timeout: parseInt(process.env.DB_QUERY_TIMEOUT) || 15000,      // 延长查询超时到15秒
    keepAlive: true,            // 启用TCP保持连接
    keepAliveInitialDelayMillis: 30000, // 30秒后开始发送保持连接包
};

// 创建数据库连接池
const pool = new Pool(poolConfig);

// 监控连接池状态
setInterval(() => {
    const clientCount = pool.totalCount;
    const idleCount = pool.idleCount;
    const waitingCount = pool.waitingCount;
    
    // 仅在有连接问题或高负载时记录
    if (waitingCount > 0 || idleCount === 0 || clientCount > poolConfig.max * 0.8) {
        console.log(`[DB POOL] Total: ${clientCount}, Idle: ${idleCount}, Waiting: ${waitingCount}`);
    }
}, 30000); // 每30秒检查一次

// 监听连接池事件
pool.on('error', (err, client) => {
    console.error('数据库连接错误:', err.message, client ? `Client ID: ${client.processID}` : 'Client: null');
});

pool.on('connect', (client) => {
    console.log('数据库连接建立:', `Client ID: ${client?.processID || 'Unknown'}`);
});

pool.on('acquire', (client) => {
    console.log('数据库连接被使用:', `Client ID: ${client?.processID || 'Unknown'}`);
});

pool.on('release', (client) => {
    console.log('数据库连接被释放:', `Client ID: ${client?.processID || 'Unknown'}`);
});

/**
 * 执行数据库查询，统一处理超时和错误
 * @param {string} text - SQL查询文本
 * @param {Array} params - 查询参数
 * @param {number} timeout - 自定义超时时间（毫秒），默认15秒
 * @param {number} maxRetries - 最大重试次数，默认2次
 * @returns {Promise} 查询结果
 */
const query = async (text, params, timeout = 15000, maxRetries = 2) => {
    let retries = 0;
    let lastError = null;

    while (retries <= maxRetries) {
        try {
            const result = await pool.query({
                text,
                values: params,
                timeout: timeout
            });
            return result;
        } catch (error) {
            lastError = error;
            
            // 检查是否需要重试
            const shouldRetry = (
                // 连接错误
                error.code === 'ECONNRESET' || 
                error.code === 'ECONNREFUSED' || 
                error.code === 'ETIMEDOUT' ||
                // PostgreSQL 连接错误
                error.code === '57P01' || // admin shutdown
                error.code === '57P02' || // crash shutdown
                error.code === '57P03' || // cannot connect now
                error.code === '08006' || // connection failed
                error.code === '08001' || // connection refused
                // 查询超时
                error.code === '57014' || // statement timeout
                // 临时资源不足
                error.code === '53300' || // too many connections
                error.code === '53400' || // configuration limit exceeded
                error.code === '53100' || // insufficient memory
                error.code === '53200'    // insufficient disk space
            );

            if (shouldRetry && retries < maxRetries) {
                retries++;
                const delay = Math.pow(2, retries) * 1000 + Math.random() * 500; // 指数退避 + 随机延迟
                console.log(`[DB RETRY] 第 ${retries} 次重试查询，延迟 ${delay}ms，错误: ${error.message}`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }

            // 统一处理超时错误
            if (error.code === 'ETIMEDOUT' || error.code === '57014') {
                const timeoutError = new Error('数据库查询超时，请稍后重试');
                timeoutError.statusCode = 504;
                timeoutError.errorCode = 'DATABASE_TIMEOUT';
                timeoutError.isOperational = true;
                throw timeoutError;
            }

            // 记录数据库错误详情（开发环境）
            if (process.env.NODE_ENV === 'development') {
                console.error('数据库查询错误:', {
                    code: error.code,
                    message: error.message,
                    detail: error.detail,
                    hint: error.hint,
                    position: error.position,
                    query: text.substring(0, 200), // 只记录前200个字符
                    retries: retries
                });
            }

            // 标记为操作错误，便于统一处理
            error.isOperational = true;
            throw error;
        }
    }

    // 所有重试都失败，抛出最后一个错误
    throw lastError;
};

// 测试数据库连接
async function testConnection() {
    try {
        const client = await pool.connect();
        console.log('✅ 成功连接到PostgreSQL数据库！');
        client.release();
        return true;
    } catch (error) {
        console.error('❌ 数据库连接失败：', error.message);
        return false;
    }
}

// 导出连接池、查询函数和测试函数
module.exports = { pool, query, testConnection };