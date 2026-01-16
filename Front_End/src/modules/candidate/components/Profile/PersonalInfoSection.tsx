import React, { useState } from 'react';
import { Button, Card, Form, Input, DatePicker, Select, message, Upload, Avatar, Typography, Row, Col, Modal, App } from 'antd';
import { EditOutlined, UserOutlined, UploadOutlined } from '@ant-design/icons';
import { userAPI, candidateAPI } from '@/services/apiService';
import dayjs from 'dayjs';
import { processAvatarUrl } from '@/components/AvatarUploadComponent';
import UserAvatar from '@/components/UserAvatar';

const { Option } = Select;
const { Title } = Typography;

interface PersonalInfoSectionProps {
    user: any;
    onUpdate: (updatedData?: any) => void; // 可选参数：如果传递了数据，则局部更新；否则刷新
    renderExtraHeader?: () => React.ReactNode;
}

const STATUS_OPTIONS = [
    { label: "离校-随时到岗", value: "active" },
    { label: "在职-暂不考虑", value: "inactive" },
    { label: "在职-看机会", value: "open" },
    { label: "在校-寻找实习", value: "intern" }
];

const PersonalInfoSection: React.FC<PersonalInfoSectionProps> = ({ user, onUpdate, renderExtraHeader }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const { modal } = App.useApp();

    // Initialize form values
    const initValues = () => {
        // Handle both camelCase and snake_case from backend response
        form.setFieldsValue({
            name: user.name,
            gender: user.gender,
            // Support both birth_date (snake_case) and birthDate (camelCase)
            birth_date: (user.birth_date || user.birthDate) ? dayjs(user.birth_date || user.birthDate) : null,
            phone: user.phone || '', // Ensure phone is always set, even if disabled
            email: user.email,
            wechat: user.wechat,
            // Support both work_experience_years (snake_case) and workExperienceYears (camelCase)
            work_experience_years: user.work_experience_years || user.workExperienceYears || 0,
            // Support both availability_status (snake_case) and jobStatus (camelCase)
            availability_status: user.availability_status || user.jobStatus || undefined
        });
    };

    const handleEdit = () => {
        initValues();
        setIsEditing(true);
    };

    const handleCancel = () => {
        modal.confirm({
            title: '确认取消',
            content: '您确定要取消编辑吗？未保存的内容将丢失。',
            okText: '确定',
            cancelText: '取消',
            onOk: () => {
                setIsEditing(false);
            }
        });
    };

    const handleAvatarUpload = async (options: any) => {
        const { file, onSuccess, onError } = options;
        try {
            message.loading({ content: '上传中...', key: 'avatarUpload' });
            const response = await userAPI.uploadAvatar(user.id, file);

            message.success({ content: '头像上传成功', key: 'avatarUpload' });
            onSuccess("ok");

            // 🚀 优化：从响应中获取新头像URL进行局部更新
            if (response.data && response.data.avatar) {
                const newAvatar = response.data.avatar;

                // 添加短暂延迟，确保文件已完全写入磁盘
                await new Promise(resolve => setTimeout(resolve, 500));

                // 添加时间戳参数强制浏览器重新加载
                const avatarUrlWithTimestamp = `${newAvatar}?t=${Date.now()}`;

                // 1. 更新当前个人信息模块的显示
                onUpdate({ avatar: avatarUrlWithTimestamp });

                // 2. 触发全局事件，通知Layout/Header更新头像
                window.dispatchEvent(new CustomEvent('userAvatarUpdated', {
                    detail: { avatar: avatarUrlWithTimestamp }
                }));
            } else {
                onUpdate(); // 保底刷新
            }
        } catch (error) {
            console.error('Avatar upload failed:', error);
            message.error({ content: '头像上传失败', key: 'avatarUpload' });
            onError(error);
        }
    };

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            // Construct payload strictly using snake_case to match backend API and database schema
            const payload: any = {
                name: values.name,
                gender: values.gender,
                birth_date: values.birth_date ? values.birth_date.format('YYYY-MM-DD') : null,
                phone: values.phone,
                email: values.email,
                wechat: values.wechat,
                work_experience_years: values.work_experience_years ? parseInt(String(values.work_experience_years), 10) : 0,
                availability_status: values.availability_status
            };

            console.log('Sending update request with payload:', JSON.stringify(payload, null, 2));

            const response = await userAPI.updateUser(user.id, payload);
            console.log('Update response:', response);

            message.success('保存成功');
            setIsEditing(false);
            onUpdate(); // Trigger refresh in parent
        } catch (error: any) {
            console.error('Save error details:', {
                error: error,
                message: error.message,
                response: error.response,
                stack: error.stack
            });

            // More detailed error message
            let errorMsg = '保存失败';
            if (error.response?.data?.message) {
                errorMsg = error.response.data.message;
            } else if (error.response?.data?.error) {
                errorMsg = error.response.data.error;
            } else if (error.message) {
                errorMsg = error.message;
            }

            message.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Helper to get display label. 
     * If val is one of the codes (active, inactive...), returns label.
     * If val is already the text (legacy data), returns val.
     */
    const getStatusLabel = (val: string) => {
        if (!val) return '未填写';

        // Handle standard English enums
        const normalize = (v: string) => v.toUpperCase();
        const upperVal = normalize(val);

        if (upperVal === 'AVAILABLE' || upperVal === 'ACTIVE') return '离校-随时到岗';
        if (upperVal === 'INACTIVE' || upperVal === 'NOT_LOOKING') return '在职-暂不考虑';
        if (upperVal === 'OPEN' || upperVal === 'OBSERVING' || upperVal === 'OPEN_TO_OPPORTUNITIES') return '在职-看机会';
        if (upperVal === 'INTERN' || upperVal === 'INTERNSHIP') return '在校-寻找实习';

        const found = STATUS_OPTIONS.find(o => normalize(o.value) === normalize(val));
        if (found) return found.label;

        // If not found in values, maybe it is the label itself?
        const foundByLabel = STATUS_OPTIONS.find(o => o.label === val);
        return foundByLabel ? foundByLabel.label : val;
    };

    return (
        <Card
            className={`mb-0 shadow-sm rounded-[2.5rem] group hover:shadow-2xl hover:shadow-brand-500/5 transition-all duration-500 border border-slate-100 dark:border-slate-800 dark:bg-slate-900 ${isEditing ? 'ring-4 ring-brand-500/10 bg-brand-50/5 dark:bg-brand-500/5' : ''}`}
            variant="borderless"
        >
            <div className="flex justify-between items-center mb-10 pl-5 border-l-4 border-brand-500 transition-all">
                <div className="flex items-center gap-6">
                    <Title level={4} style={{ margin: 0 }} className="dark:text-white !font-black !text-2xl tracking-tight">个人信息</Title>
                    {isEditing && (
                        <span className="text-[10px] px-3 py-1 bg-brand-50 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400 rounded-full font-black uppercase tracking-widest border border-brand-100 dark:border-brand-900/30">
                            正在编辑
                        </span>
                    )}
                    {renderExtraHeader && renderExtraHeader()}
                </div>
                {!isEditing && (
                    <div className="opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <Button
                            type="link"
                            icon={<EditOutlined />}
                            onClick={handleEdit}
                            className="text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 font-black flex items-center gap-2 bg-brand-50 dark:bg-brand-900/20 px-4 py-2 rounded-xl border border-brand-100 dark:border-brand-900/30"
                        >
                            编辑资料
                        </Button>
                    </div>
                )}
            </div>

            <div className="flex flex-col md:flex-row items-start gap-12">
                <div className="mx-auto md:mx-0 text-center relative">
                    {isEditing ? (
                        <Upload
                            name="avatar"
                            showUploadList={false}
                            customRequest={handleAvatarUpload}
                            accept="image/*"
                        >
                            <div className="cursor-pointer relative group">
                                <div className="absolute -inset-1 bg-gradient-to-tr from-brand-400 to-emerald-400 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                                <UserAvatar
                                    size={120}
                                    src={user.avatar}
                                    name={user.name}
                                    className="relative mb-2 group-hover:opacity-70 transition-all border-4 border-white dark:border-slate-800 shadow-2xl"
                                    style={{ color: '#007AFF', backgroundColor: '#EFF6FF' }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-brand-900/40 rounded-full h-[120px] w-[120px] mx-auto text-white text-[10px] font-black uppercase tracking-widest">
                                    更换头像
                                </div>
                            </div>
                        </Upload>
                    ) : (
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-tr from-brand-400 to-emerald-400 rounded-full blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                            <UserAvatar
                                size={120}
                                src={user.avatar}
                                name={user.name}
                                className="relative mb-2 border-4 border-white dark:border-slate-800 shadow-2xl"
                                style={{ color: '#007AFF', backgroundColor: '#EFF6FF' }}
                            />
                        </div>
                    )}
                </div>

                <div className="flex-1 w-full">
                    {isEditing ? (
                        <Form form={form} layout="vertical" onFinish={handleSave} className="profile-form">
                            <Row gutter={24}>
                                <Col span={12}>
                                    <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
                                        <Input placeholder="请输入您的姓名" className="rounded-2xl h-12 bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-brand-500/20 transition-all" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="availability_status" label="当前求职状态" rules={[{ required: true, message: '请选择求职状态' }]}>
                                        <Select placeholder="请选择求职状态" className="rounded-2xl h-12" classNames={{ popup: { root: 'dark:bg-slate-800' } }}>
                                            {STATUS_OPTIONS.map(opt => (
                                                <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Row gutter={24}>
                                <Col span={12}>
                                    <Form.Item name="gender" label="性别" rules={[{ required: true, message: '请选择性别' }]}>
                                        <Select placeholder="请选择性别" className="rounded-2xl h-12" classNames={{ popup: { root: 'dark:bg-slate-800' } }}>
                                            <Option value="男">男</Option>
                                            <Option value="女">女</Option>
                                            <Option value="其他">其他</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="work_experience_years" label="工作经验" rules={[
                                        { type: 'number', transform: (value) => Number(value), min: 0, max: 50, message: '工作经验范围应为0-50年' }
                                    ]}>
                                        <Input type="number" suffix="年" placeholder="请输入工作经验" className="rounded-2xl h-12 bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-brand-500/20 transition-all" />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Row gutter={24}>
                                <Col span={12}>
                                    <Form.Item name="birth_date" label="出生年月" rules={[
                                        { required: true, message: '请选择出生年月' },
                                        ({ getFieldValue }) => ({
                                            validator(_, value) {
                                                if (!value) {
                                                    return Promise.resolve();
                                                }
                                                const now = dayjs();
                                                const minAge = now.subtract(60, 'year');
                                                const maxAge = now.subtract(16, 'year');
                                                if (value.isBefore(minAge) || value.isAfter(maxAge)) {
                                                    return Promise.reject(new Error('出生年月应在16-60岁之间'));
                                                }
                                                return Promise.resolve();
                                            },
                                        }),
                                    ]}>
                                        <DatePicker className="w-full rounded-2xl h-12 bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-brand-500/20 transition-all" picker="month" placeholder="请选择出生年月" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="phone" label="电话">
                                        <Input disabled placeholder="手机号不可修改" className="rounded-2xl h-12 bg-slate-100 dark:bg-slate-800/50 border-none text-slate-400" />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Row gutter={24}>
                                <Col span={12}>
                                    <Form.Item name="wechat" label="微信号 (选填)" rules={[
                                        {
                                            pattern: /^[a-zA-Z][a-zA-Z0-9_-]{5,19}$/,
                                            message: '微信号格式不正确，应为6-20位字母开头，可包含数字、下划线或减号'
                                        }
                                    ]}>
                                        <Input placeholder="请输入您的微信号" className="rounded-2xl h-12 bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-brand-500/20 transition-all" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="email" label="邮箱 (选填)" rules={[
                                        {
                                            type: 'email',
                                            message: '邮箱格式不正确'
                                        }
                                    ]}>
                                        <Input placeholder="请输入您的邮箱" className="rounded-2xl h-12 bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-brand-500/20 transition-all" />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <div className="flex justify-end gap-4 mt-10 pt-8 border-t border-slate-50 dark:border-slate-800">
                                <Button onClick={handleCancel} className="px-8 h-12 rounded-2xl border-slate-200 text-slate-600 hover:text-brand-600 hover:border-brand-400 transition-all font-bold">取消</Button>
                                <Button type="primary" htmlType="submit" loading={loading} className="px-10 h-12 rounded-2xl bg-brand-500 hover:bg-brand-600 border-none shadow-xl shadow-brand-500/20 transition-all active:scale-95 font-black uppercase tracking-widest">
                                    保存资料
                                </Button>
                            </div>
                        </Form>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10 text-slate-700 dark:text-slate-300">
                            <div className="flex flex-col gap-2">
                                <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">姓名</span>
                                <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">{user.name}</span>
                            </div>
                            <div className="flex flex-col gap-2">
                                <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">求职状态</span>
                                <div>
                                    <span className="px-4 py-1.5 bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 rounded-xl text-xs font-black uppercase tracking-tight border border-brand-100 dark:border-brand-900/30">
                                        {getStatusLabel(user.availability_status || user.jobStatus)}
                                    </span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">性别</span>
                                <span className="text-base font-bold text-slate-800 dark:text-slate-200">{user.gender}</span>
                            </div>
                            <div className="flex flex-col gap-2">
                                <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">工作经验</span>
                                <span className="text-base font-black text-brand-600 dark:text-brand-400">{user.work_experience_years} 年经验</span>
                            </div>
                            <div className="flex flex-col gap-2">
                                <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">出生年月</span>
                                <span className="text-base font-bold text-slate-800 dark:text-slate-200">{user.birth_date ? dayjs(user.birth_date).format('YYYY-MM') : '未填写'}</span>
                            </div>
                            <div className="flex flex-col gap-2">
                                <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">联系电话</span>
                                <span className="text-base font-bold text-slate-800 dark:text-slate-200">{user.phone}</span>
                            </div>
                            <div className="flex flex-col gap-2">
                                <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">微信号码</span>
                                <span className="text-base font-bold text-slate-800 dark:text-slate-200">{user.wechat || <span className="text-slate-300 dark:text-slate-600 italic font-normal">未填写</span>}</span>
                            </div>
                            <div className="flex flex-col gap-2">
                                <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">电子邮箱</span>
                                <span className="font-bold">{user.email || <span className="text-slate-300 dark:text-slate-600 italic font-normal">未填写</span>}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
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
                .profile-form .ant-input, .profile-form .ant-select-selector, .profile-form .ant-picker {
                    border-radius: 16px !important;
                    border: none !important;
                    background-color: #f8fafc !important;
                    box-shadow: none !important;
                }
                .dark .profile-form .ant-input, .dark .profile-form .ant-select-selector, .dark .profile-form .ant-picker {
                    background-color: #0f172a !important;
                    color: #f1f5f9 !important;
                }
                .profile-form .ant-select-selection-item {
                    font-weight: 600 !important;
                }
                .profile-form .ant-input:focus, .profile-form .ant-select-focused .ant-select-selector, .profile-form .ant-picker-focused {
                    background-color: #ffffff !important;
                    box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.1) !important;
                }
                .dark .profile-form .ant-input:focus, .dark .profile-form .ant-select-focused .ant-select-selector, .dark .profile-form .ant-picker-focused {
                    background-color: #1e293b !important;
                }
            ` }} />
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

export default PersonalInfoSection;
