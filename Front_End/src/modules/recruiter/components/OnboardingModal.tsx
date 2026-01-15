import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, DatePicker, Select, InputNumber, message } from 'antd';
import { Calendar as CalendarIcon } from 'lucide-react';
import { onboardingAPI, CreateOnboardingParams } from '@/services/onboardingService';
import { jobAPI } from '@/services/jobService';
import { recruiterAPI } from '@/services/recruiterService';
import { userAPI } from '@/services/userService';
import { useI18n } from '@/contexts/i18nContext';
import dayjs from 'dayjs';

const { Option } = Select;

interface OnboardingModalProps {
    open: boolean;
    onCancel: () => void;
    onSuccess: () => void;
    initialValues?: Partial<CreateOnboardingParams>;
    isEditing?: boolean;
    candidateName?: string;
    recruiterId: number;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({
    open,
    onCancel,
    onSuccess,
    initialValues,
    isEditing,
    candidateName: propCandidateName,
    recruiterId
}) => {
    const { language, t } = useI18n();
    const [form] = Form.useForm();
    const [candidates, setCandidates] = useState<any[]>([]);
    const [loadingCandidates, setLoadingCandidates] = useState(false);
    const [selectedCandidateName, setSelectedCandidateName] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null);
    const [currentUserInfo, setCurrentUserInfo] = useState<any>(null);

    // Fetch current recruiter info for auto-fill
    useEffect(() => {
        const fetchUserInfo = async () => {
            if (recruiterId) {
                try {
                    const response = await userAPI.getUserById(recruiterId);
                    if ((response as any).status === 'success') {
                        setCurrentUserInfo((response as any).data);
                    }
                } catch (error) {
                    console.error('Failed to fetch recruiter info:', error);
                }
            }
        };
        fetchUserInfo();
    }, [recruiterId]);

    // Fetch candidates list if we are in "Create" mode and don't have a pre-selected candidate
    useEffect(() => {
        if (open && !isEditing && (!initialValues?.candidateId)) {
            fetchCandidates();
        }
    }, [open, isEditing, initialValues, recruiterId]);

    const fetchCandidates = async () => {
        setLoadingCandidates(true);
        try {
            const response = await recruiterAPI.getCandidates(recruiterId);
            if ((response as any).status === 'success') {
                setCandidates((response as any).data || []);
            }
        } catch (error) {
            console.error('Failed to fetch candidates:', error);
            // message.error('无法获取候选人列表');
        } finally {
            setLoadingCandidates(false);
        }
    };

    useEffect(() => {
        const loadInitialData = async () => {
            if (open) {
                if (initialValues) {
                    // Set initial date state
                    const initialDate = initialValues.startDate || (initialValues as any).onboardingDate;
                    if (initialDate) {
                        setSelectedDate(dayjs(initialDate));
                    } else {
                        setSelectedDate(null);
                    }

                    // Pre-fill from initialValues (Editing or Created from Candidate View)
                    form.setFieldsValue({
                        ...initialValues,
                        onboardingDate: initialDate ? dayjs(initialDate) : undefined,
                        endDate: initialValues.endDate ? dayjs(initialValues.endDate) : undefined,
                        // Auto-fill contact info from current user if not present
                        onboardingContact: initialValues.onboardingContact || currentUserInfo?.name,
                        onboardingContactPhone: initialValues.onboardingContactPhone || currentUserInfo?.phone,
                    });

                    if (propCandidateName) {
                        setSelectedCandidateName(propCandidateName);
                    } else if ((initialValues as any).candidateName) {
                        setSelectedCandidateName((initialValues as any).candidateName);
                    }

                    // If creating new (from Candidate View) and we have jobId, try to fetch job details for auto-fill
                    if (!isEditing && initialValues.jobId) {
                        try {
                            const response = await jobAPI.getJobById(initialValues.jobId);
                            const jobData = (response as any).data;
                            if (jobData) {
                                // Only fill fields if they are empty
                                const currentValues = form.getFieldsValue();
                                form.setFieldsValue({
                                    // Use Company Address if available (requested by user), fallback to Job Location
                                    onboardingLocation: currentValues.onboardingLocation || currentUserInfo?.company_address || jobData.location,
                                    onboardingContact: currentValues.onboardingContact || currentUserInfo?.name || jobData.recruiter_name,
                                    officialSalary: currentValues.officialSalary || jobData.salary
                                });
                            }
                        } catch (error) {
                            console.error('Failed to fetch job details for auto-fill:', error);
                        }
                    }

                } else {
                    // Creating from Onboardings View (Blank)
                    form.resetFields();
                    setSelectedCandidateName('');

                    // Default date to tomorrow
                    const tomorrow = dayjs().add(1, 'day');
                    setSelectedDate(tomorrow);

                    // Auto-fill defaults
                    form.setFieldsValue({
                        onboardingDate: tomorrow,
                        onboardingTime: '09:00',
                        onboardingContact: currentUserInfo?.name,
                        onboardingContactPhone: currentUserInfo?.phone,
                        onboardingLocation: currentUserInfo?.company_address // Default to company address
                    });
                }
            }
        };

        loadInitialData();
    }, [open, initialValues, form, isEditing, propCandidateName, currentUserInfo]);

