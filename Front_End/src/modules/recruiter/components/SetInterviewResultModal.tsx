import React, { useEffect, useState } from 'react';
import { Modal, Form, Select, Input, message } from 'antd';
import { CheckSquare } from 'lucide-react';
import { interviewAPI } from '@/services/apiService';
import { useI18n } from '@/contexts/i18nContext';

const { Option } = Select;
const { TextArea } = Input;

interface SetInterviewResultModalProps {
    open: boolean;
    onCancel: () => void;
    onSuccess: () => void;
    interviewId: number | null;
    initialValues?: {
        interviewResult?: string;
        interviewFeedback?: string;
    };
}

const SetInterviewResultModal: React.FC<SetInterviewResultModalProps> = ({
    open,
    onCancel,
    onSuccess,
    interviewId,
    initialValues
}) => {
    const { language, t } = useI18n();
    const [form] = Form.useForm();
    const [currentResult, setCurrentResult] = useState<string | undefined>(undefined);

    useEffect(() => {
        if (open && initialValues) {
            form.setFieldsValue({
                interviewResult: initialValues.interviewResult,
                interviewFeedback: initialValues.interviewFeedback
            });
            setCurrentResult(initialValues.interviewResult);
        } else {
            form.resetFields();
            setCurrentResult(undefined);
        }
    }, [open, initialValues, form]);

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            // If result is empty/undefined, feedback should be disregarded/cleared backend-side potentially, 
            // but our UI hides it. We should ensure we send specific empty strings if that's the intention,
            // or let the backend handle it. Based on previous "Reset" logic, values.interviewResult being "" is handled.

            if (!interviewId) return;

            // If result is empty/undefined, we want to clear it in DB, so send null
            // Backend checks !== undefined, so null triggers update to NULL
            // Empty string '' might cause issues if DB expects specific ENUM values
            const resultToSend = (values.interviewResult === '' || values.interviewResult === undefined) ? null : values.interviewResult;

            // If result is empty, force feedback to be empty string just in case
            const feedbackToSend = (!resultToSend) ? '' : values.interviewFeedback;

            await interviewAPI.updateInterview(interviewId, {
                interviewResult: resultToSend,
                interviewFeedback: feedbackToSend
            });

            message.success(t.recruiter.interviewResultSetSuccess);
            onSuccess();
        } catch (error) {
            console.error('设置面试结果失败:', error);
            // message.error('操作失败'); 
        }
    };

    const handleResultChange = (value: string) => {
        setCurrentResult(value); // Update state to control visibility

        let defaultFeedback = '';
        switch (value) {
            case '通过':
                defaultFeedback = t.recruiter.feedbackTemplatePassed;
                break;
            case '未通过':
                defaultFeedback = t.recruiter.feedbackTemplateRejected;
                break;
            case '待定':
                defaultFeedback = t.recruiter.feedbackTemplatePending;
                break;
            case '': // Default/Reset case
                defaultFeedback = '';
                break;
            default:
                break;
        }

        // If resetting to default/empty, always clear.
        if (!value) {
            form.setFieldsValue({
                interviewFeedback: ''
            });
            return;
        }

        // Only set if feedback is empty or matches one of the other defaults (to avoid overwriting custom text)
        const currentFeedback = form.getFieldValue('interviewFeedback');
        const isDefault = !currentFeedback ||
            currentFeedback === t.recruiter.feedbackTemplatePassed ||
            currentFeedback === t.recruiter.feedbackTemplateRejected ||
            currentFeedback === t.recruiter.feedbackTemplatePending;

        if (isDefault) {
            form.setFieldsValue({
                interviewFeedback: defaultFeedback
            });
        }
    };

    return (
        <Modal
            title={
                <div className="flex items-center gap-3 py-2">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                        <CheckSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{t.recruiter.interviewResultSet}</span>
                </div>
            }
            open={open}
            onOk={handleOk}
            onCancel={onCancel}
            destroyOnHidden
            width={560}
            centered
            footer={null}
            className="custom-result-modal dark:custom-modal-dark"
        >
            <Form form={form} layout="vertical" className="mt-8">
                <Form.Item
                    name="interviewResult"
                    label={<span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.recruiter.finalResult} *</span>}
                >
                    <Select
                        placeholder={language === 'zh' ? '点击选择面试结论' : 'Click to select conclusion'}
                        onChange={handleResultChange}
                        allowClear
                        className="h-12 rounded-2xl"
                        popupClassName="dark:bg-slate-800"
                    >
                        <Option value="">{language === 'zh' ? '默认 (待定)' : 'DEFAULT (PENDING)'}</Option>
                        <Option value="通过">{language === 'zh' ? '通过 (录用)' : 'PASSED (HIRE)'}</Option>
                        <Option value="未通过">{language === 'zh' ? '未通过 (人才库)' : 'REJECTED (ARCHIVE)'}</Option>
                        <Option value="待定">{language === 'zh' ? '后续评估 (待定)' : 'WAITLIST (PENDING)'}</Option>
                    </Select>
                </Form.Item>

                <Form.Item
                    name="interviewFeedback"
                    label={<span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.recruiter.internalFeedback}</span>}
                >
                    <TextArea
                        rows={6}
                        placeholder={language === 'zh' ? '在此输入详细的评价、后续面试建议或改进空间方案...' : 'Enter evaluation, suggestions or improvement plans...'}
                        className="rounded-2xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 transition-all p-5 font-medium"
                    />
                </Form.Item>

                <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-8 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-black text-xs rounded-2xl hover:bg-slate-50 transition-all active:scale-95 uppercase tracking-widest"
                    >
                        {t.common.cancel}
                    </button>
                    <button
                        type="button"
                        onClick={handleOk}
                        className="px-10 py-3.5 bg-blue-600 text-white font-black text-xs rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 dark:shadow-none active:scale-95 uppercase tracking-widest"
                    >
                        {language === 'zh' ? '确定下结论' : 'SET SELECTION'}
                    </button>
                </div>
            </Form>
        </Modal>
    );
};

export default SetInterviewResultModal;
