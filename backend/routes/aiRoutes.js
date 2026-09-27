const express = require('express');
const rateLimit = require('express-rate-limit');
const ctrl = require('../controllers/aiController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

const aiLimiter = rateLimit({ windowMs: 60 * 1000, max: 20, message: { success: false, message: 'Too many AI requests, slow down a little.' } });

router.post('/organizer-chat', aiLimiter, protect, authorize('super_admin', 'org_admin', 'event_manager', 'sponsor_viewer'), ctrl.organizerChat);
router.post('/public-chat/:eventSlug', aiLimiter, ctrl.publicChat);

module.exports = router;
