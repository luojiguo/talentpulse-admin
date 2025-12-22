

export type Language = 'zh' | 'en';
export type UserRole = 'admin' | 'recruiter' | 'candidate';

export interface StatMetric {
  id: string;
  label: string;
  value: string | number;
  change: number; // percentage
  trend: 'up' | 'down' | 'neutral';
  icon: string;
}

export interface JobCategoryData {
  name: string;
  value: number;
  color: string;
  [key: string]: any;
}

export interface ApplicationTrendData {
  name: string;
  applications: number;
  interviews: number;
  hires: number;
  [key: string]: any;
}

export interface RecentActivity {
  id: string;
  user: string;
  action: string;
  target: string;
  timestamp: string;
  status: 'pending' | 'success' | 'warning' | 'neutral';
}

export enum InsightStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

// System User Management Type
export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'Active' | 'Inactive' | 'Suspended';
  lastLogin: string;
  avatar?: string;
  createdAt: string;
  // 个人基本信息
  phone?: string;
  gender?: string;
  birthDate?: string;
  education?: string;
  major?: string;
  school?: string;
  graduationYear?: string;
  // 职业信息
  workExperienceYears?: number;
  desiredPosition?: string;
  skills?: string[];
  languages?: string[];
  // 联系与社交信息
  address?: string;
  wechat?: string;
  linkedin?: string;
  github?: string;
  personalWebsite?: string;
  // 系统信息
  emailVerified?: boolean;
  phoneVerified?: boolean;
  resumeCompleteness?: number;
}

// Candidate & Shared Types

export interface Candidate {
  id: string;
  name: string;
  role: string;
  experience: string;
  status: 'Available' | 'Hired' | 'Interviewing';
  location: string;
  skills: string[];
  avatar: string;
}

// Recruiter Pipeline Type
export interface PipelineCandidate extends Candidate {
  appliedDate: string;
  appliedJobId: number | string;
  matchScore: number; // 0-100
  stage: 'New' | 'Screening' | 'Interview' | 'Offer' | 'Rejected' | 'Hired';
  interviewDate?: string;
  interviewTime?: string;
  interviewLocation?: string;
  onboardingDate?: string;
  onboardingStatus?: 'Scheduled' | 'Completed' | 'Pending';
}

export interface JobPosting {
  id: string | number;
  title: string;
  company?: string;
  company_name?: string;
  department?: string;
  location: string;
  salary: string;
  description?: string;
  type: string;
  experience?: string;
  degree?: string;
  work_mode?: string; // '现场' | '远程' | '混合'
  job_level?: string; // '初级' | '中级' | '高级' | '管理'
  posterId?: number | string;
  applicants: number;
  status: 'Active' | 'Closed' | 'Draft';
  postedDate: string;
  updated_at?: string;
  required_skills?: string[];
  preferred_skills?: string[];
  benefits?: string[];
  company_id?: number;
  recruiter_name?: string;
  recruiter_avatar?: string;
  recruiter_position?: string;
  recruiter_id?: number;
  is_own_job?: boolean;
  // Additional fields used in recruiter module
  hiring_count?: number;
  urgency?: string;
  expire_date?: string;
}

export interface Company {
  id: number | string;
  name: string;
  industry: string;
  size: string;
  logo: string;
  // --- Fields for Admin View ---
  status: 'Verified' | 'Pending' | 'Rejected';
  location: string;
  hrCount: number;
  jobCount: number;
  createdAt: string;
}

export interface Recruiter {
  id: number | string;
  name: string;
  company: string;
  role: string;
  avatar: string;
}

export interface Message {
  id: number | string;
  role: 'user' | 'ai' | 'system';
  type: 'text' | 'image' | 'location' | 'system';
  text: string;
  time: string;
  sender_id?: number | string;
  receiver_id?: number | string;
  sender_name?: string;
  sender_avatar?: string;
  status?: string;
}

export interface Conversation {
  id: string;
  jobId: string | number;
  candidateId: string | number;
  recruiterId: string | number;
  lastMessage: string;
  lastTime: string;
  unreadCount: number;
  isActive: boolean;
  totalMessages: number;
  candidateUnread: number;
  recruiterUnread: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
  // 关联信息
  job_title: string;
  company_name: string;
  candidate_name: string;
  candidate_avatar: string;
  recruiter_name: string;
  recruiter_avatar: string;
}

export interface UserProfile {
  id: string | number;
  name: string;
  phone: string;
  email: string;
  city: string;
  expectedSalary: string;
  jobStatus: string;
  bio: string;
  experience?: string;
  avatar?: string;
  // Extended fields
  gender?: string;
  birth_date?: string;
  education?: string;
  major?: string;
  school?: string;
  graduation_year?: string;
  work_experience_years?: number;
  desired_position?: string;
  skills?: string[];
  languages?: string[];
  wechat?: string;
  linkedin?: string;
  github?: string;
  personal_website?: string;
  job_type_preference?: string | string[];
  work_mode_preference?: string | string[];
  industry_preference?: string | string[];
  location_preference?: string | string[];
  current_salary?: string;
  salary_negotiable?: boolean;
  notice_period?: string;
  can_start_date?: string;
  career_goal?: string;
}

export interface Resume {
  education: Array<{ school: string; major: string; degree: string; years: string }>;
  workExperience: Array<{ company: string; position: string; years: string; description: string }>;
  skills: string[];
}

// --- New Type for Application Flow ---
export interface Application {
  id: string;
  candidateId: string;
  jobId: string | number;
  companyId: string | number;
  stage: 'Applied' | 'Screening' | 'Interview' | 'Offer' | 'Hired' | 'Rejected';
  appliedDate: string;
  updatedDate: string;
}


export interface ViewState {
  currentView: 'dashboard' | 'candidates' | 'jobs' | 'applications' | 'analytics' | 'settings' | 'users' | 'companies';
}