const Event = require('../models/Event');
const Response = require('../models/Response');
const Form = require('../models/Form');
const Ticket = require('../models/Ticket');
const asyncHandler = require('../middleware/asyncHandler');
const { ApiError } = require('../middleware/errorHandler');

/**
 * EventPulse AI — a thin wrapper around an external AI provider (configured via
 * AI_PROVIDER_API_KEY/AI_PROVIDER_BASE_URL, never exposed to the frontend).
 * Without a key configured, both endpoints fall back to deterministic,
 * stats-based answers so the feature is never a dead end.
 */
async function callAI(systemPrompt, userPrompt) {
  if (!process.env.AI_PROVIDER_API_KEY) return null;
  try {
    const resp = await fetch(`${process.env.AI_PROVIDER_BASE_URL || 'https://api.anthropic.com'}/v1/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.AI_PROVIDER_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 800,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });
    const data = await resp.json();
    return (data.content || []).map((c) => c.text || '').join('').trim() || null;
  } catch (err) {
    console.error('[EventPulse AI] provider call failed:', err.message);
    return null;
  }
}

async function eventSummary(eventId) {
  const event = await Event.findById(eventId);
  if (!event) return null;
  const forms = await Form.find({ event: eventId });
  const responses = await Response.find({ event: eventId });
  const checkIns = await Ticket.countDocuments({ event: eventId, status: 'checked_in' });

  const npsScores = responses.map((r) => r.npsScore).filter((n) => n != null);
  const avgNps = npsScores.length ? (npsScores.reduce((a, b) => a + b, 0) / npsScores.length).toFixed(1) : null;
  const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
  responses.forEach((r) => { if (r.sentiment) sentimentCounts[r.sentiment] += 1; });

  return {
    title: event.title,
    status: event.status,
    registrations: event.stats.registrations,
    checkIns,
    views: event.stats.views,
    formsCount: forms.length,
    responsesCount: responses.length,
    avgNps,
    sentimentCounts,
  };
}

// @route POST /api/ai/organizer-chat  — answers natural-language Qs, can compare any number of events
exports.organizerChat = asyncHandler(async (req, res) => {
  const { message, eventIds = [] } = req.body;
  if (!message) throw new ApiError(400, 'message is required');

  let events;
  if (eventIds.length) {
    events = await Promise.all(eventIds.map(eventSummary));
  } else {
    const orgEvents = await Event.find({ organization: req.user.organization }).limit(10);
    events = await Promise.all(orgEvents.map((e) => eventSummary(e._id)));
  }
  events = events.filter(Boolean);

  const context = events
    .map((e) => `- ${e.title}: ${e.registrations} registrations, ${e.checkIns} check-ins, ${e.responsesCount} feedback responses, avg NPS ${e.avgNps ?? 'n/a'}, sentiment +${e.sentimentCounts.positive}/-${e.sentimentCounts.negative}`)
    .join('\n');

  const aiReply = await callAI(
    'You are EventPulse AI, an assistant for event organizers at PCTE Group of Institutes. Answer concisely using only the data provided. Never mention Anthropic, Claude, OpenAI, or any AI company name — refer to yourself only as EventPulse AI.',
    `Event data:\n${context}\n\nOrganizer question: ${message}`
  );

  if (aiReply) return res.json({ success: true, reply: aiReply, source: 'ai' });

  // Deterministic fallback: a straightforward comparison/summary of the available stats
  const fallback = events.length
    ? `Here's what I have:\n${context}\n\n(Connect an AI provider key for richer natural-language answers — showing raw stats for now.)`
    : "I don't have any event data to work with yet.";
  res.json({ success: true, reply: fallback, source: 'fallback' });
});

// @route POST /api/ai/public-chat/:eventSlug — visitor Q&A scoped to ONE event, using live feedback data
exports.publicChat = asyncHandler(async (req, res) => {
  const { message } = req.body;
  if (!message) throw new ApiError(400, 'message is required');

  const event = await Event.findOne({ slug: req.params.eventSlug });
  if (!event) throw new ApiError(404, 'Event not found');

  const summary = await eventSummary(event._id);
  const context = `Event: ${summary.title}\nStatus: ${summary.status}\nRegistrations: ${summary.registrations}\nAverage NPS from attendees: ${summary.avgNps ?? 'not enough data yet'}\nFeedback sentiment: ${summary.sentimentCounts.positive} positive, ${summary.sentimentCounts.neutral} neutral, ${summary.sentimentCounts.negative} negative`;

  const aiReply = await callAI(
    `You are EventPulse AI, a public-facing assistant for the event "${summary.title}" only. Only answer using the data given; do not discuss other events. Never mention Anthropic, Claude, OpenAI, or any AI company name.`,
    `${context}\n\nVisitor question: ${message}`
  );

  if (aiReply) return res.json({ success: true, reply: aiReply, source: 'ai' });

  res.json({
    success: true,
    reply: `${summary.title} currently has ${summary.registrations} registrations${summary.avgNps ? ` and an average attendee rating (NPS) of ${summary.avgNps}` : ''}. Ask me about registration, timing or venue!`,
    source: 'fallback',
  });
});
