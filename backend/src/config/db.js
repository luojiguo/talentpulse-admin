// 数据库连接配置
// 使用 pg 库创建连接池，管理 PostgreSQL 数据库连接
const { Pool } = require('pg');
// 加载环境变量，确保能读取 .env 文件中的数据库配置
require('dotenv').config();

// 配置连接池参数
// 配置连接池参数
// NOTE: 使用连接池而不是每次请求新建连接，是为了复用 TCP 连接，显著减少握手开销，提高并发性能
const poolConfig = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'Talent',
    password: process.env.DB_PASSWORD || '123456',
    port: process.env.DB_PORT || 5432,

    // 连接池容量设置
    // 20个连接通常足够处理并发请求，过大会消耗过多数据库资源，过小会导致请求排队
    max: parseInt(process.env.DB_POOL_MAX) || 20,
    // 保持少量最小连接数，避免完全冷启动
    min: parseInt(process.env.DB_POOL_MIN) || 5,

    // 超时设置（安全性与稳定性）
    // 防止空闲连接占用资源过久
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 60000,
    // 防止网络问题导致的无限等待
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECT_TIMEOUT) || 10000,
    // 防止慢查询拖垮数据库，强制中断超长执行的语句
    statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT) || 15000,
    // 客户端等待查询结果的最大时长
    query_timeout: parseInt(process.env.DB_QUERY_TIMEOUT) || 15000,

    // 网络稳定性设置
    keepAlive: true,            // 启用TCP KeepAlive，防止防火墙切断长空闲连接
    keepAliveInitialDelayMillis: 30000, // 连接空闲30秒后开始发送探测包
};

// 创建数据库连接池实例
const pool = new Pool(poolConfig);



// 监听连接池事件
// error 事件必须监听，否则未捕获的 idle client error 会导致 Node 进程退出
pool.on('error', (err, client) => {
    console.error('数据库连接错误:', err.message, client ? `Client ID: ${client.processID}` : 'Client: null');
});



/**
 * 执行数据库查询，封装了统一的超时控制、错误重试和日志记录
 * NOTE: 在业务代码中应尽量使用此函数而不是直接调用 pool.query
 * 
 * @param {string} text - SQL查询语句（建议使用参数化查询 $1, $2 防止注入）
 * @param {Array} params - SQL参数数组
 * @param {number} timeout - 此查询特定的超时时间（覆盖默认值）
 * @param {number} maxRetries - 遇到瞬时故障时的最大自动重试次数
 * @returns {Promise} 查询结果 Result 对象
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

            // 检查错误类型，决定是否需要重试
            // 仅对"瞬时故障"（Transient Faults）进行重试，如网络抖动、死锁、临时资源不足等
            const shouldRetry = (
                // 连接错误
                error.code === 'ECONNRESET' ||
                error.code === 'ECONNREFUSED' ||
                error.code === 'ETIMEDOUT' ||
                // PostgreSQL 连接错误
                error.code === '57P01' || // 管理员关闭数据库 (admin shutdown)
                error.code === '57P02' || // 崩溃关闭 (crash shutdown)
                error.code === '57P03' || // 此刻无法连接 (cannot connect now)
                error.code === '08006' || // 连接失败 (connection failed)
                error.code === '08001' || // 拒绝连接 (connection refused)
                // 查询超时
                error.code === '57014' || // 语句超时 (statement timeout)
                // 临时资源不足
                error.code === '53300' || // 连接数过多 (too many connections)
                error.code === '53400' || // 超出配置限制 (configuration limit exceeded)
                error.code === '53100' || // 内存不足 (insufficient memory)
                error.code === '53200'    // 磁盘空间不足 (insufficient disk space)
            );

            if (shouldRetry && retries < maxRetries) {
                retries++;
                // 指数退避 (Exponential Backoff) + 随机抖动 (Jitter)
                // 延迟时间: 2秒, 4秒, 8秒... + 随机数
                // 目的: 避免在数据库恢复瞬间产生"惊群效应" (Thundering Herd)，再次压垮数据库
                const delay = Math.pow(2, retries) * 1000 + Math.random() * 500;
                console.log(`[DB RETRY] 第 ${retries} 次重试查询，延迟 ${delay}ms，错误: ${error.message}`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }

            // 统一处理超时错误，标准化错误码
            // 将底层数据库错误转换为业务层更容易理解的错误
            if (error.code === 'ETIMEDOUT' || error.code === '57014') {
                const timeoutError = new Error('数据库查询超时，请稍后重试');
                timeoutError.statusCode = 504;
                timeoutError.errorCode = 'DATABASE_TIMEOUT';
                timeoutError.isOperational = true; // 标记为可预期错误，非程序Bug
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

            // 标记为操作错误 (Operational Error)
            // 区分：
            // 1. Operational Error: 运行时错误（如连接失败、输入非法），是可预期的
            // 2. Programmer Error: 代码Bug（如读取 undefined 属性），不可预期
            // 全局错误处理器通常根据此标记决定是否只记录日志还是需要重启进程
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