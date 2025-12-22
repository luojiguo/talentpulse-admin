-- 添加用户角色关联表，实现多角色支持

-- 1. 创建用户角色关联表
CREATE TABLE user_roles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'recruiter', 'candidate')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, role) -- 确保一个用户在一个角色上只有一条记录
);

-- 2. 将现有用户的角色迁移到新表
INSERT INTO user_roles (user_id, role) 
SELECT id, role FROM users;

-- 3. 修改users表，移除role字段
ALTER TABLE users DROP COLUMN role;

-- 4. 创建索引以提高查询性能
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);

-- 5. 添加表注释
COMMENT ON TABLE user_roles IS '用户角色关联表，实现用户与角色的多对多关系';
COMMENT ON COLUMN user_roles.id IS '关联ID，自增主键';
COMMENT ON COLUMN user_roles.user_id IS '用户ID，关联users表';
COMMENT ON COLUMN user_roles.role IS '角色类型：admin、recruiter、candidate';
COMMENT ON COLUMN user_roles.created_at IS '创建时间';

-- 6. 提交事务
COMMIT;

-- 输出结果
SELECT '用户角色关联表创建完成！' AS result;