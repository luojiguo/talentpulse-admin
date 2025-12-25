-- 为消息相关表添加必要的索引，优化聊天详情数据获取性能
-- 执行命令: psql -d Talent -U postgres -f add_message_indexes.sql

-- 1. messages 表索引（最重要的优化）
-- 为 conversation_id、is_deleted、time 和 id 添加复合索引，优化消息查询和排序
CREATE INDEX IF NOT EXISTS idx_messages_conversation_deleted_time_id 
ON messages(conversation_id, is_deleted, time DESC, id DESC);

-- 为 sender_id 添加索引，优化与 users 表的连接
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);

-- 为 receiver_id 添加索引，优化消息查询
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);

-- 2. conversations 表索引
-- 为 id 和 deleted_at 添加复合索引，优化对话详情查询
CREATE INDEX IF NOT EXISTS idx_conversations_id_deleted ON conversations(id, deleted_at);

-- 为 last_time 添加索引，优化对话列表排序
CREATE INDEX IF NOT EXISTS idx_conversations_last_time ON conversations(last_time DESC);

-- 为 candidate_id 和 recruiter_id 添加索引，优化连接查询
CREATE INDEX IF NOT EXISTS idx_conversations_candidate_id ON conversations(candidate_id);
CREATE INDEX IF NOT EXISTS idx_conversations_recruiter_id ON conversations(recruiter_id);

-- 3. candidates 表索引
-- 为 user_id 添加索引，优化与 users 表的连接
CREATE INDEX IF NOT EXISTS idx_candidates_user_id ON candidates(user_id);

-- 4. recruiters 表索引
-- 为 user_id 添加索引，优化与 users 表的连接
CREATE INDEX IF NOT EXISTS idx_recruiters_user_id ON recruiters(user_id);

-- 5. jobs 表索引
-- 为 company_id 添加索引，优化与 companies 表的连接
CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON jobs(company_id);

-- 6. users 表索引
-- 为 id 添加索引，优化连接查询
CREATE INDEX IF NOT EXISTS idx_users_id ON users(id);

-- 分析表，更新统计信息
ANALYZE conversations;
ANALYZE messages;
ANALYZE candidates;
ANALYZE recruiters;
ANALYZE jobs;
ANALYZE users;
ANALYZE companies;

-- 查看索引创建结果
\d+ messages
\d+ conversations
\d+ candidates
\d+ recruiters
