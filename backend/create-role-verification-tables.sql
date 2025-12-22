-- 创建招聘者验证表
CREATE TABLE IF NOT EXISTS recruiter_user (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    company_id INTEGER NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    business_license VARCHAR(255),
    contact_info VARCHAR(255),
    verification_status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
    verification_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 外键约束
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    
    -- 唯一约束，确保一个用户只能有一个招聘者记录
    UNIQUE (user_id),
    
    -- 检查约束，验证状态只能是指定值
    CHECK (verification_status IN ('pending', 'approved', 'rejected'))
);

-- 创建求职者验证表
CREATE TABLE IF NOT EXISTS candidate_user (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    is_verified BOOLEAN DEFAULT TRUE, -- 求职者默认已验证
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 外键约束
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- 唯一约束，确保一个用户只能有一个求职者记录
    UNIQUE (user_id)
);

-- 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_recruiter_user_user_id ON recruiter_user(user_id);
CREATE INDEX IF NOT EXISTS idx_recruiter_user_company_id ON recruiter_user(company_id);
CREATE INDEX IF NOT EXISTS idx_recruiter_user_verification_status ON recruiter_user(verification_status);
CREATE INDEX IF NOT EXISTS idx_candidate_user_user_id ON candidate_user(user_id);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为recruiter_user表添加更新时间触发器
CREATE TRIGGER update_recruiter_user_updated_at
    BEFORE UPDATE ON recruiter_user
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 为candidate_user表添加更新时间触发器
CREATE TRIGGER update_candidate_user_updated_at
    BEFORE UPDATE ON candidate_user
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 查看创建的表结构
SELECT table_name, column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name IN ('recruiter_user', 'candidate_user')
ORDER BY table_name, ordinal_position;
