import React, { useState, useEffect } from 'react';
import { userAPI, candidateAPI, resumeAPI } from '../../../services/apiService';
import { useApi } from '../../../hooks/useApi';

// 定义简历相关的接口
interface Education {
  id?: number;
  school: string;
  major: string;
  degree: string;
  start_date: string;
  end_date: string;
  description: string;
}

interface WorkExperience {
  id?: number;
  company: string;
  position: string;
  start_date: string;
  end_date: string;
  description: string;
}

interface Project {
  id?: number;
  name: string;
  role: string;
  start_date: string;
  end_date: string;
  description: string;
  technologies: string;
}

interface Certification {
  id?: number;
  name: string;
  issuing_authority: string;
  issue_date: string;
  expiry_date?: string;
  certificate_number?: string;
}

interface Award {
  id?: number;
  name: string;
  issuing_organization: string;
  date: string;
  description: string;
}

interface Training {
  id?: number;
  name: string;
  provider: string;
  start_date: string;
  end_date: string;
  description: string;
}

interface ResumeData {
  resume_title: string;
  is_default: boolean;
  education: Education[];
  work_experience: WorkExperience[];
  projects: Project[];
  skills: string[];
  certifications: Certification[];
  languages: string[];
  self_evaluation: string;
  awards: Award[];
  trainings: Training[];
  patents: any[];
  portfolio_links: string[];
}

interface ResumeEditorScreenProps {
  currentUser?: { id: number | string };
}

