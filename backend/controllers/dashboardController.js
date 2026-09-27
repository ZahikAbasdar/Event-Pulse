const Event = require('../models/Event');
const Ticket = require('../models/Ticket');
const Notification = require('../models/Notification');
const Response = require('../models/Response');
const Form = require('../models/Form');
const asyncHandler = require('../middleware/asyncHandler');

function scopeEventFilter(user) {
  const orgFilter = { organization: user.organization };
  return ['super_admin', 'org_admin'].includes(user.role) ? orgFilter : { ...orgFilter, managers: user._id };
}

// @route GET /api/dashboard/organizer
exports.organizerDashboard = asyncHandler(async (req, res) => {
  const orgFilter = { organization: req.user.organization };
  const eventFilter = ['super_admin', 'org_admin'].includes(req.user.role)
    ? orgFilter
    : { ...orgFilter, managers: req.user._id };

  const events = await Event.find(eventFilter).populate('society', 'name slug').sort('-createdAt').limit(50);

  const totals = events.reduce(
    (acc, e) => {
      acc.registrations += e.stats.registrations || 0;
      acc.checkIns += e.stats.checkIns || 0;
      acc.views += e.stats.views || 0;
      return acc;
    },
    { registrations: 0, checkIns: 0, views: 0 }
  );

  const liveEvents = events.filter((e) => e.status === 'ongoing').length;
  const upcomingEvents = events.filter((e) => e.status === 'published' && new Date(e.startDate) > new Date()).length;

  const recentTickets = await Ticket.find({ event: { $in: events.map((e) => e._id) } })
    .populate('user', 'name email')
    .populate('event', 'title')
    .sort('-createdAt')
    .limit(10);

  res.json({
    success: true,
    stats: {
      totalEvents: events.length,
      liveEvents,
      upcomingEvents,
      ...totals,
    },
    events,
    recentActivity: recentTickets,
  });
});

// @route GET /api/dashboard/participant
exports.participantDashboard = asyncHandler(async (req, res) => {
  const tickets = await Ticket.find({ user: req.user._id }).populate('event', 'title slug startDate venue coverImageUrl status').sort('-createdAt');
  const notifications = await Notification.find({ recipient: req.user._id }).sort('-createdAt').limit(10);

  res.json({
    success: true,
    tickets,
    notifications,
    stats: {
      totalRegistered: tickets.length,
      checkedIn: tickets.filter((t) => t.status === 'checked_in').length,
      upcoming: tickets.filter((t) => t.event && new Date(t.event.startDate) > new Date()).length,
    },
  });
});

// @route GET /api/dashboard/organizer/charts
// Four event-feedback datasets for live organizer analytics.
exports.organizerCharts = asyncHandler(async (req, res) => {
  const eventFilter = scopeEventFilter(req.user);
  const myEvents = await Event.find(eventFilter).select('_id title stats');
  const eventIds = myEvents.map((e) => e._id);
  const eventFeedbackForms = await Form.find({ event: { $in: eventIds }, eventFeedback: true })
    .select('event questions');
  const formIds = eventFeedbackForms.map((form) => form._id);
  const ratingQuestionIds = eventFeedbackForms.flatMap((form) =>
    form.questions.filter((question) => question.type === 'rating').map((question) => question._id)
  );

  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
  fourteenDaysAgo.setHours(0, 0, 0, 0);

  const [responsesByDayRaw, responsesByEventRaw, ratingBreakdownRaw, voiceBreakdownRaw] = formIds.length
    ? await Promise.all([
      Response.aggregate([
        { $match: { form: { $in: formIds }, submittedAt: { $gte: fourteenDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$submittedAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Response.aggregate([
        { $match: { form: { $in: formIds } } },
        { $group: { _id: '$event', count: { $sum: 1 } } },
      ]),
      ratingQuestionIds.length
        ? Response.aggregate([
          { $match: { form: { $in: formIds } } },
          { $unwind: '$answers' },
          { $match: { 'answers.question': { $in: ratingQuestionIds } } },
          { $addFields: { rating: { $convert: { input: '$answers.value', to: 'int', onError: null, onNull: null } } } },
          { $match: { rating: { $gte: 1, $lte: 5 } } },
          { $group: { _id: '$rating', count: { $sum: 1 } } },
        ])
        : Promise.resolve([]),
      Response.aggregate([
        { $match: { form: { $in: formIds } } },
        { $group: { _id: { $cond: [{ $ifNull: ['$voiceFeedback.fileName', false] }, 'recorded', 'not_recorded'] }, count: { $sum: 1 } } },
      ]),
    ])
    : [[], [], [], []];

  const responsesByDay = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(fourteenDaysAgo);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const match = responsesByDayRaw.find((r) => r._id === key);
    responsesByDay.push({ date: key.slice(5), count: match ? match.count : 0 });
  }

  const responseCountByEvent = new Map(responsesByEventRaw.map((item) => [item._id.toString(), item.count]));
  const feedbackByEvent = myEvents.map((event) => ({
    eventId: event._id.toString(),
    title: event.title,
    count: responseCountByEvent.get(event._id.toString()) || 0,
  })).sort((a, b) => b.count - a.count);

  const ratingBreakdown = [1, 2, 3, 4, 5].map((rating) => ({
    rating: `${rating} star${rating === 1 ? '' : 's'}`,
    count: ratingBreakdownRaw.find((item) => item._id === rating)?.count || 0,
  }));
  const voiceBreakdown = { recorded: 0, not_recorded: 0 };
  voiceBreakdownRaw.forEach((item) => { voiceBreakdown[item._id] = item.count; });
  const totalFeedbackResponses = responsesByEventRaw.reduce((sum, item) => sum + item.count, 0);

  res.json({ success: true, responsesByDay, feedbackByEvent, ratingBreakdown, voiceBreakdown, totalFeedbackResponses });
});
