// 职位相关路由
const express = require('express');
const router = express.Router();
const { pool, query } = require('../config/db');
const { asyncHandler } = require('../middleware/errorHandler');
const { logAction } = require('../middleware/logger');

/**
 * 清理AI生成内容中的占位符号和优化排版
 * 移除 {""}, {}, *, 等AI识别生成的符号,并优化换行和格式
 */
const cleanAIGeneratedContent = (text) => {
  if (!text || typeof text !== 'string') return text;

  // 1. 基础清理：各种JSON/代码占位符
  let cleaned = text
    .replace(/\{\s*""\s*\}/g, '')
    .replace(/\{\s*\}/g, '')
    .replace(/\[\s*\]/g, '')
    .replace(/""/g, '')
    .replace(/''/g, '')
    .replace(/``/g, '');

  // 2. 统一标点与排版规范
  cleaned = cleaned
    .replace(/\r\n/g, '\n')      // 统一换行符
    .replace(/[【】]/g, ' ')      // 方括号转为空格
    .replace(/[《》]/g, ' ')
    .replace(/：/g, ':')         // 统一冒号
    .replace(/，/g, ',')         // 统一逗号
    .replace(/！/g, '!');        // 统一感叹号

  // 3. Markdown 符号清理
  cleaned = cleaned
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/~~(.+?)~~/g, '$1')
    .replace(/`([^`]+)`/g, '$1');

  // 4. 增强标题与列表项换行逻辑
  // 处理标题后紧跟列表项的情况
  cleaned = cleaned.replace(/(:)\s*([-•·])/g, '$1\n$2');

  // 处理在同一行内的列表项： 职责1 - 职责2 -> 职责1\n- 职责2 (要求符号前后有空格以区分负号/减号)
  cleaned = cleaned.replace(/([^\n])\s+([-•·])\s+/g, '$1\n$2 ');

  const sections = ['职位描述', '岗位职责', '任职要求', '工作职责', '职责描述', '加分项', '福利待遇', '公司福利', '岗位要求', '任职资格'];
  sections.forEach(section => {
    const regex = new RegExp(`([^\\n])\\s*${section}\\s*:`, 'g');
    cleaned = cleaned.replace(regex, `\n\n${section}:`);
  });

  // 5. 逐行处理：标准化列表符和去处行首尾空格
  cleaned = cleaned
    .split('\n')
    .map(line => {
      let l = line.trim();
      if (/^[-•·]\s*/.test(l)) {
        return l.replace(/^[-•·]\s*/, '- ');
      }
      return l;
    })
    .join('\n');

  // 6. 最终细节优化
  return cleaned
    .replace(/\n{3,}/g, '\n\n')        // 连续空行压缩
    .replace(/ {2,}/g, ' ')            // 连续空格压缩
    .replace(/:\s*/g, ': ')            // 冒号后空格标淮化
    .replace(/([,。！？.!?])\1+/g, '$1') // 重复标点压缩
    .replace(/\s*(\.\.\.|…+)\s*/g, '...') // 省略号标准化
    .replace(/\s*(—+|-{2,})\s*/g, '-')   // 长划线标准化
    .trim();
};


// --- Helper function for non-blocking AI recommendation ---
const triggerAIRecommendation = async (userId, userInfo, allJobs) => {
  console.log(`Triggering AI recommendation for user ${userId}`);
  try {
    // Mark existing recommendations as outdated or create a new entry
    await query(
      `INSERT INTO job_recommendations (user_id, status) VALUES ($1, 'pending')
             ON CONFLICT (user_id) DO UPDATE SET status = 'pending', updated_at = CURRENT_TIMESTAMP`,
      [userId]
    );

    const { major, desired_position, skills, education, work_experience_years, preferred_locations } = userInfo;
    const aiApiKey = process.env.QIANWEN_API_KEY || process.env.VITE_QIANWEN_API_KEY;

    if (!aiApiKey) {
      throw new Error('AI API key is not configured.');
    }

    const userContext = `
