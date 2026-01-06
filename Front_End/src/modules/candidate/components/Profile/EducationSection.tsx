import React, { useState, useEffect } from 'react';
import { Button, Card, Form, Input, DatePicker, Modal, List, message, Typography, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { candidateAPI } from '@/services/candidateService';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { RangePicker } = DatePicker;
const { Title } = Typography;
const { Option } = Select;

interface EducationSectionProps {
    userId: string | number;
    dictionaries?: any;
    refreshTrigger?: number;
}

const EducationSection: React.FC<EducationSectionProps> = ({ userId, dictionaries = {}, refreshTrigger = 0 }) => {
    const [experiences, setExperiences] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingId, setEditingId] = useState<string | number | null>(null);
    const [form] = Form.useForm();

    const fetchExperiences = async () => {
        try {
            setLoading(true);
            const res = await candidateAPI.getEducationExperiences(userId);
            if (res.data) {
                setExperiences(res.data);
            }
        } catch (error) {
            message.error('加载教育经历失败');
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
            school: item.school,
            major: item.major,
            degree: item.degree,
            dateRange: [
                item.start_date ? dayjs(item.start_date) : null,
                item.end_date ? dayjs(item.end_date) : null,
            ],
            description: item.description,
        });
        setIsModalVisible(true);
    };

    const handleDelete = async (id: string | number) => {
        Modal.confirm({
            title: '确认删除',
            content: '确定要删除这条教育经历吗？',
            onOk: async () => {
                try {
                    await candidateAPI.deleteEducationExperience(userId, id);
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
                school: values.school,
                major: values.major,
                degree: values.degree,
                start_date: values.dateRange ? values.dateRange[0].format('YYYY-MM-DD') : null,
                end_date: values.dateRange ? values.dateRange[1].format('YYYY-MM-DD') : null,
                description: values.description,
            };

            if (editingId) {
                await candidateAPI.updateEducationExperience(userId, editingId, payload);
                message.success('更新成功');
            } else {
                await candidateAPI.addEducationExperience(userId, payload);
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
                <Title level={4} style={{ margin: 0 }}>教育经历</Title>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Button type="link" icon={<PlusOutlined />} onClick={handleAdd}>
                        添加
                    </Button>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                {loading && <div className="text-center py-4">加载中...</div>}

                {!loading && experiences.length === 0 && (
                    <div className="text-center py-8 text-gray-400">暂无教育经历，请添加</div>
                )}

                {!loading && experiences.map((item) => (
                    <div key={item.id} className="group border-b border-gray-100 pb-4 mb-2 last:border-0 last:mb-0 last:pb-0">
                        <div className="flex justify-between items-start w-full">
                            <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <h4 className="font-bold text-lg m-0">{item.school}</h4>
                                    <span className="text-gray-700 text-sm border-l border-gray-300 pl-2">
                                        {item.degree} | {item.major}
                                    </span>
                                    <span className="text-gray-500 text-sm border-l border-gray-300 pl-2">
                                        {item.start_date} - {item.end_date}
                                    </span>
                                </div>
                                {item.description && (
                                    <div className="text-gray-600">
                                        <span className="font-bold">在校经历：</span> {item.description}
                                    </div>
                                )}
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
                title={editingId ? "编辑教育经历" : "添加教育经历"}
                open={isModalVisible}
                onOk={handleModalOk}
                onCancel={() => setIsModalVisible(false)}
                width={600}
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="school"
                        label="学校名称"
                        rules={[{ required: true, message: '请输入学校名称' }]}
                    >
                        <Input placeholder="例如：北京大学" />
                    </Form.Item>

                    <Form.Item
                        name="major"
                        label="专业"
                        rules={[{ required: true, message: '请输入专业' }]}
                    >
                        <Input placeholder="例如：计算机科学与技术" />
                    </Form.Item>

                    <Form.Item
                        name="degree"
                        label="学历"
                        rules={[{ required: true, message: '请选择学历' }]}
                    >
                        <Select placeholder="请选择">
                            {dictionaries.degree && dictionaries.degree.length > 0 ? (
                                dictionaries.degree.map((d: string) => (
                                    <Option key={d} value={d}>{d}</Option>
                                ))
                            ) : (
                                <>
                                    <Option value="高中">高中</Option>
                                    <Option value="大专">大专</Option>
                                    <Option value="本科">本科</Option>
                                    <Option value="硕士">硕士</Option>
                                    <Option value="博士">博士</Option>
                                    <Option value="其他">其他</Option>
                                </>
                            )}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="dateRange"
                        label="在校时间"
                        rules={[{ required: true, message: '请选择时间段' }]}
                    >
                        <RangePicker picker="year" className="w-full" />
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label="在校经历 (选填)"
                    >
                        <TextArea rows={4} placeholder="描述在校期间的成就、活动等..." />
                    </Form.Item>
                </Form>
            </Modal>
        </Card>
    );
};

export default EducationSection;
