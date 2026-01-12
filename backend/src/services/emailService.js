// 邮件发送服务
const axios = require('axios');
const AppError = require('../utils/AppError');

/**
 * 发送邮件验证码
 * @param {string} toEmail - 目标邮箱地址
 * @param {string} code - 验证码
 * @returns {Promise<void>}
 */
const sendVerificationEmail = async (toEmail, code) => {
  try {
    // 硬编码配置
    const LUCKYCOLA_COLAKEY = 'xAV12gYOGgDwW31763380657444qVyO032wTM';
    const LUCKYCOLA_SMTP_EMAIL = 'jayyangluo@163.com';
    const LUCKYCOLA_SMTP_CODE = 'ASeYQFVKnfDzL6Pm';
    const LUCKYCOLA_SMTP_CODE_TYPE = '163';

    // 邮件内容
    const subject = 'TalentPulse - 验证码';
    const fromTitle = 'TalentPulse';
    const content = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">TalentPulse 验证码</h2>
        <p style="font-size: 16px; color: #666;">您的验证码是：</p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <span style="font-size: 24px; font-weight: bold; color: #333;">${code}</span>
        </div>
        <p style="font-size: 14px; color: #999;">验证码有效期为10分钟，请尽快使用。</p>
        <p style="font-size: 14px; color: #999;">如果您没有请求验证码，请忽略此邮件。</p>
      </div>
    `;

    // 调用LuckyColaAI邮件API
    const response = await axios.post('https://luckycola.com.cn/tools/customMail', {
      ColaKey: LUCKYCOLA_COLAKEY,
      tomail: toEmail,
      fromTitle,
      subject,
      content,
      isTextContent: false,
      smtpCode: LUCKYCOLA_SMTP_CODE,
      smtpEmail: LUCKYCOLA_SMTP_EMAIL,
      smtpCodeType: LUCKYCOLA_SMTP_CODE_TYPE
    });

    // 检查API响应
    if (response.status !== 200 || response.data.code !== 200) {
      console.error('调用邮件API失败:', response.data);
      // API调用失败，使用模拟发送模式
      console.log(`【模拟发送】向邮箱 ${toEmail} 发送验证码: ${code}`);
      console.log(`【注意】邮件API调用失败，未发送真实邮件。`);
      return; // 直接返回，不抛出错误
    }

    console.log(`成功发送验证码到邮箱 ${toEmail}: ${code}`);
  } catch (error) {
    console.error('发送邮件失败:', error);
    // 任何错误都使用模拟发送模式
    console.log(`【模拟发送】向邮箱 ${toEmail} 发送验证码: ${code}`);
    console.log(`【注意】发送邮件时发生错误，未发送真实邮件。`);
    // 不抛出错误，避免影响主要流程
  }
};

/**
 * 发送密码重置成功邮件
 * @param {string} toEmail - 目标邮箱地址
 * @returns {Promise<void>}
 */
const sendPasswordResetSuccessEmail = async (toEmail) => {
  try {
    // 从环境变量获取配置
    const {
      LUCKYCOLA_COLAKEY,
      LUCKYCOLA_SMTP_EMAIL,
      LUCKYCOLA_SMTP_CODE,
      LUCKYCOLA_SMTP_CODE_TYPE
    } = process.env;

    // 验证配置是否完整
    if (!LUCKYCOLA_COLAKEY || !LUCKYCOLA_SMTP_EMAIL || !LUCKYCOLA_SMTP_CODE || !LUCKYCOLA_SMTP_CODE_TYPE) {
      // 配置不完整，使用模拟发送模式
      console.log(`【模拟发送】向邮箱 ${toEmail} 发送密码重置成功邮件`);
      console.log(`【注意】邮件发送配置不完整，未发送真实邮件。请在.env文件中配置完整的邮件服务参数。`);
      return; // 直接返回，不抛出错误
    }

    // 邮件内容
    const subject = 'TalentPulse - 密码重置成功';
    const fromTitle = 'TalentPulse';
    const content = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">密码重置成功</h2>
        <p style="font-size: 16px; color: #666;">您的 TalentPulse 账号密码已成功重置。</p>
        <p style="font-size: 16px; color: #666;">如果您没有进行此操作，请立即联系我们的客服。</p>
        <p style="font-size: 14px; color: #999; margin-top: 30px;">TalentPulse 团队</p>
      </div>
    `;

    // 调用LuckyColaAI邮件API
    const response = await axios.post('https://luckycola.com.cn/tools/customMail', {
      ColaKey: LUCKYCOLA_COLAKEY,
      tomail: toEmail,
      fromTitle,
      subject,
      content,
      isTextContent: false,
      smtpCode: LUCKYCOLA_SMTP_CODE,
      smtpEmail: LUCKYCOLA_SMTP_EMAIL,
      smtpCodeType: LUCKYCOLA_SMTP_CODE_TYPE
    });

    // 检查API响应
    if (response.status !== 200 || response.data.code !== 200) {
      console.error('调用邮件API失败:', response.data);
      // API调用失败，使用模拟发送模式
      console.log(`【模拟发送】向邮箱 ${toEmail} 发送密码重置成功邮件`);
      console.log(`【注意】邮件API调用失败，未发送真实邮件。`);
      return; // 直接返回，不抛出错误
    }

    console.log(`成功发送密码重置成功邮件到邮箱 ${toEmail}`);
  } catch (error) {
    console.error('发送密码重置成功邮件失败:', error);
    // 任何错误都使用模拟发送模式
    console.log(`【模拟发送】向邮箱 ${toEmail} 发送密码重置成功邮件`);
    console.log(`【注意】发送邮件时发生错误，未发送真实邮件。`);
    // 不抛出错误，避免影响主要流程
  }
};

