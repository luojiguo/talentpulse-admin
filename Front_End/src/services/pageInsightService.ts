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

// 4-9. 其他页面分析函数(简化实现)
const generateApplicationsInsight = async (data: any, language: Language): Promise<string> => {
    return language === 'zh' ? '申请管理分析功能开发中...' : 'Applications analysis coming soon...';
};

const generateCandidatesInsight = async (data: any, language: Language): Promise<string> => {
    return language === 'zh' ? '候选人分析功能开发中...' : 'Candidates analysis coming soon...';
};

const generateInterviewsInsight = async (data: any, language: Language): Promise<string> => {
    return language === 'zh' ? '面试管理分析功能开发中...' : 'Interviews analysis coming soon...';
};

const generateOnboardingsInsight = async (data: any, language: Language): Promise<string> => {
    return language === 'zh' ? '入职管理分析功能开发中...' : 'Onboardings analysis coming soon...';
};

const generateCompaniesInsight = async (data: any, language: Language): Promise<string> => {
    return language === 'zh' ? '企业管理分析功能开发中...' : 'Companies analysis coming soon...';
};

const generateCertificationInsight = async (data: any, language: Language): Promise<string> => {
    return language === 'zh' ? '认证审核分析功能开发中...' : 'Certification analysis coming soon...';
};
