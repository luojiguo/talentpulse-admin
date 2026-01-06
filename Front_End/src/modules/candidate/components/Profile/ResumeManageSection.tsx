import React, { useState, useEffect } from 'react';
import { Button, Upload, message, List, Modal, Typography, Progress } from 'antd';
import { UploadOutlined, FileTextOutlined, DeleteOutlined, DownloadOutlined, EyeOutlined } from '@ant-design/icons';
import { resumeAPI } from '@/services/resumeService';

const { Title, Text } = Typography;

interface ResumeManageSectionProps {
    userId: string | number;
    refreshTrigger?: number;
}

const ResumeManageSection: React.FC<ResumeManageSectionProps> = ({ userId, refreshTrigger }) => {
    const [resumes, setResumes] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const fetchResumes = async () => {
        try {
            setLoading(true);
            const res = await resumeAPI.getUserResumes(userId);
            if (res.data) {
                setResumes(res.data);
            }
        } catch (error) {
            console.error('Failed to fetch resumes', error);
            // Fail silently or show message
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userId) {
            fetchResumes();
        }
    }, [userId, refreshTrigger]);

    const handleUpload = async ({ file }: any) => {
        try {
            setUploading(true);
            setUploadProgress(0);

            await resumeAPI.uploadResume(userId, file, (progress) => {
                setUploadProgress(progress);
            });

            message.success('上传成功');
            fetchResumes();
        } catch (error) {
            message.error('上传失败');
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const handleDelete = async (id: string | number) => {
        Modal.confirm({
            title: '确认删除',
            content: '确定要删除这份简历吗？',
            onOk: async () => {
                try {
                    await resumeAPI.deleteResume(id);
                    message.success('删除成功');
                    fetchResumes();
                } catch (error) {
                    message.error('删除失败');
                }
            }
        });
    };

    const handleDownload = async (item: any) => {
        try {
            const res = await resumeAPI.downloadResumeFile(item.id);
            // Create download link
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', item.resume_file_name || 'resume.pdf'); // fallback name
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            message.error('下载失败');
        }
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-700">附件管理</h3>
                <Upload
                    showUploadList={false}
                    customRequest={handleUpload}
                    accept=".pdf,.doc,.docx"
                >
                    <Button type="text" icon={<UploadOutlined />}>上传</Button>
                </Upload>
            </div>

            {uploading && (
                <div className="mb-4">
                    <Progress percent={uploadProgress} size="small" status="active" />
                    <div className="text-xs text-center text-gray-500">上传中...</div>
                </div>
            )}

            {loading ? (
                <div className="text-center py-4 text-gray-400">加载中...</div>
            ) : (
                <div className="flex flex-col">
                    {resumes.map((item) => (
                        <div key={item.id} className="px-0 py-2 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors rounded-sm group">
                            <div className="flex items-center justify-between w-full">
                                <div className="flex items-center overflow-hidden">
                                    <FileTextOutlined className="text-blue-500 mr-2 text-lg" />
                                    <div className="truncate text-sm text-gray-700 max-w-[120px]" title={item.resume_file_name}>
                                        {item.resume_file_name}
                                    </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        type="text"
                                        size="small"
                                        icon={<EyeOutlined />}
                                        onClick={() => window.open(item.resume_file_url, '_blank')}
                                        title="查看"
                                    />
                                    <Button
                                        type="text"
                                        size="small"
                                        icon={<DownloadOutlined />}
                                        onClick={() => handleDownload(item)}
                                        title="下载"
                                    />
                                    <Button
                                        type="text"
                                        size="small"
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={() => handleDelete(item.id)}
                                        title="删除"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {resumes.length === 0 && !loading && (
                <div className="text-gray-400 text-xs text-center py-4">
                    暂无附件简历
                </div>
            )}

            <div className="mt-4 bg-blue-50 p-4 rounded-lg">
                <h4 className="font-bold mb-2 text-sm text-blue-800">快速生成附件简历</h4>
                <div className="text-xs text-blue-600">海量案例 | 免费模板 | 智能改写</div>
            </div>
        </div>
    );
};

export default ResumeManageSection;