/**
 * 发送企业认证结果邮件
 * @param {string} toEmail - 目标邮箱地址
 * @param {boolean} isApproved - 是否通过
 * @param {string} [reason] - 拒绝原因
 * @returns {Promise<void>}
 */
const sendCertificationResultEmail = async (toEmail, isApproved, reason = '') => {
  try {
    // 从环境变量获取配置
    const {
      LUCKYCOLA_COLAKEY,
      LUCKYCOLA_SMTP_EMAIL,
      LUCKYCOLA_SMTP_CODE,
      LUCKYCOLA_SMTP_CODE_TYPE
    } = process.env;

    // 验证配置是否完整
    if (!LUCKYCOLA_COLAKEY || !LUCKYCOLA_SMTP_EMAIL || !LUCKYCOLA_SMTP_CODE || !LUCKYCOLA_SMTP_CODE_TYPE) {
      console.log(`【模拟发送】向邮箱 ${toEmail} 发送企业认证结果: ${isApproved ? '通过' : '拒绝'}`);
      return;
    }

    // 邮件内容
    const subject = isApproved ? 'TalentPulse - 企业认证通过' : 'TalentPulse - 企业认证审核未通过';
    const fromTitle = 'TalentPulse';

    let emailBody = '';
    if (isApproved) {
      emailBody = `
            <h2 style="color: #10B981;">恭喜！企业认证已通过</h2>
            <p style="font-size: 16px; color: #666;">您的企业认证申请审核通过。现有已获得完整的招聘方权限：</p>
            <ul style="color: #666;">
                <li>发布职位</li>
                <li>查看候选人简历</li>
                <li>发起即时沟通</li>
            </ul>
        `;
    } else {
      emailBody = `
            <h2 style="color: #EF4444;">企业认证审核未通过</h2>
            <p style="font-size: 16px; color: #666;">很抱歉，您的企业认证申请未通过审核。</p>
            <div style="background-color: #FEF2F2; padding: 15px; border-left: 4px solid #EF4444; margin: 20px 0;">
                <p style="margin: 0; color: #991B1B; font-weight: bold;">原因：</p>
                <p style="margin: 5px 0 0 0; color: #B91C1C;">${reason || '提交的资料不符合要求'}</p>
            </div>
            <p style="font-size: 14px; color: #666;">请登录平台修改资料后重新提交。</p>
        `;
    }

    const content = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        ${emailBody}
        <p style="font-size: 14px; color: #999; margin-top: 30px;">TalentPulse 团队</p>
      </div>
    `;

    // 调用LuckyColaAI邮件API
    await axios.post('https://luckycola.com.cn/tools/customMail', {
      ColaKey: LUCKYCOLA_COLAKEY,
      tomail: toEmail,
      fromTitle,
      subject,
      content,
      isTextContent: false,
      smtpCode: LUCKYCOLA_SMTP_CODE,
      smtpEmail: LUCKYCOLA_SMTP_EMAIL,
      smtpCodeType: LUCKYCOLA_SMTP_CODE_TYPE
    });

    console.log(`成功发送认证结果邮件到邮箱 ${toEmail}`);
  } catch (error) {
    console.error('发送认证结果邮件失败:', error);
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetSuccessEmail,
  sendCertificationResultEmail
};
