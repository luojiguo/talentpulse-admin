-- TalentPulse 数据库初始化脚本
-- PostgreSQL版本
-- 带字段注释版本

-- 创建扩展（如果需要）
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. 用户表
CREATE TABLE users (
    id SERIAL PRIMARY KEY,                -- 用户ID，自增主键
    name VARCHAR(50) NOT NULL,            -- 用户名
    email VARCHAR(100) UNIQUE NOT NULL,   -- 邮箱，唯一约束
    password VARCHAR(255) NOT NULL,       -- 密码，加密存储
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'recruiter', 'candidate')),  -- 用户角色：管理员、招聘方、求职者
    phone VARCHAR(20),                   -- 手机号
    avatar VARCHAR(255),                 -- 头像URL
    -- 个人基本信息
    gender VARCHAR(10) CHECK (gender IN ('男', '女', '其他')),  -- 性别
    birth_date DATE,                     -- 出生日期
    education VARCHAR(20),               -- 最高学历
    major VARCHAR(50),                   -- 专业
    school VARCHAR(100),                 -- 毕业院校
    graduation_year VARCHAR(10),          -- 毕业年份
    -- 职业信息
    work_experience_years INTEGER DEFAULT 0,  -- 工作经验年限
    desired_position VARCHAR(100),        -- 期望职位
    skills JSONB DEFAULT '[]'::jsonb,     -- 技能标签，JSON数组
    languages JSONB DEFAULT '[]'::jsonb,  -- 语言能力，JSON数组
    -- 联系信息
    emergency_contact VARCHAR(50),        -- 紧急联系人
    emergency_phone VARCHAR(20),          -- 紧急联系人电话
    address VARCHAR(255),                 -- 详细地址
    -- 社交信息
    wechat VARCHAR(50),                  -- 微信号
    linkedin VARCHAR(100),               -- LinkedIn账号
    github VARCHAR(100),                 -- GitHub账号
    personal_website VARCHAR(255),       -- 个人网站
    -- 身份信息
    id_card VARCHAR(18),                 -- 身份证号
    nationality VARCHAR(20),             -- 民族
    political_status VARCHAR(20),        -- 政治面貌
    marital_status VARCHAR(10) CHECK (marital_status IN ('未婚', '已婚', '离异', '丧偶')),  -- 婚姻状况
    -- 账号状态信息
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'banned', 'pending')),  -- 账号状态
    email_verified BOOLEAN DEFAULT FALSE,  -- 邮箱验证状态
    phone_verified BOOLEAN DEFAULT FALSE,  -- 手机验证状态
    resume_completeness INTEGER DEFAULT 0,  -- 简历完整度，0-100
    -- 登录信息
    last_login_at TIMESTAMP WITH TIME ZONE,  -- 最后登录时间
    last_login_ip VARCHAR(45),          -- 最后登录IP
    registration_ip VARCHAR(45),        -- 注册IP
    -- 系统字段
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,  -- 创建时间
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP   -- 更新时间
);

-- 2. 公司表
CREATE TABLE companies (
    id SERIAL PRIMARY KEY,                -- 公司ID，自增主键
    name VARCHAR(100) NOT NULL,            -- 公司名称
    industry VARCHAR(50),                 -- 所属行业
    size VARCHAR(20),                     -- 公司规模
    address VARCHAR(255),                 -- 公司地址
    description TEXT,                     -- 公司描述
    logo VARCHAR(255),                    -- 公司Logo URL
    -- 公司基本信息
    company_type VARCHAR(50),             -- 公司类型（国企、民企、外企等）
    establishment_date DATE,              -- 成立时间
    registered_capital VARCHAR(50),       -- 注册资本
    social_credit_code VARCHAR(18),       -- 统一社会信用代码
    -- 联系信息
    company_website VARCHAR(255),         -- 公司网站
    company_phone VARCHAR(20),            -- 公司电话
    company_email VARCHAR(100),           -- 公司邮箱
    -- 认证信息
    is_verified BOOLEAN DEFAULT FALSE,    -- 公司认证状态
    verification_date TIMESTAMP WITH TIME ZONE,  -- 认证时间
    -- 状态信息
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'banned')),  -- 公司状态
    -- 统计信息
    job_count INTEGER DEFAULT 0,           -- 发布职位数量
    follower_count INTEGER DEFAULT 0,      -- 关注者数量
    -- 系统字段
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,  -- 创建时间
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP   -- 更新时间
);

-- 3. 招聘方信息表
CREATE TABLE recruiters (
    id SERIAL PRIMARY KEY,                -- 招聘方ID，自增主键
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- 关联用户ID，级联删除
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,  -- 关联公司ID，级联删除
    position VARCHAR(50),                 -- 职位
    -- 招聘方详细信息
    department VARCHAR(50),               -- 所属部门
    responsibility VARCHAR(255),          -- 职责描述
    -- 认证信息
    is_verified BOOLEAN DEFAULT FALSE,    -- 认证状态
    verification_date TIMESTAMP WITH TIME ZONE,  -- 认证时间
    -- 统计信息
    posted_jobs_count INTEGER DEFAULT 0,   -- 发布职位数量
    reviewed_applications_count INTEGER DEFAULT 0,  -- 审核申请数量
    -- 系统字段
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,  -- 创建时间
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP   -- 更新时间
);

-- 4. 求职者信息表
CREATE TABLE candidates (
    id SERIAL PRIMARY KEY,                -- 求职者ID，自增主键
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- 关联用户ID，级联删除
    experience VARCHAR(20),               -- 工作经验
    city VARCHAR(50),                     -- 所在城市
    expected_salary VARCHAR(20),          -- 期望薪资
    job_status VARCHAR(20) CHECK (job_status IN ('active', 'inactive', 'hired')),  -- 求职状态：活跃、非活跃、已入职
    bio TEXT,                             -- 个人简介
    -- 求职偏好
    job_type_preference JSONB DEFAULT '[]'::jsonb,  -- 工作类型偏好，JSON数组
    work_mode_preference JSONB DEFAULT '[]'::jsonb,  -- 工作模式偏好（全职、兼职、远程等）
    industry_preference JSONB DEFAULT '[]'::jsonb,  -- 行业偏好，JSON数组
    location_preference JSONB DEFAULT '[]'::jsonb,  -- 地点偏好，JSON数组
    -- 薪资信息
    current_salary VARCHAR(20),           -- 当前薪资
    salary_negotiable BOOLEAN DEFAULT FALSE,  -- 薪资是否可谈
    -- 工作状态
    notice_period VARCHAR(20),            -- 离职通知期
    can_start_date DATE,                  -- 可入职日期
    -- 职业目标
    career_goal TEXT,                     -- 职业目标
    -- 统计信息
    applied_jobs_count INTEGER DEFAULT 0,  -- 已申请职位数量
    viewed_jobs_count INTEGER DEFAULT 0,   -- 已查看职位数量
    matched_jobs_count INTEGER DEFAULT 0,  -- 匹配职位数量
    -- 系统字段
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,  -- 创建时间
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP   -- 更新时间
);

