
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

const callQianwen = async (messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>): Promise<string> => {
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
3. 职位描述：3-5条要点
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

    // 移除AI生成内容中的可能的*符号
    const cleanedText = text.replace(/\*/g, '');

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
      hiringCount: 1,
      urgency: '普通',
      department: '相关部门',
      benefits: ['五险一金', '带薪年假', '年终奖金']
    };
  }
};

export const generateJobDescription = async (
  title: string,
  skills: string
): Promise<string> => {
  try {
    const prompt = `请以资深HR的口吻，用中文撰写职位JD：\n职位：${title}\n关键技能/要求：${skills}\n结构：\n1) 职位描述（3-5条）\n2) 任职要求（3-5条）\n3) 加分项（1-2条）\n请简洁且有吸引力。`;
    const text = await callQianwen([
      { role: 'system', content: 'You are an expert HR recruiter writing professional Chinese JD.' },
      { role: 'user', content: prompt }
    ]);
    // Fallback if AI service returns an error message or exception
    if (text && (text.startsWith('AI服务请求失败') || text.startsWith('AI服务配置错误') || text.startsWith('AI服务返回') || text.startsWith('AI服务请求异常'))) {
      const skillList = skills.split(',').map(s => s.trim()).filter(Boolean);
      const skillStr = skillList.length ? skillList.join('、') : '无特定技能要求';
      return `职位：${title}\n\n岗位职责：\n- 负责${title}相关工作，完成团队分配的任务。\n- 与团队协作，推动项目进展。\n\n任职要求：\n- 具备${skillStr}等技能。\n- 具备良好的沟通能力和团队合作精神。\n\n公司福利：提供有竞争力的薪酬福利。`;
    }
    // 移除AI生成内容中的*符号
    const cleanedText = text.replace(/\*/g, '');
    return cleanedText || 'AI 生成 JD 失败，请手动填写。';
  } catch (error) {
    console.error('JD Gen Error', error);
    // Fallback generation on exception
    const skillList = skills.split(',').map(s => s.trim()).filter(Boolean);
    const skillStr = skillList.length ? skillList.join('、') : '无特定技能要求';
    // 确保fallback生成的内容也不包含*符号
    return `职位：${title}\n\n岗位职责：\n- 负责${title}相关工作，完成团队分配的任务。\n- 与团队协作，推动项目进展。\n\n任职要求：\n- 具备${skillStr}等技能。\n- 具备良好的沟通能力和团队合作精神。\n\n公司福利：提供有竞争力的薪酬福利。`;
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
    const prompt = `你是战略招聘顾问。基于公司概况与当前招聘活动，给出2-3个应重点招聘/新开的职位方向，并提供1条提高转化的具体建议。\n公司：${company}\n在招：${activeJobs.join(', ')}\n管道：${pipelineStats}\n请用中文要点列举。`;
    const text = await callQianwen([
      { role: 'system', content: 'You are a strategic recruitment consultant.' },
      { role: 'user', content: prompt }
    ]);
    return text || "AI 暂时无法提供建议。";
  } catch (error) {
    console.error('Recruitment Suggestions Error', error);
    return "无法连接到 AI 服务。";
  }
};

export const generateAnalyticsInsight = async (
  funnelData: any[],
  timeToHire: any[],
  sourceQuality: any[],
  language: Language
): Promise<string> => {
  try {
    const context = JSON.stringify({
      funnel: funnelData,
      time_to_hire: timeToHire,
      source_quality: sourceQuality
    });

    const langInstruction = language === 'zh'
      ? '用中文输出。以专业要点列举，包含结论与建议。'
      : 'Respond in English. Use professional bullet points with conclusions and actions.';

    const prompt = `你是资深招聘数据分析顾问。请分析以下JSON：
1) 漏斗关键观察（流失阶段与转化率）
2) 招聘周期趋势与瓶颈
3) 来源质量对比与ROI提示
4) 2-3条行动建议

数据：${context}

${langInstruction} 语气：高管风格、简洁...`;
    const text = await callQianwen([
      { role: 'system', content: 'You are a senior talent analytics consultant.' },
      { role: 'user', content: prompt }
    ]);
    return text || (language === 'zh' ? '暂时无法生成分析内容。' : 'Unable to generate analytics insight.');
  } catch (error) {
    console.error('Analytics Insight Error:', error);
    return language === 'zh' ? 'AI 服务暂不可用，请稍后再试。' : 'AI service unavailable.';
  }
};

// 生成公司简介
export const generateCompanyDescription = async (
  companyName: string,
  industry: string,
  companyType: string,
  size: string
): Promise<string> => {
  try {
    const prompt = `你是专业的企业文案撰写师，请根据以下信息生成一段专业、吸引人的公司简介，长度控制在200-300字：
公司名称：${companyName}
所属行业：${industry}
公司类型：${companyType}
公司规模：${size}

要求：
1. 突出公司核心业务和优势
2. 体现行业定位和发展前景
3. 语言专业、简洁、有吸引力
4. 适合招聘平台展示，能吸引求职者
5. 避免夸张和虚假信息
6. 使用中文输出
7. 公司名称必须使用书名号《》包裹，例如：《${companyName}》`;

    const text = await callQianwen([
      { role: 'system', content: '你是专业的企业文案撰写师，擅长撰写简洁专业的公司简介。' },
      { role: 'user', content: prompt }
    ]);
    return text || '暂时无法生成公司简介，请稍后重试。';
  } catch (error) {
    console.error('Generate Company Description Error:', error);
    return 'AI服务暂不可用，请稍后重试。';
  }
};
