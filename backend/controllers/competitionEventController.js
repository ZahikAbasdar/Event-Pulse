const CompetitionEvent = require('../models/CompetitionEvent');
const Event = require('../models/Event');
const asyncHandler = require('../middleware/asyncHandler');
const { ApiError } = require('../middleware/errorHandler');

// @route GET /api/events/:eventSlug/competitions (public) — list sub-events as cards
exports.listCompetitionEvents = asyncHandler(async (req, res) => {
  const event = await Event.findOne({ organization: req.orgId, slug: req.params.eventSlug });
  if (!event) throw new ApiError(404, 'Event not found');

  const filter = { event: event._id, isActive: true };
  if (req.query.category) filter.category = req.query.category;

  const competitions = await CompetitionEvent.find(filter).sort({ orderIndex: 1, name: 1 });
  res.json({ success: true, event: { title: event.title, slug: event.slug }, competitions });
});

// @route GET /api/events/:eventSlug/competitions/:slug (public) — full detail: rules, timing, points
exports.getCompetitionEvent = asyncHandler(async (req, res) => {
  const event = await Event.findOne({ organization: req.orgId, slug: req.params.eventSlug });
  if (!event) throw new ApiError(404, 'Event not found');

  const competition = await CompetitionEvent.findOne({ event: event._id, slug: req.params.slug });
  if (!competition) throw new ApiError(404, 'Competition event not found');

  res.json({ success: true, competition });
});

// @route POST /api/events/:eventSlug/competitions (organizer)
exports.createCompetitionEvent = asyncHandler(async (req, res) => {
  const event = await Event.findOne({ _id: req.params.eventId || req.body.event, organization: req.user.organization });
  if (!event) throw new ApiError(404, 'Parent event not found');

  const payload = { ...req.body, event: event._id, organization: req.user.organization };
  payload.slug = payload.slug || payload.name.toLowerCase().replace(/\s+/g, '-');

  const competition = await CompetitionEvent.create(payload);
  res.status(201).json({ success: true, competition });
});

// @route PATCH /api/competitions/:id
exports.updateCompetitionEvent = asyncHandler(async (req, res) => {
  const competition = await CompetitionEvent.findOneAndUpdate(
    { _id: req.params.id, organization: req.user.organization },
    req.body,
    { new: true, runValidators: true }
  );
  if (!competition) throw new ApiError(404, 'Competition event not found');
  res.json({ success: true, competition });
});

// @route DELETE /api/competitions/:id
exports.deleteCompetitionEvent = asyncHandler(async (req, res) => {
  const competition = await CompetitionEvent.findOneAndDelete({ _id: req.params.id, organization: req.user.organization });
  if (!competition) throw new ApiError(404, 'Competition event not found');
  res.json({ success: true, message: 'Competition event deleted' });
});
