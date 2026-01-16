// 简历相关路由
const express = require('express');
const router = express.Router();
const { pool, query } = require('../config/db');
const { asyncHandler } = require('../middleware/errorHandler');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const iconv = require('iconv-lite');

// 修复中文文件名编码 - 确保中文能正确显示
function fixFilenameEncoding(filename) {
    try {
        // 确保文件名是字符串类型
        if (typeof filename !== 'string') {
            return '';
        }

        // 直接返回原始文件名，因为在中间件中已经处理了编码
        return filename;
    } catch (err) {
        // console.warn('修复文件名编码失败，使用原始文件名:', filename, err);
        return filename;
    }
}

// 生成安全的文件名 - 支持中文
function generateSafeFilename(filename) {
    // 确保filename是字符串类型
    if (typeof filename !== 'string') {
        return '未知用户';
    }
    // 移除特殊字符，保留中文、字母、数字和下划线
    const safeFilename = filename
        .trim()
        .replace(/[\s\/\\:*?"<>|]+/g, '_') // 将空格和特殊字符转换为下划线
        .replace(/_+/g, '_'); // 将连续的下划线合并为单个下划线

    // 确保返回的文件名不为空
    return safeFilename || '未知用户';
}

// 用于修复中文编码的函数
function fixChineseEncoding(text) {
    // 尝试不同的编码转换，确保中文正常显示
    try {
        // 先尝试UTF-8直接使用
        return text;
    } catch (e) {
        try {
            // 尝试GBK编码
            return iconv.decode(Buffer.from(text, 'binary'), 'gbk');
        } catch (gbkError) {
            try {
                // 尝试GB18030编码
                return iconv.decode(Buffer.from(text, 'binary'), 'gb18030');
            } catch (gb18030Error) {
                // 如果所有尝试都失败，返回原始文本
                return text;
            }
        }
    }
};

// 智能解析PDF内容，提取结构化信息
function parseResumeContent(text) {
    if (!text) return {};

    const result = {
        resume_title: '',
        education: [],
        work_experience: [],
        projects: [],
        skills: [],
        certifications: [],
        languages: [],
        self_evaluation: '',
        awards: [],
        trainings: []
    };

    // 提取姓名作为简历标题
    const lines = text.split('\n').filter(line => line.trim() !== '');
    if (lines.length > 0) {
        result.resume_title = lines[0].trim();
    }

    // 简单的结构化信息提取
    let currentSection = '';
    let currentItem = {};

    lines.forEach(line => {
        const trimmedLine = line.trim();

        // 识别不同的简历部分
        if (trimmedLine.includes('教育') || trimmedLine.includes('Education')) {
            // 如果当前有未保存的项目，添加到结果中
            if (Object.keys(currentItem).length > 0) {
                currentItem.description = currentItem.description?.trim();
                result[currentSection].push(currentItem);
            }
            currentSection = 'education';
            currentItem = {
                school: '',
                major: '',
                degree: '',
                start_date: '',
                end_date: '',
                description: ''
            };
        } else if (trimmedLine.includes('工作') || trimmedLine.includes('Experience') || trimmedLine.includes('Work')) {
            // 如果当前有未保存的项目，添加到结果中
            if (Object.keys(currentItem).length > 0) {
                currentItem.description = currentItem.description?.trim();
                result[currentSection].push(currentItem);
            }
            currentSection = 'work_experience';
            currentItem = {
                company: '',
                position: '',
                start_date: '',
                end_date: '',
                description: ''
            };
        } else if (trimmedLine.includes('项目') || trimmedLine.includes('Projects')) {
            // 如果当前有未保存的项目，添加到结果中
            if (Object.keys(currentItem).length > 0) {
                currentItem.description = currentItem.description?.trim();
                result[currentSection].push(currentItem);
            }
            currentSection = 'projects';
            currentItem = {
                name: '',
                role: '',
                start_date: '',
                end_date: '',
                description: ''
            };
        } else if (trimmedLine.includes('技能') || trimmedLine.includes('Skills')) {
            // 如果当前有未保存的项目，添加到结果中
            if (Object.keys(currentItem).length > 0) {
                currentItem.description = currentItem.description?.trim();
                result[currentSection].push(currentItem);
            }
            currentSection = 'skills';
            currentItem = {};
        } else if (trimmedLine.includes('证书') || trimmedLine.includes('Certifications')) {
            // 如果当前有未保存的项目，添加到结果中
            if (Object.keys(currentItem).length > 0) {
                currentItem.description = currentItem.description?.trim();
                result[currentSection].push(currentItem);
            }
            currentSection = 'certifications';
            currentItem = {
                name: '',
                issuing_authority: '',
                issue_date: '',
                expiry_date: '',
                certificate_number: ''
            };
        } else if (trimmedLine.includes('语言') || trimmedLine.includes('Languages')) {
            // 如果当前有未保存的项目，添加到结果中
            if (Object.keys(currentItem).length > 0) {
                currentItem.description = currentItem.description?.trim();
                result[currentSection].push(currentItem);
            }
            currentSection = 'languages';
            currentItem = {};
        } else if (trimmedLine.includes('自我评价') || trimmedLine.includes('Self') || trimmedLine.includes('Summary')) {
            // 如果当前有未保存的项目，添加到结果中
            if (Object.keys(currentItem).length > 0) {
                currentItem.description = currentItem.description?.trim();
                result[currentSection].push(currentItem);
            }
            currentSection = 'self_evaluation';
            currentItem = {};
        } else if (trimmedLine.includes('奖项') || trimmedLine.includes('Awards')) {
            // 如果当前有未保存的项目，添加到结果中
            if (Object.keys(currentItem).length > 0) {
                currentItem.description = currentItem.description?.trim();
                result[currentSection].push(currentItem);
            }
            currentSection = 'awards';
            currentItem = {
                name: '',
                issuing_organization: '',
                date: '',
                description: ''
            };
        } else if (trimmedLine.includes('培训') || trimmedLine.includes('Training')) {
            // 如果当前有未保存的项目，添加到结果中
            if (Object.keys(currentItem).length > 0) {
                currentItem.description = currentItem.description?.trim();
                result[currentSection].push(currentItem);
            }
            currentSection = 'trainings';
            currentItem = {
                name: '',
                provider: '',
                start_date: '',
                end_date: '',
                description: ''
            };
        } else if (trimmedLine) {
            // 根据当前部分处理内容
            switch (currentSection) {
                case 'skills':
                    // 技能处理
                    // 按逗号或分号分割技能
                    const skills = trimmedLine.split(/[,;，；]/).map(s => s.trim()).filter(s => s);
                    result.skills = [...result.skills, ...skills];
                    break;
                case 'languages':
                    // 语言处理
                    result.languages.push(trimmedLine);
                    break;
                case 'self_evaluation':
                    // 自我评价处理
                    result.self_evaluation += trimmedLine + '\n';
                    break;
                case 'education':
                    // 教育经历处理
                    if (!currentItem.school) {
                        currentItem.school = trimmedLine;
                    } else if (!currentItem.major) {
                        currentItem.major = trimmedLine;
                    } else {
                        // 尝试识别日期格式
                        const dateRegex = /\d{4}[-/]\d{1,2}[-/]\d{1,2}|d{4}[-/]\d{1,2}|\d{4}/;
                        const dateMatch = trimmedLine.match(dateRegex);
                        if (dateMatch) {
                            if (!currentItem.start_date) {
                                currentItem.start_date = dateMatch[0];
                            } else if (!currentItem.end_date) {
                                currentItem.end_date = dateMatch[0];
                            } else {
                                if (!currentItem.description) currentItem.description = '';
                                currentItem.description += trimmedLine + '\n';
                            }
                        } else {
                            if (!currentItem.description) currentItem.description = '';
                            currentItem.description += trimmedLine + '\n';
                        }
                    }
                    break;
                case 'work_experience':
                    // 工作经历处理
                    if (!currentItem.company) {
                        currentItem.company = trimmedLine;
                    } else if (!currentItem.position) {
                        currentItem.position = trimmedLine;
                    } else {
                        // 尝试识别日期格式
                        const dateRegex = /\d{4}[-/]\d{1,2}[-/]\d{1,2}|d{4}[-/]\d{1,2}|\d{4}/;
                        const dateMatch = trimmedLine.match(dateRegex);
                        if (dateMatch) {
                            if (!currentItem.start_date) {
                                currentItem.start_date = dateMatch[0];
                            } else if (!currentItem.end_date) {
                                currentItem.end_date = dateMatch[0];
                            } else {
                                if (!currentItem.description) currentItem.description = '';
                                currentItem.description += trimmedLine + '\n';
                            }
                        } else {
                            if (!currentItem.description) currentItem.description = '';
                            currentItem.description += trimmedLine + '\n';
                        }
                    }
                    break;
                case 'projects':
                    // 项目经验处理
                    if (!currentItem.name) {
                        currentItem.name = trimmedLine;
                    } else if (!currentItem.role) {
                        currentItem.role = trimmedLine;
                    } else {
                        // 尝试识别日期格式
                        const dateRegex = /\d{4}[-/]\d{1,2}[-/]\d{1,2}|d{4}[-/]\d{1,2}|\d{4}/;
                        const dateMatch = trimmedLine.match(dateRegex);
                        if (dateMatch) {
                            if (!currentItem.start_date) {
                                currentItem.start_date = dateMatch[0];
                            } else if (!currentItem.end_date) {
                                currentItem.end_date = dateMatch[0];
                            } else {
                                if (!currentItem.description) currentItem.description = '';
                                currentItem.description += trimmedLine + '\n';
                            }
                        } else {
                            if (!currentItem.description) currentItem.description = '';
                            currentItem.description += trimmedLine + '\n';
                        }
                    }
                    break;
                case 'certifications':
                    // 证书处理
                    if (!currentItem.name) {
                        currentItem.name = trimmedLine;
                    } else if (!currentItem.issuing_authority) {
                        currentItem.issuing_authority = trimmedLine;
                    } else {
                        // 尝试识别日期格式
                        const dateRegex = /\d{4}[-/]\d{1,2}[-/]\d{1,2}|d{4}[-/]\d{1,2}|\d{4}/;
                        const dateMatch = trimmedLine.match(dateRegex);
                        if (dateMatch) {
                            if (!currentItem.issue_date) {
                                currentItem.issue_date = dateMatch[0];
                            } else if (!currentItem.expiry_date) {
                                currentItem.expiry_date = dateMatch[0];
                            }
                        } else if (trimmedLine.includes('编号') || trimmedLine.includes('Number')) {
                            currentItem.certificate_number = trimmedLine;
                        }
                    }
                    break;
                case 'awards':
                    // 奖项处理
                    if (!currentItem.name) {
                        currentItem.name = trimmedLine;
                    } else if (!currentItem.issuing_organization) {
                        currentItem.issuing_organization = trimmedLine;
                    } else {
                        // 尝试识别日期格式
                        const dateRegex = /\d{4}[-/]\d{1,2}[-/]\d{1,2}|d{4}[-/]\d{1,2}|\d{4}/;
                        const dateMatch = trimmedLine.match(dateRegex);
                        if (dateMatch) {
                            currentItem.date = dateMatch[0];
                        } else {
                            if (!currentItem.description) currentItem.description = '';
                            currentItem.description += trimmedLine + '\n';
                        }
                    }
                    break;
                case 'trainings':
                    // 培训经历处理
                    if (!currentItem.name) {
                        currentItem.name = trimmedLine;
                    } else if (!currentItem.provider) {
                        currentItem.provider = trimmedLine;
                    } else {
                        // 尝试识别日期格式
                        const dateRegex = /\d{4}[-/]\d{1,2}[-/]\d{1,2}|d{4}[-/]\d{1,2}|\d{4}/;
                        const dateMatch = trimmedLine.match(dateRegex);
                        if (dateMatch) {
                            if (!currentItem.start_date) {
                                currentItem.start_date = dateMatch[0];
                            } else if (!currentItem.end_date) {
                                currentItem.end_date = dateMatch[0];
                            } else {
                                if (!currentItem.description) currentItem.description = '';
                                currentItem.description += trimmedLine + '\n';
                            }
                        } else {
                            if (!currentItem.description) currentItem.description = '';
                            currentItem.description += trimmedLine + '\n';
                        }
                    }
                    break;
                default:
                    break;
            }
        }
    });

    // 保存最后一个项目
    if (currentSection && Object.keys(currentItem).length > 0 && !['skills', 'languages', 'self_evaluation'].includes(currentSection)) {
        currentItem.description = currentItem.description?.trim();
        result[currentSection].push(currentItem);
    }

    // 清理和格式化数据
    result.self_evaluation = result.self_evaluation.trim();

    // 去重技能
    result.skills = [...new Set(result.skills)];

    // 确保所有字段都是正确的格式
    result.education = Array.isArray(result.education) ? result.education : [];
    result.work_experience = Array.isArray(result.work_experience) ? result.work_experience : [];
    result.projects = Array.isArray(result.projects) ? result.projects : [];
    result.skills = Array.isArray(result.skills) ? result.skills : [];
    result.certifications = Array.isArray(result.certifications) ? result.certifications : [];
    result.languages = Array.isArray(result.languages) ? result.languages : [];
    result.awards = Array.isArray(result.awards) ? result.awards : [];
    result.trainings = Array.isArray(result.trainings) ? result.trainings : [];

    return result;
};

// 配置简历存储根路径 - 使用正确的相对路径，确保指向项目根目录下的Front_End目录
// 当前文件位置: backend/src/routes/resumeRoutes.js
// 目标位置: talentpulse-admin/Front_End/public/User_Resume
const resumesRootDir = path.resolve(__dirname, '../../../Front_End/public/User_Resume');

console.log('=== 简历存储配置 ===');
console.log('resumesRootDir:', resumesRootDir);
console.log('resumesRootDir exists:', fs.existsSync(resumesRootDir));

// 确保根目录存在
if (!fs.existsSync(resumesRootDir)) {
    // console.log('创建根目录:', resumesRootDir);
    fs.mkdirSync(resumesRootDir, { recursive: true });
    // console.log('根目录创建成功:', fs.existsSync(resumesRootDir));
}

// 配置multer存储 - 先临时存储，后续重命名
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // 确保临时存储目录存在
        if (!fs.existsSync(resumesRootDir)) {
            fs.mkdirSync(resumesRootDir, { recursive: true });
        }
        cb(null, resumesRootDir);
    },
    filename: (req, file, cb) => {
        // 生成安全的临时文件名，不包含原始文件名
        const extname = path.extname(file.originalname);
        const safeFilename = `temp_${Date.now()}_${Math.floor(Math.random() * 10000)}${extname}`;
        cb(null, safeFilename);
    }
});

