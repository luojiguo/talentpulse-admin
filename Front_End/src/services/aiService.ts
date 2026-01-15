import { StatMetric, ApplicationTrendData, JobCategoryData, Language } from "../types/types";

// 使用 Vite 的环境变量访问方式
// 支持多种变量名：APAKEY, QIANWEN_API_KEY, VITE_QIANWEN_API_KEY
// 注意：Vite 默认只暴露 VITE_ 开头的变量，非 VITE_ 开头的需要在 vite.config.ts 中通过 define 暴露
const QIANWEN_API_KEY = import.meta.env.APAKEY ||
  import.meta.env.QIANWEN_API_KEY ||
  import.meta.env.VITE_QIANWEN_API_KEY ||
  (import.meta.env as any).QIANWEN_API_KEY; // 备用方案
const QIANWEN_MODEL = 'qwen-turbo';
const QIANWEN_PROXY_URL = '/qianwen/compatible-mode/v1/chat/completions';
const QIANWEN_DIRECT_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

// Gemini 配置：优先使用 GEMINI_API_KEY，然后是 VITE_GEMINI_API_KEY
const GEMINI_API_KEY = import.meta.env.GEMINI_API_KEY ||
  import.meta.env.VITE_GEMINI_API_KEY ||
  (import.meta.env as any).GEMINI_API_KEY;
// 注意：Gemini API 的 REST 端点通常是 v1beta。使用 v1 很容易直接 404（路径不存在）。
const GEMINI_MODEL = import.meta.env.GEMINI_MODEL || 'gemini-1.5-flash';
const GEMINI_API_VERSION = import.meta.env.GEMINI_API_VERSION || 'v1beta';
const GEMINI_EXPLICIT_API_URL =
  import.meta.env.GEMINI_API_URL || import.meta.env.VITE_GEMINI_API_URL || '';

const buildGeminiBaseUrl = (model: string, version: string) =>
  `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent`;

const uniq = <T,>(arr: T[]) => Array.from(new Set(arr));

/**
 * 清理AI生成内容中的占位符号和优化排版
 * 移除 {""}, {}, *, 等AI识别生成的符号,并优化换行和格式
 */
