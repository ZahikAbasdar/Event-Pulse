const express = require('express');
const teamCtrl = require('../controllers/teamController');
const scoreCtrl = require('../controllers/scoreController');
const fixtureCtrl = require('../controllers/fixtureController');
const { protect, authorize } = require('../middleware/auth');

// Nested under /api/competitions/:competitionEventId
const nestedRouter = express.Router({ mergeParams: true });
nestedRouter.get('/teams', teamCtrl.listTeams);
nestedRouter.post('/teams', protect, teamCtrl.registerTeam);
nestedRouter.post('/scores', protect, authorize('judge', 'super_admin', 'org_admin', 'event_manager'), scoreCtrl.submitScore);
nestedRouter.get('/leaderboard', scoreCtrl.getLeaderboard);
nestedRouter.post('/fixtures', protect, authorize('super_admin', 'org_admin', 'event_manager'), fixtureCtrl.createFixture);
nestedRouter.get('/fixtures', fixtureCtrl.listFixtures);

// Flat routes
const flatRouter = express.Router();
flatRouter.patch('/teams/:id/submit', protect, teamCtrl.submitProject);
flatRouter.patch('/fixtures/:id/score', protect, authorize('super_admin', 'org_admin', 'event_manager', 'judge'), fixtureCtrl.updateFixtureScore);

module.exports = { nestedRouter, flatRouter };
