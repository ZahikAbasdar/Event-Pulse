const express = require('express');
const ctrl = require('../controllers/eventController');
const ticketCtrl = require('../controllers/ticketController');
const { protect, authorize } = require('../middleware/auth');
const resolveOrg = require('../middleware/resolveOrg');
const { publicRouter: competitionPublicRouter } = require('./competitionEventRoutes');

const router = express.Router();

router.get('/', resolveOrg, ctrl.listEvents);
router.get('/manage/mine', protect, authorize('super_admin', 'org_admin', 'event_manager'), ctrl.myManagedEvents);

// Nested: competition sub-events (e.g. Koshish's 22 events) as cards + detail
router.use('/:eventSlug/competitions', competitionPublicRouter);

router.get('/:slug', resolveOrg, ctrl.getEvent);

router.post('/', protect, authorize('super_admin', 'org_admin', 'event_manager'), ctrl.createEvent);
router.patch('/:id', protect, authorize('super_admin', 'org_admin', 'event_manager'), ctrl.updateEvent);
router.delete('/:id', protect, authorize('super_admin', 'org_admin'), ctrl.deleteEvent);

router.post('/:eventId/register', protect, ticketCtrl.registerForEvent);
router.get('/:eventId/poster-qr', protect, authorize('super_admin', 'org_admin', 'event_manager'), ticketCtrl.getRegisterPosterQR);

module.exports = router;
