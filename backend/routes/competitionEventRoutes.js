const express = require('express');
const ctrl = require('../controllers/competitionEventController');
const { protect, authorize } = require('../middleware/auth');
const resolveOrg = require('../middleware/resolveOrg');

// Public, nested under /api/events/:eventSlug/competitions
const publicRouter = express.Router({ mergeParams: true });
publicRouter.get('/', resolveOrg, ctrl.listCompetitionEvents);
publicRouter.get('/:slug', resolveOrg, ctrl.getCompetitionEvent);
publicRouter.post('/', protect, authorize('super_admin', 'org_admin', 'event_manager'), ctrl.createCompetitionEvent);

// Flat management routes /api/competitions/:id
const manageRouter = express.Router();
manageRouter.patch('/:id', protect, authorize('super_admin', 'org_admin', 'event_manager'), ctrl.updateCompetitionEvent);
manageRouter.delete('/:id', protect, authorize('super_admin', 'org_admin'), ctrl.deleteCompetitionEvent);

module.exports = { publicRouter, manageRouter };
