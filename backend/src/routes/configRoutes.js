const express = require('express');
const router = express.Router();

/**
 * @route GET /api/config/dictionaries
 * @desc 获取应用程序数据字典（枚举值、选项），用于前端下拉选择或状态展示
 * @access 公开（如果需要可后续增加认证中间件）
 */
router.get('/dictionaries', (req, res) => {
    // 定义各类数据字典，部分值与数据库检查约束（CHECK constraints）保持一致
    const dictionaries = {
        // 职位相关枚举值
        job_level: ['初级', '中级', '高级', '管理'],
        job_type: ['全职', '兼职', '实习'],
        work_mode: ['现场', '远程', '混合'],
        urgency: ['普通', '紧急', '非常紧急'],

        // 流程相关枚举值
        interview_result: ['通过', '未通过', '待定'],
        // 申请状态：新申请、筛选中、面试中、已发Offer、已拒绝、已入职
        application_status: ['New', 'Screening', 'Interview', 'Offer', 'Rejected', 'Hired'],

        // 针对非约束字段的标准列表（用于搜索建议或信息编辑）
        experience: ['应届生', '1-3年', '3-5年', '5-10年', '10年以上'],
        degree: ['大专', '本科', '硕士', '博士', '不限'],
        salary: ['3k-5k', '5k-10k', '10k-20k', '20k-50k', '50k+'],

        // 常用行业分类
        industry: [
            '互联网/IT/电子/通信',
            '金融/银行/保险',
            '教育/培训/学术/科研',
            '房地产/建筑/建材/工程',
            '广告/传媒/文化/体育',
            '消费品/贸易/批发/零售',
            '医疗/护理/卫生',
            '机械/设备/重工',
            '能源/矿产/地质勘查',
            '政府/非盈利机构/其他'
        ],

        // 常用城市列表（目前为简化版，后期可扩展为完整城市数据库）
        city: [
            '北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '南京', '西安', '重庆', '苏州', '天津', '长沙'
        ]
    };

    res.json({
        status: 'success',
        data: dictionaries
    });
});

module.exports = router;