    const handleCandidateChange = async (candidateId: number) => {
        // Backend key is 'id' for the unique row ID, but we might want 'candidate_id' provided by backend view if available.
        // Looking at backend query: "SELECT DISTINCT c.id, ..." -> 'id' is candidate table id.
        const candidate = candidates.find(c => (c.candidate_id || c.id) === candidateId);

        if (candidate) {
            setSelectedCandidateName(candidate.name); // Using correct key 'name'
            const jobId = candidate.job_id; // Using correct key 'job_id'

            // Set IDs
            form.setFieldsValue({
                candidateId: candidateId,
                jobId: jobId
            });

            // Fetch job details to auto-fill
            if (jobId) {
                try {
                    const response = await jobAPI.getJobById(jobId);
                    const jobData = (response as any).data;
                    if (jobData) {
                        form.setFieldsValue({
                            // Use Company Address if available (requested by user), fallback to Job Location
                            onboardingLocation: currentUserInfo?.company_address || jobData.location,
                            // Priority: Current User -> Job Recruiter -> Existing
                            onboardingContact: currentUserInfo?.name || jobData.recruiter_name,
                            onboardingContactPhone: currentUserInfo?.phone,
                            officialSalary: jobData.salary
                        });
                    }
                } catch (error) {
                    console.error('Auto-fill details failed:', error);
                }
            }
        }
    };

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            const payload = {
                ...values,
                startDate: values.onboardingDate?.format('YYYY-MM-DD'),
                endDate: values.endDate?.format('YYYY-MM-DD'),
                onboardingDate: undefined
            };

