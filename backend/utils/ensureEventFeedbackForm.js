const { v4: uuidv4 } = require('uuid');
const Form = require('../models/Form');
const eventFeedbackQuestions = require('./eventFeedbackQuestions');

async function ensureEventFeedbackForm(event, createdBy) {
  const filter = { organization: event.organization, event: event._id, eventFeedback: true };
  const existing = await Form.findOne(filter);
  if (existing) {
    if (!existing.isActive) {
      existing.isActive = true;
      await existing.save();
    }
    return existing;
  }

  try {
    return await Form.create({
      organization: event.organization,
      event: event._id,
      title: `${event.title} — Event Feedback`,
      description: `Share your experience at ${event.title}. This event-specific form does not require an account.`,
      questions: eventFeedbackQuestions(event),
      shareSlug: uuidv4().slice(0, 12),
      createdBy: createdBy || event.createdBy,
      isPublic: true,
      isActive: true,
      eventFeedback: true,
      requiresAcademicId: false,
    });
  } catch (err) {
    if (err.code !== 11000) throw err;
    const concurrentForm = await Form.findOne(filter);
    if (!concurrentForm) throw err;
    return concurrentForm;
  }
}

module.exports = ensureEventFeedbackForm;