-- 5. 职位表
CREATE TABLE jobs (
    id SERIAL PRIMARY KEY,                -- 职位ID，自增主键
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,  -- 关联公司ID，级联删除
    recruiter_id INTEGER NOT NULL REFERENCES recruiters(id) ON DELETE CASCADE,  -- 关联招聘方ID，级联删除
    title VARCHAR(100) NOT NULL,            -- 职位名称
    description TEXT NOT NULL,             -- 职位描述
    salary VARCHAR(50),                    -- 薪资范围
    location VARCHAR(50) NOT NULL,         -- 工作地点
    experience VARCHAR(20),               -- 工作经验要求
    degree VARCHAR(20),                   -- 学历要求
    type VARCHAR(20) NOT NULL CHECK (type IN ('全职', '兼职', '实习')),  -- 工作类型：全职、兼职、实习
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed')),  -- 职位状态：活跃、已关闭
    -- 职位详细信息
    department VARCHAR(50),               -- 所属部门
    work_mode VARCHAR(20) CHECK (work_mode IN ('现场', '远程', '混合')),  -- 工作模式
    job_level VARCHAR(20) CHECK (job_level IN ('初级', '中级', '高级', '管理')),  -- 职位级别
    -- 招聘需求
    hiring_count INTEGER DEFAULT 1,        -- 招聘人数
    urgency VARCHAR(20) CHECK (urgency IN ('普通', '紧急', '非常紧急')),  -- 招聘紧急程度
    -- 技能要求
    required_skills JSONB DEFAULT '[]'::jsonb,  -- 必备技能，JSON数组
    preferred_skills JSONB DEFAULT '[]'::jsonb,  -- 加分技能，JSON数组
    -- 福利待遇
    benefits JSONB DEFAULT '[]'::jsonb,    -- 福利待遇，JSON数组
    -- 发布信息
    publish_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,  -- 发布日期
    expire_date TIMESTAMP WITH TIME ZONE,  -- 过期日期
    -- 统计信息
    views_count INTEGER DEFAULT 0,          -- 浏览次数
    applications_count INTEGER DEFAULT 0,   -- 申请人数
    match_rate INTEGER DEFAULT 0,           -- 匹配率
    -- 系统字段
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,  -- 创建时间
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP   -- 更新时间
);

-- 6. 简历表
CREATE TABLE resumes (
    id SERIAL PRIMARY KEY,                -- 简历ID，自增主键
    candidate_id INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,  -- 关联求职者ID，级联删除
    -- 基本信息
    resume_title VARCHAR(100),            -- 简历标题
    is_default BOOLEAN DEFAULT FALSE,     -- 是否为默认简历
    -- 教育经历（JSON数组格式，支持多条）
    education JSONB DEFAULT '[]'::jsonb,  -- 教育经历，JSON数组
    -- 工作经历（JSON数组格式，支持多条）
    work_experience JSONB DEFAULT '[]'::jsonb,  -- 工作经历，JSON数组
    -- 项目经历（JSON数组格式，支持多条）
    projects JSONB DEFAULT '[]'::jsonb,   -- 项目经历，JSON数组
    -- 技能信息
    skills JSONB DEFAULT '[]'::jsonb,     -- 技能标签，JSON数组
    -- 证书信息（JSON数组格式，支持多个）
    certifications JSONB DEFAULT '[]'::jsonb,  -- 证书，JSON数组
    -- 语言能力（JSON数组格式，支持多种语言）
    languages JSONB DEFAULT '[]'::jsonb,  -- 语言能力，JSON数组
    -- 自我评价
    self_evaluation TEXT,                 -- 自我评价
    -- 获奖情况（JSON数组格式，支持多个）
    awards JSONB DEFAULT '[]'::jsonb,     -- 获奖情况，JSON数组
    -- 培训经历（JSON数组格式，支持多条）
    trainings JSONB DEFAULT '[]'::jsonb,  -- 培训经历，JSON数组
    -- 专利情况（JSON数组格式，支持多个）
    patents JSONB DEFAULT '[]'::jsonb,    -- 专利情况，JSON数组
    -- 论文情况（JSON数组格式，支持多篇）
    papers JSONB DEFAULT '[]'::jsonb,     -- 论文情况，JSON数组
    -- 作品集链接
    portfolio_links JSONB DEFAULT '[]'::jsonb,  -- 作品集链接，JSON数组
    -- 简历统计
    view_count INTEGER DEFAULT 0,          -- 被查看次数
    download_count INTEGER DEFAULT 0,      -- 被下载次数
    -- 简历文件
    resume_file_url VARCHAR(255),         -- 简历文件URL
    resume_file_name VARCHAR(100),        -- 简历文件名
    resume_file_size INTEGER,             -- 简历文件大小（字节）
    -- 系统字段
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,  -- 创建时间
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP   -- 更新时间
);