const ResumeEditorScreen: React.FC<ResumeEditorScreenProps> = ({ currentUser }) => {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [resumeId, setResumeId] = useState<string | number | null>(null);

  // 初始简历数据
  const initialResumeData: ResumeData = {
    resume_title: '',
    is_default: false,
    education: [
      { school: '', major: '', degree: '', start_date: '', end_date: '', description: '' }
    ],
    work_experience: [
      { company: '', position: '', start_date: '', end_date: '', description: '' }
    ],
    projects: [
      { name: '', role: '', start_date: '', end_date: '', description: '', technologies: '' }
    ],
    skills: [''],
    certifications: [
      { name: '', issuing_authority: '', issue_date: '', expiry_date: '', certificate_number: '' }
    ],
    languages: [''],
    self_evaluation: '',
    awards: [
      { name: '', issuing_organization: '', date: '', description: '' }
    ],
    trainings: [
      { name: '', provider: '', start_date: '', end_date: '', description: '' }
    ],
    patents: [],
    portfolio_links: []
  };

  const [resumeData, setResumeData] = useState<ResumeData>(initialResumeData);

  // 使用 useApi Hook 获取用户简历列表
  const {
    data: resumesData,
    loading: loadingResumes,
    error: resumesError,
    refetch: refetchResumes
  } = useApi<{ status: string; data: any[] }>(
    async () => {
      try {
        let userId = currentUser?.id;
        if (!userId) {
          userId = localStorage.getItem('userId');
        }
        if (!userId) {
          return { status: 'success', data: [] };
        }
        const response = await resumeAPI.getUserResumes(userId);
        return response as any;
      } catch (error) {
        console.error('获取简历列表失败:', error);
        return { status: 'success', data: [] };
      }
    },
    [currentUser?.id],
    { autoFetch: true }
  );

  // 监听简历数据变化，更新当前编辑的简历
  useEffect(() => {
    if (resumesData?.status === 'success' && resumesData.data.length > 0) {
      // 如果有简历，使用第一个作为默认编辑对象
      const firstResume = resumesData.data[0];
      setResumeId(firstResume.id);

      // 将数据库中的JSON数据转换为组件需要的格式
      const formattedData: ResumeData = {
        resume_title: firstResume.resume_title || '',
        is_default: firstResume.is_default || false,
        education: Array.isArray(firstResume.education) ? firstResume.education : initialResumeData.education,
        work_experience: Array.isArray(firstResume.work_experience) ? firstResume.work_experience : initialResumeData.work_experience,
        projects: Array.isArray(firstResume.projects) ? firstResume.projects : initialResumeData.projects,
        skills: Array.isArray(firstResume.skills) ? firstResume.skills : initialResumeData.skills,
        certifications: Array.isArray(firstResume.certifications) ? firstResume.certifications : initialResumeData.certifications,
        languages: Array.isArray(firstResume.languages) ? firstResume.languages : initialResumeData.languages,
        self_evaluation: firstResume.self_evaluation || '',
        awards: Array.isArray(firstResume.awards) ? firstResume.awards : initialResumeData.awards,
        trainings: Array.isArray(firstResume.trainings) ? firstResume.trainings : initialResumeData.trainings,
        patents: Array.isArray(firstResume.patents) ? firstResume.patents : initialResumeData.patents,
        portfolio_links: Array.isArray(firstResume.portfolio_links) ? firstResume.portfolio_links : initialResumeData.portfolio_links
      };

      setResumeData(formattedData);
    }
  }, [resumesData]);

  // 合并loading状态
  const loading = loadingResumes;

  // 通用的输入变化处理函数
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, section: string, index: number, field: string) => {
    const { value } = e.target;
    setResumeData(prev => ({
      ...prev,
      [section]: prev[section as keyof ResumeData].map((item, i) =>
        i === index ? { ...(item as any), [field]: value } : item
      )
    }));
  };

  // 处理技能和语言等数组字段的变化
  const handleArrayFieldChange = (e: React.ChangeEvent<HTMLInputElement>, section: string, index: number) => {
    const { value } = e.target;
    setResumeData(prev => ({
      ...prev,
      [section]: prev[section as keyof ResumeData].map((item, i) =>
        i === index ? value : item
      )
    }));
  };

  // 添加新的教育经历
  const addEducation = () => {
    setResumeData(prev => ({
      ...prev,
      education: [...prev.education, { school: '', major: '', degree: '', start_date: '', end_date: '', description: '' }]
    }));
  };

  // 删除教育经历
  const removeEducation = (index: number) => {
    if (resumeData.education.length > 1) {
      setResumeData(prev => ({
        ...prev,
        education: prev.education.filter((_, i) => i !== index)
      }));
    }
  };

  // 添加新的工作经历
  const addWorkExperience = () => {
    setResumeData(prev => ({
      ...prev,
      work_experience: [...prev.work_experience, { company: '', position: '', start_date: '', end_date: '', description: '' }]
    }));
  };

  // 删除工作经历
  const removeWorkExperience = (index: number) => {
    if (resumeData.work_experience.length > 1) {
      setResumeData(prev => ({
        ...prev,
        work_experience: prev.work_experience.filter((_, i) => i !== index)
      }));
    }
  };

  // 添加新项目
  const addProject = () => {
    setResumeData(prev => ({
      ...prev,
      projects: [...prev.projects, { name: '', role: '', start_date: '', end_date: '', description: '', technologies: '' }]
    }));
  };

  // 删除项目
  const removeProject = (index: number) => {
    if (resumeData.projects.length > 1) {
      setResumeData(prev => ({
        ...prev,
        projects: prev.projects.filter((_, i) => i !== index)
      }));
    }
  };

  // 添加新技能
  const addSkill = () => {
    setResumeData(prev => ({
      ...prev,
      skills: [...prev.skills, '']
    }));
  };

  // 删除技能
  const removeSkill = (index: number) => {
    if (resumeData.skills.length > 1) {
      setResumeData(prev => ({
        ...prev,
        skills: prev.skills.filter((_, i) => i !== index)
      }));
    }
  };

  // 添加新证书
  const addCertification = () => {
    setResumeData(prev => ({
      ...prev,
      certifications: [...prev.certifications, { name: '', issuing_authority: '', issue_date: '', expiry_date: '', certificate_number: '' }]
    }));
  };

  // 删除证书
  const removeCertification = (index: number) => {
    if (resumeData.certifications.length > 1) {
      setResumeData(prev => ({
        ...prev,
        certifications: prev.certifications.filter((_, i) => i !== index)
      }));
    }
  };

  // 添加新语言
  const addLanguage = () => {
    setResumeData(prev => ({
      ...prev,
      languages: [...prev.languages, '']
    }));
  };

  // 删除语言
  const removeLanguage = (index: number) => {
    if (resumeData.languages.length > 1) {
      setResumeData(prev => ({
        ...prev,
        languages: prev.languages.filter((_, i) => i !== index)
      }));
    }
  };

  // 添加新奖项
  const addAward = () => {
    setResumeData(prev => ({
      ...prev,
      awards: [...prev.awards, { name: '', issuing_organization: '', date: '', description: '' }]
    }));
  };

  // 删除奖项
  const removeAward = (index: number) => {
    if (resumeData.awards.length > 1) {
      setResumeData(prev => ({
        ...prev,
        awards: prev.awards.filter((_, i) => i !== index)
      }));
    }
  };

  // 添加新培训经历
  const addTraining = () => {
    setResumeData(prev => ({
      ...prev,
      trainings: [...prev.trainings, { name: '', provider: '', start_date: '', end_date: '', description: '' }]
    }));
  };

  // 删除培训经历
  const removeTraining = (index: number) => {
    if (resumeData.trainings.length > 1) {
      setResumeData(prev => ({
        ...prev,
        trainings: prev.trainings.filter((_, i) => i !== index)
      }));
    }
  };



  // 保存简历
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const userId = currentUser?.id || localStorage.getItem('userId');
      if (!userId) {
        throw new Error('未找到用户ID');
      }

      // 确保简历数据格式正确
      const processedResumeData = {
        ...resumeData,
        // 确保数组字段都是数组类型
        education: Array.isArray(resumeData.education) ? resumeData.education : [],
        work_experience: Array.isArray(resumeData.work_experience) ? resumeData.work_experience : [],
        projects: Array.isArray(resumeData.projects) ? resumeData.projects : [],
        skills: Array.isArray(resumeData.skills) ? resumeData.skills : [],
        certifications: Array.isArray(resumeData.certifications) ? resumeData.certifications : [],
        languages: Array.isArray(resumeData.languages) ? resumeData.languages : [],
        awards: Array.isArray(resumeData.awards) ? resumeData.awards : [],
        trainings: Array.isArray(resumeData.trainings) ? resumeData.trainings : [],
        patents: Array.isArray(resumeData.patents) ? resumeData.patents : [],
        portfolio_links: Array.isArray(resumeData.portfolio_links) ? resumeData.portfolio_links : []
      };

      // 调用保存简历的API，传入resumeId实现更新或创建
      const result = await resumeAPI.saveResume(userId, resumeId, processedResumeData);

      // 如果是新创建的简历，保存返回的resumeId
      if (!resumeId && (result as any).status === 'success' && result.data?.id) {
        setResumeId(result.data.id);
      }

      // 保存成功后刷新简历列表
      await refetchResumes();

      setMessage({ type: 'success', text: resumeId ? '简历更新成功' : '简历创建成功' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || '保存简历失败' });
      console.error('保存简历失败:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center">正在加载简历数据...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">在线简历编辑</h1>

      {message && (
        <div className={`p-4 mb-6 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <form onSubmit={handleSave} className="p-8">


          {/* 简历基本信息 */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">简历基本信息</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">简历标题</label>
                <input
                  type="text"
                  value={resumeData.resume_title}
                  onChange={(e) => setResumeData(prev => ({ ...prev, resume_title: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="例如：前端工程师简历"
                />
              </div>
              <div className="flex items-center align-middle">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={resumeData.is_default}
                  onChange={(e) => setResumeData(prev => ({ ...prev, is_default: e.target.checked }))}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_default" className="text-sm font-medium text-gray-700">设为默认简历</label>
              </div>
            </div>
          </div>

          {/* 教育经历 */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 pb-2 border-b border-gray-100">教育经历</h3>
              <button
                type="button"
                onClick={addEducation}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 focus:ring-2 focus:ring-green-300 transition-all"
              >
                添加教育经历
              </button>
            </div>
            {resumeData.education.map((edu, index) => (
              <div key={index} className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-medium text-gray-800">教育经历 {index + 1}</h4>
                  {resumeData.education.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEducation(index)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      删除
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">学校名称</label>
                    <input
                      type="text"
                      value={edu.school}
                      onChange={(e) => handleInputChange(e, 'education', index, 'school')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="请输入学校名称"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">专业</label>
                    <input
                      type="text"
                      value={edu.major}
                      onChange={(e) => handleInputChange(e, 'education', index, 'major')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="请输入专业名称"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">学历</label>
                    <select
                      value={edu.degree}
                      onChange={(e) => handleInputChange(e, 'education', index, 'degree')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    >
                      <option value="">请选择学历</option>
                      <option value="High School">高中/中专</option>
                      <option value="Associate">大专</option>
                      <option value="Bachelor">本科</option>
                      <option value="Master">硕士</option>
                      <option value="PhD">博士</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
                      <input
                        type="date"
                        value={edu.start_date}
                        onChange={(e) => handleInputChange(e, 'education', index, 'start_date')}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
                      <input
                        type="date"
                        value={edu.end_date}
                        onChange={(e) => handleInputChange(e, 'education', index, 'end_date')}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                    <textarea
                      value={edu.description}
                      onChange={(e) => handleInputChange(e, 'education', index, 'description')}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                      placeholder="请描述您的学习经历、成绩、活动等"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 工作经历 */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 pb-2 border-b border-gray-100">工作经历</h3>
              <button
                type="button"
                onClick={addWorkExperience}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 focus:ring-2 focus:ring-green-300 transition-all"
              >
                添加工作经历
              </button>
            </div>
            {resumeData.work_experience.map((work, index) => (
              <div key={index} className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-medium text-gray-800">工作经历 {index + 1}</h4>
                  {resumeData.work_experience.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeWorkExperience(index)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      删除
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">公司名称</label>
                    <input
                      type="text"
                      value={work.company}
                      onChange={(e) => handleInputChange(e, 'work_experience', index, 'company')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="请输入公司名称"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">职位</label>
                    <input
                      type="text"
                      value={work.position}
                      onChange={(e) => handleInputChange(e, 'work_experience', index, 'position')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="请输入职位名称"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
                      <input
                        type="date"
                        value={work.start_date}
                        onChange={(e) => handleInputChange(e, 'work_experience', index, 'start_date')}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
                      <input
                        type="date"
                        value={work.end_date}
                        onChange={(e) => handleInputChange(e, 'work_experience', index, 'end_date')}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">工作描述</label>
                    <textarea
                      value={work.description}
                      onChange={(e) => handleInputChange(e, 'work_experience', index, 'description')}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                      placeholder="请描述您的工作职责、成就等"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 项目经验 */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 pb-2 border-b border-gray-100">项目经验</h3>
              <button
                type="button"
                onClick={addProject}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 focus:ring-2 focus:ring-green-300 transition-all"
              >
                添加项目经验
              </button>
            </div>
            {resumeData.projects.map((project, index) => (
              <div key={index} className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-medium text-gray-800">项目经验 {index + 1}</h4>
                  {resumeData.projects.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeProject(index)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      删除
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">项目名称</label>
                    <input
                      type="text"
                      value={project.name}
                      onChange={(e) => handleInputChange(e, 'projects', index, 'name')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="请输入项目名称"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">担任角色</label>
                    <input
                      type="text"
                      value={project.role}
                      onChange={(e) => handleInputChange(e, 'projects', index, 'role')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="请输入您在项目中的角色"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
                      <input
                        type="date"
                        value={project.start_date}
                        onChange={(e) => handleInputChange(e, 'projects', index, 'start_date')}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
                      <input
                        type="date"
                        value={project.end_date}
                        onChange={(e) => handleInputChange(e, 'projects', index, 'end_date')}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">使用技术</label>
                    <input
                      type="text"
                      value={project.technologies}
                      onChange={(e) => handleInputChange(e, 'projects', index, 'technologies')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="例如：React, Node.js, MongoDB"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">项目描述</label>
                    <textarea
                      value={project.description}
                      onChange={(e) => handleInputChange(e, 'projects', index, 'description')}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                      placeholder="请描述项目背景、目标、您的贡献、成果等"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 技能 */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 pb-2 border-b border-gray-100">技能</h3>
              <button
                type="button"
                onClick={addSkill}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 focus:ring-2 focus:ring-green-300 transition-all"
              >
                添加技能
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {resumeData.skills.map((skill, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={skill}
                    onChange={(e) => handleArrayFieldChange(e, 'skills', index)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="例如：JavaScript"
                  />
                  {resumeData.skills.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSkill(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 证书 */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 pb-2 border-b border-gray-100">证书</h3>
              <button
                type="button"
                onClick={addCertification}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 focus:ring-2 focus:ring-green-300 transition-all"
              >
                添加证书
              </button>
            </div>
            {resumeData.certifications.map((cert, index) => (
              <div key={index} className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-medium text-gray-800">证书 {index + 1}</h4>
                  {resumeData.certifications.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCertification(index)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      删除
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">证书名称</label>
                    <input
                      type="text"
                      value={cert.name}
                      onChange={(e) => handleInputChange(e, 'certifications', index, 'name')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="请输入证书名称"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">发证机构</label>
                    <input
                      type="text"
                      value={cert.issuing_authority}
                      onChange={(e) => handleInputChange(e, 'certifications', index, 'issuing_authority')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="请输入发证机构"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">发证日期</label>
                    <input
                      type="date"
                      value={cert.issue_date}
                      onChange={(e) => handleInputChange(e, 'certifications', index, 'issue_date')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">到期日期（可选）</label>
                    <input
                      type="date"
                      value={cert.expiry_date || ''}
                      onChange={(e) => handleInputChange(e, 'certifications', index, 'expiry_date')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">证书编号（可选）</label>
                    <input
                      type="text"
                      value={cert.certificate_number || ''}
                      onChange={(e) => handleInputChange(e, 'certifications', index, 'certificate_number')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="请输入证书编号"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 语言能力 */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 pb-2 border-b border-gray-100">语言能力</h3>
              <button
                type="button"
                onClick={addLanguage}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 focus:ring-2 focus:ring-green-300 transition-all"
              >
                添加语言
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {resumeData.languages.map((lang, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={lang}
                    onChange={(e) => handleArrayFieldChange(e, 'languages', index)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="例如：英语（流利）"
                  />
                  {resumeData.languages.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLanguage(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 自我评价 */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">自我评价</h3>
            <textarea
              value={resumeData.self_evaluation}
              onChange={(e) => setResumeData(prev => ({ ...prev, self_evaluation: e.target.value }))}
              rows={5}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
              placeholder="请简要描述您的职业背景、核心优势和职业目标..."
            />
          </div>

          {/* 奖项 */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 pb-2 border-b border-gray-100">奖项</h3>
              <button
                type="button"
                onClick={addAward}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 focus:ring-2 focus:ring-green-300 transition-all"
              >
                添加奖项
              </button>
            </div>
            {resumeData.awards.map((award, index) => (
              <div key={index} className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-medium text-gray-800">奖项 {index + 1}</h4>
                  {resumeData.awards.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeAward(index)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      删除
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">奖项名称</label>
                    <input
                      type="text"
                      value={award.name}
                      onChange={(e) => handleInputChange(e, 'awards', index, 'name')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="请输入奖项名称"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">颁发机构</label>
                    <input
                      type="text"
                      value={award.issuing_organization}
                      onChange={(e) => handleInputChange(e, 'awards', index, 'issuing_organization')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="请输入颁发机构"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">颁发日期</label>
                    <input
                      type="date"
                      value={award.date}
                      onChange={(e) => handleInputChange(e, 'awards', index, 'date')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">奖项描述</label>
                    <textarea
                      value={award.description}
                      onChange={(e) => handleInputChange(e, 'awards', index, 'description')}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                      placeholder="请描述奖项的获得情况"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 培训经历 */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 pb-2 border-b border-gray-100">培训经历</h3>
              <button
                type="button"
                onClick={addTraining}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 focus:ring-2 focus:ring-green-300 transition-all"
              >
                添加培训经历
              </button>
            </div>
            {resumeData.trainings.map((training, index) => (
              <div key={index} className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-medium text-gray-800">培训经历 {index + 1}</h4>
                  {resumeData.trainings.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTraining(index)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      删除
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">培训名称</label>
                    <input
                      type="text"
                      value={training.name}
                      onChange={(e) => handleInputChange(e, 'trainings', index, 'name')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="请输入培训名称"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">培训提供商</label>
                    <input
                      type="text"
                      value={training.provider}
                      onChange={(e) => handleInputChange(e, 'trainings', index, 'provider')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="请输入培训提供商"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
                      <input
                        type="date"
                        value={training.start_date}
                        onChange={(e) => handleInputChange(e, 'trainings', index, 'start_date')}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
                      <input
                        type="date"
                        value={training.end_date}
                        onChange={(e) => handleInputChange(e, 'trainings', index, 'end_date')}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">培训描述</label>
                    <textarea
                      value={training.description}
                      onChange={(e) => handleInputChange(e, 'trainings', index, 'description')}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                      placeholder="请描述培训内容和收获"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-6 border-t border-gray-100">
            <button
              type="submit"
              disabled={saving}
              className={`px-8 py-3 bg-blue-600 text-white rounded-lg font-medium shadow-md hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all ${saving ? 'opacity-70 cursor-wait' : ''}`}
            >
              {saving ? '正在保存...' : '保存简历'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResumeEditorScreen;