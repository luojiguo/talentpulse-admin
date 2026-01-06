import React, { useState, useEffect } from 'react';
import { Button, Card, Form, Input, DatePicker, Modal, List, message, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, LinkOutlined } from '@ant-design/icons';
import { candidateAPI } from '@/services/candidateService';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { RangePicker } = DatePicker;
const { Title } = Typography;

interface ProjectExperienceSectionProps {
    userId: string | number;
    refreshTrigger?: number;
}

const ProjectExperienceSection: React.FC<ProjectExperienceSectionProps> = ({ userId, refreshTrigger = 0 }) => {
    const [experiences, setExperiences] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingId, setEditingId] = useState<string | number | null>(null);
    const [form] = Form.useForm();

    const fetchExperiences = async () => {
        try {
            setLoading(true);
            const res = await candidateAPI.getProjectExperiences(userId);
            if (res.data) {
                setExperiences(res.data);
            }
        } catch (error) {
            message.error('加载项目经历失败');
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
            project_name: item.project_name,
            role: item.role,
            dateRange: [
                item.start_date ? dayjs(item.start_date) : null,
                item.end_date ? dayjs(item.end_date) : null,
            ],
            description: item.description,
            project_link: item.project_link,
        });
        setIsModalVisible(true);
    };

    const handleDelete = async (id: string | number) => {
        Modal.confirm({
            title: '确认删除',
            content: '确定要删除这条项目经历吗？',
            onOk: async () => {
                try {
                    await candidateAPI.deleteProjectExperience(userId, id);
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
                project_name: values.project_name,
                role: values.role,
                start_date: values.dateRange ? values.dateRange[0].format('YYYY-MM-DD') : null,
                end_date: values.dateRange ? values.dateRange[1].format('YYYY-MM-DD') : null,
                description: values.description,
                project_link: values.project_link,
            };

            if (editingId) {
                await candidateAPI.updateProjectExperience(userId, editingId, payload);
                message.success('更新成功');
            } else {
                await candidateAPI.addProjectExperience(userId, payload);
                message.success('添加成功');
            }

            setIsModalVisible(false);
            fetchExperiences();
        } catch (error) {
            message.error('操作失败');
        }
    };

    return (
        <Card className="mb-0 shadow-sm rounded-lg group hover:shadow-md transition-shadow" variant="borderless">
            <div className="flex justify-between items-center mb-6 pl-4 border-l-4 border-blue-500">
                <Title level={4} style={{ margin: 0 }}>项目经历</Title>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Button type="link" icon={<PlusOutlined />} onClick={handleAdd}>
                        添加
                    </Button>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                {loading && <div className="text-center py-4">加载中...</div>}

                {!loading && experiences.length === 0 && (
                    <div className="text-center py-8 text-gray-400">暂无项目经历，请添加</div>
                )}

                {!loading && experiences.map((item) => (
                    <div key={item.id} className="group border-b border-gray-100 pb-4 mb-2 last:border-0 last:mb-0 last:pb-0">
                        <div className="flex justify-between items-start w-full">
                            <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <h4 className="font-bold text-lg m-0">{item.project_name}</h4>
                                    <span className="text-gray-500 font-normal text-sm border-l border-gray-300 pl-2">{item.role}</span>
                                    <span className="text-gray-500 text-sm border-l border-gray-300 pl-2">
                                        {item.start_date} - {item.end_date}
                                    </span>
                                    {item.project_link && (
                                        <a href={item.project_link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-sm border-l border-gray-300 pl-2">
                                            <LinkOutlined className="mr-1" /> 项目链接
                                        </a>
                                    )}
                                </div>
                                <div className="text-gray-700 whitespace-pre-wrap">
                                    <span className="font-bold">项目描述：</span> {item.description}
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
                title={editingId ? "编辑项目经历" : "添加项目经历"}
                open={isModalVisible}
                onOk={handleModalOk}
                onCancel={() => setIsModalVisible(false)}
                width={600}
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="project_name"
                        label="项目名称"
                        rules={[{ required: true, message: '请输入项目名称' }]}
                    >
                        <Input placeholder="例如：电商平台重构" />
                    </Form.Item>

                    <Form.Item
                        name="role"
                        label="担任角色"
                        rules={[{ required: true, message: '请输入担任角色' }]}
                    >
                        <Input placeholder="例如：前端负责人" />
                    </Form.Item>

                    <Form.Item
                        name="dateRange"
                        label="项目时间"
                        rules={[{ required: true, message: '请选择时间段' }]}
                    >
                        <RangePicker picker="month" className="w-full" />
                    </Form.Item>

                    <Form.Item
                        name="project_link"
                        label="项目链接 (选填)"
                    >
                        <Input placeholder="例如：https://github.com/..." />
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label="项目描述"
                        rules={[{ required: true, message: '请输入项目描述' }]}
                    >
                        <TextArea rows={6} placeholder="描述项目的背景、你的职责以及取得的成果..." />
                    </Form.Item>
                </Form>
            </Modal>
        </Card>
    );
};

export default ProjectExperienceSection;