-- 7. 申请记录表
CREATE TABLE applications (
    id SERIAL PRIMARY KEY,                -- 申请记录ID，自增主键
    candidate_id INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,  -- 关联求职者ID，级联删除
    job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,  -- 关联职位ID，级联删除
    status VARCHAR(20) DEFAULT 'New' CHECK (status IN ('New', 'Screening', 'Interview', 'Offer', 'Rejected', 'Hired')),  -- 申请状态：新申请、筛选中、面试中、已发Offer、已拒绝、已入职
    match_score INTEGER DEFAULT 0,         -- 匹配度分数，0-100
    applied_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,  -- 申请日期
    -- 申请详情
    resume_id INTEGER REFERENCES resumes(id) ON DELETE SET NULL,  -- 关联简历ID
    cover_letter TEXT,                    -- 求职信
    -- 匹配详情
    match_details JSONB DEFAULT '{}'::jsonb,  -- 匹配详情，JSON格式
    -- 状态变更记录
    status_history JSONB DEFAULT '[]'::jsonb,  -- 状态变更历史，JSON数组
    -- 面试信息
    interview_count INTEGER DEFAULT 0,     -- 面试次数
    -- 录用信息
    offer_salary VARCHAR(20),             -- 录用薪资
    offer_benefits JSONB DEFAULT '[]'::jsonb,  -- 录用福利，JSON数组
    -- 拒绝信息
    rejection_reason TEXT,                -- 拒绝原因
    rejection_type VARCHAR(20),           -- 拒绝类型
    -- 统计信息
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,  -- 最后活动时间
    -- 系统字段
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,  -- 创建时间
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP   -- 更新时间
);

-- 8. 面试安排表
CREATE TABLE interviews (
    id SERIAL PRIMARY KEY,                -- 面试ID，自增主键
    application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,  -- 关联申请记录ID，级联删除
    interview_date DATE NOT NULL,         -- 面试日期
    interview_time TIME NOT NULL,         -- 面试时间
    location VARCHAR(255) NOT NULL,       -- 面试地点
    interviewer_id INTEGER NOT NULL REFERENCES recruiters(id) ON DELETE CASCADE,  -- 面试官ID，关联招聘方ID
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),  -- 面试状态：已安排、已完成、已取消
    notes TEXT,                           -- 面试备注
    -- 面试详情
    interview_round INTEGER DEFAULT 1,     -- 面试轮次
    interview_type VARCHAR(20) CHECK (interview_type IN ('电话', '视频', '现场')),  -- 面试类型
    interview_topic TEXT,                 -- 面试主题
    interview_duration INTEGER DEFAULT 60,  -- 面试时长（分钟）
    -- 面试官信息
    interviewer_name VARCHAR(50),         -- 面试官姓名
    interviewer_position VARCHAR(50),     -- 面试官职位
    -- 面试材料
    interview_materials JSONB DEFAULT '[]'::jsonb,  -- 面试材料，JSON数组
    -- 面试结果
    interview_result VARCHAR(20) CHECK (interview_result IN ('通过', '未通过', '待定')),  -- 面试结果
    interview_feedback TEXT,              -- 面试反馈
    -- 系统字段
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,  -- 创建时间
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP   -- 更新时间
);

-- 9. 入职安排表
CREATE TABLE onboardings (
    id SERIAL PRIMARY KEY,                -- 入职ID，自增主键
    application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,  -- 关联申请记录ID，级联删除
    onboarding_date DATE NOT NULL,        -- 入职日期
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Scheduled', 'Completed', 'Pending')),  -- 入职状态：已安排、已完成、待安排
    notes TEXT,                           -- 入职备注
    -- 入职详情
    onboarding_time TIME DEFAULT '09:00:00',  -- 入职时间
    onboarding_location VARCHAR(255),     -- 入职地点
    -- 入职联系人
    onboarding_contact VARCHAR(50),       -- 入职联系人
    onboarding_contact_phone VARCHAR(20),  -- 入职联系人电话
    -- 入职材料
    required_documents JSONB DEFAULT '[]'::jsonb,  -- 所需材料，JSON数组
    submitted_documents JSONB DEFAULT '[]'::jsonb,  -- 已提交材料，JSON数组
    -- 入职流程
    onboarding_steps JSONB DEFAULT '[]'::jsonb,  -- 入职流程，JSON数组
    completed_steps JSONB DEFAULT '[]'::jsonb,  -- 已完成流程，JSON数组
    -- 薪资信息
    official_salary VARCHAR(20),          -- 正式薪资
    probation_salary VARCHAR(20),         -- 试用期薪资
    probation_period INTEGER DEFAULT 3,    -- 试用期（月）
    -- 福利信息
    official_benefits JSONB DEFAULT '[]'::jsonb,  -- 正式福利，JSON数组
    -- 系统字段
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,  -- 创建时间
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP   -- 更新时间
);

-- 10. 对话表
CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,                -- 对话ID，自增主键
    job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,  -- 关联职位ID，级联删除
    candidate_id INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,  -- 关联求职者ID，级联删除
    recruiter_id INTEGER NOT NULL REFERENCES recruiters(id) ON DELETE CASCADE,  -- 关联招聘方ID，级联删除
    last_message VARCHAR(255),            -- 最后一条消息内容
    last_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,  -- 最后一条消息时间
    unread_count INTEGER DEFAULT 0,       -- 未读消息数
    -- 对话详情
    is_active BOOLEAN DEFAULT TRUE,        -- 对话是否活跃
    total_messages INTEGER DEFAULT 0,      -- 消息总数
    -- 未读消息统计
    candidate_unread INTEGER DEFAULT 0,    -- 求职者未读消息数
    recruiter_unread INTEGER DEFAULT 0,    -- 招聘方未读消息数
    -- 对话状态
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),  -- 对话状态
    -- 系统字段
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,  -- 创建时间
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP   -- 更新时间
);

-- 11. 消息表
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,                -- 消息ID，自增主键
    conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,  -- 关联对话ID，级联删除
    sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- 发送者ID，关联用户ID
    receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- 接收者ID，关联用户ID
    text TEXT NOT NULL,                   -- 消息内容
    type VARCHAR(20) DEFAULT 'text' CHECK (type IN ('text', 'image', 'system', 'file', 'link')),  -- 消息类型：文本、图片、系统消息、文件、链接
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read')),  -- 消息状态：已发送、已送达、已读
    time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,  -- 发送时间
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,  -- 创建时间
    -- 消息详情
    file_url VARCHAR(255),                -- 文件URL（如果是文件类型）
    file_name VARCHAR(100),               -- 文件名（如果是文件类型）
    file_size INTEGER,                    -- 文件大小（字节）
    file_type VARCHAR(50),                -- 文件类型
    -- 链接信息
    link_title VARCHAR(100),              -- 链接标题（如果是链接类型）
    link_description TEXT,                -- 链接描述（如果是链接类型）
    link_thumbnail VARCHAR(255),          -- 链接缩略图（如果是链接类型）
    -- 消息元数据
    metadata JSONB DEFAULT '{}'::jsonb,   -- 消息元数据，JSON格式
    -- 消息状态
    is_deleted BOOLEAN DEFAULT FALSE,     -- 消息是否已删除
    deleted_by INTEGER REFERENCES users(id) ON DELETE SET NULL,  -- 删除者ID
    deleted_at TIMESTAMP WITH TIME ZONE,   -- 删除时间
    -- 系统字段
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP   -- 更新时间
);

