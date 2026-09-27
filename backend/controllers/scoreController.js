const Score = require('../models/Score');
const Team = require('../models/Team');
const CompetitionEvent = require('../models/CompetitionEvent');
const asyncHandler = require('../middleware/asyncHandler');
const { ApiError } = require('../middleware/errorHandler');
const { getIO } = require('../utils/socket');

// @route POST /api/competitions/:competitionEventId/scores
// Judge submits (or updates) their score for a team/participant.
// Supports multi-judge, multi-criteria weighted scoring for debate/cultural events.
exports.submitScore = asyncHandler(async (req, res) => {
  const competition = await CompetitionEvent.findById(req.params.competitionEventId);
  if (!competition) throw new ApiError(404, 'Competition event not found');

  const { team, participant, round = 'final', criteriaScores = [], comments = '' } = req.body;
  if (!team && !participant) throw new ApiError(400, 'Either team or participant is required');

  const totalScore = criteriaScores.reduce((sum, c) => sum + Number(c.score) * (c.weight || 1), 0);

  const score = await Score.findOneAndUpdate(
    { competitionEvent: competition._id, judge: req.user._id, team: team || null, round },
    {
      organization: req.user.organization,
      competitionEvent: competition._id,
      team: team || null,
      participant: participant || null,
      judge: req.user._id,
      round,
      criteriaScores,
      totalScore,
      comments,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  getIO()?.to(`event:${competition.event}`).emit('score:updated', { competitionEventId: competition._id, round, at: new Date() });
  res.status(201).json({ success: true, score });
});

// @route GET /api/competitions/:competitionEventId/leaderboard
// Aggregates all judges' scores per team/participant into a ranked leaderboard.
exports.getLeaderboard = asyncHandler(async (req, res) => {
  const { round } = req.query;
  const filter = { competitionEvent: req.params.competitionEventId };
  if (round) filter.round = round;

  const scores = await Score.find(filter).populate('team', 'name').populate('participant', 'name').populate('judge', 'name');

  const grouped = {};
  scores.forEach((s) => {
    const key = s.team ? `team:${s.team._id}` : `participant:${s.participant._id}`;
    if (!grouped[key]) {
      grouped[key] = {
        name: s.team ? s.team.name : s.participant.name,
        type: s.team ? 'team' : 'participant',
        scores: [],
      };
    }
    grouped[key].scores.push({ judge: s.judge.name, totalScore: s.totalScore });
  });

  const leaderboard = Object.values(grouped)
    .map((entry) => ({
      ...entry,
      averageScore: entry.scores.reduce((sum, s) => sum + s.totalScore, 0) / entry.scores.length,
      judgeCount: entry.scores.length,
    }))
    .sort((a, b) => b.averageScore - a.averageScore)
    .map((entry, i) => ({ rank: i + 1, ...entry }));

  res.json({ success: true, leaderboard });
});
