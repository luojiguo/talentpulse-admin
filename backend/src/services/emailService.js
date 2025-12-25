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
      console.log(`【模拟发送】向邮箱 ${toEmail} 发送验证码: ${code}`);
      console.log(`【注意】邮件发送配置不完整，未发送真实邮件。请在.env文件中配置完整的邮件服务参数。`);
      return; // 直接返回，不抛出错误
    }

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

module.exports = {
  sendVerificationEmail,
  sendPasswordResetSuccessEmail
};
