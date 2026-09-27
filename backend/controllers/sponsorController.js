const Sponsor = require('../models/Sponsor');
const Event = require('../models/Event');
const asyncHandler = require('../middleware/asyncHandler');
const { ApiError } = require('../middleware/errorHandler');

// @route GET /api/sponsors/my-analytics — scoped, read-only analytics for a sponsor_viewer
// Only shows aggregate stats for events the sponsor is linked to; never raw attendee lists.
exports.mySponsorAnalytics = asyncHandler(async (req, res) => {
  const sponsorships = await Sponsor.find({ contactUser: req.user._id }).populate('event', 'title slug startDate stats');
  if (!sponsorships.length) throw new ApiError(404, 'No sponsorships linked to your account yet.');

  const analytics = sponsorships.map((s) => ({
    sponsorName: s.name,
    tier: s.tier,
    event: { title: s.event.title, slug: s.event.slug, startDate: s.event.startDate },
    registrations: s.event.stats.registrations,
    checkIns: s.event.stats.checkIns,
    views: s.event.stats.views,
  }));

  res.json({ success: true, analytics });
});

// @route POST /api/events/:eventId/sponsors (organizer links a sponsor + optional viewer account)
exports.addSponsor = asyncHandler(async (req, res) => {
  const event = await Event.findOne({ _id: req.params.eventId, organization: req.user.organization });
  if (!event) throw new ApiError(404, 'Event not found');

  const { name, tier, logoUrl, contactUserId } = req.body;
  const sponsor = await Sponsor.create({ organization: req.user.organization, event: event._id, name, tier, logoUrl, contactUser: contactUserId || null });
  res.status(201).json({ success: true, sponsor });
});
