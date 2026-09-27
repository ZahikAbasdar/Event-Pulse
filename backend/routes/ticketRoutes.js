const express = require('express');
const ctrl = require('../controllers/ticketController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/mine', protect, ctrl.myTickets);
router.post('/checkin', protect, authorize('super_admin', 'org_admin', 'event_manager', 'volunteer'), ctrl.checkIn);

module.exports = router;
