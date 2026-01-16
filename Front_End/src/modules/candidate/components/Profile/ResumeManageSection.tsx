import React, { useState, useEffect } from 'react';
import { Button, Upload, message, List, Modal, Typography, Progress, App } from 'antd';
import { UploadOutlined, FileTextOutlined, DeleteOutlined, DownloadOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';
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
    const { modal } = App.useApp();

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
        modal.confirm({
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
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 transition-all duration-500 group hover:shadow-2xl hover:shadow-brand-500/5">
            <div className="flex justify-between items-center mb-8 pl-5 border-l-4 border-brand-500 transition-all">
                <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-3">
                    <FileTextOutlined className="text-brand-500 text-lg" />
                    附件管理
                </h3>
                <Upload
                    showUploadList={false}
                    customRequest={handleUpload}
                    accept=".pdf,.doc,.docx"
                >
                    <Button
                        type="text"
                        icon={<UploadOutlined />}
                        className="text-brand-600 dark:text-white font-black hover:bg-brand-50 dark:bg-slate-800 dark:hover:bg-brand-900/20 px-4 py-2 rounded-xl border border-transparent dark:border-slate-700 hover:border-brand-100 dark:hover:border-brand-500/50 transition-all"
                    >
                        上传简历
                    </Button>
                </Upload>
            </div>

            {uploading && (
                <div className="mb-8 p-6 bg-brand-50/50 dark:bg-brand-500/5 rounded-3xl border border-brand-100 dark:border-brand-500/20 animate-pulse">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-black text-brand-600 dark:text-brand-400 uppercase tracking-widest">正在安全上传中...</span>
                        <span className="text-sm font-black text-brand-600 dark:text-brand-400">{uploadProgress}%</span>
                    </div>
                    <Progress
                        percent={uploadProgress}
                        size="small"
                        strokeColor={{
                            '0%': '#10B981',
                            '100%': '#059669',
                        }}
                        trailColor="rgba(16, 185, 129, 0.1)"
                        showInfo={false}
                        className="mb-0"
                    />
                </div>
            )}

            {loading ? (
                <div className="text-center py-12">
                    <div className="w-10 h-10 border-4 border-brand-100 dark:border-slate-800 border-t-brand-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-xs text-slate-400 font-black uppercase tracking-widest">加载中</p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {resumes.map((item) => (
                        <div key={item.id} className="p-5 bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 hover:border-brand-200 dark:hover:border-brand-500/30 hover:bg-white dark:hover:bg-slate-800 hover:shadow-xl hover:shadow-brand-500/5 transition-all duration-500 rounded-2xl group/item relative">
                            <div className="flex items-center justify-between w-full">
                                <div className="flex items-center overflow-hidden gap-4">
                                    <div className="w-12 h-12 flex-shrink-0 bg-white dark:bg-slate-700 rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-600 group-hover/item:scale-110 transition-transform duration-500">
                                        <FileTextOutlined className="text-brand-500 text-xl" />
                                    </div>
                                    <div className="flex flex-col overflow-hidden">
                                        <div className="truncate text-base font-black text-slate-800 dark:text-slate-100 tracking-tight" title={item.resume_file_name}>
                                            {item.resume_file_name}
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">PDF</span>
                                    </div>
                                </div>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover/item:opacity-100 transition-all duration-300 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm p-1.5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm z-10">
                                    <Button
                                        type="text"
                                        size="small"
                                        icon={<EyeOutlined className="text-slate-500 dark:text-slate-400 group-hover/item:text-brand-500 transition-colors" />}
                                        onClick={() => window.open(item.resume_file_url, '_blank')}
                                        className="hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-lg w-8 h-8 flex items-center justify-center"
                                    />
                                    <Button
                                        type="text"
                                        size="small"
                                        icon={<DownloadOutlined className="text-slate-500 dark:text-slate-400 group-hover/item:text-brand-500 transition-colors" />}
                                        onClick={() => handleDownload(item)}
                                        className="hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-lg w-8 h-8 flex items-center justify-center"
                                    />
                                    <Button
                                        type="text"
                                        size="small"
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={() => handleDelete(item.id)}
                                        className="hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg w-8 h-8 flex items-center justify-center"
                                    />
                                </div>
                            </div>
                        </div>
                    ))
                    }
                </div >
            )}

            {
                resumes.length === 0 && !loading && (
                    <div className="text-center py-16 bg-slate-50/50 dark:bg-slate-800/30 rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-800">
                        <FileTextOutlined className="text-slate-200 dark:text-slate-700 text-5xl mb-4" />
                        <p className="text-xs text-slate-400 font-black uppercase tracking-widest">暂无附件简历，点击右上角上传</p>
                    </div>
                )
            }

            <div className="mt-6 bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-lg shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 relative overflow-hidden group/card cursor-pointer hover:shadow-xl hover:border-brand-200 dark:hover:border-brand-500/30 transition-all duration-500">
                <div className="absolute top-0 right-0 w-48 h-48 bg-brand-50/50 dark:bg-brand-900/10 rounded-full -mr-24 -mt-24 blur-3xl group-hover/card:scale-150 transition-transform duration-1000"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-slate-50 dark:bg-slate-800/50 rounded-full -ml-16 -mb-16 blur-2xl"></div>

                <div className="relative z-10 flex flex-col items-center text-center">
                    <h4 className="font-black mb-1 text-2xl text-slate-800 dark:text-white tracking-tight">快速生成附件简历</h4>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-bold mb-6">海量精选案例 · 免费专业模板 · AI 智能辅助</p>

                    <div className="flex items-center justify-between w-full bg-slate-50 dark:bg-slate-700/30 rounded-xl p-3 border border-slate-100 dark:border-slate-600">
                        <div className="flex -space-x-3">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-700 bg-slate-100 dark:bg-slate-600 flex items-center justify-center overflow-hidden">
                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 20}`} alt="avatar" />
                                </div>
                            ))}
                        </div>
                        <button className="px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 rounded-lg text-xs font-black transition-all active:scale-95 shadow-sm flex items-center gap-1 whitespace-nowrap">
                            立即体验 <PlusOutlined className="text-[10px]" />
                        </button>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default ResumeManageSection;
