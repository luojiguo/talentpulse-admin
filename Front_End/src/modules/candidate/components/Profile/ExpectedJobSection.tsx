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
        <Card className="mb-0 shadow-sm rounded-[2.5rem] group hover:shadow-2xl hover:shadow-brand-500/5 transition-all duration-500 border border-slate-100 dark:border-slate-800 dark:bg-slate-900" variant="borderless">
            <div className="flex justify-between items-center mb-10 pl-5 border-l-4 border-brand-500 transition-all">
                <Title level={4} style={{ margin: 0 }} className="dark:text-white !font-black !text-2xl tracking-tight">期望职位</Title>
                <div className="opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <Button 
                        type="link" 
                        icon={<PlusOutlined />} 
                        onClick={handleAdd}
                        className="text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 font-black flex items-center gap-2 bg-brand-50 dark:bg-brand-900/20 px-4 py-2 rounded-xl border border-brand-100 dark:border-brand-900/30"
                    >
                        添加期望
                    </Button>
                </div>
            </div>

            <div className="flex flex-col gap-6">
                {loading && (
                    <div className="flex items-center justify-center py-16">
                        <div className="relative">
                            <div className="w-12 h-12 border-4 border-brand-100 dark:border-slate-800 border-t-brand-500 rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-2 h-2 bg-brand-500 rounded-full animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                )}

                {!loading && items.length === 0 && (
                    <div className="text-center py-20 bg-slate-50/50 dark:bg-slate-800/30 rounded-[2rem] border-2 border-dashed border-slate-100 dark:border-slate-800 group/empty hover:border-brand-200 transition-colors">
                        <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-50 dark:border-slate-700 group-hover/empty:scale-110 transition-transform duration-500">
                            <PlusOutlined className="text-brand-500 text-xl" />
                        </div>
                        <p className="text-slate-400 dark:text-slate-500 font-bold">还没有添加期望职位，点击右上角添加</p>
                    </div>
                )}

                {!loading && items.map((item) => (
                    <div key={item.id} className="group/item relative bg-slate-50/30 dark:bg-slate-800/30 p-8 rounded-[2rem] border border-slate-50 dark:border-slate-800/50 hover:border-brand-100 dark:hover:border-brand-500/20 hover:bg-white dark:hover:bg-slate-800 hover:shadow-2xl hover:shadow-brand-500/5 transition-all duration-500">
                        <div className="flex justify-between items-start w-full">
                            <div className="flex-1">
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center gap-6">
                                        <span className="font-black text-xl text-slate-900 dark:text-white tracking-tight">{item.position}</span>
                                        <span className="px-4 py-1.5 bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 rounded-xl text-sm font-black tracking-tight border border-brand-100 dark:border-brand-900/30 shadow-sm">
                                            {renderExperienceTag(item)}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-6 text-sm font-bold text-slate-500 dark:text-slate-400">
                                        <div className="flex items-center gap-2.5 bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                            <div className="w-2 h-2 bg-brand-400 rounded-full shadow-sm"></div>
                                            <span>{item.city}</span>
                                        </div>
                                        <div className="flex items-center gap-2.5 bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                            <div className="w-2 h-2 bg-emerald-400 rounded-full shadow-sm"></div>
                                            <span>{item.industry}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2 ml-4 transition-all duration-500 opacity-0 group-hover/item:opacity-100 translate-x-4 group-hover/item:translate-x-0">
                                <Button 
                                    type="text" 
                                    icon={<EditOutlined className="text-brand-600 dark:text-brand-400" />} 
                                    onClick={() => handleEdit(item)}
                                    className="hover:bg-brand-50 dark:hover:bg-brand-900/30 rounded-xl w-10 h-10 flex items-center justify-center border border-transparent hover:border-brand-100 dark:hover:border-brand-900/30"
                                />
                                <Button 
                                    type="text" 
                                    danger 
                                    icon={<DeleteOutlined />} 
                                    onClick={() => handleDelete(item.id)}
                                    className="hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl w-10 h-10 flex items-center justify-center border border-transparent hover:border-rose-100 dark:hover:border-rose-900/30"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <Modal
                title={<span className="text-slate-900 dark:text-white font-black tracking-tight text-xl">期望职位</span>}
                open={isModalVisible}
                onOk={handleModalOk}
                onCancel={() => setIsModalVisible(false)}
                width={600}
                okText="确认保存"
                cancelText="取消"
                className="dark:bg-slate-900"
                styles={{
                    body: {
                        borderRadius: '32px',
                        padding: '32px',
                        backgroundColor: 'var(--modal-bg, #ffffff)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)'
                    }
                }}
            >
                <Form form={form} layout="vertical" className="mt-8 profile-form">
                    <Form.Item
                        name="position"
                        label="期望职位"
                        rules={[{ required: true, message: '请输入期望职位' }]}
                    >
                        <Input placeholder="例如：产品经理" className="rounded-2xl h-14 bg-slate-50 dark:bg-slate-800 border-none focus:ring-4 focus:ring-brand-500/10 transition-all text-base font-bold" />
                    </Form.Item>

                    <Form.Item
                        name="industry"
                        label="期望行业"
                        rules={[{ required: true, message: '请输入期望行业' }]}
                    >
                        <Select
                            placeholder="请选择期望行业"
                            showSearch
                            allowClear
                            optionFilterProp="children"
                            className="rounded-2xl h-14"
                            popupClassName="dark:bg-slate-800"
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

                    <Row gutter={24}>
                        <Col span={12}>
                            <Form.Item
                                name="salary_min"
                                label="最低薪资 (K)"
                                rules={[{ required: true, message: '请输入最低薪资' }]}
                            >
                                <Input type="number" suffix={<span className="font-black text-brand-500">K</span>} className="rounded-2xl h-14 bg-slate-50 dark:bg-slate-800 border-none focus:ring-4 focus:ring-brand-500/10 transition-all text-base font-bold" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="salary_max"
                                label="最高薪资 (K)"
                                rules={[{ required: true, message: '请输入最高薪资' }]}
                            >
                                <Input type="number" suffix={<span className="font-black text-brand-500">K</span>} className="rounded-2xl h-14 bg-slate-50 dark:bg-slate-800 border-none focus:ring-4 focus:ring-brand-500/10 transition-all text-base font-bold" />
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
                            className="rounded-2xl h-14"
                            popupClassName="dark:bg-slate-800"
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
            <style dangerouslySetInnerHTML={{ __html: `
                .profile-form .ant-form-item-label label {
                    font-size: 11px;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    color: #94a3b8;
                    margin-bottom: 8px;
                }
                .dark .profile-form .ant-form-item-label label {
                    color: #64748b;
                }
                .profile-form .ant-input, .profile-form .ant-select-selector, .profile-form .ant-picker, .profile-form .ant-input-affix-wrapper {
                    border-radius: 20px !important;
                    border: 2px solid transparent !important;
                    background-color: #f8fafc !important;
                    box-shadow: none !important;
                    padding-left: 20px !important;
                    padding-right: 20px !important;
                    transition: all 0.3s ease !important;
                }
                .dark .profile-form .ant-input, .dark .profile-form .ant-select-selector, .dark .profile-form .ant-picker, .dark .profile-form .ant-input-affix-wrapper {
                    background-color: #0f172a !important;
                    color: #f1f5f9 !important;
                }
                .profile-form .ant-input:focus, .profile-form .ant-select-focused .ant-select-selector, .profile-form .ant-picker-focused, .profile-form .ant-input-affix-wrapper-focused {
                    background-color: #ffffff !important;
                    border-color: rgba(16, 185, 129, 0.2) !important;
                    box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1) !important;
                }
                .dark .profile-form .ant-input:focus, .dark .profile-form .ant-select-focused .ant-select-selector, .dark .profile-form .ant-picker-focused, .dark .profile-form .ant-input-affix-wrapper-focused {
                    background-color: #1e293b !important;
                }
                .ant-modal-footer .ant-btn-primary {
                    background-color: #10B981 !important;
                    border-radius: 16px !important;
                    height: 48px !important;
                    padding: 0 32px !important;
                    font-weight: 900 !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.05em !important;
                    box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.2) !important;
                }
                .ant-modal-footer .ant-btn-default {
                    border-radius: 16px !important;
                    height: 48px !important;
                    padding: 0 32px !important;
                    font-weight: 700 !important;
                }
            ` }} />
        </Card>
    );
};

export default ExpectedJobSection;
