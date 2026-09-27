/**
 * Creates the real Koshish 2026 feedback form structure (the actual form
 * every participant will be routed to after registering/checking in).
 * No fake responses, no fake teams, no fake scores, no fake sponsors —
 * those only get created when real people actually use the app.
 */
const { v4: uuidv4 } = require('uuid');
const Form = require('../models/Form');

async function seedExtras({ org, owner, koshish }) {
  const form = await Form.create({
    organization: org._id,
    event: koshish._id,
    title: 'Koshish 2026 — Feedback',
    description: 'Tell us about your experience at Koshish 2026',
    questions: [
      { text: 'Name', type: 'academic_identifier', academicField: 'name', required: true },
      { text: 'Roll Number', type: 'academic_identifier', academicField: 'rollNumber', required: true },
      { text: 'Branch', type: 'academic_identifier', academicField: 'branch', required: true },
      { text: 'Section', type: 'academic_identifier', academicField: 'section', required: true },
      { text: 'Block (ET/MT/T Pharmacy/HM)', type: 'academic_identifier', academicField: 'block', required: true },
      { text: 'How would you rate the overall event experience?', type: 'rating', required: true },
      { text: 'How would you rate the event organization and logistics?', type: 'rating', required: true },
      { text: 'Which competition event did you enjoy the most?', type: 'open_text', required: false },
      { text: 'What could be improved for next time?', type: 'open_text', required: false },
      { text: 'On a scale of 0-10, how likely are you to recommend Koshish to a friend?', type: 'nps', required: true },
    ],
    shareSlug: uuidv4().slice(0, 8),
    createdBy: owner._id,
    aiGenerated: false,
  });
  console.log(`[seed] Real Koshish 2026 feedback form created — share link slug: ${form.shareSlug}`);
  return { form };
}

module.exports = seedExtras;
