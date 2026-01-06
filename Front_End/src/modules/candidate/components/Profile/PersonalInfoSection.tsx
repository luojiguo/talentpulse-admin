import React, { useState } from 'react';
import { Button, Card, Form, Input, DatePicker, Select, message, Upload, Avatar, Typography, Row, Col, Modal } from 'antd';
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
        Modal.confirm({
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

                // 1. 更新当前个人信息模块的显示
                onUpdate({ avatar: newAvatar });

                // 2. 触发全局事件，通知Layout/Header更新头像
                window.dispatchEvent(new CustomEvent('userAvatarUpdated', {
                    detail: { avatar: newAvatar }
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
        const found = STATUS_OPTIONS.find(o => o.value === val);
        if (found) return found.label;
        // If not found in values, maybe it is the label itself?
        const foundByLabel = STATUS_OPTIONS.find(o => o.label === val);
        return foundByLabel ? foundByLabel.label : val;
    };

    return (
        <Card
            className={`mb-0 shadow-sm rounded-lg group hover:shadow-md transition-shadow ${isEditing ? 'border-2 border-blue-500 bg-blue-50' : ''}`}
            variant="borderless"
        >
            <div className="flex justify-between items-center mb-6 pl-4 border-l-4 border-blue-500">
                <div className="flex items-center gap-4">
                    <Title level={4} style={{ margin: 0 }}>个人信息</Title>
                    {isEditing && (
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                            编辑中
                        </span>
                    )}
                    {renderExtraHeader && renderExtraHeader()}
                </div>
                {!isEditing && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Button
                            type="link"
                            icon={<EditOutlined />}
                            onClick={handleEdit}
                            className="text-blue-600 hover:text-blue-800"
                        >
                            编辑
                        </Button>
                    </div>
                )}
            </div>

            <div className="flex items-start">
                <div className="mr-8 text-center">
                    {isEditing ? (
                        <Upload
                            name="avatar"
                            showUploadList={false}
                            customRequest={handleAvatarUpload}
                            accept="image/*"
                        >
                            <div className="cursor-pointer relative group">
                                <UserAvatar
                                    size={80}
                                    src={user.avatar}
                                    name={user.name}
                                    className="mb-2 group-hover:opacity-70 transition-opacity border-2 border-gray-100"
                                />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-30 rounded-full h-[80px] w-[80px] mx-auto text-white text-xs">
                                    更换
                                </div>
                            </div>
                        </Upload>
                    ) : (
                        <UserAvatar
                            size={80}
                            src={user.avatar}
                            name={user.name}
                            className="mb-2 border-2 border-gray-100"
                        />
                    )}
                </div>

                <div className="flex-1">
                    {isEditing ? (
                        <Form form={form} layout="vertical" onFinish={handleSave}>
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
                                        <Input placeholder="请输入您的姓名" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="availability_status" label="当前求职状态" rules={[{ required: true, message: '请选择求职状态' }]}>
                                        <Select placeholder="请选择求职状态">
                                            {STATUS_OPTIONS.map(opt => (
                                                <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item name="gender" label="性别" rules={[{ required: true, message: '请选择性别' }]}>
                                        <Select placeholder="请选择性别">
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
                                        <Input type="number" suffix="年" placeholder="请输入工作经验" />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Row gutter={16}>
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
                                        <DatePicker className="w-full" picker="month" placeholder="请选择出生年月" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="phone" label="电话">
                                        <Input disabled placeholder="手机号不可修改" />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item name="wechat" label="微信号 (选填)" rules={[
                                        {
                                            pattern: /^[a-zA-Z][a-zA-Z0-9_-]{5,19}$/,
                                            message: '微信号格式不正确，应为6-20位字母开头，可包含数字、下划线或减号'
                                        }
                                    ]}>
                                        <Input placeholder="请输入您的微信号" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="email" label="邮箱 (选填)" rules={[
                                        {
                                            type: 'email',
                                            message: '邮箱格式不正确'
                                        }
                                    ]}>
                                        <Input placeholder="请输入您的邮箱" />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                                <Button onClick={handleCancel} className="px-6 py-2">取消</Button>
                                <Button type="primary" htmlType="submit" loading={loading} className="px-6 py-2 bg-blue-600 hover:bg-blue-700">
                                    保存修改
                                </Button>
                            </div>
                        </Form>
                    ) : (
                        <div className="grid grid-cols-2 gap-y-4 text-gray-700">
                            <div><span className="text-gray-400">姓名：</span> {user.name}</div>
                            <div><span className="text-gray-400">求职状态：</span> {getStatusLabel(user.availability_status || user.jobStatus)}</div>
                            <div><span className="text-gray-400">性别：</span> {user.gender}</div>
                            <div><span className="text-gray-400">工作经验：</span> {user.work_experience_years}年</div>
                            <div><span className="text-gray-400">出生年月：</span> {user.birth_date ? dayjs(user.birth_date).format('YYYY-MM') : '未填写'}</div>
                            <div><span className="text-gray-400">电话：</span> {user.phone}</div>
                            <div><span className="text-gray-400">微信号：</span> {user.wechat || '未填写'}</div>
                            <div><span className="text-gray-400">邮箱：</span> {user.email || '未填写'}</div>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
};

export default PersonalInfoSection;