const cleanAIGeneratedContent = (text: string): string => {
  if (!text) return text;

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

export const callQianwen = async (messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>): Promise<string> => {
  try {
    // Check if API key is set
    if (!QIANWEN_API_KEY || QIANWEN_API_KEY === '') {
      console.error('Qianwen API Key is not set. Current env values:', {
        APAKEY: import.meta.env.APAKEY,
        QIANWEN_API_KEY: import.meta.env.QIANWEN_API_KEY,
        VITE_QIANWEN_API_KEY: import.meta.env.VITE_QIANWEN_API_KEY,
        allEnv: Object.keys(import.meta.env).filter(k => k.includes('API') || k.includes('KEY'))
      });
      return 'AI服务配置错误，请检查API密钥。请在项目根目录的 .env.local 文件中设置 QIANWEN_API_KEY 或 VITE_QIANWEN_API_KEY，然后重启开发服务器。';
    }

    const apiUrl = import.meta.env.QIANWEN_API_URL || import.meta.env.VITE_QIANWEN_API_URL || QIANWEN_PROXY_URL;
    const urlsToTry = [apiUrl];

    // 当代理不可用或返回 5xx 时，降级为直连官方接口
    if (apiUrl !== QIANWEN_DIRECT_URL) {
      urlsToTry.push(QIANWEN_DIRECT_URL);
    }

    let lastError: any = null;

    for (const url of urlsToTry) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${QIANWEN_API_KEY}`
          },
          body: JSON.stringify({
            model: QIANWEN_MODEL,
            messages
          })
        });

        const payload = await res.json().catch(() => ({}));

        if (!res.ok) {
          lastError = { status: res.status, statusText: res.statusText, data: payload, url };
          console.error('Qianwen API Error:', lastError);

          // 仅在代理地址且出现 5xx/404 时尝试直连
          const canFallback = url !== QIANWEN_DIRECT_URL && (res.status >= 500 || res.status === 404);
          if (canFallback) {
            console.warn('Retrying Qianwen request via direct endpoint after proxy failure');
            continue;
          }

          const detail = payload?.message || payload?.error?.message;
          return `AI服务请求失败 (${res.status}): ${res.statusText}${detail ? ` - ${detail}` : ''}`;
        }

        // Check if data is valid
        if (!payload || !Array.isArray(payload.choices) || payload.choices.length === 0) {
          console.error('Invalid Qianwen API Response:', payload);
          return 'AI服务返回格式错误。';
        }

        const content = payload.choices[0]?.message?.content;
        if (typeof content === 'string') return content;
        if (Array.isArray(content)) return content.map((c: any) => c?.text ?? '').join('\n');
        return 'AI服务返回内容为空。';
      } catch (e) {
        lastError = { url, error: e };
        console.error('Qianwen Request Error:', e);

        // 如果还有备用地址可试，继续循环
        const hasMore = url !== urlsToTry[urlsToTry.length - 1];
        if (hasMore) continue;
        return `AI服务请求异常: ${(e as Error).message}`;
      }
    }

    // 理论上不会走到这里，但兜底返回更友好的错误
    const statusText = lastError?.statusText || 'Unknown error';
    return `AI服务请求失败：${statusText}`;
  } catch (e) {
    console.error('Qianwen Request Error:', e);
    return `AI服务请求异常: ${(e as Error).message}`;
  }
};

const callGemini = async (prompt: string): Promise<string> => {
  try {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === '') {
      console.error('Gemini API Key is not set.', {
        hasGEMINI_API_KEY: Boolean(import.meta.env.GEMINI_API_KEY),
        hasVITE_GEMINI_API_KEY: Boolean(import.meta.env.VITE_GEMINI_API_KEY)
      });
      return 'AI服务配置错误（Gemini），请检查 GEMINI_API_KEY 或 VITE_GEMINI_API_KEY。';
    }

    const modelCandidates = uniq(
      [
        GEMINI_MODEL,
        // 常见坑：有些环境下 gemini-*-latest 不是合法 model id，会返回 404（Model not found）
        GEMINI_MODEL.replace(/-latest$/i, '')
      ].filter(Boolean)
    );
    const versionCandidates = uniq([GEMINI_API_VERSION, 'v1beta', 'v1'].filter(Boolean));

    const baseCandidates: string[] = [];
    if (GEMINI_EXPLICIT_API_URL) baseCandidates.push(GEMINI_EXPLICIT_API_URL);
    for (const version of versionCandidates) {
      for (const model of modelCandidates) {
        baseCandidates.push(buildGeminiBaseUrl(model, version));
      }
    }

    let lastError: any = null;

    for (const base of uniq(baseCandidates)) {
      const url = `${base}?key=${GEMINI_API_KEY}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        lastError = { status: res.status, statusText: res.statusText, data: payload, url: base };
        // 404：优先认为是 endpoint 版本或 model 不存在，继续尝试其它候选组合
        if (res.status === 404) {
          console.warn('Gemini endpoint/model returned 404, retrying with fallback', { base });
          continue;
        }

        console.error('Gemini API Error:', { status: res.status, statusText: res.statusText, data: payload, base });
        const detail = payload?.error?.message || payload?.message;
        return `AI服务请求失败 (Gemini ${res.status}): ${res.statusText || ''}${detail ? ` - ${detail}` : ''}`;
      }

      const parts = payload?.candidates?.[0]?.content?.parts;
      if (!Array.isArray(parts) || parts.length === 0) {
        console.error('Invalid Gemini API Response:', payload);
        return 'AI服务返回格式错误。';
      }

      const text = parts
        .map((p: any) => p?.text ?? '')
        .filter(Boolean)
        .join('\n')
        .trim();

      return text || 'AI服务返回内容为空。';
    }

    // 所有候选地址都失败
    const detail = lastError?.data?.error?.message || lastError?.data?.message;
    return `AI服务请求失败 (Gemini): ${lastError?.status || 'unknown'}${detail ? ` - ${detail}` : ''}`;
  } catch (e) {
    console.error('Gemini Request Error:', e);
    return `AI服务请求异常 (Gemini): ${(e as Error).message}`;
  }
};

