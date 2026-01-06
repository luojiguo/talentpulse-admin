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
            width={900}
            footer={[
                <Button key="close" onClick={onClose}>关闭</Button>,
                <Button key="print" type="primary" icon={<DownloadOutlined />} onClick={handlePrint}>打印/下载PDF</Button>
            ]}
            className="resume-preview-modal"
            style={{ top: 20 }}
            styles={{ body: { padding: 0 } }}
        >
            <div className="bg-white p-8 md:p-12 min-h-[1000px] text-gray-800" id="resume-content">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Spin size="large" />
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="resume-header flex flex-col md:flex-row justify-between items-start border-b-2 border-gray-800 pb-6 mb-6">
                            <div className="flex-1 pr-8">
                                <h1 className="text-3xl font-bold mb-2">{user.name || '未填写姓名'}</h1>
                                <div className="text-lg text-gray-600 mb-4">{user.desired_position || '求职意向未填写'}</div>
                                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                    {user.phone && <div className="flex items-center"><PhoneOutlined className="mr-1" /> {user.phone}</div>}
                                    {user.email && <div className="flex items-center"><MailOutlined className="mr-1" /> {user.email}</div>}
                                    {user.city && <div className="flex items-center"><EnvironmentOutlined className="mr-1" /> {user.city}</div>}
                                    {user.age && <div>{user.age}岁</div>}
                                    {user.work_experience_years !== undefined && <div>{user.work_experience_years}年经验</div>}
                                </div>
                            </div>
                            {user.avatar && (
                                <Avatar size={100} src={user.avatar} icon={<UserOutlined />} />
                            )}
                        </div>

                        {/* Summary */}
                        {(user.summary || user.description) && (
                            <div className="mb-6">
                                <h2 className="text-xl font-bold border-l-4 border-blue-600 pl-3 mb-3">个人优势</h2>
                                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                                    {user.summary || user.description}
                                </p>
                            </div>
                        )}

                        {/* Work Experience */}
                        {works.length > 0 && (
                            <div className="mb-6">
                                <h2 className="text-xl font-bold border-l-4 border-blue-600 pl-3 mb-4">工作经历</h2>
                                <div className="space-y-6">
                                    {works.map((work: any) => (
                                        <div key={work.id}>
                                            <div className="flex justify-between items-baseline mb-1">
                                                <h3 className="text-lg font-bold">{work.company_name}</h3>
                                                <span className="text-gray-500 text-sm">{work.start_date} - {work.end_date}</span>
                                            </div>
                                            <div className="text-gray-700 font-medium mb-2">{work.position}</div>
                                            <p className="text-gray-600 whitespace-pre-wrap text-sm leading-relaxed">
                                                {work.description}
                                            </p>
                                            {work.tags && (
                                                <div className="mt-2 flex gap-2 flex-wrap">
                                                    {work.tags.split(',').map((tag: string, idx: number) => (
                                                        <Tag key={idx} color="default" className="text-xs text-gray-500 border-gray-200">{tag.trim()}</Tag>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Projects */}
                        {projects.length > 0 && (
                            <div className="mb-6">
                                <h2 className="text-xl font-bold border-l-4 border-blue-600 pl-3 mb-4">项目经历</h2>
                                <div className="space-y-6">
                                    {projects.map((proj: any) => (
                                        <div key={proj.id}>
                                            <div className="flex justify-between items-baseline mb-1">
                                                <h3 className="text-lg font-bold">{proj.project_name}</h3>
                                                <span className="text-gray-500 text-sm">{proj.start_date} - {proj.end_date}</span>
                                            </div>
                                            <div className="text-gray-700 font-medium mb-2">{proj.role}</div>
                                            <p className="text-gray-600 whitespace-pre-wrap text-sm leading-relaxed">
                                                {proj.description}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Education */}
                        {educations.length > 0 && (
                            <div className="mb-6">
                                <h2 className="text-xl font-bold border-l-4 border-blue-600 pl-3 mb-4">教育经历</h2>
                                <div className="space-y-4">
                                    {educations.map((edu: any) => (
                                        <div key={edu.id} className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-lg font-bold">{edu.school}</h3>
                                                <div className="text-gray-700">{edu.major} | {edu.degree}</div>
                                                {edu.description && <p className="text-sm text-gray-500 mt-1">{edu.description}</p>}
                                            </div>
                                            <span className="text-gray-500 text-sm">{edu.start_date} - {edu.end_date}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
            <style>{`
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
                        box-shadow: none;
                        padding: 0;
                        width: 100%;
                    }
                    .resume-header {
                        display: flex !important;
                        flex-direction: row !important;
                        justify-content: space-between !important;
                    }
                }
            `}</style>
        </Modal>
    );
};

export default ResumePreviewModal;
