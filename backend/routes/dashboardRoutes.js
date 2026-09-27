const express = require('express');
const ctrl = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/organizer', protect, authorize('super_admin', 'org_admin', 'event_manager', 'volunteer', 'judge', 'sponsor_viewer'), ctrl.organizerDashboard);
router.get('/organizer/charts', protect, authorize('super_admin', 'org_admin', 'event_manager', 'volunteer', 'judge', 'sponsor_viewer'), ctrl.organizerCharts);
router.get('/participant', protect, ctrl.participantDashboard);

module.exports = router;
