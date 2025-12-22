// 数据库连接配置
const { Pool } = require('pg');
require('dotenv').config();

// 创建数据库连接池
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'Talent',
    password: process.env.DB_PASSWORD || '123456',
    port: process.env.DB_PORT || 5432,
    max: 50,                    // 增加最大连接数到50
    idleTimeoutMillis: 30000,   // 连接空闲超时时间
    connectionTimeoutMillis: 5000, // 连接超时时间
    statement_timeout: 10000,  // 查询语句超时时间（10秒）
    query_timeout: 10000,      // 查询超时时间（10秒）
});

/**
 * 执行数据库查询，统一处理超时和错误
 * @param {string} text - SQL查询文本
 * @param {Array} params - 查询参数
 * @param {number} timeout - 自定义超时时间（毫秒），默认10秒
 * @returns {Promise} 查询结果
 */
const query = async (text, params, timeout = 10000) => {
    try {
        const result = await pool.query({
            text,
            values: params,
            timeout: timeout
        });
        return result;
    } catch (error) {
        // 统一处理超时错误
        if (error.code === 'ETIMEDOUT' || error.code === '57014') {
            const timeoutError = new Error('数据库查询超时，请稍后重试');
            timeoutError.statusCode = 504;
            timeoutError.errorCode = 'DATABASE_TIMEOUT';
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
                query: text.substring(0, 200) // 只记录前200个字符
            });
        }
        throw error;
    }
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