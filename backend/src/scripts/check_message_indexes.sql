-- 检查消息相关表的索引情况

-- 1. 检查 conversations 表的索引
\d+ conversations

-- 2. 检查 messages 表的索引
\d+ messages

-- 3. 检查 candidates 表的索引
\d+ candidates

-- 4. 检查 recruiters 表的索引
\d+ recruiters

-- 5. 检查 users 表的索引
\d+ users

-- 6. 分析查询性能
EXPLAIN ANALYZE
SELECT 
  m.*,
  u.name AS sender_name,
  u.avatar AS sender_avatar
FROM messages m
JOIN users u ON m.sender_id = u.id
WHERE m.conversation_id = 1 AND m.is_deleted = false
ORDER BY m.time DESC, m.id DESC
LIMIT 20 OFFSET 0;

-- 7. 分析对话详情查询性能
EXPLAIN ANALYZE
SELECT 
  c.*,
  COALESCE(j.title, '未知职位') AS job_title,
  COALESCE(co.name, '未知公司') AS company_name,
  COALESCE(u1.name, '未知候选人') AS candidate_name,
  COALESCE(u1.avatar, '') AS candidate_avatar,
  COALESCE(u1.id, 0) AS candidateId,
  COALESCE(u2.name, '未知招聘者') AS recruiter_name,
  COALESCE(u2.avatar, '') AS recruiter_avatar,
  COALESCE(u2.id, 0) AS recruiterId
FROM conversations c
LEFT JOIN jobs j ON c.job_id = j.id
LEFT JOIN companies co ON j.company_id = co.id
LEFT JOIN candidates cd ON c.candidate_id = cd.id
LEFT JOIN users u1 ON cd.user_id = u1.id
LEFT JOIN recruiters r ON c.recruiter_id = r.id
LEFT JOIN users u2 ON r.user_id = u2.id
WHERE c.id = 1 AND c.deleted_at IS NULL;