// 修复中文文件名乱码的中间件
const fixChineseFilenameMiddleware = (req, res, next) => {
    if (req.file) {
        // console.log('=== 原始文件名中间件 ===');
        // console.log('原始文件名:', req.file.originalname);

        // 修复原始文件名的中文编码
        // 使用iconv-lite直接解码，处理multer可能的编码问题
        try {
            // 尝试将文件名从binary转换为utf-8
            req.file.originalname = iconv.decode(Buffer.from(req.file.originalname, 'binary'), 'utf-8');

        } catch (err) {
            // console.warn('UTF-8解码失败，尝试GBK:', err);
            try {
                // 如果utf-8失败，尝试GBK
                req.file.originalname = iconv.decode(Buffer.from(req.file.originalname, 'binary'), 'gbk');
                // console.log('修复后文件名(gbk):', req.file.originalname);
            } catch (gbkErr) {
                // console.warn('GBK解码失败，使用原始文件名:', gbkErr);
            }
        }
    }
    next();
};

// 创建multer实例
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 15 * 1024 * 1024 // 限制文件大小为15MB
    },
    fileFilter: (req, file, cb) => {
        // 允许上传的文件类型
        const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.jpg', '.jpeg', '.png', '.bmp'];
        const allowedMimeTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'application/rtf',
            'image/jpeg',
            'image/png',
            'image/bmp',
            'image/jpg'
        ];

        const extname = path.extname(file.originalname).toLowerCase();
        const isAllowedExt = allowedExtensions.includes(extname);
        const isAllowedMime = allowedMimeTypes.includes(file.mimetype.toLowerCase());

        if (isAllowedExt && isAllowedMime) {
            return cb(null, true);
        } else {
            cb(new Error('只允许上传 PDF, Word, TXT, RTF 或图片文件'));
        }
    }
});

