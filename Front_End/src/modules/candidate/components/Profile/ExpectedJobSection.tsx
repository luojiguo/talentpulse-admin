import React, { useState, useEffect } from 'react';
import { Button, Card, Form, Input, Modal, List, message, Typography, Select, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { candidateAPI } from '@/services/candidateService';

const { Option } = Select;
const { Title } = Typography;

interface ExpectedJobSectionProps {
    userId: string | number;
    dictionaries?: any;
    refreshTrigger?: number;
}

const ExpectedJobSection: React.FC<ExpectedJobSectionProps> = ({ userId, dictionaries = {}, refreshTrigger = 0 }) => {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingId, setEditingId] = useState<string | number | null>(null);
    const [form] = Form.useForm();

    const fetchItems = async () => {
        try {
            setLoading(true);
            const res = await candidateAPI.getExpectedPositions(userId);
            if (res.data) {
                setItems(res.data);
            }
        } catch (error) {
            message.error('加载期望职位失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userId) {
            fetchItems();
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
            position: item.position,
            industry: item.industry,
            salary_min: item.salary_min ? item.salary_min / 1000 : null, // Convert to K
            salary_max: item.salary_max ? item.salary_max / 1000 : null, // Convert to K
            city: item.city,
        });
        setIsModalVisible(true);
    };

    const handleDelete = async (id: string | number) => {
        Modal.confirm({
            title: '确认删除',
            content: '确定要删除这条期望职位吗？',
            onOk: async () => {
                try {
                    await candidateAPI.deleteExpectedPosition(userId, id);
                    message.success('删除成功');
                    fetchItems();
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
                position: values.position,
                industry: values.industry,
                salary_min: values.salary_min ? values.salary_min * 1000 : null,
                salary_max: values.salary_max ? values.salary_max * 1000 : null,
                city: values.city,
            };

            if (editingId) {
                await candidateAPI.updateExpectedPosition(userId, editingId, payload);
                message.success('更新成功');
            } else {
                await candidateAPI.addExpectedPosition(userId, payload);
                message.success('添加成功');
            }

            setIsModalVisible(false);
            fetchItems();
        } catch (error) {
            message.error('操作失败');
        }
    };

    const renderExperienceTag = (item: any) => {
        if (item.salary_min && item.salary_max) {
            return `${item.salary_min / 1000}-${item.salary_max / 1000}K`;
        }
        return '面议';
    }

    return (
        <Card className="mb-0 shadow-sm rounded-lg group hover:shadow-md transition-shadow" variant="borderless">
            <div className="flex justify-between items-center mb-6 pl-4 border-l-4 border-blue-500">
                <Title level={4} style={{ margin: 0 }}>期望职位</Title>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Button type="link" icon={<PlusOutlined />} onClick={handleAdd}>
                        添加
                    </Button>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                {loading && <div className="text-center py-4">加载中...</div>}

                {!loading && items.length === 0 && (
                    <div className="text-center py-8 text-gray-400">暂无期望职位，请添加</div>
                )}

                {!loading && items.map((item) => (
                    <div key={item.id} className="group border-b border-gray-100 pb-4 mb-2 last:border-0 last:mb-0 last:pb-0">
                        <div className="flex justify-between items-start w-full">
                            <div className="flex-1">
                                <div className="flex items-center mb-1">
                                    <span className="font-bold text-lg mr-4">{item.position}</span>
                                    <span className="text-blue-600 font-medium">
                                        {renderExperienceTag(item)}
                                    </span>
                                </div>
                                <div className="text-gray-500">
                                    {item.city} | {item.industry}
                                </div>
                            </div>
                            <div className="flex gap-2 transition-opacity duration-200 opacity-0 group-hover:opacity-100">
                                <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(item)}>编辑</Button>
                                <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(item.id)}>删除</Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <Modal
                title={editingId ? "编辑期望职位" : "添加期望职位"}
                open={isModalVisible}
                onOk={handleModalOk}
                onCancel={() => setIsModalVisible(false)}
                width={600}
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="position"
                        label="期望职位"
                        rules={[{ required: true, message: '请输入期望职位' }]}
                    >
                        <Input placeholder="例如：产品经理" />
                    </Form.Item>

                    <Form.Item
                        name="industry"
                        label="期望行业"
                        rules={[{ required: true, message: '请输入期望行业' }]}
                    >
                        {/* Use Select with Dictionary options or Input as fallback */}
                        <Select
                            placeholder="请选择期望行业"
                            showSearch
                            allowClear
                            optionFilterProp="children"
                        >
                            {dictionaries.industry && dictionaries.industry.length > 0 ? (
                                dictionaries.industry.map((ind: string) => (
                                    <Option key={ind} value={ind}>{ind}</Option>
                                ))
                            ) : (
                                <Option value="互联网/IT">互联网/IT</Option>
                            )}
                        </Select>
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="salary_min"
                                label="最低薪资 (K)"
                                rules={[{ required: true, message: '请输入最低薪资' }]}
                            >
                                <Input type="number" suffix="K" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="salary_max"
                                label="最高薪资 (K)"
                                rules={[{ required: true, message: '请输入最高薪资' }]}
                            >
                                <Input type="number" suffix="K" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        name="city"
                        label="工作城市"
                        rules={[{ required: true, message: '请输入工作城市' }]}
                    >
                        <Select
                            placeholder="请选择工作城市"
                            showSearch
                            allowClear
                            optionFilterProp="children"
                        >
                            {dictionaries.city && dictionaries.city.length > 0 ? (
                                dictionaries.city.map((c: string) => (
                                    <Option key={c} value={c}>{c}</Option>
                                ))
                            ) : (
                                <>
                                    <Option value="北京">北京</Option>
                                    <Option value="上海">上海</Option>
                                    <Option value="广州">广州</Option>
                                    <Option value="深圳">深圳</Option>
                                </>
                            )}
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </Card>
    );
};

export default ExpectedJobSection;