export const generateDashboardInsight = async (
  stats: StatMetric[],
  trends: ApplicationTrendData[],
  categories: JobCategoryData[],
  language: Language
): Promise<string> => {
  try {
    const dataContext = JSON.stringify({
      key_metrics: stats,
      recent_trends_sample: trends.slice(-3), // Last 3 items
      category_distribution: categories
    });

    const langInstruction = language === 'zh'
      ? '请使用中文输出，并以专业要点列举。'
      : 'Respond in English using professional bullet points.';

    const userPrompt = `你是招聘平台的高级数据分析师。请基于以下 JSON 数据生成不超过150字的管理层摘要：\n1) 平台健康度概览\n2) 一个积极趋势\n3) 一个需要关注的薄弱环节\n\n数据：${dataContext}\n\n${langInstruction} 语气：专业、可执行、面向管理层。`;
    const text = await callQianwen([
      { role: 'system', content: 'You are a senior recruitment data analyst.' },
      { role: 'user', content: userPrompt }
    ]);
    return text || (language === 'zh' ? '暂时无法生成分析报告。' : 'Unable to generate insights at this time.');
  } catch (error) {
    console.error('Error generating AI insight:', error);
    throw error;
  }
};

export const chatWithCandidateAI = async (
  message: string,
  userContext: string
): Promise<string> => {
  try {
    const systemPrompt = `你是专业的求职顾问与岗位推荐助手。基于用户职业信息（${userContext}）与提问进行中文的简洁专业回复；如需岗位推荐，请结合技能与城市。`;
    // 先尝试 Qianwen
    const qianwenText = await callQianwen([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ]);

    const isQianwenError =
      !qianwenText ||
      qianwenText.startsWith('AI服务请求失败') ||
      qianwenText.startsWith('AI服务配置错误') ||
      qianwenText.startsWith('AI服务返回') ||
      qianwenText.startsWith('AI服务请求异常') ||
      qianwenText.startsWith('网络请求失败');

    if (!isQianwenError) {
      return qianwenText;
    }

    // Qianwen 不可用时，回退到 Gemini
    const geminiPrompt = `${systemPrompt}\n用户提问：${message}`;
    const geminiText = await callGemini(geminiPrompt);

    const isGeminiError =
      !geminiText ||
      geminiText.startsWith('AI服务请求失败') ||
      geminiText.startsWith('AI服务配置错误') ||
      geminiText.startsWith('AI服务返回') ||
      geminiText.startsWith('AI服务请求异常');

    if (!isGeminiError) {
      return geminiText;
    }

    return qianwenText || geminiText || '抱歉，AI助手暂时无法回复。';
  } catch (error) {
    console.error('Qianwen Chat Error:', error);
    return `网络请求失败，请稍后再试: ${(error as Error).message}`;
  }
}

