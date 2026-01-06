const express = require('express');
const router = express.Router();
const { pool, query } = require('../config/db');
const { asyncHandler } = require('../middleware/errorHandler');

// OpenAI/DashScope API Configuration
// const AI_API_URL = process.env.QIANWEN_API_URL || process.env.VITE_QIANWEN_API_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
// Key read moved to handler to avoid init issues

/**
 * Score Resume API
 * Accepts candidate profile data and returns a score (0-100) and analysis.
 */
router.post('/score-resume', asyncHandler(async (req, res) => {
    const { profile } = req.body;

    // Read config inside request to ensure dotenv has loaded
    const AI_API_URL = process.env.QIANWEN_API_URL || process.env.VITE_QIANWEN_API_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
    const AI_API_KEY = process.env.QIANWEN_API_KEY || process.env.VITE_QIANWEN_API_KEY;

    if (!profile) {
        const error = new Error('Profile data is required');
        error.statusCode = 400;
        throw error;
    }

    if (!AI_API_KEY) {
        const error = new Error('AI API key is not configured');
        error.statusCode = 500;
        throw error;
    }

    // Construct the prompt
    // We strip unnecessary fields to save tokens and focus on content
    const cleanProfile = {
        name: profile.name,
        major: profile.major,
        degree: profile.degree,
        skills: profile.skills, // Array or string
        summary: profile.summary, // Personal advantage
        work_experience_years: profile.work_experience_years,
        desired_position: profile.desired_position,
        // We'll summarize/count lists instead of sending full raw list content if it's too long, 
        // but for now let's send what we have assuming it fits in context window.
        // Usually full resume text is fine for 32k/128k context windows.
    };

    // If separate arrays are passed, include them
    const experiences = req.body.experiences || []; // Work/Project
    const educations = req.body.educations || [];

    const prompt = `
你是一个专业的HR和职业顾问。请仔细阅读以下求职者的简历信息，并按照满分100分进行打分。

求职者信息：
${JSON.stringify(cleanProfile, null, 2)}

工作/项目经历：
${JSON.stringify(experiences, null, 2)}

教育经历：
${JSON.stringify(educations, null, 2)}

请从以下几个维度进行评分：
1. 完整性：简历信息是否完整清晰。
2. 专业能力：技能和经验是否匹配其期望职位（如果有）。
3. 竞争力：在同类求职者中的预计表现。

请返回一个JSON格式的回复，不要包含Markdown格式（如 \`\`\`json），格式如下：
{
  "score": 85,
  "analysis": "简短的分析评语（100字以内），指出亮点和待改进之处。"
}
`;

    // Call AI API using native https module to avoid dependency issues
    const https = require('https');

    // Parse URL
    const urlObj = new URL(AI_API_URL);

    const requestData = JSON.stringify({
        model: 'qwen-turbo',
        messages: [
            { role: 'system', content: '你是一个专业的简历评分助手。只返回JSON格式的结果。' },
            { role: 'user', content: prompt }
        ],
        temperature: 0.3
    });

    const options = {
        hostname: urlObj.hostname,
        path: urlObj.pathname,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${AI_API_KEY}`,
            'Content-Length': Buffer.byteLength(requestData)
        },
        timeout: 30000 // 30s timeout
    };

    try {
        const makeRequest = () => new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        try {
                            const parsedData = JSON.parse(data);
                            resolve(parsedData);
                        } catch (e) {
                            reject(new Error('Invalid JSON response from AI service'));
                        }
                    } else {
                        reject(new Error(`AI API request failed with status ${res.statusCode}: ${data}`));
                    }
                });
            });

            req.on('error', (e) => {
                reject(e);
            });

            req.on('timeout', () => {
                req.destroy();
                reject(new Error('AI API request timed out'));
            });

            req.write(requestData);
            req.end();
        });

        const aiData = await makeRequest();
        const content = aiData.choices?.[0]?.message?.content || '{}';

        // Clean markdown code blocks if present
        const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim();

        let result;
        try {
            result = JSON.parse(jsonStr);
        } catch (e) {
            console.error('Failed to parse AI response:', content);
            // Fallback
            result = { score: 80, analysis: 'AI评分生成失败，请稍后重试。' };
        }

        // Persist to database if userId is provided
        const userId = req.body.userId;
        if (userId) {
            try {
                // 使用更安全的方式，先检查字段是否存在
                // 或者使用INSERT ... ON CONFLICT DO UPDATE的方式
                // 这里简化处理，直接尝试更新，如果失败就跳过
                await query(
                    `UPDATE candidates 
                     SET updated_at = CURRENT_TIMESTAMP
                     ${result.score !== undefined ? ', resume_score = $1' : ''}
                     ${result.analysis !== undefined ? ', resume_analysis = $2' : ''}
                     WHERE user_id = $${result.score !== undefined && result.analysis !== undefined ? 3 : result.score !== undefined ? 2 : result.analysis !== undefined ? 2 : 1}`,
                    [
                        ...(result.score !== undefined ? [result.score] : []),
                        ...(result.analysis !== undefined ? [result.analysis] : []),
                        userId
                    ]
                );
            } catch (dbError) {
                console.error('Failed to save score to DB:', dbError);
                // Don't fail the response if DB save fails, just log it
            }
        }

        res.json({
            status: 'success',
            data: result
        });

    } catch (error) {
        console.error('AI Scoring Error Details:', {
            message: error.message,
            stack: error.stack,
            apiKeyConfigured: !!AI_API_KEY
        });
        res.status(500).json({
            status: 'error',
            message: `AI评分服务错误: ${error.message}`,
            error: error.message
        });
    }
}));

module.exports = router;