-- 12. 系统日志表
CREATE TABLE system_logs (
    id SERIAL PRIMARY KEY,                -- 日志ID，自增主键
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,  -- 操作用户ID，关联用户ID，删除时设为NULL
    action VARCHAR(100) NOT NULL,         -- 操作类型
    description TEXT,                     -- 操作描述
    ip_address VARCHAR(45),               -- 操作IP地址
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,  -- 创建时间
    -- 日志详情
    log_type VARCHAR(50) CHECK (log_type IN ('login', 'logout', 'create', 'update', 'delete', 'error', 'warning', 'info')),  -- 日志类型
    resource_type VARCHAR(50),            -- 操作资源类型
    resource_id INTEGER,                  -- 操作资源ID
    -- 请求信息
    request_method VARCHAR(10),           -- 请求方法
    request_url VARCHAR(255),             -- 请求URL
    request_params JSONB DEFAULT '{}'::jsonb,  -- 请求参数，JSON格式
    -- 响应信息
    response_status INTEGER,              -- 响应状态码
    response_time INTEGER,                -- 响应时间（毫秒）
    -- 错误信息
    error_code VARCHAR(50),               -- 错误代码
    error_message TEXT,                   -- 错误信息
    stack_trace TEXT,                     -- 堆栈跟踪
    -- 用户代理
    user_agent TEXT,                     -- 用户代理信息
    -- 设备信息
    device_type VARCHAR(20) CHECK (device_type IN ('desktop', 'mobile', 'tablet')),  -- 设备类型
    browser VARCHAR(50),                  -- 浏览器
    os VARCHAR(50),                       -- 操作系统
    -- 地理位置
    country VARCHAR(50),                  -- 国家
    region VARCHAR(50),                  -- 地区
    city VARCHAR(50),                    -- 城市
    -- 系统字段
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP   -- 更新时间
);

-- 13. AI会话表
CREATE TABLE ai_sessions (
    id SERIAL PRIMARY KEY,                -- 会话ID，自增主键
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- 关联用户ID，级联删除
    title VARCHAR(100),                   -- 会话标题
    messages JSONB DEFAULT '[]'::jsonb,   -- 会话消息，JSON格式存储数组
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,  -- 创建时间
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,  -- 更新时间
    -- 会话详情
    session_type VARCHAR(50) CHECK (session_type IN ('resume_optimization', 'interview_prep', 'career_advice', 'job_search', 'general')),  -- 会话类型
    is_active BOOLEAN DEFAULT TRUE,        -- 会话是否活跃
    total_messages INTEGER DEFAULT 0,      -- 消息总数
    -- 会话元数据
    metadata JSONB DEFAULT '{}'::jsonb,   -- 会话元数据，JSON格式
    -- 会话统计
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,  -- 最后消息时间
    session_duration INTEGER DEFAULT 0,    -- 会话时长（秒）
    -- AI模型信息
    ai_model VARCHAR(50),                 -- 使用的AI模型
    ai_prompt_template VARCHAR(255),      -- AI提示模板
    -- 会话状态
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),  -- 会话状态
    -- 会话评分
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),  -- 会话评分
    feedback TEXT,                        -- 会话反馈
    -- 会话标签
    tags JSONB DEFAULT '[]'::jsonb,       -- 会话标签，JSON数组
    -- 会话资源
    attached_resources JSONB DEFAULT '[]'::jsonb  -- 附加资源，JSON数组
);

-- 创建索引以提高查询性能

-- 用户表索引
CREATE INDEX idx_users_email ON users(email);                -- 邮箱索引，用于登录查询
CREATE INDEX idx_users_role ON users(role);                  -- 角色索引，用于权限管理

-- 公司表索引
CREATE INDEX idx_companies_name ON companies(name);          -- 公司名称索引，用于搜索
CREATE INDEX idx_companies_industry ON companies(industry);  -- 行业索引，用于筛选

-- 招聘方表索引
CREATE INDEX idx_recruiters_user_id ON recruiters(user_id);        -- 用户ID索引，用于关联查询
CREATE INDEX idx_recruiters_company_id ON recruiters(company_id);  -- 公司ID索引，用于关联查询

-- 求职者表索引
CREATE INDEX idx_candidates_user_id ON candidates(user_id);        -- 用户ID索引，用于关联查询
CREATE INDEX idx_candidates_city ON candidates(city);              -- 城市索引，用于筛选
CREATE INDEX idx_candidates_job_status ON candidates(job_status);  -- 求职状态索引，用于筛选

-- 职位表索引
CREATE INDEX idx_jobs_company_id ON jobs(company_id);          -- 公司ID索引，用于关联查询
CREATE INDEX idx_jobs_recruiter_id ON jobs(recruiter_id);      -- 招聘方ID索引，用于关联查询
CREATE INDEX idx_jobs_title ON jobs(title);                  -- 职位名称索引，用于搜索
CREATE INDEX idx_jobs_location ON jobs(location);            -- 地点索引，用于筛选
CREATE INDEX idx_jobs_status ON jobs(status);                -- 状态索引，用于筛选
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);   -- 创建时间索引，用于排序

-- 简历表索引
CREATE INDEX idx_resumes_candidate_id ON resumes(candidate_id);  -- 求职者ID索引，用于关联查询

-- 申请记录表索引
CREATE INDEX idx_applications_candidate_id ON applications(candidate_id);  -- 求职者ID索引，用于关联查询
CREATE INDEX idx_applications_job_id ON applications(job_id);          -- 职位ID索引，用于关联查询
CREATE INDEX idx_applications_status ON applications(status);          -- 状态索引，用于筛选
CREATE INDEX idx_applications_applied_date ON applications(applied_date DESC);  -- 申请日期索引，用于排序

