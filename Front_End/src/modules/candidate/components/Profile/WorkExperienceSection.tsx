import React, { useState, useEffect } from 'react';
import { Button, Card, Form, Input, DatePicker, Modal, List, message, Tag, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { candidateAPI } from '@/services/candidateService';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

interface WorkExperienceSectionProps {
    userId: string | number;
    dictionaries?: any;
    refreshTrigger?: number;
}

const WorkExperienceSection: React.FC<WorkExperienceSectionProps> = ({ userId, dictionaries = {}, refreshTrigger = 0 }) => {
    const [experiences, setExperiences] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingId, setEditingId] = useState<string | number | null>(null);
    const [form] = Form.useForm();

    // Fetch experiences
    const fetchExperiences = async () => {
        try {
            setLoading(true);
            const res = await candidateAPI.getWorkExperiences(userId);
            if (res.data) {
                setExperiences(res.data);
            }
        } catch (error) {
            console.error('Failed to fetch work experiences', error);
            message.error('加载工作经历失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userId) {
            fetchExperiences();
        }
    }, [userId, refreshTrigger]);

    const handleAdd = () => {
        setEditingId(null);
        form.resetFields();
        setIsModalVisible(true);
    };

    const handleEdit = (item: any) => {
        setEditingId(item.id);
        form.setFieldsValue({
            company_name: item.company_name,
            position: item.position,
            dateRange: [
                item.start_date ? dayjs(item.start_date) : null,
                item.end_date ? dayjs(item.end_date) : null,
            ],
            description: item.description,
            tags: item.tags,
        });
        setIsModalVisible(true);
    };

    const handleDelete = async (id: string | number) => {
        Modal.confirm({
            title: '确认删除',
            content: '确定要删除这条工作经历吗？',
            onOk: async () => {
                try {
                    await candidateAPI.deleteWorkExperience(userId, id);
                    message.success('删除成功');
                    fetchExperiences();
                } catch (error) {
                    message.error('删除失败');
                }
            },
        });
    };

    const handleModalOk = async () => {
        try {
            const values = await form.validateFields();
            const payload = {
                company_name: values.company_name,
                position: values.position,
                start_date: values.dateRange ? values.dateRange[0].format('YYYY-MM-DD') : null,
                end_date: values.dateRange ? values.dateRange[1].format('YYYY-MM-DD') : null,
                description: values.description,
                tags: values.tags,
            };

            if (editingId) {
                await candidateAPI.updateWorkExperience(userId, editingId, payload);
                message.success('更新成功');
            } else {
                await candidateAPI.addWorkExperience(userId, payload);
                message.success('添加成功');
            }

            setIsModalVisible(false);
            fetchExperiences();
        } catch (error) {
            console.error('Operation failed', error);
            message.error('操作失败');
        }
    };

    return (
        <Card className="mb-0 shadow-sm rounded-lg group hover:shadow-md transition-shadow" variant="borderless">
            <div className="flex justify-between items-center mb-6 pl-4 border-l-4 border-blue-500">
                <Title level={4} style={{ margin: 0 }}>工作/实习经历</Title>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Button type="link" icon={<PlusOutlined />} onClick={handleAdd}>
                        添加
                    </Button>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                {loading && <div className="text-center py-4">加载中...</div>}

                {!loading && experiences.length === 0 && (
                    <div className="text-center py-8 text-gray-400">暂无工作/实习经历，请添加</div>
                )}

                {!loading && experiences.map((item) => (
                    <div key={item.id} className="group border-b border-gray-100 pb-4 mb-2 last:border-0 last:mb-0 last:pb-0">
                        <div className="flex justify-between items-start w-full">
                            <div className="flex-1">
                                <h4 className="font-bold text-lg mb-1">
                                    {item.company_name}
                                    <span className="text-gray-500 font-normal text-sm ml-2">{item.position}</span>
                                    <span className="text-gray-400 font-normal text-sm ml-4">{item.start_date} - {item.end_date}</span>
                                </h4>
                                {item.tags && (
                                    <div className="mb-2">
                                        {item.tags.split(',').map((tag: string, index: number) => (
                                            <Tag key={index} color="blue">{tag.trim()}</Tag>
                                        ))}
                                    </div>
                                )}
                                <div className="text-gray-700 whitespace-pre-wrap">
                                    <span className="font-bold">内容：</span> {item.description}
                                </div>
                            </div>
                            <div className="flex gap-2 ml-4 transition-opacity duration-200 opacity-0 group-hover:opacity-100">
                                <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(item)}>编辑</Button>
                                <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(item.id)}>删除</Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <Modal
                title={editingId ? "编辑工作经历" : "添加工作经历"}
                open={isModalVisible}
                onOk={handleModalOk}
                onCancel={() => setIsModalVisible(false)}
                width={600}
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="company_name"
                        label="公司名称"
                        rules={[{ required: true, message: '请输入公司名称' }]}
                    >
                        <Input placeholder="例如：某某科技有限公司" />
                    </Form.Item>

                    <Form.Item
                        name="position"
                        label="职位名称"
                        rules={[{ required: true, message: '请输入职位名称' }]}
                    >
                        <Input placeholder="例如：高级前端工程师" />
                    </Form.Item>

                    <Form.Item
                        name="dateRange"
                        label="在职时间"
                        rules={[{ required: true, message: '请选择时间段' }]}
                    >
                        <RangePicker picker="month" className="w-full" />
                    </Form.Item>

                    <Form.Item
                        name="tags"
                        label="技能标签 (用逗号分隔)"
                    >
                        <Input placeholder="例如：Java, Spring Boot, React" />
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label="工作内容"
                        rules={[{ required: true, message: '请输入工作内容' }]}
                    >
                        <TextArea rows={6} placeholder="描述你的主要工作职责和业绩..." />
                    </Form.Item>
                </Form>
            </Modal>
        </Card>
    );
};

export default WorkExperienceSection;
