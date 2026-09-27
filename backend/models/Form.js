const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    type: { type: String, enum: ['rating', 'choice', 'open_text', 'nps', 'academic_identifier'], required: true },
    options: [{ type: String }], // for 'choice'
    required: { type: Boolean, default: true },
    academicField: { type: String, enum: ['name', 'rollNumber', 'branch', 'section', 'block', null], default: null },
  },
  { _id: true }
);

const formSchema = new mongoose.Schema(
  {
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    questions: [questionSchema],
    shareSlug: { type: String, required: true, unique: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isPublic: { type: Boolean, default: true }, // no login required to respond
    isActive: { type: Boolean, default: true },
    aiGenerated: { type: Boolean, default: false },
    eventFeedback: { type: Boolean, default: false },
    requiresAcademicId: { type: Boolean, default: true },
  },
  { timestamps: true }
);

formSchema.index(
  { event: 1 },
  { unique: true, partialFilterExpression: { eventFeedback: true } }
);

module.exports = mongoose.model('Form', formSchema);
