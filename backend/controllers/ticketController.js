const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const Ticket = require('../models/Ticket');
const Event = require('../models/Event');
const asyncHandler = require('../middleware/asyncHandler');
const { ApiError } = require('../middleware/errorHandler');
const { logAudit } = require('../utils/audit');
const { getIO } = require('../utils/socket');
const getPublicBaseUrl = require('../utils/publicUrl');
const refreshTicketFeedbackLinks = require('../utils/refreshTicketFeedbackLinks');
const ensureEventFeedbackForm = require('../utils/ensureEventFeedbackForm');

// @route POST /api/events/:eventId/register  (participant self-registers, gets a QR ticket)
exports.registerForEvent = asyncHandler(async (req, res) => {
  const event = await Event.findOne({ _id: req.params.eventId, organization: req.user.organization });
  if (!event) throw new ApiError(404, 'Event not found');

  const { ticketTypeName = 'General' } = req.body;
  const ticketType = event.ticketTypes.find((t) => t.name === ticketTypeName);
  if (event.ticketTypes.length && !ticketType) {
    throw new ApiError(400, `Unknown ticket type "${ticketTypeName}"`);
  }
  if (ticketType && ticketType.capacity !== null && ticketType.registered >= ticketType.capacity) {
    throw new ApiError(409, `"${ticketTypeName}" tickets are sold out.`);
  }

  const existing = await Ticket.findOne({ event: event._id, user: req.user._id, status: { $ne: 'cancelled' } });
  if (existing) throw new ApiError(409, 'You are already registered for this event.');

  const code = uuidv4();
  const qrDataUrl = await QRCode.toDataURL(code, { margin: 1, width: 320 });

  // If this event has an active feedback form, generate a second QR that goes
  // straight to it — this is what the participant scans (or taps) to give
  // feedback for this specific event.
  const activeForm = await ensureEventFeedbackForm(event, event.createdBy);
  let feedbackUrl = null;
  let feedbackQrDataUrl = null;
  if (activeForm) {
    feedbackUrl = `${getPublicBaseUrl(req)}/feedback/${activeForm.shareSlug}?ticket=${encodeURIComponent(code)}`;
    feedbackQrDataUrl = await QRCode.toDataURL(feedbackUrl, { margin: 1, width: 320 });
  }

  const ticket = await Ticket.create({
    organization: req.user.organization,
    event: event._id,
    user: req.user._id,
    ticketTypeName,
    code,
    qrDataUrl,
    feedbackUrl,
    feedbackQrDataUrl,
    metadata: {
      rollNumber: req.user.rollNumber,
      branch: req.user.branch,
      section: req.user.section,
      block: req.user.block,
    },
  });

  if (ticketType) ticketType.registered += 1;
  event.stats.registrations += 1;
  await event.save();

  await logAudit({ organization: req.user.organization, actor: req.user._id, action: 'ticket.register', entityType: 'Ticket', entityId: ticket._id });

  // Push a live update to the organizer dashboard — no page refresh needed
  getIO()?.to(`event:${event._id}`).emit('registration:new', {
    eventId: event._id,
    ticketId: ticket._id,
    userName: req.user.name,
    ticketTypeName,
    totalRegistrations: event.stats.registrations,
    at: new Date(),
  });

  res.status(201).json({ success: true, ticket });
});

// @route GET /api/tickets/mine
exports.myTickets = asyncHandler(async (req, res) => {
  const tickets = await Ticket.find({ user: req.user._id }).populate('event', 'title slug startDate venue coverImageUrl').sort('-createdAt');
  await refreshTicketFeedbackLinks(tickets, req);
  res.json({ success: true, tickets });
});

// @route POST /api/tickets/checkin  { code, gate }
// Idempotent: scanning the same code twice (even from different scanners at once)
// never double-counts a check-in — safe under concurrent gate scanners.
exports.checkIn = asyncHandler(async (req, res) => {
  const { code, gate } = req.body;
  if (!code) throw new ApiError(400, 'QR code value is required');

  const ticket = await Ticket.findOneAndUpdate(
    { code, status: 'valid' }, // only matches if still un-checked-in => atomic guard against double scan
    { status: 'checked_in', checkedInAt: new Date(), checkedInBy: req.user._id, checkInGate: gate || null },
    { new: true }
  ).populate('user', 'name email rollNumber').populate('event', 'title');

  if (!ticket) {
    // Either code doesn't exist, or it was already checked in — report which, without erroring the gate flow
    const already = await Ticket.findOne({ code }).populate('user', 'name email');
    if (already && already.status === 'checked_in') {
      return res.status(200).json({
        success: true,
        alreadyCheckedIn: true,
        message: `${already.user?.name || 'This attendee'} was already checked in at ${already.checkedInAt.toLocaleTimeString()}.`,
        ticket: already,
      });
    }
    throw new ApiError(404, 'Ticket not found or has been cancelled.');
  }

  await Event.findByIdAndUpdate(ticket.event._id, { $inc: { 'stats.checkIns': 1 } });
  await logAudit({ organization: req.user.organization, actor: req.user._id, action: 'ticket.checkin', entityType: 'Ticket', entityId: ticket._id, metadata: { gate } });

  getIO()?.to(`event:${ticket.event._id}`).emit('checkin:new', {
    eventId: ticket.event._id,
    userName: ticket.user.name,
    gate,
    at: new Date(),
  });

  res.json({ success: true, alreadyCheckedIn: false, ticket });
});

// @route GET /api/events/:eventId/poster-qr — "scan to register" QR for posters
exports.getRegisterPosterQR = asyncHandler(async (req, res) => {
  const event = await Event.findOne({ _id: req.params.eventId, organization: req.user.organization });
  if (!event) throw new ApiError(404, 'Event not found');

  const registerUrl = `${getPublicBaseUrl(req)}/events/${event.slug}?action=register`;
  const qrDataUrl = await QRCode.toDataURL(registerUrl, { margin: 1, width: 480 });
  res.json({ success: true, url: registerUrl, qrDataUrl });
});
