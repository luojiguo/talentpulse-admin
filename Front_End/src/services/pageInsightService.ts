import { callQianwen, generateAnalyticsInsight } from './aiService';
import { Language } from '../types/types';

// 页面类型定义
export type PageType =
    | 'analytics'
    | 'notifications'
    | 'users'
    | 'jobs'
    | 'applications'
    | 'candidates'
    | 'interviews'
    | 'onboardings'
    | 'companies'
    | 'certifications'
    | 'settings'
    | 'logs';

// 通用AI分析函数 - 根据页面类型路由到对应的分析函数
export const generatePageInsight = async (
    pageType: PageType,
    pageData: any,
    language: Language
): Promise<string> => {
    try {
        let result = '';

        switch (pageType) {
            case 'analytics':
                result = await generateAnalyticsInsight(
                    pageData.funnelData || [],
                    pageData.trends || [],
                    pageData.sourceQuality || [],
                    language,
                    pageData.additionalData
                );
                break;

            case 'notifications':
                result = await generateNotificationsInsight(pageData, language);
                break;

            case 'users':
                result = await generateUsersInsight(pageData, language);
                break;

            case 'jobs':
                result = await generateJobsInsight(pageData, language);
                break;

            case 'applications':
                result = await generateApplicationsInsight(pageData, language);
                break;

            case 'candidates':
                result = await generateCandidatesInsight(pageData, language);
                break;

            case 'interviews':
                result = await generateInterviewsInsight(pageData, language);
                break;

            case 'onboardings':
                result = await generateOnboardingsInsight(pageData, language);
                break;

            case 'companies':
                result = await generateCompaniesInsight(pageData, language);
                break;

            case 'certifications':
                result = await generateCertificationInsight(pageData, language);
                break;

            default:
                result = language === 'zh'
                    ? '该页面暂不支持AI分析。'
                    : 'AI analysis not available for this page.';
        }

        // 统一清理Markdown格式
        return cleanMarkdownFormat(result);
    } catch (error) {
        console.error('Page Insight Error:', error);
        return language === 'zh' ? 'AI服务暂不可用,请稍后再试。' : 'AI service unavailable.';
    }
};

