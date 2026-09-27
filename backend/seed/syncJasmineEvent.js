require('dotenv').config();
const connectDB = require('../config/db');
const Organization = require('../models/Organization');
const User = require('../models/User');
const Society = require('../models/Society');
const Form = require('../models/Form');
const Response = require('../models/Response');
const { v4: uuidv4 } = require('uuid');
const { upsertJasmineEvent } = require('./jasmineEvent');
const eventFeedbackQuestions = require('../utils/eventFeedbackQuestions');
const mongoose = require('mongoose');

async function run() {
  await connectDB();
  const organization = await Organization.findOne({ slug: 'pcte' });
  if (!organization) throw new Error('PCTE organization not found. Run the initial seed first.');

  const [society, owner] = await Promise.all([
    Society.findOne({ organization: organization._id, slug: 'koshish' }),
    User.findOne({ organization: organization._id, role: { $in: ['org_admin', 'super_admin'] } }),
  ]);
  if (!society || !owner) throw new Error('Koshish society or organization admin not found.');

  const event = await upsertJasmineEvent({ organization, owner, society });
  let form = await Form.findOne({ organization: organization._id, event: event._id, eventFeedback: true });
  const questions = eventFeedbackQuestions(event);
  if (!form) {
    form = await Form.create({
      organization: organization._id,
      event: event._id,
      title: `${event.title} — Event Feedback`,
      description: `Share your experience at ${event.title}. This form has ten event-specific questions and does not require an account.`,
      questions,
      shareSlug: uuidv4().slice(0, 12),
      createdBy: owner._id,
      isPublic: true,
      isActive: true,
      eventFeedback: true,
      requiresAcademicId: false,
    });
  } else if (await Response.countDocuments({ form: form._id }) === 0) {
    form.questions = questions;
    form.title = `${event.title} — Event Feedback`;
    form.description = `Share your experience at ${event.title}. This form has ten event-specific questions and does not require an account.`;
    await form.save();
  }
  console.log(`Jasmine Sandlas Festaweek event is ready: ${event.slug}`);
  console.log(`Its public feedback form is ready with ${form.questions.length} questions.`);
  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error('[seed:jasmine] Failed:', error.message);
  await mongoose.disconnect();
  process.exitCode = 1;
});
