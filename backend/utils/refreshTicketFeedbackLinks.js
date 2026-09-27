const QRCode = require('qrcode');
const Form = require('../models/Form');
const getPublicBaseUrl = require('./publicUrl');

async function refreshTicketFeedbackLinks(tickets, req) {
  if (tickets.length === 0) return tickets;
  const eventIds = [...new Set(tickets.map((ticket) => {
    const event = ticket.event?._id || ticket.event;
    return event?.toString();
  }).filter(Boolean))];
  const forms = await Form.find({ event: { $in: eventIds }, isActive: true })
    .select('event shareSlug')
    .sort('-createdAt');
  const formByEvent = new Map();
  forms.forEach((form) => {
    const eventId = form.event.toString();
    if (!formByEvent.has(eventId)) formByEvent.set(eventId, form);
  });

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
