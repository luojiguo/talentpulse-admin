-- 为recruiter_user和candidate_user表的字段添加注释

-- recruiter_user表字段注释
COMMENT ON TABLE recruiter_user IS '招聘者验证表，存储招聘者的企业认证信息';

COMMENT ON COLUMN recruiter_user.id IS '主键，自增ID';
COMMENT ON COLUMN recruiter_user.user_id IS '用户ID，关联users表';
COMMENT ON COLUMN recruiter_user.company_id IS '企业ID，关联companies表';
COMMENT ON COLUMN recruiter_user.is_verified IS '是否已验证';
COMMENT ON COLUMN recruiter_user.business_license IS '营业执照照片路径';
COMMENT ON COLUMN recruiter_user.contact_info IS '联系人信息';
COMMENT ON COLUMN recruiter_user.verification_status IS '验证状态：pending（待审核）、approved（已通过）、rejected（已拒绝）';
COMMENT ON COLUMN recruiter_user.verification_date IS '验证日期';
COMMENT ON COLUMN recruiter_user.created_at IS '创建时间';
COMMENT ON COLUMN recruiter_user.updated_at IS '更新时间';

-- candidate_user表字段注释
COMMENT ON TABLE candidate_user IS '求职者验证表，存储求职者的验证状态';

COMMENT ON COLUMN candidate_user.id IS '主键，自增ID';
COMMENT ON COLUMN candidate_user.user_id IS '用户ID，关联users表';
COMMENT ON COLUMN candidate_user.is_verified IS '是否已验证，求职者默认已验证';
COMMENT ON COLUMN candidate_user.created_at IS '创建时间';
COMMENT ON COLUMN candidate_user.updated_at IS '更新时间';
