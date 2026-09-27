const Event = require('../models/Event');
const Society = require('../models/Society');
const asyncHandler = require('../middleware/asyncHandler');
const { ApiError } = require('../middleware/errorHandler');
const { logAudit } = require('../utils/audit');

// @route GET /api/events (public) — search, filter, paginate
exports.listEvents = asyncHandler(async (req, res) => {
  const { q, society, status, page = 1, limit = 12, sort = '-startDate' } = req.query;
  const filter = { organization: req.orgId, isPublic: true };

  if (status) filter.status = status;
  else filter.status = { $in: ['published', 'ongoing', 'completed'] }; // hide drafts from the public

  if (society) {
    const soc = await Society.findOne({ organization: req.orgId, slug: society });
    if (soc) filter.society = soc._id;
  }
  if (q) filter.$text = { $search: q };

  const skip = (Number(page) - 1) * Number(limit);
  const [events, total] = await Promise.all([
    Event.find(filter).populate('society', 'name slug colorTheme').sort(sort).skip(skip).limit(Number(limit)),
    Event.countDocuments(filter),
  ]);

  res.json({
    success: true,
    events,
    pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
  });
});

// @route GET /api/events/:slug (public)
exports.getEvent = asyncHandler(async (req, res) => {
  const event = await Event.findOneAndUpdate(
    { organization: req.orgId, slug: req.params.slug },
    { $inc: { 'stats.views': 1 } },
    { new: true }
  ).populate('society', 'name slug colorTheme logoUrl');
  if (!event) throw new ApiError(404, 'Event not found');
  res.json({ success: true, event });
});

// @route POST /api/events (event_manager, org_admin, super_admin)
exports.createEvent = asyncHandler(async (req, res) => {
  const { title, slug, description, society, venue, startDate, endDate, tags, ticketTypes, coverImageUrl, status, socialLinks } = req.body;
  if (!title || !startDate || !endDate) throw new ApiError(400, 'title, startDate and endDate are required');

  const event = await Event.create({
    organization: req.user.organization,
    society: society || null,
    title,
    slug: slug || title.toLowerCase().replace(/\s+/g, '-'),
    description,
    venue,
    startDate,
    endDate,
    tags,
    ticketTypes,
    coverImageUrl,
    socialLinks,
    status: status || 'draft',
    createdBy: req.user._id,
    managers: [req.user._id],
  });

  await logAudit({ organization: req.user.organization, actor: req.user._id, action: 'event.create', entityType: 'Event', entityId: event._id });
  res.status(201).json({ success: true, event });
});

// @route PATCH /api/events/:id
exports.updateEvent = asyncHandler(async (req, res) => {
  const event = await Event.findOneAndUpdate(
    { _id: req.params.id, organization: req.user.organization },
    req.body,
    { new: true, runValidators: true }
  );
  if (!event) throw new ApiError(404, 'Event not found');
  await logAudit({ organization: req.user.organization, actor: req.user._id, action: 'event.update', entityType: 'Event', entityId: event._id });
  res.json({ success: true, event });
});

// @route DELETE /api/events/:id
exports.deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findOneAndDelete({ _id: req.params.id, organization: req.user.organization });
  if (!event) throw new ApiError(404, 'Event not found');
  await logAudit({ organization: req.user.organization, actor: req.user._id, action: 'event.delete', entityType: 'Event', entityId: event._id });
  res.json({ success: true, message: 'Event deleted' });
});

// @route GET /api/events/manage/mine (organizer dashboard list)
exports.myManagedEvents = asyncHandler(async (req, res) => {
  const filter = { organization: req.user.organization };
  if (!['super_admin', 'org_admin'].includes(req.user.role)) {
    filter.managers = req.user._id;
  }
  const events = await Event.find(filter).populate('society', 'name slug').sort('-createdAt');
  res.json({ success: true, events });
});
