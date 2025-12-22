/**
 * API服务层总出口
 * 将各个模块的API统一导出，方便组件调用
 */

export * from './userService';
export * from './jobService';
export * from './companyService';
export * from './candidateService';
export * from './messageService';
export * from './applicationService';
export * from './resumeService';
export * from './aiService';
export * from './recruiterService';
export * from './interviewService';
export * from './analyticsService';
export * from './activityService';
export * from './aiSessionService';

// 为了兼容旧代码，导出具体的API对象
import { userAPI } from './userService';
import { jobAPI } from './jobService';
import { companyAPI } from './companyService';
import { candidateAPI } from './candidateService';
import { messageAPI } from './messageService';
import { applicationAPI } from './applicationService';
import { resumeAPI } from './resumeService';
import { recruiterAPI } from './recruiterService';
import { interviewAPI } from './interviewService';
import { analyticsAPI } from './analyticsService';
import { activityAPI } from './activityService';
import { aiSessionAPI } from './aiSessionService';

export {
  userAPI,
  jobAPI,
  companyAPI,
  candidateAPI,
  messageAPI,
  applicationAPI,
  resumeAPI,
  recruiterAPI,
  interviewAPI,
  analyticsAPI,
  activityAPI,
  aiSessionAPI
};
