
-- Add indexes to improve query performance

-- Index for jobs table
CREATE INDEX idx_jobs_company_id ON jobs(company_id);
CREATE INDEX idx_jobs_recruiter_id ON jobs(recruiter_id);
CREATE INDEX idx_jobs_created_at ON jobs(created_at);

-- Index for recruiters table
CREATE INDEX idx_recruiters_user_id ON recruiters(user_id);