用户信息：
- 专业：${major || '未填写'}
- 期望职位：${desired_position || '未填写'}
- 学历：${education || '未填写'}
- 工作经验：${work_experience_years || 0}年
- 技能：${Array.isArray(skills) ? skills.join(', ') : (skills || '未填写')}
- 期望地点：${preferred_locations || '未填写'}
        `.trim();

    const jobsSummary = allJobs.slice(0, 50).map((job, index) => {
      const requiredSkills = Array.isArray(job.required_skills) ? job.required_skills.join(', ') : (job.required_skills || '');
      return `${index + 1}. 职位ID ${job.id}：${job.title}，地点：${job.location}，要求：${job.experience}经验，${job.degree}学历，技能：${requiredSkills}`;
    }).join('\n');

    const aiPrompt = `你是一个专业的职位匹配助手。请根据以下用户信息，从职位列表中选择最匹配的职位ID（返回格式：用逗号分隔的职位ID，如：1,3,5,7）。

${userContext}

职位列表：
${jobsSummary}

请只返回最匹配的职位ID（最多20个），用逗号分隔，不要其他文字。如果没有匹配的，返回空字符串。`;

    const aiUrl = process.env.QIANWEN_API_URL || process.env.VITE_QIANWEN_API_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout for AI

    const aiResponse = await fetch(aiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aiApiKey}`
      },
      body: JSON.stringify({
        model: 'qwen-turbo',
        messages: [{ role: 'system', content: '你是一个专业的职位匹配助手，只返回匹配的职位ID，用逗号分隔。' }, { role: 'user', content: aiPrompt }],
        temperature: 0.3
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!aiResponse.ok) {
      throw new Error(`AI API request failed with status ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || '';

    const matchedJobIds = aiContent.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));

    // Update the recommendations table with the result
    await query(
      "UPDATE job_recommendations SET status = 'completed', job_ids = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2",
      [matchedJobIds, userId]
    );
    console.log(`AI recommendation completed for user ${userId}. Found ${matchedJobIds.length} jobs.`);

  } catch (error) {
    console.error(`AI recommendation failed for user ${userId}:`, error.message);
    await query("UPDATE job_recommendations SET status = 'failed', updated_at = CURRENT_TIMESTAMP WHERE user_id = $1", [userId]);
  }
};

// 智能推荐职位 - 优化版本
router.get('/recommended/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const useAI = req.query.useAI === 'true';

  // 检查缓存的AI推荐结果 (1小时内有效)
  const cachedResult = await query(
    "SELECT * FROM job_recommendations WHERE user_id = $1 AND status = 'completed' AND updated_at > NOW() - INTERVAL '1 hour'",
    [userId]
  );

  if (cachedResult.rows.length > 0 && !useAI) {
    const jobIds = cachedResult.rows[0].job_ids;
    if (jobIds && jobIds.length > 0) {
      const jobsResult = await query(`
                SELECT j.*, c.name AS company_name, u.name AS recruiter_name, u.avatar AS recruiter_avatar, r.position AS recruiter_position
                FROM jobs j
                LEFT JOIN companies c ON j.company_id = c.id
                LEFT JOIN recruiters r ON j.recruiter_id = r.id
                LEFT JOIN users u ON r.user_id = u.id
                WHERE j.id = ANY($1) AND j.status = 'active'
            `, [jobIds]);

      return res.json({
        status: 'success',
        message: '从缓存中获取推荐结果',
        data: jobsResult.rows,
        count: jobsResult.rows.length,
        method: 'cache'
      });
    }
  }

  // 1. 获取用户信息
  const userResult = await query(`
        SELECT u.major, u.desired_position, u.skills, u.education, u.work_experience_years, c.preferred_locations
        FROM users u LEFT JOIN candidates c ON u.id = c.user_id WHERE u.id = $1
    `, [userId]);

  if (userResult.rows.length === 0) {
    return res.status(404).json({ status: 'error', message: '用户不存在' });
  }
  const userInfo = userResult.rows[0];

  // 2. 获取所有活跃职位 (限制数量提高速度)
  const allJobsResult = await query(`
        SELECT j.id, j.title, j.description, j.required_skills, c.name AS company_name, u.name AS recruiter_name, u.avatar AS recruiter_avatar, r.position AS recruiter_position
        FROM jobs j
        LEFT JOIN companies c ON j.company_id = c.id
        LEFT JOIN recruiters r ON j.recruiter_id = r.id
        LEFT JOIN users u ON r.user_id = u.id
        WHERE j.status = 'active' ORDER BY j.created_at DESC LIMIT 100
    `);
  const allJobs = allJobsResult.rows;

  // 3. 如果需要，触发异步AI推荐 (不等待)
  if (useAI) {
    triggerAIRecommendation(userId, userInfo, allJobs).catch(err => console.error("Error in detached AI recommendation:", err));
  }

  // 4. 立即返回基于关键词的匹配结果作为基线
  let matchedJobs;
  const { major, desired_position, skills } = userInfo;
  if (!major && !desired_position) {
    matchedJobs = allJobs.slice(0, 20);
  } else {
    const keywords = [major, desired_position, ...(Array.isArray(skills) ? skills : [])].filter(Boolean);
    matchedJobs = allJobs.filter(job => {
      const jobText = `${job.title} ${job.description} ${Array.isArray(job.required_skills) ? job.required_skills.join(' ') : ''}`.toLowerCase();
      return keywords.some(keyword => jobText.includes(keyword.toLowerCase()));
    });
    if (matchedJobs.length === 0) {
      matchedJobs = allJobs.slice(0, 20);
    }
  }

  res.json({
    status: 'success',
    message: useAI ? '初步推荐结果已返回，AI正在处理更精准的匹配...' : '推荐结果已生成',
    data: matchedJobs.slice(0, 20),
    count: Math.min(matchedJobs.length, 20),
    method: 'keyword'
  });
}));

// 新增: 获取AI推荐结果的状态和数据
router.get('/recommended/:userId/status', asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const recommendationResult = await query('SELECT * FROM job_recommendations WHERE user_id = $1', [userId]);

  if (recommendationResult.rows.length === 0) {
    return res.json({ status: 'not_started', message: 'AI推荐尚未开始' });
  }

  const recommendation = recommendationResult.rows[0];

  if (recommendation.status === 'completed') {
    const jobIds = recommendation.job_ids;
    if (!jobIds || jobIds.length === 0) {
      return res.json({ status: 'completed', data: [], message: 'AI推荐完成，没有找到匹配的职位。' });
    }
    // 根据IDs获取完整的职位信息
    const jobsResult = await query(`
            SELECT 
              j.id, j.title, j.location, j.salary, j.description, j.experience, j.degree, j.type,
              j.work_mode, j.job_level, j.department, j.status, j.publish_date, j.created_at,
              j.updated_at, j.company_id, j.recruiter_id, j.required_skills, j.preferred_skills, j.benefits,
              c.name AS company_name, u.name AS recruiter_name, u.avatar AS recruiter_avatar,
              r.position AS recruiter_position, r.id AS recruiter_table_id
            FROM jobs j
            LEFT JOIN companies c ON j.company_id = c.id
            LEFT JOIN recruiters r ON j.recruiter_id = r.id
            LEFT JOIN users u ON r.user_id = u.id
            WHERE j.id = ANY($1::int[])
        `, [jobIds]);
    return res.json({ status: 'completed', data: jobsResult.rows, count: jobsResult.rows.length, message: 'AI推荐已完成' });
  }

  res.json({ status: recommendation.status, message: `AI推荐正在处理中...` });
}));

// 获取所有职位 - 支持分页和过滤
router.get('/', asyncHandler(async (req, res) => {
  const { recruiterId, companyId, excludeRecruiterId, page = 1, limit = 20 } = req.query;

  // 构建查询条件
  const conditions = ["j.status = 'active'"];
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
  const offset = (page - 1) * limit;

  // 获取总数的查询
  const totalResult = await query(`SELECT COUNT(*) FROM jobs j ${whereClause}`, values);
  const totalCount = parseInt(totalResult.rows[0].count, 10);

  // 获取分页数据的查询
  const result = await query(`
        SELECT 
          j.id, j.title, j.location, j.salary, j.description, j.experience, j.degree, j.type,
          j.work_mode, j.job_level, j.department, j.status, j.publish_date, j.created_at,
          j.updated_at, j.company_id, j.recruiter_id, j.required_skills, j.preferred_skills, j.benefits,
          c.name AS company_name, u.name AS recruiter_name, u.avatar AS recruiter_avatar,
          r.position AS recruiter_position, r.id AS recruiter_table_id
        FROM jobs j
        LEFT JOIN companies c ON j.company_id = c.id
        LEFT JOIN recruiters r ON j.recruiter_id = r.id
        LEFT JOIN users u ON r.user_id = u.id
        ${whereClause}
        ORDER BY j.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...values, limit, offset], 30000);

  res.json({
    status: 'success',
    data: result.rows,
    count: result.rows.length,
    total: totalCount,
    page: parseInt(page, 10),
    limit: parseInt(limit, 10)
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

  // 记录查看职位日志
  await logAction(req, res, '查看职位', `招聘者查看了职位：${result.rows[0].title}`, 'view', { type: 'job', id: result.rows[0].id });

  res.json({
    status: 'success',
    data: result.rows[0]
  });
}));