            if (isEditing && (initialValues as any)?.id) {
                await onboardingAPI.update((initialValues as any).id, payload);
                message.success(language === 'zh' ? '更新成功' : 'Updated successfully');
            } else {
                await onboardingAPI.create({
                    ...payload,
                    recruiterId,
                });
                message.success(language === 'zh' ? '创建成功' : 'Created successfully');
            }
            onSuccess();
        } catch (error) {
            console.error(error);
        }
    };

    // Determine if we need to show candidate selection
    // Show selection if NOT editing AND NO pre-filled candidateId
    const showCandidateSelection = !isEditing && !initialValues?.candidateId;

    return (
        <Modal
            title={
                <div className="flex items-center gap-3 py-2">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                        <CalendarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                        {isEditing ? (language === 'zh' ? '编辑入职安排' : 'Edit Onboarding') : (language === 'zh' ? '发起入职安排' : 'Schedule Onboarding')}
                    </span>
                </div>
            }
            open={open}
            onOk={handleOk}
            onCancel={onCancel}
            destroyOnHidden
            width={640}
            centered
            className="custom-onboarding-modal dark:custom-onboarding-modal-dark"
            footer={null} // We'll implement custom footer for better style
        >
            <Form form={form} layout="vertical" className="mt-4">
                {/* Hidden Fields for IDs */}
                <Form.Item name="candidateId" hidden><InputNumber /></Form.Item>
                <Form.Item name="jobId" hidden><InputNumber /></Form.Item>

                {/* Candidate Selection or Display */}
                <div className="mb-8 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[24px] border border-slate-100 dark:border-slate-800/50 shadow-inner">
                    {showCandidateSelection ? (
                        <Form.Item label={<span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{language === 'zh' ? '目标候选人 *' : 'Target Candidate *'}</span>} required className="mb-0">
                            <Select
                                placeholder={language === 'zh' ? '查找并选择候选人...' : 'Search and select candidate...'}
                                loading={loadingCandidates}
                                onChange={handleCandidateChange}
                                showSearch
                                optionFilterProp="children"
                                className="onboarding-select-large dark:bg-slate-900"
                                popupClassName="dark:bg-slate-800"
                                style={{ height: 48 }}
                            >
                                {candidates.map(c => (
                                    <Option key={c.id} value={c.candidate_id || c.id}>
                                        <div className="flex justify-between items-center py-1">
                                            <span className="font-black text-slate-900 dark:text-white">{c.name}</span>
                                            <span className="text-xs text-slate-400">{c.job_title}</span>
                                        </div>
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    ) : (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-blue-200 dark:shadow-none">
                                    {selectedCandidateName?.charAt(0)}
                                </div>
                                <div>
                                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">{language === 'zh' ? '该候选人入职中' : 'Onboarding Candidate'}</div>
                                    <div className="text-lg font-black text-slate-900 dark:text-white leading-none">{selectedCandidateName}</div>
                                </div>
                            </div>
                            <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-blue-100 dark:border-blue-800/50">
                                {language === 'zh' ? '已预选' : 'Pre-Selected'}
                            </span>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <Form.Item name="onboardingDate" label={<span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{language === 'zh' ? '入职日期 *' : 'Arrival Date *'}</span>} rules={[{ required: true, message: language === 'zh' ? '请选择入职日期' : 'Please select date' }]}>
                        <DatePicker className="w-full h-12 rounded-2xl border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-200 focus:border-blue-500" popupClassName="dark:bg-slate-800" />
                    </Form.Item>
                    <Form.Item name="onboardingTime" label={<span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{language === 'zh' ? '入职时间' : 'Arrival Time'}</span>} initialValue="09:00">
                        <Select placeholder={language === 'zh' ? '时间' : 'Time'} className="h-12 rounded-2xl dark:bg-slate-900 dark:border-slate-700" popupClassName="dark:bg-slate-800">
                            {Array.from({ length: 17 }).map((_, i) => {
                                const hour = Math.floor(i / 2) + 9;
                                const minute = i % 2 === 0 ? '00' : '30';
                                const time = `${hour.toString().padStart(2, '0')}:${minute}`;
                                if (hour > 17 || (hour === 17 && minute === '30')) return null;
                                if (selectedDate && selectedDate.isSame(dayjs(), 'day')) {
                                    const now = dayjs();
                                    const slotTime = dayjs().hour(hour).minute(i % 2 === 0 ? 0 : 30);
                                    if (slotTime.isBefore(now)) return null;
                                }
                                return <Option key={time} value={time}>{time}</Option>;
                            })}
                        </Select>
                    </Form.Item>
                </div>

                <Form.Item name="onboardingLocation" label={<span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{language === 'zh' ? '办公地点' : 'Office Location'}</span>}>
                    <Input placeholder={language === 'zh' ? '请输入办公楼、房间号等信息...' : 'Enter office building or meeting room...'} className="h-12 rounded-2xl border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-200 dark:placeholder-slate-500" />
                </Form.Item>

                <div className="grid grid-cols-2 gap-6">
                    <Form.Item name="onboardingContact" label={<span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{language === 'zh' ? '联系人' : 'Contact Person'}</span>}>
                        <Input className="h-12 rounded-2xl border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-200 dark:placeholder-slate-500" />
                    </Form.Item>
                    <Form.Item name="onboardingContactPhone" label={<span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{language === 'zh' ? '联系电话' : 'Contact Phone'}</span>}>
                        <Input className="h-12 rounded-2xl border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-200 dark:placeholder-slate-500" />
                    </Form.Item>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <Form.Item name="officialSalary" label={<span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{language === 'zh' ? '正式月薪' : 'Official Salary'}</span>}>
                        <Input className="h-12 rounded-2xl border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-200 dark:placeholder-slate-500" />
                    </Form.Item>
                    <Form.Item name="probationSalary" label={<span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{language === 'zh' ? '试用期月薪' : 'Probation Salary'}</span>}>
                        <Input className="h-12 rounded-2xl border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-200 dark:placeholder-slate-500" />
                    </Form.Item>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <Form.Item name="probationPeriod" label={<span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{language === 'zh' ? '试用期月数' : 'Probation Months'}</span>} initialValue={3}>
                        <Select className="h-12 rounded-2xl dark:bg-slate-900 dark:border-slate-700" popupClassName="dark:bg-slate-800">
                            {[1, 2, 3, 4, 5, 6].map(month => (
                                <Option key={month} value={month}>{month} {language === 'zh' ? '个月' : 'Months'}</Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="status" label={<span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{language === 'zh' ? '初始状态' : 'Initial Status'}</span>} initialValue="已安排">
                        <Select className="h-12 rounded-2xl dark:bg-slate-900 dark:border-slate-700" popupClassName="dark:bg-slate-800">
                            <Option value="已安排">{language === 'zh' ? '已安排' : 'Scheduled'}</Option>
                            <Option value="进行中">{language === 'zh' ? '进行中' : 'In Progress'}</Option>
                            <Option value="已完成">{language === 'zh' ? '已完成' : 'Completed'}</Option>
                            <Option value="已取消">{language === 'zh' ? '已取消' : 'Cancelled'}</Option>
                        </Select>
                    </Form.Item>
                </div>

                <Form.Item name="notes" label={<span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{language === 'zh' ? '补充说明' : 'Onboarding Notes'}</span>}>
                    <Input.TextArea rows={3} className="rounded-2xl border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-200 dark:placeholder-slate-500 p-4" placeholder={language === 'zh' ? "在此输入补充说明..." : "Enter additional notes here..."} />
                </Form.Item>

                {/* Custom Footer */}
                <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-8 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-black text-sm rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95"
                    >
                        {language === 'zh' ? '取消' : 'CANCEL'}
                    </button>
                    <button
                        type="button"
                        onClick={handleOk}
                        className="px-10 py-3 bg-blue-600 text-white font-black text-sm rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 dark:shadow-none active:scale-95"
                    >
                        {isEditing ? (language === 'zh' ? '更新方案' : 'UPDATE PLAN') : (language === 'zh' ? '确认入职' : 'CONFIRM ARRIVAL')}
                    </button>
                </div>
            </Form>
        </Modal>
    );
};

export default OnboardingModal;
