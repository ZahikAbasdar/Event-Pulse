const express = require('express');
const ctrl = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/auth');
const { spreadsheetUpload } = require('../middleware/upload');

const router = express.Router();

router.get('/breakdown', protect, authorize('super_admin', 'org_admin', 'event_manager'), ctrl.studentsBreakdown);
router.get('/:userId/profile', protect, authorize('super_admin', 'org_admin', 'event_manager'), ctrl.getStudentProfile);
router.post('/analytics/upload', protect, authorize('super_admin', 'org_admin', 'event_manager'), spreadsheetUpload.single('file'), ctrl.analyzeSpreadsheet);

module.exports = router;
