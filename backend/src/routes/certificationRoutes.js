const express = require('express');
const router = express.Router();
const certificationController = require('../controllers/certificationController');
const { authenticate, authorize } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// --- Multer Configuration for Business License ---
const uploadDir = path.join(__dirname, '../../../Front_End/public/business_license');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Safe filename with timestamp
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
        cb(null, `license_${Date.now()}_${name}${ext}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only images and PDFs are allowed'));
        }
    }
});

// --- Routes ---

// 1. Submit Certification (Recruiter)
router.post(
    '/submit',
    authenticate,
    upload.single('business_license'),
    asyncHandler(certificationController.submitCertification)
);

// 2. Get Status (Recruiter)
router.get(
    '/status',
    authenticate,
    asyncHandler(certificationController.getCertificationStatus)
);

// 3. Admin: Get Pending Requests
router.get(
    '/admin/pending',
    authenticate,
    authorize('admin'),
    asyncHandler(certificationController.adminGetPendingRequests)
);

// 4. Admin: Verify (Approve/Reject)
router.post(
    '/admin/verify/:userId',
    authenticate,
    authorize('admin'),
    asyncHandler(certificationController.adminVerifyRequest)
);

module.exports = router;