// 获取用户的简历列表
router.get('/user/:userId', asyncHandler(async (req, res) => {
    const { userId } = req.params;

    // 1. 获取 candidate_id
    const candidateResult = await query(
        'SELECT id FROM candidates WHERE user_id = $1',
        [userId]
    );

    if (candidateResult.rows.length === 0) {
        return res.json({
            status: 'success',
            data: [] // 如果不是候选人或没有候选人记录，返回空列表
        });
    }

    const candidateId = candidateResult.rows[0].id;

    // 2. 获取简历列表
    const resumesResult = await query(
        'SELECT * FROM resumes WHERE candidate_id = $1 ORDER BY created_at DESC',
        [candidateId]
    );

    // 处理返回的resumes数据，确保jsonb字段正确转换为JavaScript对象
    const processedResumes = resumesResult.rows.map(resume => {
        // 处理各个jsonb字段，确保它们是JavaScript对象而不是字符串
        return {
            ...resume,
            education: resume.education || [],
            work_experience: resume.work_experience || [],
            projects: resume.projects || [],
            skills: resume.skills || [],
            certifications: resume.certifications || [],
            languages: resume.languages || [],
            awards: resume.awards || [],
            trainings: resume.trainings || [],
            patents: resume.patents || [],
            papers: resume.papers || [],
            portfolio_links: resume.portfolio_links || []
        };
    });

    res.json({
        status: 'success',
        data: processedResumes
    });
}));

