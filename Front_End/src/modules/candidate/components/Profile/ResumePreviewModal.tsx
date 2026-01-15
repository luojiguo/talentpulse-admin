import React, { useEffect, useState } from 'react';
import { Modal, Button, Spin, Tag, Divider, Avatar, message } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, EnvironmentOutlined, DownloadOutlined } from '@ant-design/icons';
import { candidateAPI, userAPI } from '@/services/apiService';
import dayjs from 'dayjs';

interface ResumePreviewModalProps {
    visible: boolean;
    onClose: () => void;
    userId: string | number;
    autoPrint?: boolean;
}

const ResumePreviewModal: React.FC<ResumePreviewModalProps> = ({ visible, onClose, userId, autoPrint }) => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>(null);

    const fetchData = async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const [userRes, candidateRes, workRes, projRes, eduRes] = await Promise.all([
                userAPI.getUserById(userId),
                candidateAPI.getCandidateProfile(userId).catch(() => ({ data: {} })),
                candidateAPI.getWorkExperiences(userId).catch(() => ({ data: [] })),
                candidateAPI.getProjectExperiences(userId).catch(() => ({ data: [] })),
                candidateAPI.getEducationExperiences(userId).catch(() => ({ data: [] }))
            ]);

            setData({
                user: { ...userRes.data, ...candidateRes.data },
                works: workRes.data || [],
                projects: projRes.data || [],
                educations: eduRes.data || []
            });
        } catch (error) {
            console.error('Failed to fetch resume data', error);
            message.error('加载简历数据失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (visible && userId) {
            fetchData();
        }
    }, [visible, userId]);

    useEffect(() => {
        if (visible && !loading && data && autoPrint) {
            // Check if data is loaded before printing
            const timer = setTimeout(() => {
                window.print();
            }, 500); // Small delay to ensure render
            return () => clearTimeout(timer);
        }
    }, [visible, loading, data, autoPrint]);

    const handlePrint = () => {
        window.print();
    };

    if (!data) return null;

    const { user, works, projects, educations } = data;

    return (
        <Modal
            open={visible}
            onCancel={onClose}
            width={1000}
            footer={[
                <Button key="close" onClick={onClose} className="rounded-xl px-6 h-10 font-bold border-slate-200 text-slate-500">
                    关闭预览
                </Button>,
                <Button key="print" type="primary" icon={<DownloadOutlined />} onClick={handlePrint} className="rounded-xl px-8 h-10 font-black bg-brand-500 hover:bg-brand-600 border-none shadow-lg shadow-brand-500/20">
                    导出 PDF / 打印
                </Button>
            ]}
            className="resume-preview-modal"
            style={{ top: 20 }}
            styles={{ 
                body: { padding: 0, backgroundColor: '#f8fafc', borderRadius: '32px', overflow: 'hidden' }
            }}
        >
            <div className="bg-white mx-auto my-8 shadow-2xl min-h-[1120px] w-full max-w-[800px] text-slate-800 relative overflow-hidden" id="resume-content">
                {/* Brand Accent */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-400 via-emerald-500 to-brand-600"></div>
                
                {loading ? (
                    <div className="flex flex-col justify-center items-center h-[600px] gap-4">
                        <div className="w-12 h-12 border-4 border-brand-100 border-t-brand-500 rounded-full animate-spin"></div>
                        <span className="text-xs font-black text-brand-600 uppercase tracking-widest">正在生成精美简历...</span>
                    </div>
                ) : (
                    <div className="p-12 md:p-16">
                        {/* Header Section */}
                        <div className="resume-header flex flex-col md:flex-row justify-between items-start gap-8 mb-12 pb-12 border-b border-slate-100">
                            <div className="flex-1">
                                <h1 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">{user.name || '未填写姓名'}</h1>
                                <div className="inline-flex px-4 py-1.5 bg-brand-50 text-brand-600 rounded-xl text-sm font-black tracking-tight mb-6">
                                    {user.desired_position || '求职意向未填写'}
                                </div>
                                <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm text-slate-500 font-bold">
                                    {user.phone && <div className="flex items-center gap-2"><PhoneOutlined className="text-brand-500" /> {user.phone}</div>}
                                    {user.email && <div className="flex items-center gap-2"><MailOutlined className="text-brand-500" /> {user.email}</div>}
                                    {user.city && <div className="flex items-center gap-2"><EnvironmentOutlined className="text-brand-500" /> {user.city}</div>}
                                    <div className="flex items-center gap-2">
                                        <UserOutlined className="text-brand-500" />
                                        {user.age ? `${user.age}岁` : '年龄未填'} · {user.work_experience_years !== undefined ? `${user.work_experience_years}年经验` : '经验未填'}
                                    </div>
                                </div>
                            </div>
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-tr from-brand-400 to-emerald-400 rounded-3xl blur opacity-20"></div>
                                {user.avatar ? (
                                    <img 
                                        src={user.avatar} 
                                        alt={user.name} 
                                        className="relative w-32 h-32 rounded-3xl object-cover border-4 border-white shadow-xl"
                                    />
                                ) : (
                                    <div className="relative w-32 h-32 rounded-3xl bg-slate-50 flex items-center justify-center border-4 border-white shadow-xl">
                                        <UserOutlined className="text-4xl text-slate-200" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-12">
                            {/* Summary */}
                            {(user.summary || user.description) && (
                                <section>
                                    <h2 className="text-lg font-black text-slate-900 flex items-center gap-3 mb-6">
                                        <span className="w-8 h-8 bg-brand-500 text-white rounded-lg flex items-center justify-center text-xs">01</span>
                                        个人优势
                                        <div className="flex-1 h-px bg-slate-100 ml-2"></div>
                                    </h2>
                                    <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-50">
                                        <p className="text-slate-600 whitespace-pre-wrap leading-relaxed text-sm font-medium">
                                            {user.summary || user.description}
                                        </p>
                                    </div>
                                </section>
                            )}

                            {/* Work Experience */}
                            {works.length > 0 && (
                                <section>
                                    <h2 className="text-lg font-black text-slate-900 flex items-center gap-3 mb-8">
                                        <span className="w-8 h-8 bg-brand-500 text-white rounded-lg flex items-center justify-center text-xs">02</span>
                                        工作/实习经历
                                        <div className="flex-1 h-px bg-slate-100 ml-2"></div>
                                    </h2>
                                    <div className="space-y-10">
                                        {works.map((work: any, index: number) => (
                                            <div key={work.id} className="relative pl-8 border-l-2 border-slate-100 pb-2">
                                                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-4 border-brand-500 shadow-sm"></div>
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h3 className="text-base font-black text-slate-900 tracking-tight">{work.company_name}</h3>
                                                        <div className="text-brand-600 text-xs font-black uppercase tracking-wider mt-1">{work.position}</div>
                                                    </div>
                                                    <span className="px-3 py-1 bg-slate-50 text-slate-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-100">
                                                        {work.start_date} - {work.end_date}
                                                    </span>
                                                </div>
                                                <p className="text-slate-600 whitespace-pre-wrap text-sm leading-relaxed font-medium mb-4">
                                                    {work.description}
                                                </p>
                                                {work.tags && (
                                                    <div className="flex gap-2 flex-wrap">
                                                        {work.tags.split(',').map((tag: string, idx: number) => (
                                                            <span key={idx} className="px-2 py-0.5 bg-white text-slate-500 border border-slate-100 rounded text-[10px] font-bold">{tag.trim()}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Projects */}
                            {projects.length > 0 && (
                                <section>
                                    <h2 className="text-lg font-black text-slate-900 flex items-center gap-3 mb-8">
                                        <span className="w-8 h-8 bg-brand-500 text-white rounded-lg flex items-center justify-center text-xs">03</span>
                                        项目经历
                                        <div className="flex-1 h-px bg-slate-100 ml-2"></div>
                                    </h2>
                                    <div className="grid grid-cols-1 gap-8">
                                        {projects.map((proj: any) => (
                                            <div key={proj.id} className="bg-slate-50/50 p-6 rounded-2xl border border-slate-50">
                                                <div className="flex justify-between items-center mb-4">
                                                    <h3 className="text-base font-black text-slate-900 tracking-tight">{proj.project_name}</h3>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{proj.start_date} - {proj.end_date}</span>
                                                </div>
                                                <div className="text-brand-600 text-[11px] font-black uppercase tracking-widest mb-3">{proj.role}</div>
                                                <p className="text-slate-600 whitespace-pre-wrap text-sm leading-relaxed font-medium">
                                                    {proj.description}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Education */}
                            {educations.length > 0 && (
                                <section>
                                    <h2 className="text-lg font-black text-slate-900 flex items-center gap-3 mb-8">
                                        <span className="w-8 h-8 bg-brand-500 text-white rounded-lg flex items-center justify-center text-xs">04</span>
                                        教育经历
                                        <div className="flex-1 h-px bg-slate-100 ml-2"></div>
                                    </h2>
                                    <div className="space-y-6">
                                        {educations.map((edu: any) => (
                                            <div key={edu.id} className="flex flex-col md:flex-row justify-between items-start gap-4">
                                                <div className="flex gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300">
                                                        <EnvironmentOutlined className="text-xl" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-base font-black text-slate-900 tracking-tight">{edu.school}</h3>
                                                        <div className="text-slate-500 text-sm font-bold">{edu.major} · {edu.degree}</div>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pt-1">{edu.start_date} - {edu.end_date}</span>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>
                        
                        {/* Footer Accent */}
                        <div className="mt-20 pt-8 border-t border-slate-50 text-center">
                            <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Generated by TalentPulse · 2026</div>
                        </div>
                    </div>
                )}
            </div>
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #root {
                        display: none !important;
                    }
                    .resume-preview-modal .ant-modal-content,
                    .resume-preview-modal .ant-modal-body,
                    #resume-content,
                    #resume-content * {
                        visibility: visible;
                    }
                    .resume-preview-modal {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    .ant-modal-footer, .ant-modal-close {
                        display: none;
                    }
                    #resume-content {
                        box-shadow: none !important;
                        padding: 0 !important;
                        width: 100% !important;
                        max-width: none !important;
                        margin: 0 !important;
                    }
                }
            ` }} />
        </Modal>
    );
};

export default ResumePreviewModal;
