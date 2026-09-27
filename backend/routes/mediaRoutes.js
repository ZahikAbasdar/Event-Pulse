const express = require('express');
const ctrl = require('../controllers/mediaController');
const { protect, authorize } = require('../middleware/auth');
const { mediaUpload } = require('../middleware/upload');

const router = express.Router();

router.get('/events/:eventId', ctrl.listMedia); // public gallery
router.post('/events/:eventId', protect, authorize('super_admin', 'org_admin', 'event_manager'), mediaUpload.single('file'), ctrl.uploadMedia);

module.exports = router;