-- 面试表索引
CREATE INDEX idx_interviews_application_id ON interviews(application_id);  -- 申请记录ID索引，用于关联查询
CREATE INDEX idx_interviews_interviewer_id ON interviews(interviewer_id);  -- 面试官ID索引，用于关联查询
CREATE INDEX idx_interviews_interview_date ON interviews(interview_date);  -- 面试日期索引，用于筛选

-- 入职表索引
CREATE INDEX idx_onboardings_application_id ON onboardings(application_id);  -- 申请记录ID索引，用于关联查询
CREATE INDEX idx_onboardings_onboarding_date ON onboardings(onboarding_date);  -- 入职日期索引，用于筛选

-- 对话表索引
CREATE INDEX idx_conversations_job_id ON conversations(job_id);          -- 职位ID索引，用于关联查询
CREATE INDEX idx_conversations_candidate_id ON conversations(candidate_id);  -- 求职者ID索引，用于关联查询
CREATE INDEX idx_conversations_recruiter_id ON conversations(recruiter_id);  -- 招聘方ID索引，用于关联查询

-- 消息表索引
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);  -- 对话ID索引，用于关联查询
CREATE INDEX idx_messages_sender_id ON messages(sender_id);          -- 发送者ID索引，用于关联查询
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);      -- 接收者ID索引，用于关联查询
CREATE INDEX idx_messages_time ON messages(time DESC);              -- 时间索引，用于排序

-- AI会话表索引
CREATE INDEX idx_ai_sessions_user_id ON ai_sessions(user_id);  -- 用户ID索引，用于关联查询

-- 系统日志表索引
CREATE INDEX idx_system_logs_user_id ON system_logs(user_id);          -- 用户ID索引，用于关联查询
CREATE INDEX idx_system_logs_created_at ON system_logs(created_at DESC);  -- 创建时间索引，用于排序

-- 创建触发器函数，用于自动更新updated_at字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;  -- 更新updated_at字段为当前时间
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为所有表添加updated_at触发器
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recruiters_updated_at
    BEFORE UPDATE ON recruiters
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_candidates_updated_at
    BEFORE UPDATE ON candidates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resumes_updated_at
    BEFORE UPDATE ON resumes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
    BEFORE UPDATE ON applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interviews_updated_at
    BEFORE UPDATE ON interviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_onboardings_updated_at
    BEFORE UPDATE ON onboardings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_sessions_updated_at
    BEFORE UPDATE ON ai_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 插入初始数据（可选）

-- 插入管理员用户
INSERT INTO users (name, email, password, role, status, email_verified, phone_verified) VALUES 
('管理员', 'admin@talentpulse.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin', 'active', true, true);

-- 插入示例公司
INSERT INTO companies (name, industry, size, address, description, status, is_verified) VALUES 
('科技有限公司', '互联网', '100-500人', '北京市朝阳区科技园', '一家专注于人工智能的科技公司', 'active', true);

-- 为所有字段添加数据库级别的注释

-- 1. 用户表字段注释
COMMENT ON COLUMN users.id IS '用户ID，自增主键';
COMMENT ON COLUMN users.name IS '用户名';
COMMENT ON COLUMN users.email IS '邮箱，唯一约束';
COMMENT ON COLUMN users.password IS '密码，加密存储';
COMMENT ON COLUMN users.role IS '用户角色：管理员、招聘方、求职者';
COMMENT ON COLUMN users.phone IS '手机号';
COMMENT ON COLUMN users.avatar IS '头像URL';
COMMENT ON COLUMN users.gender IS '性别';
COMMENT ON COLUMN users.birth_date IS '出生日期';
COMMENT ON COLUMN users.education IS '最高学历';
COMMENT ON COLUMN users.major IS '专业';
COMMENT ON COLUMN users.school IS '毕业院校';
COMMENT ON COLUMN users.graduation_year IS '毕业年份';
COMMENT ON COLUMN users.work_experience_years IS '工作经验年限';
COMMENT ON COLUMN users.desired_position IS '期望职位';
COMMENT ON COLUMN users.skills IS '技能标签，JSON数组';
COMMENT ON COLUMN users.languages IS '语言能力，JSON数组';
COMMENT ON COLUMN users.emergency_contact IS '紧急联系人';
COMMENT ON COLUMN users.emergency_phone IS '紧急联系人电话';
COMMENT ON COLUMN users.address IS '详细地址';
COMMENT ON COLUMN users.wechat IS '微信号';
COMMENT ON COLUMN users.linkedin IS 'LinkedIn账号';
COMMENT ON COLUMN users.github IS 'GitHub账号';
COMMENT ON COLUMN users.personal_website IS '个人网站';
COMMENT ON COLUMN users.id_card IS '身份证号';
COMMENT ON COLUMN users.nationality IS '民族';
COMMENT ON COLUMN users.political_status IS '政治面貌';
COMMENT ON COLUMN users.marital_status IS '婚姻状况';
COMMENT ON COLUMN users.status IS '账号状态';
COMMENT ON COLUMN users.email_verified IS '邮箱验证状态';
COMMENT ON COLUMN users.phone_verified IS '手机验证状态';
COMMENT ON COLUMN users.resume_completeness IS '简历完整度，0-100';
COMMENT ON COLUMN users.last_login_at IS '最后登录时间';
COMMENT ON COLUMN users.last_login_ip IS '最后登录IP';
COMMENT ON COLUMN users.registration_ip IS '注册IP';
COMMENT ON COLUMN users.created_at IS '创建时间';
COMMENT ON COLUMN users.updated_at IS '更新时间';

