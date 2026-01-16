import React, { useState, useEffect } from 'react';
import { Button, Card, Form, Input, DatePicker, Modal, List, message, Typography, Row, Col, App } from 'antd';
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
    const { modal } = App.useApp();

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
        modal.confirm({
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
        <Card className="mb-0 shadow-sm rounded-3xl group hover:shadow-xl hover:shadow-brand-500/5 transition-all duration-500 border border-slate-100 dark:border-slate-800 dark:bg-slate-900" variant="borderless">
            <div className="flex justify-between items-center mb-8 pl-4 border-l-4 border-brand-500 transition-all">
                <Title level={4} style={{ margin: 0 }} className="dark:text-white !font-bold !text-xl tracking-tight">项目经历</Title>
                <div className="opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <Button
                        type="link"
                        icon={<PlusOutlined />}
                        onClick={handleAdd}
                        className="text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 font-bold flex items-center gap-1"
                    >
                        添加项目
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
                        <p className="text-slate-400 dark:text-slate-500 font-medium">还没有项目经历哦，点击右上角添加</p>
                    </div>
                )}

                {!loading && experiences.map((item) => (
                    <div key={item.id} className="group/item relative bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-50 dark:border-slate-800/50 hover:border-brand-100 dark:hover:border-brand-500/20 hover:shadow-lg hover:shadow-brand-500/5 transition-all duration-300">
                        <div className="flex justify-between items-start w-full">
                            <div className="flex-1">
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center gap-4">
                                        <h4 className="font-bold text-lg m-0 text-slate-900 dark:text-white tracking-tight">{item.project_name}</h4>
                                        <span className="px-3 py-1 bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 rounded-xl text-sm font-black tracking-tight">
                                            {item.role}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4 text-sm font-bold text-slate-500 dark:text-slate-400">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 bg-brand-400 rounded-full"></div>
                                            <span>{item.start_date} - {item.end_date}</span>
                                        </div>
                                        {item.project_link && (
                                            <>
                                                <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></span>
                                                <a
                                                    href={item.project_link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
                                                >
                                                    <LinkOutlined className="text-xs" />
                                                    <span>项目链接</span>
                                                </a>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-slate-600 dark:text-slate-400 text-sm leading-relaxed border-l-2 border-brand-200 dark:border-brand-500/30 whitespace-pre-wrap">
                                    <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">项目描述</div>
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
                title={<span className="text-slate-900 dark:text-white font-bold tracking-tight">项目经历</span>}
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
                                name="project_name"
                                label="项目名称"
                                rules={[{ required: true, message: '请输入项目名称' }]}
                            >
                                <Input placeholder="例如：电商平台重构" className="rounded-2xl h-12" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="role"
                                label="担任角色"
                                rules={[{ required: true, message: '请输入担任角色' }]}
                            >
                                <Input placeholder="例如：前端负责人" className="rounded-2xl h-12" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={20}>
                        <Col span={12}>
                            <Form.Item
                                name="dateRange"
                                label="项目时间"
                                rules={[{ required: true, message: '请选择时间段' }]}
                            >
                                <RangePicker picker="month" className="w-full rounded-2xl h-12" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="project_link"
                                label="项目链接 (选填)"
                            >
                                <Input placeholder="例如：https://github.com/..." className="rounded-2xl h-12" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        name="description"
                        label="项目描述"
                        rules={[{ required: true, message: '请输入项目描述' }]}
                    >
                        <TextArea rows={6} placeholder="描述项目的背景、你的职责以及取得的成果..." className="rounded-2xl" />
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
                .dark .profile-form .ant-input:focus, .dark .profile-form .ant-select-focused .ant-select-selector, .dark .profile-form .ant-picker-focused, .dark .profile-form .ant-input-affix-wrapper-focused {
                    background-color: #1e293b !important;
                }
            ` }} />
        </Card>
    );
};

export default ProjectExperienceSection;
