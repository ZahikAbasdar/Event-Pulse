const express = require('express');
const ctrl = require('../controllers/adminController');
const sponsorCtrl = require('../controllers/sponsorController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/organizations', protect, authorize('super_admin'), ctrl.listOrganizations);
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
