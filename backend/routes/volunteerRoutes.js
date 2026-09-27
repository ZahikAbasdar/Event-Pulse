const express = require('express');
const ctrl = require('../controllers/volunteerController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/events/:eventId/assign', protect, authorize('super_admin', 'org_admin', 'event_manager'), ctrl.assignVolunteer);
router.get('/events/:eventId', protect, authorize('super_admin', 'org_admin', 'event_manager'), ctrl.listEventVolunteers);
router.get('/mine', protect, ctrl.myAssignments);
router.patch('/:id/status', protect, ctrl.updateAssignmentStatus);

module.exports = router;
