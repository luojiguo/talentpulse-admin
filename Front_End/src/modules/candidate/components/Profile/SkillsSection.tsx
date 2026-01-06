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
        <Card className="mb-0 shadow-sm rounded-lg group hover:shadow-md transition-shadow" variant="borderless">
            <div className="flex justify-between items-center mb-6 pl-4 border-l-4 border-blue-500">
                <Title level={4} style={{ margin: 0 }}>专业技能</Title>
                {!isEditing && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Button type="link" icon={<EditOutlined />} onClick={handleEdit}>
                            编辑
                        </Button>
                    </div>
                )}
            </div>

            {isEditing ? (
                <Form form={form} layout="vertical" onFinish={handleSave}>
                    <Form.Item
                        name="skills"
                        rules={[{ required: true, message: '请输入技能' }]}
                        help="输入技能后按回车添加"
                    >
                        <Select
                            mode="tags"
                            style={{ width: '100%' }}
                            placeholder="输入技能标签"
                            tokenSeparators={[',', '，']}
                        />
                    </Form.Item>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button onClick={() => setIsEditing(false)}>取消</Button>
                        <Button type="primary" htmlType="submit" loading={loading}>完成</Button>
                    </div>
                </Form>
            ) : (
                <div>
                    {currentSkills.length > 0 ? (
                        currentSkills.map((skill: string, index: number) => (
                            <Tag key={index} color="geekblue" className="mb-2 text-sm py-1 px-3">{skill}</Tag>
                        ))
                    ) : (
                        <span className="text-gray-400">暂无技能，请添加...</span>
                    )}
                </div>
            )}
        </Card>
    );
};

export default SkillsSection;
