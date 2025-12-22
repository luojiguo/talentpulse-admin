// 职位相关路由
const express = require('express');
const router = express.Router();
const { pool, query } = require('../config/db');
const { asyncHandler } = require('../middleware/errorHandler');

// 智能推荐职位 - 根据用户信息使用AI分析匹配度
router.get('/recommended/:userId', asyncHandler(async (req, res) => {
    const { userId } = req.params;
    
    // 获取用户信息
    const userResult = await query(`
        SELECT 
            u.major,
            u.desired_position,
            u.skills,
            u.education,
            u.work_experience_years,
            c.preferred_locations,
            c.availability_status
        FROM users u
        LEFT JOIN candidates c ON u.id = c.user_id
        WHERE u.id = $1
    `, [userId], 30000);
    
    if (userResult.rows.length === 0) {
        const error = new Error('用户不存在');
        error.statusCode = 404;
        error.errorCode = 'USER_NOT_FOUND';
        throw error;
    }
    
    const userInfo = userResult.rows[0];
    const { major, desired_position, skills, education, work_experience_years, preferred_locations, availability_status } = userInfo;
    
    // 获取所有活跃职位
    const allJobsResult = await query(`
        SELECT 
          j.id,
          j.title,
          j.location,
          j.salary,
          j.description,
          j.experience,
          j.degree,
          j.type,
          j.work_mode,
          j.job_level,
          j.department,
          j.status,
          j.publish_date,
          j.created_at,
          j.updated_at,
          j.company_id,
          j.recruiter_id,
          j.required_skills,
          j.preferred_skills,
          j.benefits,
          c.name AS company_name,
          u.name AS recruiter_name,
          u.avatar AS recruiter_avatar,
          r.position AS recruiter_position,
          r.id AS recruiter_table_id
        FROM jobs j
        LEFT JOIN companies c ON j.company_id = c.id
        LEFT JOIN recruiters r ON j.recruiter_id = r.id
        LEFT JOIN users u ON r.user_id = u.id
        WHERE j.status = 'active'
        ORDER BY j.created_at DESC
        LIMIT 200
    `, [], 30000);
    
    const allJobs = allJobsResult.rows;
    
    // 如果没有用户专业和期望职位信息，返回所有职位
    if (!major && !desired_position) {
        return res.json({
            status: 'success',
            data: allJobs,
            count: allJobs.length,
            message: '用户信息不完整，返回所有职位'
        });
    }
    
    // 尝试使用AI进行智能匹配 - 默认禁用AI以提高性能，除非明确需要
    let matchedJobs = [];
    const aiApiKey = process.env.QIANWEN_API_KEY || process.env.VITE_QIANWEN_API_KEY;
    const useAI = req.query.useAI === 'true'; // 只有明确要求才使用AI
    
    if (aiApiKey && useAI) {
        try {
            // ... 保持原有AI逻辑 ...
            // 构建用户信息摘要
            const userContext = `
用户信息：
- 专业：${major || '未填写'}
- 期望职位：${desired_position || '未填写'}
- 学历：${education || '未填写'}
- 工作经验：${work_experience_years || 0}年
- 技能：${Array.isArray(skills) ? skills.join(', ') : (skills || '未填写')}
- 期望地点：${preferred_locations || '未填写'}
            `.trim();
            
            // 构建职位信息摘要（只取前50个职位，避免token过多）
            const jobsSummary = allJobs.slice(0, 50).map((job, index) => {
                const requiredSkills = Array.isArray(job.required_skills) 
                    ? job.required_skills.join(', ') 
                    : (job.required_skills || '');
                return `${index + 1}. 职位：${job.title}，地点：${job.location}，要求：${job.experience}经验，${job.degree}学历，技能：${requiredSkills}`;
            }).join('\n');
            
            const aiPrompt = `你是一个专业的职位匹配助手。请根据以下用户信息，从职位列表中选择最匹配的职位ID（返回格式：用逗号分隔的职位序号，如：1,3,5,7）。

${userContext}

职位列表：
${jobsSummary}

请只返回最匹配的职位序号（最多20个），用逗号分隔，不要其他文字。如果没有匹配的，返回空字符串。`;
            
            const aiUrl = process.env.QIANWEN_API_URL || process.env.VITE_QIANWEN_API_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
            
            // 使用AbortController实现超时
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            const aiResponse = await fetch(aiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${aiApiKey}`
                },
                body: JSON.stringify({
                    model: 'qwen-turbo',
                    messages: [
                        { role: 'system', content: '你是一个专业的职位匹配助手，只返回匹配的职位序号，用逗号分隔。' },
                        { role: 'user', content: aiPrompt }
                    ],
                    temperature: 0.3
                }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (aiResponse.ok) {
                const aiData = await aiResponse.json();
                const aiContent = aiData.choices?.[0]?.message?.content || '';
                
                // 解析AI返回的职位序号
                const matchedIndices = aiContent
                    .split(',')
                    .map(s => parseInt(s.trim()))
                    .filter(n => !isNaN(n) && n > 0 && n <= 50)
                    .map(n => n - 1); // 转换为数组索引
                
                matchedJobs = matchedIndices.map(idx => allJobs[idx]).filter(Boolean);
            }
        } catch (error) {
            console.error('AI匹配失败，使用关键词匹配:', error.message);
        }
    }
    
    // 如果AI匹配失败或未配置，使用关键词匹配作为降级方案
    if (matchedJobs.length === 0) {
        const keywords = [];
        if (major) keywords.push(major);
        if (desired_position) keywords.push(desired_position);
        if (Array.isArray(skills)) keywords.push(...skills);
        
        matchedJobs = allJobs.filter(job => {
            const jobText = `${job.title} ${job.description} ${Array.isArray(job.required_skills) ? job.required_skills.join(' ') : ''}`.toLowerCase();
            return keywords.some(keyword => 
                keyword && jobText.includes(keyword.toLowerCase())
            );
        });
    }
    
    // 如果还是没有匹配的，返回前20个最新职位
    if (matchedJobs.length === 0) {
        matchedJobs = allJobs.slice(0, 20);
    }
    
    res.json({
        status: 'success',
        data: matchedJobs,
        count: matchedJobs.length,
        method: aiApiKey ? 'ai' : 'keyword'
    });
}));

// 获取所有职位 - 优化查询性能，支持按招聘者和公司过滤
router.get('/', asyncHandler(async (req, res) => {
    const { recruiterId, companyId, excludeRecruiterId } = req.query;

    // 构建查询条件
    const conditions = [];
    const values = [];
    let paramIndex = 1;

    if (recruiterId) {
      conditions.push(`j.recruiter_id = $${paramIndex}`);
      values.push(recruiterId);
      paramIndex++;
    }

    if (companyId) {
      conditions.push(`j.company_id = $${paramIndex}`);
      values.push(companyId);
      paramIndex++;
    }

    if (excludeRecruiterId) {
      conditions.push(`j.recruiter_id != $${paramIndex}`);
      values.push(excludeRecruiterId);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 使用统一的query函数，自动处理超时
    // 优化查询：只选择需要的字段，减少数据传输量
    // 增加查询超时时间到30秒，因为可能涉及多表JOIN
    const result = await query(`
        SELECT 
          j.id,
          j.title,
          j.location,
          j.salary,
          j.description,
          j.experience,
          j.degree,
          j.type,
          j.work_mode,
          j.job_level,
          j.department,
          j.status,
          j.publish_date,
          j.created_at,
          j.updated_at,
          j.company_id,
          j.recruiter_id,
          j.required_skills,
          j.preferred_skills,
          j.benefits,
          c.name AS company_name,
          u.name AS recruiter_name,
          u.avatar AS recruiter_avatar,
          r.position AS recruiter_position,
          r.id AS recruiter_table_id
        FROM jobs j
        LEFT JOIN companies c ON j.company_id = c.id
        LEFT JOIN recruiters r ON j.recruiter_id = r.id
        LEFT JOIN users u ON r.user_id = u.id
        ${whereClause}
        ORDER BY j.created_at DESC
        LIMIT 100
    `, values, 30000);

    res.json({
      status: 'success',
      data: result.rows,
      count: result.rows.length
    });
}));

// 获取单个职位
router.get('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await query(`
        SELECT 
          j.*, 
          c.name AS company_name, 
          u.name AS recruiter_name, 
          u.avatar AS recruiter_avatar,
          r.position AS recruiter_position,
          r.id AS recruiter_table_id
        FROM jobs j 
        LEFT JOIN companies c ON j.company_id = c.id 
        LEFT JOIN recruiters r ON j.recruiter_id = r.id
        LEFT JOIN users u ON r.user_id = u.id 
        WHERE j.id = $1
    `, [id], 30000);

    if (result.rows.length === 0) {
      const error = new Error('职位不存在');
      error.statusCode = 404;
      error.errorCode = 'JOB_NOT_FOUND';
      throw error;
    }

    res.json({
      status: 'success',
      data: result.rows[0]
    });
}));

// 更新职位
router.put('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    let { status, required_skills, preferred_skills, benefits, ...otherFields } = req.body;

    // 构建动态更新语句
    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    // 处理required_skills
    if (required_skills !== undefined) {
      let skillsArray = [];
      try {
        if (Array.isArray(required_skills)) {
          skillsArray = required_skills;
        } else if (typeof required_skills === 'string') {
          if (required_skills.includes(',')) {
            skillsArray = required_skills.split(',').map(skill => skill.trim()).filter(Boolean);
          } else {
            skillsArray = JSON.parse(required_skills);
          }
        }
      } catch (error) {
        console.error('解析技能数组失败:', error);
        skillsArray = [];
      }
      updateFields.push(`required_skills = $${paramIndex}::jsonb`);
      values.push(JSON.stringify(skillsArray));
      paramIndex++;
    }

    // 处理preferred_skills
    if (preferred_skills !== undefined) {
      let preferredSkillsArray = [];
      try {
        if (Array.isArray(preferred_skills)) {
          preferredSkillsArray = preferred_skills;
        } else if (typeof preferred_skills === 'string') {
          if (preferred_skills.includes(',')) {
            preferredSkillsArray = preferred_skills.split(',').map(skill => skill.trim()).filter(Boolean);
          } else {
            preferredSkillsArray = JSON.parse(preferred_skills);
          }
        }
      } catch (error) {
        console.error('解析优先技能数组失败:', error);
        preferredSkillsArray = [];
      }
      updateFields.push(`preferred_skills = $${paramIndex}::jsonb`);
      values.push(JSON.stringify(preferredSkillsArray));
      paramIndex++;
    }

    // 处理benefits
    if (benefits !== undefined) {
      let benefitsArray = [];
      try {
        if (Array.isArray(benefits)) {
          benefitsArray = benefits;
        } else if (typeof benefits === 'string') {
          if (benefits.includes(',')) {
            benefitsArray = benefits.split(',').map(benefit => benefit.trim()).filter(Boolean);
          } else {
            benefitsArray = JSON.parse(benefits);
          }
        }
      } catch (error) {
        console.error('解析福利数组失败:', error);
        benefitsArray = [];
      }
      updateFields.push(`benefits = $${paramIndex}::jsonb`);
      values.push(JSON.stringify(benefitsArray));
      paramIndex++;
    }

    // 处理status
    if (status !== undefined) {
      updateFields.push(`status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }

    // 处理其他字段
    for (const [field, value] of Object.entries(otherFields)) {
      if (value !== undefined) {
        updateFields.push(`${field} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    // 添加updated_at字段
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    // 如果没有要更新的字段，直接返回错误
    if (updateFields.length === 1) { // 只有updated_at字段
      const error = new Error('没有要更新的字段');
      error.statusCode = 400;
      error.errorCode = 'NO_FIELDS_TO_UPDATE';
      throw error;
    }

    // 构建最终的SQL语句
    const result = await query(`
        UPDATE jobs 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex} RETURNING *
    `, [...values, id]);

    if (result.rows.length === 0) {
      const error = new Error('职位不存在');
      error.statusCode = 404;
      error.errorCode = 'JOB_NOT_FOUND';
      throw error;
    }

    res.json({
      status: 'success',
      data: result.rows[0]
    });
}));

// 删除职位
router.delete('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await query('DELETE FROM jobs WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      const error = new Error('职位不存在');
      error.statusCode = 404;
      error.errorCode = 'JOB_NOT_FOUND';
      throw error;
    }

    res.json({
      status: 'success',
      message: '职位删除成功',
      data: result.rows[0]
    });
}));

// 创建职位
router.post('/', asyncHandler(async (req, res) => {
    const {
      title,
      location,
      salary,
      description,
      required_skills,
      preferred_skills,
      benefits,
      experience,
      degree,
      type,
      work_mode,
      job_level,
      hiring_count,
      urgency,
      posterId,
      company,
      department,
      expire_date
    } = req.body;

    // 验证必填字段
    if (!title || !location || !posterId) {
      const error = new Error('职位名称、地点和发布者ID是必填字段');
      error.statusCode = 400;
      error.errorCode = 'MISSING_REQUIRED_FIELDS';
      throw error;
    }

    // 获取发布者的公司ID
    // 先根据用户ID查询招聘者信息
    const recruiterResult = await query(
      'SELECT id, company_id FROM recruiters WHERE user_id = $1',
      [posterId]
    );

    if (recruiterResult.rows.length === 0) {
      const error = new Error('发布者不存在');
      error.statusCode = 404;
      error.errorCode = 'RECRUITER_NOT_FOUND';
      throw error;
    }

    const recruiterId = recruiterResult.rows[0].id;
    const companyId = recruiterResult.rows[0].company_id;

    // 创建职位
    // 处理required_skills，确保它是有效的JSON格式
    let skillsArray = [];
    if (required_skills) {
      try {
        // 如果是数组，直接使用
        if (Array.isArray(required_skills)) {
          skillsArray = required_skills;
        }
        // 如果是字符串，尝试解析
        else if (typeof required_skills === 'string') {
          // 如果是逗号分隔的字符串，转换为数组
          if (required_skills.includes(',')) {
            skillsArray = required_skills.split(',').map(skill => skill.trim()).filter(Boolean);
          }
          // 否则尝试解析为JSON数组
          else {
            skillsArray = JSON.parse(required_skills);
          }
        }
      } catch (error) {
        console.error('解析技能数组失败:', error);
        skillsArray = [];
      }
    }

    // 处理benefits，确保它是有效的JSON格式
    let benefitsArray = [];
    if (benefits) {
      try {
        // 如果是数组，直接使用
        if (Array.isArray(benefits)) {
          benefitsArray = benefits;
        }
        // 如果是字符串，尝试解析
        else if (typeof benefits === 'string') {
          // 如果是逗号分隔的字符串，转换为数组
          if (benefits.includes(',')) {
            benefitsArray = benefits.split(',').map(benefit => benefit.trim()).filter(Boolean);
          }
          // 否则尝试解析为JSON数组
          else {
            benefitsArray = JSON.parse(benefits);
          }
        }
      } catch (error) {
        console.error('解析福利数组失败:', error);
        benefitsArray = [];
      }
    }

    // 处理preferred_skills，确保它是有效的JSON格式
    let preferredSkillsArray = [];
    if (preferred_skills) {
      try {
        // 如果是数组，直接使用
        if (Array.isArray(preferred_skills)) {
          preferredSkillsArray = preferred_skills;
        }
        // 如果是字符串，尝试解析
        else if (typeof preferred_skills === 'string') {
          // 如果是逗号分隔的字符串，转换为数组
          if (preferred_skills.includes(',')) {
            preferredSkillsArray = preferred_skills.split(',').map(skill => skill.trim()).filter(Boolean);
          }
          // 否则尝试解析为JSON数组
          else {
            preferredSkillsArray = JSON.parse(preferred_skills);
          }
        }
      } catch (error) {
        console.error('解析优先技能数组失败:', error);
        preferredSkillsArray = [];
      }
    }

    const result = await query(`
        INSERT INTO jobs (
          title, location, salary, description, required_skills,
          preferred_skills, benefits, experience, degree, type, work_mode, job_level,
          hiring_count, urgency, recruiter_id, company_id, department, status,
          publish_date, expire_date, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5::jsonb, $6::jsonb, $7::jsonb, $8, $9, $10, $11,
          $12, $13, $14, $15, $16, $17, $18, CURRENT_TIMESTAMP, $19, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        ) RETURNING *
    `, [
        title, location, salary, description, JSON.stringify(skillsArray),
        JSON.stringify(preferredSkillsArray), JSON.stringify(benefitsArray), experience || '1-3年', degree || '本科',
        type || '全职', work_mode || '现场', job_level || '初级',
        parseInt(hiring_count) || 1, urgency || '普通', recruiterId, companyId, department || '', 'active',
        expire_date ? new Date(expire_date) : null
    ]);

    res.json({
      status: 'success',
      data: result.rows[0],
      message: '职位创建成功'
    });
}));

module.exports = router;