-- TalentPulse 模拟数据生成脚本
-- 生成企业、HR和岗位的关联数据

-- 1. 插入更多企业数据
INSERT INTO companies (name, industry, size, address, description, status, is_verified) VALUES 
('科技有限公司', '互联网', '100-500人', '北京市朝阳区科技园', '一家专注于人工智能的科技公司', 'active', true),
('金融服务集团', '金融', '500-1000人', '上海市浦东新区陆家嘴', '提供全方位金融服务的大型集团', 'active', true),
('电子商务有限公司', '电商', '1000-5000人', '广州市天河区珠江新城', '领先的电子商务平台', 'active', true),
('教育科技有限公司', '教育', '50-100人', '深圳市南山区科技园', '专注于在线教育的科技公司', 'active', true),
('医疗健康有限公司', '医疗', '200-500人', '杭州市西湖区', '提供医疗健康解决方案的企业', 'active', true);

-- 2. 插入HR用户数据
INSERT INTO users (name, email, password, role, phone, avatar, status) VALUES 
('张三', 'zhangsan@tech.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'recruiter', '13800138001', 'avatar1.png', 'active'),
('李四', 'lisi@finance.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'recruiter', '13800138002', 'avatar2.png', 'active'),
('王五', 'wangwu@ecommerce.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'recruiter', '13800138003', 'avatar3.png', 'active'),
('赵六', 'zhaoliu@education.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'recruiter', '13800138004', 'avatar4.png', 'active'),
('孙七', 'sunqi@health.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'recruiter', '13800138005', 'avatar5.png', 'active');

-- 3. 插入HR信息，关联企业和用户
INSERT INTO recruiters (user_id, company_id, position, department, is_verified) VALUES 
(3, 1, '招聘经理', '人力资源部', true),  -- 张三 -> 科技有限公司
(4, 2, 'HR总监', '人力资源中心', true),  -- 李四 -> 金融服务集团
(5, 3, '招聘专员', '招聘部', true),       -- 王五 -> 电子商务有限公司
(6, 4, 'HR经理', '人事行政部', true),     -- 赵六 -> 教育科技有限公司
(7, 5, '招聘主管', '人力资源部', true);   -- 孙七 -> 医疗健康有限公司

-- 4. 插入岗位数据，关联企业和HR
INSERT INTO jobs (company_id, recruiter_id, title, description, salary, location, experience, degree, type, status, department, work_mode, job_level, hiring_count, urgency, required_skills, preferred_skills, benefits) VALUES 
-- 科技有限公司岗位
(1, 1, '高级前端工程师', '负责公司核心产品的前端开发', '25-35K', '北京', '3-5年', '本科', '全职', 'active', '技术部', '混合', '高级', 2, '紧急', '["React", "TypeScript", "Vite"]', '["Node.js", "GraphQL"]', '["五险一金", "年终奖", "弹性工作"]'),
(1, 1, 'Java后端工程师', '负责后端服务的设计和开发', '20-30K', '北京', '2-4年', '本科', '全职', 'active', '技术部', '现场', '中级', 3, '普通', '["Java", "Spring Boot", "MySQL"]', '["Redis", "Kafka"]', '["五险一金", "餐补", "定期体检"]'),
(1, 1, '产品经理', '负责产品规划和需求管理', '18-28K', '北京', '3-5年', '本科', '全职', 'active', '产品部', '混合', '中级', 1, '紧急', '["产品设计", "需求分析", "原型设计"]', '["用户研究", "数据分析"]', '["五险一金", "年终奖", "带薪年假"]'),

-- 金融服务集团岗位
(2, 2, '金融分析师', '负责金融市场分析和报告', '20-30K', '上海', '2-4年', '硕士', '全职', 'active', '研究部', '现场', '中级', 2, '普通', '["金融分析", "Excel", "SQL"]', '["Python", "Tableau"]', '["五险一金", "绩效奖金", "节日福利"]'),
(2, 2, '风险管理专员', '负责风险评估和管理', '18-25K', '上海', '1-3年', '本科', '全职', 'active', '风险部', '混合', '初级', 3, '紧急', '["风险管理", "合规", "数据分析"]', '["金融知识", "统计"]', '["五险一金", "培训机会", "晋升空间"]'),

-- 电子商务有限公司岗位
(3, 3, '电商运营专员', '负责店铺运营和推广', '15-25K', '广州', '1-3年', '本科', '全职', 'active', '运营部', '现场', '初级', 5, '普通', '["电商运营", "数据分析", "推广"]', '["淘宝", "京东", "抖音"]', '["五险一金", "绩效提成", "包住"]'),
(3, 3, '客服主管', '负责客服团队管理', '18-28K', '广州', '3-5年', '本科', '全职', 'active', '客服部', '混合', '中级', 2, '紧急', '["团队管理", "客户服务", "沟通能力"]', '["CRM系统", "数据分析"]', '["五险一金", "年终奖", "带薪年假"]'),

-- 教育科技有限公司岗位
(4, 4, '在线课程策划', '负责在线课程的设计和策划', '12-20K', '深圳', '1-3年', '本科', '全职', 'active', '课程部', '远程', '初级', 3, '普通', '["课程设计", "教育心理学", "文案写作"]', '["视频剪辑", "教学设计"]', '["五险一金", "弹性工作", "远程办公"]'),
(4, 4, '教学顾问', '负责学员咨询和课程推荐', '10-18K', '深圳', '0-2年', '大专', '全职', 'active', '销售部', '远程', '初级', 10, '紧急', '["销售能力", "沟通能力", "教育背景"]', '["在线教育", "心理咨询"]', '["五险一金", "提成", "培训"]'),

-- 医疗健康有限公司岗位
(5, 5, '产品经理', '负责医疗健康产品的规划', '20-30K', '杭州', '3-5年', '本科', '全职', 'active', '产品部', '混合', '中级', 2, '普通', '["产品设计", "医疗健康", "需求分析"]', '["临床试验", "医疗器械"]', '["五险一金", "年终奖", "定期体检"]'),
(5, 5, '市场推广专员', '负责产品的市场推广', '15-25K', '杭州', '1-3年', '本科', '全职', 'active', '市场部', '现场', '初级', 3, '紧急', '["市场推广", "文案写作", "社交媒体"]', '["医疗知识", "数据分析"]', '["五险一金", "绩效奖金", "节日福利"]');

-- 5. 插入求职者数据（可选）
INSERT INTO users (name, email, password, role, phone, avatar, status) VALUES 
('求职者1', 'candidate1@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'candidate', '13800138010', 'avatar10.png', 'active'),
('求职者2', 'candidate2@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'candidate', '13800138011', 'avatar11.png', 'active'),
('求职者3', 'candidate3@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'candidate', '13800138012', 'avatar12.png', 'active');

-- 6. 插入求职者详细信息
INSERT INTO candidates (user_id, experience, city, expected_salary, job_status, bio, job_type_preference, work_mode_preference, industry_preference, location_preference) VALUES 
(8, '3-5年', '北京', '20-30K', 'active', '资深前端工程师，熟悉React和TypeScript', '["全职"]', '["混合", "远程"]', '["互联网", "科技"]', '["北京", "上海"]'),
(9, '1-3年', '上海', '15-25K', 'active', '金融专业毕业生，熟悉数据分析', '["全职"]', '["现场", "混合"]', '["金融", "咨询"]', '["上海", "杭州"]'),
(10, '5-10年', '广州', '25-40K', 'active', '有丰富的电商运营经验', '["全职"]', '["现场"]', '["电商", "零售"]', '["广州", "深圳"]');

-- 输出插入结果
SELECT '模拟数据插入完成！' AS result;
