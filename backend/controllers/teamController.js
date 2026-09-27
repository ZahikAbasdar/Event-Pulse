const Team = require('../models/Team');
const CompetitionEvent = require('../models/CompetitionEvent');
const asyncHandler = require('../middleware/asyncHandler');
const { ApiError } = require('../middleware/errorHandler');
const { getIO } = require('../utils/socket');

const HACKATHON_MAX_MEMBERS = 4;

// @route POST /api/competitions/:competitionEventId/teams  — team registration (max 4 for hackathons)
exports.registerTeam = asyncHandler(async (req, res) => {
  const competition = await CompetitionEvent.findOne({ _id: req.params.competitionEventId, organization: req.user.organization });
  if (!competition) throw new ApiError(404, 'Competition event not found');

  const { name, memberIds = [] } = req.body;
  const allMembers = [...new Set([req.user._id.toString(), ...memberIds])];

  const maxAllowed = competition.category === 'esports' ? competition.teamSize.max : Math.min(competition.teamSize.max || HACKATHON_MAX_MEMBERS, HACKATHON_MAX_MEMBERS);
  if (allMembers.length > maxAllowed) {
    throw new ApiError(400, `Team cannot exceed ${maxAllowed} members for this event.`);
  }

  const team = await Team.create({
    organization: req.user.organization,
    competitionEvent: competition._id,
    name,
    members: allMembers,
    leader: req.user._id,
  });

  res.status(201).json({ success: true, team });
});

// @route PATCH /api/teams/:id/submit — hackathon project submission
exports.submitProject = asyncHandler(async (req, res) => {
  const { projectTitle, projectDescription, repoUrl, demoUrl } = req.body;
  const team = await Team.findOneAndUpdate(
    { _id: req.params.id, organization: req.user.organization },
    { projectTitle, projectDescription, repoUrl, demoUrl, submittedAt: new Date(), status: 'submitted' },
    { new: true }
  );
  if (!team) throw new ApiError(404, 'Team not found');

  getIO()?.to(`event:${team.competitionEvent}`).emit('team:submitted', { teamId: team._id, teamName: team.name, at: new Date() });
  res.json({ success: true, team });
});

// @route GET /api/competitions/:competitionEventId/teams — list teams for a competition
exports.listTeams = asyncHandler(async (req, res) => {
  const teams = await Team.find({ competitionEvent: req.params.competitionEventId })
    .populate('members', 'name email')
    .populate('leader', 'name email')
    .sort('-createdAt');
  res.json({ success: true, teams });
});