// 生成完整的职位信息，包括所有字段
export const generateFullJobInfo = async (
  title: string
): Promise<{
  location: string;
  salary: string;
  description: string;
  skills: string[];
  preferredSkills: string[];
  experience: string;
  degree: string;
  type: string;
  workMode: string;
  jobLevel: string;
  hiringCount: number;
  urgency: string;
  department: string;
  benefits: string[];
}> => {
  try {
    const prompt = `请以资深HR的口吻，根据职位名称"${title}"生成完整的职位信息，包括：
1. 工作地点：例如：深圳
2. 薪资范围：例如：15-25K
3. 职位描述：3-5条要点（不要在描述中包含职位名称标题）
4. 所需技能：3-5个核心技能，以数组形式返回
5. 优先技能：2-3个优先技能，以数组形式返回
6. 经验要求：例如：1-3年
7. 学历要求：例如：本科
8. 职位类型：例如：全职
9. 工作模式：例如：现场
10. 职位级别：例如：初级
11. 招聘人数：例如：1
12. 紧急程度：例如：普通
13. 部门：例如：技术部
14. 公司福利：3-5个福利，以数组形式返回

请严格按照以下JSON格式返回，不要添加任何额外的解释或说明，确保JSON格式正确：
{
  "location": "",
  "salary": "",
  "description": "",
  "skills": [],
  "preferredSkills": [],
  "experience": "",
  "degree": "",
  "type": "",
  "workMode": "",
  "jobLevel": "",
  "hiringCount": 1,
  "urgency": "",
  "department": "",
  "benefits": []
}

生成的内容要专业、符合实际招聘需求，薪资范围和经验要求要合理匹配职位名称。`;

    const text = await callQianwen([
      { role: 'system', content: 'You are an expert HR recruiter providing complete professional job information in Chinese.' },
      { role: 'user', content: prompt }
    ]);

    // 清理AI生成内容中的占位符号
    const cleanedText = cleanAIGeneratedContent(text);

    // 解析JSON响应
    const jobInfo = JSON.parse(cleanedText);

    return jobInfo;
  } catch (error) {
    console.error('生成完整职位信息失败:', error);
    // 返回默认值
    return {
      location: '深圳',
      salary: '15-25K',
      description: `岗位职责：\n- 负责${title}相关工作，完成团队分配的任务。\n- 与团队协作，推动项目进展。\n\n任职要求：\n- 具备相关专业知识和技能。\n- 具备良好的沟通能力和团队合作精神。`,
      skills: ['相关技能1', '相关技能2', '相关技能3'],
      preferredSkills: ['优先技能1', '优先技能2'],
      experience: '1-3年',
      degree: '本科',
      type: '全职',
      workMode: '现场',
      jobLevel: '初级',
      urgency: '普通',
      department: '相关部门',
      hiringCount: 1,
      benefits: ['五险一金', '带薪年假', '年终奖金']
    };
  }
};

export const generateJobDescription = async (
  title: string,
  skills: string
): Promise<string> => {
  try {
    const prompt = `请以资深HR的口吻，用中文撰写职位JD：\n职位：${title}\n关键技能/要求：${skills}\n\n要求：\n1. 不要重复标题（职位名称）。\n2. 直接输出职位描述内容。\n3. 结构：\n   - 职位描述（3-5条）\n   - 任职要求（3-5条）\n   - 加分项（1-2条）\n请简洁且有吸引力。`;
    const text = await callQianwen([
      { role: 'system', content: 'You are an expert HR recruiter writing professional Chinese JD. Do not include the job title in the response. Start directly with the description sections.' },
      { role: 'user', content: prompt }
    ]);
    // Fallback if AI service returns an error message or exception
    if (text && (text.startsWith('AI服务请求失败') || text.startsWith('AI服务配置错误') || text.startsWith('AI服务返回') || text.startsWith('AI服务请求异常'))) {
      const skillList = skills.split(',').map(s => s.trim()).filter(Boolean);
      const skillStr = skillList.length ? skillList.join('、') : '无特定技能要求';
      return `职位名称: ${title}\n\n职位描述:\n- 负责${title}相关工作，完成团队分配的任务。\n- 与团队协作，推动项目进展。\n\n任职要求:\n- 具备${skillStr}等技能。\n- 具备良好的沟通能力和团队合作精神。\n\n公司福利: 提供有竞争力的薪酬福利。`;
    }
    // 清理AI生成内容中的占位符号
    const cleanedText = cleanAIGeneratedContent(text);
    return cleanedText || 'AI 生成 JD 失败，请手动填写。';
  } catch (error) {
    console.error('JD Gen Error', error);
    // Fallback generation on exception
    const skillList = skills.split(',').map(s => s.trim()).filter(Boolean);
    const skillStr = skillList.length ? skillList.join('、') : '无特定技能要求';
    // 确保fallback生成的内容也不包含*符号
    return `职位名称: ${title}\n\n职位描述:\n- 负责${title}相关工作，完成团队分配的任务。\n- 与团队协作，推动项目进展。\n\n任职要求:\n- 具备${skillStr}等技能。\n- 具备良好的沟通能力和团队合作精神。\n\n公司福利: 提供有竞争力的薪酬福利。`;
  }
};

