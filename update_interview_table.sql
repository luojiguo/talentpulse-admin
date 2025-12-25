-- 更新interviews表结构，添加面试邀请所需的状态和优化字段

-- 1. 修改status字段的CHECK约束，添加accepted和rejected状态
ALTER TABLE public.interviews DROP CONSTRAINT IF EXISTS interviews_status_check;

ALTER TABLE public.interviews ADD CONSTRAINT interviews_status_check 
CHECK (((status)::text = ANY ((ARRAY['scheduled'::character varying, 'completed'::character varying, 'cancelled'::character varying, 'accepted'::character varying, 'rejected'::character varying])::text[])));

-- 2. 添加candidate_id字段，直接关联候选人，优化查询性能
ALTER TABLE public.interviews ADD COLUMN IF NOT EXISTS candidate_id integer;

-- 添加外键约束，关联candidates表
ALTER TABLE public.interviews ADD CONSTRAINT fk_interviews_candidate 
FOREIGN KEY (candidate_id) REFERENCES public.candidates(id) ON DELETE CASCADE;

-- 3. 添加job_id字段，直接关联职位，优化查询性能
ALTER TABLE public.interviews ADD COLUMN IF NOT EXISTS job_id integer;

-- 添加外键约束，关联jobs表
ALTER TABLE public.interviews ADD CONSTRAINT fk_interviews_job 
FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;

-- 4. 更新现有数据，填充candidate_id和job_id字段
UPDATE public.interviews i
SET 
    candidate_id = a.candidate_id,
    job_id = a.job_id
FROM public.applications a
WHERE i.application_id = a.id;

-- 5. 为新添加的字段创建索引，提升查询性能
CREATE INDEX IF NOT EXISTS idx_interviews_candidate_id ON public.interviews(candidate_id);
CREATE INDEX IF NOT EXISTS idx_interviews_job_id ON public.interviews(job_id);

-- 6. 设置candidate_id和job_id为非空字段（可选，根据业务需求）
ALTER TABLE public.interviews ALTER COLUMN candidate_id SET NOT NULL;
ALTER TABLE public.interviews ALTER COLUMN job_id SET NOT NULL;

-- 7. 添加面试邀请相关的其他可选字段
-- 添加邀请发送时间
ALTER TABLE public.interviews ADD COLUMN IF NOT EXISTS invitation_sent_at timestamp with time zone;

-- 添加邀请过期时间
ALTER TABLE public.interviews ADD COLUMN IF NOT EXISTS invitation_expires_at timestamp with time zone;

-- 添加候选人回复时间
ALTER TABLE public.interviews ADD COLUMN IF NOT EXISTS candidate_response_at timestamp with time zone;

-- 8. 添加邀请消息内容字段，用于存储发送给候选人的邀请信息
ALTER TABLE public.interviews ADD COLUMN IF NOT EXISTS invitation_message text;

-- 9. 添加时区信息，避免跨时区问题
ALTER TABLE public.interviews ADD COLUMN IF NOT EXISTS time_zone character varying(50) DEFAULT 'Asia/Shanghai';

-- 10. 为新添加的时间字段创建索引
CREATE INDEX IF NOT EXISTS idx_interviews_invitation_sent ON public.interviews(invitation_sent_at);
CREATE INDEX IF NOT EXISTS idx_interviews_candidate_response ON public.interviews(candidate_response_at);

-- 11. 更新现有记录的默认值
UPDATE public.interviews 
SET 
    invitation_sent_at = COALESCE(invitation_sent_at, created_at),
    invitation_message = COALESCE(invitation_message, '邀请您参加面试'),
    time_zone = COALESCE(time_zone, 'Asia/Shanghai')
WHERE invitation_sent_at IS NULL;

-- 12. 添加触发器，自动更新invitation_sent_at时间
CREATE OR REPLACE FUNCTION public.set_invitation_sent_at()
RETURNS trigger AS $$
BEGIN
    -- 当状态设置为scheduled且invitation_sent_at为空时，自动设置为当前时间
    IF NEW.status = 'scheduled' AND NEW.invitation_sent_at IS NULL THEN
        NEW.invitation_sent_at := CURRENT_TIMESTAMP;
    END IF;
    
    -- 当状态变为accepted或rejected时，自动设置candidate_response_at为当前时间
    IF (NEW.status = 'accepted' OR NEW.status = 'rejected') AND NEW.candidate_response_at IS NULL THEN
        NEW.candidate_response_at := CURRENT_TIMESTAMP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
CREATE TRIGGER trigger_set_invitation_sent_at
BEFORE INSERT OR UPDATE ON public.interviews
FOR EACH ROW
EXECUTE FUNCTION public.set_invitation_sent_at();

-- 13. 添加触发器，自动从application_id填充candidate_id和job_id
CREATE OR REPLACE FUNCTION public.fill_candidate_job_id()
RETURNS trigger AS $$
BEGIN
    -- 当application_id改变或为空时，从applications表获取candidate_id和job_id
    IF NEW.application_id IS NOT NULL THEN
        SELECT a.candidate_id, a.job_id INTO NEW.candidate_id, NEW.job_id
        FROM public.applications a
        WHERE a.id = NEW.application_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
CREATE TRIGGER trigger_fill_candidate_job_id
BEFORE INSERT OR UPDATE ON public.interviews
FOR EACH ROW
WHEN (NEW.application_id IS NOT NULL)
EXECUTE FUNCTION public.fill_candidate_job_id();

