const Fixture = require('../models/Fixture');
const asyncHandler = require('../middleware/asyncHandler');
const { ApiError } = require('../middleware/errorHandler');
const { getIO } = require('../utils/socket');

// @route POST /api/competitions/:competitionEventId/fixtures — organizer creates a bracket fixture
exports.createFixture = asyncHandler(async (req, res) => {
  const { round, teamA, teamB, scheduledAt, venue } = req.body;
  const fixture = await Fixture.create({
    organization: req.user.organization,
    competitionEvent: req.params.competitionEventId,
    round,
    teamA: teamA || null,
    teamB: teamB || null,
    scheduledAt,
    venue,
  });
  res.status(201).json({ success: true, fixture });
});

// @route GET /api/competitions/:competitionEventId/fixtures — full bracket
exports.listFixtures = asyncHandler(async (req, res) => {
  const fixtures = await Fixture.find({ competitionEvent: req.params.competitionEventId })
    .populate('teamA', 'name')
    .populate('teamB', 'name')
    .populate('winner', 'name')
    .sort('scheduledAt');
  res.json({ success: true, fixtures });
});

// @route PATCH /api/fixtures/:id/score — live score update, pushed via Socket.IO
exports.updateFixtureScore = asyncHandler(async (req, res) => {
  const { scoreA, scoreB, status } = req.body;
  const fixture = await Fixture.findOneAndUpdate(
    { _id: req.params.id, organization: req.user.organization },
    { scoreA, scoreB, status },
    { new: true }
  ).populate('teamA', 'name').populate('teamB', 'name');
  if (!fixture) throw new ApiError(404, 'Fixture not found');

  if (status === 'completed') {
    fixture.winner = scoreA > scoreB ? fixture.teamA?._id : scoreB > scoreA ? fixture.teamB?._id : null;
    await fixture.save();
  }

  getIO()?.to(`event:${fixture.competitionEvent}`).emit('fixture:update', {
    fixtureId: fixture._id, scoreA, scoreB, status, teamA: fixture.teamA?.name, teamB: fixture.teamB?.name, at: new Date(),
  });

  res.json({ success: true, fixture });
});