// --- New AI Features for Candidate ---

export const optimizeResumeDescription = async (
  originalText: string,
  position: string
): Promise<string> => {
  try {
    const prompt = `你是专业的简历顾问。请基于STAR法则优化与改写以下与“${position}”相关的经历描述，使其更专业、强调成果，控制在3-4条要点：\n\n原文：${originalText}`;
    const text = await callQianwen([
      { role: 'system', content: 'You are a professional resume writer using the STAR method.' },
      { role: 'user', content: prompt }
    ]);
    return text || originalText;
  } catch (error) {
    console.error('Resume Optimize Error', error);
    return originalText;
  }
};

export const generateInterviewFeedback = async (
  jobTitle: string,
  history: { role: string, text: string }[]
): Promise<string> => {
  try {
    const sys = 'You are an expert interviewer. Provide Chinese feedback and next question.';
    const msgs: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: sys },
      { role: 'user', content: `职位：${jobTitle}\n历史：${JSON.stringify(history)}` }
    ];
    const text = await callQianwen(msgs);
    return text || "面试官正在思考下一题...";
  } catch (error) {
    console.error('Mock Interview Error', error);
    return "网络连接不稳定，请重试。";
  }
};

export const generateRecruitmentSuggestions = async (
  company: string,
  activeJobs: string[],
  pipelineStats: string
): Promise<string> => {
  try {
    const prompt = `你是战略招聘顾问。基于公司概况与当前招聘活动，给出2-3个应重点招聘/新开的职位方向，并提供1条提高转化的具体建议。\n公司：${company}\n在招：${activeJobs.join(', ')}\n管道：${pipelineStats}\n请用中文要点列举。不要使用任何 Markdown 格式符号（如 **、##、*、# 等），只输出纯文本内容。`;
    const text = await callQianwen([
      { role: 'system', content: 'You are a strategic recruitment consultant.' },
      { role: 'user', content: prompt }
    ]);
    return cleanAIGeneratedContent(text) || "AI 暂时无法提供建议。";
  } catch (error) {
    console.error('Recruitment Suggestions Error', error);
    return "无法连接到 AI 服务。";
  }
};