-- 2. 公司表字段注释
COMMENT ON COLUMN companies.id IS '公司ID，自增主键';
COMMENT ON COLUMN companies.name IS '公司名称';
COMMENT ON COLUMN companies.industry IS '所属行业';
COMMENT ON COLUMN companies.size IS '公司规模';
COMMENT ON COLUMN companies.address IS '公司地址';
COMMENT ON COLUMN companies.description IS '公司描述';
COMMENT ON COLUMN companies.logo IS '公司Logo URL';
COMMENT ON COLUMN companies.company_type IS '公司类型（国企、民企、外企等）';
COMMENT ON COLUMN companies.establishment_date IS '成立时间';
COMMENT ON COLUMN companies.registered_capital IS '注册资本';
COMMENT ON COLUMN companies.social_credit_code IS '统一社会信用代码';
COMMENT ON COLUMN companies.company_website IS '公司网站';
COMMENT ON COLUMN companies.company_phone IS '公司电话';
COMMENT ON COLUMN companies.company_email IS '公司邮箱';
COMMENT ON COLUMN companies.is_verified IS '公司认证状态';
COMMENT ON COLUMN companies.verification_date IS '认证时间';
COMMENT ON COLUMN companies.status IS '公司状态';
COMMENT ON COLUMN companies.job_count IS '发布职位数量';
COMMENT ON COLUMN companies.follower_count IS '关注者数量';
COMMENT ON COLUMN companies.created_at IS '创建时间';
COMMENT ON COLUMN companies.updated_at IS '更新时间';

-- 3. 招聘方信息表字段注释
COMMENT ON COLUMN recruiters.id IS '招聘方ID，自增主键';
COMMENT ON COLUMN recruiters.user_id IS '关联用户ID，级联删除';
COMMENT ON COLUMN recruiters.company_id IS '关联公司ID，级联删除';
COMMENT ON COLUMN recruiters.position IS '职位';
COMMENT ON COLUMN recruiters.department IS '所属部门';
COMMENT ON COLUMN recruiters.responsibility IS '职责描述';
COMMENT ON COLUMN recruiters.is_verified IS '认证状态';
COMMENT ON COLUMN recruiters.verification_date IS '认证时间';
COMMENT ON COLUMN recruiters.posted_jobs_count IS '发布职位数量';
COMMENT ON COLUMN recruiters.reviewed_applications_count IS '审核申请数量';
COMMENT ON COLUMN recruiters.created_at IS '创建时间';
COMMENT ON COLUMN recruiters.updated_at IS '更新时间';

-- 4. 求职者信息表字段注释
COMMENT ON COLUMN candidates.id IS '求职者ID，自增主键';
COMMENT ON COLUMN candidates.user_id IS '关联用户ID，级联删除';
COMMENT ON COLUMN candidates.experience IS '工作经验';
COMMENT ON COLUMN candidates.city IS '所在城市';
COMMENT ON COLUMN candidates.expected_salary IS '期望薪资';
COMMENT ON COLUMN candidates.job_status IS '求职状态：活跃、非活跃、已入职';
COMMENT ON COLUMN candidates.bio IS '个人简介';
COMMENT ON COLUMN candidates.job_type_preference IS '工作类型偏好，JSON数组';
COMMENT ON COLUMN candidates.work_mode_preference IS '工作模式偏好（全职、兼职、远程等）';
COMMENT ON COLUMN candidates.industry_preference IS '行业偏好，JSON数组';
COMMENT ON COLUMN candidates.location_preference IS '地点偏好，JSON数组';
COMMENT ON COLUMN candidates.current_salary IS '当前薪资';
COMMENT ON COLUMN candidates.salary_negotiable IS '薪资是否可谈';
COMMENT ON COLUMN candidates.notice_period IS '离职通知期';
COMMENT ON COLUMN candidates.can_start_date IS '可入职日期';
COMMENT ON COLUMN candidates.career_goal IS '职业目标';
COMMENT ON COLUMN candidates.applied_jobs_count IS '已申请职位数量';
COMMENT ON COLUMN candidates.viewed_jobs_count IS '已查看职位数量';
COMMENT ON COLUMN candidates.matched_jobs_count IS '匹配职位数量';
COMMENT ON COLUMN candidates.created_at IS '创建时间';
COMMENT ON COLUMN candidates.updated_at IS '更新时间';

-- 5. 职位表字段注释
COMMENT ON COLUMN jobs.id IS '职位ID，自增主键';
COMMENT ON COLUMN jobs.company_id IS '关联公司ID，级联删除';
COMMENT ON COLUMN jobs.recruiter_id IS '关联招聘方ID，级联删除';
COMMENT ON COLUMN jobs.title IS '职位名称';
COMMENT ON COLUMN jobs.description IS '职位描述';
COMMENT ON COLUMN jobs.salary IS '薪资范围';
COMMENT ON COLUMN jobs.location IS '工作地点';
COMMENT ON COLUMN jobs.experience IS '工作经验要求';
COMMENT ON COLUMN jobs.degree IS '学历要求';
COMMENT ON COLUMN jobs.type IS '工作类型：全职、兼职、实习';
COMMENT ON COLUMN jobs.status IS '职位状态：活跃、已关闭';
COMMENT ON COLUMN jobs.department IS '所属部门';
COMMENT ON COLUMN jobs.work_mode IS '工作模式';
COMMENT ON COLUMN jobs.job_level IS '职位级别';
COMMENT ON COLUMN jobs.hiring_count IS '招聘人数';
COMMENT ON COLUMN jobs.urgency IS '招聘紧急程度';
COMMENT ON COLUMN jobs.required_skills IS '必备技能，JSON数组';
COMMENT ON COLUMN jobs.preferred_skills IS '加分技能，JSON数组';
COMMENT ON COLUMN jobs.benefits IS '福利待遇，JSON数组';
COMMENT ON COLUMN jobs.publish_date IS '发布日期';
COMMENT ON COLUMN jobs.expire_date IS '过期日期';
COMMENT ON COLUMN jobs.views_count IS '浏览次数';
COMMENT ON COLUMN jobs.applications_count IS '申请人数';
COMMENT ON COLUMN jobs.match_rate IS '匹配率';
COMMENT ON COLUMN jobs.created_at IS '创建时间';
COMMENT ON COLUMN jobs.updated_at IS '更新时间';