// 更新职位
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  let { status, required_skills, preferred_skills, benefits, ...otherFields } = req.body;

  // 清理职位描述中的AI占位符号
  if (otherFields.description) {
    otherFields.description = cleanAIGeneratedContent(otherFields.description);
  }

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
        if (required_skills.trim().startsWith('[') || required_skills.trim().startsWith('{')) {
          try {
            skillsArray = JSON.parse(required_skills);
          } catch (e) {
            skillsArray = required_skills.split(',').map(s => s.trim()).filter(Boolean);
          }
        } else if (required_skills.includes(',')) {
          skillsArray = required_skills.split(',').map(skill => skill.trim()).filter(Boolean);
        } else if (required_skills.trim()) {
          skillsArray = [required_skills.trim()];
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
        if (preferred_skills.trim().startsWith('[') || preferred_skills.trim().startsWith('{')) {
          try {
            preferredSkillsArray = JSON.parse(preferred_skills);
          } catch (e) {
            preferredSkillsArray = preferred_skills.split(',').map(s => s.trim()).filter(Boolean);
          }
        } else if (preferred_skills.includes(',')) {
          preferredSkillsArray = preferred_skills.split(',').map(skill => skill.trim()).filter(Boolean);
        } else if (preferred_skills.trim()) {
          preferredSkillsArray = [preferred_skills.trim()];
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
        if (benefits.trim().startsWith('[') || benefits.trim().startsWith('{')) {
          try {
            benefitsArray = JSON.parse(benefits);
          } catch (e) {
            benefitsArray = benefits.split(',').map(s => s.trim()).filter(Boolean);
          }
        } else if (benefits.includes(',')) {
          benefitsArray = benefits.split(',').map(benefit => benefit.trim()).filter(Boolean);
        } else if (benefits.trim()) {
          benefitsArray = [benefits.trim()];
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

  // 记录更新职位日志
  await logAction(req, res, '更新职位', `招聘者更新了职位：${result.rows[0].title}`, 'update', { type: 'job', id: result.rows[0].id });

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

  // 记录删除职位日志
  await logAction(req, res, '删除职位', `招聘者删除了职位：${result.rows[0].title}`, 'delete', { type: 'job', id: result.rows[0].id });

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

  // 清理职位描述中的AI占位符号
  const cleanedDescription = cleanAIGeneratedContent(description);


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
    title, location, salary, cleanedDescription, JSON.stringify(skillsArray),
    JSON.stringify(preferredSkillsArray), JSON.stringify(benefitsArray), experience || '1-3年', degree || '本科',
    type || '全职', work_mode || '现场', job_level || '初级',
    parseInt(hiring_count) || 1, urgency || '普通', recruiterId, companyId, department || '', 'active',
    expire_date ? new Date(expire_date) : null
  ]);

  // 记录创建职位日志
  await logAction(req, res, '创建职位', `招聘者创建了职位：${result.rows[0].title}`, 'create', { type: 'job', id: result.rows[0].id });

  res.json({
    status: 'success',
    data: result.rows[0],
    message: '职位创建成功'
  });
}));

module.exports = router;