-- 14. 更新update_updated_at_column函数，确保interviews表的updated_at字段自动更新
-- 该函数已在数据库中存在，这里确保触发器已创建
DO $$ 
BEGIN
    -- 检查并创建触发器，确保updated_at字段自动更新
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_interviews_updated_at' 
        AND NOT tgisinternal
    ) THEN
        CREATE TRIGGER update_interviews_updated_at
        BEFORE UPDATE ON public.interviews
        FOR EACH ROW
        EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

-- 15. 添加面试邀请相关的视图，方便查询面试邀请信息
CREATE OR REPLACE VIEW public.interview_invitations AS
SELECT 
    i.id,
    i.application_id,
    i.candidate_id,
    i.job_id,
    i.interview_date,
    i.interview_time,
    i.location,
    i.interviewer_id,
    i.status,
    i.notes,
    i.interview_round,
    i.interview_type,
    i.interview_duration,
    i.interviewer_name,
    i.interviewer_position,
    i.interview_materials,
    i.interview_result,
    i.interview_feedback,
    i.created_at,
    i.updated_at,
    i.invitation_sent_at,
    i.invitation_expires_at,
    i.candidate_response_at,
    i.invitation_message,
    i.time_zone,
    -- 关联获取候选人信息
    u1.name AS candidate_name,
    u1.email AS candidate_email,
    u1.phone AS candidate_phone,
    -- 关联获取职位信息
    j.title AS job_title,
    j.company_id,
    -- 关联获取公司信息
    co.name AS company_name,
    co.address AS company_address,
    -- 关联获取面试官信息
    u2.name AS interviewer_full_name,
    u2.email AS interviewer_email,
    u2.phone AS interviewer_phone
FROM public.interviews i
LEFT JOIN public.candidates cd ON i.candidate_id = cd.id
LEFT JOIN public.users u1 ON cd.user_id = u1.id
LEFT JOIN public.jobs j ON i.job_id = j.id
LEFT JOIN public.companies co ON j.company_id = co.id
LEFT JOIN public.recruiters r ON i.interviewer_id = r.id
LEFT JOIN public.users u2 ON r.user_id = u2.id;

-- 16. 为视图创建索引，提升查询性能
-- 注意：PostgreSQL 11+ 支持索引视图，需要使用MATERIALIZED VIEW
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_interview_invitations AS
SELECT * FROM public.interview_invitations;

-- 创建物化视图的索引
CREATE INDEX IF NOT EXISTS idx_mv_interview_candidate ON public.mv_interview_invitations(candidate_id);
CREATE INDEX IF NOT EXISTS idx_mv_interview_job ON public.mv_interview_invitations(job_id);
CREATE INDEX IF NOT EXISTS idx_mv_interview_status ON public.mv_interview_invitations(status);
CREATE INDEX IF NOT EXISTS idx_mv_interview_date ON public.mv_interview_invitations(interview_date);

-- 17. 添加刷新物化视图的函数和触发器
CREATE OR REPLACE FUNCTION public.refresh_interview_invitations_mv()
RETURNS trigger AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_interview_invitations;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 注意：需要先创建唯一索引才能使用CONCURRENTLY选项
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_interview_id ON public.mv_interview_invitations(id);

-- 创建触发器，当interviews表更新时自动刷新物化视图
CREATE TRIGGER trigger_refresh_interview_mv
AFTER INSERT OR UPDATE OR DELETE ON public.interviews
FOR EACH STATEMENT
EXECUTE FUNCTION public.refresh_interview_invitations_mv();

-- 18. 测试数据：插入一条面试邀请记录
-- 注意：请根据实际数据修改application_id、interviewer_id等值
/*
INSERT INTO public.interviews (
    application_id, 
    interview_date, 
    interview_time, 
    location, 
    interviewer_id, 
    interview_type,
    interview_round,
    interview_duration,
    interviewer_name,
    interviewer_position,
    invitation_message
) VALUES (
    1, -- 替换为实际的application_id
    '2025-12-30', 
    '14:30:00', 
    '北京市朝阳区建国路88号', 
    1, -- 替换为实际的interviewer_id
    '现场',
    1,
    60,
    '张三',
    '技术总监',
    '邀请您参加前端开发工程师职位的面试，请准时参加。'
);
*/

-- 19. 查询面试邀请数据示例
/*
-- 查询所有面试邀请
SELECT * FROM public.interview_invitations;

-- 查询特定候选人的面试邀请
SELECT * FROM public.interview_invitations WHERE candidate_id = 1;

-- 查询特定职位的面试邀请
SELECT * FROM public.interview_invitations WHERE job_id = 1;

-- 查询待处理的面试邀请
SELECT * FROM public.interview_invitations WHERE status = 'scheduled';

-- 查询已接受的面试邀请
SELECT * FROM public.interview_invitations WHERE status = 'accepted';

-- 查询已拒绝的面试邀请
SELECT * FROM public.interview_invitations WHERE status = 'rejected';
*/

-- 20. 更新面试状态的示例
/*
-- 候选人接受面试邀请
UPDATE public.interviews SET status = 'accepted' WHERE id = 1;

-- 候选人拒绝面试邀请
UPDATE public.interviews SET status = 'rejected' WHERE id = 1;
*/

-- 更新完成
SELECT 'Interview table updated successfully!' AS message;
