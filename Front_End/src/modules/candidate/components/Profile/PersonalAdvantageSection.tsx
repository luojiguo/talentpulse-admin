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
        <Card className="mb-0 shadow-sm rounded-lg group hover:shadow-md transition-shadow" variant="borderless">
            <div className="flex justify-between items-center mb-6 pl-4 border-l-4 border-blue-500">
                <Title level={4} style={{ margin: 0 }}>个人优势</Title>
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
                        name="summary"
                        rules={[{ required: true, message: '请输入个人优势' }]}
                    >
                        <TextArea rows={6} placeholder="用一句话介绍自己，展示你的核心竞争力..." />
                    </Form.Item>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button onClick={() => setIsEditing(false)}>取消</Button>
                        <Button type="primary" htmlType="submit" loading={loading}>完成</Button>
                    </div>
                </Form>
            ) : (
                <div className="text-gray-700 whitespace-pre-wrap">
                    {summary || <span className="text-gray-400">暂无个人优势，请添加...</span>}
                </div>
            )}
        </Card>
    );
};

export default PersonalAdvantageSection;
