-- 添加简历评分和分析字段到candidates表
ALTER TABLE candidates
ADD COLUMN resume_score INTEGER,
ADD COLUMN resume_analysis TEXT;

-- 添加索引以提高查询性能
CREATE INDEX idx_candidates_resume_score ON candidates(resume_score);