// 解析简历 (不保存)
router.post('/parse', upload.single('resume'), asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new Error('请选择要上传的文件');
    }

    try {
        const extname = path.extname(req.file.originalname).toLowerCase();
        const fileType = extname.substring(1);
        let parsedData = {};
        let parsedContent = null;

        if (fileType === 'pdf') {
            try {
                const pdfBuffer = fs.readFileSync(req.file.path);
                const pdfData = await pdfParse(pdfBuffer);
                parsedContent = fixChineseEncoding(pdfData.text);
                parsedData = parseResumeContent(parsedContent);
            } catch (err) {
                console.error('PDF解析失败', err);
            }
        }

        res.json({
            status: 'success',
            message: '解析成功',
            data: {
                parsed_data: parsedData,
                parsed_content: parsedContent
            }
        });
    } finally {
        // 清理临时文件
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (e) {
                console.error('清理临时文件失败', e);
            }
        }
    }
}));

// 上传简历
router.post('/upload', upload.single('resume'), fixChineseFilenameMiddleware, asyncHandler(async (req, res) => {
    if (!req.file) {
        const error = new Error('请选择要上传的文件');
        error.statusCode = 400;
        throw error;
    }

    try {
        const { user_id } = req.body;

        if (!user_id) {
            const error = new Error('缺少用户ID');
            error.statusCode = 400;
            throw error;
        }

        // 1. 获取用户信息
        // 添加详细的调试日志
        console.log('=== 数据库查询调试 ===');
        console.log('查询SQL:', 'SELECT id, name, email FROM users WHERE id = $1');
        console.log('查询参数:', [user_id]);

        const userResult = await query(
            'SELECT id, name, email FROM users WHERE id = $1',
            [user_id]
        );


        if (userResult.rows.length === 0) {
            const error = new Error('用户不存在');
            error.statusCode = 404;
            throw error;
        }

        // 获取用户行数据
        const userRow = userResult.rows[0];
        // 获取用户名，确保它是字符串类型
        const userName = String(userRow.name || '');

        // 修复用户名，确保不包含特殊字符，支持中文
        const cleanUserName = userName.trim() || '未知用户';
        console.log('用户名 (清理后):', cleanUserName);

        // 生成安全的用户名，支持中文
        // 注意：generateSafeFilename 已经支持中文，这里不需要额外处理
        const safeUserName = generateSafeFilename(cleanUserName);
        console.log('用户名 (安全):', safeUserName);

        // 处理安全用户名可能为空的情况
        const finalUserName = safeUserName || '未知用户';
        console.log('用户名 (最终):', finalUserName);

        // 创建用户文件夹：用户ID_用户名，确保格式正确，支持中文
        // 确保中文用户名能正确显示
        const userFolderName = `${user_id}_${finalUserName}`;
        console.log('用户文件夹名称:', userFolderName);

        // 调试：检查文件夹名称的编码
        console.log('用户文件夹名称 (UTF-8编码):', Buffer.from(userFolderName).toString('utf-8'));

        const userFolderPath = path.join(resumesRootDir, userFolderName);

        // console.log('=== 文件夹创建逻辑 ===');
        // console.log('用户文件夹名称:', userFolderName);
        // console.log('用户文件夹路径:', userFolderPath);

        // 确保用户文件夹存在
        if (!fs.existsSync(userFolderPath)) {
            // console.log('文件夹不存在，开始创建...');
            try {
                fs.mkdirSync(userFolderPath, { recursive: true });
                // console.log('文件夹创建成功:', userFolderPath);
            } catch (error) {
                // console.error('文件夹创建失败:', error);
                throw new Error('创建用户文件夹失败: ' + error.message);
            }
        } else {
            // console.log('文件夹已存在:', userFolderPath);
        }

        const extname = path.extname(req.file.originalname);
        const fileType = extname.substring(1); // 去掉点号，如 pdf, docx
        const timestamp = Date.now();

        // 修复中文文件名乱码，生成安全的文件名
        const originalName = req.file.originalname.replace(extname, '');
        const safeOriginalName = generateSafeFilename(originalName);

        // 生成新文件名，使用安全名称+时间戳的格式
        const newFilename = `${safeOriginalName}_${timestamp}${extname}`;
        const newFilePath = path.join(userFolderPath, newFilename);

        // console.log('=== 文件保存逻辑 ===');
        // console.log('源文件路径:', req.file.path);
        // console.log('目标文件路径:', newFilePath);

        // 检查源文件是否存在
        if (!fs.existsSync(req.file.path)) {
            // console.error('源文件不存在:', req.file.path);
            throw new Error('源文件不存在');
        } else {
            // console.log('源文件存在，准备保存...');

            try {
                // 使用fs.renameSync进行文件重命名，Node.js v14+已经支持中文路径
                fs.renameSync(req.file.path, newFilePath);
                // console.log('文件保存成功');

                // 检查目标文件是否存在
                if (fs.existsSync(newFilePath)) {
                    // console.log('目标文件已存在:', newFilePath);
                } else {
                    // console.error('目标文件不存在，保存失败');
                    throw new Error('保存文件失败: 目标文件不存在');
                }
            } catch (error) {
                // console.error('文件保存失败:', error);
                throw new Error('保存文件失败: ' + error.message);
            }
        }

        // 3. 获取或创建 candidate_id
        let candidateId;
        const candidateResult = await query(
            'SELECT id FROM candidates WHERE user_id = $1',
            [user_id]
        );

        if (candidateResult.rows.length > 0) {
            candidateId = candidateResult.rows[0].id;
        } else {
            // 如果没有候选人记录，创建一个
            const newCandidate = await query(
                'INSERT INTO candidates (user_id) VALUES ($1) RETURNING id',
                [user_id]
            );
            candidateId = newCandidate.rows[0].id;
        }
        // fs.appendFileSync('upload_debug.log', `[${new Date().toISOString()}] Candidate ID: ${candidateId}\n`);

        // 4. 解析PDF文件内容（如果是PDF文件）
        let parsedContent = null;
        let parsedData = {};
        if (fileType.toLowerCase() === 'pdf') {
            try {
                // 读取文件内容
                const pdfBuffer = fs.readFileSync(newFilePath);

                // 解析PDF
                const pdfData = await pdfParse(pdfBuffer);

                // 修复中文编码
                parsedContent = fixChineseEncoding(pdfData.text);

                // 智能解析结构化信息
                parsedData = parseResumeContent(parsedContent);
            } catch (parseError) {
                // console.error('PDF解析失败:', parseError);
                // 解析失败不影响上传，继续执行
            }
        }

        // 5. 保存简历记录
        const fileUrl = `/User_Resume/${userFolderName}/${newFilename}`;
        const originalFileName = req.file.originalname;
        const fileSize = req.file.size;

        const insertResult = await query(
            `INSERT INTO resumes (
          candidate_id, resume_title, resume_file_url, resume_file_name, resume_file_size, is_default
        ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [candidateId, originalFileName, fileUrl, originalFileName, fileSize, false]
        );

        const resumeData = insertResult.rows[0];

        // 6. 返回结果，包含解析后的内容（如果有）
        res.json({
            status: 'success',
            message: '简历上传成功',
            data: {
                ...resumeData,
                parsed_content: parsedContent, // 包含原始解析文本
                parsed_data: parsedData // 包含结构化解析数据
            }
        });
    } catch (error) {
        // fs.appendFileSync('upload_debug.log', `[${new Date().toISOString()}] Upload ERROR: ${error.stack}\n`);
        // 删除已上传的文件
        if (req.file) {
            try {
                if (fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                }
            } catch (e) {
                console.error('清理临时文件失败:', e);
            }
        }
        throw error;
    }
}));

// 删除简历
router.delete('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;

    // 1. 获取简历信息以删除文件
    const resumeResult = await query('SELECT * FROM resumes WHERE id = $1', [id]);

    if (resumeResult.rows.length === 0) {
        const error = new Error('简历不存在');
        error.statusCode = 404;
        throw error;
    }

    const resume = resumeResult.rows[0];

    // 2. 删除数据库记录
    await query('DELETE FROM resumes WHERE id = $1', [id]);

    // 3. 删除文件
    if (resume.resume_file_url) {
        // 解析文件路径，直接从根目录删除，不再包含用户子目录
        const fullPath = path.join(resumesRootDir, resume.resume_file_url.replace('/User_Resume/', ''));
        if (fs.existsSync(fullPath)) {
            try {
                fs.unlinkSync(fullPath);
            } catch (e) {
                // console.error('删除简历文件失败:', e);
            }
        }
    }

    res.json({
        status: 'success',
        message: '简历删除成功'
    });
}));

// 查看或下载简历文件
router.get('/file/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { view } = req.query;

    try {
        console.log('=== 简历文件下载请求开始 ===');
        console.log('请求ID:', id);
        console.log('请求参数:', req.query);

        // 1. 获取简历信息
        const resumeResult = await query('SELECT * FROM resumes WHERE id = $1', [id]);

        console.log('数据库查询结果:', resumeResult);
        console.log('结果行数:', resumeResult.rows.length);

        if (resumeResult.rows.length === 0) {
            const error = new Error('简历不存在');
            error.statusCode = 404;
            throw error;
        }

        const resume = resumeResult.rows[0];
        console.log('简历信息:', resume);
        console.log('resume_file_url:', resume.resume_file_url);

        // 2. 构建文件路径
        let filePath;
        if (resume.resume_file_url) {
            // 替换 /User_Resume/ 前缀，得到相对路径
            const relativePath = resume.resume_file_url.replace('/User_Resume/', '');
            // console.log('相对路径:', relativePath);

            // 构建完整文件路径
            filePath = path.join(resumesRootDir, relativePath);
            // console.log('完整文件路径:', filePath);
        } else {
            throw new Error('简历文件URL不存在');
        }

        if (!fs.existsSync(filePath)) {
            console.error('文件不存在:', filePath);
            const error = new Error('文件不存在');
            error.statusCode = 404;
            throw error;
        }

        // 获取原始文件名，处理编码问题
        let originalFilename = resume.resume_file_name || 'resume';
        if (originalFilename) {
            try {
                if (/%[0-9A-Fa-f]{2}/.test(originalFilename)) {
                    originalFilename = decodeURIComponent(originalFilename);
                }
            } catch (e) {
                console.warn('简历文件名解码失败:', e.message);
            }
        }

        // 获取文件扩展名
        const ext = path.extname(originalFilename) || '.pdf';
        const baseName = path.basename(originalFilename, ext);
        const safeFilename = `${baseName}${ext}`;

        // 3. 根据view参数决定是查看还是下载
        if (view === 'true') {
            // 在线查看 - 设置正确的Content-Type
            res.setHeader('Content-Type', resume.resume_file_type || 'application/octet-stream');
            res.sendFile(filePath);
        } else {
            // 下载 - 修复中文文件名编码问题
            // 只使用 RFC 5987 编码格式，不使用原始文件名，避免 HTTP 头字符错误
            const encodedFilename = encodeURIComponent(safeFilename).replace(/['()]/g, escape);

            // 只设置 filename* 格式，不使用 filename="${safeFilename}" 格式，避免无效字符
            res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`);
            res.setHeader('Content-Type', resume.resume_file_type || 'application/octet-stream');

            res.download(filePath, safeFilename);
        }

        // console.log('=== 简历文件下载请求结束 ===');
    } catch (error) {
        // console.error('=== 简历文件下载错误 ===');
        // console.error('错误类型:', error.name);
        // console.error('错误信息:', error.message);
        // console.error('错误堆栈:', error.stack);
        throw error;
    }
}));

