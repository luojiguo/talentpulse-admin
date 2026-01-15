import React, { useState } from 'react';
import { Button, Card, Form, Input, message, Typography } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { candidateAPI } from '@/services/candidateService';

const { TextArea } = Input;
const { Title } = Typography;

interface PersonalAdvantageSectionProps {
    userId: string | number;
    summary: string;
    onUpdate: (data?: any) => void;
}

const PersonalAdvantageSection: React.FC<PersonalAdvantageSectionProps> = ({ userId, summary, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const handleEdit = () => {
        form.setFieldsValue({ summary });
        setIsEditing(true);
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            const values = await form.validateFields();

            await candidateAPI.updateCandidateProfile(userId, {
                summary: values.summary
            });

            message.success('保存成功');
            setIsEditing(false);
            onUpdate({ summary: values.summary }); // 局部更新
        } catch (error) {
            message.error('保存失败');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="mb-0 shadow-sm rounded-3xl group hover:shadow-xl hover:shadow-brand-500/5 transition-all duration-500 border border-slate-100 dark:border-slate-800 dark:bg-slate-900" variant="borderless">
            <div className="flex justify-between items-center mb-8 pl-4 border-l-4 border-brand-500 transition-all">
                <Title level={4} style={{ margin: 0 }} className="dark:text-white !font-bold !text-xl tracking-tight">个人优势</Title>
                {!isEditing && (
                    <div className="opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <Button 
                            type="link" 
                            icon={<EditOutlined />} 
                            onClick={handleEdit}
                            className="text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 font-bold flex items-center gap-1"
                        >
                            编辑优势
                        </Button>
                    </div>
                )}
            </div>

            {isEditing ? (
                <Form form={form} layout="vertical" onFinish={handleSave} className="profile-form">
                    <Form.Item
                        name="summary"
                        rules={[{ required: true, message: '请输入个人优势' }]}
                    >
                        <TextArea 
                            rows={6} 
                            placeholder="用一段话介绍自己，展示你的核心竞争力、项目经验、技能特长等..." 
                            className="rounded-2xl p-4"
                        />
                    </Form.Item>
                    <div className="flex justify-end gap-3 mt-6">
                        <Button 
                            onClick={() => setIsEditing(false)}
                            className="rounded-xl px-6 h-10 font-bold text-slate-500 border-slate-200 dark:border-slate-700 dark:text-slate-400"
                        >
                            取消
                        </Button>
                        <Button 
                            type="primary" 
                            htmlType="submit" 
                            loading={loading}
                            className="rounded-xl px-8 h-10 font-bold bg-brand-500 hover:bg-brand-600 border-none shadow-lg shadow-brand-500/20"
                        >
                            完成保存
                        </Button>
                    </div>
                </Form>
            ) : (
                <div className="bg-slate-50/50 dark:bg-slate-800/30 p-6 rounded-2xl border border-slate-50 dark:border-slate-800/50">
                    <div className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                        {summary || (
                            <div className="text-center py-4">
                                <p className="text-slate-400 dark:text-slate-500">暂无个人优势，点击右上角编辑添加</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
            <style dangerouslySetInnerHTML={{ __html: `
                .profile-form .ant-input {
                    border-radius: 16px !important;
                    border: none !important;
                    background-color: #f8fafc !important;
                    box-shadow: none !important;
                }
                .dark .profile-form .ant-input {
                    background-color: #0f172a !important;
                    color: #f1f5f9 !important;
                }
                .profile-form .ant-input:focus {
                    background-color: #ffffff !important;
                    box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.1) !important;
                }
                .dark .profile-form .ant-input:focus {
                    background-color: #1e293b !important;
                }
            ` }} />
        </Card>
    );
};

export default PersonalAdvantageSection;
