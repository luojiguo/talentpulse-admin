// 主服务器文件
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// 导入数据库配置
const { pool, testConnection } = require('./config/db');

// 导入错误处理中间件
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// 导入日志中间件
const { logMiddleware } = require('./middleware/logger');

// 创建Express应用
const app = express();

// 配置中间件
// 请求计时中间件
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        if (duration > 500) { // 只记录超过500ms的请求
            console.log(`[PERF] ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
        }
    });
    next();
});

// 启用Helmet安全中间件
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false // 如果CSP导致问题，可以禁用或配置
}));

// 启用Gzip压缩
app.use(compression());

// Enable CORS - 使用环境变量配置
const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : ['http://localhost:3000', 'http://127.0.0.1:3000'];

app.use(cors({
    origin: (origin, callback) => {
        // 允许没有origin的请求（如移动应用、Postman等）
        // 临时放开CORS限制，允许任何来源，解决前端访问问题
        if (!origin || true) {
            callback(null, true);
        } else {
            callback(new Error('不允许的CORS来源'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// 仅对非multipart/form-data请求使用JSON解析
app.use((req, res, next) => {
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('multipart/form-data')) {
        express.json()(req, res, next);
    } else {
        next();
    }
});

app.use(express.urlencoded({ extended: true })); // 解析URL编码请求

const path = require('path');
// 配置静态文件服务，用于访问上传的头像
// 配置静态文件服务，用于访问上传的头像
app.use('/avatars', express.static(path.join(__dirname, '../../Front_End/public/avatars'), { maxAge: '7d' }));
// 配置静态文件服务，用于访问上传的消息图片和文件
app.use('/uploads', express.static(path.join(__dirname, '../../Front_End/public/uploads'), { maxAge: '7d' }));
// 配置静态文件服务，用于访问上传的营业执照
app.use('/business_license', express.static(path.join(__dirname, '../../Front_End/public/business_license'), { maxAge: '7d' }));
// 配置静态文件服务，用于访问上传的公司Logo
app.use('/companies_logo', express.static(path.join(__dirname, '../../Front_End/public/companies_logo'), { maxAge: '7d' }));
// 配置静态文件服务，用于访问上传的简历
app.use('/User_Resume', express.static(path.join(__dirname, '../../Front_End/public/User_Resume'), { maxAge: '1d' }));

// 检查上传目录权限
const checkDirectoryPermissions = () => {
    const fs = require('fs');
    const directories = [
        path.join(__dirname, '../../Front_End/public/avatars'),
        path.join(__dirname, '../../Front_End/public/uploads'),
        path.join(__dirname, '../../Front_End/public/business_license'),
        path.join(__dirname, '../../Front_End/public/companies_logo'),
        path.join(__dirname, '../../Front_End/public/User_Resume')
    ];

    directories.forEach(dir => {
        try {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`✅ 创建目录: ${dir}`);
            }

            // 测试写入权限
            const testFile = path.join(dir, '.write_test');
            fs.writeFileSync(testFile, 'test');
            fs.unlinkSync(testFile);
            console.log(`✅ 目录权限正常: ${path.basename(dir)}`);
        } catch (error) {
            console.error(`❌ 目录权限检查失败: ${dir}`, error.message);
            throw new Error(`目录权限不足: ${dir}`);
        }
    });
};

// 执行目录权限检查
try {
    checkDirectoryPermissions();
    console.log('📁 所有上传目录权限检查通过');
} catch (error) {
    console.error('⚠️  目录权限检查失败，服务器可能无法正常保存上传文件');
}

// 配置请求速率限制 - 根据环境设置不同的限制
const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'dev';
console.log(`当前环境: ${process.env.NODE_ENV}, 开发环境: ${isDevelopment}`);

// 优化速率限制配置
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: isDevelopment ? 50000 : 5000, // 开发环境50000次，生产环境5000次，大幅增加阈值
    standardHeaders: true,
    legacyHeaders: false,
    // 返回JSON格式的错误响应
    handler: (req, res, next, options) => {
        res.status(options.statusCode).json({
            status: 'error',
            errorCode: 'RATE_LIMIT_EXCEEDED',
            message: '请求过于频繁，请稍后再试',
            retryAfter: options.retryAfter,
            currentWindow: options.windowMs,
            limit: options.max
        });
    }
});

// 仅对API路由应用速率限制，排除健康检查和根路径
app.use(['/api'], limiter);

// 应用日志记录中间件
app.use(['/api'], logMiddleware('info'));

// 测试路由
app.get('/', (req, res) => {
    res.json({
        message: 'TalentPulse API 服务器正在运行',
        version: '1.0.0',
        status: 'success',
        timestamp: new Date().toISOString()
    });
});

// 健康检查路由
app.get('/health', async (req, res) => {
    const dbConnected = await testConnection();
    res.json({
        status: dbConnected ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        database: dbConnected ? 'connected' : 'disconnected',
        server: 'running'
    });
});

// 导入路由
const userRoutes = require('./routes/userRoutes');
const jobRoutes = require('./routes/jobRoutes');
const companyRoutes = require('./routes/companyRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const candidateRoutes = require('./routes/candidateRoutes');
const activityRoutes = require('./routes/activityRoutes');
const aiSessionRoutes = require('./routes/aiSessionRoutes');
const resumeRoutes = require('./routes/resumeRoutes');
const recruiterRoutes = require('./routes/recruiterRoutes');
const messageRoutes = require('./routes/messageRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
// const aiRoutes = require('./routes/aiRoutes'); // AI诊断功能已移除

const configRoutes = require('./routes/configRoutes');

// 使用路由
app.use('/api/config', configRoutes);
// app.use('/api/ai', aiRoutes); // AI诊断功能已移除
app.use('/api/users', userRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/ai-sessions', aiSessionRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/recruiter', recruiterRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/certification', require('./routes/certificationRoutes'));
app.use('/api/onboardings', require('./routes/onboardingRoutes'));

// 专门处理body-parser解析错误的中间件
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        err.statusCode = 400;
        err.errorCode = 'INVALID_JSON';
        err.message = '请求格式错误，请检查请求体是否为有效的JSON格式';
        err.isOperational = true; // 标记为操作错误，返回400而不是500
        return next(err);
    }
    next(err);
});

// 404路由处理 - 必须在所有路由之后
app.use(notFoundHandler);

// 统一错误处理中间件 - 必须在最后
app.use(errorHandler);

// 启动服务器
const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, async () => {
    console.log(`🚀 TalentPulse API 服务器正在运行在 http://localhost:${PORT}`);
    console.log(`📡 健康检查: http://localhost:${PORT}/health`);
    console.log(`🌐 API文档: http://localhost:${PORT}/`);

    // 初始化 Socket.IO
    const { initSocket } = require('./services/socketService');
    try {
        initSocket(server);
        console.log('🔌 Socket.IO 服务已启动');
    } catch (error) {
        console.error('Socket.IO 初始化失败:', error);
    }

    // 测试数据库连接
    await testConnection();
});

// 导出app用于测试
module.exports = app;