// 保存在线编辑的简历
router.post('/save', asyncHandler(async (req, res) => {
    const { userId, resumeId, resume_data } = req.body;

    if (!userId || !resume_data) {
        const error = new Error('缺少必要参数');
        error.statusCode = 400;
        throw error;
    }

    // 1. 获取 candidate_id
    let candidateResult = await query(
        'SELECT id FROM candidates WHERE user_id = $1',
        [userId]
    );

    let candidateId;
    if (candidateResult.rows.length === 0) {
        // 如果没有候选人记录，创建一个
        const newCandidate = await query(
            'INSERT INTO candidates (user_id) VALUES ($1) RETURNING id',
            [userId]
        );
        candidateId = newCandidate.rows[0].id;
    } else {
        candidateId = candidateResult.rows[0].id;
    }

    // 2. 确保resume_data是正确的对象格式
    let processedResumeData = resume_data;
    if (typeof resume_data === 'string') {
        try {
            processedResumeData = JSON.parse(resume_data);
        } catch (e) {
            const error = new Error('无效的JSON格式，请检查提交的数据');
            error.statusCode = 400;
            throw error;
        }
    }

    // 确保processedResumeData是一个对象
    if (typeof processedResumeData !== 'object' || processedResumeData === null) {
        processedResumeData = {};
    }

    // 3. 从processedResumeData中提取各个字段，确保它们是正确的格式
    const resume_title = processedResumeData.resume_title || '';
    const is_default = processedResumeData.is_default || false;
    const self_evaluation = processedResumeData.self_evaluation || '';

    // 处理JSONB字段，确保它们是正确的格式
    const education = processedResumeData.education || [];
    const work_experience = processedResumeData.work_experience || [];
    const projects = processedResumeData.projects || [];
    const skills = processedResumeData.skills || [];
    const certifications = processedResumeData.certifications || [];
    const languages = processedResumeData.languages || [];
    const awards = processedResumeData.awards || [];
    const trainings = processedResumeData.trainings || [];
    const patents = processedResumeData.patents || [];
    const portfolio_links = processedResumeData.portfolio_links || [];

    let result;
    if (resumeId) {
        // 更新现有简历
        result = await query(
            `UPDATE resumes SET 
                resume_title = $1, 
                is_default = $2, 
                education = $3, 
                work_experience = $4, 
                projects = $5, 
                skills = $6, 
                certifications = $7, 
                languages = $8, 
                self_evaluation = $9, 
                awards = $10, 
                trainings = $11,
                patents = $12,
                portfolio_links = $13,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $14 AND candidate_id = $15
            RETURNING *`,
            [
                resume_title,
                is_default,
                JSON.stringify(education),
                JSON.stringify(work_experience),
                JSON.stringify(projects),
                JSON.stringify(skills),
                JSON.stringify(certifications),
                JSON.stringify(languages),
                self_evaluation,
                JSON.stringify(awards),
                JSON.stringify(trainings),
                JSON.stringify(patents),
                JSON.stringify(portfolio_links),
                resumeId,
                candidateId
            ]
        );

        if (result.rows.length === 0) {
            const error = new Error('简历不存在或不属于该用户');
            error.statusCode = 404;
            throw error;
        }

    } else {
        // 创建新简历
        result = await query(
            `INSERT INTO resumes (
                candidate_id, resume_title, is_default, education, work_experience, projects, 
                skills, certifications, languages, self_evaluation, awards, trainings, 
                patents, portfolio_links, created_at, updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 
                CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            ) RETURNING *`,
            [
                candidateId,
                resume_title,
                is_default,
                JSON.stringify(education),
                JSON.stringify(work_experience),
                JSON.stringify(projects),
                JSON.stringify(skills),
                JSON.stringify(certifications),
                JSON.stringify(languages),
                self_evaluation,
                JSON.stringify(awards),
                JSON.stringify(trainings),
                JSON.stringify(patents),
                JSON.stringify(portfolio_links)
            ]
        );
    }

    // 如果设置为默认简历，取消其他默认简历
    if (is_default) {
        await query(
            'UPDATE resumes SET is_default = false WHERE candidate_id = $1 AND id != $2',
            [candidateId, result.rows[0].id]
        );
    }

    // 返回处理后的数据（转回对象格式）
    const savedResume = result.rows[0];
    res.json({
        status: 'success',
        message: '简历保存成功',
        data: {
            ...savedResume,
            education: savedResume.education || [],
            work_experience: savedResume.work_experience || [],
            projects: savedResume.projects || [],
            skills: savedResume.skills || [],
            certifications: savedResume.certifications || [],
            languages: savedResume.languages || [],
            awards: savedResume.awards || [],
            trainings: savedResume.trainings || [],
            patents: savedResume.patents || [],
            portfolio_links: savedResume.portfolio_links || []
        }
    });
}));

module.exports = router;
