const QRCode = require('qrcode');
const Form = require('../models/Form');
const Event = require('../models/Event');
const getPublicBaseUrl = require('./publicUrl');
const ensureEventFeedbackForm = require('./ensureEventFeedbackForm');

async function refreshTicketFeedbackLinks(tickets, req) {
  if (tickets.length === 0) return tickets;
  const eventIds = [...new Set(tickets.map((ticket) => {
    const event = ticket.event?._id || ticket.event;
    return event?.toString();
  }).filter(Boolean))];
  const forms = await Form.find({ event: { $in: eventIds }, eventFeedback: true, isActive: true })
    .select('event shareSlug')
    .sort('-createdAt');
  const formByEvent = new Map();
  forms.forEach((form) => {
    const eventId = form.event.toString();
    if (!formByEvent.has(eventId)) formByEvent.set(eventId, form);
  });

  const missingEventIds = eventIds.filter((eventId) => !formByEvent.has(eventId));
  if (missingEventIds.length) {
    const events = await Event.find({ _id: { $in: missingEventIds } });
    const newForms = await Promise.all(events.map((event) => ensureEventFeedbackForm(event, event.createdBy)));
    newForms.forEach((form) => formByEvent.set(form.event.toString(), form));
  }

  const baseUrl = getPublicBaseUrl(req);
  await Promise.all(tickets.map(async (ticket) => {
    const eventId = (ticket.event?._id || ticket.event)?.toString();
    const form = formByEvent.get(eventId);
    if (!form) return;

    const feedbackUrl = `${baseUrl}/feedback/${form.shareSlug}?ticket=${encodeURIComponent(ticket.code)}`;
    if (ticket.feedbackUrl === feedbackUrl && ticket.feedbackQrDataUrl) return;

    ticket.feedbackUrl = feedbackUrl;
    ticket.feedbackQrDataUrl = await QRCode.toDataURL(feedbackUrl, { margin: 1, width: 320 });
    await ticket.save();
  }));
  return tickets;
}

module.exports = refreshTicketFeedbackLinks;
