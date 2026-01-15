import React, { useState } from 'react';
import { Button, Card, Form, Select, message, Typography, Tag } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { candidateAPI } from '@/services/candidateService';

const { Title } = Typography;

interface SkillsSectionProps {
    userId: string | number;
    skills: string | string[];
    onUpdate: (data?: any) => void;
}

const SkillsSection: React.FC<SkillsSectionProps> = ({ userId, skills, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    // Parse skills: usually JSON string "[...]" or comma separated string
    const parseSkills = (skillsData: string | string[]) => {
        if (Array.isArray(skillsData)) return skillsData;
        if (!skillsData) return [];
        try {
            // try parsing as JSON array
            const parsed = JSON.parse(skillsData);
            if (Array.isArray(parsed)) return parsed;
        } catch (e) {
            // ignore
        }
        // split by comma if string
        return skillsData.split(/[,，]/).map(s => s.trim()).filter(Boolean);
    };

    const currentSkills = parseSkills(skills);

    const handleEdit = () => {
        form.setFieldsValue({ skills: currentSkills });
        setIsEditing(true);
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            const values = await form.validateFields();

            await candidateAPI.updateCandidateProfile(userId, {
                skills: values.skills
            });

            message.success('保存成功');
            setIsEditing(false);
            onUpdate({ skills: values.skills }); // 局部更新
        } catch (error) {
            message.error('保存失败');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="mb-0 shadow-sm rounded-3xl group hover:shadow-xl hover:shadow-brand-500/5 transition-all duration-500 border border-slate-100 dark:border-slate-800 dark:bg-slate-900" variant="borderless">
            <div className="flex justify-between items-center mb-8 pl-4 border-l-4 border-brand-500 transition-all">
                <Title level={4} style={{ margin: 0 }} className="dark:text-white !font-bold !text-xl tracking-tight">专业技能</Title>
                {!isEditing && (
                    <div className="opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <Button
                            type="link"
                            icon={<EditOutlined />}
                            onClick={handleEdit}
                            className="text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 font-bold flex items-center gap-1"
                        >
                            编辑技能
                        </Button>
                    </div>
                )}
            </div>

            {isEditing ? (
                <Form form={form} layout="vertical" onFinish={handleSave} className="profile-form">
                    <Form.Item
                        name="skills"
                        rules={[{ required: true, message: '请输入技能' }]}
                        help={<span className="text-slate-400 dark:text-slate-500 text-[10px] font-medium">输入技能后按回车添加，用逗号分隔</span>}
                    >
                        <Select
                            mode="tags"
                            style={{ width: '100%' }}
                            placeholder="输入技能标签，如 React, Java, UI Design"
                            tokenSeparators={[',', '，']}
                            className="rounded-2xl min-h-12"
                            popupClassName="dark:bg-slate-800"
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
                <div className="flex flex-wrap gap-3">
                    {currentSkills.length > 0 ? (
                        currentSkills.map((skill: string, index: number) => (
                            <span
                                key={index}
                                className="px-4 py-2 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 rounded-2xl text-sm font-bold border border-slate-100 dark:border-slate-800 hover:border-brand-200 dark:hover:border-brand-500/30 hover:shadow-lg hover:shadow-brand-500/5 transition-all duration-300"
                            >
                                {skill}
                            </span>
                        ))
                    ) : (
                        <div className="w-full text-center py-8 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border-2 border-dashed border-slate-100 dark:border-slate-800">
                            <p className="text-slate-400 dark:text-slate-500 font-medium">暂无技能，点击右上角编辑添加</p>
                        </div>
                    )}
                </div>
            )}
            <style dangerouslySetInnerHTML={{
                __html: `
                .profile-form .ant-select-selector {
                    border-radius: 16px !important;
                    border: none !important;
                    background-color: #f8fafc !important;
                    box-shadow: none !important;
                    padding: 4px 12px !important;
                }
                .dark .profile-form .ant-select-selector {
                    background-color: #0f172a !important;
                    color: #f1f5f9 !important;
                }
                .profile-form .ant-select-focused .ant-select-selector {
                    background-color: #ffffff !important;
                    box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.1) !important;
                }
                .dark .profile-form .ant-select-focused .ant-select-selector {
                    background-color: #1e293b !important;
                }
                .profile-form .ant-select-selection-item {
                    background-color: #007AFF !important;
                    color: white !important;
                    border-radius: 8px !important;
                    border: none !important;
                    font-weight: bold !important;
                    font-size: 12px !important;
                }
                .profile-form .ant-select-selection-item-remove {
                    color: white !important;
                }
            ` }} />
        </Card>
    );
};

export default SkillsSection;
