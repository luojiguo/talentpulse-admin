const express = require('express');
const router = express.Router();
const certificationController = require('../controllers/certificationController');
const { authenticate, authorize } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// --- 营业执照上传配置 (Multer) ---
const uploadDir = path.join(__dirname, '../../../Front_End/public/business_license');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // 使用时间戳生成安全的文件名
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
        cb(null, `license_${Date.now()}_${name}${ext}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 限制 10MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('仅允许上传图片和 PDF 文件'));
        }
    }
});

// --- 路由定义 ---

// 1. 提交认证 (招聘者)
router.post(
    '/submit',
    authenticate,
    upload.single('business_license'),
    asyncHandler(certificationController.submitCertification)
);

// 2. 获取认证状态 (招聘者)
router.get(
    '/status',
    authenticate,
    asyncHandler(certificationController.getCertificationStatus)
);

// 3. 管理员: 获取待处理的请求
router.get(
    '/admin/pending',
    authenticate,
    authorize('admin'),
    asyncHandler(certificationController.adminGetPendingRequests)
);

// 4. 管理员: 审核 (通过/拒绝)
router.post(
    '/admin/verify/:userId',
    authenticate,
    authorize('admin'),
    asyncHandler(certificationController.adminVerifyRequest)
);

module.exports = router;