-- 6. 简历表字段注释
COMMENT ON COLUMN resumes.id IS '简历ID，自增主键';
COMMENT ON COLUMN resumes.candidate_id IS '关联求职者ID，级联删除';
COMMENT ON COLUMN resumes.resume_title IS '简历标题';
COMMENT ON COLUMN resumes.is_default IS '是否为默认简历';
COMMENT ON COLUMN resumes.education IS '教育经历，JSON数组';
COMMENT ON COLUMN resumes.work_experience IS '工作经历，JSON数组';
COMMENT ON COLUMN resumes.projects IS '项目经历，JSON数组';
COMMENT ON COLUMN resumes.skills IS '技能标签，JSON数组';
COMMENT ON COLUMN resumes.certifications IS '证书，JSON数组';
COMMENT ON COLUMN resumes.languages IS '语言能力，JSON数组';
COMMENT ON COLUMN resumes.self_evaluation IS '自我评价';
COMMENT ON COLUMN resumes.awards IS '获奖情况，JSON数组';
COMMENT ON COLUMN resumes.trainings IS '培训经历，JSON数组';
COMMENT ON COLUMN resumes.patents IS '专利情况，JSON数组';
COMMENT ON COLUMN resumes.papers IS '论文情况，JSON数组';
COMMENT ON COLUMN resumes.portfolio_links IS '作品集链接，JSON数组';
COMMENT ON COLUMN resumes.view_count IS '被查看次数';
COMMENT ON COLUMN resumes.download_count IS '被下载次数';
COMMENT ON COLUMN resumes.resume_file_url IS '简历文件URL';
COMMENT ON COLUMN resumes.resume_file_name IS '简历文件名';
COMMENT ON COLUMN resumes.resume_file_size IS '简历文件大小（字节）';
COMMENT ON COLUMN resumes.created_at IS '创建时间';
COMMENT ON COLUMN resumes.updated_at IS '更新时间';

-- 7. 申请记录表字段注释
COMMENT ON COLUMN applications.id IS '申请记录ID，自增主键';
COMMENT ON COLUMN applications.candidate_id IS '关联求职者ID，级联删除';
COMMENT ON COLUMN applications.job_id IS '关联职位ID，级联删除';
COMMENT ON COLUMN applications.status IS '申请状态：新申请、筛选中、面试中、已发Offer、已拒绝、已入职';
COMMENT ON COLUMN applications.match_score IS '匹配度分数，0-100';
COMMENT ON COLUMN applications.applied_date IS '申请日期';
COMMENT ON COLUMN applications.resume_id IS '关联简历ID';
COMMENT ON COLUMN applications.cover_letter IS '求职信';
COMMENT ON COLUMN applications.match_details IS '匹配详情，JSON格式';
COMMENT ON COLUMN applications.status_history IS '状态变更历史，JSON数组';
COMMENT ON COLUMN applications.interview_count IS '面试次数';
COMMENT ON COLUMN applications.offer_salary IS '录用薪资';
COMMENT ON COLUMN applications.offer_benefits IS '录用福利，JSON数组';
COMMENT ON COLUMN applications.rejection_reason IS '拒绝原因';
COMMENT ON COLUMN applications.rejection_type IS '拒绝类型';
COMMENT ON COLUMN applications.last_activity_at IS '最后活动时间';
COMMENT ON COLUMN applications.created_at IS '创建时间';
COMMENT ON COLUMN applications.updated_at IS '更新时间';

-- 8. 面试安排表字段注释
COMMENT ON COLUMN interviews.id IS '面试ID，自增主键';
COMMENT ON COLUMN interviews.application_id IS '关联申请记录ID，级联删除';
COMMENT ON COLUMN interviews.interview_date IS '面试日期';
COMMENT ON COLUMN interviews.interview_time IS '面试时间';
COMMENT ON COLUMN interviews.location IS '面试地点';
COMMENT ON COLUMN interviews.interviewer_id IS '面试官ID，关联招聘方ID';
COMMENT ON COLUMN interviews.status IS '面试状态：已安排、已完成、已取消';
COMMENT ON COLUMN interviews.notes IS '面试备注';
COMMENT ON COLUMN interviews.interview_round IS '面试轮次';
COMMENT ON COLUMN interviews.interview_type IS '面试类型';
COMMENT ON COLUMN interviews.interview_topic IS '面试主题';
COMMENT ON COLUMN interviews.interview_duration IS '面试时长（分钟）';
COMMENT ON COLUMN interviews.interviewer_name IS '面试官姓名';
COMMENT ON COLUMN interviews.interviewer_position IS '面试官职位';
COMMENT ON COLUMN interviews.interview_materials IS '面试材料，JSON数组';
COMMENT ON COLUMN interviews.interview_result IS '面试结果';
COMMENT ON COLUMN interviews.interview_feedback IS '面试反馈';
COMMENT ON COLUMN interviews.created_at IS '创建时间';
COMMENT ON COLUMN interviews.updated_at IS '更新时间';

-- 9. 入职安排表字段注释
COMMENT ON COLUMN onboardings.id IS '入职ID，自增主键';
COMMENT ON COLUMN onboardings.application_id IS '关联申请记录ID，级联删除';
COMMENT ON COLUMN onboardings.onboarding_date IS '入职日期';
COMMENT ON COLUMN onboardings.status IS '入职状态：已安排、已完成、待安排';
COMMENT ON COLUMN onboardings.notes IS '入职备注';
COMMENT ON COLUMN onboardings.onboarding_time IS '入职时间';
COMMENT ON COLUMN onboardings.onboarding_location IS '入职地点';
COMMENT ON COLUMN onboardings.onboarding_contact IS '入职联系人';
COMMENT ON COLUMN onboardings.onboarding_contact_phone IS '入职联系人电话';
COMMENT ON COLUMN onboardings.required_documents IS '所需材料，JSON数组';
COMMENT ON COLUMN onboardings.submitted_documents IS '已提交材料，JSON数组';
COMMENT ON COLUMN onboardings.onboarding_steps IS '入职流程，JSON数组';
COMMENT ON COLUMN onboardings.completed_steps IS '已完成流程，JSON数组';
COMMENT ON COLUMN onboardings.official_salary IS '正式薪资';
COMMENT ON COLUMN onboardings.probation_salary IS '试用期薪资';
COMMENT ON COLUMN onboardings.probation_period IS '试用期（月）';
COMMENT ON COLUMN onboardings.official_benefits IS '正式福利，JSON数组';
COMMENT ON COLUMN onboardings.created_at IS '创建时间';
COMMENT ON COLUMN onboardings.updated_at IS '更新时间';

