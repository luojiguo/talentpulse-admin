import React, { useState, useEffect } from 'react';
import { Button, Card, Form, Input, DatePicker, Modal, List, message, Tag, Typography, Row, Col, App } from 'antd';
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
    const { modal } = App.useApp();

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
        modal.confirm({
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
        <Card className="mb-0 shadow-sm rounded-3xl group hover:shadow-xl hover:shadow-brand-500/5 transition-all duration-500 border border-slate-100 dark:border-slate-800 dark:bg-slate-900" variant="borderless">
            <div className="flex justify-between items-center mb-8 pl-4 border-l-4 border-brand-500 transition-all">
                <Title level={4} style={{ margin: 0 }} className="dark:text-white !font-bold !text-xl tracking-tight">工作/实习经历</Title>
                <div className="opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <Button
                        type="link"
                        icon={<PlusOutlined />}
                        onClick={handleAdd}
                        className="text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 font-bold flex items-center gap-1"
                    >
                        添加经历
                    </Button>
                </div>
            </div>

            <div className="flex flex-col gap-6">
                {loading && (
                    <div className="flex items-center justify-center py-10">
                        <div className="w-8 h-8 border-4 border-brand-100 dark:border-slate-800 border-t-brand-500 rounded-full animate-spin"></div>
                    </div>
                )}

                {!loading && experiences.length === 0 && (
                    <div className="text-center py-12 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border-2 border-dashed border-slate-100 dark:border-slate-800">
                        <p className="text-slate-400 dark:text-slate-500 font-medium">还没有工作经历哦，点击右上角添加</p>
                    </div>
                )}

                {!loading && experiences.map((item) => (
                    <div key={item.id} className="group/item relative bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-50 dark:border-slate-800/50 hover:border-brand-100 dark:hover:border-brand-500/20 hover:shadow-lg hover:shadow-brand-500/5 transition-all duration-300">
                        <div className="flex justify-between items-start w-full">
                            <div className="flex-1">
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center gap-4">
                                        <h4 className="font-bold text-lg m-0 text-slate-900 dark:text-white tracking-tight">{item.company_name}</h4>
                                        <span className="px-3 py-1 bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 rounded-xl text-sm font-black tracking-tight">
                                            {item.position}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm font-bold text-slate-500 dark:text-slate-400">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 bg-brand-400 rounded-full"></div>
                                            <span>{item.start_date} - {item.end_date}</span>
                                        </div>
                                    </div>
                                </div>

                                {item.tags && (
                                    <div className="flex flex-wrap gap-2 mt-4">
                                        {item.tags.split(',').map((tag: string, index: number) => (
                                            <span key={index} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-[11px] font-bold border border-slate-200 dark:border-slate-700">
                                                {tag.trim()}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-slate-600 dark:text-slate-400 text-sm leading-relaxed border-l-2 border-brand-200 dark:border-brand-500/30 whitespace-pre-wrap">
                                    <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">工作内容</div>
                                    {item.description}
                                </div>
                            </div>
                            <div className="flex gap-1 ml-4 transition-all duration-300 opacity-0 group-hover/item:opacity-100">
                                <Button
                                    type="text"
                                    icon={<EditOutlined className="text-brand-600 dark:text-brand-400" />}
                                    onClick={() => handleEdit(item)}
                                    className="hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-xl"
                                />
                                <Button
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => handleDelete(item.id)}
                                    className="hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <Modal
                title={<span className="text-slate-900 dark:text-white font-bold tracking-tight">工作/实习经历</span>}
                open={isModalVisible}
                onOk={handleModalOk}
                onCancel={() => setIsModalVisible(false)}
                width={600}
                okText="确认保存"
                cancelText="取消"
                className="dark:bg-slate-900"
                styles={{
                    body: {
                        borderRadius: '24px',
                        padding: '24px',
                        backgroundColor: 'var(--modal-bg, #ffffff)'
                    }
                }}
            >
                <Form form={form} layout="vertical" className="mt-4 profile-form">
                    <Row gutter={20}>
                        <Col span={12}>
                            <Form.Item
                                name="company_name"
                                label="公司名称"
                                rules={[{ required: true, message: '请输入公司名称' }]}
                            >
                                <Input placeholder="例如：某某科技有限公司" className="rounded-2xl h-12" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="position"
                                label="职位名称"
                                rules={[{ required: true, message: '请输入职位名称' }]}
                            >
                                <Input placeholder="例如：高级前端工程师" className="rounded-2xl h-12" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={20}>
                        <Col span={12}>
                            <Form.Item
                                name="dateRange"
                                label="在职时间"
                                rules={[{ required: true, message: '请选择时间段' }]}
                            >
                                <RangePicker picker="month" className="w-full rounded-2xl h-12" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="tags"
                                label="技能标签 (用逗号分隔)"
                            >
                                <Input placeholder="例如：Java, Spring Boot, React" className="rounded-2xl h-12" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        name="description"
                        label="工作内容"
                        rules={[{ required: true, message: '请输入工作内容' }]}
                    >
                        <TextArea rows={6} placeholder="描述你的主要工作职责和业绩..." className="rounded-2xl" />
                    </Form.Item>
                </Form>
            </Modal>
            <style dangerouslySetInnerHTML={{
                __html: `
                .profile-form .ant-form-item-label label {
                    font-size: 11px;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: #94a3b8;
                }
                .dark .profile-form .ant-form-item-label label {
                    color: #64748b;
                }
                .profile-form .ant-input, .profile-form .ant-select-selector, .profile-form .ant-picker, .profile-form .ant-input-affix-wrapper {
                    border-radius: 16px !important;
                    border: none !important;
                    background-color: #f8fafc !important;
                    box-shadow: none !important;
                    padding-left: 16px !important;
                    padding-right: 16px !important;
                }
                .dark .profile-form .ant-input, .dark .profile-form .ant-select-selector, .dark .profile-form .ant-picker, .dark .profile-form .ant-input-affix-wrapper {
                    background-color: #0f172a !important;
                    color: #f1f5f9 !important;
                }
                .profile-form .ant-input:focus, .profile-form .ant-select-focused .ant-select-selector, .profile-form .ant-picker-focused, .profile-form .ant-input-affix-wrapper-focused {
                    background-color: #ffffff !important;
                    box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.1) !important;
                }
                .dark .profile-form .ant-input:focus, .dark .profile-form .ant-select-focused .ant-select-selector, .profile-form .ant-picker-focused, .profile-form .ant-input-affix-wrapper-focused {
                    background-color: #1e293b !important;
                }
            ` }} />
        </Card>
    );
};

export default WorkExperienceSection;
