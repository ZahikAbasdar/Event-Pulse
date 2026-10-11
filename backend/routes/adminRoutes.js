const express = require('express');
const ctrl = require('../controllers/adminController');
const sponsorCtrl = require('../controllers/sponsorController');
const accessCtrl = require('../controllers/adminAccessController');
const { protect, authorize } = require('../middleware/auth');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');

const router = express.Router();
const accessRequestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { success: false, message: 'Too many admin access requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/access-requests/mine', protect, accessCtrl.getMyRequest);
router.post(
  '/access-requests',
  accessRequestLimiter,
  protect,
  accessCtrl.createRequest
);
router.get('/access-requests', protect, authorize('super_admin'), accessCtrl.listRequests);
router.patch(
  '/access-requests/:id',
  protect,
  authorize('super_admin'),
  [body('decision').isIn(['approve', 'reject']).withMessage('Decision must be approve or reject.')],
  (req, res, next) => {
    if (!req.params.id.match(/^[a-f\d]{24}$/i)) {
      return res.status(400).json({ success: false, message: 'Invalid admin access request ID.' });
    }
    next();
  },
  accessCtrl.reviewRequest
);

router.get('/organizations', protect, authorize('super_admin', 'org_admin'), ctrl.listOrganizations);
router.get('/organizations/:id/usage', protect, authorize('super_admin'), ctrl.getOrganizationUsage);
router.get('/benchmarking', protect, authorize('super_admin'), ctrl.crossInstitutionBenchmark);
router.get('/audit-logs', protect, authorize('super_admin', 'org_admin'), ctrl.listAuditLogs);

router.post('/webhooks', protect, authorize('super_admin', 'org_admin'), ctrl.createWebhook);
router.get('/webhooks', protect, authorize('super_admin', 'org_admin'), ctrl.listWebhooks);
router.delete('/webhooks/:id', protect, authorize('super_admin', 'org_admin'), ctrl.deleteWebhook);

router.post('/escalations', protect, authorize('super_admin', 'org_admin', 'event_manager'), ctrl.createEscalation);
router.get('/escalations', protect, authorize('super_admin', 'org_admin', 'event_manager'), ctrl.listEscalations);
router.patch('/escalations/:id', protect, authorize('super_admin', 'org_admin'), ctrl.updateEscalation);

router.get('/sponsors/my-analytics', protect, authorize('sponsor_viewer'), sponsorCtrl.mySponsorAnalytics);
router.post('/events/:eventId/sponsors', protect, authorize('super_admin', 'org_admin', 'event_manager'), sponsorCtrl.addSponsor);

module.exports = router;
