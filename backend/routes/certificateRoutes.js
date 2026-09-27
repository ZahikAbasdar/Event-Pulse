const express = require('express');
const ctrl = require('../controllers/certificateController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/events/:eventId/issue', protect, authorize('super_admin', 'org_admin', 'event_manager'), ctrl.issueCertificatesForEvent);
router.get('/mine', protect, ctrl.myCertificates);
router.get('/:id/download', protect, ctrl.downloadCertificate);

module.exports = router;