-- 10. 对话表字段注释
COMMENT ON COLUMN conversations.id IS '对话ID，自增主键';
COMMENT ON COLUMN conversations.job_id IS '关联职位ID，级联删除';
COMMENT ON COLUMN conversations.candidate_id IS '关联求职者ID，级联删除';
COMMENT ON COLUMN conversations.recruiter_id IS '关联招聘方ID，级联删除';
COMMENT ON COLUMN conversations.last_message IS '最后一条消息内容';
COMMENT ON COLUMN conversations.last_time IS '最后一条消息时间';
COMMENT ON COLUMN conversations.unread_count IS '未读消息数';
COMMENT ON COLUMN conversations.is_active IS '对话是否活跃';
COMMENT ON COLUMN conversations.total_messages IS '消息总数';
COMMENT ON COLUMN conversations.candidate_unread IS '求职者未读消息数';
COMMENT ON COLUMN conversations.recruiter_unread IS '招聘方未读消息数';
COMMENT ON COLUMN conversations.status IS '对话状态';
COMMENT ON COLUMN conversations.created_at IS '创建时间';
COMMENT ON COLUMN conversations.updated_at IS '更新时间';

-- 11. 消息表字段注释
COMMENT ON COLUMN messages.id IS '消息ID，自增主键';
COMMENT ON COLUMN messages.conversation_id IS '关联对话ID，级联删除';
COMMENT ON COLUMN messages.sender_id IS '发送者ID，关联用户ID';
COMMENT ON COLUMN messages.receiver_id IS '接收者ID，关联用户ID';
COMMENT ON COLUMN messages.text IS '消息内容';
COMMENT ON COLUMN messages.type IS '消息类型：文本、图片、系统消息、文件、链接';
COMMENT ON COLUMN messages.status IS '消息状态：已发送、已送达、已读';
COMMENT ON COLUMN messages.time IS '发送时间';
COMMENT ON COLUMN messages.created_at IS '创建时间';
COMMENT ON COLUMN messages.file_url IS '文件URL（如果是文件类型）';
COMMENT ON COLUMN messages.file_name IS '文件名（如果是文件类型）';
COMMENT ON COLUMN messages.file_size IS '文件大小（字节）';
COMMENT ON COLUMN messages.file_type IS '文件类型';
COMMENT ON COLUMN messages.link_title IS '链接标题（如果是链接类型）';
COMMENT ON COLUMN messages.link_description IS '链接描述（如果是链接类型）';
COMMENT ON COLUMN messages.link_thumbnail IS '链接缩略图（如果是链接类型）';
COMMENT ON COLUMN messages.metadata IS '消息元数据，JSON格式';
COMMENT ON COLUMN messages.is_deleted IS '消息是否已删除';
COMMENT ON COLUMN messages.deleted_by IS '删除者ID';
COMMENT ON COLUMN messages.deleted_at IS '删除时间';
COMMENT ON COLUMN messages.updated_at IS '更新时间';

-- 12. 系统日志表字段注释
COMMENT ON COLUMN system_logs.id IS '日志ID，自增主键';
COMMENT ON COLUMN system_logs.user_id IS '操作用户ID，关联用户ID，删除时设为NULL';
COMMENT ON COLUMN system_logs.action IS '操作类型';
COMMENT ON COLUMN system_logs.description IS '操作描述';
COMMENT ON COLUMN system_logs.ip_address IS '操作IP地址';
COMMENT ON COLUMN system_logs.created_at IS '创建时间';
COMMENT ON COLUMN system_logs.log_type IS '日志类型';
COMMENT ON COLUMN system_logs.resource_type IS '操作资源类型';
COMMENT ON COLUMN system_logs.resource_id IS '操作资源ID';
COMMENT ON COLUMN system_logs.request_method IS '请求方法';
COMMENT ON COLUMN system_logs.request_url IS '请求URL';
COMMENT ON COLUMN system_logs.request_params IS '请求参数，JSON格式';
COMMENT ON COLUMN system_logs.response_status IS '响应状态码';
COMMENT ON COLUMN system_logs.response_time IS '响应时间（毫秒）';
COMMENT ON COLUMN system_logs.error_code IS '错误代码';
COMMENT ON COLUMN system_logs.error_message IS '错误信息';
COMMENT ON COLUMN system_logs.stack_trace IS '堆栈跟踪';
COMMENT ON COLUMN system_logs.user_agent IS '用户代理信息';
COMMENT ON COLUMN system_logs.device_type IS '设备类型';
COMMENT ON COLUMN system_logs.browser IS '浏览器';
COMMENT ON COLUMN system_logs.os IS '操作系统';
COMMENT ON COLUMN system_logs.country IS '国家';
COMMENT ON COLUMN system_logs.region IS '地区';
COMMENT ON COLUMN system_logs.city IS '城市';
COMMENT ON COLUMN system_logs.updated_at IS '更新时间';

-- 13. AI会话表字段注释
COMMENT ON COLUMN ai_sessions.id IS '会话ID，自增主键';
COMMENT ON COLUMN ai_sessions.user_id IS '关联用户ID，级联删除';
COMMENT ON COLUMN ai_sessions.title IS '会话标题';
COMMENT ON COLUMN ai_sessions.messages IS '会话消息，JSON格式存储数组';
COMMENT ON COLUMN ai_sessions.created_at IS '创建时间';
COMMENT ON COLUMN ai_sessions.updated_at IS '更新时间';
COMMENT ON COLUMN ai_sessions.session_type IS '会话类型';
COMMENT ON COLUMN ai_sessions.is_active IS '会话是否活跃';
COMMENT ON COLUMN ai_sessions.total_messages IS '消息总数';
COMMENT ON COLUMN ai_sessions.metadata IS '会话元数据，JSON格式';
COMMENT ON COLUMN ai_sessions.last_message_at IS '最后消息时间';
COMMENT ON COLUMN ai_sessions.session_duration IS '会话时长（秒）';
COMMENT ON COLUMN ai_sessions.ai_model IS '使用的AI模型';
COMMENT ON COLUMN ai_sessions.ai_prompt_template IS 'AI提示模板';
COMMENT ON COLUMN ai_sessions.status IS '会话状态';
COMMENT ON COLUMN ai_sessions.rating IS '会话评分';
COMMENT ON COLUMN ai_sessions.feedback IS '会话反馈';
COMMENT ON COLUMN ai_sessions.tags IS '会话标签，JSON数组';
COMMENT ON COLUMN ai_sessions.attached_resources IS '附加资源，JSON数组';

-- 提交事务
COMMIT;

-- 输出创建结果
SELECT '数据库表创建完成！' AS result;
