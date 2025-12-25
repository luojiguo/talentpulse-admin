-- 为求职者相关表添加必要的索引
-- 执行命令: psql -d Talent -U postgres -f add_indexes.sql

-- 1. candidates 表索引
-- 为 user_id 添加唯一索引，因为每个用户只能有一个求职者资料
CREATE UNIQUE INDEX IF NOT EXISTS idx_candidates_user_id ON candidates(user_id);
-- 为 created_at 添加索引，用于按创建时间排序
CREATE INDEX IF NOT EXISTS idx_candidates_created_at ON candidates(created_at DESC);

-- 2. saved_jobs 表索引
-- 为 user_id 和 job_id 添加复合唯一索引，防止重复收藏
CREATE UNIQUE INDEX IF NOT EXISTS idx_saved_jobs_user_job ON saved_jobs(user_id, job_id);
-- 为 user_id 添加索引，用于快速查询用户的收藏职位
CREATE INDEX IF NOT EXISTS idx_saved_jobs_user_id ON saved_jobs(user_id);
-- 为 job_id 添加索引，用于快速查询职位被哪些用户收藏
CREATE INDEX IF NOT EXISTS idx_saved_jobs_job_id ON saved_jobs(job_id);
-- 为 created_at 添加索引，用于按收藏时间排序
CREATE INDEX IF NOT EXISTS idx_saved_jobs_created_at ON saved_jobs(created_at DESC);

-- 3. saved_companies 表索引
-- 为 user_id 和 company_id 添加复合唯一索引，防止重复收藏
CREATE UNIQUE INDEX IF NOT EXISTS idx_saved_companies_user_company ON saved_companies(user_id, company_id);
-- 为 user_id 添加索引，用于快速查询用户的收藏公司
CREATE INDEX IF NOT EXISTS idx_saved_companies_user_id ON saved_companies(user_id);
-- 为 company_id 添加索引，用于快速查询公司被哪些用户收藏
CREATE INDEX IF NOT EXISTS idx_saved_companies_company_id ON saved_companies(company_id);
-- 为 created_at 添加索引，用于按收藏时间排序
CREATE INDEX IF NOT EXISTS idx_saved_companies_created_at ON saved_companies(created_at DESC);

-- 4. jobs 表索引（优化与收藏职位相关的查询）
-- 为 company_id 添加索引，用于快速查询公司的职位
CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON jobs(company_id);
-- 为 created_at 添加索引，用于按创建时间排序
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);
-- 为 status 添加索引，用于快速过滤职位状态
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);

-- 5. companies 表索引（优化与收藏公司相关的查询）
-- 为 name 添加索引，用于公司名称搜索
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
-- 为 industry 添加索引，用于按行业过滤
CREATE INDEX IF NOT EXISTS idx_companies_industry ON companies(industry);

-- 6. users 表索引（优化与求职者相关的查询）
-- 为 id 添加索引，用于快速连接
CREATE INDEX IF NOT EXISTS idx_users_id ON users(id);

-- 查看所有索引
\d+ candidates
\d+ saved_jobs
\d+ saved_companies
\d+ jobs
\d+ companies
\d+ users

-- 分析表，更新统计信息
ANALYZE candidates;
ANALYZE saved_jobs;
ANALYZE saved_companies;
ANALYZE jobs;
ANALYZE companies;
ANALYZE users;