export const generateAnalyticsInsight = async (
  funnelData: any[],
  timeToHire: any[],
  sourceQuality: any[],
  language: Language,
  additionalData?: {
    stats?: any;
    competitionData?: any[];
    topCompaniesData?: any[];
    categories?: any[];
  }
): Promise<string> => {
  try {
    // 构建更完整的上下文数据
    const context: any = {
      funnel: funnelData,
      time_to_hire: timeToHire,
      source_quality: sourceQuality
    };

    // 添加额外数据
    if (additionalData) {
      if (additionalData.stats) {
        context.overview = {
          total_users: additionalData.stats.totalUsers,
          active_jobs: additionalData.stats.activeJobs,
          applications: additionalData.stats.applications,
          hired: additionalData.stats.hired
        };
      }
      if (additionalData.competitionData && additionalData.competitionData.length > 0) {
        context.job_competition = additionalData.competitionData;
      }
      if (additionalData.topCompaniesData && additionalData.topCompaniesData.length > 0) {
        context.top_companies = additionalData.topCompaniesData;
      }
      if (additionalData.categories && additionalData.categories.length > 0) {
        context.job_categories = additionalData.categories;
      }
    }

    const langInstruction = language === 'zh'
      ? '用中文输出,不要使用任何Markdown格式符号(如**、##、`等),只输出纯文本。使用简洁的要点列举,每个要点用"•"开头。'
      : 'Respond in English. Do not use any Markdown formatting (**, ##, `, etc), output plain text only. Use concise bullet points starting with "•".';

    const prompt = `你是资深招聘数据分析顾问。请基于当前数据分析页面的数据,提供专业洞察:

数据概览:${context.overview ? `
• 总用户数: ${context.overview.total_users}
• 在招职位: ${context.overview.active_jobs}
• 收到简历: ${context.overview.applications}
• 成功录用: ${context.overview.hired}` : ''}

招聘漏斗数据: ${JSON.stringify(context.funnel)}
${context.job_competition ? `职位竞争度: ${JSON.stringify(context.job_competition)}` : ''}
${context.top_companies ? `Top招聘公司: ${JSON.stringify(context.top_companies)}` : ''}
${context.source_quality ? `渠道质量: ${JSON.stringify(context.source_quality)}` : ''}

请提供:
1. 当前招聘数据的关键发现(2-3条)
2. 存在的问题或风险点(1-2条)
3. 具体可执行的优化建议(2-3条)

${langInstruction} 语气要专业、简洁、直接,适合高管阅读。`;

    const text = await callQianwen([
      { role: 'system', content: 'You are a senior talent analytics consultant. Provide insights in plain text without any markdown formatting.' },
      { role: 'user', content: prompt }
    ]);
    return text || (language === 'zh' ? '暂时无法生成分析内容。' : 'Unable to generate analytics insight.');
  } catch (error) {
    console.error('Analytics Insight Error:', error);
    return language === 'zh' ? 'AI 服务暂不可用,请稍后再试。' : 'AI service unavailable.';
  }
};

// 生成公司简介
export const generateCompanyDescription = async (
  companyName: string,
  industry: string,
  companyType: string,
  size: string,
  keywords: string = '',
  style: string = '专业'
): Promise<string> => {
  try {
    const stylePrompts: Record<string, string> = {
      '专业': '语言专业、严谨、沉稳，强调商业价值和行业地位。',
      '科技': '富有科技感、前瞻性，强调技术创新、研发实力和数字化转型。',
      '活力': '充满激情、活力和亲和力，强调团队氛围、成长空间和创新文化。',
      '简洁': '干练简练，直击重点，适合追求效率的求职者。',
      '创意': '独特新颖，富有感染力，展现公司的独特性和文化底蕴。'
    };

    const selectedStylePrompt = stylePrompts[style] || stylePrompts['专业'];

    const prompt = `你是专业的企业文案撰写师，请根据以下信息生成一段高质量的公司简介（约200-300字）：

【基础信息】
公司名称：${companyName}
所属行业：${industry}
公司类型：${companyType}
公司规模：${size}

【附加上下文】
核心关键词：${keywords || '未提供'}
文案风格要求：${style}（${selectedStylePrompt}）

【写作要求】
1. 核心业务：清晰定义公司的主营业务与市场核心竞争力。
2. 行业视野：体现公司在 ${industry} 行业中的定位、贡献或发展动能。
3. 吸引力：语言优美且真实，能激发起中高级人才加盟的兴趣。
4. 规范性：使用简体中文。公司名称首次出现时必须使用书名号《》包裹，例如：《${companyName}》。
5. 结果纯净：只返回生成的简介文本，不要包含任何如“好的，这是为您生成的...”或“总结：”之类的提示语。

请开始撰写：`;

    const text = await callQianwen([
      { role: 'system', content: '你是专业的企业文案撰写师，擅长根据不同风格和关键词撰写高度定制化的公司简介。' },
      { role: 'user', content: prompt }
    ]);

    // 清理可能存在的 AI 提示性文字前缀
    let cleanedText = text.replace(/^(好的|当然|为您生成|以下是|简介如下)[:：\n\s]*/, '').trim();

    return cleanedText || '暂时无法生成公司简介，请稍后重试。';
  } catch (error) {
    console.error('Generate Company Description Error:', error);
    return 'AI服务暂不可用，请稍后重试。';
  }
};
