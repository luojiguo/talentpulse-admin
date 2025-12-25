-- 添加必要的索引以优化对话查询性能

-- 为candidates表的user_id字段添加索引，用于快速查找候选人对应的用户
CREATE INDEX IF NOT EXISTS idx_candidates_user_id ON candidates(user_id);

-- 为recruiters表的user_id字段添加索引，用于快速查找招聘者对应的用户
CREATE INDEX IF NOT EXISTS idx_recruiters_user_id ON recruiters(user_id);

-- 为conversations表的candidate_deleted_at字段添加索引，用于快速过滤未被候选人删除的对话
CREATE INDEX IF NOT EXISTS idx_conversations_candidate_deleted_at ON conversations(candidate_deleted_at);

-- 为conversations表的recruiter_deleted_at字段添加索引，用于快速过滤未被招聘者删除的对话
CREATE INDEX IF NOT EXISTS idx_conversations_recruiter_deleted_at ON conversations(recruiter_deleted_at);

-- 为conversations表的deleted_at字段添加索引，用于快速过滤未被软删除的对话
CREATE INDEX IF NOT EXISTS idx_conversations_deleted_at ON conversations(deleted_at);

-- 为conversations表的updated_at字段添加索引，用于快速排序
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);

-- 复合索引：candidate_id + deleted_at，用于优化JOIN和WHERE条件
CREATE INDEX IF NOT EXISTS idx_conversations_candidate_id_deleted_at ON conversations(candidate_id, deleted_at);

-- 复合索引：recruiter_id + deleted_at，用于优化JOIN和WHERE条件
CREATE INDEX IF NOT EXISTS idx_conversations_recruiter_id_deleted_at ON conversations(recruiter_id, deleted_at);

-- 为messages表添加复合索引，优化消息查询
-- 复合索引：conversation_id + is_deleted，用于优化消息查询的WHERE条件
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id_is_deleted ON messages(conversation_id, is_deleted);

-- 复合索引：conversation_id + is_deleted + time，用于优化消息查询的排序和过滤
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id_is_deleted_time ON messages(conversation_id, is_deleted, time DESC);

