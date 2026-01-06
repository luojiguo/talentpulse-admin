const express = require('express');
const router = express.Router();

/**
 * @route GET /api/config/dictionaries
 * @desc Get application dictionary data (enums, options)
 * @access Public (or Protected if needed)
 */
router.get('/dictionaries', (req, res) => {
    const dictionaries = {
        // Enums matching DB CHECK constraints
        job_level: ['初级', '中级', '高级', '管理'],
        job_type: ['全职', '兼职', '实习'],
        work_mode: ['现场', '远程', '混合'],
        urgency: ['普通', '紧急', '非常紧急'],
        interview_result: ['通过', '未通过', '待定'],
        application_status: ['New', 'Screening', 'Interview', 'Offer', 'Rejected', 'Hired'],

        // Standard lists for non-constrained fields
        experience: ['应届生', '1-3年', '3-5年', '5-10年', '10年以上'],
        degree: ['大专', '本科', '硕士', '博士', '不限'],
        salary: ['3k-5k', '5k-10k', '10k-20k', '20k-50k', '50k+'],

        // Common industries
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

        // Common cities (Simplified for now)
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