// 清理Markdown格式符号
const cleanMarkdownFormat = (text: string): string => {
    return text
        .replace(/#{1,6}\s/g, '') // 去除标题符号
        .replace(/\*\*(.+?)\*\*/g, '$1') // 去除粗体
        .replace(/\*(.+?)\*/g, '$1') // 去除斜体
        .replace(/`(.+?)`/g, '$1') // 去除代码符号
        .replace(/^\s*[-*+]\s/gm, '• ') // 统一列表符号
        .trim();
};

// ============ 页面专属分析函数 ============

// 1. 通知页面分析
const generateNotificationsInsight = async (
    data: any,
    language: Language
): Promise<string> => {
    const { notifications = [], unreadCount = 0, totalCount = 0 } = data;

    const langInstruction = language === 'zh'
        ? '用中文输出,不使用Markdown格式,用"•"开头列举要点。'
        : 'Respond in English, plain text only, use "•" for bullet points.';

    const prompt = `你是系统通知管理专家。分析以下通知数据:

未读通知: ${unreadCount}
总通知数: ${totalCount}
通知列表: ${JSON.stringify(notifications.slice(0, 10))}

请提供:
1. 通知数据关键发现(2-3条)
2. 用户互动情况分析
3. 通知优化建议(2条)

${langInstruction} 语气专业简洁。`;

    return await callQianwen([
        { role: 'system', content: 'You are a notification system expert. Provide plain text insights.' },
        { role: 'user', content: prompt }
    ]) || (language === 'zh' ? '暂无分析内容。' : 'No insights available.');
};

// 2. 用户管理分析
const generateUsersInsight = async (
    data: any,
    language: Language
): Promise<string> => {
    const { users = [], totalUsers = 0, roleDistribution = {}, recentGrowth = 0 } = data;

    const langInstruction = language === 'zh'
        ? '用中文输出,不使用Markdown格式,用"•"开头列举要点。'
        : 'Respond in English, plain text only, use "•" for bullet points.';

    const prompt = `你是用户管理专家。分析以下用户数据:

总用户数: ${totalUsers}
角色分布: ${JSON.stringify(roleDistribution)}
近期增长: ${recentGrowth}
用户样本: ${JSON.stringify(users.slice(0, 10))}

请提供:
1. 用户增长趋势分析(2条)
2. 角色分布特征
3. 用户管理建议(2-3条)

${langInstruction} 语气专业简洁。`;

    return await callQianwen([
        { role: 'system', content: 'You are a user management expert. Provide plain text insights.' },
        { role: 'user', content: prompt }
    ]) || (language === 'zh' ? '暂无分析内容。' : 'No insights available.');
};

// 3. 职位管理分析
const generateJobsInsight = async (
    data: any,
    language: Language
): Promise<string> => {
    const { jobs = [], activeJobs = 0, totalApplications = 0, avgApplicationsPerJob = 0 } = data;

    const langInstruction = language === 'zh'
        ? '用中文输出,不使用Markdown格式,用"•"开头列举要点。'
        : 'Respond in English, plain text only, use "•" for bullet points.';

    const prompt = `你是招聘职位管理专家。分析以下职位数据:

在招职位: ${activeJobs}
总申请数: ${totalApplications}
平均每职位申请数: ${avgApplicationsPerJob}
职位样本: ${JSON.stringify(jobs.slice(0, 10))}

请提供:
1. 职位发布效果分析(2条)
2. 热门职位识别
3. 职位优化建议(2-3条)

${langInstruction} 语气专业简洁。`;

    return await callQianwen([
        { role: 'system', content: 'You are a job posting expert. Provide plain text insights.' },
        { role: 'user', content: prompt }
    ]) || (language === 'zh' ? '暂无分析内容。' : 'No insights available.');
};

// 4. 申请管理分析
const generateApplicationsInsight = async (data: any, language: Language): Promise<string> => {
    const { applications = [] } = data;
    const total = applications.length;
    const langInstruction = language === 'zh'
        ? '用中文输出,不使用Markdown格式,用"•"开头列举要点。'
        : 'Respond in English, plain text only, use "•" for bullet points.';
    const prompt = `你是招聘申请管理数据专家。分析以下求职申请数据:\n总申请数: ${total}\n申请样本: ${JSON.stringify(applications.slice(0, 10))}\n\n请提供:\n1. 申请转化与匹配度分析(2条)\n2. 申请处理效率建议\n3. 面试转化优化建议\n\n${langInstruction} 语气专业简洁。`;
    return await callQianwen([
        { role: 'system', content: 'You are an application management expert. Provide plain text insights.' },
        { role: 'user', content: prompt }
    ]) || (language === 'zh' ? '暂无分析内容。' : 'No insights available.');
};

// 5. 候选人库分析
const generateCandidatesInsight = async (data: any, language: Language): Promise<string> => {
    const { candidates = [] } = data;
    const total = candidates.length;
    const langInstruction = language === 'zh'
        ? '用中文输出,不使用Markdown格式,用"•"开头列举要点。'
        : 'Respond in English, plain text only, use "•" for bullet points.';
    const prompt = `你是人才库管理专家。分析以下候选人数据:\n总人数: ${total}\n候选人样本: ${JSON.stringify(candidates.slice(0, 10))}\n\n请提供:\n1. 人才库质量和经验标签分布(2条)\n2. 候选人活跃度分析\n3. 盘活人才库的建议(2条)\n\n${langInstruction} 语气专业简洁。`;
    return await callQianwen([
        { role: 'system', content: 'You are a talent pool management expert. Provide plain text insights.' },
        { role: 'user', content: prompt }
    ]) || (language === 'zh' ? '暂无分析内容。' : 'No insights available.');
};

// 6. 面试管理分析
const generateInterviewsInsight = async (data: any, language: Language): Promise<string> => {
    const { interviews = [] } = data;
    const total = interviews.length;
    const langInstruction = language === 'zh'
        ? '用中文输出,不使用Markdown格式,用"•"开头列举要点。'
        : 'Respond in English, plain text only, use "•" for bullet points.';
    const prompt = `你是面试流程优化专家。分析以下面试安排数据:\n总面试数: ${total}\n面试样本: ${JSON.stringify(interviews.slice(0, 10))}\n\n请提供:\n1. 面试流转效率分析(2条)\n2. 面试官负载状况评估\n3. 面试通过率及建议(2条)\n\n${langInstruction} 语气专业简洁。`;
    return await callQianwen([
        { role: 'system', content: 'You are an interview process expert. Provide plain text insights.' },
        { role: 'user', content: prompt }
    ]) || (language === 'zh' ? '暂无分析内容。' : 'No insights available.');
};

// 7. 入职管理分析
const generateOnboardingsInsight = async (data: any, language: Language): Promise<string> => {
    const { onboardings = [] } = data;
    const total = onboardings.length;
    const langInstruction = language === 'zh'
        ? '用中文输出,不使用Markdown格式,用"•"开头列举要点。'
        : 'Respond in English, plain text only, use "•" for bullet points.';
    const prompt = `你是新员工体验与入职管理专家。分析以下入职数据:\n总入职记录: ${total}\n入职样本: ${JSON.stringify(onboardings.slice(0, 10))}\n\n请提供:\n1. 员工入职效率评估(2条)\n2. 资料提交与合规预警\n3. 改善新员工体验的建议(2条)\n\n${langInstruction} 语气专业简洁。`;
    return await callQianwen([
        { role: 'system', content: 'You are an onboarding process expert. Provide plain text insights.' },
        { role: 'user', content: prompt }
    ]) || (language === 'zh' ? '暂无分析内容。' : 'No insights available.');
};

// 8. 合作企业分析
const generateCompaniesInsight = async (data: any, language: Language): Promise<string> => {
    const { companies = [] } = data;
    const total = companies.length;
    const langInstruction = language === 'zh'
        ? '用中文输出,不使用Markdown格式,用"•"开头列举要点。'
        : 'Respond in English, plain text only, use "•" for bullet points.';
    const prompt = `你是企业客户成功运营专家。分析以下入驻企业数据:\n合作企业总数: ${total}\n企业样本: ${JSON.stringify(companies.slice(0, 10))}\n\n请提供:\n1. 企业入驻活跃度与行业特征(2条)\n2. 招聘需求特征画像\n3. 提升B端企业生态留存的建议(2条)\n\n${langInstruction} 语气专业简洁。`;
    return await callQianwen([
        { role: 'system', content: 'You are a B2B enterprise success expert. Provide plain text insights.' },
        { role: 'user', content: prompt }
    ]) || (language === 'zh' ? '暂无分析内容。' : 'No insights available.');
};

// 9. 认证审核分析
const generateCertificationInsight = async (data: any, language: Language): Promise<string> => {
    const { certifications = [] } = data;
    const total = certifications.length;
    const langInstruction = language === 'zh'
        ? '用中文输出,不使用Markdown格式,用"•"开头列举要点。'
        : 'Respond in English, plain text only, use "•" for bullet points.';
    const prompt = `你是企业风控合规专家。分析以下资质认证审核数据:\n待处理认证总数: ${total}\n审核样本: ${JSON.stringify(certifications.slice(0, 10))}\n\n请提供:\n1. 企业认证效率及审核压力(2条)\n2. 常见企业卡点分析\n3. 风控审核流程优化建议(2条)\n\n${langInstruction} 语气专业简洁。`;
    return await callQianwen([
        { role: 'system', content: 'You are a compliance risk expert. Provide plain text insights.' },
        { role: 'user', content: prompt }
    ]) || (language === 'zh' ? '暂无分析内容。' : 'No insights available.');
};
